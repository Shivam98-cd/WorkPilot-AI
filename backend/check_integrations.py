"""Quick check — show connected integrations in Firestore"""
import asyncio
from dotenv import load_dotenv
load_dotenv('.env')

async def main():
    from firebase.admin_config import initialize_firebase
    initialize_firebase()
    from firebase.firestore import firestore_service

    rows = await firestore_service.query_documents('user_integrations', filters=[('status','==','connected')])
    print(f'Connected integrations: {len(rows)}')
    for r in rows:
        uid = r.get('uid','')[:12]
        platform = r.get('platform','?')
        label = r.get('accountLabel','?')
        has_token = bool(r.get('accessTokenEnc'))
        print(f'  uid={uid}...  platform={platform}  label={label}  has_token={has_token}')

asyncio.run(main())
