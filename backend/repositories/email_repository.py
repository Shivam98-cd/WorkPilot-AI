"""Email repository for database operations."""
import logging
from datetime import datetime
from typing import List, Optional
from firebase.firestore import firestore_service
from models.email import Email, EmailStatistics

logger = logging.getLogger(__name__)


class EmailRepository:
    """Repository for email data operations."""
    
    COLLECTION = "emails"
    STATS_COLLECTION = "email_statistics"
    
    async def create(self, email: Email) -> Email:
        """
        Store a sent email in the database.
        
        Args:
            email: Email model instance
        
        Returns:
            Created email
        """
        try:
            email_dict = email.model_dump()
            # Convert datetime objects to ISO strings
            email_dict["sent_at"] = email.sent_at.isoformat() if email.sent_at else datetime.utcnow().isoformat()
            email_dict["created_at"] = email.created_at.isoformat() if email.created_at else datetime.utcnow().isoformat()
            
            await firestore_service.create_document(
                self.COLLECTION,
                email.id,
                email_dict
            )
            
            # Update user statistics
            await self._update_statistics(email.uid, email_type="sent")
            
            logger.info(f"Stored email {email.id} for user {email.uid}")
            return email
            
        except Exception as e:
            logger.error(f"Failed to create email record: {e}")
            raise
    
    async def get(self, email_id: str) -> Optional[Email]:
        """
        Get an email by ID.
        
        Args:
            email_id: Email identifier
        
        Returns:
            Email or None if not found
        """
        try:
            doc = await firestore_service.get_document(self.COLLECTION, email_id)
            if doc:
                return Email(**doc)
            return None
        except Exception as e:
            logger.error(f"Failed to get email {email_id}: {e}")
            return None
    
    async def list_for_user(
        self,
        uid: str,
        limit: int = 50,
        email_type: Optional[str] = None,
        platform: Optional[str] = None
    ) -> List[Email]:
        """
        List emails for a user.
        
        Args:
            uid: User ID
            limit: Maximum emails to return
            email_type: Filter by type (sent, received, draft)
            platform: Filter by platform (gmail, outlook)
        
        Returns:
            List of emails
        """
        try:
            filters = [("uid", "==", uid)]
            
            if email_type:
                filters.append(("email_type", "==", email_type))
            
            if platform:
                filters.append(("platform", "==", platform))
            
            docs = await firestore_service.query_documents(
                self.COLLECTION,
                filters=filters,
                order_by="sent_at",
                limit=limit
            )
            
            return [Email(**doc) for doc in docs]
            
        except Exception as e:
            logger.error(f"Failed to list emails for user {uid}: {e}")
            return []
    
    async def get_statistics(self, uid: str) -> EmailStatistics:
        """
        Get email statistics for a user.
        
        Args:
            uid: User ID
        
        Returns:
            EmailStatistics object
        """
        try:
            doc = await firestore_service.get_document(self.STATS_COLLECTION, uid)
            
            if doc:
                return EmailStatistics(**doc)
            
            # Create default statistics
            stats = EmailStatistics(uid=uid)
            await firestore_service.create_document(
                self.STATS_COLLECTION,
                uid,
                stats.model_dump()
            )
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get statistics for user {uid}: {e}")
            return EmailStatistics(uid=uid)
    
    async def _update_statistics(self, uid: str, email_type: str) -> None:
        """
        Update email statistics for a user.
        
        Args:
            uid: User ID
            email_type: Type of email (sent, received)
        """
        try:
            stats = await self.get_statistics(uid)
            
            if email_type == "sent":
                stats.total_sent += 1
            elif email_type == "received":
                stats.total_received += 1
            
            stats.last_email_at = datetime.utcnow()
            
            if not stats.first_email_at:
                stats.first_email_at = datetime.utcnow()
            
            stats.updated_at = datetime.utcnow()
            
            # Convert to dict for storage
            stats_dict = stats.model_dump()
            stats_dict["first_email_at"] = stats.first_email_at.isoformat() if stats.first_email_at else None
            stats_dict["last_email_at"] = stats.last_email_at.isoformat() if stats.last_email_at else None
            stats_dict["updated_at"] = stats.updated_at.isoformat()
            
            await firestore_service.create_document(
                self.STATS_COLLECTION,
                uid,
                stats_dict
            )
            
        except Exception as e:
            logger.error(f"Failed to update statistics for user {uid}: {e}")
    
    async def delete(self, email_id: str) -> bool:
        """
        Delete an email record.
        
        Args:
            email_id: Email identifier
        
        Returns:
            True if deleted, False otherwise
        """
        try:
            await firestore_service.delete_document(self.COLLECTION, email_id)
            logger.info(f"Deleted email {email_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete email {email_id}: {e}")
            return False


# Singleton instance
email_repository = EmailRepository()
