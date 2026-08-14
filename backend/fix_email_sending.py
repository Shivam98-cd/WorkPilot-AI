"""Interactive guide to fix email sending"""
import asyncio
from dotenv import load_dotenv

load_dotenv('.env')


def print_header(title):
    """Print a formatted header"""
    print('\n' + '='*70)
    print(f' {title}')
    print('='*70)


def print_section(number, title):
    """Print a section header"""
    print(f'\n{number} {title}')
    print('-'*70)


async def main():
    """Interactive guide to fix email sending."""
    print_header('📧 WorkPilot AI - Email Sending Fix Guide')
    
    print('\n🔍 Issue: Cannot send emails due to expired OAuth2 tokens')
    print('✅ Solution: Reconnect Gmail integration (takes < 1 minute)')
    
    # Step 1: Check current status
    print_section('1️⃣', 'Checking Current Gmail Integration Status...')
    
    try:
        from firebase.admin_config import initialize_firebase
        initialize_firebase()
        from firebase.firestore import firestore_service
        from datetime import datetime, timezone
        
        rows = await firestore_service.query_documents('user_integrations', filters=[('platform', '==', 'gmail')])
        
        if not rows:
            print('❌ No Gmail integrations found')
            print('   You need to connect Gmail for the first time.')
        else:
            print(f'✅ Found {len(rows)} Gmail integration(s):')
            for idx, row in enumerate(rows, 1):
                account = row.get('accountLabel', 'Unknown')
                status = row.get('status', 'Unknown')
                token_expires = row.get('tokenExpiresAt')
                
                status_icon = '✅' if status == 'connected' else '⚠️'
                print(f'\n   {status_icon} Integration #{idx}')
                print(f'      Account: {account}')
                print(f'      Status: {status}')
                
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
                        if expires_dt < now:
                            time_ago = (now - expires_dt).total_seconds() / 60
                            print(f'      ⚠️  Token: EXPIRED ({time_ago:.0f} minutes ago)')
                        else:
                            time_left = (expires_dt - now).total_seconds() / 60
                            print(f'      ✅ Token: Valid ({time_left:.0f} minutes left)')
                    except:
                        print(f'      ⚠️  Token: Status unknown')
    
    except Exception as e:
        print(f'❌ Error checking status: {e}')
    
    # Step 2: Instructions
    print_section('2️⃣', 'Reconnection Instructions')
    
    print('\n📝 Follow these steps to reconnect Gmail:\n')
    
    print('   A. Start the Backend Server:')
    print('      cd backend')
    print('      uvicorn main:app --reload')
    print('      (Keep this terminal open)')
    
    print('\n   B. Start the Frontend (new terminal):')
    print('      cd Frontend')
    print('      npm run dev')
    print('      (Keep this terminal open)')
    
    print('\n   C. Open Browser:')
    print('      Navigate to: http://localhost:5173')
    
    print('\n   D. Log In:')
    print('      Use your WorkPilot AI credentials')
    
    print('\n   E. Connect Gmail:')
    print('      1. Go to Dashboard or Integrations page')
    print('      2. Find "Gmail" integration card')
    print('      3. Click "Connect" or "Reconnect" button')
    print('      4. A Google OAuth popup will appear')
    print('      5. Select your Google account')
    print('      6. Click "Allow" to grant permissions')
    print('      7. Wait for redirect back to WorkPilot AI')
    
    print('\n   F. Verify Connection:')
    print('      You should see "Connected" status on Gmail card')
    
    # Step 3: Test
    print_section('3️⃣', 'After Reconnecting - Test Email Sending')
    
    print('\n✅ Once reconnected, test email sending:\n')
    
    print('   Option 1: Run validation test')
    print('      cd backend')
    print('      python test_token_validity.py')
    
    print('\n   Option 2: Send interactive test email')
    print('      cd backend')
    print('      python test_send_email.py')
    
    print('\n   Option 3: Send automatic test email')
    print('      cd backend')
    print('      python send_test_email_auto.py')
    
    print('\n   Option 4: Use API directly')
    print('      curl -X POST http://localhost:8000/api/v1/emails/send \\')
    print('        -H "Authorization: Bearer YOUR_JWT_TOKEN" \\')
    print('        -H "Content-Type: application/json" \\')
    print('        -d \'{"to":"test@example.com","subject":"Test","body":"Hello"}\'')
    
    # Step 4: Troubleshooting
    print_section('4️⃣', 'Troubleshooting')
    
    print('\n❓ If you encounter issues:\n')
    
    print('   Problem: OAuth popup doesn\'t appear')
    print('   → Check browser popup blocker')
    print('   → Try different browser')
    print('   → Check browser console for errors')
    
    print('\n   Problem: "Redirect URI mismatch" error')
    print('   → Verify Google Cloud Console OAuth settings')
    print('   → Check authorized redirect URIs include:')
    print('      http://localhost:8000/api/v1/integrations/gmail/callback')
    
    print('\n   Problem: Backend not running')
    print('   → Ensure backend terminal shows: "Application startup complete"')
    print('   → Check: http://localhost:8000/docs for API docs')
    
    print('\n   Problem: Frontend not running')
    print('   → Ensure frontend terminal shows: "Local: http://localhost:5173"')
    print('   → Run: npm install (if dependencies missing)')
    
    print('\n   Problem: Gmail API disabled')
    print('   → Go to Google Cloud Console')
    print('   → Enable Gmail API for your project')
    
    # Step 5: Resources
    print_section('5️⃣', 'Additional Resources')
    
    print('\n📚 Documentation created for you:\n')
    
    print('   • EMAIL_SENDING_GUIDE.md')
    print('     Comprehensive guide with architecture, troubleshooting, examples')
    
    print('\n   • EMAIL_DIAGNOSIS_SUMMARY.md')
    print('     Executive summary of findings and solutions')
    
    print('\n   • diagnose_email.py')
    print('     Run diagnostic checks on email system')
    
    print('\n   • test_token_validity.py')
    print('     Test OAuth token validity and refresh')
    
    print('\n   • test_send_email.py')
    print('     Interactive email sending test')
    
    # Conclusion
    print_header('✅ Ready to Fix!')
    
    print('\n💡 Quick Summary:')
    print('   1. Your email architecture is correct and secure')
    print('   2. The only issue is expired OAuth2 tokens')
    print('   3. Reconnecting Gmail will fix everything')
    print('   4. The fix takes less than 1 minute')
    
    print('\n🚀 Next Action:')
    print('   Start backend and frontend, then reconnect Gmail!')
    
    print('\n' + '='*70)
    print(' Questions? Check EMAIL_SENDING_GUIDE.md for detailed help')
    print('='*70 + '\n')


if __name__ == '__main__':
    asyncio.run(main())
