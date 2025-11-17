from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import secrets
from app.database import get_db
from app.models.sensor import Sensor
from app.models.series import Series
from app.models.measurement import Measurement
from app.models.user import User
from app.schemas.sensor import SensorCreate, SensorUpdate, SensorResponse, SensorWithKey
from app.schemas.measurement import MeasurementCreate, MeasurementResponse
from app.utils.dependencies import get_current_admin

router = APIRouter(prefix="/api/sensors", tags=["Sensors"])


@router.get("", response_model=List[SensorResponse])
def get_all_sensors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Get all sensors (admin only)"""
    sensors = db.query(Sensor).all()
    return sensors


@router.get("/{sensor_id}", response_model=SensorResponse)
def get_sensor(
    sensor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Get a specific sensor (admin only)"""
    sensor = db.query(Sensor).filter(Sensor.id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")
    return sensor


@router.post("", response_model=SensorWithKey, status_code=status.HTTP_201_CREATED)
def create_sensor(
    sensor_data: SensorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Create a new sensor and return API key (admin only)"""
    # Check if series exists
    series = db.query(Series).filter(Series.id == sensor_data.series_id).first()
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")

    # Generate API key
    api_key = f"sensor_{secrets.token_urlsafe(32)}"

    new_sensor = Sensor(
        name=sensor_data.name,
        series_id=sensor_data.series_id,
        api_key=api_key,
        is_active=True
    )
    db.add(new_sensor)
    db.commit()
    db.refresh(new_sensor)

    # Return sensor with API key (only shown once!)
    return SensorWithKey(
        id=new_sensor.id,
        name=new_sensor.name,
        series_id=new_sensor.series_id,
        is_active=new_sensor.is_active,
        last_seen=new_sensor.last_seen,
        created_at=new_sensor.created_at,
        api_key=api_key
    )


@router.patch("/{sensor_id}", response_model=SensorResponse)
def update_sensor(
    sensor_id: int,
    sensor_data: SensorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Update sensor (admin only)"""
    sensor = db.query(Sensor).filter(Sensor.id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")

    update_data = sensor_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(sensor, key, value)

    db.commit()
    db.refresh(sensor)
    return sensor


@router.delete("/{sensor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sensor(
    sensor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Delete a sensor (admin only)"""
    sensor = db.query(Sensor).filter(Sensor.id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")

    db.delete(sensor)
    db.commit()
    return None


# Sensor data submission endpoint (authenticated via API key)
@router.post("/{sensor_id}/measurements", response_model=MeasurementResponse, status_code=status.HTTP_201_CREATED)
def submit_sensor_data(
    sensor_id: int,
    measurement_data: MeasurementCreate,
    x_api_key: str = Header(..., alias="X-API-Key"),
    db: Session = Depends(get_db)
):
    """Submit measurement data from a sensor (authenticated via API key)"""
    # Verify sensor exists and API key matches
    sensor = db.query(Sensor).filter(
        Sensor.id == sensor_id,
        Sensor.api_key == x_api_key
    ).first()

    if not sensor:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid sensor ID or API key"
        )

    # Check if sensor is active
    if not sensor.is_active:
        raise HTTPException(status_code=403, detail="Sensor is disabled")

    # Verify series_id matches sensor's series
    if measurement_data.series_id != sensor.series_id:
        raise HTTPException(
            status_code=400,
            detail=f"Sensor is registered for series {sensor.series_id}, cannot submit to series {measurement_data.series_id}"
        )

    # Get series and validate value range
    series = db.query(Series).filter(Series.id == sensor.series_id).first()
    if measurement_data.value < series.min_value or measurement_data.value > series.max_value:
        raise HTTPException(
            status_code=400,
            detail=f"Value {measurement_data.value} is outside the acceptable range [{series.min_value}, {series.max_value}]"
        )

    # Create measurement with sensor_id
    new_measurement = Measurement(
        series_id=measurement_data.series_id,
        sensor_id=sensor_id,
        value=measurement_data.value,
        timestamp=measurement_data.timestamp
    )
    db.add(new_measurement)

    # Update sensor's last_seen timestamp
    sensor.last_seen = datetime.utcnow()

    db.commit()
    db.refresh(new_measurement)
    return new_measurement
