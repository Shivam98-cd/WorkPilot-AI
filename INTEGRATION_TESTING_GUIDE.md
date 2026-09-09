# 🧪 WorkPilot AI - Integration Testing Guide

## Quick Start

You now have **26 comprehensive test prompts** to verify all your connected integrations work correctly with real data.

---

## 📁 Test Files Created

### 1. **AI_COCKPIT_INTEGRATION_TESTS.md**
Complete test suite with 26 prompts covering:
- ✅ Gmail (5 tests)
- ✅ Google Calendar (5 tests)  
- ✅ Notion (5 tests)
- ✅ Multi-integration (5 tests)
- ✅ Analytics & Advanced (6 tests)

### 2. **test_integrations.py**
Python script to programmatically test backend integration APIs

---

## 🎯 How to Test via AI Cockpit (Recommended)

### Step 1: Open AI Cockpit
1. Go to your WorkPilot AI dashboard
2. Click on **"AI Cockpit"** in the left sidebar
3. Wait for the chat interface to load

### Step 2: Run Test Prompts
1. Open `AI_COCKPIT_INTEGRATION_TESTS.md`
2. Copy any test prompt (e.g., "Show me all emails from today")
3. Paste into AI Cockpit chat
4. Press Enter and observe the response

### Step 3: Verify Results
✅ **Success indicators:**
- Real data from your connected accounts appears
- No error messages in UI or console
- AI provides accurate, context-aware responses
- Toggle buttons remain green after tests

❌ **Failure indicators:**
- "No data found" or empty results
- Console errors (F12 → Console)
- Backend errors in terminal
- Toggle buttons turn off

---

## 🖥️ How to Test via Python Script

### Run Backend Integration Tests

```bash
cd d:\workpilot-ai
python test_integrations.py
```

**What it tests:**
1. Lists all connected integrations from Firestore
2. Fetches real Gmail emails via API
3. Fetches real Calendar events via API
4. Checks integration health status
5. Displays summary of results

**Expected Output:**
```
🧪 WORKPILOT AI - INTEGRATION TEST SUITE
============================================================

📋 Test 1: Fetching connected integrations...
✅ Found 3 connected integrations:
   🟢 GMAIL
      Account: your.email@gmail.com
      Status: connected
      Connected: 2026-09-05T14:29:58

   🟢 GOOGLE_CALENDAR
      Account: your.email@gmail.com
      Status: connected
      Connected: 2026-09-05T12:15:33

   🟢 NOTION
      Account: your.email@gmail.com
      Status: connected
      Connected: 2026-09-05T11:45:22

📧 Test 2: Fetching Gmail emails...
✅ Fetched 12 emails from Gmail

   Latest 3 emails:
   • John Doe - Meeting Tomorrow
   • Sarah Smith - Project Update
   • Team Bot - Daily Digest

📅 Test 3: Fetching Google Calendar events...
✅ Fetched 5 calendar events

   Upcoming events:
   • Team Standup at 2026-09-05 09:00
   • Client Call at 2026-09-05 14:00
   • Code Review at 2026-09-06 10:00

============================================================
📊 TEST SUMMARY
============================================================
Total Integrations: 3
Connected: 3
Gmail: ✅ Working
Calendar: ✅ Working

✨ Integration tests complete!
```

---

## 📝 Sample Test Prompts (Copy & Paste)

### Quick Test Set (5 minutes)

```
1. Show me all emails from today
2. What's on my calendar today?
3. Show me my Notion databases
4. Give me my morning briefing
5. Show me all my connected integrations
```

### Comprehensive Test Set (15 minutes)

Run all 26 tests from `AI_COCKPIT_INTEGRATION_TESTS.md` in order.

---

## 🔍 What to Look For

### Gmail Tests
- **Real email data** from your Gmail account
- Sender names, subjects, previews
- Ability to filter by unread, urgent, today
- Email composition works

### Calendar Tests
- **Real events** from your Google Calendar
- Event titles, times, attendees
- Ability to create new events
- Meeting scheduling works

### Notion Tests
- **Real Notion workspace** data
- Database listings
- Page creation and updates
- Search functionality

### Multi-Integration Tests
- **Data from multiple sources** combined correctly
- Morning briefing aggregates all platforms
- Cross-platform search works
- Create-and-send workflows function

---

## 🐛 Troubleshooting

### If tests fail:

1. **Check Browser Console** (F12 → Console tab)
   - Look for errors
   - Check network requests

2. **Check Backend Logs**
   ```
   # Look for errors in terminal where backend is running
   ```

3. **Verify Token Status**
   - Tokens might have expired
   - Try disconnecting and reconnecting

4. **Check OAuth Scopes**
   - Gmail needs: `gmail.readonly`, `gmail.send`
   - Calendar needs: `calendar`, `calendar.events`
   - Notion needs: workspace access

5. **Restart Services**
   ```bash
   # Backend
   cd backend
   uvicorn main:app --reload --host 0.0.0.0 --port 8000

   # Frontend
   cd Frontend
   npm run dev
   ```

---

## ✅ Success Checklist

After running all tests, verify:

- [ ] All 26 AI Cockpit prompts return real data
- [ ] Python test script shows all integrations connected
- [ ] No errors in browser console
- [ ] No errors in backend logs
- [ ] Toggle buttons stay green
- [ ] AI responses are accurate and context-aware
- [ ] Email sending works (if tested)
- [ ] Calendar event creation works (if tested)
- [ ] Notion page creation works (if tested)

---

## 📊 Test Coverage

| Integration | Read | Write | Search | Sync | Health |
|------------|------|-------|--------|------|--------|
| Gmail | ✅ | ✅ | ✅ | ✅ | ✅ |
| Google Calendar | ✅ | ✅ | ✅ | ✅ | ✅ |
| Notion | ✅ | ✅ | ✅ | ✅ | ⚠️ |

**Legend:**
- ✅ Fully tested
- ⚠️ Partially tested
- ❌ Not tested

---

## 🎯 Next Steps

1. **Run Quick Test Set** (5 prompts) to verify basic functionality
2. **Run Comprehensive Test Set** (26 prompts) for full validation
3. **Run Python Script** to verify backend APIs directly
4. **Check all success criteria** in the checklist above
5. **Document any issues** found during testing

---

**Happy Testing! 🚀**

If all tests pass, your WorkPilot AI integrations are working perfectly with real data from your connected accounts.
