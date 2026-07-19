import React, { useState, useEffect, useRef, useCallback } from 'react';
import { auth, signOut } from '../firebase';
import Logo from './Logo';
import { EmailPage, CalendarPage, TeamPage, DeploymentsPage, DocumentsPage, AnalyticsPage, IntegrationsPage, SettingsPage } from './Pages';
import { SiGmail, SiGooglecalendar, SiGithub, SiZoom } from 'react-icons/si';

// Inline icons for brands not in this react-icons version
const SiSlack = ({ size, color }) => <svg width={size} height={size} viewBox="0 0 24 24"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.04a2.528 2.528 0 0 1-2.522 2.52H8.823a2.528 2.528 0 0 1-2.52-2.52v-5.04z" fill="#36C5F0"/><path d="M8.823 5.043a2.528 2.528 0 0 1-2.52-2.52A2.528 2.528 0 0 1 8.823 0a2.528 2.528 0 0 1 2.522 2.522v2.52H8.823zm0 1.262a2.528 2.528 0 0 1 2.522 2.52v5.043a2.528 2.528 0 0 1-2.522 2.52H3.78a2.528 2.528 0 0 1-2.522-2.52V8.825a2.528 2.528 0 0 1 2.522-2.52h5.043z" fill="#2EB67D"/><path d="M18.958 8.825a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52 2.528 2.528 0 0 1-2.522 2.52h-2.52v-2.52zm-1.261 0a2.528 2.528 0 0 1-2.52 2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52v-5.04a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.04z" fill="#ECB22E"/><path d="M15.177 18.957a2.528 2.528 0 0 1 2.52 2.522 2.528 2.528 0 0 1-2.52 2.52 2.528 2.528 0 0 1-2.522-2.52v-2.522h2.522zm0-1.261a2.528 2.528 0 0 1-2.522-2.52v-5.043a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.043a2.528 2.528 0 0 1-2.522 2.52h-5.043z" fill="#E01E5A"/></svg>;
const SiMicrosoft = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/></svg>;

/* ══════════════════════════════════════
   THEMES
══════════════════════════════════════ */
const THEMES = {
  blue:   { primary: '#3b82f6', secondary: '#6366f1', accent: '#06b6d4', glow: 'rgba(59,130,246,0.35)' },
  purple: { primary: '#8b5cf6', secondary: '#ec4899', accent: '#a78bfa', glow: 'rgba(139,92,246,0.35)' },
  green:  { primary: '#10b981', secondary: '#06b6d4', accent: '#34d399', glow: 'rgba(16,185,129,0.35)' },
};

/* ══════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════ */
const BASE = {
  bg: '#000', surface: '#0c0c0f', border: 'rgba(255,255,255,0.07)',
  red: '#ef4444', amber: '#f59e0b', green: '#10b981',
  textPrimary: '#fff', textSub: 'rgba(255,255,255,0.55)', textMuted: 'rgba(255,255,255,0.28)',
};

/* ══════════════════════════════════════
   SVG ICONS
══════════════════════════════════════ */
const I = {
  grid:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
  chat:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  mail:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  cal:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  team:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  deploy:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
  docs:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  bar:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  plug:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  cog:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  bell:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  search:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  bolt:    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  send:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  x:       <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  chevL:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
  chevR:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
  check:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
  arr:     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  undo:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.08"/></svg>,
  mic:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  palette: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
  drag:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="6" r="1" fill="currentColor"/><circle cx="15" cy="6" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="18" r="1" fill="currentColor"/><circle cx="15" cy="18" r="1" fill="currentColor"/></svg>,
};

/* ══════════════════════════════════════
   SIMULATED DATA
══════════════════════════════════════ */
const NAV_SECTIONS = [
  { id: 'main', label: 'MAIN', items: [
    { id: 'dashboard', icon: 'grid', label: 'Dashboard', shortcut: 'G D' },
    { id: 'chat', icon: 'chat', label: 'Chat with AI', shortcut: 'G C' },
  ]},
  { id: 'workspace', label: 'WORKSPACE', items: [
    { id: 'email', icon: 'mail', label: 'Email', shortcut: 'G E' },
    { id: 'calendar', icon: 'cal', label: 'Calendar', shortcut: 'G A' },
    { id: 'team', icon: 'team', label: 'Team', shortcut: 'G T' },
    { id: 'deployments', icon: 'deploy', label: 'Deployments', shortcut: 'G V' },
    { id: 'documents', icon: 'docs', label: 'Documents', shortcut: 'G O' },
  ]},
  { id: 'account', label: 'ACCOUNT', items: [
    { id: 'analytics', icon: 'bar', label: 'Analytics', shortcut: '' },
    { id: 'integrations', icon: 'plug', label: 'Integrations', shortcut: '' },
    { id: 'settings', icon: 'cog', label: 'Settings', shortcut: '' },
  ]},
];

const EMAILS_DATA = [
  { id: 1, sender: 'Robert Chen', role: 'CFO', subject: 'Q3 Budget Approval — Action Required', time: '8m', priority: 'urgent' },
  { id: 2, sender: 'Acme Corp', role: 'Client', subject: 'Service complaint — ticket #4821', time: '32m', priority: 'urgent' },
  { id: 3, sender: 'HR Team', role: 'Internal', subject: 'Team offsite planning for August', time: '1h', priority: 'normal' },
];
const MEETINGS_DATA = [
  { id: 1, time: '10:00', label: 'AM', title: 'Daily Standup', dur: '15m', people: 5, status: 'ready', color: '#10b981' },
  { id: 2, time: '14:00', label: 'PM', title: 'Client Call — Acme', dur: '60m', people: 3, status: 'ready', color: '#3b82f6' },
  { id: 3, time: '16:00', label: 'PM', title: 'Deep Work Block 🔒', dur: '2h', people: 1, status: 'protected', color: '#8b5cf6' },
];
const TEAM_DATA = [
  { id: 1, name: 'Sarah Chen', task: 'UI mockups', progress: 100, status: 'done' },
  { id: 2, name: 'John Smith', task: 'API integration', progress: 65, status: 'track' },
  { id: 3, name: 'Mike Chen', task: 'Backend testing', progress: 30, status: 'late' },
  { id: 4, name: 'Priya Sharma', task: 'No update', progress: 0, status: 'missing' },
];
const AI_ACTIONS_DATA = [
  { id: 1, time: '9:14', text: 'Sent 3 follow-up emails to Acme Corp', reversible: true },
  { id: 2, time: '9:02', text: 'Scheduled team meeting Wednesday 3pm', reversible: false },
  { id: 3, time: '8:45', text: 'Archived 12 newsletters', reversible: false },
  { id: 4, time: '8:30', text: 'Generated morning briefing', reversible: false },
];
const TICKER_ITEMS = [
  '⚡ Sent follow-up to Acme Corp',
  '📅 Meeting scheduled — Wednesday 3pm',
  '📧 3 urgent emails processed',
  '🚀 Deployment v2.4.2 at 67%',
  '👥 Mike Chen task — 2 days overdue',
  '✅ Daily standup brief ready',
  '📄 Budget_2026.xlsx analyzed',
  '🔔 CFO email due by 5pm today',
];
const SPARKLINE_DATA = [4, 7, 5, 9, 6, 11, 8, 14, 10, 13];
const NOTIFS_DATA = [
  { id: 1, text: 'CFO email needs reply', sub: '2 min ago', color: '#ef4444' },
  { id: 2, text: 'Mike Chen task overdue', sub: '45 min ago', color: '#f59e0b' },
  { id: 3, text: 'Deployment v2.4.2 started', sub: '1h ago', color: '#3b82f6' },
];
const CHAT_INIT = [
  { id: 1, r: 'ai', text: "Good morning! I've reviewed your schedule. 3 urgent items need attention today. Start with the CFO budget email?" },
  { id: 2, r: 'user', text: 'Yes, draft a reply for the CFO.' },
  { id: 3, r: 'ai', text: 'Draft: "Hi Robert, Thanks for the Q3 budget proposal. Can we schedule a 30-min call Thursday 2pm to discuss?" — Send?' },
];

/* ══════════════════════════════════════
   MICRO COMPONENTS
══════════════════════════════════════ */

// Animated number counter
function Counter({ target, suffix = '', duration = 1200 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [target, duration]);
  return <>{val}{suffix}</>;
}

// Sparkline SVG
function Sparkline({ data, color, width = 80, height = 28 }) {
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / (max - min || 1)) * height;
    return `${x},${y}`;
  }).join(' ');
  const fillPts = `0,${height} ${pts} ${width},${height}`;
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#sg-${color.replace('#', '')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// Radial progress ring
function Ring({ pct, color, size = 64, stroke = 5, label }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 4px ${color}80)` }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 800, color: '#fff', fontFamily: "'Sora', sans-serif", lineHeight: 1 }}>{pct}%</span>
      </div>
    </div>
  );
}

// Avatar
function Av({ name, size = 30 }) {
  const letters = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hue = (name.charCodeAt(0) * 47) % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 700, color: '#fff', fontFamily: "'Sora', sans-serif", background: `linear-gradient(135deg, hsl(${hue},65%,45%), hsl(${(hue+60)%360},65%,55%))` }}>
      {letters}
    </div>
  );
}

// Bento card — supports colspan/rowspan via style
function Bento({ children, style = {}, accent, draggable, onDragStart, onDragOver, onDrop, id }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#0c0c0f', borderRadius: 18,
        border: `1px solid ${hov ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.07)'}`,
        padding: '20px 22px', position: 'relative', overflow: 'hidden',
        transition: 'all 0.22s', transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hov ? '0 12px 40px rgba(0,0,0,0.5)' : '0 2px 10px rgba(0,0,0,0.3)',
        ...style,
      }}>
      {accent && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${accent}55, transparent)` }} />}
      {draggable && hov && (
        <div style={{ position: 'absolute', top: 10, right: 10, color: 'rgba(255,255,255,0.2)', cursor: 'grab' }}>{I.drag}</div>
      )}
      {children}
    </div>
  );
}

function WH({ icon, title, right, T }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ color: T.primary, display: 'flex' }}>{I[icon] || icon}</span>
        <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, color: '#fff' }}>{title}</span>
      </div>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 6 }}>{right}</span>
    </div>
  );
}

function Pill({ label, color, bg }) {
  return <span style={{ padding: '3px 9px', borderRadius: 99, background: bg || `${color}15`, border: `1px solid ${color}28`, color, fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap' }}>{label}</span>;
}

function PBtn({ children, onClick, T, style = {} }) {
  return <button onClick={onClick} style={{ padding: '9px 16px', borderRadius: 10, background: `linear-gradient(135deg,${T.primary},${T.secondary})`, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Inter',sans-serif", boxShadow: `0 4px 18px ${T.glow}`, transition: 'all 0.2s', ...style }} className="pbtn-h">{children}</button>;
}

function GBtn({ children, onClick, color, style = {} }) {
  return <button onClick={onClick} style={{ padding: '5px 11px', borderRadius: 8, background: `${color}12`, border: `1px solid ${color}28`, color, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Inter',sans-serif", transition: 'all 0.18s', whiteSpace: 'nowrap', ...style }} className="gbtn-h">{children}</button>;
}

/* ══════════════════════════════════════
   LIVE TICKER
══════════════════════════════════════ */
function Ticker({ T }) {
  return (
    <div style={{ background: '#09090c', borderBottom: '1px solid rgba(255,255,255,0.05)', height: 32, overflow: 'hidden', display: 'flex', alignItems: 'center', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(90deg,#09090c,transparent)', zIndex: 2 }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(270deg,#09090c,transparent)', zIndex: 2 }} />
      <div className="ticker-inner" style={{ display: 'flex', gap: '60px', whiteSpace: 'nowrap', animation: 'tickerMove 28s linear infinite' }}>
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <span key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter',sans-serif" }}>
            <span style={{ color: T.primary, marginRight: 4 }}>▸</span>{item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   THEME SWITCHER
══════════════════════════════════════ */
function ThemeSwitcher({ theme, setTheme }) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 99, padding: '4px 6px' }}>
      {Object.entries(THEMES).map(([key, val]) => (
        <button key={key} title={key} onClick={() => setTheme(key)} style={{ width: 18, height: 18, borderRadius: '50%', background: val.primary, border: theme === key ? `2px solid #fff` : '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s', padding: 0 }} />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════ */
export default function Dashboard({ user, onOpenCockpit }) {
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Alex';
  const firstName = displayName.split(' ')[0];

  const [theme, setTheme] = useState(() => localStorage.getItem('wp_theme') || 'blue');
  const T = THEMES[theme];

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('wp_sb') === '1');
  const [activeNav, setActiveNav] = useState('dashboard');
  const [role, setRole] = useState(() => localStorage.getItem('wp_role') || 'Manager');
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [cmdVal, setCmdVal] = useState('');
  const [chatVal, setChatVal] = useState('');
  const [msgs, setMsgs] = useState(CHAT_INIT);
  const [typing, setTyping] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [deployPct, setDeployPct] = useState(67);
  const [showKbHelp, setShowKbHelp] = useState(false);

  // Drag-and-drop widget order
  const [widgetOrder, setWidgetOrder] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wp_order')) || ['email', 'schedule', 'attention', 'stats', 'team', 'deploy', 'aiActions', 'briefing', 'docs']; }
    catch { return ['email', 'schedule', 'attention', 'stats', 'team', 'deploy', 'aiActions', 'briefing', 'docs']; }
  });
  const dragRef = useRef(null);

  const notifRef = useRef(null);
  const userRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => { localStorage.setItem('wp_theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('wp_sb', collapsed ? '1' : '0'); }, [collapsed]);
  useEffect(() => { localStorage.setItem('wp_role', role); }, [role]);
  useEffect(() => { localStorage.setItem('wp_order', JSON.stringify(widgetOrder)); }, [widgetOrder]);
  useEffect(() => {
    const t = setInterval(() => setDeployPct(p => p >= 100 ? 67 : +(p + 0.5).toFixed(1)), 2500);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, typing]);
  useEffect(() => {
    const fn = e => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // ── Keyboard shortcuts ──
  const gPressed = useRef(false);
  useEffect(() => {
    const down = e => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) { setShowKbHelp(v => !v); return; }
      if (e.key === 'Escape') { setShowKbHelp(false); setChatOpen(false); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); document.getElementById('cmd-input')?.focus(); return; }
      if (e.key === 'g' || e.key === 'G') { gPressed.current = true; setTimeout(() => { gPressed.current = false; }, 1500); return; }
      if (gPressed.current) {
        const map = { d: 'dashboard', c: 'chat', e: 'email', a: 'calendar', t: 'team', v: 'deployments', o: 'documents' };
        if (map[e.key]) {
          gPressed.current = false;
          if (map[e.key] === 'chat') { onOpenCockpit && onOpenCockpit(); }
          else setActiveNav(map[e.key]);
        }
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const sendChat = useCallback(() => {
    if (!chatVal.trim()) return;
    setMsgs(p => [...p, { id: Date.now(), r: 'user', text: chatVal }]);
    setChatVal('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs(p => [...p, { id: Date.now() + 1, r: 'ai', text: `On it! Processing: "${chatVal.slice(0, 45)}..." — I'll update you shortly.` }]);
    }, 1500);
  }, [chatVal]);

  const sendCmd = useCallback(() => {
    if (!cmdVal.trim()) return;
    setChatOpen(true);
    setMsgs(p => [...p, { id: Date.now(), r: 'user', text: cmdVal }]);
    setCmdVal('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs(p => [...p, { id: Date.now() + 1, r: 'ai', text: `Got it! Working on: "${cmdVal.slice(0, 45)}" — I'll report back.` }]);
    }, 1500);
  }, [cmdVal]);

  // Drag-and-drop
  const handleDragStart = (e, id) => { dragRef.current = id; e.dataTransfer.effectAllowed = 'move'; };
  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!dragRef.current || dragRef.current === targetId) return;
    setWidgetOrder(prev => {
      const arr = [...prev];
      const from = arr.indexOf(dragRef.current);
      const to = arr.indexOf(targetId);
      arr.splice(from, 1);
      arr.splice(to, 0, dragRef.current);
      return arr;
    });
    dragRef.current = null;
  };

  const now = new Date();
  const hr = now.getHours();
  const greeting = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const sbW = collapsed ? 58 : 218;

  const ALERTS = [
    { id: 1, text: 'CFO email due today', c: BASE.red },
    { id: 2, text: 'Mike overdue — 2 days', c: BASE.amber },
    { id: 3, text: 'Deployment in 2h', c: T.primary },
    { id: 4, text: 'Acme complaint — urgent', c: BASE.red },
  ].filter(a => !dismissedAlerts.includes(a.id));

  // ── Widget renderers ──
  const WIDGETS = {
    email: () => (
      <Bento accent={T.primary} draggable onDragStart={e => handleDragStart(e, 'email')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'email')} style={{ gridColumn: 'span 2' }}>
        <WH icon="mail" title="Email" T={T} right={<><Pill label="3 Urgent" color={BASE.red} /><Pill label="7 Awaiting" color={BASE.amber} /></>} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {EMAILS_DATA.map(em => (
            <div key={em.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: em.priority === 'urgent' ? BASE.red : 'rgba(255,255,255,0.2)', flexShrink: 0, boxShadow: em.priority === 'urgent' ? `0 0 6px ${BASE.red}` : 'none' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', display: 'flex', gap: 6, alignItems: 'center' }}>
                  {em.sender}
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono',monospace" }}>{em.role}</span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{em.subject}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: "'JetBrains Mono',monospace" }}>{em.time}</span>
                <GBtn color={T.primary}>Draft reply</GBtn>
              </div>
            </div>
          ))}
        </div>
        <PBtn T={T} style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}>Handle all with AI {I.bolt}</PBtn>
      </Bento>
    ),

    schedule: () => (
      <Bento accent={T.accent} draggable onDragStart={e => handleDragStart(e, 'schedule')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'schedule')}>
        <WH icon="cal" title="Today" T={T} right={now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MEETINGS_DATA.map(m => (
            <div key={m.id} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.025)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <div style={{ width: 3, height: '100%', minHeight: 36, borderRadius: 99, background: m.color }} />
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono',monospace", paddingTop: 2 }}>{m.time}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{m.title}</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  <Pill label={m.dur} color="rgba(255,255,255,0.3)" bg="rgba(255,255,255,0.05)" />
                  {m.status === 'ready' && <Pill label="✓ Ready" color={BASE.green} />}
                  {m.status === 'protected' && <Pill label="🔒 Protected" color="#8b5cf6" />}
                </div>
              </div>
              {m.status === 'ready' && <GBtn color={T.accent} style={{ alignSelf: 'center', fontSize: 10 }}>Brief</GBtn>}
            </div>
          ))}
        </div>
      </Bento>
    ),

    attention: () => (
      <Bento accent={BASE.red} draggable onDragStart={e => handleDragStart(e, 'attention')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'attention')}>
        <WH icon="bell" title="Needs Attention" T={T} right={<Pill label="4" color={BASE.red} />} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {[
            { text: 'CFO email — due 5pm', label: 'Reply', c: BASE.red },
            { text: 'Mike Chen — 2d overdue', label: 'Follow up', c: BASE.amber },
            { text: 'Deployment v2.4.2', label: 'Monitor', c: T.primary },
            { text: 'Acme complaint', label: 'Handle', c: BASE.amber },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', background: `${item.c}06`, border: `1px solid ${item.c}18`, borderRadius: 9, transition: 'all 0.18s' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.c, flexShrink: 0, boxShadow: `0 0 6px ${item.c}` }} />
              <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{item.text}</span>
              <GBtn color={item.c} style={{ fontSize: 10, padding: '3px 8px' }}>{item.label}</GBtn>
            </div>
          ))}
        </div>
        <PBtn T={T} onClick={() => onOpenCockpit && onOpenCockpit()} style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}>Handle all with AI {I.bolt}</PBtn>
      </Bento>
    ),

    stats: () => (
      <Bento accent={T.secondary} draggable onDragStart={e => handleDragStart(e, 'stats')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'stats')} style={{ gridColumn: 'span 2' }}>
        <WH icon="bar" title="This Week" T={T} right="Productivity" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Focus Time', value: 65, suffix: 'h', target: 65, color: T.primary },
            { label: 'Emails Saved', value: 89, suffix: '', target: 89, color: BASE.green },
            { label: 'Tasks Done', value: 86, suffix: '%', target: 86, color: T.secondary },
            { label: 'Meetings', value: 100, suffix: '%', target: 100, color: T.accent },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.025)', borderRadius: 14, padding: '16px 14px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <Ring pct={s.value} color={s.color} size={60} stroke={4} />
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 18, color: '#fff', textAlign: 'center' }}>
                  <Counter target={s.value === 65 ? 65 : s.value} />
                  {s.suffix}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 2 }}>{s.label}</div>
              </div>
              <Sparkline data={SPARKLINE_DATA} color={s.color} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, padding: '12px 14px', background: `${BASE.green}08`, border: `1px solid ${BASE.green}20`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Burnout Risk</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 120, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: '22%', height: '100%', background: BASE.green, borderRadius: 99 }} />
            </div>
            <Pill label="LOW ●" color={BASE.green} />
          </div>
        </div>
      </Bento>
    ),

    team: () => (
      <Bento accent={T.primary} draggable onDragStart={e => handleDragStart(e, 'team')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'team')}>
        <WH icon="team" title="Team Today" T={T} right="4 members" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {TEAM_DATA.map(m => {
            const statusMap = { done: BASE.green, track: T.primary, late: BASE.amber, missing: BASE.red };
            const c = statusMap[m.status];
            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Av name={m.name} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{m.name}</span>
                    <Ring pct={m.progress} color={c} size={32} stroke={3} />
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>{m.task}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 7, marginTop: 14 }}>
          <button style={{ flex: 1, padding: '8px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>View all</button>
          <GBtn color={T.primary} style={{ flex: 1, justifyContent: 'center' }} onClick={() => onOpenCockpit && onOpenCockpit()}>Standup {I.bolt}</GBtn>
        </div>
      </Bento>
    ),

    deploy: () => (
      <Bento accent={BASE.green} draggable onDragStart={e => handleDragStart(e, 'deploy')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'deploy')}>
        <WH icon="deploy" title="Deployments" T={T} right={<Pill label="Prod" color={BASE.green} />} />
        <div style={{ padding: '12px', background: `${BASE.green}08`, border: `1px solid ${BASE.green}20`, borderRadius: 12, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#fff' }}>v2.4.1 — Production</span>
            <Pill label="● Live" color={BASE.green} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[['142ms', 'Latency'], ['99.9%', 'Uptime'], ['2h ago', 'Deployed']].map(([v, k]) => (
              <div key={k}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{v}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{k}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '12px', background: `${BASE.amber}06`, border: `1px solid ${BASE.amber}20`, borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#fff' }}>v2.4.2 — Staging</span>
            <Pill label={`${Math.round(deployPct)}%`} color={T.primary} />
          </div>
          <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', width: `${deployPct}%`, background: `linear-gradient(90deg,${T.primary},${T.secondary})`, borderRadius: 99, transition: 'width 0.6s ease', filter: `drop-shadow(0 0 4px ${T.primary}80)` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>ETA ~8 min</span>
            <Pill label="MEDIUM RISK" color={BASE.amber} />
          </div>
        </div>
      </Bento>
    ),

    aiActions: () => (
      <Bento accent={T.secondary} draggable onDragStart={e => handleDragStart(e, 'aiActions')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'aiActions')}>
        <WH icon="bolt" title="AI Did Today" T={T} right="View all →" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {AI_ACTIONS_DATA.map(a => (
            <div key={a.id} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'flex-start' }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: `${T.primary}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: T.primary }}>{I.bolt}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono',monospace", marginBottom: 2 }}>{a.time} AM</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{a.text}</div>
              </div>
              {a.reversible && <GBtn color={T.secondary} style={{ fontSize: 10, padding: '3px 7px' }}>{I.undo} Undo</GBtn>}
            </div>
          ))}
        </div>
      </Bento>
    ),

    briefing: () => (
      <Bento accent={T.accent} draggable onDragStart={e => handleDragStart(e, 'briefing')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'briefing')} style={{ gridColumn: 'span 2' }}>
        <WH icon="bolt" title="Morning Briefing" T={T} right={now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg,${T.primary},${T.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, boxShadow: `0 4px 16px ${T.glow}` }}>{I.bolt}</div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: 0 }}>
            Good morning {firstName}! You have <span style={{ color: BASE.red, fontWeight: 700 }}>3 urgent emails</span> — CFO budget request is most critical (due 5pm). Mike's backend task is <span style={{ color: BASE.amber, fontWeight: 700 }}>2 days overdue</span>. Deployment at 3pm. <span style={{ color: T.primary, fontWeight: 700 }}>Start with the CFO email.</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <PBtn T={T} onClick={() => setChatOpen(true)} style={{ flex: 1, justifyContent: 'center' }}>Read full briefing</PBtn>
          <button style={{ padding: '9px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Dismiss</button>
        </div>
      </Bento>
    ),

    docs: () => (
      <Bento accent={BASE.amber} draggable onDragStart={e => handleDragStart(e, 'docs')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'docs')}>
        <WH icon="docs" title="Documents" T={T} right={<GBtn color={T.primary}>Upload +</GBtn>} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { name: 'Q3_Contract.pdf', info: '3 questions', time: '2h ago', warn: false },
            { name: 'Team_Policy_v2.docx', info: '2 conflicts found', time: '1d ago', warn: true },
            { name: 'Budget_2026.xlsx', info: 'Just uploaded', time: 'Now', warn: false },
          ].map(d => (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: d.warn ? `${BASE.amber}06` : 'rgba(255,255,255,0.025)', border: `1px solid ${d.warn ? BASE.amber + '25' : 'rgba(255,255,255,0.05)'}`, borderRadius: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${T.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary, flexShrink: 0 }}>{I.docs}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', fontFamily: "'JetBrains Mono',monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
                <div style={{ fontSize: 10, color: d.warn ? BASE.amber : 'rgba(255,255,255,0.35)', marginTop: 2 }}>{d.info} · {d.time}</div>
              </div>
              <GBtn color={T.primary} style={{ fontSize: 10, padding: '3px 8px' }}>Ask AI {I.arr}</GBtn>
            </div>
          ))}
        </div>
      </Bento>
    ),
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: BASE.bg, color: '#fff', overflow: 'hidden', fontFamily: "'Inter',sans-serif" }}>

      {/* ══ SIDEBAR ══ */}
      <aside style={{ width: sbW, minWidth: sbW, height: '100vh', background: '#08080b', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)', overflow: 'hidden', flexShrink: 0, zIndex: 60 }}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', padding: collapsed ? '0 14px' : '0 14px 0 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          {!collapsed ? <Logo height={24} showText /> : <div style={{ color: T.primary, display: 'flex' }}>{I.bolt}</div>}
          <button onClick={() => setCollapsed(v => !v)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', borderRadius: 7, padding: '5px', display: 'flex', transition: 'all 0.15s', flexShrink: 0 }} className="icon-h">
            {collapsed ? I.chevR : I.chevL}
          </button>
        </div>

        <nav style={{ flex: 1, padding: '8px 6px', overflowY: 'auto', overflowX: 'hidden' }}>
          {NAV_SECTIONS.map(sec => (
            <div key={sec.id} style={{ marginBottom: 4 }}>
              {!collapsed && <div style={{ padding: '8px 10px 3px', fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.12em', fontFamily: "'JetBrains Mono',monospace" }}>{sec.label}</div>}
              {sec.items.map(item => {
                const active = activeNav === item.id;
                return (
                  <button key={item.id} title={collapsed ? `${item.label}${item.shortcut ? '  ' + item.shortcut : ''}` : ''} onClick={() => { if (item.id === 'chat') { onOpenCockpit && onOpenCockpit(); } else setActiveNav(item.id); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 9, justifyContent: collapsed ? 'center' : 'flex-start',
                      padding: collapsed ? '10px 0' : '9px 11px', borderRadius: 9, border: 'none', cursor: 'pointer',
                      background: active ? `linear-gradient(135deg,${T.primary}1a,${T.secondary}12)` : 'transparent',
                      color: active ? '#fff' : 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: active ? 600 : 400,
                      transition: 'all 0.15s', marginBottom: 1, boxShadow: active ? `inset 0 0 0 1px ${T.primary}28` : 'none',
                      textAlign: 'left', whiteSpace: 'nowrap', fontFamily: "'Inter',sans-serif",
                    }} className={active ? '' : 'nav-h'}>
                    <span style={{ color: active ? T.primary : 'rgba(255,255,255,0.3)', display: 'flex', flexShrink: 0, transition: 'color 0.15s' }}>{I[item.icon]}</span>
                    {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                    {!collapsed && item.shortcut && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: "'JetBrains Mono',monospace" }}>{item.shortcut}</span>}
                    {!collapsed && active && <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.primary, boxShadow: `0 0 8px ${T.primary}` }} />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div style={{ padding: collapsed ? '10px 8px' : '12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {!collapsed && <div style={{ marginBottom: 10 }}><ThemeSwitcher theme={theme} setTheme={setTheme} /></div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Av name={displayName} size={32} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderRadius: '50%', background: BASE.green, border: '2px solid #08080b' }} />
            </div>
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{role}</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* TOP BAR */}
        <header style={{ height: 56, background: '#08080b', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10, flexShrink: 0 }}>
          <div style={{ flex: 1, maxWidth: 420, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', display: 'flex' }}>{I.search}</div>
            <input id="cmd-input" placeholder="Search... (⌘K)" style={{ width: '100%', padding: '8px 40px 8px 34px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, color: '#fff', fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' }} className="sinput" />
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ThemeSwitcher theme={theme} setTheme={setTheme} />
            <button onClick={() => setShowKbHelp(true)} title="Keyboard shortcuts (?)" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', borderRadius: 7, padding: '6px 9px', fontSize: 12, fontFamily: "'JetBrains Mono',monospace", transition: 'all 0.15s' }} className="icon-h">?</button>
            <button onClick={() => setChatOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', background: `linear-gradient(135deg,${T.primary}20,${T.secondary}14)`, border: `1px solid ${T.primary}30`, borderRadius: 9, color: T.primary, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif", transition: 'all 0.2s' }} className="cmd-h">
              <span style={{ display: 'flex' }}>{I.bolt}</span>Command
            </button>

            {/* Notifications */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button onClick={() => { setShowNotif(v => !v); setShowUserMenu(false); }} style={{ position: 'relative', background: showNotif ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', borderRadius: 9, padding: '7px 9px', display: 'flex', transition: 'all 0.15s' }} className="icon-h">
                {I.bell}
                <span style={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, background: BASE.red, borderRadius: '50%', border: '2px solid #08080b', animation: 'pulse 2s infinite' }} />
              </button>
              {showNotif && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 300, background: '#0f0f13', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, boxShadow: '0 24px 60px rgba(0,0,0,0.8)', zIndex: 500, overflow: 'hidden', animation: 'ddrop .18s ease' }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: 13, fontFamily: "'Sora',sans-serif" }}>Notifications</span>
                    <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 11, cursor: 'pointer' }}>Mark all read</button>
                  </div>
                  {NOTIFS_DATA.map(n => (
                    <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 10 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: n.color, marginTop: 5, boxShadow: `0 0 6px ${n.color}`, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>{n.text}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{n.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User */}
            <div ref={userRef} style={{ position: 'relative' }}>
              <button onClick={() => { setShowUserMenu(v => !v); setShowNotif(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                <Av name={displayName} size={32} />
              </button>
              {showUserMenu && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 205, background: '#0f0f13', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, boxShadow: '0 24px 60px rgba(0,0,0,0.8)', zIndex: 500, overflow: 'hidden', animation: 'ddrop .18s ease' }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Sora',sans-serif" }}>{displayName}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{user?.email}</div>
                  </div>
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.25)', marginBottom: 5, padding: '0 6px', letterSpacing: '0.1em', fontFamily: "'JetBrains Mono',monospace" }}>ROLE</div>
                    {['Employee', 'Manager', 'Executive'].map(r => (
                      <button key={r} onClick={() => setRole(r)} style={{ width: '100%', background: role === r ? `${T.primary}15` : 'none', border: 'none', color: role === r ? T.primary : 'rgba(255,255,255,0.45)', padding: '7px 10px', textAlign: 'left', cursor: 'pointer', fontSize: 12, borderRadius: 7, fontWeight: role === r ? 600 : 400, fontFamily: "'Inter',sans-serif", transition: 'all 0.15s' }}>
                        {role === r ? '● ' : '○ '}{r}
                      </button>
                    ))}
                  </div>
                  <div style={{ padding: '10px 16px' }}>
                    <button onClick={() => signOut(auth)} style={{ width: '100%', background: `${BASE.red}0e`, border: `1px solid ${BASE.red}20`, color: BASE.red, padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>Sign out</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* LIVE TICKER */}
        <Ticker T={T} />

        {/* SCROLL AREA */}
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: BASE.bg }}>

          {/* ── Page Router ── */}
          {activeNav === 'email'        && <EmailPage T={T} />}
          {activeNav === 'calendar'     && <CalendarPage T={T} />}
          {activeNav === 'team'         && <TeamPage T={T} />}
          {activeNav === 'deployments'  && <DeploymentsPage T={T} />}
          {activeNav === 'documents'    && <DocumentsPage T={T} />}
          {activeNav === 'analytics'    && <AnalyticsPage T={T} />}
          {activeNav === 'integrations' && <IntegrationsPage T={T} />}
          {activeNav === 'settings'     && <SettingsPage T={T} user={user} onSignOut={() => signOut(auth)} />}

          {/* ── Dashboard (default) ── */}
          {activeNav === 'dashboard' && (
            <div style={{ padding: '0 20px 80px' }}>

          {/* HERO HEADER */}
          <div style={{ margin: '0 -20px 24px', padding: '28px 24px 26px', background: 'linear-gradient(160deg,#06060f 0%,#080b18 50%,#060510 100%)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-50%', left: '5%', width: 350, height: 300, background: `radial-gradient(ellipse,${T.primary}1a 0%,transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: '-30%', right: '10%', width: 280, height: 250, background: `radial-gradient(ellipse,${T.secondary}14 0%,transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${T.primary}30,${T.secondary}25,transparent)` }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${T.primary},${T.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: `0 4px 16px ${T.glow}` }}>{I.bolt}</div>
                    <Pill label={`● ${role}`} color={BASE.green} />
                    <Pill label="Live" color={T.primary} />
                  </div>
                  <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 'clamp(20px,2.5vw,28px)', margin: 0, background: 'linear-gradient(135deg,#fff 30%,rgba(255,255,255,0.55))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>
                    {greeting}, {firstName} 👋
                  </h1>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 5 }}>{dateStr}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ padding: '8px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Inter',sans-serif" }}>
                    {I.drag} Rearrange
                  </button>
                </div>
              </div>

              {/* AI COMMAND BAR */}
              <div style={{ marginTop: 20, background: 'rgba(255,255,255,0.025)', border: `1px solid ${T.primary}20`, borderRadius: 14, padding: '13px 16px', backdropFilter: 'blur(8px)', transition: 'all 0.25s' }} className="cbar-focus">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: T.primary, display: 'flex', flexShrink: 0 }}>{I.bolt}</span>
                  <input value={cmdVal} onChange={e => setCmdVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendCmd()} placeholder="Ask WorkPilot or give a command..." style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: 14, outline: 'none', fontFamily: "'Inter',sans-serif" }} />
                  <span style={{ color: 'rgba(255,255,255,0.2)', display: 'flex' }}>{I.mic}</span>
                  <button onClick={sendCmd} style={{ padding: '7px 11px', background: cmdVal ? `linear-gradient(135deg,${T.primary},${T.secondary})` : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', display: 'flex', transition: 'all 0.2s', boxShadow: cmdVal ? `0 2px 12px ${T.glow}` : 'none' }}>{I.send}</button>
                </div>
                <div style={{ display: 'flex', gap: 7, marginTop: 11, flexWrap: 'wrap' }}>
                  {[['Check emails', 'mail'], ['Schedule meeting', 'cal'], ['Team status', 'team'], ['Deployments', 'deploy']].map(([label, icon]) => (
                    <button key={label} onClick={() => setCmdVal(label)} style={{ padding: '4px 11px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Inter',sans-serif", transition: 'all 0.18s', whiteSpace: 'nowrap' }} className="chip-h">
                      <span style={{ color: T.primary, display: 'flex' }}>{I[icon]}</span>{label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ALERTS */}
          {ALERTS.length > 0 && (
            <div style={{ display: 'flex', gap: 7, overflowX: 'auto', marginBottom: 20, paddingBottom: 2 }}>
              {ALERTS.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px 6px 10px', background: `${a.c}08`, border: `1px solid ${a.c}22`, borderLeft: `3px solid ${a.c}`, borderRadius: 8, whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', transition: 'all 0.18s' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: a.c, boxShadow: `0 0 5px ${a.c}` }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{a.text}</span>
                  <button onClick={e => { e.stopPropagation(); setDismissedAlerts(p => [...p, a.id]); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', display: 'flex', padding: 0, marginLeft: 4 }}>{I.x}</button>
                </div>
              ))}
            </div>
          )}

          {/* BENTO GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 14 }}>
            {widgetOrder.map(id => {
              const render = WIDGETS[id];
              return render ? <React.Fragment key={id}>{render()}</React.Fragment> : null;
            })}
          </div>

          {/* INTEGRATIONS */}
          <div style={{ marginTop: 20, padding: '13px 16px', background: '#0c0c0f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap' }}>CONNECTED</span>
            <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.08)' }} />
            {[
              { n: 'Gmail',    icon: <SiGmail size={11} color="#EA4335" />,    c: true  },
              { n: 'Calendar', icon: <SiGooglecalendar size={11} color="#4285F4" />, c: true  },
              { n: 'GitHub',   icon: <SiGithub size={11} color="#ffffff" />,   c: true  },
              { n: 'Slack',    icon: <SiSlack size={11} color="#E01E5A" />,    c: false },
              { n: 'Zoom',     icon: <SiZoom size={11} color="#2D8CFF" />,     c: false },
              { n: 'Teams',    icon: <SiMicrosoft size={11} color="#7FBA00" />, c: false },
            ].map(ig => (
              <div key={ig.n} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, background: ig.c ? `${BASE.green}08` : 'rgba(255,255,255,0.03)', border: `1px solid ${ig.c ? BASE.green + '22' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', transition: 'all 0.18s' }}>
                {ig.icon}
                <span style={{ fontSize: 11, color: ig.c ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)', fontWeight: ig.c ? 500 : 400 }}>{ig.n}</span>
              </div>
            ))}
            <GBtn color={T.primary} style={{ marginLeft: 2 }}>+ Connect more</GBtn>
          </div>
            </div>
          )}
        </main>
      </div>

      {/* ══ CHAT BUBBLE ══ */}
      <div style={{ position: 'fixed', bottom: 22, right: 22, zIndex: 200 }}>
        {chatOpen ? (
          <div style={{ width: 375, height: 510, background: '#0c0c0f', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.85)', animation: 'chatUp .28s cubic-bezier(0.16,1,0.3,1)' }}>
            <div style={{ padding: '13px 15px', background: `linear-gradient(135deg,${T.primary}18,${T.secondary}12)`, borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: `linear-gradient(135deg,${T.primary},${T.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: `0 2px 10px ${T.glow}` }}>{I.bolt}</div>
                <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13 }}>WorkPilot AI</span>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: BASE.green, animation: 'pulse 2s infinite' }} />
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setChatOpen(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', borderRadius: 6, padding: '4px 8px', fontSize: 12 }}>—</button>
                <button onClick={() => setChatOpen(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', borderRadius: 6, padding: '4px 7px', display: 'flex', alignItems: 'center' }}>{I.x}</button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 13px', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {msgs.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: m.r === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '82%', padding: '9px 13px', fontSize: 12, lineHeight: 1.55, borderRadius: m.r === 'user' ? '13px 13px 3px 13px' : '13px 13px 13px 3px', background: m.r === 'user' ? `linear-gradient(135deg,${T.primary},${T.secondary})` : 'rgba(255,255,255,0.05)', border: m.r === 'ai' ? '1px solid rgba(255,255,255,0.07)' : 'none', color: '#fff' }}>{m.text}</div>
                </div>
              ))}
              {typing && <div style={{ display: 'flex', gap: 5, padding: '9px 13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '13px 13px 13px 3px', width: 'fit-content', alignItems: 'center' }}>{[0, 1, 2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: T.primary, animation: `tdot 1.2s ${i * 0.2}s ease infinite` }} />)}</div>}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: '7px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 5, overflowX: 'auto' }}>
              {['Draft email', 'Check schedule', 'Team update'].map(c => (
                <button key={c} onClick={() => setChatVal(c)} style={{ padding: '3px 9px', borderRadius: 99, background: `${T.primary}12`, border: `1px solid ${T.primary}25`, color: T.primary, fontSize: 10, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'Inter',sans-serif" }}>{c}</button>
              ))}
            </div>
            <div style={{ padding: '9px 12px 13px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 7 }}>
              <input value={chatVal} onChange={e => setChatVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Type a command..." style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: '8px 11px', color: '#fff', fontSize: 12, outline: 'none', fontFamily: "'Inter',sans-serif" }} />
              <button onClick={sendChat} style={{ padding: '8px 12px', background: chatVal ? `linear-gradient(135deg,${T.primary},${T.secondary})` : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 9, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s', boxShadow: chatVal ? `0 2px 12px ${T.glow}` : 'none' }}>{I.send}</button>
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setChatOpen(true)} title="Ask WorkPilot" style={{ width: 52, height: 52, borderRadius: '50%', background: `linear-gradient(135deg,${T.primary},${T.secondary})`, border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 28px ${T.glow}`, transition: 'all 0.2s' }} className="fab-h">{I.bolt}</button>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 11, height: 11, borderRadius: '50%', background: BASE.green, border: '2.5px solid #000', animation: 'pulse 2s infinite' }} />
          </div>
        )}
      </div>

      {/* ══ KEYBOARD SHORTCUTS MODAL ══ */}
      {showKbHelp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowKbHelp(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0f0f14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '28px 32px', width: 420, boxShadow: '0 30px 80px rgba(0,0,0,0.8)', animation: 'ddrop .2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 16 }}>Keyboard Shortcuts</span>
              <button onClick={() => setShowKbHelp(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '5px 8px', display: 'flex' }}>{I.x}</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['G then D', 'Go to Dashboard'],
                ['G then E', 'Go to Email'],
                ['G then C', 'Go to Chat with AI'],
                ['G then A', 'Go to Calendar'],
                ['G then T', 'Go to Team'],
                ['G then V', 'Go to Deployments'],
                ['G then O', 'Go to Documents'],
                ['⌘K / Ctrl+K', 'Focus search bar'],
                ['?', 'Toggle this shortcuts panel'],
                ['Esc', 'Close modals / chat'],
              ].map(([key, desc]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{desc}</span>
                  <kbd style={{ padding: '3px 9px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, fontSize: 11, color: '#fff', fontFamily: "'JetBrains Mono',monospace" }}>{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ GLOBAL STYLES ══ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.2)} }
        @keyframes ddrop { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes chatUp { from{opacity:0;transform:translateY(18px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes tdot { 0%,60%,100%{transform:translateY(0);opacity:.3} 30%{transform:translateY(-4px);opacity:1} }
        @keyframes tickerMove { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes pageIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .nav-h:hover { background:rgba(255,255,255,0.04)!important; color:rgba(255,255,255,0.75)!important; }
        .icon-h:hover { background:rgba(255,255,255,0.08)!important; color:#fff!important; }
        .cmd-h:hover { filter:brightness(1.15); }
        .pbtn-h:hover { filter:brightness(1.1); transform:translateY(-1px); }
        .gbtn-h:hover { filter:brightness(1.2); transform:translateY(-1px); }
        .fab-h:hover { transform:scale(1.08)!important; }
        .chip-h:hover { background:rgba(59,130,246,0.12)!important; border-color:rgba(59,130,246,0.3)!important; color:#3b82f6!important; }
        .sinput:focus { border-color:rgba(59,130,246,0.35)!important; background:rgba(255,255,255,0.06)!important; outline:none; }
        .cbar-focus:focus-within { border-color:rgba(59,130,246,0.35)!important; box-shadow:0 0 0 3px rgba(59,130,246,0.07)!important; }
        .pg-row:hover { background:rgba(255,255,255,0.03)!important; }
        .pg-btn:hover { opacity:0.85; transform:translateY(-1px); }
        @media (max-width:1100px) { .bento-grid { grid-template-columns:repeat(2,minmax(0,1fr))!important; } }
        @media (max-width:700px) { .bento-grid { grid-template-columns:1fr!important; } }
      `}</style>
    </div>
  );
}
