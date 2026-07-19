"""
Application Constants
"""

class UserRole:
    """User role constants"""
    USER = "user"
    ADMIN = "admin"
    SUPERADMIN = "superadmin"


class UserPlan:
    """User plan constants"""
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class AuthProvider:
    """Authentication provider constants"""
    EMAIL = "email"
    GOOGLE = "google"
    GITHUB = "github"
    MICROSOFT = "microsoft"


class ErrorCode:
    """Error code constants"""
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS"
    USER_NOT_FOUND = "USER_NOT_FOUND"
    INVALID_TOKEN = "INVALID_TOKEN"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    INTERNAL_ERROR = "INTERNAL_ERROR"


class CollectionName:
    """Firestore collection names"""
    USERS = "users"
    SESSIONS = "sessions"
    AUDIT_LOGS = "audit_logs"
    REFRESH_TOKENS = "refresh_tokens"
