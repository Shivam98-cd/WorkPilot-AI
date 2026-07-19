"""
Authentication Middleware for JWT verification
"""
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from security.jwt import verify_token
from core.exceptions import AuthenticationException


security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Dependency to get current authenticated user"""
    try:
        token = credentials.credentials
        payload = verify_token(token, token_type="access")
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


async def get_optional_user(
    request: Request,
):
    """Dependency to optionally get current user"""
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        
        token = auth_header.replace("Bearer ", "")
        payload = verify_token(token, token_type="access")
        return payload
    except:
        return None
