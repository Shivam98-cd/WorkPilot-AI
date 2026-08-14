"""Test real Gmail fetch for connected user"""
import asyncio
from dotenv import load_dotenv
load_dotenv('.env')

UID = '4E7MbyAmAdQA'  # first 12 chars — let's find the full uid

async def main():
    from firebase.admin_config import initialize_firebase
    initialize_firebase()
    from firebase.firestore import firestore_service

    # Get the gmail integration
    rows = await firestore_service.query_documents('user_integrations', filters=[('platform','==','gmail')])
    if not rows:
        print('No gmail integrations found')
        return
    
    row = rows[0]
    uid = row.get('uid')
    print(f'Testing uid: {uid}')
    print(f'Account: {row.get("accountLabel")}')
    
    # Try fetching emails
    from services.integration_service import integration_service
    try:
        emails = await integration_service.list_user_emails(uid)
        print(f'Real emails fetched: {len(emails)}')
        for e in emails[:3]:
            print(f'  - From: {e.get("from")}  Subject: {e.get("subject")}')
    except Exception as e:
        print(f'ERROR: {type(e).__name__}: {e}')

asyncio.run(main())
