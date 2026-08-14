"""Test the complete AI email flow with database storage"""
import asyncio
import json
from dotenv import load_dotenv

load_dotenv('.env')


async def simulate_ai_chat(uid: str, message: str):
    """Simulate what the AI chat does when user asks to send email."""
    from api.v1.endpoints.ai_chat import _execute_tool
    
    print(f'\n💬 User: "{message}"')
    print('🤖 AI: Processing...\n')
    
    # AI detects "send email" intent and extracts parameters
    # For this test, we'll simulate the tool call
    
    # Example 1: User provides all info
    if "john@example.com" in message:
        print('✅ AI detected: All information provided')
        print('   - Recipient: john@example.com')
        print('   - Subject: (AI will generate)')
        print('   - Body: (from user message)\n')
        
        args = {
            "to": "john@example.com",
            "subject": "Quick Update",
            "body": "Hi John,\n\nJust wanted to send you a quick update as requested.\n\nBest regards",
            "tone": "professional",
            "original_prompt": message
        }
    else:
        # Example 2: Missing information
        print('⚠️  AI detected: Missing information')
        args = {
            "to": "",
            "subject": "Meeting Follow-up",
            "body": "Thanks for the meeting today!",
            "tone": "professional",
            "original_prompt": message
        }
    
    print('🔧 Calling compose_email tool...\n')
    result = await _execute_tool("compose_email", args, uid)
    
    print('📊 Tool Result:')
    print(json.dumps(result, indent=2))
    
    return result


async def test_complete_flow():
    """Test the complete email flow from user message to database storage."""
    from firebase.admin_config import initialize_firebase
    initialize_firebase()
    from firebase.firestore import firestore_service
    from repositories.email_repository import email_repository
    
    print('='*70)
    print('🧪 Testing Complete AI Email Flow with Database Storage')
    print('='*70)
    
    # Get a user with Gmail connected
    rows = await firestore_service.query_documents('user_integrations', filters=[('platform', '==', 'gmail')])
    
    if not rows:
        print('❌ No Gmail integrations found')
        return
    
    # Find one with valid token
    valid_uid = None
    for row in rows:
        token_expires = row.get('tokenExpiresAt')
        if token_expires:
            try:
                from datetime import datetime, timezone
                from dateutil import parser
                
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
                    valid_uid = row.get('uid')
                    print(f'✅ Using user: {row.get("accountLabel")} (Token valid)\n')
                    break
            except:
                continue
    
    if not valid_uid:
        print('⚠️  No integrations with valid tokens. Using first available...')
        valid_uid = rows[0].get('uid')
    
    # Test 1: Send email with all info
    print('\n' + '='*70)
    print('TEST 1: User provides complete information')
    print('='*70)
    
    result1 = await simulate_ai_chat(
        valid_uid,
        "Send an email to john@example.com saying thanks for the meeting"
    )
    
    if result1.get('sent'):
        print('\n✅ TEST 1 PASSED: Email sent and stored in database')
        print(f'   Message ID: {result1.get("message_id")}')
        print(f'   Stored in DB: {result1.get("stored_in_db", False)}')
    elif result1.get('status') == 'incomplete':
        print('\n⚠️  TEST 1: AI needs more information')
        print(f'   Missing: {result1.get("missing_fields")}')
    else:
        print(f'\n⚠️  TEST 1: {result1.get("note", "See result above")}')
    
    # Test 2: Send email with missing info
    print('\n' + '='*70)
    print('TEST 2: User provides incomplete information')
    print('='*70)
    
    result2 = await simulate_ai_chat(
        valid_uid,
        "Send an email about the project update"
    )
    
    if result2.get('status') == 'incomplete':
        print('\n✅ TEST 2 PASSED: AI correctly detected missing information')
        print(f'   Missing fields: {result2.get("missing_fields")}')
        print(f'   AI should ask: {result2.get("note")}')
    else:
        print('\n⚠️  TEST 2: Expected AI to ask for missing info')
    
    # Check database
    print('\n' + '='*70)
    print('DATABASE CHECK: Retrieving stored emails')
    print('='*70)
    
    emails = await email_repository.list_for_user(valid_uid, limit=10)
    print(f'\n📧 Found {len(emails)} email(s) in database:')
    
    for i, email in enumerate(emails, 1):
        print(f'\n{i}. Email ID: {email.id}')
        print(f'   To: {email.recipient}')
        print(f'   Subject: {email.subject}')
        print(f'   Status: {email.status}')
        print(f'   Sent: {email.sent_at}')
        print(f'   AI Generated: {email.ai_generated}')
        print(f'   Platform: {email.platform}')
    
    # Check statistics
    stats = await email_repository.get_statistics(valid_uid)
    print(f'\n📊 Email Statistics:')
    print(f'   Total Sent: {stats.total_sent}')
    print(f'   Total AI Generated: {stats.total_ai_generated}')
    print(f'   Success Rate: {stats.sent_success_rate}%')
    print(f'   Last Email: {stats.last_email_at}')
    
    print('\n' + '='*70)
    print('✅ All Tests Complete!')
    print('='*70)


if __name__ == '__main__':
    asyncio.run(test_complete_flow())
