"""
Custom Exception Classes for the application
"""
from typing import Optional, Dict, Any


class AppException(Exception):
    """Base application exception"""
    
    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class AuthenticationException(AppException):
    """Authentication related exceptions"""
    
    def __init__(self, message: str = "Authentication failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="AUTHENTICATION_ERROR",
            status_code=401,
            details=details,
        )


class AuthorizationException(AppException):
    """Authorization related exceptions"""
    
    def __init__(self, message: str = "Access denied", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="AUTHORIZATION_ERROR",
            status_code=403,
            details=details,
        )


class ValidationException(AppException):
    """Validation related exceptions"""
    
    def __init__(self, message: str = "Validation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=422,
            details=details,
        )


class NotFoundException(AppException):
    """Resource not found exceptions"""
    
    def __init__(self, message: str = "Resource not found", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="NOT_FOUND",
            status_code=404,
            details=details,
        )


class ConflictException(AppException):
    """Conflict exceptions (e.g., duplicate resource)"""
    
    def __init__(self, message: str = "Resource already exists", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="CONFLICT",
            status_code=409,
            details=details,
        )


class RateLimitException(AppException):
    """Rate limit exceeded exceptions"""
    
    def __init__(self, message: str = "Rate limit exceeded", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="RATE_LIMIT_EXCEEDED",
            status_code=429,
            details=details,
        )


class ExternalServiceException(AppException):
    """External service related exceptions"""
    
    def __init__(self, message: str = "External service error", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="EXTERNAL_SERVICE_ERROR",
            status_code=502,
            details=details,
        )
