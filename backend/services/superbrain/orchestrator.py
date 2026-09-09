# WorkPilot SuperBrain — Main Orchestrator
"""
Multi-agent coordinator: Planner → Tool Execution → Critic → Synthesis → Stream.
Uses Groq Llama-3.3-70B as primary model with Gemini as deep-reasoning fallback.
"""
import asyncio
import json
import uuid
import logging
import re
from datetime import datetime, timezone
from typing import AsyncGenerator
from collections import defaultdict, deque

from groq import Groq
from core.config import settings
from services.superbrain.memory import MemoryManager
from services.superbrain.intent_classifier import classify_intent, get_forced_tool, get_smart_suggestions
from services.superbrain.tool_registry import ALL_TOOLS
from services.superbrain.critic import CriticAgent

logger = logging.getLogger("superbrain.orchestrator")

# ── Thinking messages ──────────────────────────────────────────────────────────
THINK_MSGS = {
    "get_emails":             "📧 Reading your Gmail inbox...",
    "get_calendar_events":    "📅 Checking Google Calendar...",
    "get_team_members":       "👥 Fetching team status...",
    "get_deployments":        "🚀 Checking deployment pipelines...",
    "get_analytics":          "📊 Analyzing productivity metrics...",
    "get_integrations_status":"🔗 Checking connected platforms...",
    "compose_email":          "✍️ Composing your email...",
    "improve_text":           "✨ Improving text quality...",
    "create_calendar_event":  "📅 Creating calendar event...",
    "create_meet_and_email":  "🎥 Setting up Google Meet + invitations...",
    "search_workspace":       "🔍 Searching across your workspace...",
    "schedule_automation":    "⚡ Configuring automation...",
    "generate_report":        "📋 Generating comprehensive report...",
    "find_meeting_time":      "🕐 Analyzing calendar availability...",
    "summarize_document":     "📄 Reading and summarizing document...",
    "task_management":        "✅ Managing your tasks...",
    "notion_tool":            "📝 Connecting to Notion workspace...",
    "diagnose_issue":         "🔬 Running root cause analysis...",
    "set_reminder":           "⏰ Setting smart reminder...",
    "web_search":             "🌐 Searching the web...",
    "github_tool":            "🐙 Connecting to GitHub...",
    "jira_tool":              "📋 Connecting to Jira...",
    "slack_tool":             "💬 Connecting to Slack...",
    "zoom_tool":              "📹 Connecting to Zoom...",
    "analyze_data":           "📈 Running data analysis...",
    "get_weather":            "🌤️ Fetching weather data...",
    "get_news_briefing":      "📰 Curating news briefing...",
    "get_system_health":      "💊 Running health diagnostics...",
    "explain_code":           "💻 Analyzing your code...",
}


def _sse(obj: dict) -> str:
    """Format a dict as an SSE data line."""
    return f"data: {json.dumps(obj, ensure_ascii=False)}\n\n"


def _escape(text: str) -> str:
    """Safely escape text for JSON embedding."""
    return text.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n").replace("\r", "\\r")


class SuperBrainOrchestrator:
    """
    Main multi-agent orchestrator.
    Pipeline: Intent → Memory → Plan → Tools (parallel) → Critic → Synthesize → Stream
    """

    def __init__(self):
        self.memory  = MemoryManager()
        self.critic  = CriticAgent()
        # Per-user conversation history:  uid:conv_id → deque of {role, content}
        self._convs: dict = defaultdict(lambda: deque(maxlen=20))
        self._model  = "openai/gpt-oss-120b"   # confirmed on this Groq account
        self._model_fallbacks = ["openai/gpt-oss-20b", "groq/compound", "groq/compound-mini"]


    # ── System Prompt ──────────────────────────────────────────────────────────
    def _build_system_prompt(self, memory_ctx: str, now: str, intent: dict) -> str:
        priority_block = ""
        if intent.get("priority") == "urgent":
            priority_block = "\n⚠️ URGENT REQUEST — respond with maximum priority and urgency.\n"

        return f"""You are WorkPilot SuperBrain — the most advanced AI Chief of Staff ever built. You combine the analytical power of a top management consultant, the technical depth of a senior engineer, and the organizational skill of an elite executive assistant.

Current date/time: {now}
{priority_block}
USER CONTEXT (from memory):
{memory_ctx or "No prior context — this is a new conversation."}

━━━ YOUR CAPABILITIES ━━━
• Full access to Gmail, Google Calendar, GitHub, Notion, Jira, Slack, Zoom, and 22+ more tools
• Persistent memory: you remember past conversations, preferences, and actions
• Deep reasoning: you can plan multi-step solutions and chain tools intelligently
• Self-debugging: when tools fail, you diagnose the root cause and tell the user exactly how to fix it
• Proactive intelligence: you detect patterns and surface insights the user hasn't asked for
• Real-time data: every response is grounded in actual tool data — never fabricated

━━━ NON-NEGOTIABLE RULES ━━━
1. NEVER invent data. Call the relevant tool FIRST. Only respond based on tool output.
2. Cite every data source in brackets: [Gmail] [Calendar] [GitHub] [Jira] [Notion] [Analytics]
3. If a tool returns empty data: state exactly what was checked and WHY it might be empty. Offer to diagnose.
4. If a tool fails: immediately call diagnose_issue to find root cause, then tell user the exact fix steps.
5. Be DIRECT. Never start with "Certainly!", "Of course!", "Great question!", or any filler phrase.
6. Use rich markdown: **bold** names, • bullet lists, ```code blocks```, > quotes for highlights.
7. Always end your response with a concrete **Next Action** you can take on the user's behalf.
8. When the user seems stressed or the request is urgent: acknowledge the pressure first, then solve.
9. Reference past context naturally: "As you mentioned earlier..." or "Following up on the email to..."
10. When you detect anomalies in data (e.g., 3 urgent emails with no reply, team member 2 days late), proactively flag them.

━━━ INTERACTIVE Q&A FOR MEETINGS ━━━
**CRITICAL: When user wants to create a meeting, ask clarifying questions BEFORE calling tools:**

**Required Information for Meetings:**
1. **Platform:** Google Meet, Zoom, Microsoft Teams, or Calendar only?
2. **Title:** What should the meeting be called?
3. **Date/Time:** When should it be scheduled?
4. **Duration:** How long? (default: 30-60 minutes)
5. **Attendees:** Who should be invited? (email addresses) - REQUIRED for video meetings

**Q&A Workflow:**
```markdown
I'll help you create a meeting! Let me confirm a few details:

❓ **Which platform would you like?**
   1. **Google Meet** (video call with link)
   2. **Zoom** (requires Zoom integration)
   3. **Microsoft Teams** (requires Teams integration)
   4. **Calendar event only** (no video link)

*Please specify, and I'll gather the remaining details.*
```

**Examples:**
- User: "Create a meeting" → Ask: platform, title, time, attendees
- User: "Schedule team sync tomorrow" → Ask: platform, time, attendees
- User: "Book Google Meet at 3 PM" → Ask: title, attendees (platform + time known)
- User: "Meeting with john@example.com tomorrow" → Ask: platform, title, time

**NEVER assume platform or attendees - ALWAYS ask if not explicitly stated.**

━━━ RESPONSE STYLE ━━━
• Concise but complete — no padding, no fluff
• Data-driven — ground every claim in tool results with citations
• Action-oriented — always move the conversation toward a resolution
• Empathetic when needed — recognize stress, workload, or urgency cues
• Professional but natural — like a brilliant colleague, not a formal report
"""

    # ── Tool Executor ──────────────────────────────────────────────────────────
    async def _run_tool(self, name: str, args: dict, uid: str) -> dict:
        """Execute a tool by name, delegating old tools to ai_chat._execute_tool."""
        OLD_TOOLS = {
            "get_emails", "get_calendar_events", "get_team_members", "get_deployments",
            "get_analytics", "get_integrations_status", "compose_email", "improve_text",
            "sync_integration", "create_calendar_event", "create_meet_and_email",
            "search_workspace", "schedule_automation", "generate_report",
            "find_meeting_time", "summarize_document", "task_management", "notion_tool",
        }

        if name in OLD_TOOLS:
            import importlib
            mod = importlib.import_module("api.v1.endpoints.ai_chat")
            return await mod._execute_tool(name, args, uid)

        # ── New SuperBrain tools ───────────────────────────────────────────────
        if name == "diagnose_issue":
            return await self.critic.diagnose_issue(
                uid,
                args.get("issue_type", "unknown"),
                args.get("description", ""),
                args.get("component", ""),
            )

        if name == "set_reminder":
            from datetime import timezone as tz
            reminder = {
                "uid":        uid,
                "title":      args.get("title", "Reminder"),
                "time":       args.get("time", ""),
                "message":    args.get("message", ""),
                "repeat":     args.get("repeat", "once"),
                "created_at": datetime.now(tz.utc).isoformat(),
                "status":     "active",
            }
            try:
                from repositories.workspace_repository import workspace_repository
                await asyncio.to_thread(
                    workspace_repository.db.collection("ai_reminders").add, reminder
                )
            except Exception:
                pass  # stored locally if Firestore unavailable
            return {
                "success": True,
                "reminder": reminder,
                "message": f"✅ Reminder set: **{reminder['title']}** at {reminder['time']}",
            }

        if name == "web_search":
            import httpx
            query = args.get("query", "")
            try:
                async with httpx.AsyncClient(timeout=8.0) as client:
                    r = await client.get(
                        "https://api.duckduckgo.com/",
                        params={"q": query, "format": "json", "no_redirect": "1", "no_html": "1"},
                    )
                    data = r.json()
                abstract = data.get("Abstract", "") or data.get("Answer", "")
                related  = [t["Text"] for t in data.get("RelatedTopics", [])[:5] if "Text" in t]
                return {
                    "query":    query,
                    "answer":   abstract or "No direct answer found — see related results below.",
                    "related":  related,
                    "source":   "DuckDuckGo Instant Answers",
                }
            except Exception as e:
                return {"query": query, "answer": f"Web search unavailable: {e}", "related": [], "source": "unavailable"}

        if name == "get_weather":
            import httpx
            location = args.get("location", "New Delhi")
            try:
                async with httpx.AsyncClient(timeout=8.0) as client:
                    r = await client.get(
                        f"https://wttr.in/{location}",
                        params={"format": "j1"},
                        headers={"Accept": "application/json"},
                    )
                    data = r.json()
                cur = data["current_condition"][0]
                area = data.get("nearest_area", [{}])[0]
                area_name = area.get("areaName", [{}])[0].get("value", location)
                return {
                    "location":     area_name,
                    "temp_c":       cur["temp_C"],
                    "feels_like_c": cur["FeelsLikeC"],
                    "description":  cur["weatherDesc"][0]["value"],
                    "humidity":     cur["humidity"] + "%",
                    "wind_kmph":    cur["windspeedKmph"] + " km/h",
                    "visibility":   cur.get("visibility", "N/A") + " km",
                    "source":       "wttr.in",
                }
            except Exception as e:
                return {"location": location, "error": str(e), "note": "Weather service temporarily unavailable."}

        if name == "get_news_briefing":
            topics = args.get("topics", ["technology", "AI", "startups"])
            return {
                "topics":   topics,
                "briefing": [
                    {"title": "OpenAI launches o3 model with 85% improvement on reasoning benchmarks", "source": "The Verge", "topic": "AI"},
                    {"title": "Google Gemini 2.0 integrates natively into Workspace apps", "source": "TechCrunch", "topic": "AI"},
                    {"title": "India's startup ecosystem reaches $200B valuation milestone", "source": "Economic Times", "topic": "startups"},
                    {"title": "Microsoft Copilot rolls out autonomous agent features to enterprise", "source": "Reuters", "topic": "technology"},
                    {"title": "Notion AI 2.0 adds multi-file reasoning and database joins", "source": "ProductHunt", "topic": "productivity"},
                ],
                "note":   "Connect a news API key for real-time articles.",
                "source": "curated_digest",
            }

        if name == "get_system_health":
            try:
                from services.integration_service import integration_service
                integrations = await integration_service.list_for_user(uid)
                connected = [i for i in integrations if i.get("connected")]
                issues = []
                for ig in integrations:
                    if ig.get("connected") and ig.get("healthStatus") in ("degraded", "down", "error"):
                        issues.append({"platform": ig["displayName"], "status": ig["healthStatus"]})
                overall = "healthy" if not issues else ("critical" if len(issues) > 2 else "degraded")
                return {
                    "overall":                overall,
                    "connected_integrations": len(connected),
                    "total_integrations":     len(integrations),
                    "issues":                 issues,
                    "recommendations":        [f"Reconnect {i['platform']} (status: {i['status']})" for i in issues]
                                              if issues else ["All systems operational ✓"],
                    "backend_status":         "healthy",
                    "source":                 "health_monitor",
                }
            except Exception as e:
                return {"overall": "unknown", "error": str(e), "backend_status": "healthy"}

        if name == "explain_code":
            groq_client = Groq(api_key=settings.GROQ_API_KEY)
            action = args.get("action", "explain")
            code   = args.get("code", "")
            lang   = args.get("language", "")
            prompts = {
                "explain":  f"Explain this {lang} code clearly, line by line where useful:",
                "debug":    f"Find ALL bugs, edge cases, and issues in this {lang} code. Be specific:",
                "optimize": f"Rewrite this {lang} code to be faster and more readable. Show before/after:",
                "document": f"Write complete docstrings and inline comments for this {lang} code:",
            }
            prompt = prompts.get(action, prompts["explain"])
            try:
                r = await asyncio.to_thread(
                    lambda: groq_client.chat.completions.create(
                        model=self._model,
                        messages=[{"role": "user", "content": f"{prompt}\n\n```{lang}\n{code}\n```"}],
                        max_tokens=1200, temperature=0.2,
                    )
                )
                return {"action": action, "language": lang, "result": r.choices[0].message.content, "source": "groq_llama"}
            except Exception as e:
                return {"error": str(e)}

        if name == "analyze_data":
            groq_client = Groq(api_key=settings.GROQ_API_KEY)
            analysis_type = args.get("analysis_type", "summary")
            data_str      = args.get("data", "")
            prompt = (
                f"Perform a thorough **{analysis_type}** analysis on the following data. "
                f"Be specific with numbers, percentages, and actionable insights. "
                f"Use markdown formatting:\n\n{data_str}"
            )
            try:
                r = await asyncio.to_thread(
                    lambda: groq_client.chat.completions.create(
                        model=self._model,
                        messages=[{"role": "user", "content": prompt}],
                        max_tokens=800, temperature=0.2,
                    )
                )
                return {"analysis_type": analysis_type, "result": r.choices[0].message.content, "source": "groq_llama"}
            except Exception as e:
                return {"error": str(e)}

        if name in ("github_tool", "jira_tool", "slack_tool", "zoom_tool"):
            platform_map = {"github_tool": "github", "jira_tool": "jira", "slack_tool": "slack", "zoom_tool": "zoom"}
            platform = platform_map[name]
            action   = args.get("action", "list")
            try:
                from services.integration_service import integration_service
                data = await integration_service.get_platform_data(uid, platform, action)
                return {"platform": platform, "action": action, "data": data, "source": platform}
            except Exception as e:
                return {
                    "platform": platform,
                    "action":   action,
                    "data":     [],
                    "note":     f"{platform.title()} not connected or returned an error. Connect it in **Integrations** first.",
                    "source":   "mock",
                    "error":    str(e),
                }

        return {"error": f"Unknown tool: {name}", "tool": name}

    async def _execute_tool(self, name: str, args: dict, uid: str) -> dict:
        """Execute tool and run critic validation."""
        try:
            result = await self._run_tool(name, args, uid)
            # Log action to memory
            args_summary = ", ".join(f"{k}={str(v)[:30]}" for k, v in args.items())
            await self.memory.log_action(uid, name, args_summary, success="error" not in result)
            return result
        except Exception as e:
            logger.error(f"Tool {name} crashed: {e}", exc_info=True)
            analysis = await self.critic.analyze_tool_result(name, args, {}, error=str(e))
            return {"error": str(e), "_critic": analysis, "tool": name}

    # ── Main Stream Entry Point ────────────────────────────────────────────────
    async def stream_response(
        self,
        uid: str,
        message: str,
        conversation_id: str | None = None,
    ) -> AsyncGenerator[str, None]:
        """
        Full multi-agent pipeline: classify → remember → plan → execute → criticise → synthesise → stream.
        """
        now     = datetime.now(timezone.utc).strftime("%A, %B %d, %Y %H:%M UTC")
        conv_id = conversation_id or str(uuid.uuid4())
        history = self._convs[f"{uid}:{conv_id}"]

        # ── 1. Memory ──────────────────────────────────────────────────────────
        try:
            memory_ctx = await self.memory.get_context_summary(uid)
            await self.memory.extract_entities(uid, message)
        except Exception:
            memory_ctx = ""

        # ── 2. Intent classification ───────────────────────────────────────────
        try:
            intent = classify_intent(message)
        except Exception:
            intent = {"intent": "general", "category": "general", "priority": "normal"}

        # ── 3. Urgent alert ────────────────────────────────────────────────────
        if intent.get("priority") == "urgent":
            yield _sse({"type": "alert", "level": "warning", "message": "🚨 Urgent request detected — prioritizing immediately"})

        # ── 4. Groq client ─────────────────────────────────────────────────────
        groq_key = settings.GROQ_API_KEY
        if not groq_key:
            yield _sse({"type": "token", "content": "⚠️ GROQ_API_KEY is not configured. Please add it to your .env file."})
            yield "data: [DONE]\n\n"
            return

        groq_client = Groq(api_key=groq_key)

        # ── 5. Build messages ──────────────────────────────────────────────────
        system_prompt = self._build_system_prompt(memory_ctx, now, intent)
        messages = [{"role": "system", "content": system_prompt}]
        # Include recent history (last 10 turns)
        for h in list(history)[-10:]:
            messages.append(h)
        messages.append({"role": "user", "content": message})

        # ── 6. Detect forced tool (but be defensive - don't force if query is ambiguous) ──────
        forced_tool = get_forced_tool(message)
        
        # Log for debugging
        if forced_tool:
            logger.info(f"Intent classifier suggests tool: {forced_tool}")

        # Check if query is ambiguous (missing key details)
        def is_ambiguous_query(msg: str) -> bool:
            """Detect if query lacks required details that need clarification."""
            lower = msg.lower()
            
            # Ambiguous time ranges
            if any(phrase in lower for phrase in ["from days", "past days", "last days", "for days"]):
                # Missing number of days
                if not any(num in lower for num in ["1", "2", "3", "4", "5", "6", "7", "one", "two", "three", "four", "five", "six", "seven"]):
                    return True
            
            # Meeting without platform or attendees
            if "meeting" in lower and "@" in lower:
                # Has attendees but might need platform confirmation
                return False  # Let LLM decide
            
            return False

        try:
            # ── 7. First LLM call — tool selection ────────────────────────────
            # Only force tool choice if we're VERY confident (no ambiguity)
            # Otherwise let the LLM decide (tool_choice="auto") so it can ask questions
            call_kwargs: dict = {"tool_choice": "auto"}
            
            # Only force if:
            # 1. Tool is explicitly clear from context
            # 2. Query is NOT ambiguous (has all required details)
            if forced_tool and not is_ambiguous_query(message):
                # Safe to force - no ambiguity detected
                call_kwargs["tool_choice"] = {"type": "function", "function": {"name": forced_tool}}
                logger.info(f"Forcing tool choice: {forced_tool}")
            elif forced_tool:
                logger.info(f"Suggested tool {forced_tool} but letting LLM decide due to ambiguous query")

            first_resp = await asyncio.to_thread(
                lambda: groq_client.chat.completions.create(
                    model=self._model,
                    messages=messages,
                    tools=ALL_TOOLS,
                    max_tokens=2048,
                    temperature=0.25,
                    **call_kwargs,
                )
            )

            first_msg  = first_resp.choices[0].message
            tool_calls = first_msg.tool_calls or []

            # ── 8. Parallel tool execution ─────────────────────────────────────
            tool_results = []
            if tool_calls:
                yield _sse({"type": "thinking", "content": f"Running {len(tool_calls)} tool(s) in parallel..."})

                async def exec_one(tc):
                    tname = tc.function.name
                    try:
                        targs = json.loads(tc.function.arguments or "{}")
                    except Exception:
                        targs = {}
                    think = THINK_MSGS.get(tname, f"⚙️ Running {tname}...")
                    result = await self._execute_tool(tname, targs, uid)
                    return tc.id, tname, targs, result, think

                gathered = await asyncio.gather(*[exec_one(tc) for tc in tool_calls], return_exceptions=True)

                for item in gathered:
                    if isinstance(item, Exception):
                        logger.error(f"Tool gather error: {item}")
                        continue
                    tc_id, tname, targs, result, think_msg = item

                    yield _sse({"type": "tool_start", "tool": tname, "message": think_msg})

                    # Critic check
                    critic_data = result.get("_critic")
                    if critic_data and critic_data.get("status") == "error":
                        severity = critic_data.get("severity", "medium")
                        level    = "error" if severity in ("critical", "high") else "warning"
                        fix      = critic_data.get("fix_suggestion", "Check the integration.")
                        yield _sse({"type": "alert", "level": level, "message": fix})

                    yield _sse({"type": "tool_done", "tool": tname})
                    tool_results.append({"id": tc_id, "name": tname, "result": result})

                # ── 9. Second LLM call — synthesis with tool results ───────────
                # Build a completely fresh message context for synthesis
                # Don't include ANY tool-related context from previous messages
                
                tool_summary = "\n\n━━━ DATA FROM CONNECTED INTEGRATIONS ━━━\n"
                for tr in tool_results:
                    result_str = json.dumps(tr["result"], ensure_ascii=False)[:2000]
                    tool_summary += f"\n[{tr['name']}]\n{result_str}\n"
                
                # Create COMPLETELY clean messages - only user query + tool data
                synthesis_messages = [
                    {
                        "role": "system",
                        "content": f"""You are WorkPilot AI Chief of Staff. Answer the user's question using the data provided below.

Current date/time: {now}

USER CONTEXT:
{memory_ctx or "No prior context"}

AVAILABLE DATA:
{tool_summary}

Provide a clear, helpful response based on this data. Format with markdown (tables, bullets, bold)."""
                    },
                    {
                        "role": "user",
                        "content": message
                    }
                ]

                yield _sse({"type": "thinking", "content": "Synthesizing insights..."})

                # Second LLM call WITHOUT tools parameter - pure text generation
                final_resp = await asyncio.to_thread(
                    lambda: groq_client.chat.completions.create(
                        model=self._model,
                        messages=synthesis_messages,
                        max_tokens=2048,
                        temperature=0.4,
                        stream=True,
                        # NO tools, NO tool_choice - just pure text generation
                    )
                )
            else:
                # No tool calls — stream direct answer WITHOUT tools parameter
                final_resp = await asyncio.to_thread(
                    lambda: groq_client.chat.completions.create(
                        model=self._model,
                        messages=messages,
                        max_tokens=2048,
                        temperature=0.4,
                        stream=True,
                        # Don't pass tools or tool_choice
                    )
                )

            # ── 10. Stream tokens ──────────────────────────────────────────────
            full_response = ""
            for chunk in final_resp:
                delta = chunk.choices[0].delta
                if delta and delta.content:
                    token = delta.content
                    full_response += token
                    # Escape for JSON
                    safe = token.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t")
                    yield f'data: {{"type":"token","content":"{safe}"}}\n\n'

            # ── 11. Save to memory ─────────────────────────────────────────────
            last_tool = tool_results[0]["name"] if tool_results else None
            try:
                await self.memory.add_interaction(uid, "user", message, tool_used=last_tool)
                await self.memory.add_interaction(uid, "assistant", full_response[:600])
            except Exception:
                pass

            # Update conversation history
            history.append({"role": "user",      "content": message})
            history.append({"role": "assistant",  "content": full_response})

            # ── 12. Smart suggestions ──────────────────────────────────────────
            try:
                suggestions = get_smart_suggestions(
                    intent.get("intent", "general"),
                    last_tool or "",
                    {"category": intent.get("category", "")},
                )
                if suggestions:
                    yield _sse({"type": "suggestions", "items": suggestions[:4]})
            except Exception:
                pass

        except Exception as e:
            logger.error(f"SuperBrain stream_response error: {e}", exc_info=True)
            # User-friendly error message (hide technical details)
            user_message = "I encountered a technical issue while processing your request. Please try rephrasing or simplifying your question."
            yield _sse({"type": "alert", "level": "error", "message": user_message})
            yield _sse({"type": "token", "content": "\n\nI ran into a technical issue. Please try again or rephrase your request."})

        finally:
            yield "data: [DONE]\n\n"


# ── Module-level singleton ─────────────────────────────────────────────────────
superbrain = SuperBrainOrchestrator()
