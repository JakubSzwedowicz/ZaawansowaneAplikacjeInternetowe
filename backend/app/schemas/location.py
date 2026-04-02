from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class LocationBase(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None
    slug: Optional[str] = None
    display_order: int = 0


class LocationCreate(LocationBase):
    pass


class LocationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None
    slug: Optional[str] = None
    display_order: Optional[int] = None


class LocationResponse(LocationBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LocationTree(LocationResponse):
    children: List["LocationTree"] = []

    class Config:
        from_attributes = True


LocationTree.model_rebuild()
