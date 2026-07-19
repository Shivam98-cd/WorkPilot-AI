"""
User Pydantic Schemas
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserPreferences(BaseModel):
    """User preferences schema"""
    theme: Optional[str] = "dark"
    notifications: Optional[bool] = True
    language: Optional[str] = "en"


class UserResponse(BaseModel):
    """User response schema"""
    uid: str
    email: str
    name: str
    photo: Optional[str] = None
    createdAt: datetime
    lastLogin: datetime
    provider: str
    role: str = "user"
    plan: str = "free"
    emailVerified: bool = False
    preferences: Optional[UserPreferences] = None


class AuthTokens(BaseModel):
    """Authentication tokens schema"""
    accessToken: str
    refreshToken: str
    expiresIn: int


class AuthResponse(BaseModel):
    """Authentication response schema"""
    user: UserResponse
    tokens: AuthTokens
    message: str = "Authentication successful"


class UpdateProfileRequest(BaseModel):
    """Update profile request"""
    name: Optional[str] = None
    photo: Optional[str] = None
    preferences: Optional[UserPreferences] = None
