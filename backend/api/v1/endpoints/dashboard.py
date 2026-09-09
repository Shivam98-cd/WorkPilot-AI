"""Aggregated dashboard data endpoint.

One authenticated snapshot for all home widgets — fetches in parallel with
safe fallbacks so a slow Gmail/GitHub call cannot block the whole dashboard.

Performance optimisations applied in this revision
───────────────────────────────────────────────────
1. **Integrations fetched once**: integration_repository.list_for_user() is called
   a single time and the result is used both to drive the Gmail/Calendar/GitHub
   lookups and to build the integrations panel list.  Previously there were three
   individual Firestore reads (gmail / google_calendar / github) *plus* a full
   list query — four reads for the same data.

2. **Analytics computed in memory**: workspace_service.analytics_summary_from_data()
   is passed the team + ai_actions lists that were already fetched in the main
   asyncio.gather(), eliminating two additional Firestore round-trips.

3. **Cache TTL raised to 300 s** (from 30 s).  The invalidate-cache endpoint
   lets callers flush the cache after any user action that changes data (email
   send, calendar create, integration connect/disconnect, etc.).

4. **Lightweight PERF timing** is emitted via response headers so latency can be
   measured without polluting log files. Headers are stripped by the CDN/proxy in
   production if desired.
"""
import asyncio
import logging
import time
from typing import Any, Awaitable, Dict, List, Optional, TypeVar

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from middleware.auth import get_current_user
from repositories.integration_repository import integration_repository
from models.integration import UserIntegration
from services.integration_service import integration_service
from services.workspace_service import workspace_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])
logger = logging.getLogger(__name__)

T = TypeVar("T")

# ── Per-user TTL cache ─────────────────────────────────────────────────────────
# Key  : uid
# Value: {"data": result_dict, "ts": float}
# 300 s  = 5 minutes.  The invalidate-cache endpoint flushes it on demand.
_CACHE: Dict[str, Dict] = {}
_CACHE_TTL = 300  # seconds


async def _safe(coro: Awaitable[T], default: T) -> T:
    """Await a coroutine and return *default* on any exception."""
    try:
        return await coro
    except Exception:
        return default


def _ms(start: float) -> int:
    """Return elapsed milliseconds since *start*."""
    return int((time.monotonic() - start) * 1000)


# ── Cache invalidation helper (used by other endpoints to bust the cache) ──────

def invalidate_cache_for_user(uid: str) -> None:
    """Remove the cached dashboard for *uid*.  Safe to call from any endpoint."""
    _CACHE.pop(uid, None)


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("/invalidate-cache")
async def invalidate_dashboard_cache(current_user=Depends(get_current_user)):
    """Force-clear the dashboard cache for the current user."""
    uid = current_user["uid"]
    _CACHE.pop(uid, None)
    return {"success": True, "message": "Dashboard cache cleared. Next load will fetch fresh data."}


@router.get("/summary")
async def dashboard_summary(current_user=Depends(get_current_user)):
    uid = current_user["uid"]
    req_start = time.monotonic()

    # ── Cache HIT ──────────────────────────────────────────────────────────────
    cached = _CACHE.get(uid)
    if cached and (time.monotonic() - cached["ts"]) < _CACHE_TTL:
        age = int(time.monotonic() - cached["ts"])
        response = JSONResponse(content=cached["data"])
        response.headers["X-Cache"] = "HIT"
        response.headers["X-Cache-Age"] = str(age)
        response.headers["X-Perf-Total"] = f"{_ms(req_start)}ms"
        return response

    # ── Phase 1: Fetch all integration records ONCE ────────────────────────────
    # This single list_for_user() call replaces three individual
    # integration_repository.get() calls that previously ran inside
    # list_user_emails / list_user_events / list_user_deployments.
    t_intg = time.monotonic()
    all_integration_records: List[UserIntegration] = await _safe(
        integration_repository.list_for_user(uid), []
    )
    intg_ms = _ms(t_intg)

    # Build a platform → record map (connected-only and all-platforms variant)
    connected_map: Dict[str, UserIntegration] = {
        r.platform: r
        for r in all_integration_records
        if r.status == "connected"
    }

    # ── Phase 2: Parallel fetch of all data ───────────────────────────────────
    # Pass the pre-fetched integration records directly to avoid extra DB reads.
    t_fetch = time.monotonic()
    (
        emails,
        provider_events,
        workspace_events,
        team,
        provider_deployments,
        workspace_deployments,
        documents,
        notifications,
        ai_actions,
    ) = await asyncio.gather(
        _safe(_list_emails_with_record(uid, connected_map.get("gmail")), []),
        _safe(_list_events_with_record(uid, connected_map.get("google_calendar")), []),
        _safe(workspace_service.list_calendar_events(uid), []),
        _safe(workspace_service.list_team_members(uid), []),
        _safe(_list_deployments_with_record(uid, connected_map.get("github")), []),
        _safe(workspace_service.list_records(workspace_service.DEPLOYMENTS, uid), []),
        _safe(workspace_service.list_records(workspace_service.DOCUMENTS, uid), []),
        _safe(workspace_service.list_notifications(uid), []),
        _safe(workspace_service.list_records(workspace_service.AI_ACTIONS, uid), []),
    )
    fetch_ms = _ms(t_fetch)

    # ── Phase 3: Build integrations panel list from already-fetched records ────
    integrations = await _safe(
        integration_service.build_integrations_list_from_records(all_integration_records), []
    )

    # ── Phase 4: Compute analytics in memory — NO extra Firestore queries ──────
    t_proc = time.monotonic()
    analytics = workspace_service.analytics_summary_from_data(team, ai_actions)

    deployments = [*provider_deployments, *workspace_deployments]
    calendar    = [*provider_events, *workspace_events]

    # No fallback mock data - return real data only
    # Empty arrays will be handled gracefully by the frontend
    if not analytics or not analytics.get("focus_hours"):
        analytics = {
            "focus_hours": 0,
            "emails_handled": 0,
            "tasks_completed": 0,
            "ai_time_saved": 0,
            "productivity_score": 0,
            "streak_days": 0,
            "best_day": "N/A",
            "weekly_data": [0, 0, 0, 0, 0, 0, 0],
            "time_breakdown": {"deep_work": 0, "meetings": 0, "email_triage": 0, "admin": 0}
        }

    urgent_emails = sum(
        1 for email in emails
        if email.get("priority") in {"urgent", "high"} and not email.get("read")
    )
    delayed_members = sum(
        1 for member in team if member.get("status") in {"delayed", "missing"}
    )
    proc_ms = _ms(t_proc)

    # Build dynamic alerts based on real data
    alerts = []
    if urgent_emails > 0:
        alerts.append({"id": 1, "kind": "email", "message": f"🔴 {urgent_emails} urgent email{'s' if urgent_emails > 1 else ''} need attention"})
    if delayed_members > 0:
        alerts.append({"id": 2, "kind": "team", "message": f"🟡 {delayed_members} team member{'s' if delayed_members > 1 else ''} need follow-up"})
    
    # Add deployment alerts if any deployments exist
    live_deployments = [d for d in deployments if d.get("status") == "live"]
    if live_deployments:
        alerts.append({"id": 3, "kind": "deploy", "message": f"🔵 {len(live_deployments)} deployment{'s' if len(live_deployments) > 1 else ''} running healthy"})
    
    # If no alerts, add a welcome message
    if not alerts:
        alerts.append({"id": 1, "kind": "info", "message": "✨ All systems operational - no urgent items"})

    result = {
        "success": True,
        "data": {
            "counts": {
                "emails": len(emails),
                "urgentEmails": urgent_emails,
                "events": len(calendar),
                "teamMembers": len(team),
                "deployments": len(deployments),
                "documents": len(documents),
                "connectedIntegrations": sum(1 for item in integrations if item.get("connected")),
                "notifications": sum(1 for item in notifications if not item.get("read")),
            },
            "alerts": alerts,
            "email":        emails[:5],
            "calendar":     calendar[:5],
            "team":         team[:5],
            "deployments":  deployments[:5],
            "documents":    documents[:5],
            "analytics":    analytics,
            "aiActions": ai_actions[:5] if ai_actions else [],
            "integrations": integrations,
        },
    }

    total_ms = _ms(req_start)
    logger.debug(
        "[PERF] dashboard uid=%s intg=%dms fetch=%dms proc=%dms total=%dms",
        uid[:8], intg_ms, fetch_ms, proc_ms, total_ms,
    )

    _CACHE[uid] = {"data": result, "ts": time.monotonic()}
    response = JSONResponse(content=result)
    response.headers["X-Cache"] = "MISS"
    response.headers["X-Perf-Intg"] = f"{intg_ms}ms"
    response.headers["X-Perf-Fetch"] = f"{fetch_ms}ms"
    response.headers["X-Perf-Proc"] = f"{proc_ms}ms"
    response.headers["X-Perf-Total"] = f"{total_ms}ms"
    return response


# ── Internal helpers that accept a pre-fetched record ─────────────────────────
# These mirror integration_service.list_user_* but skip the Firestore read
# because the record has already been fetched via list_for_user().

async def _list_emails_with_record(uid: str, record: Optional[Any]) -> List[Dict]:
    """Fetch Gmail messages using a pre-fetched integration record."""
    if not record or record.status != "connected":
        return []
    token = await integration_service._get_valid_google_token(uid, "gmail", record)
    if not token:
        return []
    messages = await integration_service._fetch_gmail_messages(token)
    return [integration_service._normalize_gmail_message(m) for m in messages]


async def _list_events_with_record(uid: str, record: Optional[Any]) -> List[Dict]:
    """Fetch Google Calendar events using a pre-fetched integration record."""
    if not record or record.status != "connected":
        return []
    token = await integration_service._get_valid_google_token(uid, "google_calendar", record)
    if not token:
        return []
    events = await integration_service._fetch_google_calendar_events(token)
    return [integration_service._normalize_google_calendar_event(e) for e in events]


async def _list_deployments_with_record(uid: str, record: Optional[Any]) -> List[Dict]:
    """Fetch GitHub deployments using a pre-fetched integration record."""
    if not record or record.status != "connected":
        return []
    from core.crypto import decrypt_value
    token = decrypt_value(record.access_token_enc) if record.access_token_enc else None
    if not token:
        return []
    projects = await integration_service._fetch_github_projects(token)
    return [integration_service._normalize_github_project(p) for p in projects]
