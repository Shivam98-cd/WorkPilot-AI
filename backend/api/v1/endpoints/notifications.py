"""User notification API."""
from fastapi import APIRouter, Depends

from services.workspace_service import workspace_service
from middleware.auth import get_current_user


router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
async def list_notifications(current_user=Depends(get_current_user)):
    return {"success": True, "data": await workspace_service.list_notifications(current_user["uid"])}


@router.put("/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user=Depends(get_current_user)):
    notification = await workspace_service.get_record(workspace_service.NOTIFICATIONS, current_user["uid"], notification_id)
    saved = await workspace_service.save_record(
        workspace_service.NOTIFICATIONS, current_user["uid"], notification_id, {**notification, "read": True}
    )
    return {"success": True, "data": saved}
