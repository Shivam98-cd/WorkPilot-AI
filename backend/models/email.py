"""Email model for storing sent and received emails."""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class Email(BaseModel):
    """Email model representing a sent or received email."""
    
    id: str = Field(..., description="Unique email identifier (message_id from Gmail)")
    uid: str = Field(..., description="User ID who sent/received the email")
    
    # Email details
    recipient: str = Field(..., description="Recipient email address")
    subject: str = Field(..., description="Email subject")
    body: str = Field(..., description="Email body content")
    
    # Metadata
    sender: str = Field(..., description="Sender email address (from user's Gmail)")
    thread_id: Optional[str] = Field(None, description="Gmail thread ID")
    message_id: Optional[str] = Field(None, description="Gmail message ID")
    
    # Type and status
    email_type: str = Field(default="sent", description="Email type: sent, received, draft")
    status: str = Field(default="sent", description="Status: sent, failed, pending")
    
    # Timestamps
    sent_at: datetime = Field(default_factory=datetime.utcnow, description="When email was sent")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="When record was created")
    
    # Integration info
    platform: str = Field(default="gmail", description="Email platform: gmail, outlook")
    sent_via: str = Field(default="ai_chat", description="How it was sent: ai_chat, api, manual")
    
    # Optional fields
    cc: Optional[List[str]] = Field(default=None, description="CC recipients")
    bcc: Optional[List[str]] = Field(default=None, description="BCC recipients")
    attachments: Optional[List[str]] = Field(default=None, description="Attachment URLs/paths")
    labels: Optional[List[str]] = Field(default=None, description="Email labels/tags")
    
    # AI metadata
    ai_generated: bool = Field(default=False, description="Whether AI generated the content")
    tone: Optional[str] = Field(None, description="Tone used: professional, casual, urgent")
    prompt: Optional[str] = Field(None, description="User's original prompt to AI")
    
    class Config:
        """Pydantic config"""
        json_schema_extra = {
            "example": {
                "id": "19ffbb2df6125048",
                "uid": "user123",
                "recipient": "john@example.com",
                "subject": "Meeting Follow-up",
                "body": "Thank you for the meeting...",
                "sender": "user@gmail.com",
                "thread_id": "19ffbb2df6125048",
                "message_id": "19ffbb2df6125048",
                "email_type": "sent",
                "status": "sent",
                "platform": "gmail",
                "sent_via": "ai_chat",
                "ai_generated": True,
                "tone": "professional",
                "prompt": "Send email to john about meeting"
            }
        }


class EmailDraft(BaseModel):
    """Email draft model for storing drafts before sending."""
    
    id: str = Field(..., description="Unique draft identifier")
    uid: str = Field(..., description="User ID")
    
    # Draft details
    recipient: Optional[str] = Field(None, description="Recipient email address")
    subject: Optional[str] = Field(None, description="Email subject")
    body: Optional[str] = Field(None, description="Email body content")
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # AI context
    ai_generated: bool = Field(default=False)
    tone: Optional[str] = Field(None)
    prompt: Optional[str] = Field(None)
    
    # Status
    status: str = Field(default="draft", description="Status: draft, sent, abandoned")


class EmailThread(BaseModel):
    """Email thread model for grouping related emails."""
    
    thread_id: str = Field(..., description="Thread identifier")
    uid: str = Field(..., description="User ID")
    
    # Thread details
    subject: str = Field(..., description="Thread subject")
    participants: List[str] = Field(default_factory=list, description="All participants")
    message_count: int = Field(default=1, description="Number of messages in thread")
    
    # Timestamps
    started_at: datetime = Field(default_factory=datetime.utcnow)
    last_message_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Status
    status: str = Field(default="active", description="Status: active, archived, deleted")


class EmailStatistics(BaseModel):
    """Email statistics for a user."""
    
    uid: str = Field(..., description="User ID")
    
    # Counts
    total_sent: int = Field(default=0, description="Total emails sent")
    total_received: int = Field(default=0, description="Total emails received")
    total_ai_generated: int = Field(default=0, description="Total AI-generated emails")
    
    # Success rates
    sent_success_rate: float = Field(default=100.0, description="Success rate percentage")
    
    # Timestamps
    first_email_at: Optional[datetime] = Field(None, description="First email timestamp")
    last_email_at: Optional[datetime] = Field(None, description="Last email timestamp")
    
    # Updated
    updated_at: datetime = Field(default_factory=datetime.utcnow)
