import React from 'react';
import GlassShader from './GlassShader';

export default function UniqueFeatures() {
  const uniques = [
    {
      title: '🧠 Personalized AI Assistant',
      subtitle: 'Learns Your Communication Style',
      description: 'WorkPilot AI understands how you write emails, messages, and documents, then generates responses that sound naturally like you while preserving your unique tone and professionalism.',
      glowColor: 'var(--blue)'
    },
    {
      title: '📊 Team Productivity Insights',
      subtitle: 'Prevent Burnout Before It Happens',
      description: 'Monitor workload, response times, meeting overload, and task distribution to identify productivity bottlenecks and reduce employee burnout.',
      glowColor: 'var(--purple)'
    },
    {
      title: '📚 Intelligent Knowledge Validation',
      subtitle: 'Keep Company Information Consistent',
      description: 'Automatically detects outdated or conflicting information across documents, knowledge bases, and shared files, ensuring everyone works from the same source of truth.',
      glowColor: 'var(--pink)'
    },
    {
      title: '🔄 Safe Automation',
      subtitle: 'Undo AI Actions Anytime',
      description: 'Every automated email, calendar event, workflow, or task update can be reviewed, tracked, and reverted whenever needed.',
      glowColor: 'var(--green)'
    },
    {
      title: '🔍 Transparent AI Decisions',
      subtitle: 'See Why AI Made a Decision',
      description: 'Every recommendation includes reasoning, data sources, and confidence levels, giving teams complete visibility and trust in AI-generated actions.',
      glowColor: 'var(--amber)'
    },
    {
      title: '⚡ Smart Workflow Protection',
      subtitle: 'Prevent Automation Conflicts',
      description: 'WorkPilot AI detects overlapping automations, duplicate tasks, and conflicting workflows before they create problems, keeping operations smooth and reliable.',
      glowColor: 'var(--indigo)'
    }
  ];

  return (
    <section id="unique-features" className="section-padding reveal-on-scroll" style={{ background: '#000000', borderTop: '1px solid rgba(255, 255, 255, 0.03)' }}>
      <div className="glowing-orb glowing-orb-pink" style={{ top: '40%', right: '-10%', width: '380px', height: '380px' }} />

      <div className="container">
        <div className="section-header">
          <div style={{
            color: 'var(--pink)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '0.75rem'
          }}>
            Exclusive Capabilities
          </div>
          <h2>Why Teams Choose WorkPilot AI</h2>
          <p style={{ maxWidth: '800px', margin: '0 auto' }}>
            Powerful AI capabilities designed to automate work, improve collaboration, and keep your organization productive and secure.
          </p>
        </div>

        <div className="uniques-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '2.5rem'
        }}>
          {uniques.map((item, index) => (
            <div 
              key={index}
              className="glass-card glow-card-top"
              style={{
                padding: '2.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                alignItems: 'flex-start',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <GlassShader />

              {/* Header emoji and Title */}
              <div style={{
                fontSize: '1.3rem',
                fontFamily: 'var(--font-headlines)',
                fontWeight: 800,
                color: '#ffffff',
                position: 'relative',
                zIndex: 1
              }}>
                {item.title}
              </div>

              {/* Subtitle / Catchphrase */}
              <div style={{
                color: 'var(--pink)',
                fontSize: '0.9rem',
                fontWeight: 600,
                letterSpacing: '0.02em',
                fontFamily: 'var(--font-body)',
                position: 'relative',
                zIndex: 1
              }}>
                {item.subtitle}
              </div>

              {/* Description */}
              <p style={{
                color: 'var(--text-muted)',
                fontSize: '0.92rem',
                lineHeight: 1.6,
                position: 'relative',
                zIndex: 1
              }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .uniques-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
