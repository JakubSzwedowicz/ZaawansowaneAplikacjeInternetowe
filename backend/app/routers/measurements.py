from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.measurement import Measurement
from app.models.series import Series
from app.models.user import User
from app.schemas.measurement import MeasurementCreate, MeasurementUpdate, MeasurementResponse
from app.utils.dependencies import get_current_user, get_current_admin

router = APIRouter(prefix="/api/measurements", tags=["Measurements"])


@router.get("", response_model=List[MeasurementResponse])
def get_measurements(
    series_ids: Optional[str] = Query(None, description="Comma-separated series IDs"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    limit: int = Query(1000, le=10000),
    db: Session = Depends(get_db)
):
    """Get measurements with optional filters (public endpoint)"""
    query = db.query(Measurement)

    # Filter by series IDs
    if series_ids:
        series_id_list = [int(sid) for sid in series_ids.split(',')]
        query = query.filter(Measurement.series_id.in_(series_id_list))

    # Filter by date range
    if start_date:
        query = query.filter(Measurement.timestamp >= start_date)
    if end_date:
        query = query.filter(Measurement.timestamp <= end_date)

    # Order by timestamp and limit
    measurements = query.order_by(Measurement.timestamp.asc()).limit(limit).all()
    return measurements


@router.get("/{measurement_id}", response_model=MeasurementResponse)
def get_measurement(measurement_id: int, db: Session = Depends(get_db)):
    """Get a specific measurement by ID (public endpoint)"""
    measurement = db.query(Measurement).filter(Measurement.id == measurement_id).first()
    if not measurement:
        raise HTTPException(status_code=404, detail="Measurement not found")
    return measurement


@router.post("", response_model=MeasurementResponse, status_code=status.HTTP_201_CREATED)
def create_measurement(
    measurement_data: MeasurementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Create a new measurement (admin only)"""
    # Check if series exists
    series = db.query(Series).filter(Series.id == measurement_data.series_id).first()
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")

    # Validate value is within series min/max range
    if measurement_data.value < series.min_value or measurement_data.value > series.max_value:
        raise HTTPException(
            status_code=400,
            detail=f"Value {measurement_data.value} is outside the acceptable range [{series.min_value}, {series.max_value}] for series '{series.name}'"
        )

    new_measurement = Measurement(**measurement_data.model_dump())
    db.add(new_measurement)
    db.commit()
    db.refresh(new_measurement)
    return new_measurement


@router.put("/{measurement_id}", response_model=MeasurementResponse)
def update_measurement(
    measurement_id: int,
    measurement_data: MeasurementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Update a measurement (admin only)"""
    measurement = db.query(Measurement).filter(Measurement.id == measurement_id).first()
    if not measurement:
        raise HTTPException(status_code=404, detail="Measurement not found")

    # If updating value, validate against series range
    if measurement_data.value is not None:
        series = db.query(Series).filter(Series.id == measurement.series_id).first()
        if measurement_data.value < series.min_value or measurement_data.value > series.max_value:
            raise HTTPException(
                status_code=400,
                detail=f"Value {measurement_data.value} is outside the acceptable range [{series.min_value}, {series.max_value}]"
            )

    update_data = measurement_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(measurement, key, value)

    db.commit()
    db.refresh(measurement)
    return measurement


@router.delete("/{measurement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_measurement(
    measurement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Delete a measurement (admin only)"""
    measurement = db.query(Measurement).filter(Measurement.id == measurement_id).first()
    if not measurement:
        raise HTTPException(status_code=404, detail="Measurement not found")

    db.delete(measurement)
    db.commit()
    return None
