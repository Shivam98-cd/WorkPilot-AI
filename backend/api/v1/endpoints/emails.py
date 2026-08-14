"""Email endpoints backed by the connected Gmail integration."""
from fastapi import APIRouter, Depends

from core.exceptions import ValidationException
from middleware.auth import get_current_user
from services.integration_service import integration_service
from services.workspace_service import workspace_service


router = APIRouter(prefix="/emails", tags=["emails"])


@router.get("")
async def get_emails(current_user=Depends(get_current_user)):
    """Return live Gmail messages; an unconnected inbox is simply empty."""
    data = await integration_service.list_user_emails(current_user["uid"])
    return {"success": True, "data": data, "source": "gmail"}


@router.get("/test-gmail")
async def test_gmail(current_user=Depends(get_current_user)):
    """Expose a safe Gmail connectivity diagnostic for the current user."""
    from repositories.integration_repository import integration_repository

    record = await integration_repository.get(current_user["uid"], "gmail")
    if not record or record.status != "connected":
        return {"success": False, "connected": False, "message": "Gmail is not connected."}
    try:
        emails = await integration_service.list_user_emails(current_user["uid"])
        return {
            "success": True, "connected": True, "account": record.account_label,
            "scopes": record.scopes, "email_count": len(emails),
        }
    except Exception as exc:
        return {"success": False, "connected": True, "message": str(exc)}


@router.post("/draft")
async def draft_email(body: dict, current_user=Depends(get_current_user)):
    """Validate a client-composed draft without pretending to generate content."""
    recipient = (body.get("to") or "").strip()
    subject = (body.get("subject") or "").strip()
    content = (body.get("body") or "").strip()
    if not recipient or not subject or not content:
        raise ValidationException("Drafts require to, subject, and body")
    return {"success": True, "data": {"to": recipient, "subject": subject, "body": content}}


@router.post("/send")
async def send_email(body: dict, current_user=Depends(get_current_user)):
    uid = current_user["uid"]
    result = await integration_service.send_gmail_message(
        uid, (body.get("to") or "").strip(), (body.get("subject") or "").strip(),
        (body.get("body") or "").strip(),
    )
    await workspace_service.create_ai_action(uid, "email_sent", {"messageId": result.get("id"), "to": body.get("to")})
    return {"success": True, "data": {"id": result.get("id"), "threadId": result.get("threadId")}}


@router.put("/{email_id}/read")
async def mark_read(email_id: str, current_user=Depends(get_current_user)):
    if not await integration_service.mark_gmail_message_read(current_user["uid"], email_id):
        raise ValidationException("Gmail is not connected")
    return {"success": True}


@router.get("/history")
async def get_email_history(
    limit: int = 50,
    email_type: str = "sent",
    current_user=Depends(get_current_user)
):
    """Get user's email history from database"""
    from repositories.email_repository import email_repository
    
    uid = current_user["uid"]
    emails = await email_repository.list_for_user(uid, limit=limit, email_type=email_type)
    
    return {
        "success": True,
        "data": [
            {
                "id": e.id,
                "recipient": e.recipient,
                "subject": e.subject,
                "body": e.body,
                "sent_at": e.sent_at.isoformat() if e.sent_at else None,
                "status": e.status,
                "platform": e.platform,
                "ai_generated": e.ai_generated,
                "message_id": e.message_id
            }
            for e in emails
        ],
        "count": len(emails)
    }


@router.get("/statistics")
async def get_email_statistics(current_user=Depends(get_current_user)):
    """Get user's email statistics"""
    from repositories.email_repository import email_repository
    
    uid = current_user["uid"]
    stats = await email_repository.get_statistics(uid)
    
    return {
        "success": True,
        "data": {
            "total_sent": stats.total_sent,
            "total_received": stats.total_received,
            "total_ai_generated": stats.total_ai_generated,
            "sent_success_rate": stats.sent_success_rate,
            "first_email_at": stats.first_email_at.isoformat() if stats.first_email_at else None,
            "last_email_at": stats.last_email_at.isoformat() if stats.last_email_at else None
        }
    }

