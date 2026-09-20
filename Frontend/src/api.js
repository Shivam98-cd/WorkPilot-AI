import { auth } from './firebase';

export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';


/* ─── Auth helpers ─────────────────────────────────────────────────────────── */

let _cachedHeaders = null;
let _cachedHeadersAt = 0;
const HEADER_CACHE_MS = 60_000;
let _refreshInFlight = null;

// ── Token priming ─────────────────────────────────────────────────────────────
// Call primeAuthToken() right after Firebase auth state resolves (in App.jsx).
// This kicks off a background header fetch so the FIRST api call has zero
// Firebase overhead — it just awaits an already-resolved promise.
let _primedHeadersPromise = null;

export function primeAuthToken() {
  _primedHeadersPromise = getAuthHeaders(true).catch(() => null);
}

function isJwtExpired(token) {
  if (!token || typeof token !== 'string') return true;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && (payload.exp * 1000) <= (Date.now() + 10_000)) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

export async function getFirebaseToken(force = false) {
  try {
    if (typeof auth.authStateReady === 'function') {
      await withTimeout(auth.authStateReady(), 3000, 'authStateReady').catch(() => null);
    }
    const user = auth.currentUser;
    if (user) {
      return await withTimeout(user.getIdToken(force), 6000, 'getIdToken').catch(() => null);
    }
  } catch (err) {
    console.warn('⚠️ getFirebaseToken failed:', err?.message || err);
  }
  return null;
}

export function clearAuthCache() {
  _cachedHeaders = null;
  _cachedHeadersAt = 0;
  _primedHeadersPromise = null;
  _swr.clear();
}

export async function getAuthHeaders(force = false) {
  if (!force && _cachedHeaders && _cachedHeaders.Authorization && (Date.now() - _cachedHeadersAt < HEADER_CACHE_MS)) {
    return _cachedHeaders;
  }

  let headers = { 'Content-Type': 'application/json' };

  // 1. Try Firebase token first (modern Firebase SDK with authStateReady)
  const firebaseToken = await getFirebaseToken(force);
  if (firebaseToken) {
    headers = { 'Authorization': `Bearer ${firebaseToken}`, 'Content-Type': 'application/json' };
  } else {
    // 2. Fallback to localStorage wp_tokens if available and not expired
    try {
      const tokens = JSON.parse(localStorage.getItem('wp_tokens') || 'null');
      if (tokens?.accessToken && !isJwtExpired(tokens.accessToken)) {
        headers = { 'Authorization': `Bearer ${tokens.accessToken}`, 'Content-Type': 'application/json' };
      }
    } catch {}
  }

  // CRITICAL: NEVER cache unauthenticated headers! Only cache if Authorization header exists.
  if (headers.Authorization) {
    _cachedHeaders = headers;
    _cachedHeadersAt = Date.now();
  } else {
    _cachedHeaders = null;
    _cachedHeadersAt = 0;
  }

  return headers;
}

export async function refreshAccessToken() {
  if (_refreshInFlight) return _refreshInFlight;

  _refreshInFlight = (async () => {
    const tokens = JSON.parse(localStorage.getItem('wp_tokens') || 'null');
    if (!tokens?.refreshToken) throw new Error('No refresh token');
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });
    if (!res.ok) throw new Error('Token refresh failed');
    const data = await res.json();
    if (data.success && data.data) {
      const newTokens = {
        accessToken: data.data.accessToken || data.data,
        refreshToken: data.data.refreshToken || tokens.refreshToken,
      };
      localStorage.setItem('wp_tokens', JSON.stringify(newTokens));
      clearAuthCache();
      return newTokens.accessToken;
    }
    throw new Error('Refresh failed');
  })();

  try {
    return await _refreshInFlight;
  } finally {
    _refreshInFlight = null;
  }
}

// Hard timeout (ms) for each API call — generous timeout prevents false aborts
// on external OAuth integrations (Gmail, Google Calendar).
const API_TIMEOUT_MS = 25_000;
// Hard timeout for the token-refresh flow — backend refresh can hang if
// Firestore SSL is retrying (seen as 287-second Duration in logs).
const REFRESH_TIMEOUT_MS = 10_000;

/** Wrap a promise with a hard timeout that rejects after `ms` milliseconds. */
function withTimeout(promise, ms, label = 'request') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

async function apiFetch(url, options = {}) {
  // Use primed token promise if available (avoids per-request Firebase overhead)
  let headers = await (_primedHeadersPromise || getAuthHeaders());
  // Reset primed promise after first use so subsequent calls use getAuthHeaders normally
  _primedHeadersPromise = null;
  let res;

  // ── First attempt with a hard timeout ────────────────────────────────────
  const timeoutDuration = options.timeout || API_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), timeoutDuration);
  try {
    res = await fetch(`${API_BASE}${url}`, {
      ...options,
      signal: controller.signal,
      headers: { ...headers, ...options.headers },
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Request to ${url} timed out. Is the backend running at ${API_BASE}?`);
    }
    throw new Error(`Cannot reach the API at ${API_BASE}. Start the backend: cd backend && uvicorn main:app --reload --port 8000`);
  }
  clearTimeout(timeoutId);

  // ── Token refresh on 401 or 403 ─────────────────────────────────────────────
  if (res.status === 401 || res.status === 403) {
    clearAuthCache();
    // 1. Try refreshing via Firebase user first
    try {
      const freshFbToken = await getFirebaseToken(true);
      if (freshFbToken) {
        headers = { 'Authorization': `Bearer ${freshFbToken}`, 'Content-Type': 'application/json' };
        _cachedHeaders = headers;
        _cachedHeadersAt = Date.now();

        const retryCtrl = new AbortController();
        const retryTid = setTimeout(() => retryCtrl.abort(), API_TIMEOUT_MS);
        try {
          res = await fetch(`${API_BASE}${url}`, {
            ...options,
            signal: retryCtrl.signal,
            headers: { ...headers, ...options.headers },
          });
        } finally {
          clearTimeout(retryTid);
        }
      }
    } catch {}

    // 2. If still 401 or 403, try backend refresh token
    if (res.status === 401 || res.status === 403) {
      try {
        await withTimeout(refreshAccessToken(), REFRESH_TIMEOUT_MS, 'token-refresh');
        headers = await getAuthHeaders(true);
        const ctrl2 = new AbortController();
        const tid2   = setTimeout(() => ctrl2.abort(), API_TIMEOUT_MS);
        try {
          res = await fetch(`${API_BASE}${url}`, {
            ...options,
            signal: ctrl2.signal,
            headers: { ...headers, ...options.headers },
          });
        } finally {
          clearTimeout(tid2);
        }
      } catch {
        // Refresh failed or timed out — let the original 401 propagate below
      }
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || err.error?.message || `Request failed (${res.status})`);
  }
  return res.json();
}

/* ─── Auth endpoints ───────────────────────────── */

export async function backendGoogleAuth(idToken) {
  return apiFetch('/auth/google', { method: 'POST', body: JSON.stringify({ idToken }) });
}

export async function backendFirebaseAuth(idToken) {
  return backendGoogleAuth(idToken);
}

export async function backendLogin(email, password) {
  return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password, deviceFingerprint: navigator.userAgent }) });
}

export async function backendRegister(name, email, password) {
  return apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
}

export async function backendLogout() {
  try {
    let token = null;
    try {
      const tokens = JSON.parse(localStorage.getItem('wp_tokens') || 'null');
      token = tokens?.accessToken;
    } catch {}

    if (!token && auth?.currentUser) {
      token = await Promise.race([
        auth.currentUser.getIdToken(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000)),
      ]).catch(() => null);
    }

    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 2000);

    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers,
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(tid);
  } catch {
    // Ignore all errors during logout
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('wp-user-signed-out', () => {
    clearAuthCache();
    backendLogout().catch(() => {});
  });
}

export async function getProfile() {
  return apiFetch('/users/profile');
}

export async function getSessions() {
  return apiFetch('/auth/sessions');
}

// ── Stale-While-Revalidate (SWR) page-level cache ────────────────────────────
// Returns stale data instantly on revisit while silently fetching fresh data.
// Cache is keyed by URL; TTL is 60 s for list pages (configurable per endpoint).
// Write-through mutations (send/delete/star) invalidate the relevant keys.
const _swr = new Map();   // key -> { data, ts, inflight }
const SWR_TTL = 60_000;  // 60 s default

function _swrKey(url, ...args) {
  return [url, ...args.filter(Boolean)].join('|');
}

async function _swrFetch(key, ttl, fetcher) {
  const now = Date.now();
  const hit = _swr.get(key);

  if (hit) {
    const age = now - hit.ts;
    if (age < ttl) {
      // Fresh — return immediately, no background fetch
      return hit.data;
    }
    // Stale — return old data instantly AND kick off background refresh
    if (!hit.inflight) {
      hit.inflight = fetcher()
        .then(fresh => { _swr.set(key, { data: fresh, ts: Date.now(), inflight: null }); })
        .catch(() => { if (hit) hit.inflight = null; });
    }
    return hit.data;
  }

  // Cache miss — fetch synchronously and populate
  const data = await fetcher();
  _swr.set(key, { data, ts: Date.now(), inflight: null });
  return data;
}

export function invalidateSwrKey(...parts) {
  _swr.delete(_swrKey(...parts));
}

export function invalidateSwrPrefix(prefix) {
  for (const k of _swr.keys()) {
    if (k.startsWith(prefix)) _swr.delete(k);
  }
}

/* ─── Email ─────────────────────────────────────── */
export const getEmails = (folder = 'inbox', q = '', limit = 25) => {
  const params = new URLSearchParams({ folder, limit });
  if (q) params.set('q', q);
  const url = `/emails?${params}`;
  return _swrFetch(_swrKey('emails', folder, q, limit), SWR_TTL, () => apiFetch(url));
};

// Fetch the full body of a single email lazily (called when user opens it)
export const getEmailBody = (id) => apiFetch(`/emails/${id}/body`);

export const getEmailCounts = () => {
  return _swrFetch('email_counts', SWR_TTL, () => apiFetch('/emails/counts'));
};
export const markEmailRead   = (id, read = true) => { invalidateSwrPrefix('emails'); return apiFetch(`/emails/${id}/read`, { method: 'PUT', body: JSON.stringify({ read }) }); };
export const markEmailUnread = (id) => { invalidateSwrPrefix('emails'); return apiFetch(`/emails/${id}/read`, { method: 'PUT', body: JSON.stringify({ read: false }) }); };
export const archiveEmail    = (id) => { invalidateSwrPrefix('emails'); return apiFetch(`/emails/${id}/archive`, { method: 'POST' }); };
export const deleteEmail     = (id) => { invalidateSwrPrefix('emails'); return apiFetch(`/emails/${id}`, { method: 'DELETE' }); };
export const starEmail       = (id, starred = true) => apiFetch(`/emails/${id}/star`, { method: 'POST', body: JSON.stringify({ starred }) });
export const draftEmail      = (body) => apiFetch('/emails/draft', { method: 'POST', body: JSON.stringify(body) });
export const sendEmail       = (body) => { invalidateSwrPrefix('emails'); return apiFetch('/emails/send',  { method: 'POST', body: JSON.stringify(body) }); };
export const triageEmails    = () => apiFetch('/emails/triage', { method: 'POST' });


/* ─── Calendar ──────────────────────────────────── */
export const getCalendarEvents = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const url = `/calendar/events${query ? `?${query}` : ''}`;
  return _swrFetch(_swrKey('calendar', query), SWR_TTL, () => apiFetch(url));
};
export const createCalendarEvent = (ev) => { invalidateSwrKey('calendar', ''); return apiFetch('/calendar/events', { method: 'POST', body: JSON.stringify(ev) }); };
export const deleteCalendarEvent = (id) => { invalidateSwrPrefix('calendar'); return apiFetch(`/calendar/events/${id}`, { method: 'DELETE' }); };
export const aiScheduleEvent = (prompt) => apiFetch('/calendar/ai-schedule', { method: 'POST', body: JSON.stringify({ prompt }) });

/* ─── Team ──────────────────────────────────────── */
export const getTeamMembers = () => apiFetch('/team/members');
export const createTeamMember = (data) => apiFetch('/team/members', { method: 'POST', body: JSON.stringify(data) });
export const updateTeamMember = (id, data) => apiFetch(`/team/members/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTeamMember = (id) => apiFetch(`/team/members/${id}`, { method: 'DELETE' });

/* ─── Deployments ───────────────────────────────── */
export const getDeployments = () => apiFetch('/deployments');
export const getDeploymentLogs = (id) => apiFetch(`/deployments/${id}/logs`);
export const createDeployment = (data) => apiFetch('/deployments', { method: 'POST', body: JSON.stringify(data) });
export const rollbackDeployment = (id, targetVersion) => apiFetch(`/deployments/${id}/rollback`, { method: 'POST', body: JSON.stringify({ target_version: targetVersion }) });

/* ─── Documents ─────────────────────────────────── */
export const getDocuments = () => apiFetch('/documents');
export const uploadDocument = async (formData) => {
  const headers = await getAuthHeaders();
  return fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    headers: { 'Authorization': headers['Authorization'] || '' },
    body: formData,
  }).then(r => r.json());
};
export const askDocumentAI = (doc_id, question) => apiFetch('/documents/ask', { method: 'POST', body: JSON.stringify({ doc_id, question }) });
export const deleteDocument = (id) => apiFetch(`/documents/${id}`, { method: 'DELETE' });

/* ─── Analytics ─────────────────────────────────── */
export const getAnalytics = () => apiFetch('/analytics/summary');

/* ─── Integrations ──────────────────────────────── */
export const getIntegrations = (bust = true) => apiFetch(bust ? `/integrations?_t=${Date.now()}` : '/integrations');
export const getIntegrationsCatalog = () => apiFetch('/integrations/catalog');

/** Public catalog — no auth required */
export async function getIntegrationsCatalogPublic() {
  try {
    const res = await fetch(`${API_BASE}/integrations/catalog/public`);
    if (!res.ok) throw new Error('Catalog unavailable');
    return res.json();
  } catch {
    return { success: true, data: FALLBACK_INTEGRATIONS };
  }
}

const FALLBACK_INTEGRATIONS = [
  { platform: 'gmail',           displayName: 'Gmail',           description: 'Read, send and triage emails',         category: 'communication', available: true, connected: false, status: 'disconnected' },
  { platform: 'google_calendar', displayName: 'Google Calendar', description: 'Sync events and schedule meetings',     category: 'productivity',   available: true, connected: false, status: 'disconnected' },
  { platform: 'google_drive',    displayName: 'Google Drive',    description: 'Access and manage files in Drive',      category: 'storage',        available: true, connected: false, status: 'disconnected' },
  { platform: 'google_meet',     displayName: 'Google Meet',     description: 'Create and join video meetings',        category: 'communication', available: true, connected: false, status: 'disconnected' },
  { platform: 'github',          displayName: 'GitHub',          description: 'Monitor PRs, issues and deployments',   category: 'development',    available: true, connected: false, status: 'disconnected' },
  { platform: 'slack',           displayName: 'Slack',           description: 'Send messages and notifications',       category: 'communication', available: true, connected: false, status: 'disconnected' },
  { platform: 'zoom',            displayName: 'Zoom',            description: 'Create and join meetings instantly',    category: 'communication', available: true, connected: false, status: 'disconnected' },
  { platform: 'microsoft_teams', displayName: 'Microsoft Teams', description: 'Sync with MS Teams workspace',          category: 'communication', available: true, connected: false, status: 'disconnected' },
  { platform: 'outlook',         displayName: 'Outlook',         description: 'Manage Outlook emails and calendar',    category: 'communication', available: true, connected: false, status: 'disconnected' },
  { platform: 'microsoft_365',   displayName: 'Microsoft 365',   description: 'Full Microsoft 365 suite integration',  category: 'productivity',   available: true, connected: false, status: 'disconnected' },
  { platform: 'notion',          displayName: 'Notion',          description: 'Sync notes, tasks and wikis',           category: 'productivity',   available: true, connected: false, status: 'disconnected' },
  { platform: 'jira',            displayName: 'Jira',            description: 'Track project tasks and sprints',       category: 'development',    available: true, connected: false, status: 'disconnected' },
  { platform: 'trello',          displayName: 'Trello',          description: 'Manage boards, lists and cards',        category: 'productivity',   available: true, connected: false, status: 'disconnected' },
];

export const getOAuthUrl = (platform) => apiFetch(`/integrations/oauth-url?platform=${platform}`);
export const authorizeIntegration = (platform) => {
  const origin = encodeURIComponent(window.location.origin);
  return apiFetch(`/integrations/${platform}/authorize?redirect_origin=${origin}`);
};

export const disconnectIntegration = (platform) => apiFetch(`/integrations/${platform}`, { method: 'DELETE' });
export const syncIntegration = (platform) => apiFetch(`/integrations/${platform}/sync`, { method: 'POST' });
export const requestIntegration = (body) => apiFetch('/integrations/request', { method: 'POST', body: JSON.stringify(body) });

/* Master Agent endpoints */
export const syncAllIntegrations = () => apiFetch('/integrations/sync-all', { method: 'POST' });
export const getIntegrationsHealth = () => apiFetch('/integrations/health');
export const getUnifiedInbox = (limit = 50, platforms) => {
  const params = new URLSearchParams({ limit });
  if (platforms) params.append('platforms', platforms);
  return apiFetch(`/integrations/unified-inbox?${params}`);
};
export const getUnifiedCalendar = (daysAhead = 7, platforms) => {
  const params = new URLSearchParams({ days_ahead: daysAhead });
  if (platforms) params.append('platforms', platforms);
  return apiFetch(`/integrations/unified-calendar?${params}`);
};
export const executeWorkflow = (workflow, params) =>
  apiFetch('/integrations/workflow/execute', { method: 'POST', body: JSON.stringify({ workflow, params }) });
export const getPlatformData = (platform, dataType, limit = 20) =>
  apiFetch(`/integrations/${platform}/data?data_type=${dataType}&limit=${limit}`);

/* ─── Misc ──────────────────────────────────────── */
export const getDashboardSummary = () => apiFetch(`/dashboard/summary?_t=${Date.now()}`); // Cache bust
export const invalidateDashboardCache = () => apiFetch('/dashboard/invalidate-cache');
export const getBrief = () => apiFetch('/brief');
export const updateProfile = (data) => apiFetch('/users/profile', { method: 'PUT', body: JSON.stringify(data) });

/* ─── AI conversations ─────────────────────────── */
export const getChatConversations = () => apiFetch('/ai/conversations');
export const getChatConversation = (id) => apiFetch(`/ai/conversations/${id}`);
export const deleteChatConversation = (id) => apiFetch(`/ai/conversations/${id}`, { method: 'DELETE' });
export const updateAutomation = (id, data) => apiFetch(`/ai/automations/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteAutomation = (id) => apiFetch(`/ai/automations/${id}`, { method: 'DELETE' });

/* ─── SuperBrain Chat ───────────────────────────── */
/**
 * Stream SuperBrain chat response.
 * callbacks: { onToken, onThinking, onToolStart, onToolDone, onAlert, onSuggestions, onDone, onError }
 */
export async function superChat(message, conversationId = '', callbacks = {}) {
  const headers = await getAuthHeaders();
  const { onToken, onThinking, onToolStart, onToolDone, onAlert, onSuggestions, onDone, onError } = callbacks;

  let res;
  try {
    res = await fetch(`${API_BASE}/ai/superchat`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversation_id: conversationId, history: [] }),
    });
  } catch (e) {
    onError?.(e.message || 'Cannot reach backend');
    return;
  }

  if (!res.ok) {
    // Try refresh then retry once
    try {
      await withTimeout(refreshAccessToken(), 6000, 'token-refresh');
      const h2 = await getAuthHeaders(true);
      res = await fetch(`${API_BASE}/ai/superchat`, {
        method: 'POST',
        headers: { ...h2, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, conversation_id: conversationId, history: [] }),
      });
    } catch {
      onError?.(`Request failed (${res?.status ?? 'unknown'})`);
      return;
    }
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop(); // keep incomplete line

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (raw === '[DONE]') { onDone?.(); return; }
      try {
        const evt = JSON.parse(raw);
        switch (evt.type) {
          case 'token':        onToken?.(evt.content); break;
          case 'thinking':     onThinking?.(evt.content); break;
          case 'tool_start':   onToolStart?.(evt.tool, evt.message); break;
          case 'tool_done':    onToolDone?.(evt.tool); break;
          case 'alert':        onAlert?.(evt.level, evt.message); break;
          case 'suggestions':  onSuggestions?.(evt.items); break;
          // Legacy format support
          default:
            if (evt.token !== undefined) onToken?.(evt.token);
        }
      } catch { /* skip malformed line */ }
    }
  }
  onDone?.();
}

/* ─── Notifications & Reminders API ────────────────── */

export async function getNotifications() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/notifications`, { headers });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function markNotificationRead(id) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
    method: 'PUT',
    headers,
  });
  if (!res.ok) throw new Error('Failed to mark notification read');
  return res.json();
}

export async function markAllNotificationsRead() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/notifications/read-all`, {
    method: 'PUT',
    headers,
  });
  if (!res.ok) throw new Error('Failed to mark all notifications read');
  return res.json();
}

export async function clearNotifications() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/notifications/clear`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error('Failed to clear notifications');
  return res.json();
}

export async function createNotification(title, body, kind = 'info') {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/notifications`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title, body, kind }),
  });
  if (!res.ok) throw new Error('Failed to create notification');
  return res.json();
}

export async function getReminders(status = null) {
  const headers = await getAuthHeaders();
  const url = status ? `${API_BASE}/reminders?status=${status}` : `${API_BASE}/reminders`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error('Failed to fetch reminders');
  return res.json();
}

export async function createReminder(data) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/reminders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create reminder');
  return res.json();
}

export async function completeReminder(id) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/reminders/${id}/complete`, {
    method: 'PUT',
    headers,
  });
  if (!res.ok) throw new Error('Failed to complete reminder');
  return res.json();
}

export async function deleteReminder(id) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/reminders/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error('Failed to delete reminder');
  return res.json();
}

export async function triggerTestReminder(data = {}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/reminders/test`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to trigger test reminder');
  return res.json();
}

export async function syncCalendarReminders() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/reminders/sync-calendar`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) throw new Error('Failed to sync calendar reminders');
  return res.json();
}