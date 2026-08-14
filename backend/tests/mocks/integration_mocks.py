"""
Integration Mock Data Factory

Provides realistic mock data for all integration platforms used in tests.
"""
from datetime import datetime, timedelta
from typing import Any, Dict, List


def mock_gmail_messages(count: int = 5) -> List[Dict[str, Any]]:
    """Generate mock Gmail message list response"""
    return [
        {
            "id": f"msg_{i:04d}",
            "threadId": f"thread_{i:04d}",
            "labelIds": ["INBOX", "UNREAD"] if i % 2 == 0 else ["INBOX"],
            "snippet": f"This is a preview of email number {i}...",
            "payload": {
                "headers": [
                    {"name": "Subject", "value": f"Test Email Subject {i}"},
                    {"name": "From", "value": f"Sender {i} <sender{i}@example.com>"},
                    {"name": "Date", "value": (datetime.utcnow() - timedelta(hours=i)).strftime("%a, %d %b %Y %H:%M:%S +0000")},
                ],
                "body": {"data": "VGVzdCBlbWFpbCBib2R5"},
            },
        }
        for i in range(1, count + 1)
    ]


def mock_google_calendar_events(count: int = 5) -> List[Dict[str, Any]]:
    """Generate mock Google Calendar events response"""
    return {
        "kind": "calendar#events",
        "items": [
            {
                "id": f"event_{i}",
                "summary": f"Meeting {i}",
                "description": f"Description for meeting {i}",
                "start": {"dateTime": (datetime.utcnow() + timedelta(days=i)).isoformat() + "Z"},
                "end": {"dateTime": (datetime.utcnow() + timedelta(days=i, hours=1)).isoformat() + "Z"},
                "attendees": [{"email": f"attendee{j}@example.com"} for j in range(2)],
                "conferenceData": {"entryPoints": [{"uri": f"https://meet.google.com/xyz-{i}"}]},
                "status": "confirmed",
            }
            for i in range(1, count + 1)
        ],
    }


def mock_github_repos(count: int = 5) -> List[Dict[str, Any]]:
    """Generate mock GitHub repositories response"""
    return [
        {
            "id": i * 1000,
            "name": f"repo-{i}",
            "full_name": f"org/repo-{i}",
            "description": f"Description for repository {i}",
            "private": i % 2 == 0,
            "html_url": f"https://github.com/org/repo-{i}",
            "updated_at": (datetime.utcnow() - timedelta(hours=i)).isoformat() + "Z",
            "default_branch": "main",
            "open_issues_count": i * 2,
        }
        for i in range(1, count + 1)
    ]


def mock_github_issues(count: int = 5) -> List[Dict[str, Any]]:
    """Generate mock GitHub issues response"""
    return [
        {
            "id": i * 100,
            "number": i,
            "title": f"Issue #{i}: Bug fix needed",
            "body": f"Description for issue {i}",
            "state": "open" if i % 2 == 0 else "closed",
            "user": {"login": f"developer{i}"},
            "labels": [{"name": "bug"}, {"name": "priority:high" if i < 3 else "priority:normal"}],
            "assignee": {"login": f"developer{i}"} if i % 2 == 0 else None,
            "html_url": f"https://github.com/org/repo/issues/{i}",
            "created_at": (datetime.utcnow() - timedelta(days=i)).isoformat() + "Z",
            "updated_at": (datetime.utcnow() - timedelta(hours=i)).isoformat() + "Z",
        }
        for i in range(1, count + 1)
    ]


def mock_slack_messages(count: int = 5) -> List[Dict[str, Any]]:
    """Generate mock Slack messages response"""
    return {
        "ok": True,
        "messages": [
            {
                "type": "message",
                "user": f"U0{i:03d}ABCDE",
                "text": f"Hello team, this is message {i}",
                "ts": str((datetime.utcnow() - timedelta(minutes=i * 5)).timestamp()),
                "reactions": [{"name": "thumbsup", "count": i}] if i % 2 == 0 else [],
            }
            for i in range(1, count + 1)
        ],
    }


def mock_jira_issues(count: int = 5) -> List[Dict[str, Any]]:
    """Generate mock Jira issues response"""
    return {
        "total": count,
        "issues": [
            {
                "id": str(i * 100),
                "key": f"PROJ-{i}",
                "fields": {
                    "summary": f"[PROJ-{i}] Implement feature {i}",
                    "description": {"content": [{"content": [{"text": f"Description {i}"}]}]},
                    "status": {"name": "In Progress" if i % 2 == 0 else "Open"},
                    "assignee": {"displayName": f"Developer {i}", "emailAddress": f"dev{i}@company.com"},
                    "priority": {"name": "High" if i < 3 else "Medium"},
                    "labels": ["feature", f"sprint-{i}"],
                    "created": (datetime.utcnow() - timedelta(days=i)).isoformat() + "Z",
                    "updated": (datetime.utcnow() - timedelta(hours=i)).isoformat() + "Z",
                },
            }
            for i in range(1, count + 1)
        ],
    }


def mock_notion_pages(count: int = 5) -> List[Dict[str, Any]]:
    """Generate mock Notion pages/database results"""
    return {
        "object": "list",
        "results": [
            {
                "id": f"page-{i:04d}",
                "object": "page",
                "url": f"https://notion.so/page-{i}",
                "properties": {
                    "Name": {"title": [{"text": {"content": f"Page {i}"}}]},
                    "Status": {"select": {"name": "In Progress" if i % 2 == 0 else "Done"}},
                },
                "created_time": (datetime.utcnow() - timedelta(days=i)).isoformat() + "Z",
                "last_edited_time": (datetime.utcnow() - timedelta(hours=i)).isoformat() + "Z",
            }
            for i in range(1, count + 1)
        ],
    }


def mock_trello_cards(count: int = 5) -> List[Dict[str, Any]]:
    """Generate mock Trello cards response"""
    return [
        {
            "id": f"card_{i:04d}",
            "name": f"Task Card {i}",
            "desc": f"Description for card {i}",
            "closed": i % 5 == 0,
            "idList": f"list_{(i % 3) + 1:04d}",
            "idBoard": "board_0001",
            "url": f"https://trello.com/c/card{i}",
            "labels": [{"name": "feature", "color": "blue"}],
            "due": (datetime.utcnow() + timedelta(days=i)).isoformat() + "Z" if i % 2 == 0 else None,
        }
        for i in range(1, count + 1)
    ]


def mock_zoom_meetings(count: int = 3) -> List[Dict[str, Any]]:
    """Generate mock Zoom meetings response"""
    return {
        "page_count": 1,
        "total_records": count,
        "meetings": [
            {
                "id": 1000000 + i,
                "uuid": f"uuid-{i:04d}",
                "topic": f"Team Meeting {i}",
                "type": 2,
                "start_time": (datetime.utcnow() + timedelta(days=i)).isoformat() + "Z",
                "duration": 60,
                "timezone": "UTC",
                "join_url": f"https://zoom.us/j/1000000{i}",
                "status": "waiting",
            }
            for i in range(1, count + 1)
        ],
    }


def mock_microsoft_messages(count: int = 5) -> List[Dict[str, Any]]:
    """Generate mock Microsoft Graph mail messages response"""
    return {
        "@odata.count": count,
        "value": [
            {
                "id": f"msg_ms_{i:04d}",
                "subject": f"Outlook Email {i}",
                "from": {"emailAddress": {"name": f"Sender {i}", "address": f"sender{i}@company.com"}},
                "isRead": i % 2 == 0,
                "receivedDateTime": (datetime.utcnow() - timedelta(hours=i)).isoformat() + "Z",
                "bodyPreview": f"Preview of Outlook email {i}...",
                "importance": "high" if i < 3 else "normal",
            }
            for i in range(1, count + 1)
        ],
    }


def mock_microsoft_events(count: int = 5) -> List[Dict[str, Any]]:
    """Generate mock Microsoft Calendar events response"""
    return {
        "value": [
            {
                "id": f"event_ms_{i}",
                "subject": f"Calendar Event {i}",
                "bodyPreview": f"Event description {i}",
                "start": {"dateTime": (datetime.utcnow() + timedelta(days=i)).isoformat(), "timeZone": "UTC"},
                "end": {"dateTime": (datetime.utcnow() + timedelta(days=i, hours=1)).isoformat(), "timeZone": "UTC"},
                "attendees": [{"emailAddress": {"address": f"attendee{j}@company.com"}} for j in range(2)],
                "isOnlineMeeting": i % 2 == 0,
                "onlineMeetingUrl": f"https://teams.microsoft.com/meet/{i}" if i % 2 == 0 else None,
            }
            for i in range(1, count + 1)
        ],
    }


def mock_oauth_tokens(platform: str = "google") -> Dict[str, Any]:
    """Generate mock OAuth tokens for testing"""
    return {
        "access_token": f"mock_access_token_{platform}_abc123",
        "refresh_token": f"mock_refresh_token_{platform}_xyz789",
        "token_type": "Bearer",
        "expires_in": 3600,
        "scope": "email profile",
    }


def mock_error_response(status_code: int = 401, message: str = "Unauthorized") -> Dict[str, Any]:
    """Generate mock API error response"""
    return {
        "error": {
            "code": str(status_code),
            "message": message,
        }
    }


def mock_rate_limit_response() -> Dict[str, Any]:
    """Generate mock rate limit response"""
    return {
        "error": "rate_limit_exceeded",
        "message": "API rate limit exceeded. Retry after 60 seconds.",
        "retry_after": 60,
    }
