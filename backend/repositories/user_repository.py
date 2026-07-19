"""
User Repository - Data Access Layer
"""
from typing import Optional, List
from firebase.firestore import firestore_service
from models.user import User
from core.exceptions import NotFoundException


class UserRepository:
    """User data access repository"""
    
    COLLECTION = "users"
    
    async def create(self, user: User) -> User:
        """Create a new user"""
        user_dict = user.to_dict()
        await firestore_service.create_document(
            self.COLLECTION,
            user.uid,
            user_dict
        )
        return user
    
    async def get_by_uid(self, uid: str) -> Optional[User]:
        """Get user by UID"""
        user_dict = await firestore_service.get_document(self.COLLECTION, uid)
        if user_dict:
            return User.from_dict(user_dict)
        return None
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        users = await firestore_service.query_documents(
            self.COLLECTION,
            filters=[('email', '==', email)],
            limit=1
        )
        if users:
            return User.from_dict(users[0])
        return None
    
    async def update(self, uid: str, update_data: dict) -> User:
        """Update user"""
        await firestore_service.update_document(
            self.COLLECTION,
            uid,
            update_data
        )
        return await self.get_by_uid(uid)
    
    async def delete(self, uid: str) -> bool:
        """Delete user"""
        return await firestore_service.delete_document(self.COLLECTION, uid)
    
    async def list_users(self, limit: int = 100) -> List[User]:
        """List all users"""
        users_dict = await firestore_service.query_documents(
            self.COLLECTION,
            limit=limit
        )
        return [User.from_dict(u) for u in users_dict]


user_repository = UserRepository()
