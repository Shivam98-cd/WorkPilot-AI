"""
Integrations API — connect third-party workspace tools.
"""
from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import RedirectResponse
from typing import Optional

from core.config import settings
from core.exceptions import AppException, NotFoundException, ValidationException
from middleware.auth import get_current_user
from schemas.integration import ConnectBody, IntegrationRequestBody
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


# ── Trello Cockpit Endpoints (must be before /{platform} wildcard routes) ────

@router.get("/trello/boards")
async def trello_boards(current_user=Depends(get_current_user)):
    """List all open Trello boards for the authenticated user."""
    uid = current_user["uid"]
    data = await integration_service.list_trello_boards(uid)
    return {"success": True, "data": data}


@router.get("/trello/boards/{board_id}/lists")
async def trello_board_lists(board_id: str, current_user=Depends(get_current_user)):
    """List all open lists (columns) on a Trello board."""
    uid = current_user["uid"]
    data = await integration_service.list_trello_lists(uid, board_id)
    return {"success": True, "data": data}


@router.get("/trello/cards")
async def trello_cards(
    board_id: Optional[str] = Query(default=None, description="Filter cards by board ID"),
    limit: int = Query(default=50, ge=1, le=200),
    current_user=Depends(get_current_user),
):
    """List Trello cards. Optionally filter by board_id."""
    uid = current_user["uid"]
    data = await integration_service.list_trello_cards(uid, board_id=board_id, limit=limit)
    return {"success": True, "data": data}


@router.post("/trello/cards")
async def create_trello_card(body: dict, current_user=Depends(get_current_user)):
    """
    Create a new Trello card.

    Body:
        list_id (str): ID of the Trello list to add the card to. Required.
        name    (str): Card title. Required.
        desc    (str): Card description. Optional.
        due     (str): ISO 8601 due date string. Optional.
    """
    uid = current_user["uid"]
    list_id = (body.get("list_id") or "").strip()
    name = (body.get("name") or "").strip()
    if not list_id or not name:
        raise ValidationException("Both 'list_id' and 'name' are required")
    data = await integration_service.create_trello_card_api(
        uid=uid,
        list_id=list_id,
        name=name,
        desc=body.get("desc", ""),
        due=body.get("due"),
    )
    return {"success": True, "data": data, "message": f"Card '{name}' created on Trello"}


# ── Generic OAuth endpoints (wildcard — must come after fixed paths) ──────────

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
    request: Request,
    code: str = Query(default=""),
    state: str = Query(default=""),
    error: str = Query(default=""),
):
    redirect_base = settings.FRONTEND_OAUTH_REDIRECT.rstrip("/")

    if error:
        return RedirectResponse(
            url=f"{redirect_base}?integrations={platform}&status=error&message={error}"
        )

    # ── Trello special case ──────────────────────────────────────────────────
    # Trello redirects back with ?token=<TOKEN>&state=... (NOT ?code=...)
    # We extract the token and pass it as the `code` argument to handle_oauth_callback.
    if platform == "trello":
        trello_token = request.query_params.get("token", "")
        if not trello_token:
            return RedirectResponse(
                url=f"{redirect_base}?integrations={platform}&status=error&message=trello_token_missing"
            )
        if not state:
            return RedirectResponse(
                url=f"{redirect_base}?integrations={platform}&status=error&message=missing_state"
            )
        try:
            await integration_service.handle_oauth_callback(platform, trello_token, state)
            return RedirectResponse(url=f"{redirect_base}?integrations={platform}&status=connected")
        except AppException as exc:
            return RedirectResponse(
                url=f"{redirect_base}?integrations={platform}&status=error&message={exc.message}"
            )
        except Exception as exc:
            return RedirectResponse(
                url=f"{redirect_base}?integrations={platform}&status=error&message={str(exc)}"
            )

    # ── Standard OAuth code-exchange providers ───────────────────────────────
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
