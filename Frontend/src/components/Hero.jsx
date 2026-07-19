import React, { useEffect, useRef, useState } from 'react';
import SaaSDashboard from './SaaSDashboard';

export default function Hero({ user, onAuthClick }) {
  const canvasRef = useRef(null);
  const [typedTitle, setTypedTitle] = useState('');
  const [typedTagline, setTypedTagline] = useState('');
  const [typedCommand, setTypedCommand] = useState('');
  const [currentCommandIdx, setCurrentCommandIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [brainShape, setBrainShape] = useState('sphere'); // 'sphere', 'envelope', 'shield'

  const fullTitle = 'WorkPilot AI';
  const fullTagline = 'The Future of Workplace Automation.';

  const commands = [
    'Schedule a meeting with the design team next Tuesday.',
    'Summarize today\'s emails and highlight urgent tasks.',
    'Generate this week\'s project status report.',
    'Find all blocked tasks across GitHub and Jira.',
    'Draft a follow-up email for pending clients.',
    'Prepare tomorrow\'s meeting agenda.'
  ];

  // 1. Title Typewriter effect
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < fullTitle.length) {
        setTypedTitle(fullTitle.substring(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // 2. Tagline Typewriter effect (triggers after title is complete)
  useEffect(() => {
    if (typedTitle !== fullTitle) return;
    
    let i = 0;
    const interval = setInterval(() => {
      if (i < fullTagline.length) {
        setTypedTagline(fullTagline.substring(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 45);
    return () => clearInterval(interval);
  }, [typedTitle]);

  // 3. Command Box Typing effect
  useEffect(() => {
    let timer;
    const command = '> ' + commands[currentCommandIdx];
    const typingSpeed = isDeleting ? 25 : 55;

    if (!isDeleting && typedCommand === command) {
      // Pause before deleting
      timer = setTimeout(() => setIsDeleting(true), 2500);
    } else if (isDeleting && typedCommand === '') {
      setIsDeleting(false);
      setCurrentCommandIdx((prev) => (prev + 1) % commands.length);
    } else {
      timer = setTimeout(() => {
        setTypedCommand(
          isDeleting
            ? command.substring(0, typedCommand.length - 1)
            : command.substring(0, typedCommand.length + 1)
        );
      }, typingSpeed);
    }

    return () => clearTimeout(timer);
  }, [typedCommand, isDeleting, currentCommandIdx]);

  // Listen for external hover updates to morph the brain
  useEffect(() => {
    const handleMorph = (e) => {
      if (e.detail && e.detail.shape) {
        setBrainShape(e.detail.shape);
      }
    };
    window.addEventListener('workpilot-morph-brain', handleMorph);
    return () => window.removeEventListener('workpilot-morph-brain', handleMorph);
  }, []);

  // 3D Canvas Orb + Background Particle Network
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    // Track mouse
    let mouse = { x: null, y: null, active: false };
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
      mouse.active = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // 1. Background Network Particles
    const bgParticles = [];
    const bgParticleCount = Math.min(50, Math.floor((width * height) / 28000));
    for (let i = 0; i < bgParticleCount; i++) {
      bgParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
      });
    }

    // 2. 3D Brain Particles setup
    const orbParticles = [];
    const orbParticleCount = 280;
    const orbRadius = Math.min(150, Math.min(width, height) * 0.26);

    const sphereCoords = [];
    const envelopeCoords = [];
    const shieldCoords = [];

    const envW = 200;
    const envH = 130;
    const shdW = 180;
    const shdH = 200;

    for (let i = 0; i < orbParticleCount; i++) {
      const phi = Math.acos(1 - 2 * (i / orbParticleCount));
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      sphereCoords.push({
        x: orbRadius * Math.sin(phi) * Math.cos(theta),
        y: orbRadius * Math.sin(phi) * Math.sin(theta),
        z: orbRadius * Math.cos(phi)
      });

      let ex, ey, ez;
      const pct = i / orbParticleCount;
      if (pct < 0.6) {
        const sidePct = (pct / 0.6) * 4;
        if (sidePct < 1) {
          ex = -envW/2 + envW * sidePct;
          ey = -envH/2;
        } else if (sidePct < 2) {
          ex = envW/2;
          ey = -envH/2 + envH * (sidePct - 1);
        } else if (sidePct < 3) {
          ex = envW/2 - envW * (sidePct - 2);
          ey = envH/2;
        } else {
          ex = -envW/2;
          ey = envH/2 - envH * (sidePct - 3);
        }
      } else {
        const flapPct = (pct - 0.6) / 0.4;
        if (flapPct < 0.5) {
          ex = -envW/2 + (envW/2) * (flapPct / 0.5);
          ey = -envH/2 + (envH/2) * (flapPct / 0.5);
        } else {
          ex = (envW/2) * ((flapPct - 0.5) / 0.5);
          ey = 0 - (envH/2) * ((flapPct - 0.5) / 0.5);
        }
      }
      ez = (Math.random() - 0.5) * 15;
      envelopeCoords.push({ x: ex, y: ey, z: ez });

      let sx, sy, sz;
      if (pct < 0.3) {
        const t = (pct / 0.3) * Math.PI;
        sx = Math.cos(t) * (shdW / 2);
        sy = -shdH / 2 - Math.sin(t) * 15;
      } else if (pct < 0.65) {
        const t = (pct - 0.3) / 0.35;
        sx = -shdW / 2 + (shdW / 2) * t * t;
        sy = -shdH / 2 + shdH * t;
      } else {
        const t = (pct - 0.65) / 0.35;
        sx = shdW / 2 - (shdW / 2) * t * t;
        sy = -shdH / 2 + shdH * t;
      }
      sz = (Math.random() - 0.5) * 15;
      shieldCoords.push({ x: sx, y: sy, z: sz });

      orbParticles.push({
        x3d: sphereCoords[i].x,
        y3d: sphereCoords[i].y,
        z3d: sphereCoords[i].z,
        colorIdx: Math.random()
      });
    }

    let angleX = 0.003;
    let angleY = 0.005;

    let isTabVisible = true;
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const render = () => {
      if (!isTabVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(59, 130, 246, 0.04)';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';

      for (let i = 0; i < bgParticles.length; i++) {
        const p = bgParticles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < bgParticles.length; j++) {
          const p2 = bgParticles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.lineWidth = 1 - dist / 120;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      let orbCenterX = width > 768 ? width * 0.72 : width * 0.5;
      let orbCenterY = width > 768 ? height * 0.55 : height * 0.45;

      let rx = angleX;
      let ry = angleY;

      if (mouse.active) {
        const dx = mouse.x - orbCenterX;
        const dy = mouse.y - orbCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < orbRadius * 1.5) {
          rx = angleX + dy * 0.00004;
          ry = angleY + dx * 0.00004;
        }
      }

      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);

      const activeShapeRef = canvas.getAttribute('data-shape') || 'sphere';
      
      orbParticles.forEach((p, idx) => {
        let tx, ty, tz;
        if (activeShapeRef === 'envelope') {
          tx = envelopeCoords[idx].x;
          ty = envelopeCoords[idx].y;
          tz = envelopeCoords[idx].z;
        } else if (activeShapeRef === 'shield') {
          tx = shieldCoords[idx].x;
          ty = shieldCoords[idx].y;
          tz = shieldCoords[idx].z;
        } else {
          tx = sphereCoords[idx].x;
          ty = sphereCoords[idx].y;
          tz = sphereCoords[idx].z;
        }

        const lerpSpeed = 0.08;
        p.x3d += (tx - p.x3d) * lerpSpeed;
        p.y3d += (ty - p.y3d) * lerpSpeed;
        p.z3d += (tz - p.z3d) * lerpSpeed;
      });

      orbParticles.sort((a, b) => b.z3d - a.z3d);

      orbParticles.forEach((p) => {
        let x1 = p.x3d * cosY - p.z3d * sinY;
        let z1 = p.x3d * sinY + p.z3d * cosY;
        let y1 = p.y3d * cosX - z1 * sinX;
        let z2 = p.y3d * sinX + z1 * cosX;

        p.x3d = x1;
        p.y3d = y1;
        p.z3d = z2;

        const perspective = 400;
        const scale = perspective / (perspective + z2);
        const projX = x1 * scale + orbCenterX;
        const projY = y1 * scale + orbCenterY;

        const alpha = Math.max(0.15, (z2 + orbRadius) / (2 * orbRadius));
        const pSize = Math.max(1.2, scale * 2.8);

        const red = Math.floor(59 + (139 - 59) * p.colorIdx);
        const green = Math.floor(130 + (92 - 130) * p.colorIdx);
        const blue = Math.floor(246 + (246 - 246) * p.colorIdx);

        ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(projX, projY, pSize, 0, Math.PI * 2);
        ctx.fill();

        orbParticles.forEach((other) => {
          const dx = p.x3d - other.x3d;
          const dy = p.y3d - other.y3d;
          const dz = p.z3d - other.z3d;
          const d3 = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (d3 > 0 && d3 < 40) {
            const scaleOther = perspective / (perspective + other.z3d);
            const otherProjX = other.x3d * scaleOther + orbCenterX;
            const otherProjY = other.y3d * scaleOther + orbCenterY;

            ctx.strokeStyle = `rgba(139, 92, 246, ${(1 - d3 / 40) * 0.12 * alpha})`;
            ctx.lineWidth = (1 - d3 / 40) * 0.8;
            ctx.beginPath();
            ctx.moveTo(projX, projY);
            ctx.lineTo(otherProjX, otherProjY);
            ctx.stroke();
          }
        });
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <section 
      id="hero" 
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: '#000000',
        padding: '8rem 0 4rem 0',
        overflow: 'hidden'
      }}
    >
      {/* Glow Orbs */}
      <div className="glowing-orb glowing-orb-blue" style={{ top: '10%', left: '-10%' }} />
      <div className="glowing-orb glowing-orb-purple" style={{ bottom: '15%', right: '5%' }} />
      <div className="glowing-orb glowing-orb-indigo" style={{ top: '50%', left: '40%' }} />

      {/* Particle Canvas */}
      <canvas 
        ref={canvasRef} 
        data-shape={brainShape}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'auto'
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 2, width: '100%' }}>
        <div className="hero-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1.15fr 0.85fr',
          gap: '3rem',
          alignItems: 'center'
        }}>
          {/* Hero text */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '999px',
              padding: '0.4rem 1rem',
              fontSize: '0.85rem',
              color: 'var(--blue)',
              fontWeight: 500,
              marginBottom: '1.5rem',
              backdropFilter: 'blur(8px)',
              letterSpacing: '0.02em'
            }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--blue)', animation: 'pulse 1.5s infinite' }}></span>
              Autopilot Workspace Core Active
            </div>

            {/* Typewriter Heading */}
            <h1 className="animated-gradient-text" style={{
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              lineHeight: 1.1,
              marginBottom: '1.25rem',
              minHeight: '1.2em' // prevent layout shifting during type
            }}>
              {typedTitle}
              <span style={{
                display: typedTitle !== fullTitle ? 'inline-block' : 'none',
                width: '6px',
                height: '36px',
                background: 'var(--blue)',
                marginLeft: '4px',
                animation: 'blink 0.8s step-end infinite'
              }}></span>
            </h1>

            {/* Typewriter Tagline */}
            <p style={{
              fontSize: 'clamp(1.1rem, 2vw, 1.6rem)',
              color: '#ffffff',
              fontWeight: 400,
              marginBottom: '1.25rem',
              fontFamily: 'var(--font-headlines)',
              letterSpacing: '-0.01em',
              minHeight: '2.2em' // prevent layout shifts
            }}>
              {typedTagline}
              <span style={{
                display: typedTitle === fullTitle && typedTagline !== fullTagline ? 'inline-block' : 'none',
                width: '4px',
                height: '18px',
                background: 'var(--purple)',
                marginLeft: '3px',
                animation: 'blink 0.8s step-end infinite'
              }}></span>
            </p>

            <p style={{
              color: 'var(--text-muted)',
              fontSize: '1.02rem',
              maxWidth: '540px',
              marginBottom: '2rem',
              lineHeight: 1.6
            }}>
              Connect your emails, calendar, Slack, GitHub, Jira, Drive, and meetings into one intelligent workspace. WorkPilot AI automates repetitive tasks, manages workflows, and helps your team stay focused on what matters most.
            </p>

            {/* Command terminal box */}
            <div className="glass-card" style={{
              fontFamily: 'var(--font-code)',
              padding: '1.25rem',
              marginBottom: '2.5rem',
              maxWidth: '520px',
              background: 'rgba(5, 5, 5, 0.8)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.07)'
            }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '0.75rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }}></span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }}></span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }}></span>
              </div>
              <div style={{ color: 'var(--blue)', fontSize: '0.88rem', whiteSpace: 'pre', overflowX: 'hidden' }}>
                {typedCommand}
                <span style={{
                  display: 'inline-block',
                  width: '7px',
                  height: '15px',
                  background: 'var(--blue)',
                  marginLeft: '2px',
                  animation: 'blink 1s step-end infinite'
                }}></span>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="hero-buttons" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
              {user ? (
                <a href="#demo" className="btn btn-primary" style={{ gap: '0.5rem' }}>
                  Open Workspace Terminal
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </a>
              ) : (
                <button onClick={onAuthClick} className="btn btn-primary" style={{ gap: '0.5rem', cursor: 'pointer', border: 'none' }}>
                  Deploy Autopilot Workspace
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              )}
              <a href="#features" className="btn btn-secondary">Audit Integrations Map</a>
            </div>

            {/* Trust checkmarks */}
            <div className="trust-bar" style={{ justifyContent: 'flex-start' }}>
              <div className="trust-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Zero-Trust Kernel Sandboxing</span>
              </div>
              <div className="trust-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>SOC2 Type II / GDPR Compliant</span>
              </div>
              <div className="trust-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Sub-millisecond Vector Indexes</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D SaaS Dashboard */}
          <div style={{ position: 'relative', zIndex: 10 }} className="hero-dashboard-container">
            <SaaSDashboard />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @media (max-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          .hero-dashboard-container {
            margin-top: 2rem;
          }
          .trust-bar {
            justify-content: center !important;
          }
          .glass-card {
            margin-left: auto;
            margin-right: auto;
          }
        }
      `}</style>
    </section>
  );
}
