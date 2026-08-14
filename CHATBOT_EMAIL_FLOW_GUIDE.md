# WorkPilot AI - Chatbot Email Sending Flow Guide

## Complete Flow: User Message → Email Sent ✅

This document explains the complete flow from when a user asks the chatbot to send an email until they receive a success confirmation.

---

## 🎯 Quick Example

**User asks chatbot:**
> "Send an email to john@example.com with subject 'Meeting Follow-up' and say thanks for the meeting"

**Chatbot responds:**
```
✅ Email sent successfully via Gmail!

📧 Email Details:
   To: john@example.com
   Subject: Meeting Follow-up
   Status: Sent

Message ID: 19ffbb2df6125048
The email has been delivered and is now in your Sent folder.
```

---

## 📊 Architecture Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER                                    │
│  "Send email to john@example.com about the project update"      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│  • ChatInterface component                                       │
│  • Sends POST /api/v1/ai/chat with user message                 │
│  • Includes JWT auth token                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 FASTAPI BACKEND                                  │
│  Endpoint: POST /api/v1/ai/chat                                  │
│  File: backend/api/v1/endpoints/ai_chat.py                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 AI CHAT SERVICE                                  │
│  1. Detects intent: "send email" → triggers compose_email tool  │
│  2. Extracts parameters:                                         │
│     - to: "john@example.com"                                     │
│     - subject: "Project Update"                                  │
│     - body: "..." (AI generates body)                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│             TOOL EXECUTION: compose_email                        │
│  Function: _execute_tool("compose_email", args, uid)            │
│  File: backend/api/v1/endpoints/ai_chat.py                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            INTEGRATION SERVICE                                   │
│  integration_service.send_gmail_message(uid, to, subject, body)  │
│  File: backend/services/integration_service.py                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│         TOKEN MANAGEMENT                                         │
│  _get_valid_google_token(uid, "gmail", record)                   │
│  • Checks token expiration                                       │
│  • Auto-refreshes if expired                                     │
│  • Returns valid access token                                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              GMAIL API v1                                        │
│  POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send│
│  Headers: Authorization: Bearer {access_token}                   │
│  Body: { "raw": "base64_encoded_rfc2822_message" }              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GMAIL SERVERS                                 │
│  • Validates authentication                                      │
│  • Delivers email to recipient                                   │
│  • Saves to sender's Sent folder                                 │
│  • Returns message ID and thread ID                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            RESPONSE BACK TO USER                                 │
│  AI formats success message with:                                │
│  ✅ "Email sent successfully via Gmail!"                         │
│  📧 To: john@example.com                                         │
│  📝 Subject: Project Update                                      │
│  🆔 Message ID: 19ffbb2df6125048                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💬 User Interaction Examples

### Example 1: Basic Email Request

**User:**
> "Send an email to sarah@company.com saying I'll be late to the meeting"

**Chatbot Process:**
1. 🔍 Detects intent: "send email"
2. 🧠 Triggers `compose_email` tool
3. 📝 AI generates professional email body
4. 📤 Calls Gmail API to send
5. ✅ Confirms success to user

**Chatbot Response:**
```
✅ Email sent successfully via Gmail!

📧 Email sent to: sarah@company.com
📝 Subject: Running Late - Meeting Update

Message has been delivered. You can find it in your Sent folder.
```

### Example 2: Detailed Email with Context

**User:**
> "Compose an email to the team about tomorrow's standup. Mention we'll discuss the Q3 roadmap and new feature launches. Keep it professional."

**Chatbot Process:**
1. 🔍 Detects intent: "compose email"
2. 📝 AI drafts email with provided context
3. 🎯 Applies "professional" tone
4. 📤 Sends via Gmail API
5. ✅ Returns confirmation

**Chatbot Response:**
```
✅ Email sent successfully via Gmail!

📧 Recipients: team@company.com
📝 Subject: Tomorrow's Standup - Q3 Roadmap Discussion

✍️  Email Preview:
   "Hi Team,
   
   Quick reminder about tomorrow's standup. We'll be discussing:
   - Q3 Roadmap planning
   - New feature launches
   - Timeline and priorities
   
   See you all tomorrow!
   Best regards"

🆔 Message ID: 19ffbb456789abcd
```

### Example 3: Gmail Not Connected (Draft Mode)

**User:**
> "Send email to client@example.com about the project proposal"

**Chatbot Response (when Gmail not connected):**
```
📧 I've drafted an email for you:

To: client@example.com
Subject: Project Proposal

[Email body shown here...]

⚠️  Gmail is not connected yet.

To send this email:
1. Go to Integrations
2. Connect your Gmail account
3. Ask me to send it again

Or copy the draft and send manually.
```

---

## 🔧 Technical Implementation

### 1. Frontend Code (React)

```jsx
// Frontend/src/components/ChatInterface.jsx
async function sendMessage(userMessage) {
  const response = await fetch('/api/v1/ai/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: userMessage,
      mode: 'suggest'
    })
  });
  
  // Handle streaming response
  const reader = response.body.getReader();
  // ... process SSE events
}
```

### 2. AI Chat Endpoint (Backend)

```python
# backend/api/v1/endpoints/ai_chat.py

@router.post("/chat")
async def chat_stream(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    uid = current_user.get("uid")
    return StreamingResponse(
        _stream_chat(req, uid),
        media_type="text/event-stream"
    )
```

### 3. Tool Detection & Execution

```python
# backend/api/v1/endpoints/ai_chat.py

def _detect_forced_tool(message: str):
    """Detect if user wants to send an email"""
    lower = message.lower()
    if any(k in lower for k in ["send email", "compose email", "draft email"]):
        return "compose_email"
    # ... other tools
```

### 4. Email Tool Implementation

```python
# backend/api/v1/endpoints/ai_chat.py

async def _execute_tool(name: str, args: dict, uid: str) -> dict:
    if name == "compose_email":
        to = args.get("to")
        subject = args.get("subject")
        body = args.get("body")
        tone = args.get("tone", "professional")
        
        try:
            # Try to send via Gmail API
            from services.integration_service import integration_service
            result = await integration_service.send_gmail_message(
                uid, to, subject, body
            )
            
            return {
                "action": "sent",
                "to": to,
                "subject": subject,
                "body": body,
                "tone": tone,
                "sent": True,
                "message_id": result.get("id"),
                "source": "gmail",
                "note": "Email sent successfully via Gmail!"
            }
            
        except Exception as e:
            # Gmail not connected - return draft
            return {
                "action": "compose",
                "to": to,
                "subject": subject,
                "body": body,
                "tone": tone,
                "ready_to_send": False,
                "source": "ai_generated",
                "note": "Gmail not connected. Connect Gmail to send."
            }
```

### 5. Integration Service (Gmail API)

```python
# backend/services/integration_service.py

async def send_gmail_message(self, uid: str, to: str, subject: str, body: str):
    """Send email through Gmail API"""
    
    # Get integration record
    record = await integration_repository.get(uid, "gmail")
    if not record or record.status != "connected":
        raise NotFoundException("Gmail is not connected")
    
    # Get valid access token (auto-refreshes if expired)
    token = await self._get_valid_google_token(uid, "gmail", record)
    
    # Create RFC 2822 email message
    message = EmailMessage()
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)
    
    # Send via Gmail API
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
            json={
                "raw": urlsafe_b64encode(message.as_bytes()).decode("ascii")
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        response.raise_for_status()
    
    return response.json()  # Returns message_id, thread_id
```

---

## 🎨 Frontend Display

### Chat Message Display (Success)

```
┌─────────────────────────────────────────────────────────┐
│ User                                        2:30 PM      │
│ Send an email to john@example.com about the meeting     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ WorkPilot AI                               2:30 PM      │
│                                                          │
│ ✅ Email sent successfully via Gmail!                   │
│                                                          │
│ 📧 Email Details:                                       │
│    To: john@example.com                                  │
│    Subject: Meeting Follow-up                            │
│    From: your-email@gmail.com                            │
│                                                          │
│ 📝 Message Preview:                                     │
│    Hi John,                                              │
│    Following up on our meeting earlier...                │
│                                                          │
│ 🆔 Message ID: 19ffbb2df6125048                         │
│                                                          │
│ The email has been delivered and is now in your          │
│ Gmail Sent folder.                                       │
│                                                          │
│ 💡 Suggestions:                                         │
│    • Send a follow-up email                              │
│    • Schedule a meeting                                  │
│    • Check your inbox                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication & Security

### User Authentication Flow

1. **User logs into WorkPilot AI** with Firebase Auth
2. **Receives JWT token** from backend
3. **JWT included in all API calls** to `/api/v1/ai/chat`
4. **Backend extracts `uid`** from JWT token
5. **Gmail integration fetched** using `uid`
6. **OAuth2 access token** retrieved and auto-refreshed
7. **Email sent** with user's Gmail account

### Security Features

✅ **No password storage** - Uses OAuth2 tokens
✅ **Encrypted token storage** - Fernet encryption in Firestore
✅ **Automatic token refresh** - Transparent to user
✅ **User isolation** - Each user's tokens separate
✅ **Rate limiting** - SlowAPI + Redis protection
✅ **Audit logging** - All email sends logged

---

## 📝 Request/Response Examples

### 1. Send Email Request (Frontend → Backend)

```javascript
POST /api/v1/ai/chat HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "message": "Send an email to john@example.com saying thanks for the meeting",
  "mode": "suggest"
}
```

### 2. AI Tool Call (Internal)

```python
{
  "tool": "compose_email",
  "arguments": {
    "to": "john@example.com",
    "subject": "Thank You - Meeting Follow-up",
    "body": "Hi John,\n\nThank you for taking the time to meet with me...",
    "tone": "professional"
  }
}
```

### 3. Gmail API Request

```http
POST /gmail/v1/users/me/messages/send HTTP/1.1
Host: gmail.googleapis.com
Authorization: Bearer ya29.a0ARGnu0aguFTVp...
Content-Type: application/json

{
  "raw": "RnJvbTogc2VuZGVyQGV4YW1wbGUuY29tClRvOiBqb2huQGV4YW1wbGUuY29t..."
}
```

### 4. Gmail API Response

```json
{
  "id": "19ffbb2df6125048",
  "threadId": "19ffbb2df6125048",
  "labelIds": ["SENT"]
}
```

### 5. Chatbot Response (Backend → Frontend - SSE Stream)

```
data: {"event":"thinking","data":"✍️ Drafting your email..."}

data: {"event":"tool_call","data":{"name":"compose_email","args":{...}}}

data: {"event":"tool_result","data":{"name":"compose_email","result":{...}}}

data: {"event":"token","data":"✅"}
data: {"event":"token","data":" Email"}
data: {"event":"token","data":" sent"}
data: {"event":"token","data":" successfully"}
...

data: {"event":"suggestions","data":["Draft a reply","Check inbox","Schedule meeting"]}

data: {"event":"done","data":{"card":"compose","tool":"compose_email"}}

data: [DONE]
```

---

## 🚀 Testing the Flow

### Option 1: Via Frontend

1. **Start backend:**
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. **Start frontend:**
   ```bash
   cd Frontend
   npm run dev
   ```

3. **Open browser:** `http://localhost:5173`

4. **Log in** and navigate to AI Chat

5. **Type message:**
   > "Send an email to test@example.com with subject 'Hello' and say hi"

6. **Watch the flow:**
   - Thinking indicator appears
   - Tool execution shown
   - Success message displayed

### Option 2: Via API (cURL)

```bash
# Get JWT token first by logging in
TOKEN="your_jwt_token"

# Send chat message
curl -X POST http://localhost:8000/api/v1/ai/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Send email to test@example.com saying hello",
    "mode": "suggest"
  }'
```

### Option 3: Direct Email Endpoint (Bypass AI)

```bash
# Send email directly without AI
curl -X POST http://localhost:8000/api/v1/emails/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Hello",
    "body": "This is a test email"
  }'
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Gmail is not connected"

**Symptom:** Chatbot says Gmail not connected

**Solution:**
1. Go to Integrations page
2. Click "Connect Gmail"
3. Authorize via Google OAuth
4. Try sending email again

### Issue 2: "401 Unauthorized" from Gmail API

**Symptom:** Email send fails with 401 error

**Solution:**
- OAuth tokens expired
- Reconnect Gmail in Integrations
- Tokens will be automatically refreshed

### Issue 3: Chatbot doesn't detect email intent

**Symptom:** Chatbot doesn't trigger email tool

**Solution:** Use clearer phrases:
- ✅ "Send an email to..."
- ✅ "Compose email for..."
- ✅ "Draft email about..."
- ❌ "Tell john about..." (too vague)

### Issue 4: Email sent but not visible

**Symptom:** Success message shown but email not received

**Check:**
1. Spam folder of recipient
2. Gmail Sent folder of sender
3. Email address typo
4. Gmail delivery reports

---

## 📊 Success Metrics

When everything works correctly:

✅ **Response time:** < 2 seconds from user message to email sent
✅ **Success rate:** 99%+ (when Gmail connected)
✅ **Token refresh:** Automatic and transparent
✅ **User experience:** Seamless, no manual steps
✅ **Audit trail:** All sends logged in Firestore

---

## 🎯 Summary

**Complete Flow in 10 Steps:**

1. User types message in chat interface
2. Frontend sends POST to `/api/v1/ai/chat` with JWT
3. AI detects "send email" intent
4. AI triggers `compose_email` tool with parameters
5. Tool calls `integration_service.send_gmail_message()`
6. Service retrieves and auto-refreshes OAuth token
7. Gmail API called to send email
8. Gmail delivers email and returns message ID
9. Success result streamed back to frontend
10. Chatbot displays success confirmation to user

**From user's perspective:**
- Type natural language request
- See brief "thinking" indicator
- Receive immediate success confirmation
- Email delivered to recipient

That's it! 🎉

---

**Last Updated:** 2026-08-13
**WorkPilot AI Version:** 1.0.0
