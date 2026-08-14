"""Send email NOW using the integration with valid token (non-interactive)"""
import asyncio
import sys
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv('.env')


async def main():
    """Send email using the integration with a valid token."""
    from firebase.admin_config import initialize_firebase
    initialize_firebase()
    from firebase.firestore import firestore_service
    from services.integration_service import integration_service
    
    # Get recipient from command line or use default
    recipient = sys.argv[1] if len(sys.argv) > 1 else None
    subject = sys.argv[2] if len(sys.argv) > 2 else "Test Email from WorkPilot AI"
    
    # Get all Gmail integrations
    rows = await firestore_service.query_documents('user_integrations', filters=[('platform', '==', 'gmail')])
    
    if not rows:
        print('❌ No Gmail integrations found')
        return False
    
    # Find the integration with a valid token
    valid_integration = None
    
    for row in rows:
        token_expires = row.get('tokenExpiresAt')
        if token_expires:
            try:
                if isinstance(token_expires, str):
                    from dateutil import parser
                    expires_dt = parser.isoparse(token_expires)
                    if expires_dt.tzinfo is None:
                        expires_dt = expires_dt.replace(tzinfo=timezone.utc)
                else:
                    expires_dt = token_expires
                    if hasattr(expires_dt, 'timestamp'):
                        expires_dt = datetime.fromtimestamp(expires_dt.timestamp(), tz=timezone.utc)
                
                now = datetime.now(timezone.utc)
                
                # Token is valid if it hasn't expired yet
                if expires_dt > now:
                    valid_integration = row
                    time_left = (expires_dt - now).total_seconds() / 60
                    print(f'✅ Found integration with valid token (expires in {time_left:.1f} minutes)')
                    break
            except:
                continue
    
    if not valid_integration:
        print('❌ No integrations with valid tokens found')
        print('💡 Please reconnect Gmail in the frontend')
        return False
    
    uid = valid_integration.get('uid')
    account = valid_integration.get('accountLabel', 'Unknown')
    
    # If no recipient specified, send to self
    if not recipient:
        recipient = account
    
    print(f'\n📧 Sending test email')
    print(f'   From: {account} (User ID: {uid})')
    print(f'   To: {recipient}')
    print(f'   Subject: {subject}')
    
    body = f"""Hello!

This is a test email sent from WorkPilot AI.

Technical Details:
- Sent via: Gmail API OAuth2
- From: {account}
- To: {recipient}
- Time: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}
- Integration: Gmail
- Token Status: Valid

✅ If you received this, your email integration is working correctly!

Best regards,
WorkPilot AI System
"""
    
    print('\n📤 Sending...')
    
    try:
        result = await integration_service.send_gmail_message(
            uid=uid,
            to=recipient,
            subject=subject,
            body=body
        )
        
        print('\n' + '='*70)
        print('✅ EMAIL SENT SUCCESSFULLY!')
        print('='*70)
        print(f'   Message ID: {result.get("id")}')
        print(f'   Thread ID: {result.get("threadId")}')
        print(f'   From: {account}')
        print(f'   To: {recipient}')
        print(f'   Subject: {subject}')
        print('='*70)
        print(f'\n💡 Check the inbox of {recipient} to confirm delivery.')
        print(f'   The email should also appear in {account}\'s Sent folder.\n')
        
        return True
        
    except Exception as e:
        print('\n' + '='*70)
        print('❌ EMAIL SEND FAILED')
        print('='*70)
        print(f'   Error: {type(e).__name__}')
        print(f'   Message: {e}')
        print('='*70)
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
