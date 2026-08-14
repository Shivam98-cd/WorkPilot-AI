import React, { useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaXTwitter, FaLinkedin, FaGithub, FaYoutube } from 'react-icons/fa6';

const Footer = memo(function Footer() {
  const { t } = useTranslation(['common', 'home']);
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
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{t('home:waitlist.badge', { count: 2400 })}</span>
          </div>

          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, fontFamily: 'var(--font-headlines)', color: '#fff', lineHeight: 1.2, marginBottom: '1rem' }}>
            <span style={{ background: 'linear-gradient(135deg, #0078ff, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {t('home:waitlist.title')}
            </span>
          </h2>

          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            {t('home:waitlist.description')}
          </p>

          {/* Email form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, maxWidth: 480, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setStatus('idle'); }}
              placeholder={t('home:waitlist.placeholder')}
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
              {t('home:waitlist.button')} →
            </button>
          </form>

          {/* Status messages */}
          {status === 'success' && (
            <p style={{ marginTop: '1rem', color: '#22c55e', fontSize: '0.9rem' }}>✓ {t('home:waitlist.success')}</p>
          )}
          {status === 'error' && (
            <p style={{ marginTop: '1rem', color: '#ef4444', fontSize: '0.9rem' }}>{t('home:waitlist.error')}</p>
          )}

          <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.25)', fontSize: '0.78rem' }}>
            {t('home:waitlist.disclaimer')}
          </p>
        </div>
      </div>

      {/* ── Main Footer Content ── */}
      <div style={{ 
        borderTop: '1px solid rgba(255,255,255,0.05)', 
        padding: '3rem 2rem',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '3rem',
          marginBottom: '3rem'
        }}>
          
          {/* Company Info */}
          <div>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 800, 
              fontFamily: 'var(--font-headlines)',
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              WorkPilot AI
            </div>
            <p style={{ 
              color: 'rgba(255,255,255,0.5)', 
              fontSize: '0.9rem', 
              lineHeight: 1.6,
              marginBottom: '1.5rem'
            }}>
              The future of workplace automation. AI-powered agents that handle email, scheduling, tasks, and more.
            </p>
            
            {/* Social Links */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <a 
                href="https://twitter.com/workpilotai" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.6)',
                  transition: 'all 0.2s',
                  textDecoration: 'none'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(59,130,246,0.15)';
                  e.currentTarget.style.borderColor = 'var(--blue)';
                  e.currentTarget.style.color = 'var(--blue)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                }}
              >
                <FaXTwitter size={18} />
              </a>
              
              <a 
                href="https://linkedin.com/company/workpilotai" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.6)',
                  transition: 'all 0.2s',
                  textDecoration: 'none'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(59,130,246,0.15)';
                  e.currentTarget.style.borderColor = 'var(--blue)';
                  e.currentTarget.style.color = 'var(--blue)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                }}
              >
                <FaLinkedin size={18} />
              </a>
              
              <a 
                href="https://github.com/workpilotai" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.6)',
                  transition: 'all 0.2s',
                  textDecoration: 'none'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(59,130,246,0.15)';
                  e.currentTarget.style.borderColor = 'var(--blue)';
                  e.currentTarget.style.color = 'var(--blue)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                }}
              >
                <FaGithub size={18} />
              </a>
              
              <a 
                href="https://youtube.com/@workpilotai" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.6)',
                  transition: 'all 0.2s',
                  textDecoration: 'none'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
                  e.currentTarget.style.borderColor = '#ef4444';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                }}
              >
                <FaYoutube size={18} />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 style={{ 
              color: '#ffffff', 
              fontSize: '0.9rem', 
              fontWeight: 700, 
              marginBottom: '1.25rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              {t('footer.product')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {['Features', 'Integrations', 'Pricing', 'Demo', 'Changelog', 'Roadmap'].map(link => (
                <a 
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  style={{ 
                    color: 'rgba(255,255,255,0.5)', 
                    fontSize: '0.9rem', 
                    textDecoration: 'none',
                    transition: 'color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.color = 'var(--blue)'}
                  onMouseOut={(e) => e.target.style.color = 'rgba(255,255,255,0.5)'}
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 style={{ 
              color: '#ffffff', 
              fontSize: '0.9rem', 
              fontWeight: 700, 
              marginBottom: '1.25rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              {t('footer.company')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'About Us', href: '#about' },
                { label: 'Blog', href: '#blog' },
                { label: 'Careers', href: '#careers' },
                { label: 'Press Kit', href: '#press' },
                { label: 'Partners', href: '#partners' },
                { label: 'Contact', href: '#contact' }
              ].map(link => (
                <a 
                  key={link.label}
                  href={link.href}
                  style={{ 
                    color: 'rgba(255,255,255,0.5)', 
                    fontSize: '0.9rem', 
                    textDecoration: 'none',
                    transition: 'color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.color = 'var(--blue)'}
                  onMouseOut={(e) => e.target.style.color = 'rgba(255,255,255,0.5)'}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 style={{ 
              color: '#ffffff', 
              fontSize: '0.9rem', 
              fontWeight: 700, 
              marginBottom: '1.25rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              {t('footer.contact')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  General Inquiries
                </div>
                <a 
                  href="mailto:hello@workpilot.ai"
                  style={{ 
                    color: 'var(--blue)', 
                    fontSize: '0.9rem', 
                    textDecoration: 'none'
                  }}
                >
                  hello@workpilot.ai
                </a>
              </div>
              
              <div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  Support
                </div>
                <a 
                  href="mailto:support@workpilot.ai"
                  style={{ 
                    color: 'var(--blue)', 
                    fontSize: '0.9rem', 
                    textDecoration: 'none'
                  }}
                >
                  support@workpilot.ai
                </a>
              </div>
              
              <div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  Sales
                </div>
                <a 
                  href="mailto:sales@workpilot.ai"
                  style={{ 
                    color: 'var(--blue)', 
                    fontSize: '0.9rem', 
                    textDecoration: 'none'
                  }}
                >
                  sales@workpilot.ai
                </a>
              </div>
              
              <div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  Address
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  123 Innovation Street<br />
                  San Francisco, CA 94105<br />
                  United States
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div style={{ 
        borderTop: '1px solid rgba(255,255,255,0.05)', 
        padding: '1.5rem 2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '1rem', 
        maxWidth: 1400, 
        margin: '0 auto' 
      }}>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem' }}>
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </span>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <a href="/privacy" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}>
            {t('footer.privacyPolicy')}
          </a>
          <a href="/terms" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}>
            {t('footer.termsOfService')}
          </a>
          <a href="#cookies" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}>
            Cookie Settings
          </a>
          <a href="https://status.workpilot.ai" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', textDecoration: 'none', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '0.35rem' }} onMouseOver={(e) => e.target.style.color = '#22c55e'} onMouseOut={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            {t('footer.status')}
          </a>
        </div>
      </div>

    </footer>
  );
});

export default Footer;
