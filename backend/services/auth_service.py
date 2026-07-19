"""
Authentication Service - Business Logic
"""
from datetime import datetime, timedelta
from typing import Dict, Any
import uuid

from models.user import User
from models.session import Session
from repositories.user_repository import user_repository
from repositories.session_repository import session_repository
from firebase.auth import firebase_auth_service
from security.jwt import create_access_token, create_refresh_token, verify_token
from security.password import hash_password, verify_password
from core.config import settings
from core.exceptions import (
    AuthenticationException,
    ValidationException,
    ConflictException,
)


class AuthService:
    """Authentication business logic service"""
    
    async def register_user(
        self,
        name: str,
        email: str,
        password: str,
        provider: str = "email",
    ) -> Dict[str, Any]:
        """Register a new user"""
        existing_user = await user_repository.get_by_email(email)
        if existing_user:
            raise ConflictException("Email already registered")
        
        firebase_user = await firebase_auth_service.get_user_by_email(email)
        
        if not firebase_user:
            raise ValidationException("Firebase user not found. Please complete Firebase registration first.")
        
        user = User(
            uid=firebase_user.uid,
            email=email,
            name=name,
            photo=None,
            created_at=datetime.utcnow(),
            last_login=datetime.utcnow(),
            provider=provider,
            role="user",
            plan="free",
            email_verified=firebase_user.email_verified,
            preferences={'theme': 'dark', 'notifications': True, 'language': 'en'},
        )
        
        created_user = await user_repository.create(user)
        
        tokens = self._generate_tokens(created_user.uid, created_user.email)
        
        return {
            "user": created_user,
            "tokens": tokens,
        }
    
    async def login(
        self,
        email: str,
        password: str,
        device_info: Dict[str, str],
    ) -> Dict[str, Any]:
        """Authenticate user with email and password"""
        firebase_user = await firebase_auth_service.get_user_by_email(email)
        
        if not firebase_user:
            raise AuthenticationException("Invalid credentials")
        
        user = await user_repository.get_by_uid(firebase_user.uid)
        
        if not user:
            raise AuthenticationException("User not found in database")
        
        await user_repository.update(
            user.uid,
            {'lastLogin': datetime.utcnow()}
        )
        
        session = await self._create_session(user.uid, device_info)
        
        tokens = self._generate_tokens(user.uid, user.email)
        
        return {
            "user": user,
            "tokens": tokens,
            "session": session,
        }
    
    async def google_auth(
        self,
        id_token: str,
        device_info: Dict[str, str],
    ) -> Dict[str, Any]:
        """Authenticate user with Google OAuth"""
        decoded_token = await firebase_auth_service.verify_id_token(id_token)
        
        uid = decoded_token.get('uid')
        email = decoded_token.get('email')
        name = decoded_token.get('name', '')
        photo = decoded_token.get('picture')
        
        user = await user_repository.get_by_uid(uid)
        
        if not user:
            user = User(
                uid=uid,
                email=email,
                name=name,
                photo=photo,
                created_at=datetime.utcnow(),
                last_login=datetime.utcnow(),
                provider="google",
                role="user",
                plan="free",
                email_verified=True,
                preferences={'theme': 'dark', 'notifications': True, 'language': 'en'},
            )
            user = await user_repository.create(user)
        else:
            await user_repository.update(
                user.uid,
                {'lastLogin': datetime.utcnow()}
            )
        
        session = await self._create_session(user.uid, device_info)
        
        tokens = self._generate_tokens(user.uid, user.email)
        
        return {
            "user": user,
            "tokens": tokens,
            "session": session,
        }
    
    async def refresh_tokens(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token"""
        try:
            payload = verify_token(refresh_token, token_type="refresh")
            uid = payload.get('uid')
            email = payload.get('email')
            
            tokens = self._generate_tokens(uid, email)
            
            return {"tokens": tokens}
        except Exception as e:
            raise AuthenticationException("Invalid or expired refresh token")
    
    async def logout(self, uid: str, session_id: str = None):
        """Logout user and revoke session"""
        if session_id:
            await session_repository.update(session_id, {'isActive': False})
        else:
            await session_repository.revoke_all_user_sessions(uid)
    
    async def verify_email(self, token: str) -> bool:
        """Verify user email"""
        try:
            payload = verify_token(token, token_type="verification")
            uid = payload.get('uid')
            
            await user_repository.update(uid, {'emailVerified': True})
            return True
        except:
            raise ValidationException("Invalid or expired verification token")
    
    def _generate_tokens(self, uid: str, email: str) -> Dict[str, str]:
        """Generate access and refresh tokens"""
        access_token = create_access_token(
            data={'uid': uid, 'email': email},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        refresh_token = create_refresh_token(
            data={'uid': uid, 'email': email},
            expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        
        return {
            'accessToken': access_token,
            'refreshToken': refresh_token,
            'expiresIn': settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }
    
    async def _create_session(
        self,
        user_id: str,
        device_info: Dict[str, str],
    ) -> Session:
        """Create a new session"""
        session = Session(
            id=str(uuid.uuid4()),
            user_id=user_id,
            device=device_info.get('device', 'Unknown'),
            browser=device_info.get('browser', 'Unknown'),
            ip=device_info.get('ip', 'Unknown'),
            location=device_info.get('location'),
            created_at=datetime.utcnow(),
            last_active=datetime.utcnow(),
            is_active=True,
        )
        
        return await session_repository.create(session)


auth_service = AuthService()
