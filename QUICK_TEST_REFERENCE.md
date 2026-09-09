# Quick Test Reference Card

## 🎯 Start Here - Top 10 Essential Tests

Copy these prompts to test the most important features:

---

### ✅ 1. Gmail
```
Show me all emails from today
```

---

### ✅ 2. Calendar
```
What's on my calendar tomorrow?
```
(Should show "Team Review" at 8:30 PM)

---

### ✅ 3. Notion
```
Show me my Notion databases
```

---

### ✅ 4. Morning Briefing
```
Give me my morning briefing
```
(Combines Gmail + Calendar + Notion)

---

### ✅ 5. Integration Status
```
Show me all my connected integrations
```

---

### ✅ 6. Search Across Platforms
```
Search for "meeting" across my emails, calendar, and Notion
```

---

### ✅ 7. Create Meeting (Q&A Test) ⭐ NEW
```
Create a meeting
```
(Should ask: Which platform?)

---

### ✅ 8. Create Google Meet
```
Create a Google Meet called "Daily Standup" tomorrow at 10 AM with team@company.com
```

---

### ✅ 9. Find Available Time
```
Find available time for a 1-hour meeting this week
```

---

### ✅ 10. Account Info
```
What Google account am I using?
```
(Should show: sy985798@gmail.com)

---

## 📋 Expected Behaviors

### ✅ Real Data
- Gmail: YOUR actual emails
- Calendar: YOUR actual events  
- Notion: YOUR actual databases

### ✅ Beautiful Formatting
- Markdown tables
- Bullet lists
- Bold/italic text
- Code blocks for technical details

### ✅ Citations
Every response includes sources:
- [Gmail]
- [Google Calendar]
- [Notion]

### ✅ No Mock Data
All responses use REAL data from your connected accounts.

---

## 🚨 Common Issues

### Issue: "No live data found"
**Fix:** Check if integration toggle is green. If not, reconnect.

### Issue: Token expired
**Fix:** Disconnect and reconnect the integration.

### Issue: Empty results
**Reason:** Your account might genuinely have no data for that query.

### Issue: Meeting Q&A not asking questions
**Fix:** Refresh browser to load new AI behavior.

---

## 🎨 New Features to Test

### 1. Interactive Meeting Q&A ⭐ NEW
```
Create a meeting
```
**Expected:** AI asks which platform (Google Meet, Zoom, Teams, Calendar)

### 2. Enhanced Markdown Rendering ⭐ NEW
All responses now support:
- Code blocks with syntax highlighting
- Inline `code`
- [Links](url)
- Blockquotes
- Numbered lists
- Better tables

### 3. No More Empty Notices ⭐ FIXED
When data is shown in text, no redundant "No live data found" message.

---

## ✅ Quick Checklist

After running the 10 essential tests:

- [ ] Gmail shows real emails
- [ ] Calendar shows "Team Review" tomorrow
- [ ] Notion shows your databases
- [ ] Morning briefing combines all 3 platforms
- [ ] Integration status shows 3 connected
- [ ] Cross-platform search works
- [ ] Meeting creation asks for platform ⭐
- [ ] Google Meet creates with link
- [ ] Find time suggests actual free slots
- [ ] Account info shows sy985798@gmail.com

---

## 🚀 Full Test Suite

For comprehensive testing, see:
- `COMPREHENSIVE_INTEGRATION_TESTS.md` - All 26 tests
- `TEST_MEETING_QA.md` - 8 meeting Q&A scenarios
- `QUICK_TEST_PROMPTS.txt` - Quick reference

---

**Quick Start:** Copy Test 1 above and paste into AI Cockpit! 🎉
