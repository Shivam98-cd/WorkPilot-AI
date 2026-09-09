import { auth } from './firebase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';


/* ─── Auth helpers ─────────────────────────────── */

let _cachedHeaders = null;
let _cachedHeadersAt = 0;
const HEADER_CACHE_MS = 60_000;
let _refreshInFlight = null;

async function getFirebaseToken() {
  try {
    const user = auth.currentUser;
    if (user) return await user.getIdToken(false);
  } catch {}
  return null;
}

function clearAuthCache() {
  _cachedHeaders = null;
  _cachedHeadersAt = 0;
}

async function getAuthHeaders(force = false) {
  if (!force && _cachedHeaders && Date.now() - _cachedHeadersAt < HEADER_CACHE_MS) {
    return _cachedHeaders;
  }

  let headers = { 'Content-Type': 'application/json' };
  try {
    const tokens = JSON.parse(localStorage.getItem('wp_tokens') || 'null');
    if (tokens?.accessToken) {
      headers = { 'Authorization': `Bearer ${tokens.accessToken}`, 'Content-Type': 'application/json' };
    }
  } catch {}

  if (!headers.Authorization) {
    const firebaseToken = await getFirebaseToken();
    if (firebaseToken) {
      headers = { 'Authorization': `Bearer ${firebaseToken}`, 'Content-Type': 'application/json' };
    }
  }

  _cachedHeaders = headers;
  _cachedHeadersAt = Date.now();
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

// Hard timeout (ms) for each API call — prevents indefinite hangs when the
// backend or Firestore SSL is slow.
const API_TIMEOUT_MS = 10_000;
// Hard timeout for the token-refresh flow — backend refresh can hang if
// Firestore SSL is retrying (seen as 287-second Duration in logs).
const REFRESH_TIMEOUT_MS = 6_000;

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
  let headers = await getAuthHeaders();
  let res;

  // ── First attempt with a hard timeout ────────────────────────────────────
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
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

  // ── Token refresh on 401 — with a hard 6-second timeout ──────────────────
  if (res.status === 401) {
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
  try { return await apiFetch('/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
}

export async function getProfile() {
  return apiFetch('/users/profile');
}

export async function getSessions() {
  return apiFetch('/auth/sessions');
}

/* ─── Email ─────────────────────────────────────── */
export const getEmails = () => apiFetch('/emails');
export const markEmailRead = (id) => apiFetch(`/emails/${id}/read`, { method: 'PUT' });
export const draftEmail = (body) => apiFetch('/emails/draft', { method: 'POST', body: JSON.stringify(body) });
export const sendEmail = (body) => apiFetch('/emails/send', { method: 'POST', body: JSON.stringify(body) });
export const triageEmails = () => apiFetch('/emails/triage', { method: 'POST' });


/* ─── Calendar ──────────────────────────────────── */
export const getCalendarEvents = () => apiFetch('/calendar/events');
export const createCalendarEvent = (ev) => apiFetch('/calendar/events', { method: 'POST', body: JSON.stringify(ev) });

/* ─── Team ──────────────────────────────────────── */
export const getTeamMembers = () => apiFetch('/team/members');
export const updateTeamMember = (id, data) => apiFetch(`/team/members/${id}`, { method: 'PUT', body: JSON.stringify(data) });

/* ─── Deployments ───────────────────────────────── */
export const getDeployments = () => apiFetch('/deployments');
export const getDeploymentLogs = (id) => apiFetch(`/deployments/${id}/logs`);

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

/* ─── Analytics ─────────────────────────────────── */
export const getAnalytics = () => apiFetch('/analytics/summary');

/* ─── Integrations ──────────────────────────────── */
export const getIntegrations = () => apiFetch('/integrations'); // Always fetch fresh - no caching
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