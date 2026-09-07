# WorkPilot SuperBrain — Memory Agent
"""
Persistent multi-layer memory system.
Stores episodic memory, entity graph, preferences, and action history per user.
"""
import asyncio
import re
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger("superbrain.memory")

# ── In-memory fallback (used when Firestore is unavailable) ───────────────────
_MEM_CACHE: dict = {}


@dataclass
class UserMemory:
    uid: str = ""
    # Last N interactions  {role, content, tool_used, ts}
    episodic: list = field(default_factory=list)
    # Named entities: people, projects, emails, deadlines
    entities: dict = field(default_factory=dict)
    # User preferences: tone, working_hours, priorities, etc.
    preferences: dict = field(default_factory=dict)
    # Actions taken: {tool, args_summary, ts, success}
    action_history: list = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "uid": self.uid,
            "episodic": self.episodic[-50:],
            "entities": self.entities,
            "preferences": self.preferences,
            "action_history": self.action_history[-100:],
        }

    @staticmethod
    def from_dict(d: dict) -> "UserMemory":
        return UserMemory(
            uid=d.get("uid", ""),
            episodic=d.get("episodic", []),
            entities=d.get("entities", {}),
            preferences=d.get("preferences", {}),
            action_history=d.get("action_history", []),
        )


class MemoryManager:
    """Manages persistent user memory with Firestore backend."""

    MAX_EPISODIC = 50
    MAX_ACTIONS  = 100

    def __init__(self):
        self._local: dict[str, UserMemory] = {}

    # ── Firestore helpers ──────────────────────────────────────────────────────
    def _get_doc(self, uid: str):
        try:
            from repositories.workspace_repository import workspace_repository
            return workspace_repository.db.collection("ai_memory").document(uid)
        except Exception:
            return None

    async def get_memory(self, uid: str) -> UserMemory:
        """Load memory from Firestore (falls back to local cache)."""
        if uid in self._local:
            return self._local[uid]
        try:
            doc_ref = self._get_doc(uid)
            if doc_ref:
                snap = await asyncio.to_thread(doc_ref.get)
                if snap.exists:
                    mem = UserMemory.from_dict(snap.to_dict())
                    self._local[uid] = mem
                    return mem
        except Exception as e:
            logger.debug(f"Memory load from Firestore failed: {e}")
        mem = UserMemory(uid=uid)
        self._local[uid] = mem
        return mem

    async def save_memory(self, uid: str, memory: UserMemory) -> None:
        """Save memory to Firestore (best-effort, never raises)."""
        self._local[uid] = memory
        try:
            doc_ref = self._get_doc(uid)
            if doc_ref:
                data = memory.to_dict()
                await asyncio.to_thread(doc_ref.set, data, merge=True)
        except Exception as e:
            logger.debug(f"Memory save to Firestore failed: {e}")

    # ── Core operations ────────────────────────────────────────────────────────
    async def add_interaction(
        self,
        uid: str,
        role: str,
        content: str,
        tool_used: Optional[str] = None,
    ) -> None:
        """Append a conversation turn to episodic memory."""
        mem = await self.get_memory(uid)
        entry = {
            "role": role,
            "content": content[:500],
            "ts": datetime.now(timezone.utc).isoformat(),
        }
        if tool_used:
            entry["tool"] = tool_used
        mem.episodic.append(entry)
        # Trim to max
        if len(mem.episodic) > self.MAX_EPISODIC:
            mem.episodic = mem.episodic[-self.MAX_EPISODIC:]
        await self.save_memory(uid, mem)

    async def log_action(
        self,
        uid: str,
        tool: str,
        args_summary: str,
        success: bool = True,
    ) -> None:
        """Record a tool action in the action history."""
        mem = await self.get_memory(uid)
        mem.action_history.append({
            "tool": tool,
            "args": args_summary[:200],
            "success": success,
            "ts": datetime.now(timezone.utc).isoformat(),
        })
        if len(mem.action_history) > self.MAX_ACTIONS:
            mem.action_history = mem.action_history[-self.MAX_ACTIONS:]
        await self.save_memory(uid, mem)

    async def extract_entities(self, uid: str, text: str) -> dict:
        """Extract emails, names, dates from text and store in entity memory."""
        mem = await self.get_memory(uid)
        # Emails
        emails = re.findall(r"[\w.+-]+@[\w-]+\.\w+", text)
        # Capitalized proper names (2+ words, not at sentence start only)
        names = re.findall(r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b", text)
        # Dates: tomorrow, next week, YYYY-MM-DD, "August 20", etc.
        dates  = re.findall(
            r"\b(?:tomorrow|next\s+\w+|today|\d{4}-\d{2}-\d{2}|"
            r"(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|"
            r"Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)"
            r"\s+\d{1,2}(?:,\s*\d{4})?)\b",
            text, re.IGNORECASE,
        )
        if emails:
            mem.entities.setdefault("emails", [])
            for e in emails:
                if e not in mem.entities["emails"]:
                    mem.entities["emails"].append(e)
            mem.entities["emails"] = mem.entities["emails"][-20:]
        if names:
            mem.entities.setdefault("names", [])
            for n in names:
                if n not in mem.entities["names"]:
                    mem.entities["names"].append(n)
            mem.entities["names"] = mem.entities["names"][-30:]
        if dates:
            mem.entities["last_dates_mentioned"] = dates[-5:]
        await self.save_memory(uid, mem)
        return {"emails": emails, "names": names, "dates": dates}

    async def update_preference(self, uid: str, key: str, value) -> None:
        """Store a user preference (e.g., tone='casual')."""
        mem = await self.get_memory(uid)
        mem.preferences[key] = value
        await self.save_memory(uid, mem)

    async def get_context_summary(self, uid: str) -> str:
        """Return a compact memory summary for injection into the AI system prompt."""
        try:
            mem = await self.get_memory(uid)
        except Exception:
            return ""

        lines = []

        # Recent interactions
        recent = mem.episodic[-6:]
        if recent:
            lines.append("RECENT CONVERSATION:")
            for turn in recent:
                role_label = "User" if turn["role"] == "user" else "You"
                snippet = turn["content"][:120].replace("\n", " ")
                tool_note = f" [used: {turn['tool']}]" if turn.get("tool") else ""
                lines.append(f"  {role_label}: {snippet}{tool_note}")

        # Entities
        if mem.entities.get("names"):
            lines.append(f"PEOPLE MENTIONED: {', '.join(mem.entities['names'][-5:])}")
        if mem.entities.get("emails"):
            lines.append(f"EMAIL ADDRESSES: {', '.join(mem.entities['emails'][-3:])}")
        if mem.entities.get("last_dates_mentioned"):
            lines.append(f"DATES MENTIONED: {', '.join(mem.entities['last_dates_mentioned'])}")

        # Preferences
        if mem.preferences:
            prefs = ", ".join(f"{k}={v}" for k, v in list(mem.preferences.items())[:5])
            lines.append(f"USER PREFERENCES: {prefs}")

        # Recent tool actions
        recent_actions = [a for a in mem.action_history[-5:] if a.get("success")]
        if recent_actions:
            action_strs = [f"{a['tool']}({a.get('args','')[:40]})" for a in recent_actions]
            lines.append(f"RECENT ACTIONS: {', '.join(action_strs)}")

        return "\n".join(lines) if lines else ""
