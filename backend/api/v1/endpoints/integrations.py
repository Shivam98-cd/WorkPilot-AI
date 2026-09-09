"""
Integrations API — connect third-party workspace tools.
"""
import time
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Body
from fastapi.responses import RedirectResponse, JSONResponse

from core.config import settings
from core.exceptions import AppException, NotFoundException, ValidationException
from middleware.auth import get_current_user
from schemas.integration import ConnectBody, IntegrationRequestBody, WorkflowExecuteBody
from core.integrations_registry import get_platform
from services.integration_service import integration_service
from services.master_agent import master_agent

router = APIRouter(prefix="/integrations", tags=["integrations"])

# 30-second TTL cache per user — eliminates repeated Firestore reads
_CACHE: dict = {}   # uid -> (timestamp, data)
_CACHE_TTL = 30     # seconds

def _invalidate_cache(uid: str) -> None:
    _CACHE.pop(uid, None)


@router.get("/debug")
async def debug_integrations(current_user: dict = Depends(get_current_user)):
    """Debug endpoint to see raw integration data"""
    uid = current_user["uid"]
    records = await integration_repository.list_for_user(uid)
    return {
        "uid": uid,
        "total_records": len(records),
        "records": [
            {
                "platform": r.platform,
                "status": r.status,
                "account_label": r.account_label,
                "has_access_token": r.access_token_enc is not None,
                "has_refresh_token": r.refresh_token_enc is not None,
                "token_expires_at": r.token_expires_at.isoformat() if r.token_expires_at else None,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in records
        ]
    }


@router.get("")
async def list_integrations(current_user=Depends(get_current_user), _t: Optional[str] = Query(None)):
    uid = current_user["uid"]
    now = time.monotonic()
    # If _t (cache-bust) param is present, always skip cache
    bust = _t is not None
    if not bust and uid in _CACHE:
        ts, cached_data = _CACHE[uid]
        if now - ts < _CACHE_TTL:
            return {"success": True, "data": cached_data, "cached": True}
    # Fresh fetch (always when busting)
    if bust:
        _invalidate_cache(uid)
    data = await integration_service.list_for_user(uid)
    _CACHE[uid] = (now, data)
    return {"success": True, "data": data}



@router.get("/catalog/public")
async def integration_catalog_public():
    """Public integration catalog (no auth) — used when user session/API is unavailable."""
    return {"success": True, "data": integration_service.list_catalog()}


@router.get("/catalog")
async def integration_catalog(current_user=Depends(get_current_user)):
    return {"success": True, "data": integration_service.list_catalog()}


@router.get("/oauth-url")
async def get_oauth_url_legacy(platform: str, redirect_origin: str = Query(default=""), current_user=Depends(get_current_user)):
    """Legacy alias — prefer GET /integrations/{platform}/authorize."""
    uid = current_user["uid"]
    try:
        url = integration_service.build_authorize_url(uid, platform, redirect_origin)
        return {"success": True, "data": {"url": url, "authorizeUrl": url}}
    except AppException as exc:
        raise exc
    except KeyError:
        raise NotFoundException(f"Unknown platform: {platform}")


@router.get("/{platform}/authorize")
async def authorize_integration(platform: str, redirect_origin: str = Query(default=""), current_user=Depends(get_current_user)):
    uid = current_user["uid"]
    try:
        url = integration_service.build_authorize_url(uid, platform, redirect_origin)
        return {"success": True, "data": {"authorizeUrl": url, "platform": platform}}
    except KeyError:
        raise NotFoundException(f"Unknown platform: {platform}")



@router.get("/{platform}/callback")
async def oauth_callback(
    platform: str,
    code: str = Query(default=""),
    state: str = Query(default=""),
    error: str = Query(default=""),
):
    # Resolve the frontend redirect base:
    # 1. Try to read it from the stored OAuth state (set by the frontend when authorizing).
    # 2. Fall back to the FRONTEND_OAUTH_REDIRECT env var.
    redirect_base = settings.FRONTEND_OAUTH_REDIRECT.rstrip("/")
    if state:
        states_data = __import__('services.integration_service', fromlist=['_load_oauth_states'])._load_oauth_states()
        pending_state = states_data.get(state, {})
        origin = pending_state.get("redirect_origin", "")
        if origin and origin.startswith("http"):
            redirect_base = origin.rstrip("/") + "/dashboard"

    if error:
        return RedirectResponse(
            url=f"{redirect_base}?integrations={platform}&status=error&message={error}"
        )
    if not code or not state:
        return RedirectResponse(
            url=f"{redirect_base}?integrations={platform}&status=error&message=missing_code"
        )
    try:
        record = await integration_service.handle_oauth_callback(platform, code, state)
        _invalidate_cache(record.uid)  # bust cache so user sees connected status immediately
        return RedirectResponse(url=f"{redirect_base}?integrations={platform}&status=connected")
    except AppException as exc:
        return RedirectResponse(
            url=f"{redirect_base}?integrations={platform}&status=error&message={exc.message}"
        )
    except Exception as exc:
        return RedirectResponse(
            url=f"{redirect_base}?integrations={platform}&status=error&message={str(exc)}"
        )



@router.delete("/{platform}")
async def disconnect_integration(platform: str, current_user=Depends(get_current_user)):
    uid = current_user["uid"]
    try:
        await integration_service.disconnect(uid, platform)
        _invalidate_cache(uid)  # force fresh data on next list
        return {"success": True, "message": f"Disconnected {platform}"}
    except KeyError:
        raise NotFoundException(f"Unknown platform: {platform}")


@router.post("/{platform}/sync")
async def sync_integration(platform: str, current_user=Depends(get_current_user)):
    uid = current_user["uid"]
    try:
        data = await integration_service.sync_integration(uid, platform)
        _invalidate_cache(uid)  # force fresh data on next list
        return {
            "success": True,
            "message": f"Synced {platform}",
            "data": data,
        }
    except KeyError:
        raise NotFoundException(f"Unknown platform: {platform}")


@router.post("/request")
async def request_integration(body: IntegrationRequestBody, current_user=Depends(get_current_user)):
    uid = current_user["uid"]
    data = await integration_service.request_integration(uid, body.model_dump())
    return {"success": True, "data": data, "message": "Integration request submitted"}


@router.post("/connect")
async def connect_integration_legacy(body: ConnectBody, current_user=Depends(get_current_user)):
    """Legacy stub — real connect requires OAuth via /{platform}/authorize."""
    raise ValidationException(
        "Direct connect is disabled. Use GET /integrations/{platform}/authorize to start OAuth."
    )


# ============================================================================
# NEW MASTER AGENT ENDPOINTS
# ============================================================================

@router.post("/sync-all")
async def sync_all_integrations(current_user=Depends(get_current_user)):
    """
    Sync all connected integrations concurrently.
    
    Returns sync status for each platform.
    """
    uid = current_user["uid"]
    result = await master_agent.sync_all_integrations(uid)
    return {"success": True, "data": result}


@router.get("/unified-inbox")
async def get_unified_inbox(
    limit: int = Query(default=50, ge=1, le=200),
    platforms: Optional[str] = Query(default=None),
    current_user=Depends(get_current_user)
):
    """
    Get unified inbox from all email platforms.
    
    Query params:
    - limit: Max messages per platform (default: 50)
    - platforms: Comma-separated list of platforms (default: gmail,outlook)
    """
    uid = current_user["uid"]
    platform_list = platforms.split(",") if platforms else None
    
    messages = await master_agent.get_unified_inbox(
        uid, limit=limit, platforms=platform_list
    )
    
    return {
        "success": True,
        "data": {
            "messages": [msg.to_dict() for msg in messages],
            "count": len(messages),
        }
    }


@router.get("/unified-calendar")
async def get_unified_calendar(
    days_ahead: int = Query(default=7, ge=1, le=30),
    platforms: Optional[str] = Query(default=None),
    current_user=Depends(get_current_user)
):
    """
    Get unified calendar from all calendar platforms.
    
    Query params:
    - days_ahead: Days ahead to fetch (default: 7)
    - platforms: Comma-separated list of platforms (default: google_calendar,outlook,zoom)
    """
    uid = current_user["uid"]
    platform_list = platforms.split(",") if platforms else None
    
    events = await master_agent.get_unified_calendar(
        uid, days_ahead=days_ahead, platforms=platform_list
    )
    
    return {
        "success": True,
        "data": {
            "events": [event.to_dict() for event in events],
            "count": len(events),
        }
    }


@router.get("/health")
async def get_health_status(current_user=Depends(get_current_user)):
    """
    Get health status of all connected integrations.
    
    Returns health check results for each platform.
    """
    uid = current_user["uid"]
    health_status = await master_agent.health_check(uid)
    
    return {
        "success": True,
        "data": {
            platform: {
                "status": health.status,
                "token_valid": health.token_valid,
                "last_sync": health.last_sync.isoformat() if health.last_sync else None,
                "error_count": health.error_count,
                "response_time_ms": health.response_time_ms,
                "message": health.message,
            }
            for platform, health in health_status.items()
        }
    }


@router.post("/workflow/execute")
async def execute_workflow(
    body: WorkflowExecuteBody,
    current_user=Depends(get_current_user)
):
    """
    Execute a cross-platform workflow.
    
    Body:
    - workflow: Workflow identifier (e.g., 'email_to_github_issue')
    - params: Workflow-specific parameters
    """
    uid = current_user["uid"]
    result = await master_agent.execute_workflow(
        uid, body.workflow, body.params
    )
    return {"success": True, "data": result}


@router.get("/{platform}/data")
async def get_platform_data(
    platform: str,
    data_type: Optional[str] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    current_user=Depends(get_current_user)
):
    """
    Get platform-specific data.
    
    Query params:
    - data_type: Type of data to fetch (e.g., 'messages', 'events', 'issues')
    - limit: Max items to return
    """
    uid = current_user["uid"]
    agent = master_agent.get_agent(platform)
    
    if not agent:
        raise NotFoundException(f"Platform '{platform}' not found")
    
    # Route to appropriate agent method based on data_type
    if data_type == "messages" and hasattr(agent, "get_messages"):
        data = await agent.get_messages(uid, limit=limit)
        return {
            "success": True,
            "data": {
                "items": [msg.to_dict() for msg in data],
                "count": len(data),
                "type": "messages",
            }
        }
    elif data_type == "events" and hasattr(agent, "get_events"):
        data = await agent.get_events(uid, limit=limit)
        return {
            "success": True,
            "data": {
                "items": [event.to_dict() for event in data],
                "count": len(data),
                "type": "events",
            }
        }
    elif data_type == "issues" and hasattr(agent, "get_issues"):
        data = await agent.get_issues(uid, limit=limit)
        return {
            "success": True,
            "data": {
                "items": [issue.to_dict() for issue in data],
                "count": len(data),
                "type": "issues",
            }
        }
    else:
        raise ValidationException(
            f"Data type '{data_type}' not supported for platform '{platform}'"
        )

