"""Send a real test email to demonstrate it works"""
import asyncio
from datetime import datetime
from dotenv import load_dotenv

load_dotenv('.env')


async def main():
    """Send a real test email."""
    from firebase.admin_config import initialize_firebase
    initialize_firebase()
    from firebase.firestore import firestore_service
    from services.integration_service import integration_service
    from repositories.email_repository import email_repository
    from models.email import Email
    import uuid
    
    print('='*70)
    print('📧 Sending REAL Test Email')
    print('='*70)
    
    # Get integration with valid token
    rows = await firestore_service.query_documents('user_integrations', filters=[('platform', '==', 'gmail')])
    
    valid_integration = None
    for row in rows:
        token_expires = row.get('tokenExpiresAt')
        if token_expires:
            from dateutil import parser
            from datetime import timezone
            
            try:
                if isinstance(token_expires, str):
                    expires_dt = parser.isoparse(token_expires)
                    if expires_dt.tzinfo is None:
                        expires_dt = expires_dt.replace(tzinfo=timezone.utc)
                else:
                    expires_dt = token_expires
                    if hasattr(expires_dt, 'timestamp'):
                        expires_dt = datetime.fromtimestamp(expires_dt.timestamp(), tz=timezone.utc)
                
                now = datetime.now(timezone.utc)
                
                if expires_dt > now:
                    valid_integration = row
                    break
            except:
                continue
    
    if not valid_integration:
        print('❌ No valid Gmail integration found')
        return
    
    uid = valid_integration.get('uid')
    account = valid_integration.get('accountLabel')
    
    print(f'✅ Using Gmail account: {account}')
    print()
    
    # Test email details
    recipient = account  # Send to self for testing
    subject = "🧪 WorkPilot AI Test Email"
    body = f"""Hello!

This is a REAL test email sent from WorkPilot AI at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}.

✅ This email was sent via Gmail API (OAuth2)
✅ It will appear in your Gmail inbox
✅ It will appear in your Gmail "Sent" folder
✅ It is stored in WorkPilot database

Technical Details:
- From: {account}
- Sent via: WorkPilot AI Backend
- Method: Gmail API v1
- Authentication: OAuth2

If you received this email, everything is working perfectly!

Best regards,
WorkPilot AI System
"""

    print('📤 Sending email...')
    print(f'   From: {account}')
    print(f'   To: {recipient}')
    print(f'   Subject: {subject}')
    print()
    
    try:
        # Send via Gmail API
        result = await integration_service.send_gmail_message(
            uid=uid,
            to=recipient,
            subject=subject,
            body=body
        )
        
        print('✅ EMAIL SENT SUCCESSFULLY!')
        print('='*70)
        print(f'   Gmail Message ID: {result.get("id")}')
        print(f'   Gmail Thread ID: {result.get("threadId")}')
        print(f'   From: {result.get("sender")}')
        print(f'   To: {recipient}')
        print('='*70)
        
        # Store in database
        print('\n💾 Storing in database...')
        email_record = Email(
            id=result.get("id", str(uuid.uuid4())),
            uid=uid,
            recipient=recipient,
            subject=subject,
            body=body,
            sender=result.get("sender", account),
            thread_id=result.get("threadId"),
            message_id=result.get("id"),
            email_type="sent",
            status="sent",
            platform="gmail",
            sent_via="test_script",
            ai_generated=False,
            tone="professional",
            prompt="Real test email"
        )
        
        await email_repository.create(email_record)
        print('✅ Stored in WorkPilot database!')
        
        print('\n' + '='*70)
        print('✅ COMPLETE SUCCESS!')
        print('='*70)
        print(f'\nNow check:')
        print(f'1. 📥 Gmail Inbox: {recipient}')
        print(f'   (You should see the email with subject "{subject}")')
        print(f'2. 📤 Gmail Sent folder')
        print(f'   (Email should appear there too)')
        print(f'3. 💾 WorkPilot database')
        print(f'   (Email stored with ID: {result.get("id")})')
        print()
        print('🎉 Everything working perfectly!')
        print('='*70)
        
    except Exception as e:
        print('❌ ERROR:', e)
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    asyncio.run(main())
