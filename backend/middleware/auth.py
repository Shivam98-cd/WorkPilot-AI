"""
Authentication Middleware — accepts backend JWT tokens AND Firebase ID tokens.

Performance optimisations applied:
  • Firebase verify_id_token() is blocking (uses the `requests` library internally).
    We now run it in a thread-pool via asyncio.to_thread so the event loop is
    never blocked.
  • Successfully verified Firebase tokens are cached for 5 minutes so that
    repeated requests from the same user skip the network round-trip entirely.
  • Only valid tokens are cached; errors are never stored.
  • The cache is a plain module-level dict — safe for a single uvicorn worker.
    In multi-worker deployments, replace with Redis.
"""
import asyncio
import hashlib
import time
from typing import Dict, Optional

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.exceptions import AuthenticationException
from security.jwt import verify_token

security = HTTPBearer()

# ── Firebase token cache ───────────────────────────────────────────────────────
# Key  : SHA-256 hex digest of the raw token (never stores the token itself)
# Value: {"user": {...}, "ts": float}
_FB_CACHE: Dict[str, Dict] = {}
_FB_CACHE_TTL = 300  # 5 minutes


def _cache_key(token: str) -> str:
    """Return a safe cache key — SHA-256 of the token, never the token itself."""
    return hashlib.sha256(token.encode()).hexdigest()


def _fb_cache_get(token: str) -> Optional[Dict]:
    """Return cached user dict if still valid, else None."""
    key = _cache_key(token)
    entry = _FB_CACHE.get(key)
    if entry and (time.monotonic() - entry["ts"]) < _FB_CACHE_TTL:
        return entry["user"]
    # Stale or missing — remove so it doesn't accumulate
    _FB_CACHE.pop(key, None)
    return None


def _fb_cache_set(token: str, user: Dict) -> None:
    """Store a verified user dict in the cache."""
    _FB_CACHE[_cache_key(token)] = {"user": user, "ts": time.monotonic()}


def _do_verify_firebase(token: str) -> Optional[Dict]:
    """
    Synchronous Firebase verification — intended to be called via
    asyncio.to_thread() so it does NOT block the event loop.
    Returns a user dict on success, None on any failure.
    """
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


async def _try_verify_firebase_async(token: str) -> Optional[Dict]:
    """
    Async wrapper for Firebase verification.
    1. Check cache first (fast, no I/O).
    2. If cache miss, run the blocking SDK call in a thread.
    3. Cache the result only on success.
    """
    cached = _fb_cache_get(token)
    if cached is not None:
        return cached

    user = await asyncio.to_thread(_do_verify_firebase, token)
    if user:
        _fb_cache_set(token, user)
    return user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Accepts either:
    1. A backend-issued JWT access token  (fast path — pure local decode)
    2. A Firebase ID token                (async, cached after first verification)
    """
    token = credentials.credentials

    # 1. Backend JWT — local decode, no network call, no blocking
    try:
        payload = verify_token(token, token_type="access")
        return payload
    except AuthenticationException:
        pass

    # 2. Firebase ID token — async + cached
    firebase_user = await _try_verify_firebase_async(token)
    if firebase_user:
        return firebase_user

    raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_optional_user(request: Request) -> Optional[Dict]:
    """Optionally get current user — returns None if unauthenticated."""
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        token = auth_header.removeprefix("Bearer ").strip()
        # Backend JWT fast path
        try:
            return verify_token(token, token_type="access")
        except Exception:
            pass
        # Firebase async path
        return await _try_verify_firebase_async(token)
    except Exception:
        return None
