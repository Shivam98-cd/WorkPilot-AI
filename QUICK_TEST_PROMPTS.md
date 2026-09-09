# AI Cockpit — Quick Test Prompts

**Quick Reference:** Copy-paste these prompts to test AI Cockpit with real integration data

---

## 🚀 5-Minute Smoke Test

```
1. Show me my latest emails

2. What's on my calendar today?

3. What integrations are connected?

4. Send a test email to [YOUR_EMAIL] with subject "Test" saying "This works!"

5. Give me my morning briefing
```

**Expected:** All should return REAL data from your Gmail/Calendar with sources like `[Gmail]` or `[Google Calendar]`

---

## 📧 Email Testing Prompts

### Basic Email Queries
```
Show me my latest emails

Show me unread emails

Find emails from today

Search for emails from [name or domain]

How many unread emails do I have?
```

### Email Sending
```
Send a test email to [YOUR_EMAIL@gmail.com] with subject "WorkPilot Test" saying "This is a test from AI Cockpit"

Draft an email to john@example.com about project updates

Send a follow-up email to the last person who emailed me
```

---

## 📅 Calendar Testing Prompts

### Calendar Queries
```
What's on my calendar today?

Show me my schedule for tomorrow

What meetings do I have this week?

When am I free tomorrow?

Do I have any meetings right now?
```

### Event Creation
```
Schedule a meeting called "Team Sync" tomorrow at 2 PM for 1 hour

Create a 30-minute event "Quick Check-in" at 3 PM today

Book a meeting "Project Review" next Monday at 10 AM with Google Meet link
```

---

## 🔗 Integration Testing Prompts

```
Which integrations are connected?

Sync my Gmail integration

Show me the status of all my connected apps

When was my Google Calendar last synced?

Help me connect GitHub
```

---

## 📊 Analytics & Productivity

```
Show me my productivity stats for this week

How was my productivity today?

What were my focus hours yesterday?

How many emails did I handle this week?

Give me a weekly summary
```

---

## 🎯 Multi-Tool Workflow Prompts

### Morning Briefing
```
Give me my morning briefing

What do I need to know for today?

Summarize my day ahead
```

### Context-Aware Conversations
```
1. "Show me my calendar"
   [Wait for response]

2. "Reschedule the 3 PM meeting to 4 PM"
   [Should reference meeting from step 1]
```

### Smart Suggestions
```
What should I work on next?

Help me prioritize my tasks today

What's urgent in my inbox?
```

---

## ✨ Text Improvement Prompts

```
Improve this text: "hey can u send me that file thx"

Make this professional: "idk what happened but it's broken"

Fix the grammar in: "me and him was working on the project"

Rephrase this to be more formal: [paste your text]
```

---

## 🚨 Edge Cases & Error Testing

### Test Empty Results
```
Show me emails from next week
[Should say "no emails found"]

Find meetings from yesterday at midnight
[Should handle gracefully]
```

### Test Missing Information
```
Send an email to John about the project
[Should ask for email address and details]
```

### Test Disconnected Integrations
```
Show me my Slack messages
[If Slack not connected, should suggest connecting it]
```

---

## ✅ Success Indicators

**You'll know it's working with REAL data when:**

- ✅ Email subjects match YOUR actual inbox
- ✅ Calendar events match YOUR actual Google Calendar
- ✅ Sender names are REAL people you correspond with
- ✅ Timestamps are RECENT and accurate
- ✅ Sources cited: `[Gmail]`, `[Google Calendar]` (NOT `[Mock Data]`)
- ✅ Sent emails appear in your Gmail Sent folder
- ✅ Created events appear in Google Calendar

---

## ❌ Red Flags (Mock Data)

**If you see these, it's NOT using real data:**

- ❌ Generic subjects: "Project Update", "Team Meeting"
- ❌ Fake senders: "john@example.com", "sarah@company.com"
- ❌ Source says: `[Mock Data]` or no source
- ❌ Same data every time (doesn't change)
- ❌ Times are always round numbers (10:00 AM, 2:00 PM)

---

## 🔧 Quick Fixes

### If Getting Mock Data:
1. Check Integrations page — are Gmail/Calendar connected?
2. Check green "✅ Connected" badge
3. Click "Sync" button
4. Try again after 30 seconds

### If Email Sending Fails:
1. Verify full email address format: `john@example.com`
2. Check Gmail is connected with `gmail.send` scope
3. Check backend logs for errors

### If Calendar Empty:
1. Verify timezone settings match
2. Sync Google Calendar integration
3. Check OAuth scopes include `calendar.readonly`

---

## 📝 Test Checklist

```
[ ] Emails show my real inbox
[ ] Calendar shows my real events  
[ ] Integration status is accurate
[ ] Email sending works (check Gmail!)
[ ] Calendar events get created (check Google Calendar!)
[ ] All sources cite [Gmail], [Google Calendar], etc.
[ ] No [Mock Data] citations appear
[ ] Data updates when I sync
```

---

**Pro Tip:** Open Gmail and Google Calendar in separate tabs while testing to verify changes in real-time! 🚀
