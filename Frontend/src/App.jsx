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
  const [connectionSheet, setConnectionSheet] = useState(null);
  const [dashboardNav, setDashboardNav]   = useState(null);

  const THEMES = {
    blue:   { primary: '#3b82f6', secondary: '#6366f1', accent: '#06b6d4', glow: 'rgba(59,130,246,0.3)' },
    purple: { primary: '#8b5cf6', secondary: '#ec4899', accent: '#a78bfa', glow: 'rgba(139,92,246,0.3)' },
    green:  { primary: '#10b981', secondary: '#06b6d4', accent: '#34d399', glow: 'rgba(16,185,129,0.3)' },
  };
  const [themeKey, setThemeKey] = useState(localStorage.getItem('wp_theme') || 'blue');
  const activeTheme = THEMES[themeKey];

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
              ? <AICockpit user={user} theme={activeTheme} onBack={() => setView('dashboard')} />
              : <Dashboard
                  user={user}
                  onOpenCockpit={() => setView('cockpit')}
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
          onClose={() => setConnectionSheet(null)}
          onNavigate={(nav) => { setConnectionSheet(null); setDashboardNav(nav); }}
        />
      )}
    </>
  );
}
