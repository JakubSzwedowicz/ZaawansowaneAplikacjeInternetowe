from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.measurement import Measurement
from app.models.series import Series
from app.models.user import User
from app.schemas.measurement import MeasurementCreate, MeasurementUpdate, MeasurementResponse
from app.utils.dependencies import get_current_user, get_current_admin, get_current_contributor

router = APIRouter(prefix="/api/measurements", tags=["Measurements"])

VALID_QUALITY = {"good", "uncertain", "bad"}


@router.get("", response_model=List[MeasurementResponse])
def get_measurements(
    series_ids: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    q: Optional[str] = Query(None),
    quality: Optional[str] = Query(None),
    limit: int = Query(1000, le=10000),
    db: Session = Depends(get_db),
):
    query = db.query(Measurement)

    if series_ids:
        id_list = [int(sid) for sid in series_ids.split(",")]
        query = query.filter(Measurement.series_id.in_(id_list))
    if start_date:
        query = query.filter(Measurement.timestamp >= start_date)
    if end_date:
        query = query.filter(Measurement.timestamp <= end_date)
    if q:
        query = query.filter(Measurement.note.ilike(f"%{q}%"))
    if quality and quality in VALID_QUALITY:
        query = query.filter(Measurement.quality == quality)

    return query.order_by(Measurement.timestamp.asc()).limit(limit).all()


@router.get("/{measurement_id}", response_model=MeasurementResponse)
def get_measurement(measurement_id: int, db: Session = Depends(get_db)):
    m = db.query(Measurement).filter(Measurement.id == measurement_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Measurement not found")
    return m


@router.post("", response_model=MeasurementResponse, status_code=status.HTTP_201_CREATED)
def create_measurement(
    data: MeasurementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_contributor),
):
    series = db.query(Series).filter(Series.id == data.series_id).first()
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")
    if not current_user.is_admin and series.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only add measurements to your own series")
    if data.value < series.min_value or data.value > series.max_value:
        raise HTTPException(
            status_code=400,
            detail=f"Value {data.value} is outside the acceptable range [{series.min_value}, {series.max_value}] for series '{series.name}'",
        )
    if data.quality and data.quality not in VALID_QUALITY:
        raise HTTPException(status_code=400, detail=f"Quality must be one of: {', '.join(VALID_QUALITY)}")

    measurement = Measurement(**data.model_dump())
    db.add(measurement)
    db.commit()
    db.refresh(measurement)
    return measurement


@router.put("/{measurement_id}", response_model=MeasurementResponse)
def update_measurement(
    measurement_id: int,
    data: MeasurementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_contributor),
):
    m = db.query(Measurement).filter(Measurement.id == measurement_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Measurement not found")

    series = db.query(Series).filter(Series.id == m.series_id).first()
    if not current_user.is_admin and series.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit measurements in your own series")

    if data.value is not None:
        if data.value < series.min_value or data.value > series.max_value:
            raise HTTPException(
                status_code=400,
                detail=f"Value {data.value} is outside the acceptable range [{series.min_value}, {series.max_value}]",
            )
    if data.quality and data.quality not in VALID_QUALITY:
        raise HTTPException(status_code=400, detail=f"Quality must be one of: {', '.join(VALID_QUALITY)}")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(m, key, value)
    db.commit()
    db.refresh(m)
    return m


@router.delete("/{measurement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_measurement(
    measurement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_contributor),
):
    m = db.query(Measurement).filter(Measurement.id == measurement_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Measurement not found")

    series = db.query(Series).filter(Series.id == m.series_id).first()
    if not current_user.is_admin and series.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete measurements in your own series")

    db.delete(m)
    db.commit()
    return None
