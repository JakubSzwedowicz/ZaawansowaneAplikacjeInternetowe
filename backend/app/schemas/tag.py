from pydantic import BaseModel
from typing import Optional


class TagCreate(BaseModel):
    name: str
    slug: Optional[str] = None


class TagResponse(BaseModel):
    id: int
    name: str
    slug: Optional[str]

    class Config:
        from_attributes = True
