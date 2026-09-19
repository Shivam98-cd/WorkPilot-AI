"""
WorkPilot AI - Email Reminder & Notification Delivery Service
Generates styled, high-impact HTML emails for meeting reminders, task deadlines,
and alerts, dispatching via connected Gmail, Outlook, or SMTP with fallback logging.
"""
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger("email_reminder_service")


def render_meeting_reminder_html(
    title: str,
    start_time_str: str,
    lead_time_min: int,
    meeting_link: Optional[str] = None,
    attendees: Optional[list] = None,
    description: Optional[str] = None,
) -> str:
    """Render a clean, modern HTML email for upcoming meeting reminders."""
    attendees_html = ""
    if attendees:
        attendee_pills = "".join(
            f'<span style="display:inline-block;padding:4px 10px;margin:2px 4px 2px 0;background:#1e1e24;color:#a1a1aa;border-radius:12px;font-size:12px;">{att}</span>'
            for att in attendees[:6]
        )
        attendees_html = f"""
        <div style="margin-top:16px;">
            <p style="margin:0 0 6px 0;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">Attendees</p>
            <div>{attendee_pills}</div>
        </div>
        """

    join_button_html = ""
    if meeting_link:
        join_button_html = f"""
        <div style="margin-top:24px;text-align:center;">
            <a href="{meeting_link}" target="_blank" style="display:inline-block;padding:12px 28px;background:#3b82f6;color:#ffffff;text-decoration:none;font-weight:600;border-radius:8px;font-size:14px;box-shadow:0 4px 12px rgba(59,130,246,0.3);">
                Join Meeting Now &rarr;
            </a>
            <p style="margin:8px 0 0 0;font-size:11px;color:#71717a;word-break:break-all;">{meeting_link}</p>
        </div>
        """

    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f4f4f5;">
        <div style="max-width:560px;margin:30px auto;background:#121217;border:1px solid #27272a;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.5);">
            <!-- Header -->
            <div style="padding:24px 30px;background:linear-gradient(90deg, rgba(59,130,246,0.15), transparent);border-bottom:1px solid #27272a;display:flex;align-items:center;">
                <div style="display:inline-block;padding:6px 12px;background:#3b82f6;color:#fff;font-size:11px;font-weight:700;border-radius:6px;letter-spacing:0.05em;text-transform:uppercase;">
                    WorkPilot AI Reminder
                </div>
                <span style="margin-left:auto;font-size:12px;color:#a1a1aa;">Starting in {lead_time_min} mins</span>
            </div>

            <!-- Body -->
            <div style="padding:30px;">
                <h1 style="margin:0 0 10px 0;font-size:22px;font-weight:700;color:#ffffff;">{title}</h1>
                <div style="display:inline-flex;align-items:center;padding:6px 12px;background:#18181b;border:1px solid #27272a;border-radius:8px;font-size:14px;color:#60a5fa;margin-bottom:16px;">
                    📅 <strong>{start_time_str}</strong>
                </div>

                {f'<p style="margin:0 0 16px 0;font-size:14px;color:#a1a1aa;line-height:1.5;">{description}</p>' if description else ''}
                {attendees_html}
                {join_button_html}
            </div>

            <!-- Footer -->
            <div style="padding:16px 30px;background:#09090b;border-top:1px solid #27272a;text-align:center;font-size:12px;color:#71717a;">
                Dispatched automatically by WorkPilot AI Autonomous Workspace &bull; <a href="http://localhost:5173" style="color:#3b82f6;text-decoration:none;">Open Dashboard</a>
            </div>
        </div>
    </body>
    </html>
    """


def render_task_reminder_html(title: str, due_str: str, priority: str, note: Optional[str] = None) -> str:
    """Render a clean HTML email for task deadlines and custom reminders."""
    priority_colors = {
        "urgent": "#ef4444",
        "high": "#f59e0b",
        "normal": "#3b82f6",
        "low": "#10b981",
    }
    badge_color = priority_colors.get(priority.lower(), "#3b82f6")

    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#f4f4f5;">
        <div style="max-width:560px;margin:30px auto;background:#121217;border:1px solid #27272a;border-radius:12px;overflow:hidden;">
            <div style="padding:20px 28px;border-bottom:1px solid #27272a;background:rgba(255,255,255,0.02);">
                <span style="padding:4px 10px;background:{badge_color}25;color:{badge_color};border:1px solid {badge_color}40;border-radius:6px;font-size:11px;font-weight:700;text-transform:uppercase;">
                    {priority} Reminder
                </span>
                <span style="float:right;font-size:12px;color:#71717a;">Due: {due_str}</span>
            </div>
            <div style="padding:28px;">
                <h2 style="margin:0 0 12px 0;font-size:20px;color:#fff;">{title}</h2>
                {f'<p style="margin:0 0 20px 0;color:#a1a1aa;font-size:14px;line-height:1.6;">{note}</p>' if note else ''}
                <div style="margin-top:20px;">
                    <a href="http://localhost:5173" target="_blank" style="display:inline-block;padding:10px 22px;background:#3b82f6;color:#fff;text-decoration:none;font-weight:600;border-radius:6px;font-size:13px;">
                        Open in WorkPilot &rarr;
                    </a>
                </div>
            </div>
            <div style="padding:14px 28px;background:#09090b;border-top:1px solid #27272a;font-size:11px;color:#71717a;text-align:center;">
                WorkPilot AI &bull; Smart Task & Schedule Reminders
            </div>
        </div>
    </body>
    </html>
    """


class EmailReminderService:
    """Dispatches formatted reminder emails via Gmail, Outlook, or SMTP."""

    async def send_reminder_email(
        self,
        uid: str,
        recipient_email: str,
        subject: str,
        html_content: str,
        plain_text: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Deliver a reminder email. Attempts:
        1. Connected Gmail via Google Workspace integration.
        2. Connected Outlook via Microsoft Graph integration.
        3. System SMTP configured in core/config.py.
        4. Fallback: Stores to Sent Email DB with status 'queued/saved'.
        """
        if not recipient_email:
            logger.warning(f"No recipient email specified for reminder to uid={uid}")
            return {"success": False, "method": "none", "error": "No recipient email"}

        from core.config import settings

        # 1. Try Gmail integration if connected
        try:
            from services.integration_service import integration_service
            from repositories.integration_repository import integration_repository
            gmail_record = await integration_repository.get(uid, "gmail")
            if gmail_record and gmail_record.status == "connected":
                result = await integration_service.send_gmail_message(
                    uid, recipient_email, subject, plain_text or html_content
                )
                logger.info(f"Sent reminder email to {recipient_email} via Gmail API")
                await self._log_sent_email(uid, recipient_email, subject, plain_text or html_content, "gmail")
                return {"success": True, "method": "gmail", "message_id": result.get("id")}
        except Exception as e:
            logger.warning(f"Gmail reminder dispatch failed: {e}")

        # 2. Try Outlook integration if connected
        try:
            from agents.microsoft_agent import MicrosoftAgent
            from repositories.integration_repository import integration_repository
            outlook_record = await integration_repository.get(uid, "outlook")
            if outlook_record and outlook_record.status == "connected":
                ms_agent = MicrosoftAgent()
                msg_id = await ms_agent.send_email(uid, recipient_email, subject, plain_text or html_content)
                logger.info(f"Sent reminder email to {recipient_email} via Outlook Graph API")
                await self._log_sent_email(uid, recipient_email, subject, plain_text or html_content, "outlook")
                return {"success": True, "method": "outlook", "message_id": msg_id}
        except Exception as e:
            logger.warning(f"Outlook reminder dispatch failed: {e}")

        # 3. Try System SMTP if configured
        if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = settings.EMAIL_FROM or settings.SMTP_USER
                msg["To"] = recipient_email

                if plain_text:
                    msg.attach(MIMEText(plain_text, "plain"))
                msg.attach(MIMEText(html_content, "html"))

                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                    server.starttls()
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.sendmail(settings.EMAIL_FROM or settings.SMTP_USER, recipient_email, msg.as_string())

                logger.info(f"Sent reminder email to {recipient_email} via SMTP ({settings.SMTP_HOST})")
                await self._log_sent_email(uid, recipient_email, subject, plain_text or html_content, "smtp")
                return {"success": True, "method": "smtp"}
            except Exception as e:
                logger.warning(f"SMTP reminder dispatch failed: {e}")

        # 4. Fallback: Log to Email database and AI Actions for local development visibility
        logger.info(f"[SIMULATED EMAIL] Reminder queued for {recipient_email}: {subject}")
        await self._log_sent_email(uid, recipient_email, subject, plain_text or html_content, "simulated_workspace")
        return {
            "success": True,
            "method": "workspace_queue",
            "note": "Email logged & saved to Workspace Sent History (Configure Gmail/Outlook or SMTP for live delivery)",
        }

    async def _log_sent_email(self, uid: str, recipient: str, subject: str, body: str, platform: str):
        """Record dispatched reminder email into EmailRepository and Workspace AI actions."""
        try:
            import uuid
            from models.email import Email
            from repositories.email_repository import email_repository
            from services.workspace_service import workspace_service

            email_id = str(uuid.uuid4())
            email_model = Email(
                id=email_id,
                uid=uid,
                recipient=recipient,
                subject=subject,
                body=body,
                sent_at=datetime.utcnow(),
                status="sent",
                platform=platform,
                message_id=f"remind_{email_id[:8]}",
                ai_generated=True,
            )
            await email_repository.create(email_model)
            await workspace_service.create_ai_action(
                uid, "reminder_email_sent",
                {"recipient": recipient, "subject": subject, "platform": platform}
            )
        except Exception as e:
            logger.warning(f"Failed to record reminder email in repository: {e}")


email_reminder_service = EmailReminderService()
