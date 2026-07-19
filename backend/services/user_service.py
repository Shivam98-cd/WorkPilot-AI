"""
User Service - Business Logic
"""
from typing import Optional, Dict, Any, List
from repositories.user_repository import user_repository
from repositories.session_repository import session_repository
from core.exceptions import NotFoundException


class UserService:
    """User business logic service"""
    
    async def get_user_profile(self, uid: str) -> Dict[str, Any]:
        """Get user profile"""
        user = await user_repository.get_by_uid(uid)
        
        if not user:
            raise NotFoundException(f"User not found: {uid}")
        
        return user.to_dict()
    
    async def update_user_profile(
        self,
        uid: str,
        update_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Update user profile"""
        user = await user_repository.get_by_uid(uid)
        
        if not user:
            raise NotFoundException(f"User not found: {uid}")
        
        updated_user = await user_repository.update(uid, update_data)
        
        return updated_user.to_dict()
    
    async def delete_user(self, uid: str) -> bool:
        """Delete user account"""
        user = await user_repository.get_by_uid(uid)
        
        if not user:
            raise NotFoundException(f"User not found: {uid}")
        
        await session_repository.revoke_all_user_sessions(uid)
        
        await user_repository.delete(uid)
        
        return True
    
    async def get_user_sessions(self, uid: str) -> List[Dict[str, Any]]:
        """Get all active sessions for a user"""
        sessions = await session_repository.get_user_sessions(uid)
        return [session.to_dict() for session in sessions]
    
    async def revoke_session(self, uid: str, session_id: str) -> bool:
        """Revoke a specific session"""
        session = await session_repository.get_by_id(session_id)
        
        if not session or session.user_id != uid:
            raise NotFoundException("Session not found")
        
        await session_repository.update(session_id, {'isActive': False})
        
        return True


user_service = UserService()
