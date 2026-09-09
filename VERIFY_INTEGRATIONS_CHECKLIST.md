# Integration Verification Checklist

**Purpose:** Verify that your AI Cockpit integrations are ACTUALLY connected and working with real data

---

## 🎯 Quick Verification Steps

### Step 1: Check Integration Status in UI

1. **Open WorkPilot:**
   - Navigate to http://localhost:5173
   - Sign in with your Firebase account

2. **Go to Integrations Page:**
   - Click "Integrations" in the navigation
   - OR go directly to: http://localhost:5173/integrations

3. **Verify Connection Status:**
   ```
   Platform        | Status      | Last Sync        | Action Needed?
   ----------------|-------------|------------------|----------------
   Gmail           | ✅ Connected | 2 minutes ago    | ✅ Good
   Google Calendar | ✅ Connected | 5 minutes ago    | ✅ Good
   GitHub          | ❌ Not connected | Never         | ⚠️ Optional
   Slack           | ❌ Not connected | Never         | ⚠️ Optional
   ```

4. **Required for AI Cockpit:**
   - ✅ **Gmail** - MUST be connected for email features
   - ✅ **Google Calendar** - MUST be connected for calendar features
   - ⚠️ GitHub, Slack, etc. - Optional (nice to have)

---

### Step 2: Test via Browser Console

**Open Browser DevTools (F12) and run:**

```javascript
// 1. Check if you're authenticated
const token = await firebase.auth().currentUser?.getIdToken();
console.log('Auth Token:', token ? '✅ Valid' : '❌ Missing');

// 2. Test Gmail integration directly
const gmailTest = await fetch('http://localhost:8000/api/v1/integrations', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const integrations = await gmailTest.json();
console.log('Connected Integrations:', integrations);

// 3. Check Gmail specifically
const gmailConnected = integrations.data?.find(i => i.platform === 'gmail');
console.log('Gmail Status:', gmailConnected ? '✅ Connected' : '❌ Not connected');
console.log('Gmail Last Sync:', gmailConnected?.last_sync);

// 4. Check Calendar specifically  
const calendarConnected = integrations.data?.find(i => i.platform === 'google_calendar');
console.log('Calendar Status:', calendarConnected ? '✅ Connected' : '❌ Not connected');
console.log('Calendar Last Sync:', calendarConnected?.last_sync);
```

**Expected Output:**
```
Auth Token: ✅ Valid
Connected Integrations: {success: true, data: [...]}
Gmail Status: ✅ Connected
Gmail Last Sync: 2026-09-05T12:45:32Z
Calendar Status: ✅ Connected
Calendar Last Sync: 2026-09-05T12:48:15Z
```

---

### Step 3: Test AI Cockpit Data Fetching

**In AI Cockpit chat, type:**

```
Show me my integrations status
```

**Expected Response:**
```
✅ Your connected integrations:

📧 Gmail - Connected
   Last synced: 3 minutes ago
   Status: Healthy

📅 Google Calendar - Connected  
   Last synced: 6 minutes ago
   Status: Healthy

[Source: Integration Service]
```

**Red Flags:**
- ❌ Shows "No integrations connected"
- ❌ Shows wrong platforms
- ❌ Last sync is "Never" or very old (>1 hour)

---

### Step 4: Test Real Email Fetching

**In AI Cockpit chat, type:**

```
Show me my latest emails
```

**What to Look For:**

✅ **GOOD (Real Data):**
```
📧 Here are your latest emails from Gmail:

1. **John Smith** - RE: Project proposal review
   "Thanks for sending this over. I've reviewed the..."
   2 hours ago

2. **Sarah Johnson** - Q3 Planning Meeting
   "Just wanted to confirm we're still on for..."
   5 hours ago

[Source: Gmail]
```

❌ **BAD (Mock Data):**
```
📧 Here are some example emails:

1. **john@example.com** - Project Update  
   "Generic message about project..."
   10:00 AM

2. **sarah@company.com** - Team Meeting
   "Lorem ipsum dolor sit amet..."
   2:00 PM

[Source: Mock Data]
```

**Key Differences:**
- ✅ Real: YOUR actual sender names and subjects
- ✅ Real: Recent, varied timestamps
- ✅ Real: Actual email snippets you recognize
- ✅ Real: Source says `[Gmail]`
- ❌ Mock: Generic names like "john@example.com"
- ❌ Mock: Generic subjects like "Project Update"
- ❌ Mock: Source says `[Mock Data]`

---

### Step 5: Test Real Calendar Fetching

**In AI Cockpit chat, type:**

```
What's on my calendar today?
```

**What to Look For:**

✅ **GOOD (Real Data):**
```
📅 Your schedule today:

9:00 AM - 10:00 AM: Daily Standup
   Attendees: John, Sarah, Mike
   📍 Google Meet: meet.google.com/abc-defg-hij

2:00 PM - 3:00 PM: Client Presentation  
   Attendees: Client Name, Your Team
   📍 Zoom: zoom.us/j/123456789

[Source: Google Calendar]
```

❌ **BAD (Mock Data):**
```
📅 Your schedule today:

10:00 AM - 11:00 AM: Team Standup
   Attendees: Team members
   
2:00 PM - 3:00 PM: Project Review
   Attendees: Stakeholders

[Source: Mock Data]
```

**Key Differences:**
- ✅ Real: YOUR actual meeting titles
- ✅ Real: REAL attendee names
- ✅ Real: ACTUAL meeting links that work
- ✅ Real: Times that match your Google Calendar
- ✅ Real: Source says `[Google Calendar]`
- ❌ Mock: Generic titles and times
- ❌ Mock: No real attendee names
- ❌ Mock: Source says `[Mock Data]`

---

### Step 6: Test Email Sending (Critical!)

**In AI Cockpit chat, type:**

```
Send a test email to YOUR_ACTUAL_EMAIL@gmail.com with subject "AI Cockpit Test" saying "This is a real integration test"
```

**Then IMMEDIATELY check:**

1. **Your Gmail Inbox:**
   - Did you receive the email?
   - Is the subject correct?
   - Is the body text correct?
   
2. **Your Gmail Sent Folder:**
   - Is the email there?
   - Does it show as sent via WorkPilot?

3. **AI Cockpit Response:**
   ```
   ✅ Email Sent Successfully!
   
   📧 Email Details:
   • To: YOUR_ACTUAL_EMAIL@gmail.com
   • Subject: AI Cockpit Test
   • Sent via: Gmail
   
   🆔 Message ID: msg_abc123xyz
   
   💾 Status: Email delivered and saved to Gmail Sent folder
   ```

**This is the DEFINITIVE test:** If the email appears in your Gmail inbox and sent folder with the correct content, your Gmail integration is 100% working with real data.

---

### Step 7: Test Calendar Event Creation

**In AI Cockpit chat, type:**

```
Schedule a test meeting "AI Cockpit Integration Test" tomorrow at 3 PM for 30 minutes
```

**Then IMMEDIATELY check:**

1. **Your Google Calendar:**
   - Open https://calendar.google.com
   - Navigate to tomorrow
   - Look for "AI Cockpit Integration Test" at 3:00 PM
   - Duration should be 30 minutes

2. **AI Cockpit Response:**
   ```
   ✅ Event created successfully!
   
   📅 Event Details:
   • Title: AI Cockpit Integration Test
   • Date: [Tomorrow's date]
   • Time: 3:00 PM - 3:30 PM (30 minutes)
   • Calendar: Your primary calendar
   
   🆔 Event ID: evt_xyz789
   
   🔗 The event is now visible in your Google Calendar!
   ```

**This is the DEFINITIVE test:** If the event appears in your Google Calendar with correct details, your Calendar integration is 100% working with real data.

---

## 🚨 Troubleshooting

### Problem 1: Integration Shows "Connected" but Returns Mock Data

**Possible Causes:**
1. OAuth token expired
2. Integration was disconnected on Google's side
3. Wrong scopes granted
4. Backend cache serving old data

**Solutions:**

1. **Re-authorize Integration:**
   ```
   1. Go to Integrations page
   2. Click "Disconnect" on Gmail
   3. Click "Connect" again
   4. Complete OAuth flow
   5. Grant ALL requested permissions
   6. Wait 30 seconds for sync
   7. Test again
   ```

2. **Clear Token Cache:**
   ```javascript
   // Browser console
   localStorage.removeItem('wp_tokens');
   // Then sign out and sign in again
   ```

3. **Check Backend Logs:**
   ```bash
   # In terminal where backend is running
   # Look for errors like:
   # "Token expired"
   # "Invalid scope"
   # "Gmail API error"
   ```

---

### Problem 2: "401 Unauthorized" Errors

**Causes:**
- Firebase auth token expired
- Not signed in
- Wrong API endpoint

**Solutions:**

1. **Refresh Auth Token:**
   ```javascript
   // Browser console
   const newToken = await firebase.auth().currentUser?.getIdToken(true);
   console.log('New token:', newToken);
   ```

2. **Sign Out and Sign In Again:**
   ```
   1. Click user profile
   2. Click "Sign Out"
   3. Sign in again with Google
   4. Test integration
   ```

---

### Problem 3: Gmail/Calendar Not Showing in Integrations List

**Causes:**
- OAuth credentials not configured
- Wrong redirect URIs
- Backend integration_service error

**Solutions:**

1. **Check Backend Environment Variables:**
   ```bash
   # Open backend/.env
   cat backend/.env | grep GOOGLE
   
   # Should see:
   # GOOGLE_CLIENT_ID=...
   # GOOGLE_CLIENT_SECRET=...
   # GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/integrations/gmail/callback
   ```

2. **Check Google Cloud Console:**
   ```
   1. Go to https://console.cloud.google.com
   2. Select your project
   3. Go to APIs & Services > Credentials
   4. Find your OAuth 2.0 Client ID
   5. Verify redirect URIs include:
      - http://localhost:8000/api/v1/integrations/gmail/callback
      - http://localhost:8000/api/v1/integrations/google_calendar/callback
   ```

3. **Restart Backend:**
   ```bash
   # Stop backend (Ctrl+C)
   # Start again:
   cd backend
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

---

### Problem 4: Data is 1-2 Hours Old

**Causes:**
- Sync interval too long
- Manual sync not triggered
- Background sync jobs not running

**Solutions:**

1. **Manual Sync:**
   ```
   1. Go to Integrations page
   2. Click "Sync" button next to Gmail
   3. Wait 30 seconds
   4. Try fetching emails again
   ```

2. **Check Sync Interval:**
   ```python
   # backend/core/config.py
   # Should have:
   SYNC_INTERVAL_MINUTES = 15  # Syncs every 15 minutes
   ```

3. **Trigger Sync via AI Cockpit:**
   ```
   Sync my Gmail integration
   ```

---

## ✅ Final Verification Checklist

```
Test                                    | Expected Result                  | Status
----------------------------------------|----------------------------------|--------
1. Integrations page shows Gmail        | ✅ Connected, recent sync       | [ ]
2. Integrations page shows Calendar     | ✅ Connected, recent sync       | [ ]
3. Browser console auth test passes     | ✅ Valid token                  | [ ]
4. "Show my integrations" in AI Cockpit | Shows Gmail + Calendar          | [ ]
5. "Show my emails" returns real data   | YOUR actual email subjects      | [ ]
6. Email source citation                | Says [Gmail] NOT [Mock Data]    | [ ]
7. "Show my calendar" returns real data | YOUR actual events              | [ ]
8. Calendar source citation             | Says [Google Calendar]          | [ ]
9. Send test email                      | Appears in Gmail inbox + sent   | [ ]
10. Create test event                   | Appears in Google Calendar      | [ ]
```

**All 10 checks passed?** ✅ **Your AI Cockpit is fully integrated with real data!**

**Any checks failed?** ⚠️ **Follow troubleshooting steps above**

---

## 📞 Quick Support Commands

### Get Current Integration Status
```javascript
// Browser console
fetch('http://localhost:8000/api/v1/integrations', {
  headers: { 'Authorization': `Bearer ${await firebase.auth().currentUser?.getIdToken()}` }
})
.then(r => r.json())
.then(console.log);
```

### Test Gmail API Directly
```javascript
// Browser console  
fetch('http://localhost:8000/api/v1/emails', {
  headers: { 'Authorization': `Bearer ${await firebase.auth().currentUser?.getIdToken()}` }
})
.then(r => r.json())
.then(console.log);
```

### Test Calendar API Directly
```javascript
// Browser console
fetch('http://localhost:8000/api/v1/calendar/events', {
  headers: { 'Authorization': `Bearer ${await firebase.auth().currentUser?.getIdToken()}` }
})
.then(r => r.json())
.then(console.log);
```

---

**Last Updated:** September 5, 2026  
**Version:** WorkPilot AI v1.0.0
