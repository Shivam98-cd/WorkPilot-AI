import React, { useState } from 'react';

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: '01',
      title: 'Configure Triggers',
      description: 'Connect inputs like Gmail, Webhooks, Slack channels, or production CI/CD servers. Set rules defining when WorkPilot should intervene.',
      details: {
        title: 'Step 1: Input Trigger Setup',
        input: 'Webhook: POST /github-webhook/deploy-failure',
        payload: '{\n  "repository": "workpilot-core",\n  "status": "failed",\n  "error": "SIGTERM memory limit reached"\n}',
        status: 'Trigger active'
      }
    },
    {
      num: '02',
      title: 'Agent Context Parsing (RAG)',
      description: 'WorkPilot agent spins up, references internal guidelines via semantic vector search, checks logs, and drafts an optimal resolution path.',
      details: {
        title: 'Step 2: RAG Reasoning Context',
        input: 'Query: "How to resolve SIGTERM in memory limit?"',
        payload: '1. Checking standard SOP: "CI/CD memory exhaustion"\n2. Recommendation: Increase max-old-space-size to 4096MB\n3. Action Path determined: Modify config and re-trigger build.',
        status: 'Reasoning computed'
      }
    },
    {
      num: '03',
      title: 'Audited Action Execution',
      description: 'The bot executes the command inside a secure sandbox. The human manager is notified and has a 60-minute undo safety window.',
      details: {
        title: 'Step 3: Secure Execution Logs',
        input: 'Command: workpilot deploy production --oom-fix',
        payload: 'Updating env variable NODE_OPTIONS=--max-old-space-size=4096\nRe-running build #842... [SUCCESS]\nDeploying container... [COMPLETED]\n60-minute rollback window timer initiated.',
        status: 'Execution complete'
      }
    }
  ];

  return (
    <section id="how-it-works" className="section-padding reveal-on-scroll" style={{ background: '#000000', borderTop: '1px solid rgba(255, 255, 255, 0.03)' }}>
      {/* Background ambient lighting */}
      <div className="glowing-orb glowing-orb-purple" style={{ top: '30%', left: '70%', width: '300px', height: '300px' }} />

      <div className="container">
        <div className="section-header">
          <div style={{
            color: 'var(--purple)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '0.75rem'
          }}>
            Operational Flow
          </div>
          <h2>How WorkPilot Orchestrates Tasks</h2>
          <p>Go from incident or inbound request to automated resolution in three secure steps.</p>
        </div>

        <div className="how-it-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4rem',
          alignItems: 'center'
        }}>
          {/* Left Column: Numbered Step Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {steps.map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className="glass-card"
                  style={{
                    padding: '2rem',
                    cursor: 'pointer',
                    borderColor: isActive ? 'var(--purple)' : 'var(--border)',
                    background: isActive ? 'rgba(139, 92, 246, 0.05)' : 'rgba(10, 10, 10, 0.65)',
                    transition: 'all 0.3s ease',
                    transform: isActive ? 'translateY(-2px)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                    <div style={{
                      fontFamily: 'var(--font-headlines)',
                      fontSize: '2rem',
                      fontWeight: 800,
                      color: isActive ? 'var(--purple)' : 'var(--text-muted)',
                      lineHeight: 1,
                      transition: 'color 0.3s ease'
                    }}>
                      {step.num}
                    </div>
                    <div>
                      <h3 style={{
                        fontSize: '1.25rem',
                        marginBottom: '0.5rem',
                        color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.85)',
                        transition: 'color 0.3s ease'
                      }}>
                        {step.title}
                      </h3>
                      <p style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.95rem',
                        lineHeight: 1.5
                      }}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Interactive Diagram Nodes & Code Output */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Visual Nodes representation */}
            <div className="glass-card" style={{
              padding: '2rem',
              background: 'rgba(5, 5, 5, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              {/* Nodes row */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'relative',
                marginBottom: '2rem'
              }}>
                {/* SVG Connecting lines with moving dash */}
                <svg style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  width: '100%',
                  height: '4px',
                  transform: 'translateY(-50%)',
                  zIndex: 0,
                  pointerEvents: 'none'
                }}>
                  <line x1="10%" y1="50%" x2="90%" y2="50%" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                  <line 
                    x1="10%" 
                    y1="50%" 
                    x2="90%" 
                    y2="50%" 
                    stroke="var(--purple)" 
                    strokeWidth="3" 
                    strokeDasharray="8 6" 
                    style={{
                      animation: 'moveDash 1.5s linear infinite',
                    }}
                  />
                </svg>

                {/* Node 1: Trigger */}
                <div style={{
                  zIndex: 1,
                  background: activeStep === 0 ? 'var(--blue)' : 'var(--card)',
                  border: `2px solid ${activeStep === 0 ? 'var(--blue)' : 'var(--border)'}`,
                  color: '#ffffff',
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: activeStep === 0 ? '0 0 15px rgba(59, 130, 246, 0.6)' : 'none'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                </div>

                {/* Node 2: Brain */}
                <div style={{
                  zIndex: 1,
                  background: activeStep === 1 ? 'var(--purple)' : 'var(--card)',
                  border: `2px solid ${activeStep === 1 ? 'var(--purple)' : 'var(--border)'}`,
                  color: '#ffffff',
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: activeStep === 1 ? '0 0 20px rgba(139, 92, 246, 0.7)' : 'none'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72"></path>
                    <path d="M12 2.27c.45 6.03.62 10.42 2.03 19.48"></path>
                  </svg>
                </div>

                {/* Node 3: Execution */}
                <div style={{
                  zIndex: 1,
                  background: activeStep === 2 ? 'var(--green)' : 'var(--card)',
                  border: `2px solid ${activeStep === 2 ? 'var(--green)' : 'var(--border)'}`,
                  color: '#ffffff',
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: activeStep === 2 ? '0 0 15px rgba(34, 197, 150, 0.6)' : 'none'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                </div>
              </div>

              {/* Node explanation details */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '1.25rem',
                fontFamily: 'var(--font-code)',
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: '#ffffff', fontWeight: 600 }}>{steps[activeStep].details.title}</span>
                  <span style={{ 
                    color: activeStep === 0 ? 'var(--blue)' : activeStep === 1 ? 'var(--purple)' : 'var(--green)',
                    fontWeight: 500
                  }}>
                    {steps[activeStep].details.status}
                  </span>
                </div>
                <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  {steps[activeStep].details.input}
                </div>
                <pre style={{ color: '#ffffff', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {steps[activeStep].details.payload}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes moveDash {
          to {
            stroke-dashoffset: -20;
          }
        }
        @media (max-width: 768px) {
          .how-it-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem;
          }
        }
      `}</style>
    </section>
  );
}
