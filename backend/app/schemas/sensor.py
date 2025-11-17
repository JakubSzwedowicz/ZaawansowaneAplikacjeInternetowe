from pydantic import BaseModel
from datetime import datetime


class SensorBase(BaseModel):
    name: str
    series_id: int


class SensorCreate(SensorBase):
    pass


class SensorUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None


class SensorResponse(SensorBase):
    id: int
    is_active: bool
    last_seen: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


class SensorWithKey(SensorResponse):
    api_key: str
