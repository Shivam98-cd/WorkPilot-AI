import { auth } from './firebase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/* ─── Auth helpers ─────────────────────────────── */

async function getFirebaseToken() {
  try {
    const user = auth.currentUser;
    if (user) return await user.getIdToken(false);
  } catch {}
  return null;
}

async function getAuthHeaders() {
  // 1st priority: backend JWT stored after login
  try {
    const tokens = JSON.parse(localStorage.getItem('wp_tokens') || 'null');
    if (tokens?.accessToken) {
      return { 'Authorization': `Bearer ${tokens.accessToken}`, 'Content-Type': 'application/json' };
    }
  } catch {}
  // 2nd priority: Firebase ID token (user is logged in via Firebase but JWT exchange not done yet)
  const firebaseToken = await getFirebaseToken();
  if (firebaseToken) {
    return { 'Authorization': `Bearer ${firebaseToken}`, 'Content-Type': 'application/json' };
  }
  return { 'Content-Type': 'application/json' };
}

export async function refreshAccessToken() {
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
    const newTokens = { accessToken: data.data.accessToken || data.data, refreshToken: data.data.refreshToken || tokens.refreshToken };
    localStorage.setItem('wp_tokens', JSON.stringify(newTokens));
    return newTokens.accessToken;
  }
  throw new Error('Refresh failed');
}

async function apiFetch(url, options = {}) {
  const headers = await getAuthHeaders();
  let res;
  try {
    res = await fetch(`${API_BASE}${url}`, { ...options, headers: { ...headers, ...options.headers } });
  } catch {
    throw new Error(`Cannot reach the API at ${API_BASE}. Start the backend: cd backend && uvicorn main:app --reload`);
  }
  if (res.status === 401) {
    try {
      await refreshAccessToken();
      const retryHeaders = await getAuthHeaders();
      res = await fetch(`${API_BASE}${url}`, { ...options, headers: { ...retryHeaders, ...options.headers } });
    } catch {}
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
export const getIntegrations = () => apiFetch('/integrations');
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
  { platform: 'github',          displayName: 'GitHub',          description: 'Monitor PRs, issues and deployments',   category: 'development',    available: true, connected: false, status: 'disconnected' },
  { platform: 'slack',           displayName: 'Slack',           description: 'Send messages and notifications',       category: 'communication', available: true, connected: false, status: 'disconnected' },
  { platform: 'zoom',            displayName: 'Zoom',            description: 'Create and join meetings instantly',     category: 'communication', available: true, connected: false, status: 'disconnected' },
  { platform: 'microsoft_teams', displayName: 'Microsoft Teams', description: 'Sync with MS Teams workspace',          category: 'communication', available: true, connected: false, status: 'disconnected' },
  { platform: 'notion',          displayName: 'Notion',          description: 'Sync notes, tasks and wikis',           category: 'productivity',   available: true, connected: false, status: 'disconnected' },
  { platform: 'jira',            displayName: 'Jira',            description: 'Track project tasks and sprints',       category: 'development',    available: true, connected: false, status: 'disconnected' },
];

export const getOAuthUrl = (platform) => apiFetch(`/integrations/oauth-url?platform=${platform}`);
export const authorizeIntegration = (platform) => apiFetch(`/integrations/${platform}/authorize`);
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
export const getDashboardSummary = () => apiFetch('/dashboard/summary');
export const getBrief = () => apiFetch('/brief');
export const updateProfile = (data) => apiFetch('/users/profile', { method: 'PUT', body: JSON.stringify(data) });