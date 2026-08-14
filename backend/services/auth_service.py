"""
Authentication Service - Business Logic
"""
from datetime import datetime, timedelta
from typing import Dict, Any
import uuid
import logging

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
import requests


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
        
        user.password_hash = hash_password(password)

        created_user = await user_repository.create(user)
        
        tokens = self._generate_tokens(created_user.uid, created_user.email, created_user.provider)
        
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

        if user.password_hash:
            if not verify_password(password, user.password_hash):
                raise AuthenticationException("Invalid credentials")
        else:
            raise AuthenticationException("No password set. Please sign in with your social account or reset your password.")
        
        await user_repository.update(
            user.uid,
            {'lastLogin': datetime.utcnow()}
        )
        
        session = await self._create_session(user.uid, device_info)
        
        tokens = self._generate_tokens(user.uid, user.email, user.provider)
        
        return {
            "user": user,
            "tokens": tokens,
            "session": session,
        }
    
    @staticmethod
    def _provider_from_firebase_token(decoded_token: Dict[str, Any]) -> str:
        sign_in = decoded_token.get('firebase', {}).get('sign_in_provider', 'google.com')
        return {
            'google.com': 'google',
            'github.com': 'github',
            'password': 'email',
        }.get(sign_in, sign_in.replace('.com', ''))

    async def google_auth(
        self,
        id_token: str,
        device_info: Dict[str, str],
    ) -> Dict[str, Any]:
        """Authenticate user with Firebase OAuth (Google, GitHub, etc.)"""
        decoded_token = await firebase_auth_service.verify_id_token(id_token)
        provider = self._provider_from_firebase_token(decoded_token)
        
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
                provider=provider,
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
        
        tokens = self._generate_tokens(user.uid, user.email, provider)
        
        return {
            "user": user,
            "tokens": tokens,
            "session": session,
        }

    async def microsoft_auth(
        self,
        code: str,
        redirect_uri: str,
        device_info: Dict[str, str],
    ) -> Dict[str, Any]:
        """Authenticate user with Microsoft OAuth (authorization code flow)."""
        # Exchange authorization code for access token
        token_url = f"https://login.microsoftonline.com/{settings.MICROSOFT_TENANT_ID}/oauth2/v2.0/token"
        payload = {
            "client_id": settings.MICROSOFT_CLIENT_ID,
            "client_secret": settings.MICROSOFT_CLIENT_SECRET,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "scope": "User.Read",
        }
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        token_resp = requests.post(token_url, data=payload, headers=headers)
        token_resp.raise_for_status()
        token_data = token_resp.json()
        access_token = token_data.get("access_token")

        # Get user profile from Microsoft Graph
        user_resp = requests.get(
            "https://graph.microsoft.com/v1.0/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        user_resp.raise_for_status()
        profile = user_resp.json()

        email = profile.get("mail") or profile.get("userPrincipalName")
        name = profile.get("displayName", "")
        uid = f"microsoft-{profile.get('id')}"

        # Find or create user in our DB
        user = await user_repository.get_by_uid(uid)
        if not user:
            user = User(
                uid=uid,
                email=email,
                name=name,
                photo=None,
                created_at=datetime.utcnow(),
                last_login=datetime.utcnow(),
                provider="microsoft",
                role="user",
                plan="free",
                email_verified=True,
                preferences={'theme': 'dark', 'notifications': True, 'language': 'en'},
            )
            user = await user_repository.create(user)
        else:
            await user_repository.update(user.uid, {"lastLogin": datetime.utcnow()})

        session = await self._create_session(user.uid, device_info)
        tokens = self._generate_tokens(user.uid, user.email, "microsoft")
        return {"user": user, "tokens": tokens, "session": session}

    async def github_auth(
        self,
        code: str,
        device_info: Dict[str, str],
    ) -> Dict[str, Any]:
        """Authenticate user with GitHub OAuth (authorization code flow)."""
        token_url = "https://github.com/login/oauth/access_token"
        payload = {
            "client_id": settings.GITHUB_CLIENT_ID,
            "client_secret": settings.GITHUB_CLIENT_SECRET,
            "code": code,
        }
        headers = {"Accept": "application/json"}
        token_resp = requests.post(token_url, json=payload, headers=headers)
        token_resp.raise_for_status()
        token_data = token_resp.json()
        access_token = token_data.get("access_token")

        # Get user profile from GitHub API
        user_resp = requests.get(
            "https://api.github.com/user",
            headers={"Authorization": f"token {access_token}"},
        )
        user_resp.raise_for_status()
        profile = user_resp.json()

        email = profile.get("email")
        # If email is private, fetch via separate endpoint
        if not email:
            emails_resp = requests.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"token {access_token}"},
            )
            emails_resp.raise_for_status()
            emails = emails_resp.json()
            primary = next((e for e in emails if e.get("primary")), None)
            email = primary.get("email") if primary else None
        name = profile.get("name") or profile.get("login")
        uid = f"github-{profile.get('id')}"

        user = await user_repository.get_by_uid(uid)
        if not user:
            user = User(
                uid=uid,
                email=email,
                name=name,
                photo=profile.get("avatar_url"),
                created_at=datetime.utcnow(),
                last_login=datetime.utcnow(),
                provider="github",
                role="user",
                plan="free",
                email_verified=True,
                preferences={'theme': 'dark', 'notifications': True, 'language': 'en'},
            )
            user = await user_repository.create(user)
        else:
            await user_repository.update(user.uid, {"lastLogin": datetime.utcnow()})

        session = await self._create_session(user.uid, device_info)
        tokens = self._generate_tokens(user.uid, user.email, "github")
        return {"user": user, "tokens": tokens, "session": session}
    
    async def refresh_tokens(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token"""
        try:
            payload = verify_token(refresh_token, token_type="refresh")
            uid = payload.get('uid')
            email = payload.get('email')
            
            # Retrieve provider for the user to include in token claim
            user_obj = await user_repository.get_by_uid(uid)
            provider = user_obj.provider if user_obj else None
            tokens = self._generate_tokens(uid, email, provider)
            
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
    
    def _generate_tokens(self, uid: str, email: str, provider: str = None) -> Dict[str, str]:
        """Generate access and refresh tokens, optionally embedding the authentication provider claim."""
        token_data = {'uid': uid, 'email': email}
        if provider:
            token_data['provider'] = provider

        access_token = create_access_token(
            data=token_data,
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        refresh_token = create_refresh_token(
            data=token_data,
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
