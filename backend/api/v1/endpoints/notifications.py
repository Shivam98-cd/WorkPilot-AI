"""User notification API."""
from fastapi import APIRouter, Depends
from typing import Optional

from services.workspace_service import workspace_service
from middleware.auth import get_current_user
from services.websocket_manager import manager as ws_manager


router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
async def list_notifications(current_user=Depends(get_current_user)):
    uid = current_user["uid"]
    notifications = await workspace_service.list_notifications(uid)
    unread_count = sum(1 for n in notifications if not n.get("read", False))
    return {
        "success": True,
        "data": notifications,
        "unread_count": unread_count,
        "count": len(notifications),
    }


@router.put("/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user=Depends(get_current_user)):
    uid = current_user["uid"]
    notification = await workspace_service.get_record(workspace_service.NOTIFICATIONS, uid, notification_id)
    saved = await workspace_service.save_record(
        workspace_service.NOTIFICATIONS, uid, notification_id, {**notification, "read": True}
    )
    return {"success": True, "data": saved}


@router.put("/read-all")
async def mark_all_notifications_read(current_user=Depends(get_current_user)):
    """Mark all notifications as read for current user."""
    uid = current_user["uid"]
    notifications = await workspace_service.list_notifications(uid)
    updated_count = 0
    for n in notifications:
        if not n.get("read", False):
            n_id = n.get("id") or n.get("_id")
            if n_id:
                await workspace_service.save_record(
                    workspace_service.NOTIFICATIONS, uid, n_id, {**n, "read": True}
                )
                updated_count += 1

    return {"success": True, "message": f"Marked {updated_count} notifications as read", "updated_count": updated_count}


@router.delete("/clear")
async def clear_notifications(current_user=Depends(get_current_user)):
    """Clear all notifications for current user."""
    uid = current_user["uid"]
    notifications = await workspace_service.list_notifications(uid)
    deleted_count = 0
    for n in notifications:
        n_id = n.get("id") or n.get("_id")
        if n_id:
            try:
                await workspace_service.delete_record(workspace_service.NOTIFICATIONS, uid, n_id)
                deleted_count += 1
            except Exception:
                pass

    return {"success": True, "message": f"Cleared {deleted_count} notifications", "deleted_count": deleted_count}


@router.post("")
async def create_notification(body: dict, current_user=Depends(get_current_user)):
    """Create a notification and optionally push via WebSocket."""
    uid = current_user["uid"]
    title = body.get("title", "New Notification").strip()
    message = body.get("body") or body.get("message") or ""
    kind = body.get("kind", "info")

    notif = await workspace_service.create_notification(uid, title, message, kind)

    # Push to live WebSockets
    await ws_manager.send_personal_message(uid, {
        "type": "notification",
        "data": notif,
    })

    return {"success": True, "data": notif}

