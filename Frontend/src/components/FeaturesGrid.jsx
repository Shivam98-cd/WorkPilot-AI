import React from 'react';
import GlassShader from './GlassShader';

export default function FeaturesGrid() {
  const features = [
    {
      title: 'Smart Email Management',
      description: 'Automatically draft, summarize, prioritize, and schedule follow-ups across your inbox.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      ),
      morphTarget: 'envelope'
    },
    {
      title: 'AI Meeting Assistant',
      description: 'Schedules meetings, prepares agendas, records action items, and tracks follow-ups automatically.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      )
    },
    {
      title: 'Intelligent Task Orchestration',
      description: 'Converts emails, chats, and meeting notes into actionable tasks across Jira, Trello, Asana, and GitHub.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="12" x2="2" y2="12"></line>
          <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
          <line x1="6" y1="16" x2="6.01" y2="16"></line>
          <line x1="10" y1="16" x2="10.01" y2="16"></line>
        </svg>
      ),
      morphTarget: 'shield'
    },
    {
      title: 'Multi-Agent Collaboration',
      description: 'Specialized AI agents collaborate on scheduling, research, documentation, reporting, and project management simultaneously.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72"></path>
        </svg>
      )
    },
    {
      title: 'Unified Workplace Search',
      description: 'Instantly search Gmail, Slack, Drive, Notion, Confluence, GitHub, Jira, and more through one conversational interface.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      )
    },
    {
      title: 'Executive Insights',
      description: 'Receive AI-powered dashboards highlighting project health, deadlines, team productivity, and operational risks.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="3" x2="9" y2="21"></line>
          <line x1="15" y1="3" x2="15" y2="21"></line>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <line x1="3" y1="15" x2="21" y2="15"></line>
        </svg>
      )
    }
  ];

  const handleMouseEnter = (target) => {
    if (target) {
      window.dispatchEvent(new CustomEvent('workpilot-morph-brain', { detail: { shape: target } }));
    }
  };

  const handleMouseLeave = (target) => {
    if (target) {
      window.dispatchEvent(new CustomEvent('workpilot-morph-brain', { detail: { shape: 'sphere' } }));
    }
  };

  return (
    <section id="features" className="section-padding reveal-on-scroll" style={{ background: '#000000' }}>
      <div className="container">
        <div className="section-header">
          <div style={{
            color: 'var(--blue)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '0.75rem'
          }}>
            Exclusive Capabilities
          </div>
          <h2>Everything Your Team Needs to Work Smarter</h2>
          <p style={{ maxWidth: '800px', margin: '0 auto' }}>
            From intelligent email management and meeting automation to AI-powered knowledge search and workflow orchestration, WorkPilot AI unifies every workplace tool into one intelligent workspace—helping teams save time, stay aligned, and achieve more.
          </p>
        </div>

        <div className="features-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: '1.5rem'
        }}>
          {features.map((feat, index) => (
            <div 
              key={index}
              className="glass-card"
              onMouseEnter={() => handleMouseEnter(feat.morphTarget)}
              onMouseLeave={() => handleMouseLeave(feat.morphTarget)}
              style={{
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <GlassShader />

              {/* Icon Container */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'var(--blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 0 10px rgba(255,255,255,0.02)',
                position: 'relative',
                zIndex: 1
              }} className="feature-icon-container">
                {feat.icon}
              </div>

              {/* Text info */}
              <h3 style={{
                fontSize: '1.2rem',
                fontFamily: 'var(--font-headlines)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#ffffff',
                position: 'relative',
                zIndex: 1
              }}>
                {feat.title}
              </h3>
              
              <p style={{
                color: 'var(--text-muted)',
                fontSize: '0.92rem',
                lineHeight: 1.6,
                position: 'relative',
                zIndex: 1
              }}>
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      <style>{`
        .glass-card:hover .feature-icon-container {
          color: #ffffff !important;
          border-color: rgba(255,255,255,0.2) !important;
          background: linear-gradient(135deg, var(--blue), var(--purple)) !important;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
        }
      `}</style>
    </section>
  );
}
