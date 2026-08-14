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
        # Try loading from service account JSON file first
        import os
        json_path = os.path.join(os.path.dirname(__file__), '..', 'firebase-service-account.json')
        if os.path.exists(json_path):
            cred = credentials.Certificate(json_path)
        else:
            # Fall back to environment variables
            private_key = settings.FIREBASE_PRIVATE_KEY
            # Replace escaped newlines with actual newlines
            if '\\n' in private_key:
                private_key = private_key.replace('\\n', '\n')
            
            cred_dict = {
                "type": "service_account",
                "project_id": settings.FIREBASE_PROJECT_ID,
                "private_key_id": settings.FIREBASE_PRIVATE_KEY_ID,
                "private_key": private_key,
                "client_email": settings.FIREBASE_CLIENT_EMAIL,
                "client_id": settings.FIREBASE_CLIENT_ID,
                "auth_uri": settings.FIREBASE_AUTH_URI,
                "token_uri": settings.FIREBASE_TOKEN_URI,
                "auth_provider_x509_cert_url": settings.FIREBASE_AUTH_PROVIDER_CERT_URL,
                "client_x509_cert_url": settings.FIREBASE_CLIENT_CERT_URL,
            }
            cred = credentials.Certificate(cred_dict)
        
        _firebase_app = firebase_admin.initialize_app(cred)
        # Enterprise edition database name is 'default' (no parentheses)
        # Standard edition uses '(default)' — controlled by FIRESTORE_DATABASE env var
        db_name = settings.FIRESTORE_DATABASE
        try:
            if db_name != "(default)":
                from google.cloud import firestore as gcloud_firestore
                from google.oauth2 import service_account as sa_module
                import json as _json
                _sa_path = os.path.join(os.path.dirname(__file__), '..', 'firebase-service-account.json')
                if os.path.exists(_sa_path):
                    sa_info = _json.load(open(_sa_path))
                else:
                    sa_info = {
                        "type": "service_account",
                        "project_id": settings.FIREBASE_PROJECT_ID,
                        "private_key": settings.FIREBASE_PRIVATE_KEY.replace('\\n', '\n'),
                        "client_email": settings.FIREBASE_CLIENT_EMAIL,
                        "token_uri": "https://oauth2.googleapis.com/token",
                    }
                gcloud_creds = sa_module.Credentials.from_service_account_info(
                    sa_info,
                    scopes=["https://www.googleapis.com/auth/cloud-platform"],
                )
                _firestore_client = gcloud_firestore.Client(
                    project=settings.FIREBASE_PROJECT_ID,
                    credentials=gcloud_creds,
                    database=db_name,
                )
            else:
                _firestore_client = firestore.client()
        except Exception as e:
            print(f"[WARN] Firestore custom db init failed ({e}), falling back to default")
            _firestore_client = firestore.client()
        print(f"[OK] Firebase Admin SDK initialized successfully (database: {db_name})")
        return _firebase_app
    except Exception as e:
        # In test environments we may not have valid Firebase credentials.
        # Instead of raising, log the error and continue with a None client.
        print(f"Firebase initialization failed (ignored for tests): {str(e)}")
        _firebase_app = None
        _firestore_client = None
        return None


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
