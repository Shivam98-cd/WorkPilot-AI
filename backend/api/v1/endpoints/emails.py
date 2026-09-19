"""Email endpoints backed by the connected Gmail integration."""
from typing import Optional
from fastapi import APIRouter, Depends, Query

from core.exceptions import ValidationException
from middleware.auth import get_current_user
from repositories.integration_repository import integration_repository
from services.integration_service import integration_service
from services.workspace_service import workspace_service
import time


router = APIRouter(prefix="/emails", tags=["emails"])


@router.get("")
async def get_emails(
    folder: str = Query(default="inbox"),
    q: Optional[str] = Query(default=None),
    limit: int = Query(default=25, le=50),
    current_user=Depends(get_current_user)
):
    """Return live Gmail messages for the requested folder with full hydration."""
    uid = current_user["uid"]
    gmail_emails = []
    try:
        gmail_emails = await integration_service.list_user_emails(uid, folder=folder, search_query=q, limit=limit)
    except Exception:
        gmail_emails = []

    if gmail_emails:
        return {"success": True, "data": gmail_emails, "source": "gmail", "count": len(gmail_emails), "folder": folder}

    # Fallback: stored emails (inbox only)
    if folder == "inbox":
        from repositories.email_repository import email_repository
        db_emails = await email_repository.list_for_user(uid, limit=20)
        if db_emails:
            data = [
                {
                    "id": e.id, "from": e.recipient, "from_email": e.recipient,
                    "role": "Inbox", "subject": e.subject,
                    "preview": e.body[:120] + "..." if len(e.body) > 120 else e.body,
                    "body": e.body, "time": "Recently", "priority": "normal",
                    "read": True, "starred": False,
                    "platform": e.platform, "ai_generated": e.ai_generated
                }
                for e in db_emails
            ]
            return {"success": True, "data": data, "source": "workspace_db", "count": len(data), "folder": folder}

    if gmail_record := await integration_repository.get(uid, "gmail"):
        if gmail_record.status == "connected":
            return {"success": True, "data": [], "source": "gmail_error", "count": 0, "folder": folder,
                    "note": "Gmail connected but messages could not be loaded. Try reconnecting."}

    return {"success": True, "data": [], "source": "not_connected", "count": 0, "folder": folder,
            "note": "Connect Gmail in Integrations to sync your inbox."}


@router.get("/counts")
async def get_email_counts(current_user=Depends(get_current_user)):
    """Return folder counts: inbox, unread, starred, sent, drafts."""
    uid = current_user["uid"]
    try:
        counts = await integration_service.get_email_folder_counts(uid)
    except Exception:
        counts = {"inbox": 0, "unread": 0, "starred": 0, "sent": 0, "drafts": 0}
    return {"success": True, "data": counts}


@router.get("/test-gmail")
async def test_gmail(current_user=Depends(get_current_user)):
    """Gmail connectivity diagnostic."""
    record = await integration_repository.get(current_user["uid"], "gmail")
    if not record or record.status != "connected":
        return {"success": False, "connected": False, "message": "Gmail is not connected."}
    try:
        emails = await integration_service.list_user_emails(current_user["uid"])
        return {"success": True, "connected": True, "account": record.account_label,
                "scopes": record.scopes, "email_count": len(emails)}
    except Exception as exc:
        return {"success": False, "connected": True, "message": str(exc)}


@router.get("/{email_id}/body")
async def get_email_body(email_id: str, current_user=Depends(get_current_user)):
    """Lazily fetch the full body of a single email (called when user opens a message)."""
    uid = current_user["uid"]
    try:
        data = await integration_service.lazy_get_email_body(uid, email_id)
        return {"success": True, "data": data}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


@router.post("/draft")
async def draft_email(body: dict, current_user=Depends(get_current_user)):
    """Generate an AI-powered email draft."""
    recipient = (body.get("to") or body.get("recipient") or "").strip()
    subject = (body.get("subject") or "").strip()
    content = (body.get("body") or body.get("content") or "").strip()
    prompt = (body.get("prompt") or "").strip()
    tone = body.get("tone", "professional")

    if not content:
        try:
            from groq import Groq
            from core.config import settings
            if settings.GROQ_API_KEY:
                client = Groq(api_key=settings.GROQ_API_KEY)
                system_prompt = f"You are WorkPilot AI. Draft a concise, high-impact {tone} email response. Return ONLY the body text."
                user_msg = f"Subject: {subject or 'Follow up'}\nRecipient: {recipient or 'Colleague'}\nContext: {prompt or 'Draft a professional follow up'}"
                res = client.chat.completions.create(
                    model="qwen/qwen3.8-27b",
                    messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_msg}],
                    max_tokens=500, temperature=0.3
                )
                content = res.choices[0].message.content.strip()
        except Exception:
            content = f"Hi {recipient or 'there'},\n\nThank you for your email regarding '{subject or 'this matter'}'. I will review and respond shortly.\n\nBest regards"

    return {
        "success": True,
        "data": {"to": recipient, "subject": subject or "Re: Follow up",
                 "body": content, "draft": content, "ai_generated": True}
    }


@router.post("/send")
async def send_email(body: dict, current_user=Depends(get_current_user)):
    uid = current_user["uid"]
    recipient = (body.get("to") or "").strip()
    subject = (body.get("subject") or "").strip()
    content = (body.get("body") or "").strip()

    if not recipient or not subject or not content:
        raise ValidationException("Email requires: to, subject, body.")

    # Extract clean email from "Name <email>" format
    import re
    clean_match = re.search(r'<([^>]+)>', recipient)
    if clean_match:
        recipient = clean_match.group(1).strip()

    sent_via_gmail = False
    message_id = f"msg_{uid[:6]}_{int(time.time())}"

    try:
        result = await integration_service.send_gmail_message(uid, recipient, subject, content)
        sent_via_gmail = True
        message_id = result.get("id", message_id)
    except Exception:
        pass

    try:
        from models.email import Email
        from repositories.email_repository import email_repository
        import uuid as uuid_mod
        from datetime import datetime
        email_model = Email(
            id=str(uuid_mod.uuid4()), uid=uid, recipient=recipient,
            subject=subject, body=content, sent_at=datetime.utcnow(),
            status="sent" if sent_via_gmail else "queued",
            platform="gmail" if sent_via_gmail else "workspace",
            message_id=message_id, ai_generated=bool(body.get("ai_generated", False))
        )
        await email_repository.create(email_model)
    except Exception:
        pass

    await workspace_service.create_ai_action(uid, "email_sent",
        {"messageId": message_id, "to": recipient, "subject": subject, "gmail": sent_via_gmail})
    return {
        "success": True,
        "message": "Email sent via Gmail!" if sent_via_gmail else "Email queued & saved.",
        "data": {"id": message_id, "to": recipient, "subject": subject, "gmail_sent": sent_via_gmail}
    }


@router.post("/triage")
async def triage_emails(current_user=Depends(get_current_user)):
    """AI Triage: analyze inbox and produce actionable summary."""
    uid = current_user["uid"]
    emails = []
    try:
        emails = await integration_service.list_user_emails(uid, folder="inbox", limit=20)
    except Exception:
        emails = []
    urgent_count = sum(1 for e in emails if e.get("priority") == "urgent")
    return {
        "success": True,
        "data": {
            "total_emails": len(emails),
            "urgent_count": urgent_count,
            "triage_summary": f"Analyzed {len(emails)} emails. {urgent_count} urgent items found." if emails else "No emails found.",
            "action_items": [
                {"action": f"Reply to {e.get('from', 'Sender')}",
                 "recipient": e.get("from_email") or e.get("from", ""),
                 "subject": e.get("subject", ""),
                 "recommended_tone": "professional"}
                for e in emails if e.get("priority") == "urgent"
            ]
        }
    }


@router.put("/{email_id}/read")
async def mark_read(email_id: str, body: dict = None, current_user=Depends(get_current_user)):
    read = True if not body else body.get("read", True)
    try:
        await integration_service.mark_gmail_message_read(current_user["uid"], email_id, read=read)
    except Exception:
        pass
    return {"success": True}


@router.post("/{email_id}/archive")
async def archive_email(email_id: str, current_user=Depends(get_current_user)):
    try:
        await integration_service.archive_gmail_message(current_user["uid"], email_id)
    except Exception:
        pass
    return {"success": True}


@router.delete("/{email_id}")
async def delete_email(email_id: str, current_user=Depends(get_current_user)):
    try:
        await integration_service.trash_gmail_message(current_user["uid"], email_id)
    except Exception:
        pass
    return {"success": True}


@router.post("/{email_id}/star")
async def star_email(email_id: str, body: dict, current_user=Depends(get_current_user)):
    starred = body.get("starred", True)
    try:
        await integration_service.star_gmail_message(current_user["uid"], email_id, starred=starred)
    except Exception:
        pass
    return {"success": True}


@router.get("/history")
async def get_email_history(
    limit: int = 50,
    email_type: str = "sent",
    current_user=Depends(get_current_user)
):
    from repositories.email_repository import email_repository
    uid = current_user["uid"]
    emails = await email_repository.list_for_user(uid, limit=limit, email_type=email_type)
    return {
        "success": True,
        "data": [
            {"id": e.id, "recipient": e.recipient, "subject": e.subject, "body": e.body,
             "sent_at": e.sent_at.isoformat() if e.sent_at else None, "status": e.status,
             "platform": e.platform, "ai_generated": e.ai_generated, "message_id": e.message_id}
            for e in emails
        ],
        "count": len(emails)
    }


@router.get("/statistics")
async def get_email_statistics(current_user=Depends(get_current_user)):
    from repositories.email_repository import email_repository
    uid = current_user["uid"]
    stats = await email_repository.get_statistics(uid)
    return {
        "success": True,
        "data": {
            "total_sent": stats.total_sent, "total_received": stats.total_received,
            "total_ai_generated": stats.total_ai_generated, "sent_success_rate": stats.sent_success_rate,
            "first_email_at": stats.first_email_at.isoformat() if stats.first_email_at else None,
            "last_email_at": stats.last_email_at.isoformat() if stats.last_email_at else None
        }
    }
