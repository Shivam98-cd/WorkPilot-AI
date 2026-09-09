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
import {
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


export function useIntegrationAgents() {
  // Start with the static catalog so the grid renders immediately on mount —
  // no network call, no auth, no blank page.
  const [integrations, setIntegrations] = useState(
    CATALOG.map(b => ({ ...b, connected: false, status: 'disconnected' }))
  );
  const [health, setHealth]             = useState({});
  const [syncingAll, setSyncingAll]     = useState(false);
  const [syncingPlatform, setSyncingPlatform] = useState(null);
  const [lastSyncResults, setLastSyncResults] = useState(null);
  const [loading, setLoading]           = useState(false);  // false = catalog already shown
  const [error, setError]               = useState(null);

  // Track whether we're loading the *authenticated* overlay (shown as subtle indicator)
  const [authLoading, setAuthLoading]   = useState(true);

  const mountedRef = useRef(true);
  const [updateCounter, setUpdateCounter] = useState(0); // Force re-render counter

  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  // ─── Load authenticated integrations list (overlay on top of catalog) ─────────
  const loadIntegrations = useCallback(async () => {
    if (!mountedRef.current) return;
    console.log('🔄 useIntegrationAgents: loadIntegrations called (always fresh data)');
    setAuthLoading(true);
    setError(null);
    try {
      const res = await getIntegrations(); // Always fetches fresh data
      console.log('📦 useIntegrationAgents: RAW API RESPONSE:', res);
      console.log('📦 useIntegrationAgents: API data array:', res?.data);
      if (!mountedRef.current) return;
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        console.log('✅ useIntegrationAgents: About to merge, data length:', res.data.length);
        const merged = mergeWithCatalog(res.data);
        console.log('✅ useIntegrationAgents: Merged result (first 5):', merged.slice(0, 5).map(i => ({ 
          platform: i.platform, 
          connected: i.connected, 
          status: i.status,
          accountLabel: i.accountLabel 
        })));
        // Force update with new array reference + counter to trigger re-render
        setIntegrations([...merged]);
        setUpdateCounter(prev => prev + 1);
        console.log('✅ setIntegrations called with', merged.filter(i => i.connected).length, 'connected');
      } else {
        console.warn('⚠️ useIntegrationAgents: API returned empty or invalid data:', res);
      }
    } catch (e) {
      console.error('❌ useIntegrationAgents: loadIntegrations error:', e);
      if (!mountedRef.current) return;
      if (!e.message?.includes('timed out') && !e.message?.includes('401')) {
        setError(e.message);
      }
    } finally {
      if (mountedRef.current) {
        console.log('✅ useIntegrationAgents: setAuthLoading(false)');
        setAuthLoading(false);
      }
    }
  }, []);

  // ─── Health check (non-blocking, loads after integrations) ───────────────────
  const refreshHealth = useCallback(async () => {
    try {
      const res = await getIntegrationsHealth();
      if (res?.data && mountedRef.current) setHealth(res.data);
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
      if (res?.data && mountedRef.current) setLastSyncResults(res.data);
      await loadIntegrations();
      await refreshHealth();
      return res?.data;
    } catch (e) {
      if (mountedRef.current) setError(e.message);
      throw e;
    } finally {
      if (mountedRef.current) setSyncingAll(false);
    }
  }, [syncingAll, loadIntegrations, refreshHealth]);

  // ─── Sync single platform ─────────────────────────────────────────────────────
  const syncPlatform = useCallback(async (platform) => {
    if (syncingPlatform) return;
    setSyncingPlatform(platform);
    setError(null);
    try {
      const res = await syncIntegration(platform);
      await loadIntegrations();
      await refreshHealth();
      return res?.data;
    } catch (e) {
      if (mountedRef.current) setError(e.message);
      throw e;
    } finally {
      if (mountedRef.current) setSyncingPlatform(null);
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
      if (mountedRef.current) setError(e.message);
      throw e;
    }
  }, []);

  // ─── Run workflow ─────────────────────────────────────────────────────────────
  const runWorkflow = useCallback(async (workflow, params) => {
    try {
      const res = await executeWorkflow(workflow, params);
      return res?.data;
    } catch (e) {
      if (mountedRef.current) setError(e.message);
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
    // Small delay so the page renders the static catalog first, then we try auth
    // Always fetches fresh data (no caching in frontend)
    const t = setTimeout(() => {
      loadIntegrations().then(() => {
        setTimeout(refreshHealth, 500);
      });
    }, 100);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    integrations,
    health,
    syncingAll,
    syncingPlatform,
    lastSyncResults,
    loading,       // always false now — catalog shown immediately
    authLoading,   // true while fetching auth-overlay
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
    reload: loadIntegrations,
  };
}

export default useIntegrationAgents;
