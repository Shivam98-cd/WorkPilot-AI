"""
Integrations API — connect third-party workspace tools.
"""
from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse

from core.config import settings
from core.exceptions import AppException, NotFoundException, ValidationException
from middleware.auth import get_current_user
from schemas.integration import ConnectBody, IntegrationRequestBody
from core.integrations_registry import get_platform
from services.integration_service import integration_service

router = APIRouter(prefix="/integrations", tags=["integrations"])


@router.get("")
async def list_integrations(current_user=Depends(get_current_user)):
    uid = current_user["uid"]
    data = await integration_service.list_for_user(uid)
    return {"success": True, "data": data}


@router.get("/catalog")
async def integration_catalog(current_user=Depends(get_current_user)):
    return {"success": True, "data": integration_service.list_catalog()}


@router.get("/catalog/public")
async def public_integration_catalog():
    return {"success": True, "data": integration_service.list_catalog()}


@router.get("/oauth-url")
async def get_oauth_url_legacy(platform: str, current_user=Depends(get_current_user)):
    """Legacy alias — prefer GET /integrations/{platform}/authorize."""
    uid = current_user["uid"]
    try:
        url = integration_service.build_authorize_url(uid, platform)
        return {"success": True, "data": {"url": url, "authorizeUrl": url}}
    except AppException as exc:
        raise exc
    except KeyError:
        raise NotFoundException(f"Unknown platform: {platform}")


@router.get("/{platform}/authorize")
async def authorize_integration(platform: str, current_user=Depends(get_current_user)):
    uid = current_user["uid"]
    try:
        url = integration_service.build_authorize_url(uid, platform)
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
    redirect_base = settings.FRONTEND_OAUTH_REDIRECT.rstrip("/")
    if error:
        return RedirectResponse(
            url=f"{redirect_base}?integrations={platform}&status=error&message={error}"
        )
    if not code or not state:
        return RedirectResponse(
            url=f"{redirect_base}?integrations={platform}&status=error&message=missing_code"
        )
    try:
        await integration_service.handle_oauth_callback(platform, code, state)
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
        return {"success": True, "message": f"Disconnected {platform}"}
    except KeyError:
        raise NotFoundException(f"Unknown platform: {platform}")


@router.post("/{platform}/sync")
async def sync_integration(platform: str, current_user=Depends(get_current_user)):
    uid = current_user["uid"]
    try:
        data = await integration_service.sync_integration(uid, platform)
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
