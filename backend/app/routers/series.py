from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.series import Series
from app.models.location import Location
from app.models.tag import Tag
from app.models.user import User
from app.schemas.series import SeriesCreate, SeriesUpdate, SeriesResponse
from app.utils.dependencies import get_current_user, get_current_admin, get_current_contributor

router = APIRouter(prefix="/api/series", tags=["Series"])


def get_descendant_location_ids(db: Session, location_id: int) -> List[int]:
    ids = [location_id]
    children = db.query(Location).filter(Location.parent_id == location_id).all()
    for child in children:
        ids.extend(get_descendant_location_ids(db, child.id))
    return ids


def apply_tags(db: Session, series: Series, tag_names: List[str]):
    series.tags = []
    for name in tag_names:
        name = name.strip()
        if not name:
            continue
        tag = db.query(Tag).filter(Tag.name == name).first()
        if not tag:
            slug = name.lower().replace(" ", "-")
            tag = Tag(name=name, slug=slug)
            db.add(tag)
            db.flush()
        series.tags.append(tag)


@router.get("", response_model=List[SeriesResponse])
def get_all_series(
    q: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    location_id: Optional[int] = Query(None),
    creator_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Series)

    if q:
        query = query.filter(
            Series.name.ilike(f"%{q}%") | Series.description.ilike(f"%{q}%")
        )
    if tag:
        query = query.join(Series.tags).filter(Tag.name.ilike(f"%{tag}%"))
    if location_id:
        ids = get_descendant_location_ids(db, location_id)
        query = query.filter(Series.location_id.in_(ids))
    if creator_id:
        query = query.filter(Series.creator_id == creator_id)

    return query.order_by(Series.name).all()


@router.get("/{series_id}", response_model=SeriesResponse)
def get_series(series_id: int, db: Session = Depends(get_db)):
    series = db.query(Series).filter(Series.id == series_id).first()
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")
    return series


@router.post("", response_model=SeriesResponse, status_code=status.HTTP_201_CREATED)
def create_series(
    series_data: SeriesCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_contributor),
):
    tags = series_data.tags
    data = series_data.model_dump(exclude={"tags"})
    new_series = Series(**data, creator_id=current_user.id)
    db.add(new_series)
    db.flush()
    apply_tags(db, new_series, tags)
    db.commit()
    db.refresh(new_series)
    return new_series


@router.put("/{series_id}", response_model=SeriesResponse)
def update_series(
    series_id: int,
    series_data: SeriesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_contributor),
):
    series = db.query(Series).filter(Series.id == series_id).first()
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")
    if not current_user.is_admin and series.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own series")

    update_data = series_data.model_dump(exclude_unset=True)
    tags = update_data.pop("tags", None)

    for key, value in update_data.items():
        setattr(series, key, value)

    if tags is not None:
        apply_tags(db, series, tags)

    db.commit()
    db.refresh(series)
    return series


@router.delete("/{series_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_series(
    series_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_contributor),
):
    series = db.query(Series).filter(Series.id == series_id).first()
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")
    if not current_user.is_admin and series.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own series")
    db.delete(series)
    db.commit()
    return None
