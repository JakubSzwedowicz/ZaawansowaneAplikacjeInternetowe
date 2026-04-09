from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.models.series import Series
from app.models.measurement import Measurement
from app.schemas.user import UserResponse, UserUpdate, UserListItem
from app.schemas.series import SeriesResponse
from app.schemas.measurement import MeasurementResponse
from app.utils.dependencies import get_current_user, get_current_admin
from app.utils.security import get_password_hash, verify_password

router = APIRouter(prefix="/api/users", tags=["Users"])


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user_update.email:
        existing = db.query(User).filter(User.email == user_update.email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = user_update.email

    if user_update.password:
        current_user.password_hash = get_password_hash(user_update.password)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.patch("/me/password", response_model=UserResponse)
def change_password(
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")
    if len(password_data.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    current_user.password_hash = get_password_hash(password_data.new_password)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("", response_model=List[UserListItem])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.patch("/{user_id}/block", response_model=UserListItem)
def block_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_admin:
        raise HTTPException(status_code=400, detail="Cannot block an admin")
    user.is_blocked = True
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}/unblock", response_model=UserListItem)
def unblock_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_blocked = False
    db.commit()
    db.refresh(user)
    return user


@router.get("/me/new-content")
def get_new_content(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    from datetime import datetime, timedelta

    since = current_user.previous_login_at
    if since is None:
        since = datetime.utcnow() - timedelta(hours=24)

    new_series = db.query(Series).filter(Series.created_at > since).order_by(Series.created_at.desc()).all()
    new_measurements = (
        db.query(Measurement).filter(Measurement.created_at > since).order_by(Measurement.created_at.desc()).limit(100).all()
    )

    creator_ids = {s.creator_id for s in new_series if s.creator_id}
    creators = {u.id: u for u in db.query(User).filter(User.id.in_(creator_ids)).all()} if creator_ids else {}

    return {
        "since": since,
        "series_count": len(new_series),
        "measurements_count": len(new_measurements),
        "series": [
            {
                "id": s.id,
                "name": s.name,
                "unit": s.unit,
                "color": s.color,
                "created_at": s.created_at,
                "creator": {
                    "id": creators[s.creator_id].id,
                    "username": creators[s.creator_id].username,
                    "is_blocked": creators[s.creator_id].is_blocked,
                } if s.creator_id and s.creator_id in creators else None,
            }
            for s in new_series
        ],
        "measurements": [
            {"id": m.id, "series_id": m.series_id, "value": m.value, "timestamp": m.timestamp, "created_at": m.created_at}
            for m in new_measurements
        ],
    }
