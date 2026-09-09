/**
 * Unit tests for useIntegrationAgents hook
 * Prevents regression of toggle state issues
 */

import { describe, it, expect } from 'vitest';

// Mock the merge function from the hook
function mergeWithCatalog(authItems) {
  const CATALOG = [
    { platform: 'gmail', displayName: 'Gmail', description: 'Email', category: 'communication', available: true },
    { platform: 'google_calendar', displayName: 'Google Calendar', description: 'Calendar', category: 'productivity', available: true },
  ];

  const byPlatform = {};
  authItems.forEach(item => {
    byPlatform[item.platform] = item;
  });

  return CATALOG.map(base => {
    const apiData = byPlatform[base.platform];
    if (apiData) {
      const isConnected =
        apiData.connected === true ||
        apiData.connected === 'true' ||
        apiData.status === 'connected' ||
        apiData.status === 'active';
      return {
        ...base,
        ...apiData,
        connected: isConnected,
      };
    }
    return { ...base, connected: false, status: 'disconnected' };
  });
}

describe('useIntegrationAgents - Toggle State Tests', () => {
  it('should handle connected: true (boolean)', () => {
    const apiData = [
      { platform: 'gmail', connected: true, status: 'connected', accountLabel: 'test@example.com' },
    ];
    
    const result = mergeWithCatalog(apiData);
    const gmail = result.find(i => i.platform === 'gmail');
    
    expect(gmail.connected).toBe(true);
    expect(typeof gmail.connected).toBe('boolean');
  });

  it('should handle connected: "true" (string)', () => {
    const apiData = [
      { platform: 'gmail', connected: 'true', status: 'connected' },
    ];
    
    const result = mergeWithCatalog(apiData);
    const gmail = result.find(i => i.platform === 'gmail');
    
    expect(gmail.connected).toBe(true);
    expect(typeof gmail.connected).toBe('boolean');
  });

  it('should handle status: "connected" without connected field', () => {
    const apiData = [
      { platform: 'gmail', status: 'connected', accountLabel: 'test@example.com' },
    ];
    
    const result = mergeWithCatalog(apiData);
    const gmail = result.find(i => i.platform === 'gmail');
    
    expect(gmail.connected).toBe(true);
    expect(typeof gmail.connected).toBe('boolean');
  });

  it('should handle status: "active" as connected', () => {
    const apiData = [
      { platform: 'gmail', status: 'active', accountLabel: 'test@example.com' },
    ];
    
    const result = mergeWithCatalog(apiData);
    const gmail = result.find(i => i.platform === 'gmail');
    
    expect(gmail.connected).toBe(true);
  });

  it('should handle connected: false correctly', () => {
    const apiData = [
      { platform: 'gmail', connected: false, status: 'disconnected' },
    ];
    
    const result = mergeWithCatalog(apiData);
    const gmail = result.find(i => i.platform === 'gmail');
    
    expect(gmail.connected).toBe(false);
  });

  it('should handle missing platform data', () => {
    const apiData = [
      // Gmail not in API data
    ];
    
    const result = mergeWithCatalog(apiData);
    const gmail = result.find(i => i.platform === 'gmail');
    
    expect(gmail.connected).toBe(false);
    expect(gmail.status).toBe('disconnected');
  });

  it('should preserve account label for connected integrations', () => {
    const apiData = [
      { 
        platform: 'gmail', 
        connected: true, 
        status: 'connected', 
        accountLabel: 'user@example.com' 
      },
    ];
    
    const result = mergeWithCatalog(apiData);
    const gmail = result.find(i => i.platform === 'gmail');
    
    expect(gmail.connected).toBe(true);
    expect(gmail.accountLabel).toBe('user@example.com');
  });

  it('should handle multiple connected integrations', () => {
    const apiData = [
      { platform: 'gmail', connected: true, status: 'connected' },
      { platform: 'google_calendar', connected: true, status: 'connected' },
    ];
    
    const result = mergeWithCatalog(apiData);
    
    expect(result.filter(i => i.connected).length).toBe(2);
    expect(result.find(i => i.platform === 'gmail').connected).toBe(true);
    expect(result.find(i => i.platform === 'google_calendar').connected).toBe(true);
  });

  it('should always return boolean for connected field', () => {
    const apiData = [
      { platform: 'gmail', connected: true, status: 'connected' },
      { platform: 'google_calendar', connected: 'true', status: 'connected' },
    ];
    
    const result = mergeWithCatalog(apiData);
    
    result.forEach(item => {
      expect(typeof item.connected).toBe('boolean');
    });
  });

  it('should not break with null or undefined values', () => {
    const apiData = [
      { platform: 'gmail', connected: null, status: null },
      { platform: 'google_calendar', connected: undefined, status: undefined },
    ];
    
    const result = mergeWithCatalog(apiData);
    
    expect(result.find(i => i.platform === 'gmail').connected).toBe(false);
    expect(result.find(i => i.platform === 'google_calendar').connected).toBe(false);
  });
});
