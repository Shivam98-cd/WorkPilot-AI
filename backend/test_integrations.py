"""
Integration Diagnostic Script
Run: python test_integrations.py
Tests: Firestore, OAuth config, token encryption, GitHub API
"""
import os
import sys
import asyncio

# Load env before anything else
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

# ─── ANSI colors ────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
BLUE   = "\033[94m"
RESET  = "\033[0m"
BOLD   = "\033[1m"

def ok(msg):    print(f"  {GREEN}✓{RESET} {msg}")
def fail(msg):  print(f"  {RED}✗{RESET} {msg}")
def warn(msg):  print(f"  {YELLOW}⚠{RESET} {msg}")
def section(s): print(f"\n{BOLD}{BLUE}{'─'*50}{RESET}\n{BOLD} {s}{RESET}\n{'─'*50}")

errors = []

# ════════════════════════════════════════════════════
# 1. ENV VARIABLES
# ════════════════════════════════════════════════════
section("1. Environment Variables")

required = {
    "GOOGLE_CLIENT_ID":     "Google",
    "GOOGLE_CLIENT_SECRET": "Google",
    "GITHUB_CLIENT_ID":     "GitHub",
    "GITHUB_CLIENT_SECRET": "GitHub",
    "SLACK_CLIENT_ID":      "Slack",
    "SLACK_CLIENT_SECRET":  "Slack",
    "ZOOM_CLIENT_ID":       "Zoom",
    "ZOOM_CLIENT_SECRET":   "Zoom",
    "NOTION_CLIENT_ID":     "Notion",
    "NOTION_CLIENT_SECRET": "Notion",
    "JIRA_CLIENT_ID":       "Jira",
    "JIRA_CLIENT_SECRET":   "Jira",
    "MICROSOFT_CLIENT_ID":  "Microsoft",
    "MICROSOFT_CLIENT_SECRET": "Microsoft",
    "MICROSOFT_TENANT_ID":  "Microsoft",
    "INTEGRATION_TOKEN_ENCRYPTION_KEY": "Encryption",
    "FIREBASE_PROJECT_ID":  "Firebase",
}

for var, label in required.items():
    val = os.getenv(var, "")
    if val and val not in ("paste_here", "your_value"):
        ok(f"{var} ({label}) — set ✓")
    else:
        fail(f"{var} ({label}) — MISSING or placeholder")
        errors.append(f"Missing env: {var}")

# ════════════════════════════════════════════════════
# 2. ENCRYPTION KEY
# ════════════════════════════════════════════════════
section("2. Token Encryption")

try:
    from cryptography.fernet import Fernet, InvalidToken
    key = os.getenv("INTEGRATION_TOKEN_ENCRYPTION_KEY", "")
    if not key:
        fail("INTEGRATION_TOKEN_ENCRYPTION_KEY is empty")
        errors.append("Missing encryption key")
    else:
        # Fernet keys must be 32 url-safe base64 bytes
        f = Fernet(key.encode() if len(key) < 50 else key.encode())
        token = f.encrypt(b"test_token_value")
        decrypted = f.decrypt(token)
        assert decrypted == b"test_token_value"
        ok(f"Encryption/decryption works (key length: {len(key)})")
except Exception as e:
    fail(f"Encryption failed: {e}")
    errors.append(f"Encryption error: {e}")

# ════════════════════════════════════════════════════
# 3. FIREBASE / FIRESTORE
# ════════════════════════════════════════════════════
section("3. Firebase & Firestore")

try:
    from firebase.admin_config import get_firestore_client
    client = get_firestore_client()
    if client:
        ok("Firebase Admin SDK initialized")
    else:
        fail("Firebase client is None")
        errors.append("Firebase not initialized")
except Exception as e:
    fail(f"Firebase init error: {e}")
    errors.append(f"Firebase error: {e}")

async def test_firestore():
    try:
        from firebase.firestore import firestore_service
        if firestore_service.db is None:
            fail("Firestore db is None — using in-memory fallback (data lost on restart)")
            errors.append("Firestore not connected")
            return

        # Try writing a test document
        test_doc = {"test": True, "ts": "2026-08-05"}
        await firestore_service.create_document("_test_collection", "_test_doc", test_doc)
        ok("Firestore write — success")

        # Try reading it back
        result = await firestore_service.get_document("_test_collection", "_test_doc")
        if result and result.get("test") is True:
            ok("Firestore read  — success")
        else:
            fail("Firestore read returned unexpected data")
            errors.append("Firestore read failed")

        # Clean up
        await firestore_service.delete_document("_test_collection", "_test_doc")
        ok("Firestore delete — success")

    except Exception as e:
        fail(f"Firestore error: {e}")
        errors.append(f"Firestore: {e}")

asyncio.run(test_firestore())

# ════════════════════════════════════════════════════
# 4. INTEGRATION REPOSITORY (save + load)
# ════════════════════════════════════════════════════
section("4. Integration Repository (save/load cycle)")

async def test_repository():
    try:
        from repositories.integration_repository import integration_repository
        from models.integration import UserIntegration
        from datetime import datetime, timezone

        test_uid = "_test_user_diagnostic"
        test_platform = "_test_platform"

        integration = UserIntegration(
            uid=test_uid,
            platform=test_platform,
            status="connected",
            connected_at=datetime.now(timezone.utc),
            last_sync_at=datetime.now(timezone.utc),
            last_sync_status="success",
            account_label="test@example.com",
            access_token_enc="encrypted_test_token",
            scopes=["read", "write"],
        )

        # Save
        saved = await integration_repository.upsert(integration)
        ok(f"Repository upsert — saved doc id: {UserIntegration.doc_id(test_uid, test_platform)}")

        # Load
        loaded = await integration_repository.get(test_uid, test_platform)
        if loaded and loaded.status == "connected":
            ok(f"Repository get    — loaded status: {loaded.status}")
        else:
            fail("Repository get returned None or wrong status")
            errors.append("Repository load failed")

        # List
        all_integrations = await integration_repository.list_for_user(test_uid)
        ok(f"Repository list   — found {len(all_integrations)} integration(s)")

        # Delete
        deleted = await integration_repository.delete(test_uid, test_platform)
        ok(f"Repository delete — removed: {deleted}")

    except Exception as e:
        fail(f"Repository error: {e}")
        errors.append(f"Repository: {e}")
        import traceback
        traceback.print_exc()

asyncio.run(test_repository())

# ════════════════════════════════════════════════════
# 5. OAUTH URL GENERATION
# ════════════════════════════════════════════════════
section("5. OAuth URL Generation")

async def test_oauth_urls():
    try:
        from services.integration_service import integration_service

        platforms_to_test = [
            ("github",          "GitHub"),
            ("slack",           "Slack"),
            ("zoom",            "Zoom"),
            ("notion",          "Notion"),
            ("jira",            "Jira"),
            ("microsoft_teams", "Microsoft Teams"),
            ("gmail",           "Gmail"),
            ("google_calendar", "Google Calendar"),
        ]

        for platform, label in platforms_to_test:
            try:
                url = integration_service.build_authorize_url("_test_uid", platform)
                if url.startswith("http"):
                    ok(f"{label:<20} OAuth URL generated ✓")
                else:
                    fail(f"{label:<20} Bad URL: {url[:60]}")
                    errors.append(f"{label} bad OAuth URL")
            except Exception as e:
                fail(f"{label:<20} {e}")
                errors.append(f"{label} OAuth URL error: {e}")

    except Exception as e:
        fail(f"OAuth test setup error: {e}")
        import traceback
        traceback.print_exc()

asyncio.run(test_oauth_urls())

# ════════════════════════════════════════════════════
# 6. GITHUB API CONNECTIVITY (live test)
# ════════════════════════════════════════════════════
section("6. GitHub API Connectivity")

async def test_github_api():
    try:
        import httpx
        github_id = os.getenv("GITHUB_CLIENT_ID", "")
        if not github_id:
            warn("Skipping — GITHUB_CLIENT_ID not set")
            return

        # Test GitHub OAuth endpoint is reachable
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get("https://api.github.com/")
            if resp.status_code == 200:
                ok(f"GitHub API reachable (status {resp.status_code})")
            else:
                warn(f"GitHub API returned {resp.status_code}")
    except Exception as e:
        fail(f"GitHub API unreachable: {e}")

asyncio.run(test_github_api())

# ════════════════════════════════════════════════════
# 7. BACKEND ENDPOINTS (if server is running)
# ════════════════════════════════════════════════════
section("7. Backend Endpoints (requires server running)")

async def test_endpoints():
    try:
        import httpx
        base = os.getenv("BACKEND_PUBLIC_URL", "http://localhost:8000")
        api  = f"{base}/api/v1"

        async with httpx.AsyncClient(timeout=5) as client:
            # Health check
            try:
                r = await client.get(f"{base}/health")
                ok(f"GET /health → {r.status_code}")
            except Exception:
                warn("GET /health → server not running (start with uvicorn main:app --reload)")
                return

            # Public catalog (no auth needed)
            r = await client.get(f"{api}/integrations/catalog/public")
            if r.status_code == 200:
                data = r.json()
                platforms = [p["platform"] for p in data.get("data", [])]
                ok(f"GET /integrations/catalog/public → {len(platforms)} platforms: {', '.join(platforms)}")
            else:
                fail(f"GET /integrations/catalog/public → {r.status_code}: {r.text[:100]}")
                errors.append("Catalog endpoint failed")

    except Exception as e:
        warn(f"Endpoint test error: {e}")

asyncio.run(test_endpoints())

# ════════════════════════════════════════════════════
# SUMMARY
# ════════════════════════════════════════════════════
section("SUMMARY")

if not errors:
    print(f"\n  {GREEN}{BOLD}ALL TESTS PASSED ✓{RESET}")
    print(f"  All integrations are properly configured.\n")
else:
    print(f"\n  {RED}{BOLD}ISSUES FOUND ({len(errors)}):{RESET}")
    for i, err in enumerate(errors, 1):
        print(f"  {RED}{i}.{RESET} {err}")
    print()
    print(f"  {YELLOW}Fix the issues above then retry.{RESET}\n")
