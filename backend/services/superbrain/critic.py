# WorkPilot SuperBrain — Critic & Self-Debugging Agent
"""
Validates tool results, diagnoses root causes, and prevents hallucinations.
"""
import asyncio
import logging
from datetime import datetime, timezone

logger = logging.getLogger("superbrain.critic")

# ── Root-cause classification map ─────────────────────────────────────────────
_ERROR_PATTERNS = [
    ("token_expired",          ["token", "expired", "401", "unauthorized", "invalid token", "jwt"]),
    ("integration_disconnected", ["not connected", "no integration", "disconnected", "not found", "connect first"]),
    ("rate_limited",           ["429", "rate limit", "too many requests", "quota exceeded"]),
    ("permission_denied",      ["403", "forbidden", "permission", "access denied", "scope"]),
    ("not_found",              ["404", "not found", "no such", "does not exist"]),
    ("network_error",          ["timeout", "connection", "ssl", "unreachable", "network", "refused"]),
    ("data_empty",             ["empty", "no data", "no results", "none found", "0 items"]),
    ("server_error",           ["500", "502", "503", "internal server", "bad gateway", "service unavailable"]),
    ("invalid_input",          ["invalid", "bad request", "400", "missing field", "required"]),
]

_FIX_SUGGESTIONS = {
    "token_expired":             "Your session token has expired. Please log out and log back in, or reconnect the integration in the Integrations page.",
    "integration_disconnected":  "This integration is not connected. Go to **Integrations** → find the platform → toggle it on to connect.",
    "rate_limited":              "The API rate limit has been hit. Wait 1-2 minutes before trying again, or upgrade your API plan.",
    "permission_denied":         "Insufficient permissions. Reconnect the integration and ensure all required scopes/permissions are granted.",
    "not_found":                 "The requested resource was not found. Double-check the ID or name and try again.",
    "network_error":             "Network connectivity issue detected. Check your internet connection and retry.",
    "data_empty":                "No data was returned. This is normal if the source is empty — try a different time range or filter.",
    "server_error":              "The external service is temporarily down. Try again in a few minutes.",
    "invalid_input":             "The request contained invalid parameters. Check the inputs and try with corrected values.",
    "unknown":                   "An unexpected error occurred. Try reconnecting the integration or contact support.",
}

_DIAGNOSE_STEPS = {
    "integration": [
        "1. Go to **Integrations** page and check if the platform shows as Connected",
        "2. If disconnected, click the toggle to reconnect and grant all required permissions",
        "3. After reconnecting, click **↻ Sync** on the integration card",
        "4. If still failing, disconnect and reconnect from scratch",
        "5. Check if the integration's API is experiencing an outage",
    ],
    "auth": [
        "1. Your authentication token may have expired — log out and log back in",
        "2. Check if your Firebase account is still active",
        "3. Clear browser cache and cookies, then re-authenticate",
        "4. If using OAuth (Gmail, Calendar), revoke and re-grant access",
        "5. Ensure your account has the correct permissions/roles",
    ],
    "performance": [
        "1. Check current API response times in System Health",
        "2. Reduce the amount of data being fetched (use filters/limits)",
        "3. Check if Firestore indices are properly set up",
        "4. Look for N+1 query patterns in recent tool calls",
        "5. Consider caching frequently accessed data",
    ],
    "data": [
        "1. Verify the data source is connected and synced recently",
        "2. Check if the data exists in the source platform directly",
        "3. Try refreshing/syncing the integration",
        "4. Check date ranges and filters — they may be too narrow",
        "5. Confirm the data format matches what's expected",
    ],
    "network": [
        "1. Check your internet connection",
        "2. Verify the backend server is running at http://localhost:8001",
        "3. Check if the external API (Gmail, GitHub, etc.) is down",
        "4. Look for SSL certificate issues in the server logs",
        "5. Try disabling VPN if active",
    ],
    "code": [
        "1. Check the error message and stack trace carefully",
        "2. Verify all required environment variables are set in .env",
        "3. Check for missing dependencies in requirements.txt",
        "4. Look for syntax errors or import issues",
        "5. Review recent code changes that may have introduced the bug",
    ],
    "unknown": [
        "1. Check the backend server logs for detailed error messages",
        "2. Try reproducing the issue with a simpler request",
        "3. Verify all integrations are connected and tokens are valid",
        "4. Restart the backend server",
        "5. If the issue persists, check for known issues on the platform's status page",
    ],
}


class CriticAgent:
    """Self-debugging agent that validates tool results and diagnoses root causes."""

    async def analyze_tool_result(
        self,
        tool_name: str,
        args: dict,
        result: dict,
        error: str | None = None,
    ) -> dict:
        """
        Analyze a tool result for errors, root causes, and fix suggestions.
        Returns {status, root_cause, fix_suggestion, should_retry, severity}
        """
        error_text = ""
        if error:
            error_text = str(error).lower()
        elif result.get("error"):
            error_text = str(result["error"]).lower()

        if not error_text:
            # Check for soft failures (empty data where we expect data)
            if result.get("count") == 0 and tool_name in ("get_emails", "get_calendar_events"):
                return {
                    "status": "warning",
                    "root_cause": "data_empty",
                    "fix_suggestion": "No data found. Make sure the integration is connected and synced recently.",
                    "should_retry": False,
                    "severity": "low",
                }
            return {"status": "ok", "root_cause": None, "fix_suggestion": None, "should_retry": False, "severity": None}

        # Classify root cause
        root_cause = "unknown"
        for cause, patterns in _ERROR_PATTERNS:
            if any(p in error_text for p in patterns):
                root_cause = cause
                break

        # Determine severity
        severity_map = {
            "token_expired":             "high",
            "integration_disconnected":  "high",
            "rate_limited":              "medium",
            "permission_denied":         "high",
            "not_found":                 "low",
            "network_error":             "medium",
            "data_empty":                "low",
            "server_error":              "medium",
            "invalid_input":             "medium",
            "unknown":                   "medium",
        }

        # Should we retry?
        retry_causes = {"rate_limited", "network_error", "server_error"}
        should_retry = root_cause in retry_causes

        return {
            "status":          "error",
            "root_cause":      root_cause,
            "fix_suggestion":  _FIX_SUGGESTIONS.get(root_cause, _FIX_SUGGESTIONS["unknown"]),
            "should_retry":    should_retry,
            "severity":        severity_map.get(root_cause, "medium"),
            "tool":            tool_name,
            "error_preview":   error_text[:200],
        }

    async def diagnose_issue(
        self,
        uid: str,
        issue_type: str,
        description: str,
        component: str = "",
    ) -> dict:
        """
        Deep diagnosis of a reported issue.
        Returns structured root cause analysis with actionable fix steps.
        """
        issue_type = issue_type or "unknown"
        now = datetime.now(timezone.utc).isoformat()

        # Try to get integration health for context
        integration_context = []
        try:
            from services.integration_service import integration_service
            integrations = await integration_service.list_for_user(uid)
            for ig in integrations:
                if component and component.lower() in ig.get("platform", "").lower():
                    status = ig.get("status", "unknown")
                    health = ig.get("healthStatus", "unknown")
                    integration_context.append(
                        f"{ig['displayName']}: status={status}, health={health}"
                    )
        except Exception:
            pass

        # Classify severity based on description
        description_lower = description.lower()
        severity = "medium"
        if any(w in description_lower for w in ["production", "outage", "critical", "down", "all users"]):
            severity = "critical"
        elif any(w in description_lower for w in ["broken", "failing", "error", "not working"]):
            severity = "high"
        elif any(w in description_lower for w in ["slow", "delayed", "sometimes", "intermittent"]):
            severity = "medium"
        else:
            severity = "low"

        # Confidence scoring
        confidence = 0.7
        if integration_context:
            confidence = 0.85
        if issue_type != "unknown":
            confidence = min(confidence + 0.1, 0.95)

        # Build root cause narrative
        root_cause_map = {
            "integration": f"The {component or 'integration'} platform is not properly connected or its OAuth token has expired.",
            "auth":        "Authentication failure — the user session or OAuth token is invalid or expired.",
            "performance": "Performance degradation — likely caused by unoptimised queries or missing database indices.",
            "data":        "Data inconsistency — the requested data is missing, malformed, or not yet synced.",
            "network":     "Network connectivity issue — SSL handshake failure or unreachable external API.",
            "code":        "Application-level error — exception in backend code, possibly due to a recent change.",
            "unknown":     "Undetermined issue — requires log inspection to identify the exact failure point.",
        }

        steps = _DIAGNOSE_STEPS.get(issue_type, _DIAGNOSE_STEPS["unknown"])

        # Related issues based on common co-occurring problems
        related_map = {
            "integration": ["token_expired", "permission_denied", "rate_limited"],
            "auth":        ["token_expired", "integration_disconnected"],
            "network":     ["ssl_error", "firestore_timeout"],
            "performance": ["n+1_queries", "missing_cache", "large_payload"],
            "data":        ["sync_needed", "filter_too_narrow"],
        }

        return {
            "issue_type":          issue_type,
            "component":           component or "workspace",
            "root_cause":          root_cause_map.get(issue_type, root_cause_map["unknown"]),
            "severity":            severity,
            "confidence":          round(confidence, 2),
            "steps_to_fix":        steps,
            "related_issues":      related_map.get(issue_type, []),
            "integration_context": integration_context,
            "estimated_fix_time":  {"critical": "5-15 min", "high": "15-30 min", "medium": "30-60 min", "low": "1-2 hours"}.get(severity, "unknown"),
            "diagnosed_at":        now,
            "description":         description,
        }

    async def validate_response(self, response_text: str) -> dict:
        """
        Check if an AI response contains hallucinations or unsupported claims.
        Returns {is_valid, warnings}
        """
        warnings = []

        # Check for made-up statistics without sources
        import re
        bare_numbers = re.findall(r"\b\d{2,}(?:\.\d+)?%?\b", response_text)
        if len(bare_numbers) > 5:
            warnings.append("Response contains many specific numbers — ensure they come from tool data, not assumptions.")

        # Check for email addresses that weren't in tool results
        emails = re.findall(r"[\w.+-]+@[\w-]+\.\w+", response_text)
        if emails:
            warnings.append(f"Response mentions email addresses: {emails[:3]} — verify these came from tool results.")

        # Check for date claims
        date_claims = re.findall(
            r"\b(?:\d{4}-\d{2}-\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2})\b",
            response_text,
        )
        if len(date_claims) > 3:
            warnings.append("Response contains multiple specific dates — verify these came from calendar/tool data.")

        return {
            "is_valid": len(warnings) == 0,
            "warnings": warnings,
        }
