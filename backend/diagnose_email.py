"""Diagnose email sending capabilities in WorkPilot AI"""
import asyncio
from dotenv import load_dotenv

load_dotenv('.env')


async def main():
    """Run comprehensive email architecture diagnostics."""
    print('='*70)
    print('📧 WorkPilot AI - Email Architecture Diagnostics')
    print('='*70)
    print()
    
    # Check 1: Environment Configuration
    print('1️⃣  Checking Environment Configuration...')
    print('-'*70)
    import os
    
    smtp_host = os.getenv('SMTP_HOST')
    smtp_port = os.getenv('SMTP_PORT')
    smtp_user = os.getenv('SMTP_USER')
    smtp_password = os.getenv('SMTP_PASSWORD')
    google_client_id = os.getenv('GOOGLE_CLIENT_ID')
    google_client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
    
    print(f'   SMTP_HOST: {smtp_host or "❌ Not set"}')
    print(f'   SMTP_PORT: {smtp_port or "❌ Not set"}')
    print(f'   SMTP_USER: {smtp_user or "❌ Not set"}')
    print(f'   SMTP_PASSWORD: {"✅ Set" if smtp_password else "❌ Not set"}')
    print(f'   GOOGLE_CLIENT_ID: {google_client_id[:20] + "..." if google_client_id else "❌ Not set"}')
    print(f'   GOOGLE_CLIENT_SECRET: {"✅ Set" if google_client_secret else "❌ Not set"}')
    
    # Check 2: Gmail API Integration
    print('\n2️⃣  Checking Gmail API Integration...')
    print('-'*70)
    
    try:
        from firebase.admin_config import initialize_firebase
        initialize_firebase()
        from firebase.firestore import firestore_service
        
        rows = await firestore_service.query_documents('user_integrations', filters=[('platform', '==', 'gmail')])
        
        if not rows:
            print('   ⚠️  No Gmail integrations found')
            print('   📝 Note: Users need to connect Gmail via OAuth in the frontend')
        else:
            print(f'   ✅ Found {len(rows)} Gmail integration(s):')
            for idx, row in enumerate(rows, 1):
                uid = row.get('uid', 'Unknown')
                account = row.get('accountLabel', 'Unknown')
                status = row.get('status', 'Unknown')
                scopes = row.get('scopes', [])
                created = row.get('connectedAt', 'Unknown')
                
                status_icon = '✅' if status == 'connected' else '⚠️'
                print(f'      {status_icon} Integration #{idx}:')
                print(f'         User ID: {uid}')
                print(f'         Account: {account}')
                print(f'         Status: {status}')
                print(f'         Scopes: {", ".join(scopes) if scopes else "None"}')
                print(f'         Connected: {created}')
                
                # Check if required scopes are present
                required_scopes = ['https://www.googleapis.com/auth/gmail.send']
                has_send_scope = any('gmail.send' in scope for scope in scopes)
                if has_send_scope:
                    print(f'         ✅ Has gmail.send scope')
                else:
                    print(f'         ❌ Missing gmail.send scope')
    
    except Exception as e:
        print(f'   ❌ Error: {type(e).__name__}: {e}')
    
    # Check 3: Email Sending Methods
    print('\n3️⃣  Available Email Sending Methods:')
    print('-'*70)
    print('   Method 1: Gmail API Integration (RECOMMENDED)')
    print('      - Uses OAuth2 authentication')
    print('      - Sends emails through user\'s Gmail account')
    print('      - No SMTP credentials needed')
    print('      - Requires: Google OAuth client credentials')
    print('      - Status: ✅ Implemented in integration_service.py')
    print()
    print('   Method 2: Direct SMTP (NOT IMPLEMENTED)')
    print('      - Would use SMTP credentials')
    print('      - Would send from a single system email account')
    print('      - Requires: SMTP server credentials')
    print('      - Status: ❌ Not implemented (SMTP config present but unused)')
    
    # Check 4: API Endpoints
    print('\n4️⃣  Email API Endpoints:')
    print('-'*70)
    print('   POST /api/v1/emails/send')
    print('      - Sends email via Gmail API')
    print('      - Requires: User with connected Gmail integration')
    print('      - Body: { "to": "email@example.com", "subject": "...", "body": "..." }')
    print()
    print('   POST /api/v1/emails/draft')
    print('      - Validates email draft (doesn\'t send)')
    print()
    print('   GET /api/v1/emails')
    print('      - Lists user\'s Gmail messages')
    
    # Check 5: Architecture Summary
    print('\n5️⃣  Architecture Summary:')
    print('-'*70)
    print('   📧 Email sending is done through Gmail API, NOT SMTP')
    print('   🔐 Each user connects their own Gmail account via OAuth')
    print('   📝 Emails are sent from the user\'s Gmail account')
    print('   ⚙️  SMTP config in .env is unused (legacy or future feature)')
    
    # Check 6: Recommendations
    print('\n6️⃣  Recommendations:')
    print('-'*70)
    
    if not rows:
        print('   📌 To send emails:')
        print('      1. Start the frontend: cd Frontend && npm run dev')
        print('      2. Log in to WorkPilot AI')
        print('      3. Connect Gmail integration in the dashboard')
        print('      4. Run: python test_send_email.py')
    else:
        connected_count = sum(1 for row in rows if row.get('status') == 'connected')
        if connected_count > 0:
            print('   ✅ Gmail integration is ready!')
            print('   📌 To send a test email:')
            print('      Run: python test_send_email.py')
        else:
            print('   ⚠️  Gmail integrations found but not connected')
            print('   📌 Reconnect Gmail in the frontend dashboard')
    
    print('\n' + '='*70)
    print('Diagnostic complete!')
    print('='*70)


if __name__ == '__main__':
    asyncio.run(main())
