"""
Session Repository - Data Access Layer
"""
from typing import Optional, List
from firebase.firestore import firestore_service
from models.session import Session


class SessionRepository:
    """Session data access repository"""
    
    COLLECTION = "sessions"
    
    async def create(self, session: Session) -> Session:
        """Create a new session"""
        session_dict = session.to_dict()
        await firestore_service.create_document(
            self.COLLECTION,
            session.id,
            session_dict
        )
        return session
    
    async def get_by_id(self, session_id: str) -> Optional[Session]:
        """Get session by ID"""
        session_dict = await firestore_service.get_document(self.COLLECTION, session_id)
        if session_dict:
            return Session(
                id=session_dict['id'],
                user_id=session_dict['userId'],
                device=session_dict['device'],
                browser=session_dict['browser'],
                ip=session_dict['ip'],
                location=session_dict.get('location'),
                created_at=session_dict['createdAt'],
                last_active=session_dict['lastActive'],
                is_active=session_dict['isActive'],
            )
        return None
    
    async def get_user_sessions(self, user_id: str) -> List[Session]:
        """Get all sessions for a user"""
        sessions_dict = await firestore_service.query_documents(
            self.COLLECTION,
            filters=[('userId', '==', user_id), ('isActive', '==', True)],
        )
        return [Session(
            id=s['id'],
            user_id=s['userId'],
            device=s['device'],
            browser=s['browser'],
            ip=s['ip'],
            location=s.get('location'),
            created_at=s['createdAt'],
            last_active=s['lastActive'],
            is_active=s['isActive'],
        ) for s in sessions_dict]
    
    async def update(self, session_id: str, update_data: dict) -> bool:
        """Update session"""
        await firestore_service.update_document(
            self.COLLECTION,
            session_id,
            update_data
        )
        return True
    
    async def delete(self, session_id: str) -> bool:
        """Delete session"""
        return await firestore_service.delete_document(self.COLLECTION, session_id)
    
    async def revoke_all_user_sessions(self, user_id: str) -> bool:
        """Revoke all sessions for a user"""
        sessions = await self.get_user_sessions(user_id)
        for session in sessions:
            await self.update(session.id, {'isActive': False})
        return True


session_repository = SessionRepository()
