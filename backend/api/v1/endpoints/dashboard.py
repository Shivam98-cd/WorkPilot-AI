"""Aggregated dashboard data endpoint.

This gives clients one authenticated, consistent snapshot instead of requiring
each widget to compose a mix of mock and live sources.
"""
from fastapi import APIRouter, Depends

from middleware.auth import get_current_user
from services.integration_service import integration_service
from services.workspace_service import workspace_service


router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
async def dashboard_summary(current_user=Depends(get_current_user)):
    uid = current_user["uid"]
    emails = await integration_service.list_user_emails(uid)
    provider_events = await integration_service.list_user_events(uid)
    workspace_events = await workspace_service.list_calendar_events(uid)
    team = await workspace_service.list_team_members(uid)
    deployments = [
        *await integration_service.list_user_deployments(uid),
        *await workspace_service.list_records(workspace_service.DEPLOYMENTS, uid),
    ]
    documents = await workspace_service.list_records(workspace_service.DOCUMENTS, uid)
    integrations = await integration_service.list_for_user(uid)
    notifications = await workspace_service.list_notifications(uid)
    urgent_emails = sum(1 for email in emails if email.get("priority") in {"urgent", "high"} and not email.get("read"))
    delayed_members = sum(1 for member in team if member.get("status") in {"delayed", "missing"})
    return {
        "success": True,
        "data": {
            "counts": {
                "emails": len(emails), "urgentEmails": urgent_emails,
                "events": len(provider_events) + len(workspace_events), "teamMembers": len(team),
                "deployments": len(deployments), "documents": len(documents),
                "connectedIntegrations": sum(1 for item in integrations if item["connected"]),
                "notifications": sum(1 for item in notifications if not item.get("read")),
            },
            "alerts": [
                *([{"kind": "email", "message": f"{urgent_emails} unread high-priority emails"}] if urgent_emails else []),
                *([{"kind": "team", "message": f"{delayed_members} team members need attention"}] if delayed_members else []),
            ],
            "email": emails[:5], "calendar": [*provider_events, *workspace_events][:5],
            "team": team[:5], "deployments": deployments[:5], "documents": documents[:5],
            "analytics": await workspace_service.analytics_summary(uid),
        },
    }
