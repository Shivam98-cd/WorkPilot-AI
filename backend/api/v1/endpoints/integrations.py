"""
Integrations API — connect third-party workspace tools.
"""
import json
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import HTMLResponse, RedirectResponse

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
async def authorize_integration(
    platform: str,
    redirect_origin: Optional[str] = Query(default=None),
    current_user=Depends(get_current_user),
):
    uid = current_user["uid"]
    try:
        url = integration_service.build_authorize_url(uid, platform, redirect_origin=redirect_origin)
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
    # Dynamically determine frontend redirect destination:
    # 1. Origin provided when authorize was started (e.g. https://workpilot-ai.in)
    # 2. Configured FRONTEND_OAUTH_REDIRECT
    pending_state = integration_service.get_oauth_state(state) if state else None
    origin = (pending_state and pending_state.get("redirectOrigin"))
    if origin:
        clean_origin = origin.rstrip("/")
        redirect_base = f"{clean_origin}/dashboard" if not clean_origin.endswith("/dashboard") else clean_origin
    else:
        redirect_base = settings.FRONTEND_OAUTH_REDIRECT.rstrip("/")

    if error:
        return RedirectResponse(
            url=f"{redirect_base}?integrations={platform}&status=error&message={error}"
        )

    # ── Trello special case ──────────────────────────────────────────────────
    # Trello implicit flow returns the token in the URL fragment (#token=...).
    # Because URL fragments are only available on the client-side,
    # if token is not in query params, we render a client-side bridge page
    # that reads window.location.hash and redirects back here with ?token=...
    if platform == "trello":
        trello_token = request.query_params.get("token", "")
        if not trello_token:
            escaped_redirect = json.dumps(redirect_base)
            escaped_state = json.dumps(state)
            bridge_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connecting Trello | WorkPilot AI</title>
  <style>
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      background: #08080b;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }}
    .bridge-card {{
      background: #111118;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 40px 32px;
      text-align: center;
      max-width: 380px;
      width: 90%;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
    }}
    .spinner {{
      width: 44px;
      height: 44px;
      border: 3px solid rgba(59, 130, 246, 0.18);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 20px;
    }}
    @keyframes spin {{ to {{ transform: rotate(360deg); }} }}
    h2 {{ font-size: 1.2rem; font-weight: 600; margin: 0 0 8px; letter-spacing: -0.01em; }}
    p {{ font-size: 0.88rem; color: rgba(255, 255, 255, 0.55); margin: 0; line-height: 1.5; }}
  </style>
</head>
<body>
  <div class="bridge-card">
    <div class="spinner"></div>
    <h2>Connecting Trello</h2>
    <p>Completing authorization securely, please wait a moment...</p>
  </div>
  <script>
    (function() {{
      try {{
        var hash = window.location.hash.substring(1);
        var hashParams = new URLSearchParams(hash);
        var token = hashParams.get('token');
        var searchParams = new URLSearchParams(window.location.search);
        var state = searchParams.get('state') || {escaped_state};
        var redirectBase = {escaped_redirect};

        if (token && state) {{
          window.location.replace(window.location.pathname + '?token=' + encodeURIComponent(token) + '&state=' + encodeURIComponent(state));
        }} else if (token) {{
          window.location.replace(window.location.pathname + '?token=' + encodeURIComponent(token));
        }} else {{
          var err = hashParams.get('error') || searchParams.get('error') || 'trello_token_missing';
          var delim = redirectBase.indexOf('?') >= 0 ? '&' : '?';
          window.location.replace(redirectBase + delim + 'integrations=trello&status=error&message=' + encodeURIComponent(err));
        }}
      }} catch (e) {{
        var redirectBase = {escaped_redirect};
        var delim = redirectBase.indexOf('?') >= 0 ? '&' : '?';
        window.location.replace(redirectBase + delim + 'integrations=trello&status=error&message=' + encodeURIComponent(e.message));
      }}
    }})();
  </script>
</body>
</html>"""
            return HTMLResponse(content=bridge_html)

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


@router.get("/{platform}/data")
async def get_platform_data(
    platform: str,
    data_type: str = Query(default="list", description="Action/data type e.g. list, list_tickets, search, sprint_status"),
    limit: int = Query(default=20, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    """Retrieve platform data (Jira tickets, GitHub repos/issues, etc.)."""
    uid = current_user["uid"]
    data = await integration_service.get_platform_data(uid, platform, action=data_type, limit=limit)
    return {"success": True, "data": data}


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
