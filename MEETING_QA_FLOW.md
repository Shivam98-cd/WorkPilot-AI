# Interactive Q&A Flow for Meeting Creation

## Overview
The AI now asks clarifying questions before creating meetings, giving users control over platform choice (Google Meet, Zoom, Teams, or Calendar only) and ensuring all required information is collected.

---

## ✨ New Behavior

### Before (Direct Creation):
```
User: "Create a meeting"
AI: ✅ Meeting created! [immediately creates Google Meet]
```

### After (Interactive Q&A):
```
User: "Create a meeting"
AI: I'll help you create a meeting! Let me confirm a few details:

    ❓ Which platform would you like?
       1. Google Meet (video call with link)
       2. Zoom (requires Zoom integration)
       3. Microsoft Teams (requires Teams integration)  
       4. Calendar event only (no video link)
    
    Please specify, and I'll gather the remaining details.

User: "Google Meet"
AI: Great! A few more details for your Google Meet:
    1. What's the meeting title?
    2. When should it be scheduled?
    3. Who should I invite? (email addresses)

User: "Team Review, tomorrow at 3 PM, invite alice@example.com and bob@example.com"
AI: Perfect! Creating your Google Meet now...
    ✅ Meeting "Team Review" created for tomorrow at 3 PM
```

---

## 📋 Required Information

### For All Meetings:
1. ✅ **Platform** - Google Meet, Zoom, Teams, or Calendar only
2. ✅ **Title** - Meeting name
3. ✅ **Date/Time** - When to schedule
4. ⚠️ **Duration** - How long (default: 30 minutes if not specified)
5. ⚠️ **Attendees** - Email addresses (required for video meetings, optional for calendar events)
6. ⚠️ **Description** - Agenda or notes (optional)

---

## 🎯 Q&A Workflow Examples

### Example 1: Minimal Information
```
User: "Create a meeting"

AI: I'll help you create a meeting! Let me confirm a few details:

    ❓ Which platform would you like?
       1. Google Meet (video call with link)
       2. Zoom (requires Zoom integration)
       3. Microsoft Teams (requires Teams integration)
       4. Calendar event only (no video link)

User: "Google Meet"

AI: Great! A few more details for your Google Meet:
    • Meeting title?
    • Date and time?
    • Who should I invite? (email addresses)

User: "Sprint Planning, tomorrow 10 AM, dev-team@company.com"

AI: Perfect! Creating Google Meet for "Sprint Planning" tomorrow at 10 AM...
    [Creates meeting with all details]
```

---

### Example 2: Partial Information
```
User: "Schedule a team sync tomorrow"

AI: I'll schedule a team sync for tomorrow. A few questions:

    1. What time works best?
    2. Which platform? (Google Meet, Zoom, Teams, or calendar only)
    3. Who should I invite? (email addresses)

User: "3 PM, Google Meet, alice@example.com and bob@example.com"

AI: Got it! Creating Google Meet for "team sync" tomorrow at 3 PM...
    ✅ Meeting created with Alice and Bob invited
```

---

### Example 3: Most Information Provided
```
User: "Book a Google Meet for tomorrow at 3 PM with alice@example.com"

AI: Got it! Google Meet tomorrow at 3 PM with alice@example.com.
    
    Just need:
    • Meeting title?
    • Any other attendees?

User: "Q4 Planning, also invite bob@example.com"

AI: Perfect! Creating "Q4 Planning" Google Meet...
    ✅ Tomorrow 3 PM | Alice + Bob invited
```

---

### Example 4: All Information Provided
```
User: "Create a Google Meet called 'Team Review' tomorrow at 3 PM with shivam@example.com and hariom@example.com"

AI: Perfect! I have all the details. Creating your Google Meet now...
    
    ✅ Meeting "Team Review" created
    📅 Tomorrow at 3:00 PM (30 minutes)
    👥 Invited: shivam@example.com, hariom@example.com
    🎥 Google Meet: https://meet.google.com/abc-defg-hij
```

---

## 🔧 Platform Options

### 1. Google Meet ✅
- **Requires:** Google Calendar integration
- **Creates:** Calendar event + Google Meet video link
- **Attendees:** Email invitations sent automatically
- **Best for:** External meetings, cross-org collaboration

### 2. Zoom (Coming Soon)
- **Requires:** Zoom integration
- **Creates:** Calendar event + Zoom meeting link
- **Attendees:** Email invitations with Zoom details
- **Best for:** Large meetings, webinars, recordings

### 3. Microsoft Teams (Coming Soon)
- **Requires:** Microsoft 365 integration
- **Creates:** Calendar event + Teams meeting link  
- **Attendees:** Teams notifications + email invites
- **Best for:** Internal org meetings, Office 365 workflows

### 4. Calendar Event Only
- **Requires:** Google Calendar or Outlook
- **Creates:** Calendar event (no video link)
- **Attendees:** Calendar invitations only
- **Best for:** In-person meetings, reminders, time blocking

---

## 🎨 AI Response Format

The AI will use clear, structured questions:

```markdown
I'll help you create a meeting! Let me confirm a few details:

❓ **Which platform would you like?**
   1. **Google Meet** (video call with link)
   2. **Zoom** (requires Zoom integration)
   3. **Microsoft Teams** (requires Teams integration)
   4. **Calendar event only** (no video link)

*Please specify, and I'll gather the remaining details.*
```

After user responds:
```markdown
Great! A few more details for your [Platform]:

• **Meeting title?**
• **Date and time?**
• **Who should I invite?** (email addresses)
• **Duration?** (default: 30 minutes)
```

---

## 🔄 Conversation Flow

### State 1: Initial Request
User: "Create a meeting"
→ AI asks for platform

### State 2: Platform Confirmed
User: "Google Meet"
→ AI asks for title, time, attendees

### State 3: All Details Provided
User: "Team Sync, tomorrow 2 PM, team@example.com"
→ AI creates meeting immediately

### State 4: Confirmation
AI: "✅ Meeting created [shows details]"

---

## 📝 System Prompt Changes

Added to `orchestrator.py`:

```python
━━━ INTERACTIVE Q&A FOR MEETINGS ━━━
**CRITICAL: When user wants to create a meeting, ask clarifying questions BEFORE calling tools:**

**Required Information for Meetings:**
1. **Platform:** Google Meet, Zoom, Microsoft Teams, or Calendar only?
2. **Title:** What should the meeting be called?
3. **Date/Time:** When should it be scheduled?
4. **Duration:** How long? (default: 30-60 minutes)
5. **Attendees:** Who should be invited? (email addresses)

**NEVER assume platform or attendees - ALWAYS ask if not explicitly stated.**
```

---

## ✅ Benefits

1. **User Control** - Choose platform explicitly
2. **Clear Communication** - No assumptions, always confirm
3. **Professional UX** - Feels like working with an assistant
4. **Flexibility** - Supports multiple platforms (Meet, Zoom, Teams)
5. **Error Prevention** - Catches missing information upfront
6. **Context Awareness** - Remembers previous answers in conversation

---

## 🧪 Testing

### Test Case 1: Minimal Info
```
User: "Create a meeting"
Expected: AI asks for platform first
```

### Test Case 2: Platform Specified
```
User: "Create a Google Meet"
Expected: AI asks for title, time, attendees
```

### Test Case 3: Most Info Given
```
User: "Book Google Meet tomorrow at 3 PM with alice@example.com"
Expected: AI asks for title only
```

### Test Case 4: All Info Given
```
User: "Create Google Meet 'Team Review' tomorrow 3 PM with alice@example.com and bob@example.com"
Expected: AI creates immediately, no questions
```

### Test Case 5: Platform Choice
```
User: "Create a meeting"
AI: [asks platform]
User: "Zoom"
Expected: AI asks for Zoom-specific details or notifies if Zoom not connected
```

---

## 🚀 Future Enhancements

1. **Platform Preferences** - Remember user's preferred platform
2. **Smart Defaults** - "Same attendees as last time?"
3. **Time Suggestions** - "You're free at 2 PM, 3 PM, or 4 PM tomorrow"
4. **Recurring Meetings** - "Should this repeat weekly?"
5. **Meeting Templates** - "Use your 'Team Standup' template?"
6. **Conflict Detection** - "You have another meeting at 3 PM, try 4 PM instead?"

---

## 📚 Documentation

- **Implementation:** `backend/services/superbrain/orchestrator.py`
- **System Prompt:** Lines 101-130
- **Testing Guide:** `MEETING_QA_FLOW.md` (this file)

---

**Status:** ✅ Implemented and Ready to Test  
**Last Updated:** 2026-09-06 at 9:00 PM IST
