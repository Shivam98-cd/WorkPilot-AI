"""
Quick test to see what the integrations API is returning
"""
import asyncio
import sys
sys.path.insert(0, 'backend')

from repositories.integration_repository import integration_repository

async def main():
    # Get a user ID from your Firebase (replace with your actual user ID)
    uid = "test_user"  # You'll need to replace this
    
    print("\n🔍 Fetching integrations from Firestore...")
    records = await integration_repository.list_for_user(uid)
    
    print(f"\n📊 Found {len(records)} integration records\n")
    
    for record in records:
        print(f"Platform: {record.platform}")
        print(f"  Status: {record.status}")
        print(f"  Connected: {record.status == 'connected'}")
        print(f"  Account: {record.account_label}")
        print(f"  Has Access Token: {record.access_token_enc is not None}")
        print(f"  Has Refresh Token: {record.refresh_token_enc is not None}")
        print(f"  Created: {record.created_at}")
        print()

if __name__ == "__main__":
    asyncio.run(main())
