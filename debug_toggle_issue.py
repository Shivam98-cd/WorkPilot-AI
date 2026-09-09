"""
Debug script to find why toggles aren't showing green
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from repositories.integration_repository import integration_repository
from services.integration_service import integration_service

async def main():
    # Replace with your actual user ID from the logs
    uid = "1ywT9tPtXtOHbPJjQIeTF8FPxv82"
    
    print("\n" + "="*70)
    print("🔍 DEBUGGING INTEGRATION TOGGLE ISSUE")
    print("="*70)
    
    print(f"\n1️⃣ Fetching raw integration records from Firestore...")
    records = await integration_repository.list_for_user(uid)
    
    print(f"\n   Found {len(records)} records:\n")
    for record in records:
        print(f"   Platform: {record.platform}")
        print(f"   └─ status: '{record.status}'")
        print(f"   └─ status == 'connected': {record.status == 'connected'}")
        print(f"   └─ account_label: {record.account_label}")
        print(f"   └─ has access_token: {record.access_token_enc is not None}")
        print()
    
    print("\n2️⃣ Building integrations list (what API returns)...")
    api_data = await integration_service.build_integrations_list_from_records(records)
    
    print(f"\n   API returns {len(api_data)} items:\n")
    connected_items = [item for item in api_data if item['connected']]
    
    print(f"   ✅ Connected integrations: {len(connected_items)}")
    for item in connected_items:
        print(f"      • {item['displayName']} ({item['platform']})")
        print(f"        - connected: {item['connected']}")
        print(f"        - status: {item['status']}")
        print(f"        - accountLabel: {item['accountLabel']}")
    
    print(f"\n   ❌ Disconnected integrations: {len(api_data) - len(connected_items)}")
    
    print("\n3️⃣ Checking what's wrong...\n")
    
    # Check for status mismatches
    for record in records:
        api_item = next((item for item in api_data if item['platform'] == record.platform), None)
        if api_item:
            record_connected = (record.status == "connected")
            api_connected = api_item['connected']
            
            if record_connected != api_connected:
                print(f"   ⚠️  MISMATCH for {record.platform}:")
                print(f"      Firestore: status='{record.status}' → connected={record_connected}")
                print(f"      API: connected={api_connected}, status='{api_item['status']}'")
                print()
    
    print("\n" + "="*70)
    print("✅ Debug complete!")
    print("="*70 + "\n")

if __name__ == "__main__":
    asyncio.run(main())
