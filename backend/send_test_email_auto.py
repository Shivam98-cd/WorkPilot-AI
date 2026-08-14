"""Send a test email automatically (non-interactive)"""
import asyncio
from dotenv import load_dotenv

load_dotenv('.env')


async def main():
    """Send a test email through the Gmail integration."""
    from firebase.admin_config import initialize_firebase
    initialize_firebase()
    from firebase.firestore import firestore_service
    from services.integration_service import integration_service

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
    
    print(f'📧 Sending test email from: {account}')
    print(f'   User ID: {uid}')
    print(f'   Status: {status}')
    
    if status != 'connected':
        print(f'❌ Gmail integration status is "{status}", not "connected"')
        return
    
    # Send email to self (the connected Gmail account)
    recipient = account
    subject = "Test Email from WorkPilot AI"
    body = """Hello!

This is an automated test email sent from WorkPilot AI backend.

✅ If you received this, your email integration is working correctly!

Technical Details:
- Sent via: Gmail API OAuth2
- Integration: Gmail
- Method: integration_service.send_gmail_message()

Best regards,
WorkPilot AI System
"""
    
    print(f'\n📤 Sending email...')
    print(f'   To: {recipient}')
    print(f'   Subject: {subject}')
    
    try:
        result = await integration_service.send_gmail_message(
            uid=uid,
            to=recipient,
            subject=subject,
            body=body
        )
        
        print('\n✅ Email sent successfully!')
        print(f'   Message ID: {result.get("id")}')
        print(f'   Thread ID: {result.get("threadId")}')
        print(f'\n💡 Check the inbox of {recipient} to confirm delivery.')
        
    except Exception as e:
        print(f'\n❌ ERROR: {type(e).__name__}: {e}')
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    asyncio.run(main())
