"""
Firebase Admin SDK Configuration
"""
import firebase_admin
from firebase_admin import credentials, auth, firestore
from core.config import settings
import json


_firebase_app = None
_firestore_client = None


def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    global _firebase_app, _firestore_client
    
    if _firebase_app is not None:
        return _firebase_app
    
    try:
        cred_dict = {
            "type": "service_account",
            "project_id": settings.FIREBASE_PROJECT_ID,
            "private_key_id": settings.FIREBASE_PRIVATE_KEY_ID,
            "private_key": settings.FIREBASE_PRIVATE_KEY.replace('\\n', '\n'),
            "client_email": settings.FIREBASE_CLIENT_EMAIL,
            "client_id": settings.FIREBASE_CLIENT_ID,
            "auth_uri": settings.FIREBASE_AUTH_URI,
            "token_uri": settings.FIREBASE_TOKEN_URI,
            "auth_provider_x509_cert_url": settings.FIREBASE_AUTH_PROVIDER_CERT_URL,
            "client_x509_cert_url": settings.FIREBASE_CLIENT_CERT_URL,
        }
        
        cred = credentials.Certificate(cred_dict)
        _firebase_app = firebase_admin.initialize_app(cred)
        _firestore_client = firestore.client()
        
        print("✅ Firebase Admin SDK initialized successfully")
        return _firebase_app
        
    except Exception as e:
        print(f"❌ Firebase initialization failed: {str(e)}")
        raise


def get_auth_client():
    """Get Firebase Auth client"""
    if _firebase_app is None:
        initialize_firebase()
    return auth


def get_firestore_client():
    """Get Firestore client"""
    global _firestore_client
    if _firestore_client is None:
        initialize_firebase()
    return _firestore_client
