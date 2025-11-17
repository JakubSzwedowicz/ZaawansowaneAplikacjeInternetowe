from pydantic import BaseModel, field_validator
from datetime import datetime
import re


class SeriesBase(BaseModel):
    name: str
    description: str | None = None
    unit: str
    min_value: float
    max_value: float
    color: str
    icon: str | None = None

    @field_validator('color')
    @classmethod
    def validate_color(cls, v):
        if not re.match(r'^#[0-9A-Fa-f]{6}$', v):
            raise ValueError('Color must be a valid hex code (e.g., #FF5733)')
        return v

    @field_validator('max_value')
    @classmethod
    def validate_min_max(cls, v, info):
        if 'min_value' in info.data and v <= info.data['min_value']:
            raise ValueError('max_value must be greater than min_value')
        return v


class SeriesCreate(SeriesBase):
    pass


class SeriesUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    unit: str | None = None
    min_value: float | None = None
    max_value: float | None = None
    color: str | None = None
    icon: str | None = None


class SeriesResponse(SeriesBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
