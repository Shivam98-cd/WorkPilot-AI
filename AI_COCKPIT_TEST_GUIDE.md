# AI Cockpit Testing Guide — Real Integration Data Verification

**Last Updated:** September 5, 2026  
**Purpose:** Comprehensive testing prompts to verify AI Cockpit is working with REAL data from connected integrations (Gmail, Google Calendar, GitHub, Slack, etc.)

---

## 🎯 Test Overview

The AI Cockpit (`/ai-cockpit`) uses the SuperBrain multi-agent system with 30+ tools that connect to real integration APIs. This guide helps you verify:

1. ✅ Real Gmail emails are being fetched and displayed
2. ✅ Real Google Calendar events are showing
3. ✅ Integration status reflects actual connections
4. ✅ Email sending works end-to-end
5. ✅ Analytics show real user data
6. ✅ All tools execute correctly with live data

---

## 📋 Pre-Test Checklist

### ✅ Servers Running
```bash
# Backend
cd d:\workpilot-ai\backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd d:\workpilot-ai\Frontend
npm run dev
```

### ✅ Integrations Connected
1. Open http://localhost:5173
2. Sign in with your Firebase account
3. Go to **Integrations** page
4. Connect at least:
   - ✅ Gmail (for email testing)
   - ✅ Google Calendar (for events testing)
   - ✅ GitHub (optional, for deployments)
   - ✅ Slack (optional, for team data)

### ✅ Get Your Auth Token (Required for API Testing)
```javascript
// In browser console (on WorkPilot app):
copy(await firebase.auth().currentUser?.getIdToken())
// Token is now in your clipboard
```

---

## 🧪 Test Scenarios

### **Test 1: Email Fetching (Real Gmail Data)**

#### Test 1.1: Basic Email Query
**Prompt:**
```
Show me my latest emails
```

**Expected Behavior:**
- ✅ AI shows "📧 Reading your Gmail inbox..." thinking message
- ✅ Calls `get_emails` tool
- ✅ Returns real emails from your Gmail account
- ✅ Email card shows: sender, subject, snippet, timestamp
- ✅ Response cites source: `[Gmail]`

**What to Check:**
- [ ] Do you see YOUR actual email subjects?
- [ ] Are sender names/emails from your real inbox?
- [ ] Do timestamps match recent emails?
- [ ] Click "Open in Gmail" — does it work?

**Red Flags (Means it's using mock data):**
- ❌ Generic subjects like "Project Update" or "Team Meeting"
- ❌ Fake senders like "john@example.com"
- ❌ Identical timestamps
- ❌ Source says `[Mock Data]` instead of `[Gmail]`

---

#### Test 1.2: Filtered Email Query
**Prompt:**
```
Show me only unread emails from today
```

**Expected Behavior:**
- ✅ Filters applied: `filter=unread` and date constraint
- ✅ Returns only unread emails from today
- ✅ Source: `[Gmail]`

**What to Check:**
- [ ] Are all emails actually unread in your Gmail?
- [ ] Are they all from today's date?

---

#### Test 1.3: Email Search
**Prompt:**
```
Find emails from [specific person's name or domain]
```

**Expected Behavior:**
- ✅ Uses search functionality
- ✅ Returns emails matching the search
- ✅ Source: `[Gmail]`

---

### **Test 2: Calendar Events (Real Google Calendar)**

#### Test 2.1: Today's Schedule
**Prompt:**
```
What's on my calendar today?
```

**Expected Behavior:**
- ✅ AI shows "📅 Checking your Google Calendar..." thinking message
- ✅ Calls `get_calendar_events` tool
- ✅ Returns YOUR actual calendar events
- ✅ Calendar card shows: event title, time, attendees, meeting link
- ✅ Source: `[Google Calendar]`

**What to Check:**
- [ ] Do you see YOUR actual event titles?
- [ ] Are times accurate to your timezone?
- [ ] Do attendee names match your real meetings?
- [ ] Click meeting link — does it open the correct meeting?

**Red Flags:**
- ❌ Generic events like "Team Standup" or "Project Review"
- ❌ Fake times like "10:00 AM - 11:00 AM" that don't match your calendar
- ❌ Source says `[Mock Data]`

---

#### Test 2.2: Week Ahead
**Prompt:**
```
What meetings do I have this week?
```

**Expected Behavior:**
- ✅ Fetches events for next 7 days
- ✅ Groups events by day
- ✅ Shows event count and breakdown

---

#### Test 2.3: Find Free Time
**Prompt:**
```
When am I free tomorrow?
```

**Expected Behavior:**
- ✅ Calls `find_meeting_time` tool
- ✅ Analyzes calendar gaps
- ✅ Suggests available time slots based on REAL calendar data

---

### **Test 3: Email Sending (End-to-End)**

#### Test 3.1: Send Test Email to Yourself
**Prompt:**
```
Send a test email to [YOUR_EMAIL@gmail.com] with subject "WorkPilot Test" saying "This is a test from AI Cockpit"
```

**Expected Behavior:**
- ✅ AI shows "✍️ Drafting your email..." thinking message
- ✅ Calls `compose_email` tool with all required fields
- ✅ Sends email via Gmail API
- ✅ Shows success message with:
   - ✅ Recipient email
   - ✅ Subject
   - ✅ Message ID
   - ✅ "Email delivered and saved to Gmail Sent folder"
- ✅ Email appears in your Gmail Sent folder (check!)
- ✅ You receive the email in your inbox

**What to Verify:**
1. [ ] Check your Gmail inbox — did you receive the email?
2. [ ] Check Gmail Sent folder — is it there?
3. [ ] Does the Message ID match in Gmail?
4. [ ] Open the email — is the content correct?

---

#### Test 3.2: Multi-Step Email (Missing Info)
**Prompt Step 1:**
```
Send an email to John about the project update
```

**Expected AI Response:**
- ✅ Asks for missing information:
  ```
  I can help you send that email! I need:
  - Recipient email address: ?
  - What would you like to say in the email?
  ```

**Prompt Step 2:**
```
Send it to john.doe@example.com and say "Hey John, the project is on track. Let's sync tomorrow."
```

**Expected Behavior:**
- ✅ Now has all info, sends the email
- ✅ Confirmation with Message ID

---

### **Test 4: Integrations Status Check**

#### Test 4.1: Check Connected Platforms
**Prompt:**
```
Which integrations are connected?
```

**Expected Behavior:**
- ✅ Calls `get_integrations_status` tool
- ✅ Shows card with ALL your connected platforms
- ✅ Displays: platform name, status (✅ Connected), last sync time
- ✅ Source: `[Integration Service]`

**What to Check:**
- [ ] Does it show Gmail as connected?
- [ ] Does it show Google Calendar as connected?
- [ ] Are "not connected" platforms marked as such?
- [ ] Do last sync times look recent?

---

#### Test 4.2: Sync Specific Platform
**Prompt:**
```
Sync my Gmail integration
```

**Expected Behavior:**
- ✅ Calls `sync_integration` tool with platform="gmail"
- ✅ Shows "Sync started for gmail. Data will refresh in 30 seconds."
- ✅ Status updates after sync completes

---

### **Test 5: Analytics & Productivity Data**

#### Test 5.1: Weekly Summary
**Prompt:**
```
Show me my productivity stats for this week
```

**Expected Behavior:**
- ✅ Calls `get_analytics` tool with period="week"
- ✅ Shows analytics card with:
   - Focus hours (from calendar)
   - Emails handled
   - Meetings attended
   - Tasks completed
- ✅ Data should reflect YOUR actual activity

**What to Check:**
- [ ] Do email counts match your Gmail activity?
- [ ] Does meeting count match your calendar?
- [ ] Are focus hours calculated from your free time?

---

#### Test 5.2: Compare Periods
**Prompt:**
```
How was my productivity today compared to last week?
```

**Expected Behavior:**
- ✅ Fetches analytics for both periods
- ✅ Shows comparison with percentage changes
- ✅ Insights based on trends

---

### **Test 6: Team & Deployments (If Integrated)**

#### Test 6.1: Team Status
**Prompt:**
```
Give me a team standup summary
```

**Expected Behavior:**
- ✅ Calls `get_team_members` tool
- ✅ Shows team card with member statuses
- ✅ If not integrated: explains no data available

---

#### Test 6.2: Deployment Status
**Prompt:**
```
What's the status of our production deployments?
```

**Expected Behavior:**
- ✅ Calls `get_deployments` tool with environment="production"
- ✅ Shows deployment card with pipeline status
- ✅ If GitHub not connected: suggests connecting it

---

### **Test 7: Create Calendar Event**

#### Test 7.1: Simple Event Creation
**Prompt:**
```
Schedule a meeting called "Team Sync" tomorrow at 2 PM for 1 hour
```

**Expected Behavior:**
- ✅ Calls `create_calendar_event` tool
- ✅ Creates event in Google Calendar
- ✅ Shows success card with event details
- ✅ Event appears in your Google Calendar (verify!)

**What to Verify:**
1. [ ] Open Google Calendar — is the event there?
2. [ ] Is the time correct (2 PM tomorrow)?
3. [ ] Is duration 1 hour?
4. [ ] Does title match "Team Sync"?

---

#### Test 7.2: Meeting with Google Meet Link
**Prompt:**
```
Create a meeting "Project Review" tomorrow at 3 PM with a Google Meet link and invite john@example.com
```

**Expected Behavior:**
- ✅ Calls `create_meet_and_email` tool
- ✅ Creates event with Meet link
- ✅ Sends email invitation
- ✅ Shows both event and email confirmation

---

### **Test 8: Text Improvement**

#### Test 8.1: Improve Draft
**Prompt:**
```
Improve this text: "hey can u send me that file thx"
```

**Expected Behavior:**
- ✅ Calls `improve_text` tool with mode="improve"
- ✅ Returns professional version
- ✅ Shows before/after comparison

---

#### Test 8.2: Make Professional
**Prompt:**
```
Make this professional: "idk what happened but it's broken"
```

**Expected Behavior:**
- ✅ Calls `improve_text` with mode="make_professional"
- ✅ Returns formal version

---

### **Test 9: Complex Multi-Tool Workflows**

#### Test 9.1: Morning Briefing
**Prompt:**
```
Give me my morning briefing
```

**Expected Behavior:**
- ✅ Calls multiple tools in sequence:
  1. `get_emails` (unread count)
  2. `get_calendar_events` (today's schedule)
  3. `get_analytics` (yesterday's productivity)
- ✅ Synthesizes into coherent briefing
- ✅ All data sources cited

---

#### Test 9.2: Context-Aware Actions
**Prompt Sequence:**
```
1. "Show me my calendar"
   [AI shows calendar]

2. "Reschedule the 3 PM meeting to 4 PM"
   [AI should remember which meeting from previous context]
```

**Expected Behavior:**
- ✅ AI maintains conversation context
- ✅ References specific event from previous response
- ✅ Updates calendar

---

### **Test 10: Error Handling & Fallbacks**

#### Test 10.1: Disconnected Integration
**Prompt:**
```
Show me my Slack messages
```

**If Slack NOT connected:**
- ✅ AI responds: "I checked [Slack] but you haven't connected it yet. Would you like to connect Slack in Integrations?"
- ✅ Provides link/button to Integrations page

---

#### Test 10.2: Empty Results
**Prompt:**
```
Show me emails from tomorrow
```

**Expected Behavior:**
- ✅ Tool returns empty/no future emails
- ✅ AI responds: "I checked [Gmail] but found no emails from tomorrow. Would you like to check today's emails instead?"

---

#### Test 10.3: Invalid Request
**Prompt:**
```
Delete all my emails
```

**Expected Behavior:**
- ✅ AI refuses: "I can't delete emails for safety reasons. I can help you organize or archive them instead."

---

## 🔍 How to Verify Real vs Mock Data

### ✅ **Real Data Indicators:**
1. **Email Sources:**
   - Source says `[Gmail]` not `[Mock Data]`
   - Subjects match your actual inbox
   - Senders are real people/companies you correspond with
   - Snippets contain actual email content
   - Timestamps are recent and accurate

2. **Calendar Sources:**
   - Source says `[Google Calendar]`
   - Event titles match your real calendar
   - Times are in YOUR timezone
   - Attendees are real people you meet with
   - Meeting links work and go to real meetings

3. **Integration Status:**
   - Shows "✅ Connected" for platforms you connected
   - Shows "❌ Not connected" for platforms you haven't
   - Last sync times are recent (within minutes/hours)
   - Token expiry dates are in the future

### ❌ **Mock Data Red Flags:**
1. **Generic Data:**
   - Subjects: "Project Update", "Team Meeting", "Follow up"
   - Senders: "john@example.com", "sarah@company.com"
   - Times: Always "10:00 AM", "2:00 PM" (round numbers)
   - Content: Lorem ipsum or placeholder text

2. **Source Attribution:**
   - Says `[Mock Data]` instead of `[Gmail]` or `[Google Calendar]`
   - No source citation at all
   - AI says "I generated this example..."

3. **Consistency:**
   - Same data appears every time you ask
   - Data doesn't change even after sending/creating items
   - Refresh doesn't update timestamps

---

## 🐛 Common Issues & Fixes

### Issue 1: AI Returns Mock Data Instead of Real Data
**Symptoms:**
- Generic email subjects
- Source says `[Mock Data]`
- Data doesn't change

**Fixes:**
1. ✅ Check if Gmail/Calendar are ACTUALLY connected:
   - Go to Integrations page
   - Verify green "✅ Connected" badge
   - Check last sync time

2. ✅ Verify auth token is valid:
   ```javascript
   // Browser console
   firebase.auth().currentUser?.getIdToken().then(console.log)
   ```

3. ✅ Check backend logs for OAuth errors:
   ```bash
   # Look for token expired or invalid scope errors
   ```

4. ✅ Reconnect integration:
   - Click "Disconnect"
   - Click "Connect" again
   - Complete OAuth flow

---

### Issue 2: Email Sending Fails
**Symptoms:**
- "Email sent" but not in Gmail
- 401 Unauthorized error

**Fixes:**
1. ✅ Check Gmail OAuth scopes:
   - Must have `gmail.send` scope
   - Re-authorize if needed

2. ✅ Verify recipient email format:
   - Must be full email: `john@example.com`
   - Not just "john" or "John Doe"

3. ✅ Check backend logs:
   ```bash
   # Look for Gmail API errors
   tail -f backend.log | grep "gmail"
   ```

---

### Issue 3: Calendar Events Don't Appear
**Symptoms:**
- AI says "no events found"
- Calendar is actually full

**Fixes:**
1. ✅ Check timezone settings:
   - Backend timezone must match your Google Calendar timezone
   - Check `.env` file: `TIMEZONE=America/New_York`

2. ✅ Verify calendar sync:
   - Go to Integrations
   - Click "Sync" on Google Calendar
   - Wait 30 seconds and try again

3. ✅ Check calendar permissions:
   - OAuth scope must include `calendar.readonly`

---

### Issue 4: Model 404 Error (Already Fixed!)
**Symptoms:**
- Error: "model `llama-3.3-70b-versatile` does not exist"

**Fix:**
- ✅ Already fixed! Changed to `openai/gpt-oss-120b`
- If you still see this, check these files:
  - `backend/api/v1/endpoints/ai_chat.py`
  - `backend/services/superbrain/orchestrator.py`
  - `backend/api/v1/endpoints/emails.py`
- All should use `openai/gpt-oss-120b`

---

## 📊 Success Criteria

Your AI Cockpit is **working correctly with real data** if:

- [x] ✅ Email queries return YOUR actual Gmail messages
- [x] ✅ Calendar queries show YOUR actual Google Calendar events
- [x] ✅ Email sending works end-to-end (appears in Gmail Sent)
- [x] ✅ Integration status reflects your actual connected platforms
- [x] ✅ All responses cite real sources: `[Gmail]`, `[Google Calendar]`, etc.
- [x] ✅ Created events appear in your Google Calendar
- [x] ✅ Analytics reflect your actual activity
- [x] ✅ No `[Mock Data]` citations appear
- [x] ✅ Data updates when you refresh or sync

---

## 🎯 Quick Smoke Test (5 minutes)

**Run these 5 prompts in order:**

1. **"Show me my latest emails"**
   - ✅ Should show YOUR real emails with real subjects

2. **"What's on my calendar today?"**
   - ✅ Should show YOUR real events

3. **"What integrations are connected?"**
   - ✅ Should show Gmail and Calendar as connected

4. **"Send a test email to [your_email] with subject 'Test' saying 'This works!'"**
   - ✅ Should send real email (check your inbox!)

5. **"Give me my morning briefing"**
   - ✅ Should combine real emails + calendar + analytics

**If all 5 work → AI Cockpit is functioning correctly! ✅**

---

## 📝 Test Results Template

```markdown
## Test Session: [Date]
Tester: [Your Name]
Version: WorkPilot AI v1.0.0

### Environment
- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] Gmail connected
- [ ] Google Calendar connected
- [ ] Auth token valid

### Test Results

| Test | Prompt | Real Data? | Source Cited | Pass/Fail | Notes |
|------|--------|------------|--------------|-----------|-------|
| 1.1  | "Show me my latest emails" | Yes/No | [Gmail]/[Mock] | ✅/❌ | |
| 2.1  | "What's on my calendar today?" | Yes/No | [Google Calendar]/[Mock] | ✅/❌ | |
| 3.1  | "Send test email to [email]" | Email received | [Gmail] | ✅/❌ | Message ID: |
| 4.1  | "Which integrations are connected?" | Accurate | [Integration Service] | ✅/❌ | |
| 7.1  | "Schedule a meeting tomorrow at 2 PM" | In Google Calendar | [Google Calendar] | ✅/❌ | Event ID: |

### Overall Assessment
- [ ] ✅ All critical tests passed
- [ ] ⚠️ Some tests failed (see notes)
- [ ] ❌ Major issues found

### Issues Found
1. [Description]
2. [Description]

### Recommendations
1. [Action item]
2. [Action item]
```

---

## 🚀 Next Steps After Successful Testing

Once all tests pass:

1. **Document Real Data Sources**
   - Update `README.md` with "✅ Real Gmail integration working"
   - Update `README.md` with "✅ Real Google Calendar integration working"

2. **Add More Test Scenarios**
   - Test with GitHub integration (if connected)
   - Test with Slack integration (if connected)
   - Test multi-day calendar queries
   - Test email filtering and search

3. **Performance Testing**
   - Test with 100+ emails (pagination)
   - Test with full calendar (20+ events)
   - Measure response times

4. **User Acceptance Testing**
   - Have real users test the AI Cockpit
   - Collect feedback on accuracy
   - Identify edge cases

---

## 📞 Support

If you encounter issues during testing:

1. **Check Backend Logs:**
   ```bash
   # Look for errors in terminal where uvicorn is running
   ```

2. **Check Browser Console:**
   ```javascript
   // Open DevTools (F12) → Console tab
   // Look for fetch errors or auth issues
   ```

3. **Verify Environment Variables:**
   ```bash
   cat backend/.env | grep -E "GOOGLE|GMAIL|CALENDAR"
   ```

4. **Test API Directly:**
   ```bash
   curl -X POST http://localhost:8000/api/v1/ai/superchat \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"message": "Show me my emails", "conversation_id": "test123"}'
   ```

---

**Happy Testing! 🎉**

*Last Updated: September 5, 2026*
*Tested With: WorkPilot AI v1.0.0*
*Model: openai/gpt-oss-120b (Groq)*
