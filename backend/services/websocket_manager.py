"""
WorkPilot AI - WebSocket Connection Manager
Provides real-time event broadcasting and targeted user notifications
(new emails, calendar alerts, deployment log streaming, team updates).
"""
import json
import logging
from typing import Dict, Set, Any
from fastapi import WebSocket

logger = logging.getLogger("websocket_manager")


class WebSocketConnectionManager:
    """Manages active WebSocket connections per authenticated user."""

    def __init__(self):
        # Maps user UID to a set of active WebSockets (supports multi-tab / multi-device)
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, uid: str, websocket: WebSocket):
        """Accept connection and register under user's connection set."""
        await websocket.accept()
        if uid not in self.active_connections:
            self.active_connections[uid] = set()
        self.active_connections[uid].add(websocket)
        logger.info(f"WebSocket client connected for user {uid} (total tabs: {len(self.active_connections[uid])})")

    def disconnect(self, uid: str, websocket: WebSocket):
        """Remove connection on socket close or network drop."""
        if uid in self.active_connections:
            self.active_connections[uid].discard(websocket)
            if not self.active_connections[uid]:
                del self.active_connections[uid]
        logger.info(f"WebSocket client disconnected for user {uid}")

    async def send_personal_message(self, uid: str, message: Dict[str, Any]):
        """Send a JSON event payload to all active sockets of a specific user."""
        if uid not in self.active_connections:
            return

        dead_sockets = set()
        payload = json.dumps(message)
        for ws in self.active_connections[uid]:
            try:
                await ws.send_text(payload)
            except Exception as e:
                logger.warning(f"Failed to send to WebSocket for {uid}: {e}")
                dead_sockets.add(ws)

        for dead in dead_sockets:
            self.disconnect(uid, dead)

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast a message to all connected users (system announcements, maintenance)."""
        payload = json.dumps(message)
        for uid, sockets in list(self.active_connections.items()):
            dead_sockets = set()
            for ws in sockets:
                try:
                    await ws.send_text(payload)
                except Exception:
                    dead_sockets.add(ws)
            for dead in dead_sockets:
                self.disconnect(uid, dead)


ws_manager = WebSocketConnectionManager()
manager = ws_manager

