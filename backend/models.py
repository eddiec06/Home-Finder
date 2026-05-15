"""
Pydantic models = the 'Model' tier of MVC.
Variable names mirror the SIS documentation (propertyID, location, price, ...).
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
import uuid


# ---------- Users ----------------------------------------------------------------
class UserPublic(BaseModel):
    id: str
    email: str
    name: str
    role: str  # 'user' or 'admin'


class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=6)
    name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class MFAVerifyRequest(BaseModel):
    challenge_token: str
    code: str = Field(min_length=6, max_length=6)


# ---------- Properties -----------------------------------------------------------
class PropertyBase(BaseModel):
    title: str
    location: str
    price: float
    bedrooms: int
    bathrooms: int
    description: str
    image_url: str


class PropertyCreate(PropertyBase):
    pass


class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    location: Optional[str] = None
    price: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    description: Optional[str] = None
    image_url: Optional[str] = None


class Property(PropertyBase):
    propertyID: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
