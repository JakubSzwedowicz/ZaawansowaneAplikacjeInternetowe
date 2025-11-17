from pydantic import BaseModel
from datetime import datetime


class MeasurementBase(BaseModel):
    series_id: int
    value: float
    timestamp: datetime


class MeasurementCreate(MeasurementBase):
    pass


class MeasurementUpdate(BaseModel):
    value: float | None = None
    timestamp: datetime | None = None


class MeasurementResponse(MeasurementBase):
    id: int
    sensor_id: int | None
    created_at: datetime

    class Config:
        from_attributes = True
