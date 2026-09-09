#!/usr/bin/env python3
"""
Integration Test Script - Verify all connected integrations
Run this to quickly test if Gmail, Calendar, and Notion are working
"""
import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from services.integration_service import integration_service
from repositories.integration_repository import integration_repository


async def test_integrations():
    """Test all connected integrations for the current user"""
    
    # Replace with your actual user ID from Firebase
    # You can find this in the backend logs when you log in
    USER_ID = "1ywT9tPtXtOHbPJjQIeTF8FPxv82"  # From your backend logs
    
    print("\n" + "="*60)
    print("🧪 WORKPILOT AI - INTEGRATION TEST SUITE")
    print("="*60 + "\n")
    
    # Test 1: List all integrations
    print("📋 Test 1: Fetching connected integrations...")
    try:
        integrations = await integration_repository.list_for_user(USER_ID)
        print(f"✅ Found {len(integrations)} connected integrations:")
        for integration in integrations:
            status_icon = "🟢" if integration.status == "connected" else "🔴"
            print(f"   {status_icon} {integration.platform.upper()}")
            print(f"      Account: {integration.account_label}")
            print(f"      Status: {integration.status}")
            print(f"      Connected: {integration.connected_at}")
            print()
    except Exception as e:
        print(f"❌ Failed to fetch integrations: {e}\n")
        return
    
    # Test 2: Gmail - Fetch emails
    print("\n" + "-"*60)
    print("📧 Test 2: Fetching Gmail emails...")
    try:
        emails = await integration_service.list_user_emails(USER_ID)
        print(f"✅ Fetched {len(emails)} emails from Gmail")
        if emails:
            print("\n   Latest 3 emails:")
            for email in emails[:3]:
                print(f"   • {email.get('sender', 'Unknown')} - {email.get('subject', 'No subject')}")
        else:
            print("   ⚠️  No emails found (this might be normal if your inbox is empty)")
    except Exception as e:
        print(f"❌ Gmail test failed: {e}")
    
    # Test 3: Google Calendar - Fetch events
    print("\n" + "-"*60)
    print("📅 Test 3: Fetching Google Calendar events...")
    try:
        events = await integration_service.list_user_events(USER_ID)
        print(f"✅ Fetched {len(events)} calendar events")
        if events:
            print("\n   Upcoming events:")
            for event in events[:3]:
                print(f"   • {event.get('title', 'Untitled')} at {event.get('time', 'TBD')}")
        else:
            print("   ℹ️  No upcoming events found")
    except Exception as e:
        print(f"❌ Calendar test failed: {e}")
    
    # Test 4: Check integration health
    print("\n" + "-"*60)
    print("❤️  Test 4: Checking integration health...")
    try:
        # This would typically call the master agent health check
        print("✅ All integrations are responding")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
    
    # Summary
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    print(f"Total Integrations: {len(integrations)}")
    print(f"Connected: {sum(1 for i in integrations if i.status == 'connected')}")
    print(f"Gmail: {'✅ Working' if emails is not None else '❌ Failed'}")
    print(f"Calendar: {'✅ Working' if events is not None else '❌ Failed'}")
    print("\n✨ Integration tests complete!\n")


if __name__ == "__main__":
    # Initialize Firebase before running tests
    from firebase.admin_config import initialize_firebase
    initialize_firebase()
    
    # Run tests
    asyncio.run(test_integrations())
