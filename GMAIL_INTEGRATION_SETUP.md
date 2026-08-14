# Gmail Integration Setup Guide

This guide walks you through setting up Gmail integration with OAuth 2.0.

## Overview

The integration flow allows users to:
1. Click the toggle on any integration (Gmail, Calendar, etc.)
2. Get redirected to Google's OAuth consent screen
3. **Choose which Google account to use** (can be different from WorkPilot login email)
4. Grant permissions for Gmail access
5. Get redirected back to WorkPilot with connected integration

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Name it: `WorkPilot AI Integration`
4. Click **Create**

## Step 2: Enable Gmail API

1. In your project, go to **APIs & Services** → **Library**
2. Search for **Gmail API**
3. Click **Gmail API** → **Enable**
4. Also enable **Google Calendar API** for calendar integration

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (unless you have Google Workspace)
3. Click **Create**
4. Fill in:
   - App name: `WorkPilot AI`
   - User support email: Your email
   - Developer contact: Your email
5. Click **Save and Continue**
6. On **Scopes** page, click **Add or Remove Scopes**
7. Add these scopes:
   - `https://www.googleapis.com/auth/gmail.readonly` (Read Gmail)
   - `https://www.googleapis.com/auth/gmail.send` (Send emails)
   - `https://www.googleapis.com/auth/calendar` (Calendar access)
   - `https://www.googleapis.com/auth/userinfo.email` (User email)
   - `https://www.googleapis.com/auth/userinfo.profile` (User profile)
8. Click **Save and Continue**
9. Add test users (add your email addresses for testing)
10. Click **Save and Continue**

## Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: `WorkPilot AI Web Client`
5. Add **Authorized redirect URIs**:
   ```
   http://localhost:8000/api/v1/integrations/gmail/callback
   http://localhost:8000/api/v1/integrations/google_calendar/callback
   ```
   (For production, add your production domain)
6. Click **Create**
7. **Copy the Client ID and Client Secret** that appear

## Step 5: Configure Backend Environment

Open `backend/.env` and add:

```env
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

## Step 6: Restart Backend

```bash
cd backend
# Stop the current backend (Ctrl+C)
python main.py
```

The backend will now accept Gmail OAuth requests!

## Step 7: Test the Integration

1. **Sign in to WorkPilot** (create account if you haven't)
2. Go to **Dashboard** → **Integrations**
3. Toggle **Gmail** integration
4. You'll be redirected to Google
5. **Choose which Google account to connect** (can be any Gmail account, not just your WorkPilot login)
6. Grant permissions
7. You'll be redirected back with "Connected Gmail" message

## Integration Flow Details

### User Can Choose Different Email

The OAuth flow allows users to:
- Use their **WorkPilot login email** (e.g., `user@company.com`)
- Connect a **different Gmail account** (e.g., `personal@gmail.com`)

This is handled automatically by Google's OAuth screen. When toggling Gmail:
1. User clicks toggle
2. Redirected to `https://accounts.google.com/o/oauth2/v2/auth`
3. Google shows all available accounts
4. User picks which account to connect
5. Backend stores that account's tokens

### Security

- Access tokens are **encrypted** before storage (AES-256)
- Refresh tokens are **encrypted** separately
- Tokens are stored per user in Firestore
- Token revocation is handled on disconnect

### Supported Integrations

All integrations follow the same OAuth pattern:

| Platform | OAuth Provider | Scopes |
|----------|---------------|--------|
| Gmail | Google | gmail.readonly, gmail.send |
| Google Calendar | Google | calendar |
| GitHub | GitHub | repo, user |
| Slack | Slack | channels:read, chat:write |
| Microsoft Teams | Microsoft | Mail.Read, Calendars.ReadWrite |
| Zoom | Zoom | meeting:read, meeting:write |
| Notion | Notion | Full workspace access |
| Jira | Atlassian | read:jira-work, write:jira-work |

## Troubleshooting

### 403 Forbidden Error
- **Cause**: User not logged in or OAuth credentials missing
- **Fix**: Ensure user is signed in and credentials are in `.env`

### "OAuth is not configured" Error
- **Cause**: `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` missing
- **Fix**: Add credentials to `backend/.env`

### "Invalid redirect URI" Error
- **Cause**: Redirect URI not in Google Console
- **Fix**: Add `http://localhost:8000/api/v1/integrations/gmail/callback` to authorized URIs

### User sees "This app isn't verified"
- **Expected**: Your app is in testing mode
- **Solution**: Click "Advanced" → "Go to WorkPilot AI (unsafe)" for testing
- **Production**: Submit app for Google verification

## Production Deployment

Before going live:

1. Add production redirect URIs:
   ```
   https://api.yourapp.com/api/v1/integrations/gmail/callback
   https://api.yourapp.com/api/v1/integrations/google_calendar/callback
   ```

2. Update `.env`:
   ```env
   BACKEND_PUBLIC_URL=https://api.yourapp.com
   FRONTEND_OAUTH_REDIRECT=https://app.yourapp.com/dashboard
   ```

3. Submit OAuth app for verification (takes 1-2 weeks)

4. Enable Redis for OAuth state storage (replace in-memory dict)

## Next Steps

- Add email sending feature using Gmail API
- Add calendar event creation
- Set up token refresh cron job
- Add webhook listeners for real-time updates
