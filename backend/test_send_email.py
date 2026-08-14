"""Test sending email via Gmail integration"""
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
        print('Please connect Gmail first by visiting the frontend and authorizing Gmail access.')
        return
    
    row = rows[0]
    uid = row.get('uid')
    account = row.get('accountLabel', 'Unknown')
    status = row.get('status', 'Unknown')
    
    print(f'📧 Testing email send for user: {uid}')
    print(f'   Account: {account}')
    print(f'   Status: {status}')
    
    if status != 'connected':
        print(f'❌ Gmail integration status is "{status}", not "connected"')
        return
    
    # Get email details
    print('\n' + '='*60)
    print('📝 Enter email details:')
    print('='*60)
    
    # Use default values or get input
    recipient = input('Recipient email (or press Enter for self-test): ').strip()
    if not recipient:
        # Send to self (the connected Gmail account)
        recipient = account
        print(f'   Using self-test mode: sending to {recipient}')
    
    subject = input('Subject (default: "Test from WorkPilot AI"): ').strip()
    if not subject:
        subject = "Test from WorkPilot AI"
    
    body = input('Body (default: test message): ').strip()
    if not body:
        body = "This is a test email sent from WorkPilot AI backend.\n\nIf you received this, the email integration is working correctly!"
    
    print('\n' + '='*60)
    print(f'📤 Sending email...')
    print(f'   To: {recipient}')
    print(f'   Subject: {subject}')
    print('='*60)
    
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
