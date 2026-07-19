"""
Generic Response Schemas
"""
from pydantic import BaseModel
from typing import Optional, Any, Dict


class ApiResponse(BaseModel):
    """Generic API response"""
    success: bool
    data: Optional[Any] = None
    message: Optional[str] = None
    error: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    """Error response schema"""
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


class SuccessResponse(BaseModel):
    """Success response schema"""
    success: bool = True
    message: str
    data: Optional[Any] = None
