"""
Authentication Middleware — accepts backend JWT tokens AND Firebase ID tokens.
"""
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from security.jwt import verify_token
from core.exceptions import AuthenticationException

security = HTTPBearer()


def _try_verify_firebase(token: str):
    """Verify a Firebase ID token using firebase_admin. Returns uid dict or None."""
    try:
        import firebase_admin.auth as fb_auth
        decoded = fb_auth.verify_id_token(token)
        return {
            "uid": decoded["uid"],
            "email": decoded.get("email", ""),
            "name": decoded.get("name", ""),
            "type": "access",
        }
    except Exception:
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Accepts either:
    1. A backend-issued JWT access token
    2. A Firebase ID token (when the frontend hasn't exchanged yet)
    """
    token = credentials.credentials

    # 1. Try backend JWT first (fast path — no network call)
    try:
        payload = verify_token(token, token_type="access")
        return payload
    except AuthenticationException:
        pass

    # 2. Fall back to Firebase ID token verification
    firebase_user = _try_verify_firebase(token)
    if firebase_user:
        return firebase_user

    raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_optional_user(request: Request):
    """Optionally get current user — returns None if unauthenticated."""
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        token = auth_header.replace("Bearer ", "")
        try:
            return verify_token(token, token_type="access")
        except Exception:
            return _try_verify_firebase(token)
    except Exception:
        return None
