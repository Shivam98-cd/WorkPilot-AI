import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);

const ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

const COLORS = {
  success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', icon: '#10b981', text: '#fff' },
  error:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  icon: '#ef4444', text: '#fff' },
  info:    { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', icon: '#3b82f6', text: '#fff' },
  warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: '#f59e0b', text: '#fff' },
};

const Toast = ({ toast, onRemove }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t); }, []);

  const c = COLORS[toast.type] || COLORS.info;
  return (
    <div onClick={onRemove} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px', borderRadius: 12,
      background: 'rgba(12,12,18,0.96)',
      border: `1px solid ${c.border}`,
      backdropFilter: 'blur(12px)',
      boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${c.border}`,
      cursor: 'pointer', minWidth: 240, maxWidth: 360,
      transform: visible ? 'translateX(0) scale(1)' : 'translateX(20px) scale(0.95)',
      opacity: visible ? 1 : 0,
      transition: 'all 0.28s cubic-bezier(0.16,1,0.3,1)',
      fontFamily: "'Inter',sans-serif",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: c.bg, border: `1px solid ${c.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: c.icon, fontSize: 13, fontWeight: 700,
      }}>{ICONS[toast.type]}</div>
      <span style={{ fontSize: 13, fontWeight: 500, color: '#fff', lineHeight: 1.4, flex: 1 }}>
        {toast.message}
      </span>
      <button onClick={onRemove} style={{
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
        cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px', flexShrink: 0,
      }}>×</button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  // Listen for OAuth callback events fired by App.jsx
  useEffect(() => {
    const handler = (e) => {
      const { label, status, message } = e.detail;
      if (status === 'connected') {
        showToast(`${label} connected successfully!`, 'success');
      } else {
        const reason = message ? `: ${decodeURIComponent(message)}` : '';
        showToast(`Failed to connect ${label}${reason}`, 'error');
      }
    };
    window.addEventListener('wp-oauth-result', handler);
    return () => window.removeEventListener('wp-oauth-result', handler);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>

      {children}
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        display: 'flex', flexDirection: 'column', gap: 8,
        zIndex: 9999, pointerEvents: 'none',
      }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{ pointerEvents: 'all' }}>
            <Toast toast={toast} onRemove={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
