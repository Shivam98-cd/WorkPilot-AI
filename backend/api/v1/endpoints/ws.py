"""
WorkPilot AI - WebSocket Route Handler
Provides real-time duplex communication channel for workspace updates.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from datetime import datetime, timezone
import json
import logging

from services.websocket_manager import ws_manager

logger = logging.getLogger("ws_endpoint")
router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/{uid}")
async def websocket_endpoint(websocket: WebSocket, uid: str):
    """
    WebSocket endpoint for user workspace push updates.
    Sends greeting, receives client heartbeats, and pushes real-time events.
    """
    if not uid:
        await websocket.close(code=4003)
        return

    await ws_manager.connect(uid, websocket)

    # Send initial connection acknowledgment
    try:
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "uid": uid,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "connected",
        }))
    except Exception:
        ws_manager.disconnect(uid, websocket)
        return

    try:
        while True:
            # Listen for client messages (heartbeat pings, local status changes)
            data = await websocket.receive_text()
            try:
                parsed = json.loads(data)
                msg_type = parsed.get("type", "ping")

                if msg_type == "ping":
                    await websocket.send_text(json.dumps({
                        "type": "pong",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }))
                elif msg_type == "subscribe":
                    channel = parsed.get("channel", "general")
                    await websocket.send_text(json.dumps({
                        "type": "subscribed",
                        "channel": channel,
                    }))
            except json.JSONDecodeError:
                # Raw text ping
                if data.strip() == "ping":
                    await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(uid, websocket)
    except Exception as e:
        logger.warning(f"WebSocket error for user {uid}: {e}")
        ws_manager.disconnect(uid, websocket)
