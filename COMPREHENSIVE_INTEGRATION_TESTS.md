# Comprehensive Integration Tests

## Copy & Paste These Prompts Into AI Cockpit

Test all integrations with real data from your connected accounts.

---

## 📧 **GMAIL TESTS** (5 prompts)

### Test 1: View Today's Emails
```
Show me all emails from today
```
**Expected:** List of emails with sender, subject, preview, timestamps

---

### Test 2: Unread Emails
```
What unread emails do I have?
```
**Expected:** Filtered list showing only unread messages

---

### Test 3: Search Emails
```
Search my emails for "budget"
```
**Expected:** Emails containing the word "budget" with context

---

### Test 4: Recent Email Summary
```
Summarize my emails from the last 3 days
```
**Expected:** AI-generated summary of recent email activity

---

### Test 5: Email from Specific Sender
```
Show me emails from robert
```
**Expected:** Emails from anyone named Robert with full details

---

## 📅 **GOOGLE CALENDAR TESTS** (6 prompts)

### Test 6: Today's Schedule
```
What's on my calendar today?
```
**Expected:** All events for today with times, titles, attendees

---

### Test 7: Tomorrow's Calendar
```
Show me my schedule for tomorrow
```
**Expected:** Events for tomorrow (should show "Team Review" at 8:30 PM)

---

### Test 8: Week Ahead
```
Show me my calendar for the next 7 days
```
**Expected:** All events for the upcoming week

---

### Test 9: Find Available Time
```
Find available time for a 1-hour meeting this week
```
**Expected:** List of free time slots based on calendar

---

### Test 10: Create Simple Calendar Event
```
Create a calendar event called "Focus Time" for tomorrow at 9 AM
```
**Expected:** Calendar event created (no video link)

---

### Test 11: Meeting Creation (Q&A Test)
```
Create a meeting
```
**Expected:** AI asks which platform (Google Meet, Zoom, Teams, Calendar only)

Then respond: `Google Meet`

**Expected:** AI asks for title, time, attendees

---

## 📓 **NOTION TESTS** (5 prompts)

### Test 12: List Databases
```
Show me my Notion databases
```
**Expected:** List of all accessible Notion databases with names and IDs

---

### Test 13: Search Notion
```
Search Notion for "meeting notes"
```
**Expected:** Pages containing "meeting notes" with titles and URLs

---

### Test 14: List Notion Pages
```
What pages do I have in Notion?
```
**Expected:** Recent or all pages from Notion workspace

---

### Test 15: Create Notion Page
```
Create a new Notion page titled "Integration Test" with content "This is a test from WorkPilot AI"
```
**Expected:** New page created with confirmation and URL

---

### Test 16: Notion Database Action
```
Show me the contents of my first Notion database
```
**Expected:** Items/rows from the specified database

---

## 🔄 **MULTI-INTEGRATION TESTS** (6 prompts)

### Test 17: Morning Briefing
```
Give me my morning briefing
```
**Expected:** Combined data from Gmail (unread), Calendar (today's events), Notion (recent updates)

---

### Test 18: Integration Status
```
Show me all my connected integrations
```
**Expected:** Gmail, Calendar, Notion with connection status and last sync times

---

### Test 19: Cross-Platform Search
```
Search for "project" across my emails, calendar, and Notion
```
**Expected:** Results from all three platforms combined

---

### Test 20: Weekly Summary
```
Generate a weekly productivity report
```
**Expected:** Report combining data from multiple integrations

---

### Test 21: Create Meeting + Email Attendees
```
Create a Google Meet called "Q4 Planning" tomorrow at 4 PM and invite alice@example.com and bob@example.com
```
**Expected:** Meeting created + email invitations sent automatically

---

### Test 22: Find and Schedule
```
Find the best time for a meeting with my team this week and schedule it
```
**Expected:** AI checks calendar, suggests times, asks for confirmation

---

## ⚙️ **SYSTEM TESTS** (4 prompts)

### Test 23: Health Check
```
Check system health
```
**Expected:** Status of backend, integrations, and services

---

### Test 24: Sync Integration
```
Sync my Gmail integration
```
**Expected:** Sync triggered, confirmation message

---

### Test 25: Account Information
```
What Google account am I using?
```
**Expected:** Shows connected email (sy985798@gmail.com)

---

### Test 26: Help Command
```
How do I use this AI assistant?
```
**Expected:** Guide with features and example commands

---

## 🎯 **EXPECTED RESULTS SUMMARY**

| Category | Tests | What to Check |
|----------|-------|---------------|
| Gmail | 1-5 | Real emails with actual content |
| Calendar | 6-11 | Real events, accurate times |
| Notion | 12-16 | Actual databases and pages |
| Multi-Integration | 17-22 | Data from multiple sources |
| System | 23-26 | Status and account info |

---

## ✅ **SUCCESS CRITERIA**

For each test:

✅ **Real Data** - No mock data, only actual data from your accounts  
✅ **Beautiful Formatting** - Markdown tables, lists, headers  
✅ **Citations** - Sources mentioned: [Gmail], [Calendar], [Notion]  
✅ **No Errors** - No red error messages or "No live data found"  
✅ **Response Time** - Answers within 5 seconds  
✅ **Accurate Info** - Data matches what's in actual Gmail/Calendar/Notion  

---

## 🐛 **IF A TEST FAILS**

1. **Check Console** (F12 → Console tab)
2. **Check Backend Logs** (terminal running backend)
3. **Verify Connection** - Integration toggle should be green
4. **Check Token** - Token might have expired
5. **Try Disconnecting & Reconnecting** the integration

---

## 📊 **TRACKING RESULTS**

| # | Test | Status | Notes |
|---|------|--------|-------|
| 1 | Gmail: Today's emails | ⏳ | |
| 2 | Gmail: Unread | ⏳ | |
| 3 | Gmail: Search | ⏳ | |
| 4 | Gmail: Summary | ⏳ | |
| 5 | Gmail: Sender filter | ⏳ | |
| 6 | Calendar: Today | ⏳ | |
| 7 | Calendar: Tomorrow | ⏳ | Should show "Team Review" |
| 8 | Calendar: Week ahead | ⏳ | |
| 9 | Calendar: Find time | ⏳ | |
| 10 | Calendar: Create event | ⏳ | |
| 11 | Calendar: Meeting Q&A | ⏳ | Should ask platform |
| 12 | Notion: List databases | ⏳ | |
| 13 | Notion: Search | ⏳ | |
| 14 | Notion: List pages | ⏳ | |
| 15 | Notion: Create page | ⏳ | |
| 16 | Notion: Database contents | ⏳ | |
| 17 | Multi: Morning briefing | ⏳ | |
| 18 | Multi: Integration status | ⏳ | |
| 19 | Multi: Cross-platform search | ⏳ | |
| 20 | Multi: Weekly report | ⏳ | |
| 21 | Multi: Meet + Email | ⏳ | |
| 22 | Multi: Find & Schedule | ⏳ | |
| 23 | System: Health check | ⏳ | |
| 24 | System: Sync | ⏳ | |
| 25 | System: Account info | ⏳ | |
| 26 | System: Help | ⏳ | |

Legend: ⏳ Pending | ✅ Passed | ❌ Failed

---

## 🚀 **QUICK START**

1. **Open AI Cockpit** in WorkPilot AI
2. **Copy Test 1** prompt above
3. **Paste and press Enter**
4. **Verify response** matches expected behavior
5. **Mark as ✅ or ❌** in tracking table
6. **Repeat for all 26 tests**

---

## 💡 **TIPS**

- Test in order (1-26) for best results
- Gmail tests should show YOUR actual emails
- Calendar should show "Team Review" tomorrow (we created it earlier)
- Notion tests depend on your Notion workspace content
- Meeting Q&A (Test 11) tests the new interactive flow
- Multi-integration tests combine data from multiple sources

---

**Start Testing:** Copy Test 1 prompt and paste it into AI Cockpit!

**Report Issues:** Note any failures in the tracking table above.

---

**Test Suite Version:** 1.0  
**Last Updated:** 2026-09-06 at 9:15 PM IST  
**Total Tests:** 26
