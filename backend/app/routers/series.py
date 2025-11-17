from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.series import Series
from app.models.user import User
from app.schemas.series import SeriesCreate, SeriesUpdate, SeriesResponse
from app.utils.dependencies import get_current_user, get_current_admin

router = APIRouter(prefix="/api/series", tags=["Series"])


@router.get("", response_model=List[SeriesResponse])
def get_all_series(db: Session = Depends(get_db)):
    """Get all series (public endpoint)"""
    series = db.query(Series).all()
    return series


@router.get("/{series_id}", response_model=SeriesResponse)
def get_series(series_id: int, db: Session = Depends(get_db)):
    """Get a specific series by ID (public endpoint)"""
    series = db.query(Series).filter(Series.id == series_id).first()
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")
    return series


@router.post("", response_model=SeriesResponse, status_code=status.HTTP_201_CREATED)
def create_series(
    series_data: SeriesCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Create a new series (admin only)"""
    new_series = Series(**series_data.model_dump())
    db.add(new_series)
    db.commit()
    db.refresh(new_series)
    return new_series


@router.put("/{series_id}", response_model=SeriesResponse)
def update_series(
    series_id: int,
    series_data: SeriesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Update a series (admin only)"""
    series = db.query(Series).filter(Series.id == series_id).first()
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")

    update_data = series_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(series, key, value)

    db.commit()
    db.refresh(series)
    return series


@router.delete("/{series_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_series(
    series_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Delete a series (admin only)"""
    series = db.query(Series).filter(Series.id == series_id).first()
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")

    db.delete(series)
    db.commit()
    return None
