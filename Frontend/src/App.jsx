import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { auth } from './firebase';
import './i18n';
import { ToastProvider } from './components/Toast';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import AICockpit from './components/AICockpit';
import UnifiedBackground from './components/UnifiedBackground';
import GlobalParticles from './components/GlobalParticles';
import Navbar from './components/Navbar';
import ConnectionSheet from './components/ConnectionSheet';
import Hero from './components/Hero';
import FeaturesGrid from './components/FeaturesGrid';
import HowItWorks from './components/HowItWorks';
import AutomationWorkspace from './components/AutomationWorkspace';
import LiveDemo from './components/LiveDemo';
import UniqueFeatures from './components/UniqueFeatures';
import Integrations from './components/Integrations';
import Stats from './components/Stats';
import RoiCalculator from './components/RoiCalculator';
import Comparison from './components/Comparison';
import CTA from './components/CTA';
import Footer from './components/Footer';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';

const OAUTH_LABELS = {
  gmail: 'Gmail', google_calendar: 'Google Calendar', google_drive: 'Google Drive',
  google_meet: 'Google Meet', github: 'GitHub', slack: 'Slack', notion: 'Notion',
  zoom: 'Zoom', jira: 'Jira', microsoft_teams: 'Microsoft Teams',
  outlook: 'Outlook', microsoft_365: 'Microsoft 365', trello: 'Trello',
};

/** Reads /dashboard?integrations=X&status=Y and passes it via router state to / — no full reload */
function OAuthRedirect() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const platform = params.get('integrations');
  const status   = params.get('status');
  const message  = params.get('message');
  return <Navigate to="/" replace state={{ oauthResult: { platform, status, message } }} />;
}

/** Shell component — just provides Router + ToastProvider */
export default function App() {
  return (
    <Router>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </Router>
  );
}

/** Main app content — has access to useLocation inside Router */
function AppContent() {
  const location = useLocation();

  const [user, setUser]               = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // true until Firebase confirms
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [view, setView]               = useState('dashboard');
  const [cockpitPrompt, setCockpitPrompt] = useState('');
  const [connectionSheet, setConnectionSheet] = useState(null);
  const [dashboardNav, setDashboardNav]   = useState(null);

  // ── 10 Professional Themes ──────────────────────────────────────────────────
  const THEMES = {
    // 🌑 Dark
    midnight: {
      name: 'Midnight', label: '🌑 Midnight', category: 'dark',
      bg: '#08080b', bgSidebar: '#0d0d12', surface: '#111118', surfaceHover: '#16161e',
      border: 'rgba(255,255,255,0.07)', text: '#ffffff', textMuted: 'rgba(255,255,255,0.45)',
      input: '#18181f', inputBorder: 'rgba(255,255,255,0.1)',
      primary: '#3b82f6', secondary: '#6366f1', accent: '#06b6d4', glow: 'rgba(59,130,246,0.25)',
    },
    obsidian: {
      name: 'Obsidian', label: '🪨 Obsidian', category: 'dark',
      bg: '#0d0d0d', bgSidebar: '#111111', surface: '#161616', surfaceHover: '#1c1c1c',
      border: 'rgba(255,255,255,0.06)', text: '#f0f0f0', textMuted: 'rgba(255,255,255,0.4)',
      input: '#1a1a1a', inputBorder: 'rgba(255,255,255,0.09)',
      primary: '#7c3aed', secondary: '#a78bfa', accent: '#c084fc', glow: 'rgba(124,58,237,0.25)',
    },
    charcoal: {
      name: 'Charcoal', label: '🌫️ Charcoal', category: 'dark',
      bg: '#1a1a1a', bgSidebar: '#1f1f1f', surface: '#252525', surfaceHover: '#2a2a2a',
      border: 'rgba(255,255,255,0.08)', text: '#f5f5f5', textMuted: 'rgba(255,255,255,0.42)',
      input: '#2c2c2c', inputBorder: 'rgba(255,255,255,0.1)',
      primary: '#10b981', secondary: '#06b6d4', accent: '#34d399', glow: 'rgba(16,185,129,0.25)',
    },
    navy: {
      name: 'Navy', label: '🌊 Navy', category: 'dark',
      bg: '#0a0f1e', bgSidebar: '#0f1729', surface: '#131d33', surfaceHover: '#182240',
      border: 'rgba(100,150,255,0.12)', text: '#e8f0ff', textMuted: 'rgba(180,200,255,0.5)',
      input: '#1a2540', inputBorder: 'rgba(100,150,255,0.15)',
      primary: '#06b6d4', secondary: '#3b82f6', accent: '#38bdf8', glow: 'rgba(6,182,212,0.25)',
    },
    // ☁️ Neutral
    slate: {
      name: 'Slate', label: '🔷 Slate', category: 'neutral',
      bg: '#1e2130', bgSidebar: '#222640', surface: '#272c42', surfaceHover: '#2d3350',
      border: 'rgba(148,163,184,0.12)', text: '#e2e8f0', textMuted: 'rgba(148,163,184,0.6)',
      input: '#2d3350', inputBorder: 'rgba(148,163,184,0.15)',
      primary: '#60a5fa', secondary: '#818cf8', accent: '#38bdf8', glow: 'rgba(96,165,250,0.22)',
    },
    stone: {
      name: 'Stone', label: '🟤 Stone', category: 'neutral',
      bg: '#1c1c1e', bgSidebar: '#212121', surface: '#2a2a2a', surfaceHover: '#303030',
      border: 'rgba(255,220,150,0.08)', text: '#f5f0eb', textMuted: 'rgba(245,240,235,0.45)',
      input: '#2f2f2f', inputBorder: 'rgba(255,220,150,0.1)',
      primary: '#f59e0b', secondary: '#f97316', accent: '#fbbf24', glow: 'rgba(245,158,11,0.25)',
    },
    // ☀️ Light
    cloud: {
      name: 'Cloud', label: '☁️ Cloud', category: 'light',
      bg: '#f0f4ff', bgSidebar: '#e8eeff', surface: '#ffffff', surfaceHover: '#f5f8ff',
      border: 'rgba(59,130,246,0.12)', text: '#1e293b', textMuted: 'rgba(30,41,59,0.5)',
      input: '#ffffff', inputBorder: 'rgba(59,130,246,0.2)',
      primary: '#3b82f6', secondary: '#6366f1', accent: '#06b6d4', glow: 'rgba(59,130,246,0.15)',
    },
    pearl: {
      name: 'Pearl', label: '🤍 Pearl', category: 'light',
      bg: '#fafafa', bgSidebar: '#f3f3f5', surface: '#ffffff', surfaceHover: '#f8f8fc',
      border: 'rgba(139,92,246,0.1)', text: '#18181b', textMuted: 'rgba(24,24,27,0.5)',
      input: '#ffffff', inputBorder: 'rgba(139,92,246,0.15)',
      primary: '#8b5cf6', secondary: '#ec4899', accent: '#a78bfa', glow: 'rgba(139,92,246,0.15)',
    },
    // ✨ Premium
    aurora: {
      name: 'Aurora', label: '✨ Aurora', category: 'premium',
      bg: 'linear-gradient(135deg,#0d0d1a 0%,#1a0d2e 50%,#0d1a1a 100%)',
      bgSidebar: 'rgba(20,10,40,0.95)', surface: 'rgba(255,255,255,0.06)', surfaceHover: 'rgba(255,255,255,0.09)',
      border: 'rgba(236,72,153,0.15)', text: '#f0e8ff', textMuted: 'rgba(240,232,255,0.5)',
      input: 'rgba(255,255,255,0.06)', inputBorder: 'rgba(236,72,153,0.2)',
      primary: '#ec4899', secondary: '#8b5cf6', accent: '#f472b6', glow: 'rgba(236,72,153,0.3)',
    },
    frosted: {
      name: 'Frosted', label: '🧊 Frosted', category: 'premium',
      bg: '#10141a', bgSidebar: 'rgba(16,20,26,0.85)', surface: 'rgba(255,255,255,0.05)', surfaceHover: 'rgba(255,255,255,0.08)',
      border: 'rgba(20,184,166,0.15)', text: '#e0f2fe', textMuted: 'rgba(224,242,254,0.5)',
      input: 'rgba(255,255,255,0.06)', inputBorder: 'rgba(20,184,166,0.2)',
      primary: '#14b8a6', secondary: '#0ea5e9', accent: '#2dd4bf', glow: 'rgba(20,184,166,0.3)',
    },
  };

  const [themeKey, setThemeKey] = useState(localStorage.getItem('wp_theme') || 'midnight');
  const activeTheme = THEMES[themeKey] || THEMES.midnight;

  // ── Apply theme as CSS variables on <body> — instant, zero re-render cost ──
  useEffect(() => {
    const T = activeTheme;
    const root = document.documentElement;
    root.style.setProperty('--wp-bg',           T.bg);
    root.style.setProperty('--wp-bg-sidebar',   T.bgSidebar);
    root.style.setProperty('--wp-surface',      T.surface);
    root.style.setProperty('--wp-surface-hover',T.surfaceHover);
    root.style.setProperty('--wp-border',       T.border);
    root.style.setProperty('--wp-text',         T.text);
    root.style.setProperty('--wp-text-muted',   T.textMuted);
    root.style.setProperty('--wp-input',        T.input);
    root.style.setProperty('--wp-input-border', T.inputBorder);
    root.style.setProperty('--wp-primary',      T.primary);
    root.style.setProperty('--wp-secondary',    T.secondary);
    root.style.setProperty('--wp-accent',       T.accent);
    root.style.setProperty('--wp-glow',         T.glow);
    // Light/dark body class for descendant CSS selectors
    document.body.classList.toggle('wp-light', T.category === 'light');
    localStorage.setItem('wp_theme', themeKey);
  }, [themeKey, activeTheme]);



  // ── OAuth result via router state (no full page reload, no flash) ─────────────
  useEffect(() => {
    const r = location.state?.oauthResult;
    if (!r?.platform || !r?.status) return;
    const label = OAUTH_LABELS[r.platform] || r.platform;
    setConnectionSheet({
      platform: r.platform,
      status: r.status,
      accountLabel: null,
      errorMessage: r.message ? decodeURIComponent(r.message) : null,
    });
    setDashboardNav('integrations');
    // Also fire toast
    window.dispatchEvent(new CustomEvent('wp-oauth-result', { detail: { label, status: r.status, message: r.message } }));
  }, [location.state]);

  // ── Firebase Auth ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false); // Firebase has resolved — stop showing loader
      if (currentUser?.emailVerified) {
        if (!localStorage.getItem('wp_tokens')) {
          try {
            const idToken = await currentUser.getIdToken();
            const { backendFirebaseAuth } = await import('./api');
            const res = await backendFirebaseAuth(idToken);
            if (res.data?.tokens) localStorage.setItem('wp_tokens', JSON.stringify(res.data.tokens));
          } catch {}
        }
      }
    });
    return () => unsub();
  }, []);

  // ── Scroll reveal ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('active'); io.unobserve(e.target); } }),
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    const observe = (el) => { if (!el.classList.contains('active')) io.observe(el); };
    document.querySelectorAll('.reveal-on-scroll').forEach(observe);
    const mo = new MutationObserver((muts) => muts.forEach(m => m.addedNodes.forEach(n => {
      if (n.nodeType !== 1) return;
      if (n.classList?.contains('reveal-on-scroll')) observe(n);
      n.querySelectorAll?.('.reveal-on-scroll').forEach(observe);
    })));
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, []);

  const HomePage = () => (
    <>
      <GlobalParticles />
      <Navbar user={user} onAuthClick={() => setShowAuthModal(true)} />
      <Hero user={user} onAuthClick={() => setShowAuthModal(true)} />
      <FeaturesGrid />
      <HowItWorks />
      <AutomationWorkspace />
      <LiveDemo />
      <UniqueFeatures />
      <Integrations />
      <Stats />
      <RoiCalculator />
      <Comparison />
      <CTA user={user} onAuthClick={() => setShowAuthModal(true)} />
      <Footer />
    </>
  );

  return (
    <>
      <UnifiedBackground />

      {/* Block render until Firebase resolves auth state — prevents homepage flash */}
      {authLoading ? (
        <div style={{
          position: 'fixed', inset: 0, background: '#000',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: '#3b82f6',
            animation: 'spin 0.7s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <Routes>
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/dashboard" element={<OAuthRedirect />} />

        <Route path="/" element={
          user && user.emailVerified ? (
            view === 'cockpit'
                ? <AICockpit user={user} theme={activeTheme} initialPrompt={cockpitPrompt} onBack={() => setView('dashboard')} onOpenIntegrations={() => { setDashboardNav('integrations'); setView('dashboard'); }} />
              : <Dashboard
                  user={user}
                  onOpenCockpit={(prompt) => { setCockpitPrompt(prompt || ''); setView('cockpit'); }}
                  themeKey={themeKey}
                  onThemeChange={setThemeKey}
                  initialNav={dashboardNav}
                  onNavConsumed={() => setDashboardNav(null)}
                />
          ) : user && !user.emailVerified ? (
            <>
              <Navbar user={user} onAuthClick={() => setShowAuthModal(true)} />
              <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
                <div style={{ maxWidth: '480px', padding: '3rem 2.5rem', background: 'rgba(7,7,12,0.9)', border: '1.5px solid rgba(0,210,255,0.2)', borderRadius: '20px', boxShadow: '0 0 40px rgba(0,210,255,0.08)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1.25rem' }}>📩</div>
                  <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.75rem' }}>Verify your email</h2>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '2rem' }}>
                    We sent a verification link to <strong style={{ color: '#00d2ff' }}>{user.email}</strong>. Click it to activate your WorkPilot AI workspace.
                  </p>
                  <button onClick={async () => { await user.reload(); if (auth.currentUser?.emailVerified) window.location.reload(); }}
                    style={{ width: '100%', padding: '0.9rem', marginBottom: '0.75rem', borderRadius: '999px', border: '1px solid transparent', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.92rem', background: 'linear-gradient(rgba(8,8,12,0.8),rgba(8,8,12,0.8)) padding-box, linear-gradient(135deg,#00d2ff,#8b5cf6) border-box' }}>
                    I've verified — Enter Workspace →
                  </button>
                  <button onClick={async () => { const { sendEmailVerification } = await import('firebase/auth'); await sendEmailVerification(user); alert('Verification email resent!'); }}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', background: 'none', cursor: 'pointer', fontSize: '0.88rem' }}>
                    Resend verification email
                  </button>
                </div>
              </div>
            </>
          ) : (
            <HomePage />
          )
        } />
      </Routes>
      )}

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {connectionSheet && (
        <ConnectionSheet
          result={connectionSheet}
          onClose={() => {
            setConnectionSheet(null);
            // Set flag so Integrations page knows to reload
            if (connectionSheet.status === 'connected') {
              console.log('✅ App.jsx: Integration connected, setting localStorage flag and firing event');
              localStorage.setItem('wp_integration_just_connected', Date.now().toString());
            }
            // Trigger integrations reload by firing a custom event
            window.dispatchEvent(new CustomEvent('wp-integration-connected'));
          }}
          onNavigate={(nav) => { 
            setConnectionSheet(null); 
            setDashboardNav(nav);
            // Set flag so Integrations page knows to reload
            if (connectionSheet.status === 'connected') {
              console.log('✅ App.jsx: Integration connected (via navigate), setting localStorage flag and firing event');
              localStorage.setItem('wp_integration_just_connected', Date.now().toString());
            }
            // Trigger integrations reload
            window.dispatchEvent(new CustomEvent('wp-integration-connected'));
          }}
        />
      )}
    </>
  );
}
