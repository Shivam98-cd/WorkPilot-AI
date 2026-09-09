#!/usr/bin/env python3
"""
Check which email ID created the Google Meet
Usage: python check_meet_creator.py
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from services.integration_service import integration_service
from repositories.integration_repository import integration_repository

async def check_meet_creator():
    """Check the email ID that created the Google Meet"""
    
    # Your user ID from Firebase
    uid = "1ywT9tPtXtOHbPJjQIeTF8FPxv82"
    
    # Event ID from the meeting we created
    event_id = "s3c21n6ald6h64qcj7sc4u0ehg"
    
    print("=" * 80)
    print("🔍 CHECKING GOOGLE MEET CREATOR EMAIL")
    print("=" * 80)
    print(f"User ID: {uid}")
    print(f"Event ID: {event_id}")
    print()
    
    try:
        # Get Google Calendar integration
        record = await integration_repository.get(uid, "google_calendar")
        
        if not record or record.status != "connected":
            print("❌ Google Calendar is not connected")
            return
        
        print(f"✅ Google Calendar integration found")
        print(f"📧 Connected Account: {record.account_label}")
        print()
        
        # Get valid token
        token = await integration_service._get_valid_google_token(uid, "google_calendar", record)
        
        if not token:
            print("❌ Could not get valid token")
            return
        
        print("✅ Valid OAuth token obtained")
        print()
        
        # Fetch the event from Google Calendar API
        import httpx
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                f"https://www.googleapis.com/calendar/v3/calendars/primary/events/{event_id}",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code == 404:
                print("❌ Event not found in Google Calendar")
                return
            
            response.raise_for_status()
            event = response.json()
        
        print("✅ EVENT FOUND IN GOOGLE CALENDAR!")
        print("=" * 80)
        
        # Extract creator information
        creator = event.get('creator', {})
        organizer = event.get('organizer', {})
        
        print("📅 EVENT DETAILS:")
        print("-" * 80)
        print(f"Title: {event.get('summary')}")
        print(f"Start: {event.get('start', {}).get('dateTime')}")
        print(f"End: {event.get('end', {}).get('dateTime')}")
        print()
        
        print("👤 CREATOR (Who created the event):")
        print("-" * 80)
        print(f"Email: {creator.get('email', 'Not available')}")
        print(f"Display Name: {creator.get('displayName', 'Not available')}")
        print(f"Is Self: {creator.get('self', False)}")
        print()
        
        print("📊 ORGANIZER (Who's hosting):")
        print("-" * 80)
        print(f"Email: {organizer.get('email', 'Not available')}")
        print(f"Display Name: {organizer.get('displayName', 'Not available')}")
        print(f"Is Self: {organizer.get('self', False)}")
        print()
        
        # Extract Meet link
        meet_link = event.get('hangoutLink')
        if not meet_link:
            for entry in event.get('conferenceData', {}).get('entryPoints', []):
                if entry.get('entryPointType') == 'video':
                    meet_link = entry.get('uri')
                    break
        
        if meet_link:
            print("🎥 GOOGLE MEET:")
            print("-" * 80)
            print(f"Meet Link: {meet_link}")
            print()
        
        # Extract attendees
        attendees = event.get('attendees', [])
        if attendees:
            print(f"👥 ATTENDEES ({len(attendees)}):")
            print("-" * 80)
            for i, attendee in enumerate(attendees, 1):
                email = attendee.get('email')
                status = attendee.get('responseStatus', 'unknown')
                is_organizer = attendee.get('organizer', False)
                print(f"{i}. {email}")
                print(f"   Response: {status}")
                if is_organizer:
                    print(f"   Role: Organizer")
            print()
        
        print("=" * 80)
        print("📝 SUMMARY")
        print("=" * 80)
        
        creator_email = creator.get('email')
        organizer_email = organizer.get('email')
        
        print(f"✅ Google Meet created from: {creator_email or organizer_email}")
        print(f"✅ Meeting hosted by: {organizer_email}")
        print(f"✅ Connected WorkPilot account: {record.account_label}")
        
        if creator_email and creator_email == record.account_label:
            print()
            print("✅ Confirmed: The Meet was created using your connected account!")
        elif creator_email:
            print()
            print("⚠️  Warning: Meet creator doesn't match your connected account")
            print(f"   Creator: {creator_email}")
            print(f"   Connected: {record.account_label}")
        
        print("=" * 80)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_meet_creator())
