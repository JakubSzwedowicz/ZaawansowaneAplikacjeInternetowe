from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    password: str | None = None


class UserResponse(UserBase):
    id: int
    role: str
    is_admin: bool
    is_blocked: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserListItem(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_blocked: bool
    last_login_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
