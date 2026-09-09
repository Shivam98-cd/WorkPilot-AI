# Integration Toggle Issue - Prevention Guide

## ✅ Issue Status: FIXED

**Date:** September 8, 2026  
**Issue:** Integration toggles remained white/grey after OAuth connection despite being actually connected in backend  
**Root Cause:** Initial state not being refreshed properly on page mount  
**Solution:** Force cache-busted reload on component mount

---

## 🛡️ Prevention Measures Implemented

### 1. **Force Reload on Mount** ✅
**File:** `Frontend/src/components/Pages.jsx`  
**Line:** ~882

```javascript
// FORCE RELOAD on mount with cache bust to ensure fresh data
useEffect(() => {
  reload(true);
}, []); // Empty deps = run once on mount
```

**Why:** Ensures the integrations page always fetches fresh data when mounted, bypassing any stale initial state.

### 2. **Robust Merge Function** ✅
**File:** `Frontend/src/hooks/useIntegrationAgents.js`  
**Line:** ~43-56

```javascript
return CATALOG.map(base => {
  const apiData = byPlatform[base.platform];
  if (apiData) {
    // Force connected to a strict boolean
    const isConnected =
      apiData.connected === true ||
      apiData.connected === 'true' ||
      apiData.status === 'connected' ||
      apiData.status === 'active';
    return {
      ...base,
      ...apiData,
      connected: isConnected,   // always a strict boolean
    };
  }
  return { ...base, connected: false, status: 'disconnected' };
});
```

**Why:** Handles various formats of `connected` field (boolean, string, missing) and always produces a strict boolean.

### 3. **Cache-Busting After OAuth** ✅
**File:** `Frontend/src/components/Pages.jsx`  
**Line:** ~895-905

```javascript
if (status === 'connected') {
  setStatusMessage(`Connected ${integration}`);
  showToast(`Successfully connected ${integration}`, 'success');
  setJustConnected(integration);
  setTimeout(() => setJustConnected(null), 2500);
  console.log('🔄 IntegrationsPage: OAuth success detected, reloading with cache bust');
  reload(true);  // Bust cache to get fresh connected status
  localStorage.setItem('wp_integration_just_connected', Date.now().toString());
  setTimeout(() => {
    console.log('🔄 IntegrationsPage: Delayed reload after OAuth (1s)');
    reload(true);
  }, 1000);
}
```

**Why:** Double reload (immediate + 1s delayed) ensures backend has time to save and frontend gets fresh data.

### 4. **Backend Cache Invalidation** ✅
**File:** `backend/api/v1/endpoints/integrations.py`  
**Line:** ~118

```python
record = await integration_service.handle_oauth_callback(platform, code, state)
_invalidate_cache(record.uid)  # bust cache so user sees connected status immediately
return RedirectResponse(url=f"{redirect_base}?integrations={platform}&status=connected")
```

**Why:** Backend immediately invalidates its cache when OAuth completes so fresh fetch returns correct data.

### 5. **Cache-Bust Query Parameter Support** ✅
**File:** `backend/api/v1/endpoints/integrations.py`  
**Line:** ~50-64

```python
@router.get("")
async def list_integrations(current_user=Depends(get_current_user), _t: Optional[str] = Query(None)):
    uid = current_user["uid"]
    now = time.monotonic()
    # If _t (cache-bust) param is present, always skip cache
    bust = _t is not None
    if not bust and uid in _CACHE:
        ts, cached_data = _CACHE[uid]
        if now - ts < _CACHE_TTL:
            return {"success": True, "data": cached_data, "cached": True}
    # Fresh fetch (always when busting)
    if bust:
        _invalidate_cache(uid)
    data = await integration_service.list_for_user(uid)
    _CACHE[uid] = (now, data)
    return {"success": True, "data": data}
```

**Why:** Accepts `?_t=timestamp` query parameter to force fresh data, bypassing both backend and browser cache.

---

## 🔍 Testing Checklist

Before deploying any changes to integration state management, verify:

### Manual Tests:
- [ ] Fresh page load shows correct toggle states
- [ ] After OAuth connection, toggle turns green within 2 seconds
- [ ] Page refresh preserves toggle states
- [ ] Disconnect immediately turns toggle white
- [ ] Multiple rapid connections/disconnections work correctly
- [ ] Browser tab switch doesn't reset toggle states

### API Tests:
- [ ] `/api/v1/integrations` returns `connected: true` for connected platforms
- [ ] `/api/v1/integrations?_t=123` bypasses cache
- [ ] OAuth callback invalidates cache
- [ ] Disconnect endpoint invalidates cache

### Console Tests:
- [ ] No errors about `connected` being undefined
- [ ] `connectedCount` matches actual connected integrations
- [ ] Merge function produces correct boolean values

---

## 🚨 Warning Signs

If you see these symptoms, the toggle issue may be returning:

1. **Toggles white after OAuth** - Cache not being busted
2. **`connectedCount: 0` but API returns connected items** - Merge function broken
3. **Toggle state changes on refresh** - Initial state not loading correctly
4. **Console shows `connected: "true"` (string)** - Type coercion issue
5. **Backend logs show connected but frontend doesn't** - Data not reaching component

---

## 📝 Code Review Guidelines

When reviewing PRs that touch integration state:

### ✅ DO:
- Always use `reload(true)` after state-changing operations (connect, disconnect, OAuth)
- Keep the `useEffect(() => reload(true), [])` mount hook in IntegrationsPage
- Ensure merge function always returns strict boolean for `connected`
- Invalidate backend cache after OAuth/connect/disconnect
- Use cache-bust query param for critical fetches

### ❌ DON'T:
- Remove the force reload on mount
- Change merge function without testing all edge cases
- Assume `connected` is always a boolean - validate it
- Remove cache invalidation from OAuth callback
- Use cached data immediately after state changes

---

## 🔧 Quick Fix Commands

If the issue reappears in development:

```bash
# 1. Clear browser cache
# Open DevTools (F12) → Application → Clear storage → Clear site data

# 2. Clear backend cache
# Restart backend server (it clears in-memory cache)
cd backend
# Press Ctrl+C
uvicorn main:app --reload

# 3. Test with cache-busting
# In browser console:
fetch('http://localhost:8000/api/v1/integrations?_t=' + Date.now(), {
  headers: { 'Authorization': 'Bearer ' + JSON.parse(localStorage.wp_tokens).accessToken }
}).then(r => r.json()).then(console.log)
```

---

## 📊 Monitoring

Add these to your monitoring dashboard:

1. **Metric:** `integration_toggle_mismatch_rate`
   - Track when frontend toggle state doesn't match backend status
   - Alert if > 5% of page loads

2. **Metric:** `oauth_callback_cache_bust_success_rate`
   - Track cache invalidation success after OAuth
   - Alert if < 95%

3. **Log:** Frontend errors containing "connected"
   - Monitor for type errors or undefined values

---

## 📚 Related Documentation

- [TOGGLE_FIX_FINAL.md](./TOGGLE_FIX_FINAL.md) - Detailed fix explanation
- [ISSUE_PROMPT_FOR_AI.md](./ISSUE_PROMPT_FOR_AI.md) - Issue description for debugging
- [TOGGLE_FIX_SUMMARY.md](./TOGGLE_FIX_SUMMARY.md) - Previous fix attempts
- [debug_toggle_issue.py](./debug_toggle_issue.py) - Backend debugging script

---

## 🎯 Summary

**The fix works because:**
1. Force reload on mount ensures fresh data
2. Cache-busting prevents stale browser cache
3. Backend invalidation prevents stale server cache
4. Robust merge handles all data formats
5. Double OAuth reload catches timing issues

**Keep these files unchanged:**
- `Frontend/src/hooks/useIntegrationAgents.js` - merge function
- `Frontend/src/components/Pages.jsx` - force reload on mount
- `backend/api/v1/endpoints/integrations.py` - cache invalidation

**Last Verified:** September 8, 2026  
**Status:** ✅ Working Correctly
