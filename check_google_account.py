#!/usr/bin/env python3
"""
Check the currently logged-in Google account for Gmail and Google Calendar
Usage: python check_google_account.py
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from repositories.integration_repository import integration_repository
from core.crypto import decrypt_value

async def check_google_account():
    """Display the Google account info for Gmail and Calendar"""
    
    # Your user ID from Firebase
    uid = "1ywT9tPtXtOHbPJjQIeTF8FPxv82"
    
    print("=" * 70)
    print("🔍 CHECKING GOOGLE ACCOUNT INFORMATION")
    print("=" * 70)
    print(f"User ID: {uid}")
    print()
    
    # Check Gmail
    print("📧 GMAIL INTEGRATION")
    print("-" * 70)
    try:
        gmail_record = await integration_repository.get(uid, "gmail")
        
        if gmail_record:
            print(f"✅ Status: {gmail_record.status}")
            print(f"📧 Email: {gmail_record.account_label or 'Not available'}")
            print(f"🔗 Connected At: {gmail_record.connected_at}")
            print(f"🔄 Last Sync: {gmail_record.last_sync_at or 'Never'}")
            print(f"📊 Last Sync Status: {gmail_record.last_sync_status or 'Unknown'}")
            
            # Check metadata for additional info
            if gmail_record.metadata:
                print(f"📋 Metadata: {gmail_record.metadata}")
            
            if gmail_record.token_expires_at:
                print(f"⏰ Token Expires At: {gmail_record.token_expires_at}")
            
            # Check if token is encrypted
            if gmail_record.access_token_enc:
                print(f"🔐 Access Token: Encrypted (length: {len(gmail_record.access_token_enc)})")
            if gmail_record.refresh_token_enc:
                print(f"🔐 Refresh Token: Encrypted (length: {len(gmail_record.refresh_token_enc)})")
        else:
            print("❌ Gmail is not connected")
    except Exception as e:
        print(f"❌ Error checking Gmail: {e}")
    
    print()
    
    # Check Google Calendar
    print("📅 GOOGLE CALENDAR INTEGRATION")
    print("-" * 70)
    try:
        calendar_record = await integration_repository.get(uid, "google_calendar")
        
        if calendar_record:
            print(f"✅ Status: {calendar_record.status}")
            print(f"📧 Email: {calendar_record.account_label or 'Not available'}")
            print(f"🔗 Connected At: {calendar_record.connected_at}")
            print(f"🔄 Last Sync: {calendar_record.last_sync_at or 'Never'}")
            print(f"📊 Last Sync Status: {calendar_record.last_sync_status or 'Unknown'}")
            
            # Check metadata for additional info
            if calendar_record.metadata:
                print(f"📋 Metadata: {calendar_record.metadata}")
            
            if calendar_record.token_expires_at:
                print(f"⏰ Token Expires At: {calendar_record.token_expires_at}")
            
            # Check if token is encrypted
            if calendar_record.access_token_enc:
                print(f"🔐 Access Token: Encrypted (length: {len(calendar_record.access_token_enc)})")
            if calendar_record.refresh_token_enc:
                print(f"🔐 Refresh Token: Encrypted (length: {len(calendar_record.refresh_token_enc)})")
        else:
            print("❌ Google Calendar is not connected")
    except Exception as e:
        print(f"❌ Error checking Google Calendar: {e}")
    
    print()
    print("=" * 70)
    print("📝 SUMMARY")
    print("=" * 70)
    
    # Summary
    gmail_email = None
    calendar_email = None
    
    try:
        gmail_record = await integration_repository.get(uid, "gmail")
        if gmail_record:
            gmail_email = gmail_record.account_label
    except:
        pass
    
    try:
        calendar_record = await integration_repository.get(uid, "google_calendar")
        if calendar_record:
            calendar_email = calendar_record.account_label
    except:
        pass
    
    if gmail_email or calendar_email:
        print(f"✅ You are logged in with Google account:")
        if gmail_email:
            print(f"   Gmail: {gmail_email}")
        if calendar_email:
            print(f"   Calendar: {calendar_email}")
        
        if gmail_email and calendar_email and gmail_email != calendar_email:
            print()
            print("⚠️  WARNING: Gmail and Calendar are using different accounts!")
            print(f"   Consider reconnecting to use the same account for both.")
    else:
        print("❌ No Google account connected")
    
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(check_google_account())
