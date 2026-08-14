/**
 * useIntegrationAgents Hook
 * Manages integration agent state: connections, health, sync status.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  syncAllIntegrations, syncIntegration, getIntegrationsHealth,
  getUnifiedInbox, getUnifiedCalendar, executeWorkflow, getIntegrations,
} from '../api';

export function useIntegrationAgents() {
  const [integrations, setIntegrations] = useState([]);
  const [health, setHealth]             = useState({});
  const [syncingAll, setSyncingAll]     = useState(false);
  const [syncingPlatform, setSyncingPlatform] = useState(null);
  const [lastSyncResults, setLastSyncResults] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  // ─── Load integrations list ───────────────────────────────────────────────────
  const loadIntegrations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getIntegrations();
      if (res?.data) setIntegrations(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (e) {
      // Backend offline — try public catalog so page isn't blank
      try {
        const { getIntegrationsCatalogPublic } = await import('../api');
        const fallback = await getIntegrationsCatalogPublic();
        const items = (fallback.data || []).map(i => ({ ...i, connected: false, status: 'disconnected' }));
        setIntegrations(items);
        setError(null);
      } catch {
        setError(e.message);
      }
    } finally {
      setLoading(false);
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
      await loadIntegrations();
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
      await loadIntegrations();
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

  // ─── On mount: load integrations first, health lazily ─────────────────────────
  useEffect(() => {
    loadIntegrations().then(() => {
      setTimeout(refreshHealth, 600); // health loads 600ms after integrations
    });
  }, []);

  return {
    integrations,
    health,
    syncingAll,
    syncingPlatform,
    lastSyncResults,
    loading,
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
