"""
Microsoft OAuth API Endpoints
"""
from fastapi import APIRouter, Request, Depends
from schemas.auth import RefreshTokenRequest
from schemas.responses import ApiResponse
from services.auth_service import auth_service
from middleware.auth import get_current_user

router = APIRouter(prefix="/microsoft", tags=["Microsoft OAuth"])


@router.post("/callback", response_model=ApiResponse)
async def microsoft_callback(
    request: Request,
    code: str,
    redirect_uri: str,
    device_info: dict = Depends(lambda req: {
        "device": req.headers.get('User-Agent', 'Unknown'),
        "browser": req.headers.get('User-Agent', 'Unknown'),
        "ip": req.client.host,
        "location": None,
    }),
):
    """Handle Microsoft OAuth callback with authorization code."""
    result = await auth_service.microsoft_auth(code, redirect_uri, device_info)
    return {
        "success": True,
        "data": {
            "user": result["user"].to_dict(),
            "tokens": result["tokens"],
        },
        "message": "Microsoft login successful",
    }


@router.post("/refresh", response_model=ApiResponse)
async def refresh_token(request: RefreshTokenRequest):
    """Refresh Microsoft JWT tokens (same as generic refresh)."""
    result = await auth_service.refresh_tokens(request.refreshToken)
    return {
        "success": True,
        "data": result["tokens"],
        "message": "Token refreshed successfully",
    }