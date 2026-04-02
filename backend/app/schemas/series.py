from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional, List
import re


class SeriesBase(BaseModel):
    name: str
    description: Optional[str] = None
    unit: str
    min_value: float
    max_value: float
    color: str
    icon: Optional[str] = None
    location_id: Optional[int] = None

    @field_validator("color")
    @classmethod
    def validate_color(cls, v):
        if not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError("Color must be a valid hex code (e.g., #FF5733)")
        return v

    @field_validator("max_value")
    @classmethod
    def validate_min_max(cls, v, info):
        if "min_value" in info.data and v <= info.data["min_value"]:
            raise ValueError("max_value must be greater than min_value")
        return v


class SeriesCreate(SeriesBase):
    tags: List[str] = []


class SeriesUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    unit: Optional[str] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    location_id: Optional[int] = None
    tags: Optional[List[str]] = None


class SeriesResponse(SeriesBase):
    id: int
    creator_id: Optional[int]
    is_public: bool
    tags: List[str] = []
    created_at: datetime
    updated_at: datetime

    @field_validator("tags", mode="before")
    @classmethod
    def extract_tag_names(cls, v):
        if v and hasattr(v[0], "name"):
            return [tag.name for tag in v]
        return v

    class Config:
        from_attributes = True
