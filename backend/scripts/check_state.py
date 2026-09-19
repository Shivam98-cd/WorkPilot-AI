import asyncio
import os
import sys

# Ensure backend directory in path
sys.path.insert(0, os.path.abspath('.'))

from firebase.admin_config import get_firestore_db
from repositories.integration_repository import integration_repository
from services.integration_service import integration_service
from security.jwt import create_access_token

async def main():
    db = get_firestore_db()
    users = [doc.id for doc in db.collection('users').stream()]
    print('Users in Firestore:', users)
    for uid in users:
        records = await integration_repository.list_for_user(uid)
        print(f"\nUID {uid}: {len(records)} records")
        for r in records:
            print(f"  - {r.platform}: status={r.status}, label={r.account_label}")
        
        items = await integration_service.list_for_user(uid)
        conn = [x for x in items if x.get('connected')]
        print(f"  Integration service connected count: {len(conn)}")
        for c in conn:
            print(f"    * {c['platform']}: connected={c['connected']}, status={c['status']}, accountLabel={c['accountLabel']}")

    # Let's also create a test JWT token for the user 1ywT9tPtXtOHbPJjQIeTF8FPxv82
    test_user = "1ywT9tPtXtOHbPJjQIeTF8FPxv82"
    token = create_access_token({"sub": test_user, "uid": test_user, "email": "sy985798@gmail.com"})
    print("\nGenerated test access token:")
    print(token)

if __name__ == "__main__":
    asyncio.run(main())
