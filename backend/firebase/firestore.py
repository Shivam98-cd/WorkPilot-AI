"""
Firestore Database Wrapper
"""
from typing import Optional, Dict, Any, List
from firebase.admin_config import get_firestore_client
from datetime import datetime
from core.exceptions import NotFoundException, ValidationException


class FirestoreService:
    """Firestore database service wrapper"""
    
    def __init__(self):
        self.db = get_firestore_client()
    
    async def create_document(
        self,
        collection: str,
        document_id: str,
        data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Create a new document"""
        try:
            doc_ref = self.db.collection(collection).document(document_id)
            data['createdAt'] = datetime.utcnow()
            data['updatedAt'] = datetime.utcnow()
            doc_ref.set(data)
            return data
        except Exception as e:
            raise ValidationException(f"Failed to create document: {str(e)}")
    
    async def get_document(
        self,
        collection: str,
        document_id: str,
    ) -> Optional[Dict[str, Any]]:
        """Get a document by ID"""
        try:
            doc_ref = self.db.collection(collection).document(document_id)
            doc = doc_ref.get()
            
            if doc.exists:
                data = doc.to_dict()
                data['id'] = doc.id
                return data
            return None
        except Exception as e:
            raise ValidationException(f"Failed to get document: {str(e)}")
    
    async def update_document(
        self,
        collection: str,
        document_id: str,
        data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Update a document"""
        try:
            doc_ref = self.db.collection(collection).document(document_id)
            data['updatedAt'] = datetime.utcnow()
            doc_ref.update(data)
            return data
        except Exception as e:
            raise ValidationException(f"Failed to update document: {str(e)}")
    
    async def delete_document(self, collection: str, document_id: str) -> bool:
        """Delete a document"""
        try:
            doc_ref = self.db.collection(collection).document(document_id)
            doc_ref.delete()
            return True
        except Exception as e:
            raise ValidationException(f"Failed to delete document: {str(e)}")
    
    async def query_documents(
        self,
        collection: str,
        filters: Optional[List[tuple]] = None,
        order_by: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Query documents with filters"""
        try:
            query = self.db.collection(collection)
            
            if filters:
                for field, operator, value in filters:
                    query = query.where(field, operator, value)
            
            if order_by:
                query = query.order_by(order_by)
            
            if limit:
                query = query.limit(limit)
            
            docs = query.stream()
            results = []
            
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                results.append(data)
            
            return results
        except Exception as e:
            raise ValidationException(f"Failed to query documents: {str(e)}")


firestore_service = FirestoreService()
