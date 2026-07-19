import React from 'react';

export default function CTA({ user, onAuthClick }) {
  return (
    <section id="cta" className="section-padding reveal-on-scroll" style={{ background: '#000000', overflow: 'hidden' }}>
      <div className="container">
        <div className="glass-card" style={{
          padding: '4.5rem 2rem',
          textAlign: 'center',
          background: 'radial-gradient(circle at top, rgba(139, 92, 246, 0.12) 0%, rgba(10, 10, 10, 0.8) 70%)',
          borderColor: 'rgba(139, 92, 246, 0.2)',
          position: 'relative',
          borderRadius: '24px'
        }}>
          {/* Ambient orbs inside the CTA block */}
          <div className="glowing-orb glowing-orb-purple" style={{ top: '-10%', left: '30%', width: '250px', height: '250px' }} />
          <div className="glowing-orb glowing-orb-blue" style={{ bottom: '-10%', right: '20%', width: '200px', height: '200px' }} />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '650px', margin: '0 auto' }}>
            <h2 className="animated-gradient-text" style={{
              fontSize: 'clamp(2rem, 4vw, 3.2rem)',
              lineHeight: 1.15,
              marginBottom: '1.25rem',
            }}>
              Supercharge Your Workflow Today
            </h2>
            
            <p style={{
              color: 'rgba(255, 255, 255, 0.75)',
              fontSize: '1.05rem',
              marginBottom: '2.5rem',
              lineHeight: 1.6
            }}>
              Join progressive companies automating code health, managing complex email sequences, and running background data syncs securely with WorkPilot.
            </p>

            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              {user ? (
                <a href="#demo" className="btn btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
                  Go to Workspace Console
                </a>
              ) : (
                <button onClick={onAuthClick} className="btn btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1rem', cursor: 'pointer', border: 'none' }}>
                  Deploy Agent Free
                </button>
              )}
              <a href="#features" className="btn btn-secondary" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
                Schedule Demo call
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
