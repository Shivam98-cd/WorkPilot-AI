import React, { useState, useEffect, useRef } from 'react';
import GlassShader from './GlassShader';

export default function AutomationWorkspace() {
  const [activeTab, setActiveTab] = useState('scheduler');
  const [logLines, setLogLines] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const sparkCanvasRef = useRef(null);

  const workflows = {
    scheduler: {
      title: 'Temporal Slot Solver',
      description: 'Parses timezone overlap, evaluates busy-state matrices, and inserts event transactions to primary and secondary calendar databases.',
      triggerIcon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ea4335" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      ),
      triggerLabel: 'SMTP Inbound Port',
      actionIcon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4285f4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      ),
      actionLabel: 'Calendar DB Commit',
      logs: [
        '$ workpilot schedule --attendee=julia@invest.com --resolve-slots --timezone=UTC',
        '[SYS_TRIGGER] SMTP packet parsed: UID_28482; "Sync next Tuesday 2pm EST"',
        '[SOLVER] Mapping temporal boundaries: Tuesday, July 21st (19:00 UTC)...',
        '[INDEX_SEARCH] Fetching availability bitmap via GCal REST endpoint... [OK]',
        '[COMPUTE] Slot 19:00 - 19:30 UTC: Cosine availability = 1.0 (FREE)',
        '[DB_TRANSACTION] Issuing calendar write lock... ID: event_84a92',
        '[ACTION] Commit complete. Dispatching invitation envelope...',
        '[SUCCESS] Exit code: 0'
      ]
    },
    followups: {
      title: 'Recurrence Follow-up Daemon',
      description: 'Triggers recurring cron queries to evaluate stale CRM deals, extracts style features from previous emails, and builds reply models.',
      triggerIcon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      ),
      triggerLabel: 'Cron Daemon',
      actionIcon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      ),
      actionLabel: 'Gmail Draft Sink',
      logs: [
        '$ workpilot email --run-followup --delay=3d --heuristics=tone-matching',
        '[DAEMON] Running batch query: CRM deals status where updated_at < date_sub(now(), interval 3 day)',
        '[PARSER] Key hit: Deal ID: acme_corp_849; Status: Awaiting Client Reply.',
        '[NLP_INGEST] Tokenizing email corpus... Mimicry model loaded: Style=Concise.',
        '[TRANSFORMER] Drafting message payload: "Hi Sarah, checking if you had..."',
        '[API_COMMIT] Injecting draft transaction block to user Gmail drafts folder... [OK]',
        '[STATUS] Job sync succeeded. Memory pool cleaned.'
      ]
    },
    devops: {
      title: 'CI/CD Auto-Remediation Handler',
      description: 'Intercepts build failure signal metrics, runs diagnostic stack traces, and commits environment override configurations in real-time.',
      triggerIcon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#ffffff' }}>
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.76-1.604-2.665-.305-5.467-1.334-5.467-5.93 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.24 2.874.118 3.176.77.84 1.235 1.91 1.235 3.22 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      ),
      triggerLabel: 'GitHub Actions Webhook',
      actionIcon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="4"></rect>
          <path d="M6 10h12M12 6v12"></path>
        </svg>
      ),
      actionLabel: 'Hotfix Deploy Container',
      logs: [
        '$ workpilot deploy --monitor-ci --auto-rollback --sigterm-handler',
        '[WEBHOOK] Intercepted pipeline status signal: run_id=842; state=FAILED.',
        '[TRACER] Ingesting runner stack trace... Caught OOM signal: exit_code=137.',
        '[DIAGNOSTIC] Identified heap resource allocation wall: max_old_space_size=512MB.',
        '[HEURISTIC_HOTFIX] Modifying configurations: NODE_OPTIONS = "--max-old-space-size=4096MB".',
        '[GIT] Pushing hotfix commit payload: [main 92ab41] DevOps resource update.',
        '[RETRIGGER] Initiating rebuilding sequence for container registry...',
        '[REPLAY_SUCCESS] Build verified. 60m Transaction Rollback window active.'
      ]
    }
  };

  const currentWorkflow = workflows[activeTab];

  // Function to animate the glowing particle sparks traveling between nodes
  const shootSparks = () => {
    const canvas = sparkCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = (canvas.width = canvas.offsetWidth);
    const height = (canvas.height = canvas.offsetHeight);

    const nodeY = height / 2;
    const startX = width * 0.12;
    const brainX = width * 0.5;
    const endX = width * 0.88;

    const sparks = [];
    const trailSparks = [];

    // Initialize 12 glowing runner sparks
    for (let i = 0; i < 12; i++) {
      sparks.push({
        x: startX,
        y: nodeY,
        vx: 3.5 + Math.random() * 2.2,
        vy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 1.6 + 1.2,
        phase: 1, // 1: trigger -> brain, 2: processing delay, 3: brain -> action, 4: complete
        timer: 0
      });
    }

    let animFrame;

    const update = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Update trail sparks
      for (let i = trailSparks.length - 1; i >= 0; i--) {
        const t = trailSparks[i];
        t.x += t.vx;
        t.y += t.vy;
        t.alpha -= 0.03;
        t.size -= 0.04;

        if (t.alpha <= 0 || t.size <= 0) {
          trailSparks.splice(i, 1);
          continue;
        }

        ctx.fillStyle = `rgba(245, 158, 11, ${t.alpha})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
        ctx.fill();
      }

      let activeSparksCount = 0;

      // 2. Update core runner sparks
      sparks.forEach((p) => {
        if (p.phase === 1) {
          activeSparksCount++;
          p.x += p.vx;
          p.y += p.vy;

          // emit trail particles
          if (Math.random() > 0.4) {
            trailSparks.push({
              x: p.x,
              y: p.y,
              vx: (Math.random() - 0.5) * 0.5,
              vy: (Math.random() - 0.5) * 0.5,
              size: p.size * 0.7,
              alpha: 0.7
            });
          }

          // Reach Brain (middle)
          if (p.x >= brainX) {
            p.x = brainX;
            p.y = nodeY;
            p.phase = 2;
            p.timer = 24; // delay frames
            
            // brain splash sparks
            for (let k = 0; k < 6; k++) {
              trailSparks.push({
                x: brainX,
                y: nodeY,
                vx: (Math.random() - 0.5) * 3.5,
                vy: (Math.random() - 0.5) * 3.5,
                size: Math.random() * 2 + 1,
                alpha: 1.0
              });
            }
          }
        } else if (p.phase === 2) {
          activeSparksCount++;
          p.timer--;
          if (p.timer <= 0) {
            p.phase = 3;
            p.vx = 4.0 + Math.random() * 2.0; // speed up to target
          }
        } else if (p.phase === 3) {
          activeSparksCount++;
          p.x += p.vx;
          p.y += p.vy;

          // emit trail particles
          if (Math.random() > 0.4) {
            trailSparks.push({
              x: p.x,
              y: p.y,
              vx: (Math.random() - 0.5) * 0.5,
              vy: (Math.random() - 0.5) * 0.5,
              size: p.size * 0.7,
              alpha: 0.7
            });
          }

          // Reach Action (right)
          if (p.x >= endX) {
            p.x = endX;
            p.y = nodeY;
            p.phase = 4; // Complete

            // final splash sparks
            for (let k = 0; k < 8; k++) {
              trailSparks.push({
                x: endX,
                y: nodeY,
                vx: (Math.random() - 0.5) * 4.0,
                vy: (Math.random() - 0.5) * 4.0,
                size: Math.random() * 2 + 1,
                alpha: 1.0
              });
            }
          }
        }

        // Draw active packets
        if (p.phase === 1 || p.phase === 3) {
          ctx.fillStyle = p.phase === 1 ? '#f59e0b' : '#3b82f6';
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.phase === 1 ? '#f59e0b' : '#3b82f6';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size + 1.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        }
      });

      if (activeSparksCount > 0 || trailSparks.length > 0) {
        animFrame = requestAnimationFrame(update);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    animFrame = requestAnimationFrame(update);
  };

  // Run typing effect + shoot sparks on active tab change
  useEffect(() => {
    setIsTyping(true);
    setLogLines([]);
    
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < currentWorkflow.logs.length) {
        setLogLines(prev => [...prev, currentWorkflow.logs[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 350);

    // Trigger visual sparks connection
    setTimeout(shootSparks, 100);

    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <section id="rag" className="section-padding reveal-on-scroll" style={{ background: '#000000' }}>
      {/* Background glow orb */}
      <div className="glowing-orb glowing-orb-blue" style={{ bottom: '10%', left: '10%', width: '350px', height: '350px' }} />

      <div className="container">
        <div className="section-header">
          <div style={{
            color: 'var(--amber)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '0.75rem'
          }}>
            State-Machine Workspace
          </div>
          <h2>Interactive Automation Workspace</h2>
          <p>Choose an operational recipe to watch WorkPilot intercept triggers, coordinate context, and execute actions.</p>
        </div>

        {/* Tab selection buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '3rem',
          flexWrap: 'wrap'
        }}>
          {Object.keys(workflows).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setActiveTab(tabKey)}
              disabled={isTyping}
              className="btn btn-secondary"
              style={{
                borderColor: activeTab === tabKey ? 'var(--amber)' : 'var(--border)',
                background: activeTab === tabKey ? 'rgba(245, 158, 11, 0.08)' : 'rgba(10, 10, 10, 0.65)',
                color: '#ffffff',
                fontWeight: 500,
                opacity: isTyping && activeTab !== tabKey ? 0.4 : 1
              }}
            >
              {workflows[tabKey].title}
            </button>
          ))}
        </div>

        {/* Simulator Grid */}
        <div className="rag-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1.25fr 0.75fr',
          gap: '3rem',
          alignItems: 'stretch'
        }}>
          {/* Left Column: Flowchart Nodes */}
          <div className="glass-card" style={{
            padding: '2.5rem',
            background: 'rgba(5, 5, 5, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <GlassShader />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                fontSize: '0.85rem',
                color: 'var(--amber)',
                fontFamily: 'var(--font-code)',
                marginBottom: '1.5rem'
              }}>
                [ACTIVE STATE REGISTRY: {activeTab.toUpperCase()}]
              </div>

              <h3 style={{ fontSize: '1.5rem', marginBottom: '1.25rem' }}>
                {currentWorkflow.title}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '3rem', maxWidth: '580px', lineHeight: 1.6 }}>
                {currentWorkflow.description}
              </p>

              {/* Node Diagram Container */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                padding: '0 1rem',
                height: '80px'
              }}>
                {/* SVG connection wire */}
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
                  <line x1="8%" y1="50%" x2="92%" y2="50%" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                </svg>

                {/* Canvas Overlay for shooting particle sparks */}
                <canvas 
                  ref={sparkCanvasRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 1,
                    pointerEvents: 'none'
                  }}
                />

                {/* Node 1: Input Trigger */}
                <div style={{
                  zIndex: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '2px solid rgba(245, 158, 11, 0.3)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 15px rgba(245, 158, 11, 0.1)'
                  }}>
                    {currentWorkflow.triggerIcon}
                  </div>
                  <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-code)', color: 'var(--text-muted)' }}>
                    {currentWorkflow.triggerLabel}
                  </span>
                </div>

                {/* Node 2: WorkPilot Brain */}
                <div style={{
                  zIndex: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--blue), var(--purple))',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 25px rgba(139, 92, 246, 0.5)'
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72"></path>
                    </svg>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-code)', color: '#ffffff', fontWeight: 600 }}>
                    WorkPilot Brain
                  </span>
                </div>

                {/* Node 3: Output Action */}
                <div style={{
                  zIndex: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '2px solid rgba(59, 130, 246, 0.3)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 15px rgba(59, 130, 246, 0.1)'
                  }}>
                    {currentWorkflow.actionIcon}
                  </div>
                  <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-code)', color: 'var(--text-muted)' }}>
                    {currentWorkflow.actionLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Execution Terminal */}
          <div className="glass-card" style={{
            padding: '2rem',
            background: 'rgba(2, 2, 2, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-code)',
            fontSize: '0.82rem',
            position: 'relative'
          }}>
            <div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '1.5rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }}></span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }}></span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }}></span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto', maxHeight: '280px' }}>
                {logLines.map((line, idx) => {
                  let color = '#ffffff';
                  if (line.startsWith('$')) color = 'var(--blue)';
                  else if (line.startsWith('[SYS_TRIGGER]') || line.startsWith('[DAEMON]') || line.startsWith('[WEBHOOK]')) color = 'var(--amber)';
                  else if (line.startsWith('[DB_TRANSACTION]') || line.startsWith('[API_COMMIT]') || line.startsWith('[GIT]')) color = 'var(--purple)';
                  else if (line.startsWith('[SUCCESS]') || line.startsWith('[REPLAY_SUCCESS]') || line.startsWith('[STATUS]')) color = 'var(--green)';

                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        color, 
                        lineHeight: 1.5,
                        animation: 'fadeInLine 0.25s ease forwards'
                      }}
                    >
                      {line}
                    </div>
                  );
                })}
                {isTyping && (
                  <div style={{ color: 'var(--text-muted)', animation: 'pulse 1s infinite' }}>
                    $ computing heuristic state nodes...
                  </div>
                )}
              </div>
            </div>

            {/* Run Button */}
            {!isTyping && (
              <button
                onClick={() => {
                  setLogLines([]);
                  setIsTyping(true);
                  let currentLine = 0;
                  const interval = setInterval(() => {
                    if (currentLine < currentWorkflow.logs.length) {
                      setLogLines(prev => [...prev, currentWorkflow.logs[currentLine]]);
                      currentLine++;
                    } else {
                      clearInterval(interval);
                      setIsTyping(false);
                    }
                  }, 350);

                  // Trigger sparks connection animation
                  shootSparks();
                }}
                className="btn btn-primary"
                style={{
                  marginTop: '2rem',
                  background: 'linear-gradient(135deg, var(--amber), #f97316)',
                  boxShadow: '0 4px 15px rgba(245, 158, 11, 0.2)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.85rem'
                }}
              >
                Trigger Execution Run
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInLine {
          from { opacity: 0; transform: translateX(-5px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @media (max-width: 768px) {
          .rag-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem;
          }
        }
      `}</style>
    </section>
  );
}
