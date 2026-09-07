# WorkPilot SuperBrain — Intent Classifier
"""
Advanced intent detection, entity extraction, and smart suggestions engine.
"""
import re

# ── Intent keyword maps ────────────────────────────────────────────────────────
_CATEGORY_RULES = [
    # (category, keywords)
    ("email",      ["email", "inbox", "unread", "gmail", "message from", "subject",
                    "check email", "read email", "show email", "compose", "draft", "send mail"]),
    ("calendar",   ["calendar", "event", "schedule", "meeting today", "appointment",
                    "today schedule", "what meetings", "plan my day", "google meet",
                    "book meeting", "create event", "add to calendar"]),
    ("team",       ["team", "standup", "member", "overdue", "delayed", "task progress",
                    "team status", "colleague", "who is working"]),
    ("deployment", ["deploy", "pipeline", "production", "staging", "rollback",
                    "build status", "ci/cd", "deployment", "release"]),
    ("analytics",  ["analytics", "productivity", "focus hours", "stats", "metrics",
                    "performance score", "how productive", "weekly report"]),
    ("notion",     ["notion", "notion page", "notion database", "notion doc",
                    "create page in notion", "add to notion", "search notion",
                    "notion task", "notion project", "notion wiki", "notion note"]),
    ("github",     ["github", "pull request", "pr", "issue", "commit", "repository",
                    "code review", "merge", "branch"]),
    ("jira",       ["jira", "ticket", "sprint", "epic", "backlog", "story point"]),
    ("slack",      ["slack", "slack message", "channel", "dm", "#general"]),
    ("zoom",       ["zoom", "zoom meeting", "join meeting", "meeting link", "recording"]),
    ("search",     ["search", "find", "look for", "locate", "where is"]),
    ("task",       ["my tasks", "task list", "add task", "create task", "new task",
                    "mark done", "complete task", "to-do", "todo", "pending tasks"]),
    ("report",     ["generate report", "weekly report", "monthly report",
                    "productivity report", "team report"]),
    ("diagnose",   ["diagnose", "debug", "error", "not working", "broken", "failed",
                    "issue with", "problem with", "why is", "root cause", "fix"]),
    ("reminder",   ["remind me", "set a reminder", "alert me", "don't forget",
                    "reminder for", "remind"]),
    ("code",       ["code", "function", "bug", "refactor", "optimize code",
                    "explain code", "debug code", "write code"]),
    ("weather",    ["weather", "temperature", "forecast", "rain", "sunny", "cold", "hot"]),
    ("news",       ["news", "latest", "trending", "what happened", "briefing", "digest"]),
    ("data",       ["analyze data", "data analysis", "csv", "json data", "trends",
                    "anomaly", "forecast"]),
]

_URGENT_WORDS = {
    "urgent", "asap", "immediately", "critical", "emergency", "right now",
    "now", "fire", "blocker", "p0", "p1", "broken", "down", "outage",
}

# ── Smart suggestions map ──────────────────────────────────────────────────────
_SUGGESTIONS = {
    "email":      ["Draft a reply to the most urgent email",
                   "Show only unread emails",
                   "Summarize all emails from today",
                   "Compose a new email"],
    "calendar":   ["Create a meeting for tomorrow",
                   "Find best time for a team sync",
                   "Show next week's schedule",
                   "Set up a Google Meet with the team"],
    "team":       ["Follow up with delayed team members",
                   "Generate team standup report",
                   "Show team performance analytics",
                   "Assign overdue tasks"],
    "deployment": ["Check staging environment health",
                   "View production deployment logs",
                   "Compare staging vs production",
                   "Rollback to last stable version"],
    "analytics":  ["Generate full weekly report",
                   "Compare productivity with last week",
                   "Show most productive hours",
                   "Analyze time breakdown"],
    "notion":     ["Read my Notion project database",
                   "Create a new Notion page",
                   "Search Notion for meeting notes",
                   "Append content to a Notion page"],
    "github":     ["List open pull requests",
                   "Show issues assigned to me",
                   "Get latest commits",
                   "Create a new GitHub issue"],
    "jira":       ["Show current sprint status",
                   "List my assigned tickets",
                   "Create a new Jira ticket",
                   "Show sprint velocity"],
    "slack":      ["Send a message to #general",
                   "Get channel history",
                   "Update my Slack status",
                   "Search for a message"],
    "zoom":       ["List upcoming meetings",
                   "Create a new meeting",
                   "Get meeting recordings",
                   "Schedule a quick sync"],
    "task":       ["Show all pending tasks",
                   "Mark a task as done",
                   "Assign a task to a team member",
                   "Add a high-priority task"],
    "diagnose":   ["Run a full system health check",
                   "Check integration connection status",
                   "View recent error logs",
                   "Fix authentication issues"],
    "code":       ["Explain this code in detail",
                   "Find bugs in my code",
                   "Optimize for performance",
                   "Generate documentation"],
    "search":     ["Search emails from last week",
                   "Find documents about the project",
                   "Search across all integrations",
                   "Filter by date range"],
    "report":     ["Email the report to the team",
                   "Generate a monthly report",
                   "Show productivity breakdown",
                   "Compare with last month"],
    "reminder":   ["Set a daily briefing reminder",
                   "Remind me about upcoming deadlines",
                   "Create a recurring reminder",
                   "View all my reminders"],
    "weather":    ["Check weather for another city",
                   "Get a 5-day forecast",
                   "Check if I need an umbrella today"],
    "general":    ["Show my morning briefing",
                   "Check all integrations",
                   "Generate this week's report",
                   "What are my top priorities today?",
                   "Run a full workspace health check"],
}

# Tool-specific overrides
_TOOL_SUGGESTIONS = {
    "compose_email":        ["Improve the email tone", "Make it more concise", "Send to another recipient"],
    "create_calendar_event":["Add more attendees", "Find a better time slot", "Set up recurring meeting"],
    "generate_report":      ["Email report to the team", "Generate monthly report", "Show productivity breakdown"],
    "get_integrations_status": ["Connect Gmail for real data", "Sync all platforms", "Run health check"],
    "improve_text":         ["Try a different tone", "Make it shorter", "Apply to another text"],
    "diagnose_issue":       ["Apply the suggested fix", "Run health check again", "Check integration status"],
    "get_weather":          ["Check another city", "Get 5-day forecast"],
    "get_system_health":    ["Fix detected issues", "Reconnect integrations", "Clear error logs"],
}


def classify_intent(message: str) -> dict:
    """
    Classify the intent of a user message.
    Returns {intent, category, priority, entities, requires_tool}
    """
    lower = message.lower().strip()
    words = set(lower.split())

    # Priority detection
    priority = "normal"
    if words & _URGENT_WORDS or "!!!" in message or message.isupper():
        priority = "urgent"
    elif "?" in message and len(message) < 40:
        priority = "low"

    # Category detection (first match wins)
    category = "general"
    for cat, kws in _CATEGORY_RULES:
        if any(kw in lower for kw in kws):
            category = cat
            break

    # Entity extraction
    entities = {
        "emails": re.findall(r"[\w.+-]+@[\w-]+\.\w+", message),
        "urls":   re.findall(r"https?://\S+", message),
        "names":  re.findall(r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b", message),
    }

    # Requires tool?
    requires_tool = category != "general" or any(
        kw in lower for kw in ["check", "show", "get", "fetch", "list", "create",
                                "send", "draft", "find", "search", "generate", "analyze"]
    )

    return {
        "intent":       category,
        "category":     category,
        "priority":     priority,
        "entities":     entities,
        "requires_tool": requires_tool,
    }


def get_forced_tool(message: str) -> str | None:
    """
    Return a specific tool name to force-call based on keywords,
    or None to let the LLM decide.
    """
    lower = message.lower()

    # Google Meet + email → create_meet_and_email
    # OR creating a meeting WITH attendees (email addresses present)
    has_attendees = "@" in lower and any(k in lower for k in ["with", "attendee", "invite", "send to"])
    
    if (any(k in lower for k in ["google meet", "meet link", "meeting link"]) and
            any(k in lower for k in ["email", "send", "invite"])):
        return "create_meet_and_email"
    
    # If creating a meeting WITH email addresses, use create_meet_and_email
    if has_attendees and any(k in lower for k in [
        "create meeting", "schedule meeting", "create event", "schedule event",
        "book meeting", "set up meeting", "meeting with"
    ]):
        return "create_meet_and_email"

    # Compose email
    if "@" in lower and any(k in lower for k in [
        "send email", "send an email", "compose", "draft email",
        "draft an email", "mail to", "write email", "write an email", "email to"
    ]):
        return "compose_email"

    # Diagnose
    if any(k in lower for k in ["diagnose", "root cause", "why is it not", "debug this"]):
        return "diagnose_issue"

    # Calendar create - BUT NOT if attendees/emails are present (that should use create_meet_and_email or let LLM decide)
    has_email_addresses = "@" in lower
    
    if (any(k in lower for k in [
        "create event", "schedule meeting", "schedule a meeting", "book meeting",
        "book a meeting", "add to calendar", "create a meeting", "new meeting"
    ]) or ("create" in lower and "meeting" in lower)):
        # If email addresses present, don't force this tool - let LLM choose between create_calendar_event and create_meet_and_email
        if has_email_addresses:
            return None  # Let LLM decide
        return "create_calendar_event"

    # GitHub
    if any(k in lower for k in ["pull request", "list prs", "github issue", "list issues", "get commits"]):
        return "github_tool"

    # Jira
    if any(k in lower for k in ["jira ticket", "sprint status", "list tickets", "create ticket"]):
        return "jira_tool"

    # Slack
    if any(k in lower for k in ["send slack", "slack message", "post to slack", "slack channel"]):
        return "slack_tool"

    # Weather
    if any(k in lower for k in ["weather", "temperature", "forecast", "rain today"]):
        return "get_weather"

    # System health
    if any(k in lower for k in ["system health", "health check", "all systems", "platform status"]):
        return "get_system_health"

    # Tasks
    if any(k in lower for k in [
        "my tasks", "task list", "add task", "create task", "new task",
        "mark done", "complete task", "to-do", "todo", "pending tasks"
    ]):
        return "task_management"

    # Report
    if any(k in lower for k in ["generate report", "weekly report", "monthly report"]):
        return "generate_report"

    # Automation
    if any(k in lower for k in ["automate", "every day", "auto reply",
                                 "remind me every", "set up automation", "recurring"]):
        return "schedule_automation"

    # Reminder
    if any(k in lower for k in ["remind me", "set a reminder", "set reminder"]):
        return "set_reminder"

    # Email view - BUT NOT if a specific date is mentioned (use search_workspace instead)
    # OR if the context is about adding attendees/participants to meetings
    has_specific_date = any(k in lower for k in [
        "january", "february", "march", "april", "may", "june",
        "july", "august", "september", "october", "november", "december",
        "jan ", "feb ", "mar ", "apr ", "may ", "jun ",
        "jul ", "aug ", "sep ", "oct ", "nov ", "dec ",
        " 1 ", " 2 ", " 3 ", " 4 ", " 5 ", " 6 ", " 7 ", " 8 ", " 9 ",
        "st ", "nd ", "rd ", "th ",
        "last week", "last month", "yesterday", "last monday", "last tuesday",
        "2024", "2025", "2026", "2027"
    ])
    
    has_meeting_context = any(k in lower for k in [
        "attendee", "participant", "invite", "add to meeting", 
        "add to event", "meeting with", "send invite"
    ])
    
    if not has_specific_date and not has_meeting_context and any(k in lower for k in [
        "email", "inbox", "unread", "gmail",
        "check email", "read email", "show email", "list email"
    ]):
        return "get_emails"

    # Calendar view
    if any(k in lower for k in ["calendar", "event", "meeting today",
                                 "today schedule", "what meetings", "schedule my day"]):
        return "get_calendar_events"

    # Team
    if any(k in lower for k in ["team", "standup", "member", "overdue", "delayed", "task progress"]):
        return "get_team_members"

    # Deployments
    if any(k in lower for k in ["deploy", "pipeline", "production", "staging", "build status"]):
        return "get_deployments"

    # Analytics
    if any(k in lower for k in ["analytics", "productivity", "focus hours", "stats", "metrics"]):
        return "get_analytics"

    # Notion
    if any(k in lower for k in ["notion", "notion page", "notion database"]):
        return "notion_tool"

    # Integrations
    if any(k in lower for k in ["integration", "connected", "platform", "connected apps"]):
        return "get_integrations_status"

    # Improve text
    if any(k in lower for k in ["improve", "rewrite", "rephrase", "fix grammar", "make professional"]):
        return "improve_text"

    # Code
    if any(k in lower for k in ["explain this code", "debug this code", "optimize this code"]):
        return "explain_code"

    # Web search
    if any(k in lower for k in ["search the web", "google this", "look up online", "search online"]):
        return "web_search"

    return None


def get_smart_suggestions(intent: str, tool_used: str = "", context: dict = None) -> list[str]:
    """Return 3-5 smart contextual suggestions based on intent and last tool used."""
    if tool_used and tool_used in _TOOL_SUGGESTIONS:
        return _TOOL_SUGGESTIONS[tool_used]
    return _SUGGESTIONS.get(intent, _SUGGESTIONS["general"])[:5]
