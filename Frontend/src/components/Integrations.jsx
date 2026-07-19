import React from 'react';
import { SiGmail, SiGooglecalendar, SiGoogledrive, SiGoogle, SiGithub, SiZoom, SiNotion, SiJira, SiTrello, SiGooglemeet } from 'react-icons/si';

const SlackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.04a2.528 2.528 0 0 1-2.522 2.52H8.823a2.528 2.528 0 0 1-2.52-2.52v-5.04z" fill="#36C5F0"/>
    <path d="M8.823 5.043a2.528 2.528 0 0 1-2.52-2.52A2.528 2.528 0 0 1 8.823 0a2.528 2.528 0 0 1 2.522 2.522v2.52h-2.522zm0 1.262a2.528 2.528 0 0 1 2.522 2.52v5.043a2.528 2.528 0 0 1-2.522 2.52H3.78a2.528 2.528 0 0 1-2.522-2.52V8.825a2.528 2.528 0 0 1 2.522-2.52h5.043z" fill="#2EB67D"/>
    <path d="M18.958 8.825a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52 2.528 2.528 0 0 1-2.522 2.52h-2.52v-2.52zm-1.261 0a2.528 2.528 0 0 1-2.52 2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52v-5.04a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.04z" fill="#ECB22E"/>
    <path d="M15.177 18.957a2.528 2.528 0 0 1 2.52 2.522 2.528 2.528 0 0 1-2.52 2.52 2.528 2.528 0 0 1-2.522-2.52v-2.522h2.522zm0-1.261a2.528 2.528 0 0 1-2.522-2.52v-5.043a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.043a2.528 2.528 0 0 1-2.522 2.52h-5.043z" fill="#E01E5A"/>
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <rect x="1" y="1" width="10.5" height="10.5" fill="#F25022"/>
    <rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00"/>
    <rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF"/>
    <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900"/>
  </svg>
);

const INTEGRATIONS = [
  { name: 'Gmail',         icon: <SiGmail size={24} color="#EA4335" /> },
  { name: 'Calendar',      icon: <SiGooglecalendar size={24} color="#4285F4" /> },
  { name: 'Google Drive',  icon: <SiGoogledrive size={24} color="#4285F4" /> },
  { name: 'GitHub',        icon: <SiGithub size={24} color="#ffffff" /> },
  { name: 'Slack',         icon: <SlackIcon /> },
  { name: 'Microsoft 365', icon: <MicrosoftIcon /> },
  { name: 'Outlook',       icon: <MicrosoftIcon /> },
  { name: 'Jira',          icon: <SiJira size={24} color="#0052CC" /> },
  { name: 'Notion',        icon: <SiNotion size={24} color="#ffffff" /> },
  { name: 'Zoom',          icon: <SiZoom size={24} color="#2D8CFF" /> },
  { name: 'Google Meet',   icon: <SiGooglemeet size={24} color="#00897B" /> },
  { name: 'Trello',        icon: <SiTrello size={24} color="#0079BF" /> },
];

export default function Integrations() {
  return (
    <section id="integrations" className="section-padding reveal-on-scroll" style={{ background: '#000000', overflow: 'hidden' }}>
      <div className="container">
        <div className="section-header">
          <div style={{ color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Ecosystem Connectivity
          </div>
          <h2>Integrates with Your Entire Stack</h2>
          <p>WorkPilot operates directly inside your favorite productivity channels. No custom scripting needed.</p>
        </div>
      </div>

      <div className="marquee-container" style={{ margin: '2rem 0' }}>
        <div className="marquee-content">
          {INTEGRATIONS.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.25rem 2.5rem', margin: '0 1rem', background: 'rgba(10,10,10,0.65)', border: '1px solid var(--border)', borderRadius: '12px', color: '#ffffff' }}>
              {item.icon}
              <span style={{ fontWeight: 500, fontSize: '1rem', letterSpacing: '-0.01em' }}>{item.name}</span>
            </div>
          ))}
        </div>
        <div className="marquee-content" aria-hidden="true">
          {INTEGRATIONS.map((item, idx) => (
            <div key={`dup-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.25rem 2.5rem', margin: '0 1rem', background: 'rgba(10,10,10,0.65)', border: '1px solid var(--border)', borderRadius: '12px', color: '#ffffff' }}>
              {item.icon}
              <span style={{ fontWeight: 500, fontSize: '1rem', letterSpacing: '-0.01em' }}>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
