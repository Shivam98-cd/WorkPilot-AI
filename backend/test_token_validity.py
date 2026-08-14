"""Test if the refreshed token is actually valid"""
import asyncio
import httpx
from dotenv import load_dotenv

load_dotenv('.env')


async def main():
    """Test token validity by making a simple Gmail API call."""
    from firebase.admin_config import initialize_firebase
    initialize_firebase()
    from firebase.firestore import firestore_service
    from repositories.integration_repository import integration_repository
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
    
    print(f'📧 Testing token for: {account}')
    
    # Get the integration record (this will have all encrypted tokens)
    record = await integration_repository.get(uid, 'gmail')
    
    print(f'\n1️⃣  Getting valid token (will refresh if expired)...')
    token = await integration_service._get_valid_google_token(uid, 'gmail', record)
    
    if not token:
        print('❌ No token available')
        return
    
    print(f'✅ Got token: {token[:30]}...')
    
    # Test the token with a simple Gmail API call
    print(f'\n2️⃣  Testing token with Gmail API (profile fetch)...')
    
    async with httpx.AsyncClient() as client:
        try:
            # Try to get the user's profile (lightweight API call)
            response = await client.get(
                "https://gmail.googleapis.com/gmail/v1/users/me/profile",
                headers={"Authorization": f"Bearer {token}"}
            )
            response.raise_for_status()
            profile = response.json()
            
            print(f'✅ Token is VALID!')
            print(f'   Email: {profile.get("emailAddress")}')
            print(f'   Messages Total: {profile.get("messagesTotal")}')
            print(f'   Threads Total: {profile.get("threadsTotal")}')
            
            # Now try sending an email
            print(f'\n3️⃣  Attempting to send test email...')
            
            from email.message import EmailMessage
            from base64 import urlsafe_b64encode
            
            message = EmailMessage()
            message["To"] = account  # Send to self
            message["Subject"] = "Test Email from WorkPilot AI - Direct API Test"
            message.set_content("""Hello!

This is a test email sent directly via Gmail API after confirming token validity.

✅ If you received this, your Gmail integration is working perfectly!

Technical Details:
- Token Status: Valid (refreshed if needed)
- API: Gmail API v1
- Method: Direct API call

Best regards,
WorkPilot AI System
""")
            
            send_response = await client.post(
                "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
                json={"raw": urlsafe_b64encode(message.as_bytes()).decode("ascii")},
                headers={"Authorization": f"Bearer {token}"}
            )
            send_response.raise_for_status()
            result = send_response.json()
            
            print(f'✅ Email sent successfully!')
            print(f'   Message ID: {result.get("id")}')
            print(f'   Thread ID: {result.get("threadId")}')
            print(f'\n💡 Check the inbox of {account} to confirm delivery.')
            
        except httpx.HTTPStatusError as e:
            print(f'❌ Token test failed: {e.response.status_code} {e.response.reason_phrase}')
            print(f'   Response: {e.response.text}')
            
            if e.response.status_code == 401:
                print(f'\n💡 The token appears to be invalid or the refresh token is expired.')
                print(f'   Solution: Reconnect Gmail integration in the frontend.')
        except Exception as e:
            print(f'❌ ERROR: {type(e).__name__}: {e}')
            import traceback
            traceback.print_exc()


if __name__ == '__main__':
    asyncio.run(main())
