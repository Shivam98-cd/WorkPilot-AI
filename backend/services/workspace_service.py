"""Business logic for dashboard-owned workspace data."""
from datetime import datetime, timezone
from typing import Any, Dict, List
from uuid import uuid4

from core.exceptions import NotFoundException, ValidationException
from repositories.workspace_repository import workspace_repository


class WorkspaceService:
    DOCUMENTS = "workspace_documents"
    TEAM = "workspace_team_members"
    CALENDAR = "workspace_calendar_events"
    DEPLOYMENTS = "workspace_deployments"
    NOTIFICATIONS = "workspace_notifications"
    AI_ACTIONS = "workspace_ai_actions"

    async def list_records(self, collection: str, uid: str) -> List[Dict[str, Any]]:
        return await workspace_repository.list(collection, uid)

    async def get_record(self, collection: str, uid: str, record_id: str) -> Dict[str, Any]:
        record = await workspace_repository.get(collection, uid, record_id)
        if not record:
            raise NotFoundException("Record not found")
        return record

    async def save_record(self, collection: str, uid: str, record_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return await workspace_repository.upsert(collection, uid, record_id, data)

    async def create_record(self, collection: str, uid: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return await self.save_record(collection, uid, str(uuid4()), data)

    async def delete_record(self, collection: str, uid: str, record_id: str) -> bool:
        if not await workspace_repository.delete(collection, uid, record_id):
            raise NotFoundException("Record not found")
        return True

    async def list_team_members(self, uid: str) -> List[Dict[str, Any]]:
        members = await self.list_records(self.TEAM, uid)
        return sorted(members, key=lambda member: (member.get("status") == "done", member.get("name", "").lower()))

    async def create_team_member(self, uid: str, data: Dict[str, Any]) -> Dict[str, Any]:
        if not data.get("name", "").strip():
            raise ValidationException("A team member name is required")
        return await self.create_record(self.TEAM, uid, {
            "name": data["name"].strip(), "role": data.get("role", "Member"),
            "task": data.get("task"), "progress": max(0, min(100, int(data.get("progress", 0)))),
            "status": data.get("status", "on-track"), "online": bool(data.get("online", False)),
        })

    async def update_team_member(self, uid: str, member_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        existing = await self.get_record(self.TEAM, uid, member_id)
        allowed = {"name", "role", "task", "progress", "status", "online"}
        update = {key: value for key, value in data.items() if key in allowed}
        if "progress" in update:
            update["progress"] = max(0, min(100, int(update["progress"])))
        return await self.save_record(self.TEAM, uid, member_id, {**existing, **update})

    async def create_calendar_event(self, uid: str, data: Dict[str, Any]) -> Dict[str, Any]:
        title = data.get("title", "").strip()
        start = data.get("start") or data.get("time")
        if not title or not start:
            raise ValidationException("Calendar events require title and start/time")
        return await self.create_record(self.CALENDAR, uid, {
            "title": title, "start": start, "end": data.get("end"), "time": data.get("time"),
            "duration": data.get("duration"), "description": data.get("description"),
            "attendees": data.get("attendees", []), "provider": "workpilot",
        })

    async def list_calendar_events(self, uid: str) -> List[Dict[str, Any]]:
        events = await self.list_records(self.CALENDAR, uid)
        return sorted(events, key=lambda event: event.get("start") or event.get("time") or "")

    async def create_notification(self, uid: str, title: str, body: str, kind: str = "info") -> Dict[str, Any]:
        return await self.create_record(self.NOTIFICATIONS, uid, {
            "title": title, "body": body, "kind": kind, "read": False,
            "createdAt": datetime.now(timezone.utc).isoformat(),
        })

    async def list_notifications(self, uid: str) -> List[Dict[str, Any]]:
        return sorted(await self.list_records(self.NOTIFICATIONS, uid), key=lambda item: item.get("createdAt", ""), reverse=True)

    async def create_ai_action(self, uid: str, action: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        return await self.create_record(self.AI_ACTIONS, uid, {
            "action": action, "metadata": metadata, "status": "completed", "reversible": False,
            "createdAt": datetime.now(timezone.utc).isoformat(),
        })

    async def analytics_summary(self, uid: str) -> Dict[str, Any]:
        actions = await self.list_records(self.AI_ACTIONS, uid)
        team = await self.list_records(self.TEAM, uid)
        return self.analytics_summary_from_data(team, actions)

    @staticmethod
    def analytics_summary_from_data(
        team: List[Dict[str, Any]],
        ai_actions: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Compute analytics from already-fetched data lists.
        Called by the dashboard endpoint to avoid re-querying Firestore for data
        that has already been retrieved in the same request.
        Output structure is identical to analytics_summary() so the frontend
        contract is unchanged.
        """
        return {
            "focus_hours": 0,
            "emails_handled": 0,
            "tasks_completed": sum(1 for m in team if m.get("status") == "done"),
            "ai_time_saved": round(len(ai_actions) * 0.1, 1),
            "weekly_data": [0, 0, 0, 0],
            "time_breakdown": {"Coding": 0, "Meetings": 0, "Review": 0, "Other": 0},
        }


workspace_service = WorkspaceService()
