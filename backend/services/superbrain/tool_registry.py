# WorkPilot SuperBrain — Tool Registry
"""
Complete tool suite: 30 tools for the SuperBrain orchestrator.
Compatible with both Groq (function_calling) and Google Gemini formats.
"""

ALL_TOOLS = [
    # ── Existing 18 tools ─────────────────────────────────────────────────────
    {"type": "function", "function": {
        "name": "get_emails",
        "description": "Fetch emails from Gmail. ALWAYS call before discussing emails, inbox, or messages. Never fabricate email data.",
        "parameters": {"type": "object", "properties": {
            "limit":  {"type": "integer", "default": 10, "description": "Number of emails to fetch"},
            "filter": {"type": "string", "enum": ["urgent", "unread", "today", "all"], "description": "Filter type"},
        }, "required": []},
    }},
    {"type": "function", "function": {
        "name": "get_calendar_events",
        "description": "Fetch Google Calendar events. ALWAYS call before discussing schedule, meetings, or appointments.",
        "parameters": {"type": "object", "properties": {
            "days_ahead": {"type": "integer", "default": 3, "description": "Days ahead to fetch"},
        }, "required": []},
    }},
    {"type": "function", "function": {
        "name": "get_team_members",
        "description": "Get team member status and task progress. Call before discussing team, standup, or member status.",
        "parameters": {"type": "object", "properties": {
            "status_filter": {"type": "string", "enum": ["delayed", "on-track", "done", "missing", "all"]},
        }, "required": []},
    }},
    {"type": "function", "function": {
        "name": "get_deployments",
        "description": "Get deployment pipeline status. Call before discussing deployments or build status.",
        "parameters": {"type": "object", "properties": {
            "environment": {"type": "string", "enum": ["production", "staging", "dev", "all"]},
        }, "required": []},
    }},
    {"type": "function", "function": {
        "name": "get_analytics",
        "description": "Get productivity analytics and metrics. Call before discussing productivity, focus hours, or performance.",
        "parameters": {"type": "object", "properties": {
            "period": {"type": "string", "enum": ["today", "week", "month"], "default": "week"},
        }, "required": []},
    }},
    {"type": "function", "function": {
        "name": "get_integrations_status",
        "description": "Get status of all connected platforms. Call when asked about integrations or connected apps.",
        "parameters": {"type": "object", "properties": {}, "required": []},
    }},
    {"type": "function", "function": {
        "name": "compose_email",
        "description": "Draft and send an email. REQUIRED: full recipient email (e.g. john@example.com), subject, and body. Ask user for any missing fields.",
        "parameters": {"type": "object", "properties": {
            "to":              {"type": "string", "description": "Full recipient email address"},
            "subject":         {"type": "string", "description": "Email subject line"},
            "body":            {"type": "string", "description": "Complete email body"},
            "tone":            {"type": "string", "enum": ["professional", "casual", "urgent", "friendly"]},
            "original_prompt": {"type": "string", "description": "User's original request for context"},
        }, "required": ["to", "subject", "body"]},
    }},
    {"type": "function", "function": {
        "name": "improve_text",
        "description": "Improve, rephrase, or fix grammar in text.",
        "parameters": {"type": "object", "properties": {
            "text": {"type": "string"},
            "mode": {"type": "string", "enum": ["rephrase", "improve", "fix_grammar", "make_professional", "shorten", "expand"]},
        }, "required": ["text", "mode"]},
    }},
    {"type": "function", "function": {
        "name": "sync_integration",
        "description": "Trigger a sync for a connected platform.",
        "parameters": {"type": "object", "properties": {
            "platform": {"type": "string", "description": "Platform name to sync"},
        }, "required": ["platform"]},
    }},
    {"type": "function", "function": {
        "name": "create_calendar_event",
        "description": "Create a Google Calendar event. Use when user asks to schedule, book, or create a meeting.",
        "parameters": {"type": "object", "properties": {
            "title":            {"type": "string"},
            "date":             {"type": "string"},
            "time":             {"type": "string"},
            "duration_minutes": {"type": "integer", "default": 30},
            "attendees":        {"type": "array", "items": {"type": "string"}},
            "description":      {"type": "string"},
        }, "required": ["title", "date", "time"]},
    }},
    {"type": "function", "function": {
        "name": "create_meet_and_email",
        "description": "Create a Google Calendar event with Meet link, then send Gmail invitations to attendees.",
        "parameters": {"type": "object", "properties": {
            "title":            {"type": "string"},
            "date":             {"type": "string"},
            "time":             {"type": "string"},
            "duration_minutes": {"type": "integer", "default": 30},
            "attendees":        {"type": "array", "items": {"type": "string"}, "description": "At least 2 email addresses"},
            "description":      {"type": "string"},
        }, "required": ["title", "date", "time", "attendees"]},
    }},
    {"type": "function", "function": {
        "name": "search_workspace",
        "description": "Search across emails, documents, and calendar. Use when user asks to find something.",
        "parameters": {"type": "object", "properties": {
            "query":   {"type": "string"},
            "sources": {"type": "array", "items": {"type": "string"}, "description": "Sources to search: emails, calendar, docs"},
        }, "required": ["query"]},
    }},
    {"type": "function", "function": {
        "name": "schedule_automation",
        "description": "Create a scheduled automation task for recurring AI actions.",
        "parameters": {"type": "object", "properties": {
            "type":     {"type": "string", "enum": ["daily_briefing", "auto_reply", "weekly_report", "meeting_digest", "custom"]},
            "name":     {"type": "string"},
            "schedule": {"type": "string", "description": "Cron or natural language schedule"},
            "config":   {"type": "object"},
        }, "required": ["type", "name", "schedule"]},
    }},
    {"type": "function", "function": {
        "name": "generate_report",
        "description": "Generate a productivity or analytics report.",
        "parameters": {"type": "object", "properties": {
            "type":             {"type": "string", "enum": ["weekly", "monthly", "productivity", "team"]},
            "include_sections": {"type": "array", "items": {"type": "string"}},
        }, "required": ["type"]},
    }},
    {"type": "function", "function": {
        "name": "find_meeting_time",
        "description": "Find the best meeting time slots based on calendars. Use when asked to find free time.",
        "parameters": {"type": "object", "properties": {
            "attendees":        {"type": "array", "items": {"type": "string"}},
            "duration_minutes": {"type": "integer", "default": 30},
            "preferred_days":   {"type": "array", "items": {"type": "string"}},
        }, "required": ["attendees"]},
    }},
    {"type": "function", "function": {
        "name": "summarize_document",
        "description": "Summarize a document or long text.",
        "parameters": {"type": "object", "properties": {
            "content": {"type": "string"},
            "style":   {"type": "string", "enum": ["brief", "detailed", "bullets", "executive"]},
        }, "required": ["content"]},
    }},
    {"type": "function", "function": {
        "name": "task_management",
        "description": "Create, list, update, or complete tasks. Use when user says 'add task', 'my tasks', 'mark done', etc.",
        "parameters": {"type": "object", "properties": {
            "action":   {"type": "string", "enum": ["create", "list", "update", "delete", "complete"]},
            "title":    {"type": "string", "description": "Task title for create/update"},
            "task_id":  {"type": "string", "description": "Task ID for update/delete/complete"},
            "priority": {"type": "string", "enum": ["high", "medium", "low"], "default": "medium"},
            "due_date": {"type": "string", "description": "Due date e.g. 'tomorrow', '2026-09-10'"},
            "assignee": {"type": "string", "description": "Name or email of assignee"},
        }, "required": ["action"]},
    }},
    {"type": "function", "function": {
        "name": "notion_tool",
        "description": "Interact with Notion: read databases, create/update pages, search content, append blocks.",
        "parameters": {"type": "object", "properties": {
            "action":      {"type": "string", "enum": ["read_database", "create_page", "update_page", "search", "append_block", "list_databases"]},
            "database_id": {"type": "string"},
            "page_id":     {"type": "string"},
            "title":       {"type": "string"},
            "content":     {"type": "string"},
            "properties":  {"type": "object"},
            "query":       {"type": "string"},
            "limit":       {"type": "integer", "default": 10},
        }, "required": ["action"]},
    }},

    # ── New 12 SuperBrain tools ────────────────────────────────────────────────
    {"type": "function", "function": {
        "name": "diagnose_issue",
        "description": "Diagnose root cause of any issue: integration failures, auth errors, performance, data problems, etc. Call this when a tool fails, something is broken, or the user reports an error.",
        "parameters": {"type": "object", "properties": {
            "issue_type":  {"type": "string", "enum": ["integration", "auth", "performance", "data", "network", "code", "unknown"]},
            "description": {"type": "string", "description": "Detailed description of the issue"},
            "component":   {"type": "string", "description": "Which component/integration is affected"},
        }, "required": ["issue_type", "description"]},
    }},
    {"type": "function", "function": {
        "name": "set_reminder",
        "description": "Set a smart reminder with context. Use when user says 'remind me', 'don't forget', 'alert me'.",
        "parameters": {"type": "object", "properties": {
            "title":   {"type": "string", "description": "Reminder title"},
            "time":    {"type": "string", "description": "Time for reminder e.g. '3:00 PM', 'tomorrow 9 AM'"},
            "message": {"type": "string", "description": "Reminder message or context"},
            "repeat":  {"type": "string", "enum": ["once", "daily", "weekly"], "default": "once"},
        }, "required": ["title", "time"]},
    }},
    {"type": "function", "function": {
        "name": "web_search",
        "description": "Search the web for real-time information. Use when the user asks about current events, facts, or anything that needs live data.",
        "parameters": {"type": "object", "properties": {
            "query":       {"type": "string", "description": "Search query"},
            "num_results": {"type": "integer", "default": 5, "description": "Number of results to return"},
        }, "required": ["query"]},
    }},
    {"type": "function", "function": {
        "name": "github_tool",
        "description": "Interact with GitHub: list PRs, issues, commits, create issues. Use when user asks about GitHub repositories.",
        "parameters": {"type": "object", "properties": {
            "action": {"type": "string", "enum": ["list_prs", "list_issues", "get_commits", "create_issue"]},
            "repo":   {"type": "string", "description": "Repository name e.g. 'org/repo'"},
            "limit":  {"type": "integer", "default": 10},
            "title":  {"type": "string", "description": "Issue title for create_issue"},
            "body":   {"type": "string", "description": "Issue body for create_issue"},
        }, "required": ["action"]},
    }},
    {"type": "function", "function": {
        "name": "jira_tool",
        "description": "Interact with Jira: list tickets, sprint status, create/update tickets. Use when user asks about Jira.",
        "parameters": {"type": "object", "properties": {
            "action":      {"type": "string", "enum": ["list_tickets", "get_sprint", "create_ticket", "update_ticket"]},
            "project_key": {"type": "string", "description": "Jira project key e.g. 'WP'"},
            "ticket_id":   {"type": "string", "description": "Ticket ID for update"},
            "summary":     {"type": "string", "description": "Ticket summary for create"},
            "description": {"type": "string"},
            "status":      {"type": "string", "description": "New status for update"},
        }, "required": ["action"]},
    }},
    {"type": "function", "function": {
        "name": "slack_tool",
        "description": "Interact with Slack: send messages, list channels, get channel history. Use when user asks about Slack.",
        "parameters": {"type": "object", "properties": {
            "action":  {"type": "string", "enum": ["send_message", "list_channels", "get_channel_history"]},
            "channel": {"type": "string", "description": "Channel name or ID"},
            "message": {"type": "string", "description": "Message to send"},
            "limit":   {"type": "integer", "default": 20},
        }, "required": ["action"]},
    }},
    {"type": "function", "function": {
        "name": "zoom_tool",
        "description": "Interact with Zoom: list or create meetings. Use when user asks about Zoom meetings.",
        "parameters": {"type": "object", "properties": {
            "action":     {"type": "string", "enum": ["list_meetings", "create_meeting"]},
            "topic":      {"type": "string", "description": "Meeting topic for create"},
            "start_time": {"type": "string", "description": "ISO 8601 start time for create"},
            "duration":   {"type": "integer", "default": 30, "description": "Duration in minutes"},
        }, "required": ["action"]},
    }},
    {"type": "function", "function": {
        "name": "analyze_data",
        "description": "Analyze data (JSON, CSV, text) for summary, trends, anomalies, or forecast. Use when user provides data to analyze.",
        "parameters": {"type": "object", "properties": {
            "data":          {"type": "string", "description": "The data to analyze (JSON, CSV, or plain text)"},
            "analysis_type": {"type": "string", "enum": ["summary", "trends", "anomalies", "forecast"]},
        }, "required": ["data", "analysis_type"]},
    }},
    {"type": "function", "function": {
        "name": "get_weather",
        "description": "Get current weather and forecast for any city. Use when user asks about weather or temperature.",
        "parameters": {"type": "object", "properties": {
            "location": {"type": "string", "description": "City name e.g. 'New Delhi', 'London'"},
            "units":    {"type": "string", "enum": ["celsius", "fahrenheit"], "default": "celsius"},
        }, "required": ["location"]},
    }},
    {"type": "function", "function": {
        "name": "get_news_briefing",
        "description": "Get a curated news digest on specified topics. Use when user asks about news or what's trending.",
        "parameters": {"type": "object", "properties": {
            "topics": {"type": "array", "items": {"type": "string"}, "description": "Topics to fetch news for"},
            "limit":  {"type": "integer", "default": 5},
        }, "required": []},
    }},
    {"type": "function", "function": {
        "name": "get_system_health",
        "description": "Run a full workspace health check: integrations, API connections, data freshness. Call when user asks 'is everything working?' or wants a status report.",
        "parameters": {"type": "object", "properties": {
            "check_type": {"type": "string", "enum": ["all", "integrations", "api", "memory"], "default": "all"},
        }, "required": []},
    }},
    {"type": "function", "function": {
        "name": "explain_code",
        "description": "Explain, debug, optimize, or document code. Use when user provides code and asks for help.",
        "parameters": {"type": "object", "properties": {
            "code":     {"type": "string", "description": "The code to analyze"},
            "language": {"type": "string", "description": "Programming language e.g. Python, JavaScript"},
            "action":   {"type": "string", "enum": ["explain", "debug", "optimize", "document"]},
        }, "required": ["code", "action"]},
    }},
]
