"""
Authentication Pydantic Schemas
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
import re


class LoginRequest(BaseModel):
    """Login request schema"""
    email: EmailStr
    password: str = Field(..., min_length=8)
    rememberMe: Optional[bool] = False
    deviceFingerprint: Optional[str] = None


class SignupRequest(BaseModel):
    """Signup request schema"""
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    confirmPassword: str
    acceptTerms: bool
    
    @validator('password')
    def validate_password(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r'[^A-Za-z0-9]', v):
            raise ValueError('Password must contain at least one special character')
        return v
    
    @validator('confirmPassword')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v
    
    @validator('acceptTerms')
    def terms_accepted(cls, v):
        if not v:
            raise ValueError('You must accept the terms and conditions')
        return v


class GoogleAuthRequest(BaseModel):
    """Google authentication request"""
    idToken: str


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refreshToken: str


class ForgotPasswordRequest(BaseModel):
    """Forgot password request"""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Reset password request"""
    token: str
    newPassword: str = Field(..., min_length=8)
    confirmPassword: str
    
    @validator('confirmPassword')
    def passwords_match(cls, v, values):
        if 'newPassword' in values and v != values['newPassword']:
            raise ValueError('Passwords do not match')
        return v


class ChangePasswordRequest(BaseModel):
    """Change password request"""
    currentPassword: str
    newPassword: str = Field(..., min_length=8)


class VerifyEmailRequest(BaseModel):
    """Email verification request"""
    token: str
