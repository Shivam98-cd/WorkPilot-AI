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
import time
from datetime import datetime, timezone
from typing import AsyncGenerator, Any
from collections import defaultdict, deque

try:
    from groq import Groq
except ImportError:
    Groq = None  # type: ignore

try:
    from google import genai
    from google.genai import types as genai_types
except ImportError:
    genai = None  # type: ignore
    genai_types = None  # type: ignore

from core.config import settings
from services.superbrain.memory import MemoryManager
from services.superbrain.intent_classifier import classify_intent, get_forced_tool, get_smart_suggestions
from services.superbrain.tool_registry import ALL_TOOLS, get_tools_for_request
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
    "prepare_meeting_briefing":"🎯 Assembling cross-platform briefing (Calendar + Gmail + Notion)...",
    "inbox_triage_workflow":  "📬 Running automated inbox triage & conflict resolution...",
    "workspace_cross_search": "🌐 Running 360° cross-search across connected workspace...",
    "query_knowledge_base":   "📚 Searching Pinecone Vector Knowledge Base...",
}



def _sse(obj: dict) -> str:
    """Format a dict as an SSE data line."""
    return f"data: {json.dumps(obj, ensure_ascii=False)}\n\n"


def _escape(text: str) -> str:
    """Safely escape text for JSON embedding."""
    return text.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n").replace("\r", "\\r")


# ── Gemini-compatible mock response objects ────────────────────────────────────
class _MockFunction:
    def __init__(self, name: str, arguments: str):
        self.name = name
        self.arguments = arguments

class _MockToolCall:
    def __init__(self, id: str, name: str, arguments: str):
        self.id = id
        self.type = "function"
        self.function = _MockFunction(name, arguments)

class _MockMessage:
    def __init__(self, content: str | None, tool_calls: list):
        self.content = content
        self.tool_calls = tool_calls

class _MockChoice:
    def __init__(self, message: "_MockMessage"):
        self.message = message

class _MockResponse:
    def __init__(self, choices: list, model: str):
        self.choices = choices
        self.model = model
# ────────────────────────────────────────────────────────────────────────────────


class SuperBrainOrchestrator:
    """
    Main multi-agent orchestrator with multi-provider resilience.
    Pipeline: Intent → Memory → Plan → Tools (parallel) → Critic → Synthesize → Stream
    Primary Engine : Groq (ultra-fast ≤0.5 s inference)
    Secondary Engine: Google Gemini 3.6 Flash (auto-failover on Groq 429 / outages)
    """

    def __init__(self):
        self.memory  = MemoryManager()
        self.critic  = CriticAgent()
        # Per-user conversation history:  uid:conv_id → deque of {role, content}
        self._convs: dict = defaultdict(lambda: deque(maxlen=20))
        self._model       = "qwen/qwen3.8-27b"   # fast primary Groq model
        self._tool_models  = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"]
        self._synth_models = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"]
        self._gemini_models = ["gemini-3.6-flash", "gemini-3.5-flash-lite"]
        self._groq_cooldown_until: float = 0.0   # epoch seconds; 0 = no cooldown

    # ── Groq circuit-breaker helpers ───────────────────────────────────────────
    def _groq_is_cooling(self) -> bool:
        """Return True when Groq is in a post-429 cooldown window."""
        return time.time() < self._groq_cooldown_until

    def _groq_mark_cooldown(self, seconds: float = 45.0):
        """Activate Groq cooldown so the next N seconds route straight to Gemini."""
        self._groq_cooldown_until = time.time() + seconds
        logger.warning(
            f"Groq 429 rate-limit hit — circuit cooldown {seconds}s activated; routing to Gemini"
        )

    # ── Gemini client ──────────────────────────────────────────────────────────
    def _get_gemini_client(self):
        key = getattr(settings, "GEMINI_API_KEY", None)
        if not key or not genai:
            return None
        try:
            return genai.Client(api_key=key)
        except Exception as e:
            logger.warning(f"Gemini client init failed: {e}")
            return None

    # ── Message format conversion ──────────────────────────────────────────────
    def _messages_to_gemini(self, messages: list) -> tuple[str, str]:
        """Convert OpenAI-style messages → (system_instruction, contents_str) for Gemini."""
        sys_parts, conv_parts = [], []
        for m in messages:
            role    = m.get("role", "user")
            content = (m.get("content") or "").strip()
            if not content:
                continue
            if role == "system":
                sys_parts.append(content)
            elif role == "user":
                conv_parts.append(f"User: {content}")
            elif role == "assistant":
                conv_parts.append(f"Assistant: {content}")
            elif role == "tool":
                conv_parts.append(f"[{m.get('name', 'Tool')} Result]: {content}")
        system_instruction = "\n\n".join(sys_parts)
        contents = "\n\n".join(conv_parts) or "Hello"
        return system_instruction, contents

    # ── Gemini tool planner ────────────────────────────────────────────────────
    async def _call_gemini_planner(
        self,
        gemini_client: Any,
        messages: list,
        tools: list | None = None,
        tool_choice: Any = None,
        max_tokens: int = 600,
        temperature: float = 0.2,
    ):
        """Run one Gemini function-calling hop; return a _MockResponse compatible with Groq shape."""
        if not genai_types:
            raise RuntimeError("google.genai SDK not available")
        sys_instr, contents = self._messages_to_gemini(messages)

        # Build Gemini tool declarations (filter to forced tool if needed)
        gemini_tools = None
        if tools:
            forced_name = (
                tool_choice.get("function", {}).get("name")
                if isinstance(tool_choice, dict) else None
            )
            decls = [
                {
                    "name": t["function"]["name"],
                    "description": t["function"].get("description", ""),
                    "parameters": t["function"].get("parameters", {"type": "object", "properties": {}}),
                }
                for t in tools
                if t.get("function", {}).get("name")
                and (not forced_name or t["function"]["name"] == forced_name)
            ]
            if decls:
                gemini_tools = [{"function_declarations": decls}]

        config = genai_types.GenerateContentConfig(
            system_instruction=sys_instr or "You are WorkPilot AI tool coordinator.",
            temperature=temperature,
            max_output_tokens=max_tokens,
        )
        if gemini_tools:
            config.tools = gemini_tools

        for g_model in self._gemini_models:
            try:
                logger.info(f"Gemini tool-planner using model: {g_model}")
                resp = await asyncio.wait_for(
                    asyncio.to_thread(
                        lambda m=g_model: gemini_client.models.generate_content(
                            model=m, contents=contents, config=config
                        )
                    ),
                    timeout=15.0,
                )
                # Wrap function_calls into Groq-compatible mock objects
                tool_calls = []
                if resp.function_calls:
                    for fc in resp.function_calls:
                        cid  = getattr(fc, "id", None) or f"call_{uuid.uuid4().hex[:8]}"
                        args = json.dumps(dict(fc.args)) if fc.args else "{}"
                        tool_calls.append(_MockToolCall(cid, fc.name, args))
                text = resp.text if not tool_calls else None
                mock = _MockResponse(
                    [_MockChoice(_MockMessage(text, tool_calls))], f"gemini/{g_model}"
                )
                return mock, f"gemini/{g_model}"
            except Exception as e:
                logger.warning(f"Gemini planner model '{g_model}' failed: {e}")
                continue
        raise RuntimeError("All Gemini fallback models failed for tool planning.")

    # ── Gemini synthesis streamer ──────────────────────────────────────────────
    async def _stream_gemini(
        self,
        gemini_client: Any,
        messages: list,
        max_tokens: int = 900,
        temperature: float = 0.4,
    ) -> AsyncGenerator[str, None]:
        """Stream synthesis tokens from Gemini when Groq is unavailable."""
        if not genai_types:
            raise RuntimeError("google.genai SDK not available")
        sys_instr, contents = self._messages_to_gemini(messages)
        config = genai_types.GenerateContentConfig(
            system_instruction=sys_instr or "You are WorkPilot AI Chief of Staff.",
            temperature=temperature,
            max_output_tokens=max_tokens,
        )
        last_exc = None
        for g_model in self._gemini_models:
            streamed = False
            try:
                logger.info(f"Gemini synthesis streaming with model: {g_model}")
                stream = await asyncio.to_thread(
                    lambda m=g_model: gemini_client.models.generate_content_stream(
                        model=m, contents=contents, config=config
                    )
                )
                for chunk in stream:
                    txt = getattr(chunk, "text", "") or ""
                    if txt:
                        streamed = True
                        yield txt
                if streamed:
                    return
            except Exception as e:
                last_exc = e
                logger.warning(f"Gemini stream model '{g_model}' failed: {e}")
                if streamed:
                    return
                continue
        if last_exc:
            raise last_exc

    async def _generate_text(self, prompt: str, max_tokens: int = 800, temperature: float = 0.2) -> str:
        """Helper to generate text using Groq with automatic Gemini fallback."""
        if not self._groq_is_cooling() and settings.GROQ_API_KEY and Groq:
            for model in self._tool_models:
                try:
                    groq_client = Groq(api_key=settings.GROQ_API_KEY)
                    resp = await asyncio.to_thread(
                        lambda m=model: groq_client.chat.completions.create(
                            model=m,
                            messages=[{"role": "user", "content": prompt}],
                            max_tokens=max_tokens,
                            temperature=temperature,
                        )
                    )
                    if resp.choices and resp.choices[0].message.content:
                        return resp.choices[0].message.content.strip()
                except Exception as e:
                    err = str(e).lower()
                    if "429" in err or "rate limit" in err or "tpm" in err:
                        self._groq_mark_cooldown(45.0)
                        logger.warning(f"Groq 429 during text gen: {e}. Switching to Gemini fallback.")
                        break
                    logger.warning(f"Groq model '{model}' text gen failed: {e}")

        gemini_client = self._get_gemini_client()
        if gemini_client and genai_types:
            config = genai_types.GenerateContentConfig(
                max_output_tokens=max_tokens,
                temperature=temperature,
            )
            for g_model in self._gemini_models:
                try:
                    resp = await asyncio.to_thread(
                        lambda m=g_model: gemini_client.models.generate_content(
                            model=m, contents=prompt, config=config
                        )
                    )
                    if resp.text:
                        return resp.text.strip()
                except Exception as gm_err:
                    logger.warning(f"Gemini model '{g_model}' text gen failed: {gm_err}")
                    continue

        raise RuntimeError("All LLM providers failed to generate text.")

    # ── Multi-provider synthesis streaming ────────────────────────────────────
    async def _stream_tokens_with_fallback(
        self,
        groq_client: Any,
        gemini_client: Any,
        messages: list,
        models: list[str],
        max_tokens: int = 900,
        temperature: float = 0.4,
        fallback_notice_cb: Any = None,
    ) -> AsyncGenerator[str, None]:
        """
        Stream tokens with Groq-primary / Gemini-secondary cross-provider failover.
        - If Groq is in 429 cooldown, routes immediately to Gemini (no wasted wait time).
        - If any Groq model returns 429 mid-request, activates cooldown and fails over.
        """
        last_exc = None
        streamed_any = False

        # ── Fast-path: Groq is cooling down → go straight to Gemini ──────────
        if self._groq_is_cooling() and gemini_client:
            logger.info("Groq in cooldown — streaming synthesis via Gemini directly")
            if fallback_notice_cb:
                await fallback_notice_cb()
            async for token in self._stream_gemini(gemini_client, messages, max_tokens, temperature):
                streamed_any = True
                yield token
            if streamed_any:
                return

        # ── Try each Groq model ───────────────────────────────────────────────
        elif groq_client:
            for model in models:
                streamed_any = False
                try:
                    final_resp = await asyncio.wait_for(
                        asyncio.to_thread(
                            lambda m=model: groq_client.chat.completions.create(
                                model=m, messages=messages,
                                max_tokens=max_tokens, temperature=temperature, stream=True,
                            )
                        ),
                        timeout=10.0,
                    )
                    for chunk in final_resp:
                        delta = chunk.choices[0].delta
                        if delta and delta.content:
                            streamed_any = True
                            yield delta.content
                    return  # success — done
                except asyncio.TimeoutError:
                    last_exc = asyncio.TimeoutError(f"Model '{model}' synthesis timed out after 10s")
                    logger.warning(f"Synthesis timeout on '{model}'. Trying next fallback...")
                    if streamed_any:
                        return
                    continue
                except Exception as exc:
                    last_exc = exc
                    err = str(exc).lower()
                    if "429" in err or "rate limit" in err or "tpm" in err or "tokens per minute" in err:
                        self._groq_mark_cooldown(45.0)
                        logger.warning(f"Groq 429 on '{model}' during synthesis — switching to Gemini")
                        if streamed_any:
                            return
                        break  # break to Gemini fallback below
                    logger.warning(f"Synthesis error on '{model}': {exc}")
                    if streamed_any:
                        return
                    continue

        # ── Gemini fallback ───────────────────────────────────────────────────
        if not streamed_any and gemini_client:
            logger.info("Failing over synthesis to Gemini...")
            if fallback_notice_cb:
                await fallback_notice_cb()
            try:
                async for token in self._stream_gemini(gemini_client, messages, max_tokens, temperature):
                    streamed_any = True
                    yield token
                if streamed_any:
                    return
            except Exception as g_exc:
                logger.error(f"Gemini synthesis also failed: {g_exc}")
                last_exc = g_exc

        if not streamed_any:
            raise last_exc or RuntimeError("All synthesis providers failed.")

    # ── Multi-provider LLM tool caller ────────────────────────────────────────
    async def _call_llm_with_fallback(
        self,
        groq_client: Any,
        gemini_client: Any,
        messages: list,
        models: list[str],
        tools: list | None = None,
        tool_choice: Any = None,
        max_tokens: int = 600,
        temperature: float = 0.25,
        stream: bool = False,
        fallback_notice_cb: Any = None,
    ):
        """
        Execute one LLM hop with Groq primary and Google Gemini cross-provider failover.
        Respects the Groq rate-limit circuit breaker; when active routes directly to Gemini.
        Returns a (response, model_name) tuple whose response is Groq- or _Mock-shaped.
        """
        last_exc = None

        # ── Fast-path: Groq cooldown active ──────────────────────────────────
        if self._groq_is_cooling() and gemini_client:
            logger.info("Groq in cooldown — routing tool call directly to Gemini")
            if fallback_notice_cb:
                await fallback_notice_cb()
            try:
                return await self._call_gemini_planner(
                    gemini_client, messages, tools, tool_choice, max_tokens, temperature
                )
            except Exception as g_exc:
                logger.warning(f"Gemini direct planner failed: {g_exc}")
                last_exc = g_exc

        # ── Try each Groq model ───────────────────────────────────────────────
        elif groq_client:
            for model in models:
                kw = {"max_tokens": max_tokens, "temperature": temperature, "stream": stream}
                if tools is not None:
                    kw["tools"] = tools
                if tool_choice is not None:
                    kw["tool_choice"] = tool_choice
                try:
                    resp = await asyncio.wait_for(
                        asyncio.to_thread(
                            lambda m=model, kw_args=kw: groq_client.chat.completions.create(
                                model=m, messages=messages, **kw_args
                            )
                        ),
                        timeout=10.0,
                    )
                    return resp, model
                except asyncio.TimeoutError:
                    last_exc = asyncio.TimeoutError(f"Model '{model}' timed out after 10s")
                    logger.warning(f"LLM timeout on '{model}'. Trying next fallback...")
                    continue
                except Exception as exc:
                    last_exc = exc
                    err = str(exc).lower()
                    if "429" in err or "rate limit" in err or "tpm" in err or "tokens per minute" in err:
                        self._groq_mark_cooldown(45.0)
                        logger.warning(f"Groq 429 on '{model}' — switching to Gemini fallback")
                        break  # single break; all Groq models share same rate-limited key
                    logger.warning(f"LLM call failed on '{model}': {exc}. Checking tool-choice retry...")
                    if tools is not None and tool_choice is not None and tool_choice != "auto":
                        try:
                            auto_kw = {**kw, "tool_choice": "auto"}
                            resp = await asyncio.wait_for(
                                asyncio.to_thread(
                                    lambda m=model, kw_args=auto_kw: groq_client.chat.completions.create(
                                        model=m, messages=messages, **kw_args
                                    )
                                ),
                                timeout=10.0,
                            )
                            return resp, model
                        except Exception as exc2:
                            last_exc = exc2
                            logger.warning(f"tool_choice='auto' retry on '{model}' also failed: {exc2}")
                    continue

        # ── Gemini fallback ───────────────────────────────────────────────────
        if gemini_client:
            logger.info("Failing over tool planning to Gemini...")
            if fallback_notice_cb:
                await fallback_notice_cb()
            try:
                return await self._call_gemini_planner(
                    gemini_client, messages, tools, tool_choice, max_tokens, temperature
                )
            except Exception as g_exc:
                logger.error(f"Gemini fallback also failed: {g_exc}")
                last_exc = g_exc

        raise last_exc or RuntimeError("All LLM providers (Groq and Gemini) failed.")


    # ── System Prompt ──────────────────────────────────────────────────────────
    def _build_system_prompt(self, memory_ctx: str, now: str, intent: dict, mode: str = "suggest") -> str:
        priority_block = ""
        if intent.get("priority") == "urgent":
            priority_block = "\n⚠️ URGENT REQUEST — respond with maximum priority and urgency.\n"

        mode_clean = (mode or "suggest").lower()
        if mode_clean == "autopilot":
            mode_directive = """
━━━ AUTONOMY MODE: AUTO-PILOT (FULL AUTONOMY ENABLED) ━━━
• You are operating in AUTO-PILOT mode: The user has authorized you to take direct actions.
• When the user requests an action (scheduling meetings, sending emails, updating tasks, setting reminders, running automations):
  - Do NOT pause to ask "Would you like me to schedule this?" or render approval confirmation cards.
  - Call the relevant execution tool immediately (e.g., create_calendar_event, compose_email, task_management).
  - Execute the action and report the confirmed outcome with all details directly.
  - Only ask clarifying questions if mandatory parameters (such as an email address) are completely missing.
"""
        elif mode_clean == "ask":
            mode_directive = """
━━━ AUTONOMY MODE: ASK FIRST (STRICT HUMAN-IN-THE-LOOP SAFEGUARDS) ━━━
• You are operating in ASK FIRST mode: You have ZERO autonomy to perform write/mutation actions without human approval!
• You may freely call READ-ONLY tools (checking emails, reading calendar events, search, analytics).
• You are STRICTLY FORBIDDEN from executing write tools (compose_email, create_calendar_event, create_meet_and_email, schedule_automation, task modifications) autonomously.
• When the user requests an action, you MUST emit an interactive Safeguard Approval Card:
```artifact:safeguard
{{
  "action": "<action_name>",
  "tool": "<tool_name>",
  "title": "Approve <Descriptive Action>",
  "risk_level": "medium",
  "description": "<Clear explanation of the action to be performed>",
  "args": {{ ... }}
}}
```
• This allows the user to review the exact parameters and click [Approve & Execute] or [Decline].
"""
        else:  # "suggest"
            mode_directive = """
━━━ AUTONOMY MODE: SUGGEST (ASSISTED DRAFTING & REVIEW) ━━━
• You are operating in SUGGEST mode: AI suggests, user approves before acting.
• For read tools: fetch live workspace data freely to answer questions.
• For action requests (scheduling meetings, sending emails, creating tasks):
  - Propose drafts using interactive Generative UI cards:
    * For meetings/calls: render an ```artifact:meeting ... ``` card with editable details and a [Confirm & Schedule] button.
    * For open slots: render an ```artifact:slot_picker ... ``` card.
    * For emails: present a clear draft preview for the user to review.
  - Do NOT silently execute write tools in the background without user review.
"""

        return f"""You are WorkPilot SuperBrain — the most advanced AI Chief of Staff ever built. You combine the analytical power of a top management consultant, the technical depth of a senior engineer, and the organizational skill of an elite executive assistant.

Current date/time: {now}
{priority_block}
{mode_directive}
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
4. If an external integration fails with a technical/API error: call diagnose_issue to find root cause. If a tool requests user clarification or indicates a placeholder (e.g. asking which repository to use), directly explain this to the user and prompt for the required input without calling diagnose_issue.
5. Be DIRECT. Never start with "Certainly!", "Of course!", "Great question!", or any filler phrase.
6. Use rich markdown: **bold** names, • bullet lists, ```code blocks```, > quotes for highlights.
7. Always end your response with a concrete **Next Action** you can take on the user's behalf.
8. When the user seems stressed or the request is urgent: acknowledge the pressure first, then solve.
9. Reference past context naturally: "As you mentioned earlier..." or "Following up on the email to..."
10. When you detect anomalies in data (e.g., 3 urgent emails with no reply, team member 2 days late), proactively flag them.
11. CONVERSATIONAL CONTINUITY & CONTEXT RESOLUTION: Always maintain continuity with the ongoing chat. When the user uses relative references like "it", "that repo", "the repository which we've created", "the issue we just opened", or "that meeting", immediately resolve the target repository, issue number, or parameters from the preceding conversation history turns instead of asking the user to re-enter them!

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

━━━ GENERATIVE UI & IN-CHAT INTERACTIVE ARTIFACTS ━━━
You can render rich interactive mini-apps inside the chat by including special artifact code blocks in your response:

1. **Interactive Meeting Invitation Card:**
When the user wants to draft, schedule, or invite to a meeting (or when you propose a meeting with known/partial details), include an interactive meeting card:
```artifact:meeting
{{
  "title": "Product Sync with Sarah",
  "date": "2026-09-15",
  "time": "3:00 PM",
  "duration_minutes": 45,
  "attendees": ["sarah@company.com"],
  "platform": "Google Meet",
  "description": "Weekly progress sync"
}}
```
The user can edit details inline or click [Confirm & Schedule] directly in the UI!

2. **Visual Calendar Slot Picker:**
When proposing or finding meeting availability:
```artifact:slot_picker
{{
  "title": "Select a Free Slot",
  "duration_minutes": 30,
  "slots": [
    {{"date": "Tomorrow", "time": "10:00 AM", "available": true}},
    {{"date": "Tomorrow", "time": "02:30 PM", "available": true}},
    {{"date": "Friday", "time": "11:00 AM", "available": true}}
  ]
}}
```

3. **Safeguard Approval Card (Human-in-the-Loop):**
When about to perform a high-impact action:
```artifact:safeguard
{{
  "action": "bulk_email_campaign",
  "tool": "compose_email",
  "title": "Approve Bulk Email Dispatch",
  "risk_level": "medium",
  "description": "Send meeting preparation notes to stakeholders",
  "args": {{}}
}}
```

4. **Interactive Analytics Chart Card:**
When summarizing productivity, focus hours, email volume, or team progress:
```artifact:analytics
{{
  "title": "Productivity & Focus Trends",
  "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  "values": [4.2, 5.8, 6.1, 6.5, 7.2, 5.9, 6.5],
  "unit": "hours",
  "highlight": "Peak performance on Friday (7.2 hrs)"
}}
```

5. **Interactive Choice & Repository Selector Card:**
When the user needs to select between options (such as picking a repository, channel, platform, template, or category):
```artifact:options
{{
  "title": "Select Repository for New Issue",
  "description": "Choose which repository to create the issue in:",
  "options": [
    {{"label": "Shivam98-cd/WorkPilot-AI", "value": "Shivam98-cd/WorkPilot-AI", "badge": "Core"}},
    {{"label": "Shivam98-cd/workpilot-tool-test-1789705467", "value": "Shivam98-cd/workpilot-tool-test-1789705467", "badge": "Test Repo"}}
  ],
  "submit_label": "Create Issue in Selected Repo"
}}
```

━━━ CRITICAL MARKDOWN & GENERATIVE UI RULES ━━━
• NEVER write XML or HTML tags like `<artifact:slot_picker>` or `<artifact:...>`. NEVER invent custom JSX/HTML tags! ALWAYS use triple-backtick markdown code blocks: ```artifact:options or ```artifact:safeguard with valid JSON.
• NEVER output bare/raw JSON blocks (e.g. `{{ "title": ... }}`) as plain text without code fences! If proposing an action confirmation, ALWAYS enclose it in ```artifact:safeguard\n{{ ... }}\n``` so the frontend renders it as interactive buttons instead of raw code.
• NEVER repeat choices across multiple formats in the same response (e.g., DO NOT output a markdown table AND a numbered list AND a card repeating the same repositories). Use ONE clean presentation: either the interactive card, or a clean single-source markdown table.
• Keep text concise and actionable: state what is needed in 1-2 crisp sentences, present the interactive card or table, and state the exact next action.

━━━ RESPONSE STYLE ━━━
• Concise but complete — no padding, no fluff, no repetitive lists
• Data-driven — ground every claim in tool results with citations
• Action-oriented — always move the conversation toward immediate resolution
• Empathetic when needed — recognize stress, workload, or urgency cues
• Professional but natural — like a brilliant Chief of Staff, not a bureaucratic template
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
                content = await self._generate_text(f"{prompt}\n\n```{lang}\n{code}\n```", max_tokens=1200, temperature=0.2)
                return {"action": action, "language": lang, "result": content, "source": "ai_assistant"}
            except Exception as e:
                return {"error": str(e)}

        if name == "analyze_data":
            analysis_type = args.get("analysis_type", "summary")
            data_str      = args.get("data", "")
            prompt = (
                f"Perform a thorough **{analysis_type}** analysis on the following data. "
                f"Be specific with numbers, percentages, and actionable insights. "
                f"Use markdown formatting:\n\n{data_str}"
            )
            try:
                content = await self._generate_text(prompt, max_tokens=800, temperature=0.2)
                return {"analysis_type": analysis_type, "result": content, "source": "ai_assistant"}
            except Exception as e:
                return {"error": str(e)}


        if name in ("github_tool", "jira_tool", "slack_tool", "zoom_tool"):
            platform_map = {"github_tool": "github", "jira_tool": "jira", "slack_tool": "slack", "zoom_tool": "zoom"}
            platform = platform_map[name]
            action   = args.get("action", "list")
            try:
                from services.integration_service import integration_service
                clean_args = {k: v for k, v in args.items() if k not in ("action", "platform")}
                data = await integration_service.get_platform_data(uid, platform, action=action, **clean_args)
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

        # ── Autonomous Cross-Platform Multi-Hop Workflows ──────────────────────
        if name == "prepare_meeting_briefing":
            meeting_query = args.get("meeting_query", "")
            attendee_email = args.get("attendee_email", "")
            days_ahead = args.get("days_ahead", 2)
            
            import importlib
            mod = importlib.import_module("api.v1.endpoints.ai_chat")
            cal_data = await mod._execute_tool("get_calendar_events", {"days_ahead": days_ahead}, uid)
            events = cal_data.get("events", []) if isinstance(cal_data, dict) else []
            
            target_event = None
            if meeting_query and events:
                for ev in events:
                    if meeting_query.lower() in ev.get("title", "").lower() or any(meeting_query.lower() in str(a).lower() for a in ev.get("attendees", [])):
                        target_event = ev
                        break
            if not target_event and events:
                target_event = events[0]
            
            email_data = await mod._execute_tool("get_emails", {"limit": 10, "filter": "all"}, uid)
            all_emails = email_data.get("emails", []) if isinstance(email_data, dict) else []
            
            relevant_emails = []
            attendees = target_event.get("attendees", []) if target_event else []
            if attendee_email and attendee_email not in attendees:
                attendees.append(attendee_email)
            
            for em in all_emails:
                sender = em.get("sender", "") or em.get("from", "")
                subj = em.get("subject", "")
                if any(att.lower() in sender.lower() for att in attendees if "@" in att) or (target_event and target_event.get("title", "").lower() in subj.lower()):
                    relevant_emails.append(em)
            
            if not relevant_emails and all_emails:
                relevant_emails = all_emails[:3]
                
            notion_notes = []
            try:
                from services.integration_service import integration_service
                n_res = await integration_service.get_platform_data(uid, "notion", "search")
                if isinstance(n_res, list):
                    notion_notes = n_res[:3]
            except Exception:
                pass

            return {
                "workflow": "prepare_meeting_briefing",
                "meeting": target_event or {"title": meeting_query or "Upcoming Meeting", "time": "Today", "status": "Confirmed"},
                "attendees": attendees,
                "related_emails": relevant_emails,
                "notion_context": notion_notes,
                "summary": f"Cross-platform briefing prepared: Calendar event matched with {len(relevant_emails)} email thread(s) and {len(notion_notes)} workspace doc(s)."
            }

        if name == "inbox_triage_workflow":
            urgency_filter = args.get("urgency_filter", "urgent")
            draft_replies = args.get("draft_replies", True)
            limit = args.get("limit", 10)
            
            import importlib
            mod = importlib.import_module("api.v1.endpoints.ai_chat")
            email_data = await mod._execute_tool("get_emails", {"limit": limit, "filter": "all"}, uid)
            emails = email_data.get("emails", []) if isinstance(email_data, dict) else []
            
            cal_data = await mod._execute_tool("get_calendar_events", {"days_ahead": 2}, uid)
            events = cal_data.get("events", []) if isinstance(cal_data, dict) else []
            
            categorized = {
                "urgent_action_required": [],
                "meeting_scheduling": [],
                "informational": [],
                "newsletters_low_priority": []
            }
            
            for em in emails:
                subj = em.get("subject", "").lower()
                snip = em.get("snippet", "").lower()
                if any(w in subj or w in snip for w in ["urgent", "asap", "review", "deadline", "action required", "important"]):
                    categorized["urgent_action_required"].append(em)
                elif any(w in subj or w in snip for w in ["meeting", "calendar", "invite", "call", "schedule", "sync"]):
                    categorized["meeting_scheduling"].append(em)
                elif any(w in subj or w in snip for w in ["newsletter", "digest", "unsubscribe", "update", "promo"]):
                    categorized["newsletters_low_priority"].append(em)
                else:
                    categorized["informational"].append(em)
                    
            return {
                "workflow": "inbox_triage_workflow",
                "total_scanned": len(emails),
                "categorized": categorized,
                "upcoming_schedule": [e.get("title") for e in events[:3]],
                "ready_for_reply_drafting": draft_replies,
                "status": "success"
            }

        if name == "workspace_cross_search":
            query = args.get("query", "").lower()
            platforms = args.get("platforms", ["gmail", "calendar", "notion", "github"])
            
            import importlib
            mod = importlib.import_module("api.v1.endpoints.ai_chat")
            
            results = {}
            if "gmail" in platforms or "emails" in platforms:
                e_data = await mod._execute_tool("get_emails", {"limit": 10, "filter": "all"}, uid)
                emails = e_data.get("emails", []) if isinstance(e_data, dict) else []
                matching_emails = [e for e in emails if query in str(e).lower()]
                results["gmail"] = matching_emails[:5]
                
            if "calendar" in platforms:
                c_data = await mod._execute_tool("get_calendar_events", {"days_ahead": 7}, uid)
                events = c_data.get("events", []) if isinstance(c_data, dict) else []
                matching_events = [e for e in events if query in str(e).lower()]
                results["calendar"] = matching_events[:5]
                
            from services.integration_service import integration_service
            if "notion" in platforms:
                try:
                    n_data = await integration_service.get_platform_data(uid, "notion", "search")
                    results["notion"] = [n for n in (n_data if isinstance(n_data, list) else []) if query in str(n).lower()][:5]
                except Exception:
                    results["notion"] = []
                    
            if "github" in platforms:
                try:
                    g_data = await integration_service.get_platform_data(uid, "github", "list")
                    results["github"] = [g for g in (g_data if isinstance(g_data, list) else []) if query in str(g).lower()][:5]
                except Exception:
                    results["github"] = []
                    
            return {
                "workflow": "workspace_cross_search",
                "query": query,
                "findings": results,
                "total_matches": sum(len(v) for v in results.values()),
                "status": "success"
            }

        if name == "query_knowledge_base":
            query_str = (args.get("query") or "").strip()
            doc_id = args.get("doc_id")
            top_k = int(args.get("top_k", 4))
            from services.vector_knowledge_service import vector_knowledge_service
            matches = vector_knowledge_service.semantic_search(uid, query_str, top_k=top_k, doc_id=doc_id)
            if not matches:
                return {
                    "success": True,
                    "query": query_str,
                    "matches": [],
                    "message": "No matching documents or excerpts found in the vector knowledge base for this query.",
                }
            ans = vector_knowledge_service.answer_query(uid, doc_id or matches[0]["doc_id"], query_str)
            return {
                "success": True,
                "query": query_str,
                "matches": matches,
                "synthesized_answer": ans.get("answer"),
                "sources": ans.get("sources", []),
                "cloud_vector_db": matches[0].get("source", "pinecone_cloud"),
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
        mode: str = "suggest",
        history: list[dict] | None = None,
    ) -> AsyncGenerator[str, None]:
        """
        Full multi-agent pipeline: classify → remember → plan → execute → criticise → synthesise → stream.
        Maintains conversational memory across turns and integrates with persistent user memory.
        """
        local_dt = datetime.now().astimezone()
        now_local = local_dt.strftime("%A, %B %d, %Y %I:%M %p %Z")
        now_utc = datetime.now(timezone.utc).strftime("%I:%M %p UTC")
        now = f"{now_local} (UTC: {now_utc})"
        conv_id = conversation_id or str(uuid.uuid4())
        conv_history = self._convs[f"{uid}:{conv_id}"]

        # Synchronize conversation history sent from client (AICockpit msgs)
        if history:
            for item in history:
                r = item.get("role") or ("assistant" if item.get("r") == "ai" else "user")
                c = (item.get("content") or item.get("text") or "").strip()
                if c and not any(existing.get("content") == c for existing in conv_history):
                    conv_history.append({"role": r, "content": c})

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

        # ── 4. Groq + Gemini clients ────────────────────────────────────────────
        groq_key      = settings.GROQ_API_KEY
        groq_client   = Groq(api_key=groq_key) if groq_key and Groq else None
        gemini_client = self._get_gemini_client()

        if not groq_client and not gemini_client:
            yield _sse({"type": "token", "content": "⚠️ No AI provider configured. Please add GROQ_API_KEY or GEMINI_API_KEY to your .env file."})
            yield "data: [DONE]\n\n"
            return

        if not groq_client and gemini_client:
            yield _sse({"type": "alert", "level": "info", "message": "⚠️ Groq API key not found — using Gemini fallback engine."})

        # ── 5. Build messages ──────────────────────────────────────────────────
        system_prompt = self._build_system_prompt(memory_ctx, now, intent, mode=mode)
        messages = [{"role": "system", "content": system_prompt}]
        # Include recent conversation history turns
        for h in list(conv_history)[-12:]:
            messages.append({"role": h["role"], "content": h["content"]})
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
            # ── 7. Multi-Hop Autonomous ReAct Loop (Up to 4 sequential hops) ──
            all_tool_results = []
            
            # Select focused tools matching intent/query to prevent token bloat & 60s timeouts
            active_category = intent.get("category", "general")
            active_tools = get_tools_for_request(message, category=active_category, forced_tool=forced_tool)

            # Lightweight planner prompt for tool selection (avoids sending 8,000 char prompt during tool hops)
            tool_planner_prompt = f"""You are WorkPilot AI Chief of Staff tool coordinator.
Current User Local Date/Time: {now}
CRITICAL TIMEZONE RULE: Always interpret times (e.g. '9:00 AM', 'morning', 'today') relative to the user's local timezone ({now_local}), NOT UTC!
USER CONTEXT:
{memory_ctx or "No prior context"}

Select the most appropriate tool(s) to execute. Always use real workspace tools to fetch or act on data before answering."""

            loop_messages = [{"role": "system", "content": tool_planner_prompt}]
            for h in list(conv_history)[-6:]:
                loop_messages.append({"role": h["role"], "content": h["content"]})
            loop_messages.append({"role": "user", "content": message})

            MAX_HOPS = 4

            for hop in range(1, MAX_HOPS + 1):
                call_kwargs: dict = {"tool_choice": "auto"}
                if hop == 1 and forced_tool and not is_ambiguous_query(message):
                    call_kwargs["tool_choice"] = {"type": "function", "function": {"name": forced_tool}}
                    logger.info(f"Hop 1: Forcing tool choice: {forced_tool}")
                elif hop == 1 and forced_tool:
                    logger.info(f"Hop 1: Suggested tool {forced_tool} but letting LLM decide due to ambiguous query")

                step_resp, active_model = await self._call_llm_with_fallback(
                    groq_client=groq_client,
                    gemini_client=gemini_client,
                    messages=loop_messages,
                    models=self._tool_models,
                    tools=active_tools,
                    tool_choice=call_kwargs.get("tool_choice", "auto"),
                    max_tokens=600,
                    temperature=0.2,
                )

                step_msg = step_resp.choices[0].message
                tool_calls = step_msg.tool_calls or []

                if not tool_calls:
                    logger.info(f"Hop {hop}: No further tools called, terminating agent loop.")
                    break

                # ── Real-Time Workflow Step SSE Emission ───────────────────────
                FRIENDLY_TOOL_NAMES = {
                    "get_emails": "Gmail Inbox",
                    "get_calendar_events": "Google Calendar",
                    "create_calendar_event": "Google Calendar Event",
                    "create_meet_and_email": "Google Meet",
                    "compose_email": "Gmail Draft",
                    "notion_tool": "Notion Workspace",
                    "github_tool": "GitHub",
                    "jira_tool": "Jira Backlog",
                    "slack_tool": "Slack",
                    "zoom_tool": "Zoom",
                    "web_search": "Web Search",
                    "prepare_meeting_briefing": "Meeting Briefing",
                    "inbox_triage_workflow": "Inbox Triage & Schedule",
                    "workspace_cross_search": "360° Workspace Cross-Search",
                    "get_team_members": "Team Roster",
                    "get_deployments": "Deployments",
                    "get_analytics": "Analytics",
                    "get_integrations_status": "Integrations",
                    "improve_text": "Text Polish",
                    "schedule_automation": "Automation",
                    "generate_report": "Report Generation",
                    "find_meeting_time": "Availability Check",
                    "task_management": "Task Manager",
                    "diagnose_issue": "Diagnostics",
                    "set_reminder": "Smart Reminder",
                    "query_knowledge_base": "Pinecone Vector RAG",
                }

                tool_names = [tc.function.name for tc in tool_calls]
                friendly_names = [FRIENDLY_TOOL_NAMES.get(name, name) for name in tool_names]
                step_title = f"Step {hop}: {' + '.join(friendly_names)}"
                yield _sse({
                    "type": "workflow_step",
                    "hop": hop,
                    "step_title": step_title,
                    "tools": tool_names,
                    "message": f"Autonomous Workflow Step {hop}: running {len(tool_calls)} action(s)...",
                })

                MUTATING_TOOLS = {
                    "compose_email", "create_calendar_event", "create_meet_and_email",
                    "schedule_automation", "sync_integration"
                }

                async def exec_one(tc, current_hop=hop):
                    tname = tc.function.name
                    try:
                        targs = json.loads(tc.function.arguments or "{}")
                    except Exception:
                        targs = {}

                    # Strict safeguard check in Ask First mode
                    if (mode or "").lower() == "ask" and tname in MUTATING_TOOLS:
                        logger.info(f"Safeguard intercepted mutating tool '{tname}' under 'Ask First' mode")
                        think = f"🛡️ Safeguard: Requiring user authorization for {tname}..."
                        result = {
                            "status": "requires_safeguard_approval",
                            "tool": tname,
                            "action": tname,
                            "args": targs,
                            "title": f"Approve {tname.replace('_', ' ').title()}",
                            "description": f"Action paused for human confirmation under 'Ask First' policy.",
                            "risk_level": "medium",
                            "instruction": "Render an ```artifact:safeguard ... ``` approval card with these exact tool and args so the user can approve."
                        }
                        return tc.id, tname, targs, result, think, current_hop

                    think = THINK_MSGS.get(tname, f"⚙️ Running {tname}...")
                    result = await self._execute_tool(tname, targs, uid)
                    return tc.id, tname, targs, result, think, current_hop

                gathered = await asyncio.gather(*[exec_one(tc) for tc in tool_calls], return_exceptions=True)

                # Append assistant tool calls to message history for next hop
                loop_messages.append(step_msg)

                stop_hops = False
                for item in gathered:
                    if isinstance(item, Exception):
                        logger.error(f"Tool gather error in hop {hop}: {item}")
                        continue
                    tc_id, tname, targs, result, think_msg, current_hop = item

                    yield _sse({"type": "tool_start", "tool": tname, "message": think_msg})

                    # Critic check
                    critic_data = result.get("_critic") if isinstance(result, dict) else None
                    if critic_data and critic_data.get("status") == "error":
                        severity = critic_data.get("severity", "medium")
                        level    = "error" if severity in ("critical", "high") else "warning"
                        fix      = critic_data.get("fix_suggestion", "Check the integration.")
                        yield _sse({"type": "alert", "level": level, "message": fix})

                    yield _sse({"type": "tool_done", "tool": tname})
                    all_tool_results.append({"id": tc_id, "name": tname, "result": result, "hop": current_hop})

                    # Feed tool response into loop_messages for context chaining in subsequent hops
                    result_str = json.dumps(result, ensure_ascii=False)[:3000]
                    loop_messages.append({
                        "role": "tool",
                        "tool_call_id": tc_id,
                        "name": tname,
                        "content": result_str,
                    })

                    # Stop hops early if composite cross-platform pipeline finished
                    if tname in ("prepare_meeting_briefing", "inbox_triage_workflow", "workspace_cross_search"):
                        stop_hops = True

                if stop_hops:
                    logger.info(f"Composite multi-hop tool completed in hop {hop}, ending workflow loop.")
                    break

            tool_results = all_tool_results

            # ── 8. Synthesis LLM call with aggregated multi-hop data ──────────
            if all_tool_results:
                tool_summary = "\n\n━━━ WORKSPACE CROSS-PLATFORM DATA ━━━\n"
                for tr in all_tool_results:
                    result_str = json.dumps(tr["result"], ensure_ascii=False)[:2500]
                    tool_summary += f"\n[Step {tr.get('hop', 1)} | Tool: {tr['name']}]\n{result_str}\n"

                mode_clean = (mode or "suggest").lower()
                mode_guidance = {
                    "autopilot": "AUTONOMY MODE: AUTO-PILOT. Confirm the executed actions directly and summarize next steps.",
                    "suggest": "AUTONOMY MODE: SUGGEST. Present proposals with interactive Generative UI cards (e.g. artifact:meeting or artifact:slot_picker) so the user can review and confirm before final execution.",
                    "ask": "AUTONOMY MODE: ASK FIRST. Strict safeguard mode. For any action requiring user authorization, render an ```artifact:safeguard ... ``` approval card with the tool name and arguments so the user can review and click [Approve & Execute]."
                }.get(mode_clean, "")

                synthesis_messages = [
                    {
                        "role": "system",
                        "content": f"""You are WorkPilot AI Chief of Staff. Answer the user's question using the multi-step data gathered across integrations below.

Current date/time: {now}
{mode_guidance}

USER CONTEXT:
{memory_ctx or "No prior context"}

MULTI-HOP WORKFLOW DATA:
{tool_summary}

Provide a clear, structured, and executive-grade response based on this cross-platform data. Use markdown formatting (headings, bullet points, tables, bold text)."""
                    }
                ]
                # Carry recent turns into synthesis so LLM remembers conversational context!
                for h in list(conv_history)[-8:]:
                    synthesis_messages.append({"role": h["role"], "content": h["content"]})
                synthesis_messages.append({"role": "user", "content": message})

                yield _sse({"type": "thinking", "content": "Synthesizing cross-platform insights..."})

            # ── 10. Stream tokens ──────────────────────────────────────────────
            full_response = ""
            synth_msg_list = synthesis_messages if all_tool_results else messages
            async for token in self._stream_tokens_with_fallback(
                groq_client=groq_client,
                gemini_client=gemini_client,
                messages=synth_msg_list,
                models=self._synth_models,
                max_tokens=900,
                temperature=0.4,
            ):
                full_response += token
                yield _sse({"type": "token", "content": token})


            # ── 11. Save to memory ─────────────────────────────────────────────
            last_tool = all_tool_results[-1]["name"] if all_tool_results else None
            try:
                await self.memory.add_interaction(uid, "user", message, tool_used=last_tool)
                await self.memory.add_interaction(uid, "assistant", full_response[:600])
                # Proactively extract entities from assistant response (created repos, issues, meetings)
                await self.memory.extract_entities(uid, full_response)
            except Exception:
                pass

            # Update in-memory session history
            conv_history.append({"role": "user", "content": message})
            conv_history.append({"role": "assistant", "content": full_response})

            # ── 11b. Persist to Firestore chat_repository for cross-device ChatGPT history ──
            if conv_id and uid != "anonymous":
                try:
                    from repositories.chat_repository import chat_repository
                    chat_title = message.strip()[:60] or "New workspace chat"
                    await chat_repository.append_message(
                        uid, conv_id,
                        {"role": "user", "content": message, "timestamp": datetime.now(timezone.utc).isoformat()},
                        chat_title,
                    )
                    await chat_repository.append_message(
                        uid, conv_id,
                        {"role": "assistant", "content": full_response, "timestamp": datetime.now(timezone.utc).isoformat()},
                        chat_title,
                    )
                except Exception as ex:
                    logger.warning(f"Could not persist conversation {conv_id} to Firestore: {ex}")

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
            err_text = str(e).lower()
            if "rate limit" in err_text or "429" in err_text:
                user_message = "AI service rate limit reached temporarily. Please wait a moment and try again."
            else:
                user_message = "I encountered a technical issue while processing your request. Please try rephrasing or simplifying your question."
            yield _sse({"type": "alert", "level": "error", "message": user_message})
            yield _sse({"type": "token", "content": f"\n\n{user_message}"})

        finally:
            yield "data: [DONE]\n\n"


# ── Module-level singleton ─────────────────────────────────────────────────────
superbrain = SuperBrainOrchestrator()
