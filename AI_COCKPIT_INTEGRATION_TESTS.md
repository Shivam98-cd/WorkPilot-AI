# AI Cockpit Integration Tests
**Test all integrations with real data from your connected accounts**

Connected Integrations: ✅ Gmail | ✅ Google Calendar | ✅ Notion

---

## 📧 **Gmail Integration Tests**

### Test 1: View Today's Emails
**Prompt:**
```
Show me all emails from today
```
**Expected:** Fetches emails from the last 24 hours with sender, subject, and preview

### Test 2: Check Unread Messages
**Prompt:**
```
What unread emails do I have?
```
**Expected:** Filters and shows only unread messages

### Test 3: Find Urgent Emails
**Prompt:**
```
Show me urgent emails
```
**Expected:** Shows high-priority or important emails

### Test 4: Compose and Send Email
**Prompt:**
```
Send an email to test@example.com with subject "Test from WorkPilot AI" saying "This is an automated test from the AI Cockpit integration."
```
**Expected:** Drafts and sends email via Gmail API

### Test 5: Draft a Reply
**Prompt:**
```
Draft a professional reply to the most recent email thanking them for their message
```
**Expected:** Generates a reply draft based on the latest email

---

## 📅 **Google Calendar Integration Tests**

### Test 6: View Today's Schedule
**Prompt:**
```
What's on my calendar today?
```
**Expected:** Shows all events scheduled for today with time, title, and attendees

### Test 7: View Week Ahead
**Prompt:**
```
Show me my schedule for the next 7 days
```
**Expected:** Lists all events for the upcoming week

### Test 8: Create a Meeting
**Prompt:**
```
Create a meeting tomorrow at 2 PM titled "Team Sync" for 30 minutes
```
**Expected:** Creates a calendar event and returns the event details

### Test 9: Create Meeting with Attendees
**Prompt:**
```
Schedule a meeting called "Project Review" on September 10th at 10 AM with attendee1@example.com and attendee2@example.com
```
**Expected:** Creates event and adds attendees

### Test 10: Find Available Time
**Prompt:**
```
Find the best time for a 1-hour meeting with john@example.com this week
```
**Expected:** Analyzes calendar and suggests free time slots

---

## 📓 **Notion Integration Tests**

### Test 11: List Notion Databases
**Prompt:**
```
Show me my Notion databases
```
**Expected:** Lists all accessible Notion databases with names and IDs

### Test 12: Read Notion Database
**Prompt:**
```
Read my Notion project database
```
**Expected:** Fetches and displays pages/items from the Notion database

### Test 13: Search Notion
**Prompt:**
```
Search Notion for meeting notes
```
**Expected:** Searches across all Notion pages for "meeting notes"

### Test 14: Create Notion Page
**Prompt:**
```
Create a new Notion page titled "AI Cockpit Test" with content "This page was created by the WorkPilot AI integration test."
```
**Expected:** Creates a new page in Notion and returns the page URL

### Test 15: Update Notion Page
**Prompt:**
```
Append "Test completed successfully!" to the Notion page we just created
```
**Expected:** Adds content block to the existing page

---

## 🔄 **Multi-Integration Tests**

### Test 16: Morning Briefing (All Integrations)
**Prompt:**
```
Give me my morning briefing
```
**Expected:** Combines data from Gmail (unread), Calendar (today's events), and Notion (recent updates)

### Test 17: Create Meeting and Send Invites
**Prompt:**
```
Create a Google Meet for "Q4 Planning" tomorrow at 3 PM and email the link to team@example.com and manager@example.com
```
**Expected:** 
1. Creates calendar event with Google Meet link
2. Sends Gmail invitation with the meeting link

### Test 18: Search Across All Platforms
**Prompt:**
```
Search for "budget report" across my emails, calendar, and Notion
```
**Expected:** Searches Gmail, Calendar events, and Notion pages

### Test 19: Task Management with Notion
**Prompt:**
```
Create a task in Notion for "Review Q3 financials" due next Friday
```
**Expected:** Creates a task/page in Notion with due date property

### Test 20: Email Summary
**Prompt:**
```
Summarize all emails from the last 3 days
```
**Expected:** Fetches emails and provides an AI-generated summary

---

## 📊 **Analytics & Status Tests**

### Test 21: Integration Status
**Prompt:**
```
Show me all my connected integrations
```
**Expected:** Lists Gmail, Notion, Google Calendar as connected with status

### Test 22: Productivity Analytics
**Prompt:**
```
Show me my productivity stats for this week
```
**Expected:** Displays analytics from connected platforms

### Test 23: Generate Weekly Report
**Prompt:**
```
Generate a weekly productivity report
```
**Expected:** Creates comprehensive report using data from all integrations

---

## ⚙️ **Advanced Tests**

### Test 24: Auto-Reply Setup
**Prompt:**
```
Set up an automation to send a daily briefing every morning at 8 AM
```
**Expected:** Creates scheduled automation task

### Test 25: Improve Email Text
**Prompt:**
```
Improve this text: "hey can u send me the files asap thx"
```
**Expected:** Rewrites in professional tone

### Test 26: Sync Integration
**Prompt:**
```
Sync my Gmail integration
```
**Expected:** Triggers a sync and returns sync status

---

## 🎯 **How to Run Tests**

1. **Open AI Cockpit** in your WorkPilot AI dashboard
2. **Copy each prompt** from the tests above
3. **Paste into the chat** and press Enter
4. **Verify the response** matches the expected behavior
5. **Check that real data** from your connected accounts is displayed

---

## ✅ **Success Criteria**

- [ ] All Gmail tests return real emails from your account
- [ ] Calendar tests show actual events from Google Calendar
- [ ] Notion tests interact with your real Notion workspace
- [ ] Multi-integration tests combine data correctly
- [ ] AI generates accurate, context-aware responses
- [ ] No errors in console or backend logs
- [ ] Toggles remain green/on after tests

---

## 🐛 **If Tests Fail**

1. **Check Console Logs** (F12 → Console)
2. **Check Backend Logs** in terminal
3. **Verify tokens are valid** (not expired)
4. **Check OAuth scopes** include necessary permissions
5. **Try disconnecting and reconnecting** the integration

---

**Generated:** September 5, 2026  
**WorkPilot AI Version:** 1.0.0  
**Test Account:** Your currently logged-in account
