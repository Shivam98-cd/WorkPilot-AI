"""
Central registry of supported third-party integrations.
All 12 platforms: Gmail, Google Calendar, Google Drive, Google Meet,
GitHub, Jira, Slack, Zoom, Microsoft Teams, Outlook, Microsoft 365,
Notion, Trello.
"""
from typing import Any, Dict, List

PLATFORMS: Dict[str, Dict[str, Any]] = {
    # ── Google Workspace ─────────────────────────────────────────────────
    "gmail": {
        "displayName": "Gmail",
        "description": "Read, send and triage emails",
        "category": "communication",
        "available": True,
        "oauthProvider": "google",
        "scopes": [
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/userinfo.email",
        ],
        "features": ["emails"],
        "agentClass": "GoogleWorkspaceAgent",
    },
    "google_calendar": {
        "displayName": "Google Calendar",
        "description": "Sync events and schedule meetings",
        "category": "productivity",
        "available": True,
        "oauthProvider": "google",
        "scopes": [
            "https://www.googleapis.com/auth/calendar.readonly",
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/userinfo.email",
        ],
        "features": ["calendar"],
        "agentClass": "GoogleWorkspaceAgent",
    },
    "google_drive": {
        "displayName": "Google Drive",
        "description": "Access and manage files in Drive",
        "category": "storage",
        "available": True,
        "oauthProvider": "google",
        "scopes": [
            "https://www.googleapis.com/auth/drive.readonly",
            "https://www.googleapis.com/auth/userinfo.email",
        ],
        "features": ["documents", "files"],
        "agentClass": "GoogleWorkspaceAgent",
    },
    "google_meet": {
        "displayName": "Google Meet",
        "description": "Create and join video meetings",
        "category": "communication",
        "available": True,
        "oauthProvider": "google",
        "scopes": [
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/userinfo.email",
        ],
        "features": ["calendar", "video"],
        "agentClass": "GoogleWorkspaceAgent",
    },
    # ── Development Tools ────────────────────────────────────────────────
    "github": {
        "displayName": "GitHub",
        "description": "Monitor PRs, issues and deployments",
        "category": "development",
        "available": True,
        "oauthProvider": "github",
        "scopes": ["read:user", "repo", "workflow"],
        "features": ["deployments", "issues"],
        "agentClass": "DevToolsAgent",
    },
    "jira": {
        "displayName": "Jira",
        "description": "Track project tasks and sprints",
        "category": "development",
        "available": True,
        "oauthProvider": "jira",
        "scopes": ["read:jira-work", "write:jira-work"],
        "features": ["team", "issues"],
        "agentClass": "DevToolsAgent",
    },
    # ── Communication ────────────────────────────────────────────────────
    "slack": {
        "displayName": "Slack",
        "description": "Send messages and notifications",
        "category": "communication",
        "available": True,
        "oauthProvider": "slack",
        "scopes": ["channels:read", "chat:write", "users:read", "im:write"],
        "features": ["notifications"],
        "agentClass": "CommunicationAgent",
    },
    "zoom": {
        "displayName": "Zoom",
        "description": "Create and join meetings instantly",
        "category": "communication",
        "available": True,
        "oauthProvider": "zoom",
        "scopes": ["meeting:read", "meeting:write", "user:read"],
        "features": ["calendar", "video"],
        "agentClass": "CommunicationAgent",
    },
    # ── Microsoft ────────────────────────────────────────────────────────
    "microsoft_teams": {
        "displayName": "Microsoft Teams",
        "description": "Sync with MS Teams workspace",
        "category": "communication",
        "available": True,
        "oauthProvider": "microsoft",
        "scopes": ["User.Read", "Calendars.Read", "Chat.ReadWrite", "Team.ReadBasic.All"],
        "features": ["calendar", "notifications"],
        "agentClass": "MicrosoftAgent",
    },
    "outlook": {
        "displayName": "Outlook",
        "description": "Manage Outlook emails and calendar",
        "category": "communication",
        "available": True,
        "oauthProvider": "microsoft",
        "scopes": ["Mail.Read", "Mail.Send", "Calendars.ReadWrite", "User.Read"],
        "features": ["emails", "calendar"],
        "agentClass": "MicrosoftAgent",
    },
    "microsoft_365": {
        "displayName": "Microsoft 365",
        "description": "Full Microsoft 365 suite integration",
        "category": "productivity",
        "available": True,
        "oauthProvider": "microsoft",
        "scopes": ["Mail.Read", "Files.Read", "Sites.Read.All", "User.Read"],
        "features": ["emails", "documents", "calendar"],
        "agentClass": "MicrosoftAgent",
    },
    # ── Productivity ─────────────────────────────────────────────────────
    "notion": {
        "displayName": "Notion",
        "description": "Sync notes, tasks and wikis",
        "category": "productivity",
        "available": True,
        "oauthProvider": "notion",
        "scopes": [],
        "features": ["documents"],
        "agentClass": "ProductivityAgent",
    },
    "trello": {
        "displayName": "Trello",
        "description": "Manage boards, lists and cards",
        "category": "productivity",
        "available": True,
        "oauthProvider": "trello",
        "scopes": ["read", "write"],
        "features": ["team", "tasks"],
        "agentClass": "ProductivityAgent",
    },
}


def list_platforms() -> List[str]:
    return list(PLATFORMS.keys())


def get_platform(platform: str) -> Dict[str, Any]:
    if platform not in PLATFORMS:
        raise KeyError(platform)
    return PLATFORMS[platform]
