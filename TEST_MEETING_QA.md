# Test: Interactive Meeting Q&A Flow

## Quick Test Prompts

Copy these into AI Cockpit to test the new Q&A flow:

---

### ✅ Test 1: Minimal Information (Should ask everything)
**Prompt:**
```
Create a meeting
```

**Expected AI Response:**
```markdown
I'll help you create a meeting! Let me confirm a few details:

❓ Which platform would you like?
   1. Google Meet (video call with link)
   2. Zoom (requires Zoom integration)
   3. Microsoft Teams (requires Teams integration)
   4. Calendar event only (no video link)

Please specify, and I'll gather the remaining details.
```

**Then reply:** "Google Meet"

**Expected:** AI asks for title, time, attendees

---

### ✅ Test 2: Platform Specified
**Prompt:**
```
Create a Google Meet
```

**Expected AI Response:**
```markdown
Great! A few more details for your Google Meet:

• Meeting title?
• Date and time?
• Who should I invite? (email addresses)
• Duration? (default: 30 minutes)
```

---

### ✅ Test 3: Partial Information
**Prompt:**
```
Schedule a team sync tomorrow
```

**Expected AI Response:**
```markdown
I'll schedule a team sync for tomorrow. A few questions:

1. What time works best?
2. Which platform? (Google Meet, Zoom, Teams, or calendar only)
3. Who should I invite? (email addresses)
```

---

### ✅ Test 4: Most Information (Only title missing)
**Prompt:**
```
Book a Google Meet tomorrow at 3 PM with alice@example.com
```

**Expected AI Response:**
```markdown
Got it! Google Meet tomorrow at 3 PM with alice@example.com.

Just need:
• Meeting title?
• Any other attendees?
```

---

### ✅ Test 5: All Information (Should create immediately)
**Prompt:**
```
Create a Google Meet called "Sprint Planning" tomorrow at 2 PM with dev@company.com and qa@company.com
```

**Expected AI Response:**
```markdown
Perfect! I have all the details. Creating your Google Meet now...

✅ Meeting "Sprint Planning" created
📅 Tomorrow at 2:00 PM (30 minutes)
👥 Invited: dev@company.com, qa@company.com
🎥 Google Meet: https://meet.google.com/xxx-yyyy-zzz
```

---

### ✅ Test 6: Zoom Request (Not yet integrated)
**Prompt:**
```
Create a Zoom meeting
```

**Expected AI Response:**
```markdown
I can help you create a Zoom meeting! However, I notice Zoom integration is not currently connected.

**Options:**
1. Create a **Google Meet** instead (already connected)
2. Create a **calendar event only** (no video link)
3. Connect Zoom integration first (Settings → Integrations)

Which would you prefer?
```

---

### ✅ Test 7: Platform Choice in Conversation
**Prompt 1:**
```
Create a meeting for tomorrow at 10 AM
```

**AI asks for platform**

**Prompt 2:**
```
Google Meet
```

**AI asks for title and attendees**

**Prompt 3:**
```
Daily Standup with team@company.com
```

**Expected:** Meeting created with all details

---

### ✅ Test 8: Follow-up Questions
**Prompt 1:**
```
Set up a meeting
```

**AI asks for platform**

**Prompt 2:**
```
Use calendar only, no video
```

**AI asks for title, time**

**Prompt 3:**
```
Team Retrospective, next Friday 4 PM
```

**Expected:** Calendar event created (no video link)

---

## Success Criteria

For each test, verify:

✅ **AI asks questions** before creating the meeting  
✅ **Questions are clear** with numbered options  
✅ **AI remembers answers** from previous messages in the conversation  
✅ **Platform choice respected** (Google Meet vs Calendar only vs Zoom)  
✅ **All required fields collected** before tool execution  
✅ **Beautiful markdown formatting** in responses  
✅ **Meeting created successfully** with all specified details  

---

## Expected Behavior

### ❌ Old Behavior (Direct):
```
User: "Create a meeting"
AI: [immediately creates Google Meet with generic title]
```

### ✅ New Behavior (Interactive):
```
User: "Create a meeting"
AI: Which platform? [Google Meet, Zoom, Teams, Calendar]
User: "Google Meet"
AI: Got it! What's the title, time, and who should I invite?
User: "Team Sync, tomorrow 3 PM, team@example.com"
AI: [creates meeting with all details]
```

---

## Troubleshooting

### Issue: AI creates meeting immediately without asking
**Cause:** All information was provided in the initial prompt  
**Fix:** This is correct behavior! Only ask when info is missing

### Issue: AI asks for already-provided information
**Cause:** Parsing issue in intent detection  
**Fix:** Check that email addresses are being detected correctly

### Issue: AI doesn't offer platform choices
**Cause:** System prompt not loaded  
**Fix:** Restart backend server to reload orchestrator.py

---

## After Testing

If all tests pass:
1. ✅ Q&A flow is working
2. ✅ Platform choices are offered
3. ✅ Conversation state is maintained
4. ✅ Meeting creation respects user preferences

**Next:** Add Zoom and Teams integration support!

---

**Test Date:** 2026-09-06  
**Backend:** http://localhost:8000  
**Frontend:** http://localhost:5173
