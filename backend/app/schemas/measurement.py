from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class MeasurementBase(BaseModel):
    series_id: int
    value: float
    timestamp: datetime
    note: Optional[str] = None
    quality: Optional[str] = None


class MeasurementCreate(MeasurementBase):
    pass


class MeasurementUpdate(BaseModel):
    value: Optional[float] = None
    timestamp: Optional[datetime] = None
    note: Optional[str] = None
    quality: Optional[str] = None


class MeasurementResponse(MeasurementBase):
    id: int
    sensor_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True
