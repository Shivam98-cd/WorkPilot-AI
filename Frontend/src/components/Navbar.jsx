import React, { useState, useEffect } from 'react';
import { auth, signOut } from '../firebase';
import Logo from './Logo';

export default function Navbar({ user, onAuthClick }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      zIndex: 1000,
      background: isScrolled ? 'rgba(0, 0, 0, 0.75)' : 'transparent',
      backdropFilter: isScrolled ? 'blur(16px)' : 'none',
      WebkitBackdropFilter: isScrolled ? 'blur(16px)' : 'none',
      borderBottom: isScrolled ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid transparent',
      transition: 'all 0.3s ease',
      padding: '1.25rem 0'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <a href="#hero" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <Logo height={34} showText={true} />
        </a>

        {/* Desktop Links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2.5rem',
        }} className="desktop-nav">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How It Works</a>
          <a href="#rag" className="nav-link">Workspace</a>
          <a href="#demo" className="nav-link">Interactive Demo</a>
          <a href="#integrations" className="nav-link">Integrations</a>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }} className="desktop-nav">
          {user ? (
            <>
              <span style={{ 
                color: 'var(--text-muted)', 
                fontSize: '0.88rem', 
                fontFamily: 'var(--font-code)',
                borderRight: '1px solid rgba(255,255,255,0.1)',
                paddingRight: '1rem'
              }}>
                [NODE: {user.displayName || user.email.split('@')[0]}]
              </span>
              <button 
                onClick={() => signOut(auth)} 
                className="btn btn-secondary" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={onAuthClick} 
                className="btn btn-secondary" 
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              >
                Sign In
              </button>
              <button 
                onClick={onAuthClick} 
                className="btn btn-primary" 
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              >
                Get started free
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            padding: '0.5rem',
            display: 'none',
          }}
          className="mobile-hamburger"
        >
          {isMobileMenuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '70px',
          left: 0,
          width: '100%',
          height: 'calc(100vh - 70px)',
          background: 'rgba(0,0,0,0.95)',
          backdropFilter: 'blur(20px)',
          padding: '2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
          zIndex: 999,
          borderTop: '1px solid rgba(255,255,255,0.06)'
        }}>
          <a href="#features" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1.25rem', textDecoration: 'none', color: '#ffffff', fontWeight: 500 }}>Features</a>
          <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1.25rem', textDecoration: 'none', color: '#ffffff', fontWeight: 500 }}>How It Works</a>
          <a href="#rag" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1.25rem', textDecoration: 'none', color: '#ffffff', fontWeight: 500 }}>Workspace</a>
          <a href="#demo" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1.25rem', textDecoration: 'none', color: '#ffffff', fontWeight: 500 }}>Interactive Demo</a>
          <a href="#integrations" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1.25rem', textDecoration: 'none', color: '#ffffff', fontWeight: 500 }}>Integrations</a>
          <hr style={{ borderColor: 'rgba(255,255,255,0.06)' }} />
          {user ? (
            <>
              <span style={{ color: '#ffffff', fontSize: '1rem', textAlign: 'center', fontFamily: 'var(--font-code)' }}>
                [NODE: {user.displayName || user.email}]
              </span>
              <button onClick={() => { signOut(auth); setIsMobileMenuOpen(false); }} className="btn btn-secondary" style={{ width: '100%' }}>Sign Out</button>
            </>
          ) : (
            <>
              <button onClick={() => { onAuthClick(); setIsMobileMenuOpen(false); }} className="btn btn-secondary" style={{ width: '100%' }}>Sign In</button>
              <button onClick={() => { onAuthClick(); setIsMobileMenuOpen(false); }} className="btn btn-primary" style={{ width: '100%' }}>Get started free</button>
            </>
          )}
        </div>
      )}

      {/* Inject css for navbar elements directly to avoid boilerplate */}
      <style>{`
        .nav-link {
          text-decoration: none;
          color: var(--text-muted);
          font-weight: 400;
          font-size: 0.95rem;
          transition: color 0.2s ease;
        }
        .nav-link:hover {
          color: #ffffff;
        }
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-hamburger {
            display: block !important;
          }
        }
      `}</style>
    </nav>
  );
}
