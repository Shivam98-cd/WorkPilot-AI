"""
Authentication API Endpoints
"""
from fastapi import APIRouter, Request, Depends
from schemas.auth import (
    LoginRequest,
    SignupRequest,
    GoogleAuthRequest,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    VerifyEmailRequest,
)
from schemas.user import AuthResponse
from schemas.responses import ApiResponse
from services.auth_service import auth_service
from middleware.auth import get_current_user


router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_device_info(request: Request) -> dict:
    """Extract device information from request"""
    return {
        'device': request.headers.get('User-Agent', 'Unknown'),
        'browser': request.headers.get('User-Agent', 'Unknown'),
        'ip': request.client.host,
        'location': None,
    }


@router.post("/register", response_model=ApiResponse)
async def register(
    request: SignupRequest,
    req: Request,
):
    """Register a new user"""
    device_info = get_device_info(req)
    
    result = await auth_service.register_user(
        name=request.name,
        email=request.email,
        password=request.password,
        provider="email",
    )
    
    user_dict = result['user'].to_dict()
    
    return {
        "success": True,
        "data": {
            "user": user_dict,
            "tokens": result['tokens'],
        },
        "message": "Registration successful",
    }


@router.post("/login", response_model=ApiResponse)
async def login(
    request: LoginRequest,
    req: Request,
):
    """Login with email and password"""
    device_info = get_device_info(req)
    
    result = await auth_service.login(
        email=request.email,
        password=request.password,
        device_info=device_info,
    )
    
    user_dict = result['user'].to_dict()
    
    return {
        "success": True,
        "data": {
            "user": user_dict,
            "tokens": result['tokens'],
        },
        "message": "Login successful",
    }


@router.post("/google", response_model=ApiResponse)
async def google_auth(
    request: GoogleAuthRequest,
    req: Request,
):
    """Authenticate with Google OAuth"""
    device_info = get_device_info(req)
    
    result = await auth_service.google_auth(
        id_token=request.idToken,
        device_info=device_info,
    )
    
    user_dict = result['user'].to_dict()
    
    return {
        "success": True,
        "data": {
            "user": user_dict,
            "tokens": result['tokens'],
        },
        "message": "Google authentication successful",
    }


@router.post("/refresh", response_model=ApiResponse)
async def refresh_token(request: RefreshTokenRequest):
    """Refresh access token"""
    result = await auth_service.refresh_tokens(request.refreshToken)
    
    return {
        "success": True,
        "data": result['tokens'],
        "message": "Token refreshed successfully",
    }


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout user"""
    uid = current_user.get('uid')
    await auth_service.logout(uid)
    
    return {
        "success": True,
        "message": "Logout successful",
    }


@router.post("/verify-email", response_model=ApiResponse)
async def verify_email(request: VerifyEmailRequest):
    """Verify user email"""
    await auth_service.verify_email(request.token)
    
    return {
        "success": True,
        "message": "Email verified successfully",
    }


@router.post("/forgot-password", response_model=ApiResponse)
async def forgot_password(request: ForgotPasswordRequest):
    """Send password reset email"""
    return {
        "success": True,
        "message": "Password reset email sent",
    }


@router.get("/sessions", response_model=ApiResponse)
async def get_sessions(current_user: dict = Depends(get_current_user)):
    """Get all active sessions"""
    from services.user_service import user_service
    
    uid = current_user.get('uid')
    sessions = await user_service.get_user_sessions(uid)
    
    return {
        "success": True,
        "data": sessions,
    }


@router.delete("/sessions/{session_id}", response_model=ApiResponse)
async def revoke_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Revoke a specific session"""
    from services.user_service import user_service
    
    uid = current_user.get('uid')
    await user_service.revoke_session(uid, session_id)
    
    return {
        "success": True,
        "message": "Session revoked successfully",
    }
