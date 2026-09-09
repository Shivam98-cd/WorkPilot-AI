#!/usr/bin/env python3
"""
Verify that the calendar event was actually created in Google Calendar.
Usage: python verify_calendar_event.py
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from services.integration_service import integration_service
from repositories.integration_repository import integration_repository

async def verify_event():
    """Check if the Team Review event exists in Google Calendar"""
    
    # Your user ID from Firebase
    uid = "1ywT9tPtXtOHbPJjQIeTF8FPxv82"
    
    # Event ID from the AI response
    event_id = "s3c21n6ald6h64qcj7sc4u0ehg"
    
    print("🔍 Verifying calendar event...")
    print(f"User ID: {uid}")
    print(f"Event ID: {event_id}")
    print("-" * 60)
    
    try:
        # Get Google Calendar integration
        record = await integration_repository.get(uid, "google_calendar")
        
        if not record or record.status != "connected":
            print("❌ Google Calendar is not connected")
            return
        
        print(f"✅ Google Calendar integration found (status: {record.status})")
        
        # Get valid token
        token = await integration_service._get_valid_google_token(uid, "google_calendar", record)
        
        if not token:
            print("❌ Could not get valid token")
            return
        
        print("✅ Valid OAuth token obtained")
        
        # Fetch the event from Google Calendar API
        import httpx
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                f"https://www.googleapis.com/calendar/v3/calendars/primary/events/{event_id}",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code == 404:
                print("❌ Event not found in Google Calendar")
                print(f"   Event ID: {event_id}")
                return
            
            response.raise_for_status()
            event = response.json()
        
        print("\n✅ EVENT FOUND IN GOOGLE CALENDAR!")
        print("=" * 60)
        print(f"📅 Title: {event.get('summary')}")
        print(f"🕐 Start: {event.get('start', {}).get('dateTime')}")
        print(f"🕐 End: {event.get('end', {}).get('dateTime')}")
        print(f"👥 Attendees:")
        for attendee in event.get('attendees', []):
            status = attendee.get('responseStatus', 'unknown')
            print(f"   • {attendee.get('email')} ({status})")
        
        # Extract Meet link
        meet_link = event.get('hangoutLink')
        if not meet_link:
            for entry in event.get('conferenceData', {}).get('entryPoints', []):
                if entry.get('entryPointType') == 'video':
                    meet_link = entry.get('uri')
                    break
        
        if meet_link:
            print(f"🎥 Google Meet: {meet_link}")
        
        print(f"🔗 Calendar Link: {event.get('htmlLink')}")
        print("=" * 60)
        print("\n✅ Verification successful! Event exists in Google Calendar.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(verify_event())
