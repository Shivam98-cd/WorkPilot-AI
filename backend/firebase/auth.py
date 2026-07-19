"""
Firebase Authentication Wrapper
"""
from firebase_admin import auth
from typing import Optional, Dict, Any
from core.exceptions import AuthenticationException, ValidationException


class FirebaseAuthService:
    """Firebase authentication service wrapper"""
    
    @staticmethod
    async def verify_id_token(id_token: str) -> Dict[str, Any]:
        """Verify Firebase ID token and return decoded claims"""
        try:
            decoded_token = auth.verify_id_token(id_token)
            return decoded_token
        except auth.InvalidIdTokenError:
            raise AuthenticationException("Invalid Firebase ID token")
        except auth.ExpiredIdTokenError:
            raise AuthenticationException("Firebase ID token expired")
        except Exception as e:
            raise AuthenticationException(f"Token verification failed: {str(e)}")
    
    @staticmethod
    async def get_user_by_uid(uid: str):
        """Get Firebase user by UID"""
        try:
            user = auth.get_user(uid)
            return user
        except auth.UserNotFoundError:
            raise ValidationException(f"User not found: {uid}")
        except Exception as e:
            raise AuthenticationException(f"Failed to get user: {str(e)}")
    
    @staticmethod
    async def get_user_by_email(email: str):
        """Get Firebase user by email"""
        try:
            user = auth.get_user_by_email(email)
            return user
        except auth.UserNotFoundError:
            return None
        except Exception as e:
            raise AuthenticationException(f"Failed to get user by email: {str(e)}")
    
    @staticmethod
    async def create_custom_token(uid: str, additional_claims: Optional[Dict[str, Any]] = None):
        """Create custom Firebase token"""
        try:
            custom_token = auth.create_custom_token(uid, additional_claims)
            return custom_token.decode('utf-8')
        except Exception as e:
            raise AuthenticationException(f"Failed to create custom token: {str(e)}")
    
    @staticmethod
    async def set_custom_user_claims(uid: str, claims: Dict[str, Any]):
        """Set custom claims for user"""
        try:
            auth.set_custom_user_claims(uid, claims)
        except Exception as e:
            raise AuthenticationException(f"Failed to set custom claims: {str(e)}")
    
    @staticmethod
    async def revoke_refresh_tokens(uid: str):
        """Revoke all refresh tokens for a user"""
        try:
            auth.revoke_refresh_tokens(uid)
        except Exception as e:
            raise AuthenticationException(f"Failed to revoke tokens: {str(e)}")


firebase_auth_service = FirebaseAuthService()
