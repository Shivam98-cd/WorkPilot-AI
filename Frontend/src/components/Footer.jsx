import React, { useState } from 'react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | success | error

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) { setStatus('error'); return; }
    setStatus('success');
    setEmail('');
  };

  return (
    <footer style={{ background: '#000', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 1 }}>

      {/* ── Early Access Banner ── */}
      <div style={{ padding: '5rem 1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Glow blobs */}
        <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse, rgba(0,120,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 99, background: 'rgba(0,120,255,0.1)', border: '1px solid rgba(0,120,255,0.25)', marginBottom: '1.5rem' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e', display: 'inline-block' }} />
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>2,400+ teams on waitlist</span>
          </div>

          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, fontFamily: 'var(--font-headlines)', color: '#fff', lineHeight: 1.2, marginBottom: '1rem' }}>
            Get Early Access to<br />
            <span style={{ background: 'linear-gradient(135deg, #0078ff, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>WorkPilot AI</span>
          </h2>

          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Join thousands of teams automating their workflows. Be the first to access new features, get priority onboarding, and lock in founding member pricing.
          </p>

          {/* Email form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, maxWidth: 480, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setStatus('idle'); }}
              placeholder="Enter your work email"
              style={{
                flex: 1, minWidth: 220, padding: '0.85rem 1.25rem',
                borderRadius: 12, background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${status === 'error' ? '#ef4444' : 'rgba(255,255,255,0.12)'}`,
                color: '#fff', fontSize: '0.95rem', outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <button type="submit" style={{
              padding: '0.85rem 1.75rem', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #0078ff, #8b5cf6)',
              color: '#fff', fontWeight: 700, fontSize: '0.95rem',
              cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: '0 4px 20px rgba(0,120,255,0.35)',
              transition: 'opacity 0.2s',
            }}>
              Join Waitlist →
            </button>
          </form>

          {/* Status messages */}
          {status === 'success' && (
            <p style={{ marginTop: '1rem', color: '#22c55e', fontSize: '0.9rem' }}>✓ You're on the list! We'll be in touch soon.</p>
          )}
          {status === 'error' && (
            <p style={{ marginTop: '1rem', color: '#ef4444', fontSize: '0.9rem' }}>Please enter a valid email address.</p>
          )}

          <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.25)', fontSize: '0.78rem' }}>
            No credit card required · Cancel anytime · SOC2 certified
          </p>
        </div>
      </div>

      {/* ── Copyright Bar ── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', maxWidth: 1200, margin: '0 auto' }}>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem' }}>
          © {new Date().getFullYear()} WorkPilot AI. All rights reserved.
        </span>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <a href="#" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="#" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', textDecoration: 'none' }}>Terms of Service</a>
        </div>
      </div>

    </footer>
  );
}
