# Markdown Rendering Examples

## Test These Prompts in AI Cockpit

Copy and paste these prompts to see the enhanced markdown rendering:

---

## 1. **Calendar with Rich Formatting**

**Prompt:**
```
What's on my calendar tomorrow?
```

**Expected AI Response:**
```markdown
**Your calendar for tomorrow (2026-09-07)**

| Time (UTC) | Time (Local +05:30) | Event | Duration |
|------------|---------------------|-------|----------|
| 15:00 – 15:30 | 20:30 – 21:00 (IST) | **Team Review** | 30 min |

*No other events scheduled.*

---

**Actions:**
- [Add new event](javascript:void(0))
- [View full week](javascript:void(0))

> **Tip:** Use the command `Find available time slots` to schedule new meetings.
```

---

## 2. **Email Summary with Code**

**Prompt:**
```
Show me emails from today and format the subject lines
```

**Expected AI Response:**
```markdown
# Emails from Today (September 6, 2026)

Found **3 emails** in your inbox:

1. **From:** Robert Chen
   - **Subject:** Project Update - Q3 Review
   - **Preview:** "Hey team, I wanted to share the latest updates..."
   - *Received:* 2 hours ago

2. **From:** GitHub Notifications
   - **Subject:** [workpilot-ai] New PR: Fix authentication bug
   - **Preview:** "shivamyadav opened a new pull request..."
   - *Received:* 5 hours ago

3. **From:** Stripe
   - **Subject:** Payment confirmation
   - **Preview:** "Your payment of $29.99 was processed..."
   - *Received:* 1 day ago

---

> All emails are from [Gmail]. Last sync: *30 seconds ago*
```

---

## 3. **Error Message with Solution**

**Prompt:** (When Gmail is disconnected)
```
Send an email to test@example.com
```

**Expected AI Response:**
```markdown
## ⚠️ Gmail Connection Required

I can't send emails because your Gmail integration is not connected.

**Error Details:**
```
HTTP 401 Unauthorized
Gmail API token expired or invalid
```

**How to fix:**

1. Go to **Settings** → **Integrations**
2. Find **Gmail** in the list
3. Click the **Reconnect** button
4. Authorize WorkPilot AI access

> **Note:** Your existing data is safe. We just need to refresh the connection.

[Open Integrations Page](#)
```

---

## 4. **Technical Guide with Code**

**Prompt:**
```
How do I set up the backend server?
```

**Expected AI Response:**
```markdown
# Backend Server Setup

## Prerequisites

Make sure you have:
- [Node.js](https://nodejs.org) 16+ installed
- [Python](https://python.org) 3.11+ installed
- Firebase account with Firestore enabled

---

## Installation Steps

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Create a `.env` file:

```env
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret
```

### 3. Start Server

```bash
uvicorn main:app --reload
```

The server will start at `http://localhost:8000`

---

## Verify Installation

Test the API:

```bash
curl http://localhost:8000/api/v1/health
```

Expected response:

```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

> **Tip:** Use `--reload` flag for development. Remove it in production.
```

---

## 5. **Integration Status Report**

**Prompt:**
```
Show me all my connected integrations
```

**Expected AI Response:**
```markdown
# Connected Integrations

## ✅ Active Integrations (3)

### 1. Gmail
- **Status:** Connected
- **Email:** sy985798@gmail.com
- **Last Sync:** 2 minutes ago
- **Permissions:** Read, Send, Compose
- [View Settings](#)

### 2. Google Calendar
- **Status:** Connected  
- **Account:** sy985798@gmail.com
- **Last Sync:** 5 minutes ago
- **Permissions:** Read, Write, Create Events
- [View Settings](#)

### 3. Notion
- **Status:** Connected
- **Workspace:** Personal Workspace
- **Last Sync:** 10 minutes ago
- **Permissions:** Read, Write Pages
- [View Settings](#)

---

## 📊 Usage Statistics

| Integration | API Calls Today | Success Rate |
|-------------|-----------------|--------------|
| Gmail       | 47              | 98.5%        |
| Calendar    | 23              | 100%         |
| Notion      | 12              | 95.2%        |

---

> **All systems operational.** Last health check: *30 seconds ago*
```

---

## 6. **Meeting Creation Confirmation**

**Prompt:**
```
Create a meeting called "Sprint Planning" tomorrow at 10 AM with alice@example.com and bob@example.com
```

**Expected AI Response:**
```markdown
## ✅ Meeting Created Successfully

**Event Details:**

| Field | Value |
|-------|-------|
| **Title** | Sprint Planning |
| **Date** | Tomorrow (2026-09-07) |
| **Time** | 10:00 AM – 11:00 AM IST |
| **Duration** | 60 minutes |
| **Location** | Google Meet |

**Attendees:**
1. alice@example.com *(invitation sent)*
2. bob@example.com *(invitation sent)*

**Google Meet Link:**  
[https://meet.google.com/abc-defg-hij](https://meet.google.com/abc-defg-hij)

---

### What happened:
- ✅ Calendar event created (ID: `xyz123`)
- ✅ Google Meet link generated
- ✅ Email invitations sent to all attendees
- ✅ Calendar reminders set (30 min before)

> **Next steps:**  
> - [View event in calendar](#)
> - [Send custom message to attendees](#)
> - [Add agenda to description](#)
```

---

## 7. **Search Results Across Platforms**

**Prompt:**
```
Search for "budget" across my emails, calendar, and Notion
```

**Expected AI Response:**
```markdown
# Search Results for "budget"

Found **7 results** across 3 platforms:

---

## 📧 Gmail (3 results)

1. **Q4 Budget Review**  
   From: *Finance Team* • *3 days ago*  
   > "Attached is the preliminary budget for Q4. Please review..."

2. **RE: Budget Approval**  
   From: *Manager* • *1 week ago*  
   > "The budget has been approved. Moving forward with..."

3. **FW: Department Budget 2026**  
   From: *HR* • *2 weeks ago*  
   > "Please see the updated budget allocations below..."

---

## 📅 Google Calendar (2 results)

| Date | Time | Event |
|------|------|-------|
| Sep 10 | 2:00 PM | **Budget Planning Meeting** |
| Sep 15 | 10:00 AM | **Q4 Budget Review** |

---

## 📓 Notion (2 results)

1. **[2026 Budget Planning](notion://page/123)**  
   *Last edited: 4 days ago*  
   Database: Finance

2. **[Department Budget Breakdown](notion://page/456)**  
   *Last edited: 1 week ago*  
   Database: Admin

---

> Search completed in *0.8 seconds* across [Gmail], [Google Calendar], [Notion]
```

---

## 8. **Help Command with Formatting**

**Prompt:**
```
How do I use this AI assistant?
```

**Expected AI Response:**
```markdown
# WorkPilot AI - Quick Start Guide

I'm your AI Chief of Staff. Here's what I can do:

---

## 📧 Email Management

- `Show me today's emails`
- `Draft a reply to [person]`
- `Send email to [email] about [topic]`
- `Show me unread emails`

## 📅 Calendar Operations

- `What's on my calendar?`
- `Create a meeting [title] at [time]`
- `Find available time for meeting`
- `Schedule with [attendees]`

## 📓 Notion Integration

- `Show my Notion databases`
- `Search Notion for [query]`
- `Create a page titled [title]`
- `Add to database [name]`

## 🔍 Search & Analysis

- `Search for [term] across all platforms`
- `Give me my morning briefing`
- `Summarize emails from this week`
- `Generate weekly report`

---

## 💡 Pro Tips

> **Tip 1:** Be specific with dates and times  
> Example: *"Create meeting tomorrow at 3 PM"* is better than *"Schedule a meeting soon"*

> **Tip 2:** Mention attendees explicitly  
> Example: *"with alice@example.com and bob@example.com"*

> **Tip 3:** Check integration status  
> Use: `Show me connected integrations`

---

## 🆘 Need Help?

- Type `help` for this guide
- Type `integrations` to check connections
- Type `status` for system health

**Have questions?** Just ask naturally!  
Example: *"Why can't I send emails?"* or *"How do I reconnect Gmail?"*
```

---

## Test All Examples

Copy each prompt above and paste it into AI Cockpit. The responses will use the enhanced markdown rendering with:

✅ Beautiful tables  
✅ Code blocks with syntax highlighting  
✅ Inline code formatting  
✅ Clickable links  
✅ Numbered and bullet lists  
✅ Block quotes for tips  
✅ Headers for structure  
✅ Horizontal rules for sections  
✅ Bold and italic emphasis  

**Enjoy the professional, readable responses!** 🎨✨
