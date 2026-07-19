import React, { useState, useRef, useEffect } from 'react';

const LOG_POOL = [
  { color: 'var(--text-muted)', text: 'Sync: Gmail inbox scanned (0 unread).' },
  { color: 'var(--green)',      text: 'Event: Webhook trigger SIGTERM caught.' },
  { color: 'var(--purple)',     text: 'RAG: Compiling node resolution graph...' },
  { color: 'var(--blue)',       text: 'Task: Email draft pushed to queue.' },
  { color: 'var(--green)',      text: 'Auth: Token refresh successful.' },
  { color: 'var(--text-muted)', text: 'Sync: Slack channels scanned (3 new).' },
  { color: '#f97316',           text: 'Warn: Rate limit 80% threshold reached.' },
  { color: 'var(--purple)',     text: 'Agent: Spawning sub-task worker #4.' },
  { color: 'var(--green)',      text: 'Task: Jira ticket WP-142 auto-created.' },
  { color: 'var(--text-muted)', text: 'Heartbeat: All agents nominal.' },
];

const randBars = () => Array.from({ length: 12 }, () => 15 + Math.random() * 80);

export default function SaaSDashboard() {
  const containerRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const lerpRotation = useRef({ x: 0, y: 0 });

  const [bars, setBars] = useState(randBars);
  const [cpu, setCpu]   = useState(14.2);
  const [logs, setLogs] = useState(LOG_POOL.slice(0, 3));
  const logIdx = useRef(3);

  useEffect(() => {
    const t = setInterval(() => setBars(randBars()), 1500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCpu(+(10 + Math.random() * 8).toFixed(1)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setLogs(prev => [...prev.slice(-2), LOG_POOL[logIdx.current++ % LOG_POOL.length]]);
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const handleMouseMove = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const max = 12;
    setRotation({
      x: -((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * max,
      y:  ((e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2)) * max,
    });
  };

  useEffect(() => {
    let af;
    const update = () => {
      const ease = 0.12;
      lerpRotation.current.x += (rotation.x - lerpRotation.current.x) * ease;
      lerpRotation.current.y += (rotation.y - lerpRotation.current.y) * ease;
      if (containerRef.current)
        containerRef.current.style.transform = `perspective(1000px) rotateX(${lerpRotation.current.x}deg) rotateY(${lerpRotation.current.y}deg) scale(${isHovered ? 1.02 : 1})`;
      af = requestAnimationFrame(update);
    };
    af = requestAnimationFrame(update);
    return () => cancelAnimationFrame(af);
  }, [rotation, isHovered]);

  return (
    <div ref={containerRef} onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setRotation({ x: 0, y: 0 }); }}
      style={{ width: '100%', maxWidth: '460px', margin: '0 auto', background: 'rgba(10,10,10,0.85)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.25rem', boxShadow: isHovered ? '0 30px 60px rgba(0,0,0,0.8),0 0 40px rgba(139,92,246,0.15)' : '0 15px 35px rgba(0,0,0,0.6)', transition: 'box-shadow 0.3s ease', cursor: 'pointer', willChange: 'transform' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ position: 'relative', width: 10, height: 10 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)' }} />
            <div className="sd-pulse" />
          </div>
          <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-code)', fontWeight: 600, color: '#ffffff' }}>AGENT: STATUS ACTIVE</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.7rem', fontFamily: 'var(--font-code)', color: 'var(--text-muted)' }}>PID-8480</div>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', padding: '0.75rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Automated Tasks</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--blue)', fontFamily: 'var(--font-headlines)' }}>84 <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>/ hrs</span></div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', padding: '0.75rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>CPU Load</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--purple)', fontFamily: 'var(--font-headlines)', transition: 'all 0.5s' }}>{cpu}%</div>
        </div>
      </div>

      {/* Animated bar chart */}
      <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', height: '100px', position: 'relative', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
        <div style={{ position: 'absolute', top: 6, left: 8, fontSize: '0.7rem', fontFamily: 'var(--font-code)', color: 'var(--text-muted)' }}>Memory Heap Allocation History (Live)</div>
        {bars.map((val, i) => (
          <div key={i} style={{ flex: 1, height: `${val}%`, borderRadius: '2px', transition: 'height 0.6s cubic-bezier(0.4,0,0.2,1)', background: val > 70 ? 'linear-gradient(to top,var(--purple),var(--pink))' : 'linear-gradient(to top,var(--blue),var(--indigo))' }} />
        ))}
      </div>

      {/* Terminal */}
      <div style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.75rem', fontFamily: 'var(--font-code)', fontSize: '0.7rem', lineHeight: 1.6 }}>
        <div style={{ color: 'var(--blue)', marginBottom: '0.2rem' }}>$ workpilot daemon --listening</div>
        {logs.map((log, i) => (
          <div key={i} style={{ color: log.color }}>[{new Date().toLocaleTimeString('en-GB')}] {log.text}</div>
        ))}
        <span className="sd-cursor">█</span>
      </div>

      <style>{`
        @keyframes sd-pulse { 0%{transform:scale(1);opacity:0.7} 100%{transform:scale(2.8);opacity:0} }
        @keyframes sd-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .sd-pulse { position:absolute;inset:0;border-radius:50%;border:1.5px solid var(--green);animation:sd-pulse 1.8s ease-out infinite; }
        .sd-cursor { color:var(--green);animation:sd-blink 1s step-end infinite;margin-left:2px; }
      `}</style>
    </div>
  );
}
