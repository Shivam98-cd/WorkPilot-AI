# WorkPilot AI - Email Sending Guide

## Current Status: Gmail Token Expired ⚠️

### Issue
The Gmail integration access token and refresh token have expired. This prevents sending emails through the Gmail API.

### Root Cause
OAuth2 tokens can expire for several reasons:
1. **Access Token**: Expires after 1 hour (handled automatically by token refresh)
2. **Refresh Token**: Can expire if:
   - Not used for 6 months
   - User revokes access in their Google Account
   - OAuth app is in testing mode with limited token lifetime
   - Google security policies change

### Solution: Reconnect Gmail Integration

#### Option 1: Reconnect via Frontend (Recommended)
1. Start the backend:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. Start the frontend:
   ```bash
   cd Frontend
   npm run dev
   ```

3. Open browser to `http://localhost:5173`

4. Log in to WorkPilot AI

5. Navigate to **Integrations** or **Dashboard**

6. Find Gmail integration and click **Reconnect** or **Connect**

7. Authorize Gmail access through Google OAuth2

8. Once connected, try sending an email again

#### Option 2: Test Email Sending via API
After reconnecting, you can test email sending via:

**Direct API Call:**
```bash
curl -X POST http://localhost:8000/api/v1/emails/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "to": "recipient@example.com",
    "subject": "Test Email",
    "body": "This is a test email from WorkPilot AI"
  }'
```

**Python Test Script:**
```bash
cd backend
python test_token_validity.py
```

## Email Architecture Overview

### How Email Sending Works

```
User Action → FastAPI Endpoint → Integration Service → Gmail API → Email Sent
```

#### Architecture Components

1. **Frontend**
   - User connects Gmail via OAuth2
   - Sends email via `/api/v1/emails/send` endpoint

2. **Backend API** (`backend/api/v1/endpoints/emails.py`)
   - `POST /api/v1/emails/send`: Send email endpoint
   - `POST /api/v1/emails/draft`: Validate draft email
   - `GET /api/v1/emails`: List user's emails

3. **Integration Service** (`backend/services/integration_service.py`)
   - `send_gmail_message()`: Core email sending function
   - `_get_valid_google_token()`: Token refresh logic
   - Uses Gmail API v1

4. **Token Management**
   - Access tokens stored encrypted in Firestore
   - Automatic refresh when tokens expire
   - Requires valid refresh token

### Why Gmail API Instead of SMTP?

WorkPilot AI uses Gmail API OAuth2 instead of SMTP because:

✅ **Security**: No password storage, uses OAuth2 tokens
✅ **User Context**: Emails sent from user's Gmail account
✅ **Granular Permissions**: Users grant specific scopes
✅ **Better Deliverability**: Emails sent through Gmail's infrastructure
✅ **Audit Trail**: All sent emails appear in user's Sent folder

### SMTP Configuration Note

The `.env` file contains SMTP settings (`SMTP_HOST`, `SMTP_USER`, etc.), but these are **NOT CURRENTLY USED**. They may be legacy or planned for future features like:
- System notification emails
- Email verification emails
- Password reset emails

## Diagnostic Tools

### 1. Email Architecture Diagnostic
```bash
cd backend
python diagnose_email.py
```

**What it checks:**
- Environment configuration
- Gmail API integration status
- Connected accounts and their scopes
- Token expiration status
- Available email endpoints

### 2. Token Validity Test
```bash
cd backend
python test_token_validity.py
```

**What it does:**
- Gets current access token
- Refreshes token if expired
- Tests token with Gmail API
- Attempts to send test email

### 3. Send Test Email
```bash
cd backend
python test_send_email.py
```

**Interactive script that:**
- Prompts for recipient email
- Prompts for subject and body
- Sends email via Gmail API
- Displays result

### 4. Auto Test Email (Non-Interactive)
```bash
cd backend
python send_test_email_auto.py
```

**Automated script that:**
- Uses first connected Gmail account
- Sends test email to self
- Displays result

## Troubleshooting

### Error: 401 Unauthorized
**Symptom:** `HTTPStatusError: Client error '401 Unauthorized'`

**Cause:** Invalid or expired OAuth2 token

**Solution:**
1. Reconnect Gmail integration in frontend
2. Check Google Account security settings
3. Verify OAuth app credentials in `.env`

### Error: Gmail is not connected
**Symptom:** `NotFoundException: Gmail is not connected`

**Cause:** No Gmail integration found for user

**Solution:**
1. Connect Gmail integration in frontend
2. Verify user is logged in
3. Check Firestore `user_integrations` collection

### Error: Missing gmail.send scope
**Symptom:** Email sending fails even with valid token

**Cause:** Gmail integration doesn't have send permission

**Solution:**
1. When reconnecting, ensure Gmail scope includes:
   ```
   https://www.googleapis.com/auth/gmail.send
   ```
2. Check OAuth consent screen configuration
3. Verify redirect URIs are correct

### Token Refresh Fails Silently
**Symptom:** Token refresh doesn't throw error but token is still invalid

**Cause:** Refresh token is expired or revoked

**Solution:**
1. User must reconnect Gmail (cannot be fixed programmatically)
2. Consider implementing token health monitoring
3. Alert users when tokens are near expiration

## Security Best Practices

### Token Storage
- ✅ Access tokens encrypted using Fernet encryption
- ✅ Refresh tokens encrypted in Firestore
- ✅ Tokens never exposed in logs or API responses
- ✅ Token decryption only in memory, never persisted

### OAuth Scopes
Current Gmail scopes requested:
- `https://www.googleapis.com/auth/gmail.readonly` - Read emails
- `https://www.googleapis.com/auth/gmail.send` - Send emails
- `https://www.googleapis.com/auth/userinfo.email` - User email address

**Principle of Least Privilege:** Only request scopes needed for functionality

### Environment Variables
```bash
# Required for Gmail API
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
INTEGRATION_TOKEN_ENCRYPTION_KEY=your_encryption_key

# OAuth redirect URLs
BACKEND_PUBLIC_URL=http://localhost:8000
FRONTEND_OAUTH_REDIRECT=http://localhost:5173/dashboard
```

## API Usage Examples

### Send Email (cURL)
```bash
# Get JWT token first by logging in
TOKEN="your_jwt_token_here"

# Send email
curl -X POST http://localhost:8000/api/v1/emails/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "to": "recipient@example.com",
    "subject": "Hello from WorkPilot AI",
    "body": "This is an automated email sent via Gmail API"
  }'
```

### Send Email (Python)
```python
import httpx
import asyncio

async def send_email():
    access_token = "your_jwt_token_here"
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/v1/emails/send",
            json={
                "to": "recipient@example.com",
                "subject": "Hello from WorkPilot AI",
                "body": "This is an automated email"
            },
            headers={"Authorization": f"Bearer {access_token}"}
        )
        print(response.json())

asyncio.run(send_email())
```

### Send Email (JavaScript/Fetch)
```javascript
async function sendEmail() {
  const response = await fetch('http://localhost:8000/api/v1/emails/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      to: 'recipient@example.com',
      subject: 'Hello from WorkPilot AI',
      body: 'This is an automated email'
    })
  });
  
  const result = await response.json();
  console.log(result);
}
```

## Future Enhancements

### Planned Features
1. **SMTP Fallback**: Use SMTP for system emails
2. **Email Templates**: HTML email templates
3. **Attachments**: Support file attachments
4. **Bulk Email**: Send to multiple recipients
5. **Email Scheduling**: Schedule emails for later
6. **Read Receipts**: Track email opens
7. **Email Analytics**: Track send rates, failures
8. **Multi-Provider**: Support Outlook, SendGrid, etc.

### Token Management Improvements
1. **Proactive Refresh**: Refresh tokens before expiration
2. **Health Monitoring**: Check token validity periodically
3. **User Notifications**: Alert users when reconnection needed
4. **Auto-Reconnect**: Attempt auto-reconnect on token failure
5. **Token Rotation**: Implement secure token rotation

## References

- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Gmail API Send Email](https://developers.google.com/gmail/api/guides/sending)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google OAuth2 Scopes](https://developers.google.com/identity/protocols/oauth2/scopes)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

## Support

If you continue to experience issues:

1. Check diagnostic output: `python diagnose_email.py`
2. Verify Google Cloud Console OAuth configuration
3. Check Firestore for integration records
4. Review backend logs for detailed error messages
5. Ensure Gmail API is enabled in Google Cloud Console

---

**Last Updated:** 2026-08-13
**WorkPilot AI Version:** 1.0.0
