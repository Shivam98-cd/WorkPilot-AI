"""Debug Gmail token status and refresh if needed"""
import asyncio
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv('.env')


async def main():
    """Check and refresh Gmail token if needed."""
    from firebase.admin_config import initialize_firebase
    initialize_firebase()
    from firebase.firestore import firestore_service
    from services.integration_service import integration_service
    from core.crypto import decrypt_value

    # Get the gmail integration for a connected user
    rows = await firestore_service.query_documents('user_integrations', filters=[('platform', '==', 'gmail')])
    if not rows:
        print('❌ No Gmail integrations found')
        return
    
    # Use the first connected integration
    row = rows[0]
    uid = row.get('uid')
    account = row.get('accountLabel', 'Unknown')
    status = row.get('status', 'Unknown')
    token_expires_at = row.get('tokenExpiresAt')
    access_token_enc = row.get('accessTokenEnc')
    refresh_token_enc = row.get('refreshTokenEnc')
    
    print(f'📧 Gmail Integration Debug')
    print(f'   User ID: {uid}')
    print(f'   Account: {account}')
    print(f'   Status: {status}')
    print(f'   Has Access Token: {"✅" if access_token_enc else "❌"}')
    print(f'   Has Refresh Token: {"✅" if refresh_token_enc else "❌"}')
    
    if token_expires_at:
        # Convert to datetime if it's a timestamp or string
        if hasattr(token_expires_at, 'timestamp'):
            expires_dt = datetime.fromtimestamp(token_expires_at.timestamp(), tz=timezone.utc)
        elif isinstance(token_expires_at, str):
            from dateutil import parser
            expires_dt = parser.isoparse(token_expires_at)
            if expires_dt.tzinfo is None:
                expires_dt = expires_dt.replace(tzinfo=timezone.utc)
        else:
            expires_dt = token_expires_at
        
        now = datetime.now(timezone.utc)
        time_diff = expires_dt - now
        
        print(f'   Token Expires At: {expires_dt}')
        print(f'   Current Time: {now}')
        print(f'   Time Until Expiry: {time_diff}')
        
        if time_diff.total_seconds() < 0:
            print(f'   ⚠️  Token is EXPIRED (expired {abs(time_diff.total_seconds())/60:.1f} minutes ago)')
        elif time_diff.total_seconds() < 300:  # 5 minutes
            print(f'   ⚠️  Token expires soon (in {time_diff.total_seconds()/60:.1f} minutes)')
        else:
            print(f'   ✅ Token is valid (expires in {time_diff.total_seconds()/60:.1f} minutes)')
    else:
        print(f'   ⚠️  No expiration time stored')
    
    print('\n📤 Attempting to get valid token (will auto-refresh if needed)...')
    
    try:
        # Get the integration record
        from repositories.integration_repository import integration_repository
        record = await integration_repository.get(uid, 'gmail')
        
        # This will automatically refresh the token if needed
        token = await integration_service._get_valid_google_token(uid, 'gmail', record)
        
        if token:
            print(f'✅ Successfully obtained valid token')
            print(f'   Token length: {len(token)} characters')
            print(f'   Token preview: {token[:20]}...')
            
            # Now try to send the test email
            print('\n📧 Attempting to send test email...')
            result = await integration_service.send_gmail_message(
                uid=uid,
                to=account,
                subject="Test Email from WorkPilot AI - Token Refresh Test",
                body="""Hello!

This is an automated test email sent from WorkPilot AI backend after token refresh.

✅ If you received this, your email integration and token refresh are working correctly!

Technical Details:
- Sent via: Gmail API OAuth2
- Integration: Gmail
- Method: integration_service.send_gmail_message()
- Token refreshed: Yes

Best regards,
WorkPilot AI System
"""
            )
            
            print('\n✅ Email sent successfully!')
            print(f'   Message ID: {result.get("id")}')
            print(f'   Thread ID: {result.get("threadId")}')
            print(f'\n💡 Check the inbox of {account} to confirm delivery.')
        else:
            print('❌ Could not obtain valid token')
    
    except Exception as e:
        print(f'\n❌ ERROR: {type(e).__name__}: {e}')
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    asyncio.run(main())
