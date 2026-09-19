/**
 * useIntegrationAgents Hook
 * Manages integration agent state: connections, health, sync status.
 *
 * Loading strategy (fast-first):
 *   1. Show public catalog immediately (no auth) so the grid is never blank.
 *   2. Fetch the authenticated list in the background to overlay connected state.
 *   3. If auth succeeds, update each card with real connected / status / label data.
 *   4. If auth fails or times out, the public catalog stays visible (all disconnected).
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { auth } from '../firebase';
import {
  clearAuthCache,
  syncAllIntegrations, syncIntegration, getIntegrationsHealth,
  getUnifiedInbox, getUnifiedCalendar, executeWorkflow, getIntegrations,
} from '../api';

// ── Public catalog (no auth) ───────────────────────────────────────────────────
// Mirrors FALLBACK_INTEGRATIONS in api.js — kept here so the hook never depends
// on a network call just to show the initial grid.
const CATALOG = [
  { platform: 'gmail',           displayName: 'Gmail',           description: 'Read, send and triage emails',         category: 'communication', available: true  },
  { platform: 'google_calendar', displayName: 'Google Calendar', description: 'Sync events and schedule meetings',     category: 'productivity',  available: true  },
  { platform: 'google_drive',    displayName: 'Google Drive',    description: 'Access and manage files in Drive',      category: 'storage',       available: true  },
  { platform: 'google_meet',     displayName: 'Google Meet',     description: 'Create and join video meetings',        category: 'communication', available: true  },
  { platform: 'github',          displayName: 'GitHub',          description: 'Monitor PRs, issues and deployments',   category: 'development',   available: true  },
  { platform: 'slack',           displayName: 'Slack',           description: 'Send messages and notifications',       category: 'communication', available: true  },
  { platform: 'zoom',            displayName: 'Zoom',            description: 'Create and join meetings instantly',    category: 'communication', available: true  },
  { platform: 'microsoft_teams', displayName: 'Microsoft Teams', description: 'Sync with MS Teams workspace',          category: 'communication', available: true  },
  { platform: 'outlook',         displayName: 'Outlook',         description: 'Manage Outlook emails and calendar',    category: 'communication', available: true  },
  { platform: 'microsoft_365',   displayName: 'Microsoft 365',   description: 'Full Microsoft 365 suite integration',  category: 'productivity',  available: true  },
  { platform: 'notion',          displayName: 'Notion',          description: 'Sync notes, tasks and wikis',           category: 'productivity',  available: true  },
  { platform: 'jira',            displayName: 'Jira',            description: 'Track project tasks and sprints',       category: 'development',   available: true  },
  { platform: 'trello',          displayName: 'Trello',          description: 'Manage boards, lists and cards',        category: 'productivity',  available: true  },
];

/** Merge authenticated data on top of the base catalog so the grid never disappears. */
function mergeWithCatalog(authItems) {
  const byPlatform = {};
  authItems.forEach(item => {
    byPlatform[item.platform] = item;
  });

  return CATALOG.map(base => {
    const apiData = byPlatform[base.platform];
    if (apiData) {
      // ROBUST connected field detection - handles all backend response formats
      const isConnected = Boolean(
        apiData.connected === true ||           // strict boolean true
        apiData.connected === 'true' ||         // string 'true'
        apiData.connected === 1 ||              // number 1
        apiData.status === 'connected' ||       // status field
        apiData.status === 'active' ||          // alternate status
        (apiData.accountLabel && apiData.accountLabel.length > 0)  // has account = connected
      );
      
      // Log for debugging
      console.log(`🔍 mergeWithCatalog: ${base.platform} -> connected=${isConnected} (from api: connected=${apiData.connected}, status=${apiData.status})`);
      
      return {
        ...base,
        ...apiData,
        connected: isConnected,   // always a strict boolean
      };
    }
    return { ...base, connected: false, status: 'disconnected' };
  });
}


const STORAGE_KEY = 'wp_integrations_cache_v2';

function getInitialIntegrations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return mergeWithCatalog(parsed);
      }
    }
  } catch {}
  return CATALOG.map(b => ({ ...b, connected: false, status: 'disconnected' }));
}

export function useIntegrationAgents() {
  const [integrations, setIntegrations] = useState(getInitialIntegrations);
  const [health, setHealth]             = useState({});
  const [syncingAll, setSyncingAll]     = useState(false);
  const [syncingPlatform, setSyncingPlatform] = useState(null);
  const [lastSyncResults, setLastSyncResults] = useState(null);
  const [loading, setLoading]           = useState(false);  // false = catalog already shown
  const [error, setError]               = useState(null);

  // If we already have cached connections, authLoading starts false so UI shows real state immediately
  const hasCachedConnections = Boolean(integrations && integrations.some(i => i.connected));
  const [authLoading, setAuthLoading]   = useState(!hasCachedConnections);

  // ─── Optimistic update helper (called immediately on OAuth callback) ────────
  const markConnectedOptimistic = useCallback((platform, accountLabel = null) => {
    console.log('⚡ useIntegrationAgents: markConnectedOptimistic:', platform);
    setIntegrations(prev => {
      const updated = prev.map(item => {
        if (item.platform === platform) {
          return {
            ...item,
            connected: true,
            status: 'connected',
            accountLabel: accountLabel || item.accountLabel || 'Connected',
          };
        }
        return item;
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setAuthLoading(false);
  }, []);

  // ─── Load authenticated integrations list (overlay on top of catalog) ─────────
  const inFlightRef = useRef(null);
  const loadIntegrations = useCallback(async (bust = true) => {
    if (inFlightRef.current) {
      return inFlightRef.current;
    }

    const run = (async () => {
      console.log('🔄 useIntegrationAgents: loadIntegrations called (always fresh data)');
      setError(null);
      try {
        const res = await getIntegrations(bust);
        console.log('📦 useIntegrationAgents: RAW API RESPONSE:', res);
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          const merged = mergeWithCatalog(res.data);
          setIntegrations(merged);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          } catch {}
          console.log('✅ setIntegrations called with', merged.filter(i => i.connected).length, 'connected');
        } else {
          console.warn('⚠️ useIntegrationAgents: API returned empty or invalid data:', res);
        }
      } catch (e) {
        console.error('❌ useIntegrationAgents: loadIntegrations error:', e);
        if (!e.message?.includes('timed out') && !e.message?.includes('401')) {
          setError(e.message);
        }
      } finally {
        setAuthLoading(false);
      }
    })();

    inFlightRef.current = run;
    try {
      await run;
    } finally {
      inFlightRef.current = null;
    }
  }, []);

  // ─── Health check (non-blocking, loads after integrations) ───────────────────
  const refreshHealth = useCallback(async () => {
    try {
      const res = await getIntegrationsHealth();
      if (res?.data) setHealth(res.data);
    } catch {
      // health is non-critical, silently fail
    }
  }, []);

  // ─── Sync all ─────────────────────────────────────────────────────────────────
  const syncAll = useCallback(async () => {
    if (syncingAll) return;
    setSyncingAll(true);
    setError(null);
    try {
      const res = await syncAllIntegrations();
      if (res?.data) setLastSyncResults(res.data);
      await loadIntegrations(true);
      await refreshHealth();
      return res?.data;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setSyncingAll(false);
    }
  }, [syncingAll, loadIntegrations, refreshHealth]);

  // ─── Sync single platform ─────────────────────────────────────────────────────
  const syncPlatform = useCallback(async (platform) => {
    if (syncingPlatform) return;
    setSyncingPlatform(platform);
    setError(null);
    try {
      const res = await syncIntegration(platform);
      await loadIntegrations(true);
      await refreshHealth();
      return res?.data;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setSyncingPlatform(null);
    }
  }, [syncingPlatform, loadIntegrations, refreshHealth]);

  // ─── Unified data ─────────────────────────────────────────────────────────────
  const getUnifiedData = useCallback(async (type, options = {}) => {
    try {
      if (type === 'inbox') {
        const res = await getUnifiedInbox(options.limit || 50, options.platforms);
        return res?.data;
      }
      if (type === 'calendar') {
        const res = await getUnifiedCalendar(options.daysAhead || 7, options.platforms);
        return res?.data;
      }
    } catch (e) {
      setError(e.message);
      throw e;
    }
  }, []);

  // ─── Run workflow ─────────────────────────────────────────────────────────────
  const runWorkflow = useCallback(async (workflow, params) => {
    try {
      const res = await executeWorkflow(workflow, params);
      return res?.data;
    } catch (e) {
      setError(e.message);
      throw e;
    }
  }, []);

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  const getHealthForPlatform = useCallback((platform) => {
    return health[platform] || { status: 'unknown', token_valid: false, error_count: 0 };
  }, [health]);

  const isConnected = useCallback((platform) => {
    return integrations.some(i => i.platform === platform && i.connected);
  }, [integrations]);

  // ─── On mount: catalog is already shown; load auth data in background ─────────
  useEffect(() => {
    // Safety guard: authLoading should NEVER remain true indefinitely (max 2.5s)
    const safetyTimer = setTimeout(() => {
      setAuthLoading(false);
    }, 2500);

    // Initial fetch
    loadIntegrations(true).then(() => {
      setTimeout(refreshHealth, 1500);
    });

    // Also listen to Firebase auth state changes so when user logs in or session restores, integrations load immediately
    const unsub = auth.onAuthStateChanged((user) => {
      clearAuthCache();
      if (user) {
        console.log('🔑 useIntegrationAgents: Firebase user detected:', user.email);
        loadIntegrations(true).then(() => {
          setTimeout(refreshHealth, 1500);
        });
      }
    });

    // Listen to custom integration events (e.g. from OAuth or modal)
    const handleConnectedEvent = (e) => {
      const platform = e?.detail?.platform;
      if (platform) markConnectedOptimistic(platform);
      clearAuthCache();
      loadIntegrations(true);
    };
    window.addEventListener('wp-integration-connected', handleConnectedEvent);

    // Listen to popup OAuth completion postMessage
    const handlePopupMessage = (e) => {
      if (e?.data?.type === 'oauth_complete' && e.data?.platform) {
        console.log('⚡ useIntegrationAgents: Received popup oauth_complete:', e.data);
        markConnectedOptimistic(e.data.platform, e.data.accountLabel);
        clearAuthCache();
        loadIntegrations(true);
      }
    };
    window.addEventListener('message', handlePopupMessage);

    return () => {
      clearTimeout(safetyTimer);
      unsub();
      window.removeEventListener('wp-integration-connected', handleConnectedEvent);
      window.removeEventListener('message', handlePopupMessage);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    integrations,
    health,
    syncingAll,
    syncingPlatform,
    lastSyncResults,
    loading,       // always false now — catalog shown immediately
    authLoading,   // true only while initial load runs without cache
    error,
    connectedCount: integrations.filter(i => i.connected).length,
    totalCount: integrations.length,
    syncAll,
    syncPlatform,
    refreshHealth,
    getUnifiedData,
    runWorkflow,
    getHealthForPlatform,
    isConnected,
    markConnectedOptimistic,
    reload: loadIntegrations,
  };
}

export default useIntegrationAgents;
