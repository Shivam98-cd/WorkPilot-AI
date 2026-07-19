import React, { useEffect, useState } from 'react';
import { auth } from './firebase';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import AICockpit from './components/AICockpit';
import UnifiedBackground from './components/UnifiedBackground';
import CursorSparks from './components/CursorSparks';
import Navbar from './components/Navbar';
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

export default function App() {
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'cockpit'

  const THEMES = {
    blue:   { primary: '#3b82f6', secondary: '#6366f1', accent: '#06b6d4', glow: 'rgba(59,130,246,0.3)' },
    purple: { primary: '#8b5cf6', secondary: '#ec4899', accent: '#a78bfa', glow: 'rgba(139,92,246,0.3)' },
    green:  { primary: '#10b981', secondary: '#06b6d4', accent: '#34d399', glow: 'rgba(16,185,129,0.3)' },
  };
  const activeTheme = THEMES[localStorage.getItem('wp_theme') || 'blue'];

  // Monitor Firebase Auth State
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Scroll reveal observer
  useEffect(() => {
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <>
      {/* Global Background Dot-Grid Ripple and Foreground Cursor Sparks */}
      <UnifiedBackground />
      <CursorSparks />

      {user && user.emailVerified ? (
        view === 'cockpit'
          ? <AICockpit user={user} theme={activeTheme} onBack={() => setView('dashboard')} />
          : <Dashboard user={user} onOpenCockpit={() => setView('cockpit')} />
      ) : user && !user.emailVerified ? (
        /* Unverified email — show minimal prompt over landing page */
        <>
          <Navbar user={user} onAuthClick={() => setShowAuthModal(true)} />
          <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '2rem', textAlign: 'center'
          }}>
            <div style={{
              maxWidth: '480px', padding: '3rem 2.5rem',
              background: 'rgba(7,7,12,0.9)',
              border: '1.5px solid rgba(0,210,255,0.2)',
              borderRadius: '20px',
              boxShadow: '0 0 40px rgba(0,210,255,0.08)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1.25rem' }}>📩</div>
              <h2 style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.75rem' }}>
                Verify your email
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '2rem' }}>
                We sent a verification link to{' '}
                <strong style={{ color: '#00d2ff' }}>{user.email}</strong>.
                Click it to activate your WorkPilot AI workspace.
              </p>
              <button
                onClick={async () => {
                  await user.reload();
                  if (auth.currentUser?.emailVerified) window.location.reload();
                }}
                style={{
                  width: '100%', padding: '0.9rem', marginBottom: '0.75rem',
                  borderRadius: '999px', border: '1px solid transparent', color: '#fff',
                  fontWeight: 700, cursor: 'pointer', fontSize: '0.92rem',
                  background: 'linear-gradient(rgba(8,8,12,0.8),rgba(8,8,12,0.8)) padding-box, linear-gradient(135deg,#00d2ff,#8b5cf6) border-box'
                }}
              >
                I've verified — Enter Workspace →
              </button>
              <button
                onClick={async () => {
                  const { sendEmailVerification } = await import('firebase/auth');
                  await sendEmailVerification(user);
                  alert('Verification email resent!');
                }}
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)',
                  background: 'none', cursor: 'pointer', fontSize: '0.88rem'
                }}
              >
                Resend verification email
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
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
      )}

      {/* Auth Panel Overlay Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
