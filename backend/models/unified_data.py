"""
Unified Data Models

Platform-agnostic data models for aggregating data from multiple integrations.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional


@dataclass
class Attachment:
    """File attachment"""
    id: str
    filename: str
    size_bytes: int
    mime_type: str
    url: Optional[str] = None


@dataclass
class UnifiedMessage:
    """
    Unified email/message format across platforms.
    
    Supports: Gmail, Outlook, Slack
    """
    id: str
    platform: str  # 'gmail', 'outlook', 'slack'
    sender: str
    sender_email: Optional[str]
    subject: str
    body: str
    body_preview: str
    timestamp: datetime
    priority: str  # 'urgent', 'high', 'normal', 'low'
    thread_id: Optional[str]
    attachments: List[Attachment] = field(default_factory=list)
    labels: List[str] = field(default_factory=list)
    is_read: bool = False
    is_starred: bool = False
    folder: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "id": self.id,
            "platform": self.platform,
            "sender": self.sender,
            "senderEmail": self.sender_email,
            "subject": self.subject,
            "body": self.body,
            "bodyPreview": self.body_preview,
            "timestamp": self.timestamp.isoformat(),
            "priority": self.priority,
            "threadId": self.thread_id,
            "attachments": [
                {
                    "id": a.id,
                    "filename": a.filename,
                    "sizeBytes": a.size_bytes,
                    "mimeType": a.mime_type,
                    "url": a.url,
                }
                for a in self.attachments
            ],
            "labels": self.labels,
            "isRead": self.is_read,
            "isStarred": self.is_starred,
            "folder": self.folder,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "UnifiedMessage":
        """Create from dictionary"""
        attachments = [
            Attachment(
                id=a["id"],
                filename=a["filename"],
                size_bytes=a["sizeBytes"],
                mime_type=a["mimeType"],
                url=a.get("url"),
            )
            for a in data.get("attachments", [])
        ]
        
        timestamp = data.get("timestamp")
        if isinstance(timestamp, str):
            timestamp = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        
        return cls(
            id=data["id"],
            platform=data["platform"],
            sender=data["sender"],
            sender_email=data.get("senderEmail"),
            subject=data["subject"],
            body=data["body"],
            body_preview=data["bodyPreview"],
            timestamp=timestamp,
            priority=data.get("priority", "normal"),
            thread_id=data.get("threadId"),
            attachments=attachments,
            labels=data.get("labels", []),
            is_read=data.get("isRead", False),
            is_starred=data.get("isStarred", False),
            folder=data.get("folder"),
        )


@dataclass
class UnifiedEvent:
    """
    Unified calendar event format across platforms.
    
    Supports: Google Calendar, Outlook, Zoom
    """
    id: str
    platform: str  # 'google_calendar', 'outlook', 'zoom'
    title: str
    description: Optional[str]
    start: datetime
    end: datetime
    timezone: str
    attendees: List[str] = field(default_factory=list)
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    status: str = "confirmed"  # 'confirmed', 'tentative', 'cancelled'
    is_all_day: bool = False
    recurrence: Optional[str] = None
    reminder_minutes: Optional[int] = None
    organizer: Optional[str] = None
    color: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "id": self.id,
            "platform": self.platform,
            "title": self.title,
            "description": self.description,
            "start": self.start.isoformat(),
            "end": self.end.isoformat(),
            "timezone": self.timezone,
            "attendees": self.attendees,
            "location": self.location,
            "meetingLink": self.meeting_link,
            "status": self.status,
            "isAllDay": self.is_all_day,
            "recurrence": self.recurrence,
            "reminderMinutes": self.reminder_minutes,
            "organizer": self.organizer,
            "color": self.color,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "UnifiedEvent":
        """Create from dictionary"""
        start = data["start"]
        if isinstance(start, str):
            start = datetime.fromisoformat(start.replace("Z", "+00:00"))
        
        end = data["end"]
        if isinstance(end, str):
            end = datetime.fromisoformat(end.replace("Z", "+00:00"))
        
        return cls(
            id=data["id"],
            platform=data["platform"],
            title=data["title"],
            description=data.get("description"),
            start=start,
            end=end,
            timezone=data.get("timezone", "UTC"),
            attendees=data.get("attendees", []),
            location=data.get("location"),
            meeting_link=data.get("meetingLink"),
            status=data.get("status", "confirmed"),
            is_all_day=data.get("isAllDay", False),
            recurrence=data.get("recurrence"),
            reminder_minutes=data.get("reminderMinutes"),
            organizer=data.get("organizer"),
            color=data.get("color"),
        )


@dataclass
class UnifiedTask:
    """
    Unified task/issue format across platforms.
    
    Supports: Jira, GitHub, Notion, Trello
    """
    id: str
    platform: str  # 'jira', 'github', 'notion', 'trello'
    title: str
    description: Optional[str]
    status: str  # 'open', 'in_progress', 'done', 'closed'
    assignee: Optional[str] = None
    due_date: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    labels: List[str] = field(default_factory=list)
    priority: Optional[str] = None
    project: Optional[str] = None
    url: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "id": self.id,
            "platform": self.platform,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "assignee": self.assignee,
            "dueDate": self.due_date.isoformat() if self.due_date else None,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
            "labels": self.labels,
            "priority": self.priority,
            "project": self.project,
            "url": self.url,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "UnifiedTask":
        """Create from dictionary"""
        def parse_dt(val):
            if not val:
                return None
            if isinstance(val, str):
                return datetime.fromisoformat(val.replace("Z", "+00:00"))
            return val
        
        return cls(
            id=data["id"],
            platform=data["platform"],
            title=data["title"],
            description=data.get("description"),
            status=data["status"],
            assignee=data.get("assignee"),
            due_date=parse_dt(data.get("dueDate")),
            created_at=parse_dt(data.get("createdAt")) or datetime.utcnow(),
            updated_at=parse_dt(data.get("updatedAt")) or datetime.utcnow(),
            labels=data.get("labels", []),
            priority=data.get("priority"),
            project=data.get("project"),
            url=data.get("url"),
        )


@dataclass
class UnifiedFile:
    """
    Unified file/document format across platforms.
    
    Supports: Google Drive, OneDrive, Notion
    """
    id: str
    platform: str  # 'google_drive', 'onedrive', 'notion'
    name: str
    mime_type: str
    size_bytes: int
    created_at: datetime
    modified_at: datetime
    owner: Optional[str] = None
    shared_with: List[str] = field(default_factory=list)
    url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    parent_folder: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "id": self.id,
            "platform": self.platform,
            "name": self.name,
            "mimeType": self.mime_type,
            "sizeBytes": self.size_bytes,
            "createdAt": self.created_at.isoformat(),
            "modifiedAt": self.modified_at.isoformat(),
            "owner": self.owner,
            "sharedWith": self.shared_with,
            "url": self.url,
            "thumbnailUrl": self.thumbnail_url,
            "parentFolder": self.parent_folder,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "UnifiedFile":
        """Create from dictionary"""
        def parse_dt(val):
            if isinstance(val, str):
                return datetime.fromisoformat(val.replace("Z", "+00:00"))
            return val
        
        return cls(
            id=data["id"],
            platform=data["platform"],
            name=data["name"],
            mime_type=data["mimeType"],
            size_bytes=data["sizeBytes"],
            created_at=parse_dt(data["createdAt"]),
            modified_at=parse_dt(data["modifiedAt"]),
            owner=data.get("owner"),
            shared_with=data.get("sharedWith", []),
            url=data.get("url"),
            thumbnail_url=data.get("thumbnailUrl"),
            parent_folder=data.get("parentFolder"),
        )
