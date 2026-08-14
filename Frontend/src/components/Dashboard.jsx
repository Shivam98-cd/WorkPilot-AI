import React, { useState, useEffect, useRef, useCallback } from 'react';
import { auth, signOut } from '../firebase';
import { backendLogout, getDashboardSummary } from '../api';
import Logo from './Logo';
import { EmailPage, CalendarPage, TeamPage, DeploymentsPage, DocumentsPage, AnalyticsPage, IntegrationsPage, SettingsPage } from './Pages';
import { SiGmail, SiGooglecalendar, SiGithub, SiZoom } from 'react-icons/si';
import DataFetchAgent from '../agents/DataFetchAgent';
import UIUpdateAgent from '../agents/UIUpdateAgent';
import StateManagerAgent from '../agents/StateManagerAgent';
import IntegrationAgent from '../agents/IntegrationAgent';
import SummarizerAgent from '../agents/SummarizerAgent';

const SiSlack = ({ size, color }) => <svg width={size} height={size} viewBox="0 0 24 24"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.04a2.528 2.528 0 0 1-2.522 2.52H8.823a2.528 2.528 0 0 1-2.52-2.52v-5.04z" fill="#36C5F0"/><path d="M8.823 5.043a2.528 2.528 0 0 1-2.52-2.52A2.528 2.528 0 0 1 8.823 0a2.528 2.528 0 0 1 2.522 2.522v2.52H8.823zm0 1.262a2.528 2.528 0 0 1 2.522 2.52v5.043a2.528 2.528 0 0 1-2.522 2.52H3.78a2.528 2.528 0 0 1-2.522-2.52V8.825a2.528 2.528 0 0 1 2.522-2.52h5.043z" fill="#2EB67D"/><path d="M18.958 8.825a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52 2.528 2.528 0 0 1-2.522 2.52h-2.52v-2.52zm-1.261 0a2.528 2.528 0 0 1-2.52 2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52v-5.04a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.04z" fill="#ECB22E"/><path d="M15.177 18.957a2.528 2.528 0 0 1 2.52 2.522 2.528 2.528 0 0 1-2.52 2.52 2.528 2.528 0 0 1-2.522-2.52v-2.522h2.522zm0-1.261a2.528 2.528 0 0 1-2.522-2.52v-5.043a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.043a2.528 2.528 0 0 1-2.522 2.52h-5.043z" fill="#E01E5A"/></svg>;
const SiMicrosoft = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/></svg>;

const THEMES = {
  blue:   { primary: '#3b82f6', secondary: '#6366f1', accent: '#06b6d4', glow: 'rgba(59,130,246,0.35)' },
  purple: { primary: '#8b5cf6', secondary: '#ec4899', accent: '#a78bfa', glow: 'rgba(139,92,246,0.35)' },
  green:  { primary: '#10b981', secondary: '#06b6d4', accent: '#34d399', glow: 'rgba(16,185,129,0.35)' },
};

const BASE = {
  bg: '#000', surface: '#0c0c0f', border: 'rgba(255,255,255,0.07)',
  red: '#ef4444', amber: '#f59e0b', green: '#10b981',
  textPrimary: '#fff', textSub: 'rgba(255,255,255,0.55)', textMuted: 'rgba(255,255,255,0.28)',
};

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
  menu:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  sun:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"/></svg>
};

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

const SPARKLINE_DATA = [4, 7, 5, 9, 6, 11, 8, 14, 10, 13];
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
const CHAT_INIT = [
  { id: 1, r: 'ai', text: "Good morning! I've reviewed your schedule. 3 urgent items need attention today. Start with the CFO budget email?" },
  { id: 2, r: 'user', text: 'Yes, draft a reply for the CFO.' },
  { id: 3, r: 'ai', text: 'Draft: "Hi Robert, Thanks for the Q3 budget proposal. Can we schedule a 30-min call Thursday 2pm to discuss?" — Send?' },
];

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

function Av({ name, size = 30 }) {
  const letters = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hue = (name.charCodeAt(0) * 47) % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 700, color: '#fff', fontFamily: "'Sora', sans-serif", background: `linear-gradient(135deg, hsl(${hue},65%,45%), hsl(${(hue+60)%360},65%,55%))` }}>
      {letters}
    </div>
  );
}

function Bento({ children, style = {}, className = "", draggable, onDragStart, onDragOver, onDrop, id }) {
  return (
    <div
      className={`card ${className}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{ ...style, position: 'relative' }}>
      {draggable && (
        <div className="drag-handle" style={{ position: 'absolute', top: 10, right: 10, color: 'rgba(255,255,255,0.2)', cursor: 'grab', opacity: 0, transition: 'opacity 0.2s' }}>{I.drag}</div>
      )}
      {children}
    </div>
  );
}

function Pill({ label, color, bg }) {
  return <span style={{ padding: '3px 9px', borderRadius: 99, background: bg || `${color}15`, border: `1px solid ${color}28`, color, fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap' }}>{label}</span>;
}

function PBtn({ children, onClick, T, style = {}, className = "" }) {
  return <button onClick={onClick} style={{ padding: '9px 16px', borderRadius: 10, background: `linear-gradient(135deg,${T.primary},${T.secondary})`, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Inter',sans-serif", boxShadow: `0 4px 18px ${T.glow}`, transition: 'all 0.2s', ...style }} className={`btn-primary ${className}`}>{children}</button>;
}

function GBtn({ children, onClick, color, style = {}, className = "" }) {
  return <button onClick={onClick} style={{ padding: '5px 11px', borderRadius: 8, background: `${color}12`, border: `1px solid ${color}28`, color, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Inter',sans-serif", transition: 'all 0.18s', whiteSpace: 'nowrap', ...style }} className={`btn-ghost ${className}`}>{children}</button>;
}

function Ticker({ T }) {
  return (
    <div style={{ background: 'transparent', height: 28, overflow: 'hidden', display: 'flex', alignItems: 'center', position: 'relative', width: '100%' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(90deg,#0a0a0d,transparent)', zIndex: 2 }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(270deg,#0a0a0d,transparent)', zIndex: 2 }} />
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

function ThemeSwitcher({ theme, setTheme, onThemeChange }) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 99, padding: '4px 6px' }}>
      {Object.entries(THEMES).map(([key, val]) => (
        <button key={key} title={key} onClick={() => { setTheme(key); onThemeChange && onThemeChange(key); }} style={{ width: 18, height: 18, borderRadius: '50%', background: val.primary, border: theme === key ? `2px solid #fff` : '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s', padding: 0 }} />
      ))}
    </div>
  );
}

export default function Dashboard({ user, onOpenCockpit, themeKey, onThemeChange, initialNav, onNavConsumed }) {
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Alex';
  const firstName = displayName.split(' ')[0];

  const [theme, setTheme] = useState(() => themeKey || localStorage.getItem('wp_theme') || 'blue');
  const T = THEMES[theme];
  useEffect(() => { if (themeKey && themeKey !== theme) setTheme(themeKey); }, [themeKey]);

  const [collapsed, setCollapsed] = useState(true);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [role, setRole] = useState(() => localStorage.getItem('wp_role') || 'Manager');

  // Navigate to section requested by ConnectionSheet
  useEffect(() => {
    if (initialNav) {
      setActiveNav(initialNav);
      onNavConsumed?.();
    }
  }, [initialNav]);
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [cmdVal, setCmdVal] = useState('');
  const [chatVal, setChatVal] = useState('');
  const [msgs, setMsgs] = useState(CHAT_INIT);
  const [typing, setTyping] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [showKbHelp, setShowKbHelp] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);

  const [widgetOrder, setWidgetOrder] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wp_order')) || ['email', 'schedule', 'team', 'stats', 'deploy', 'briefing', 'aiActions', 'docs']; }
    catch { return ['email', 'schedule', 'team', 'stats', 'deploy', 'briefing', 'aiActions', 'docs']; }
  });
  const dragRef = useRef(null);

  const [state, setState] = useState({});
  const [data, setData] = useState({});
  const [uiState, setUiState] = useState({});
  const agentRefs = useRef({});

  const stateAgent = StateManagerAgent({ setState, getState: () => state });
  const dataAgent = DataFetchAgent({ setData, getData: () => data });
  const uiAgent = UIUpdateAgent({ setUiState, getUiState: () => uiState, refs: agentRefs });
  const integrationAgent = IntegrationAgent({
    setData,
    setState,
    setUiState,
    getData: () => data,
    getState: () => state,
    getUiState: () => uiState
  });
  const summarizerAgent = SummarizerAgent({ setState, getState: () => state });

  useEffect(() => {
    stateAgent.init();
    dataAgent.init();
    uiAgent.init();
    integrationAgent.init();
    const cleanupSummary = summarizerAgent.init();
    return () => cleanupSummary?.();
  }, []);

  useEffect(() => {
    let cancelled = false;
    getDashboardSummary()
      .then(res => {
        if (!cancelled) {
          setDashboardData(res?.data || null);
          setDashboardLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setDashboardError(err.message || 'Failed to load dashboard data');
          setDashboardLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const notifRef = useRef(null);
  const userRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => { localStorage.setItem('wp_theme', theme); onThemeChange && onThemeChange(theme); }, [theme]);
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
    onOpenCockpit && onOpenCockpit();
    setCmdVal('');
  }, [cmdVal, onOpenCockpit]);

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
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  
  const ALERTS = [
    { id: 1, text: '🔴 CFO email due', c: BASE.red },
    { id: 2, text: '🟡 Mike overdue', c: BASE.amber },
    { id: 3, text: '🔵 Deploy in 2h', c: T.primary },
  ].filter(a => !dismissedAlerts.includes(a.id));

  const SPANS = {
    email: { col: 7, row: 1 },
    schedule: { col: 5, row: 2 },
    stats: { col: 5, row: 2 },
    team: { col: 7, row: 1 },
    deploy: { col: 12, row: 1 },
    briefing: { col: 4, row: 1 },
    aiActions: { col: 4, row: 1 },
    docs: { col: 4, row: 1 },
  };

  const getDurHeight = (dur) => {
    if (dur.includes('h')) return parseInt(dur) * 60;
    return parseInt(dur);
  };

  const WIDGETS = {
    email: () => {
      const emails = dashboardData?.email || [];
      const urgentCount = dashboardData?.counts?.urgentEmails || 0;
      if (dashboardLoading) return <Bento draggable onDragStart={e => handleDragStart(e, 'email')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'email')} style={{ gridColumn: `span ${SPANS.email.col}`, gridRow: `span ${SPANS.email.row}` }}><div style={{padding:20,color:'rgba(255,255,255,0.4)',fontSize:12}}>Loading emails...</div></Bento>;
      if (dashboardError) return <Bento draggable onDragStart={e => handleDragStart(e, 'email')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'email')} style={{ gridColumn: `span ${SPANS.email.col}`, gridRow: `span ${SPANS.email.row}` }}><div style={{padding:20,color:'#ef4444',fontSize:12}}>Failed to load emails</div></Bento>;
      return (
        <Bento draggable onDragStart={e => handleDragStart(e, 'email')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'email')} style={{ gridColumn: `span ${SPANS.email.col}`, gridRow: `span ${SPANS.email.row}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Email</span>
              <Pill label={`${urgentCount} Urgent`} color={BASE.red} bg="rgba(239,68,68,0.15)" />
            </div>
            <GBtn color={T.primary}>Draft All</GBtn>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 12 }}>
            {emails.length === 0 ? (
              <div style={{padding:'20px 10px',textAlign:'center',color:'rgba(255,255,255,0.3)',fontSize:12}}>No emails yet. Connect Gmail in Integrations.</div>
            ) : emails.map(em => (
              <div key={em.id} className="email-row" style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '9px 10px', borderRadius: 10, cursor: 'pointer',
                borderLeft: em.priority === 'urgent' ? '3px solid #ef4444' : '3px solid transparent',
                background: em.priority === 'urgent' ? 'rgba(239,68,68,0.04)' : 'transparent',
                transition: 'all 0.15s', marginBottom: 2,
              }}>
                <Av name={em.from || em.sender || '?'} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: em.read ? 500 : 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {em.from || em.sender} <Pill label={em.role || 'Inbox'} color="rgba(255,255,255,0.5)" bg="rgba(255,255,255,0.08)" />
                  </div>
                  <div className="truncate-text" style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>{em.subject}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontFamily: "'JetBrains Mono',monospace" }}>{em.time}</span>
                  <GBtn color={T.primary}>Reply</GBtn>
                </div>
              </div>
            ))}
          </div>
          <PBtn T={T} style={{ width: '100%', justifyContent: 'center' }}>Handle all with AI {I.bolt}</PBtn>
        </Bento>
      );
    },

    schedule: () => {
      const events = dashboardData?.calendar || [];
      if (dashboardLoading) return <Bento draggable onDragStart={e => handleDragStart(e, 'schedule')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'schedule')} style={{ gridColumn: `span ${SPANS.schedule.col}`, gridRow: `span ${SPANS.schedule.row}` }}><div style={{padding:20,color:'rgba(255,255,255,0.4)',fontSize:12}}>Loading schedule...</div></Bento>;
      if (dashboardError) return <Bento draggable onDragStart={e => handleDragStart(e, 'schedule')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'schedule')} style={{ gridColumn: `span ${SPANS.schedule.col}`, gridRow: `span ${SPANS.schedule.row}` }}><div style={{padding:20,color:'#ef4444',fontSize:12}}>Failed to load schedule</div></Bento>;
      const fmtTime = (iso) => {
        if (!iso) return '--:--';
        const d = new Date(iso);
        if (isNaN(d.getTime())) return '--:--';
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      };
      const fmtDur = (minutes) => {
        if (!minutes) return '--';
        if (minutes < 60) return `${minutes}m`;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return m ? `${h}h ${m}m` : `${h}h`;
      };
      const mapped = events.map(ev => ({
        id: ev.id,
        time: fmtTime(ev.time || ev.start),
        title: ev.title || 'Untitled',
        dur: fmtDur(ev.duration || (ev.end && ev.start ? Math.round((new Date(ev.end) - new Date(ev.start)) / 60000) : undefined)),
        color: ev.color || T.primary,
        status: 'ready',
      }));
      return (
        <Bento draggable onDragStart={e => handleDragStart(e, 'schedule')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'schedule')} style={{ gridColumn: `span ${SPANS.schedule.col}`, gridRow: `span ${SPANS.schedule.row}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Today</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{dateStr}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
            {mapped.length === 0 ? (
              <div style={{padding:'20px 10px',textAlign:'center',color:'rgba(255,255,255,0.3)',fontSize:12}}>No events scheduled today.</div>
            ) : mapped.map(m => (
              <div key={m.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 45, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: "'JetBrains Mono',monospace", paddingTop: 4 }}>{m.time}</div>
                <div style={{ flex: 1, height: Math.max(getDurHeight(m.dur) * 1.5, 40), background: `${m.color}15`, borderLeft: `3px solid ${m.color}`, borderRadius: '0 8px 8px 0', padding: '8px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{m.title}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{m.dur}</span>
                </div>
              </div>
            ))}
          </div>
          <GBtn color={T.primary} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>+ Schedule with AI</GBtn>
        </Bento>
      );
    },

    stats: () => {
      const analytics = dashboardData?.analytics || {};
      if (dashboardLoading) return <Bento draggable onDragStart={e => handleDragStart(e, 'stats')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'stats')} style={{ gridColumn: `span ${SPANS.stats.col}`, gridRow: `span ${SPANS.stats.row}`, display: 'flex', flexDirection: 'column' }}><div style={{padding:20,color:'rgba(255,255,255,0.4)',fontSize:12}}>Loading analytics...</div></Bento>;
      if (dashboardError) return <Bento draggable onDragStart={e => handleDragStart(e, 'stats')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'stats')} style={{ gridColumn: `span ${SPANS.stats.col}`, gridRow: `span ${SPANS.stats.row}`, display: 'flex', flexDirection: 'column' }}><div style={{padding:20,color:'#ef4444',fontSize:12}}>Failed to load analytics</div></Bento>;
      const metrics = [
        { label: 'Tasks Done', value: String(analytics.tasks_completed ?? 0), delta: '+0%', color: BASE.green },
        { label: 'Emails Handled', value: String(analytics.emails_handled ?? 0), delta: '+0%', color: T.primary },
        { label: 'Focus Hours', value: String(analytics.focus_hours ?? 0), delta: '-0%', color: BASE.red },
        { label: 'AI Saves', value: `${analytics.ai_time_saved ?? 0}h`, delta: '+0%', color: T.secondary }
      ];
      return (
        <Bento draggable onDragStart={e => handleDragStart(e, 'stats')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'stats')} style={{ gridColumn: `span ${SPANS.stats.col}`, gridRow: `span ${SPANS.stats.row}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1 }}>
            {metrics.map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: 28 }}>{s.value}</span>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: s.delta.startsWith('+') ? `${BASE.green}20` : `${BASE.red}20`, color: s.delta.startsWith('+') ? BASE.green : BASE.red }}>{s.delta}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{s.label}</div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <Sparkline data={(analytics.weekly_data || SPARKLINE_DATA).map(v => typeof v === 'number' ? v : 5)} color={s.color} width={100} height={30} />
                </div>
              </div>
            ))}
          </div>
        </Bento>
      );
    },

    team: () => {
      const members = dashboardData?.team || [];
      if (dashboardLoading) return <Bento draggable onDragStart={e => handleDragStart(e, 'team')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'team')} style={{ gridColumn: `span ${SPANS.team.col}`, gridRow: `span ${SPANS.team.row}` }}><div style={{padding:20,color:'rgba(255,255,255,0.4)',fontSize:12}}>Loading team...</div></Bento>;
      if (dashboardError) return <Bento draggable onDragStart={e => handleDragStart(e, 'team')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'team')} style={{ gridColumn: `span ${SPANS.team.col}`, gridRow: `span ${SPANS.team.row}` }}><div style={{padding:20,color:'#ef4444',fontSize:12}}>Failed to load team</div></Bento>;
      return (
        <Bento draggable onDragStart={e => handleDragStart(e, 'team')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'team')} style={{ gridColumn: `span ${SPANS.team.col}`, gridRow: `span ${SPANS.team.row}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Team Status</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <tbody>
              {members.length === 0 ? (
                <tr><td style={{padding:'20px',textAlign:'center',color:'rgba(255,255,255,0.3)',fontSize:12}} colSpan={6}>No team members yet.</td></tr>
              ) : members.map(m => {
                const sMap = { done: BASE.green, 'on-track': T.primary, delayed: BASE.amber, missing: BASE.red, on_track: T.primary };
                const rawStatus = (m.status || '').toLowerCase();
                const c = sMap[rawStatus] || T.primary;
                const displayStatus = rawStatus.replace('_', '-');
                return (
                  <tr key={m.id || m.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px 0' }}><Av name={m.name} size={28} /></td>
                    <td style={{ padding: '8px', fontSize: 13, fontWeight: 500 }}>{m.name}</td>
                    <td style={{ padding: '8px', fontSize: 12, color: 'rgba(255,255,255,0.5)' }} className="truncate-text">{m.task || m.role || ''}</td>
                    <td style={{ padding: '8px', width: 80 }}>
                      <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                        <div style={{ width: `${m.progress ?? 0}%`, height: '100%', background: c, borderRadius: 2 }} />
                      </div>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, margin: '0 auto', boxShadow: `0 0 6px ${c}` }} />
                    </td>
                    <td style={{ padding: '8px 0', textAlign: 'right' }}>
                      {(displayStatus === 'delayed' || displayStatus === 'missing') ? <GBtn color={BASE.amber} style={{ display: 'inline-flex' }}>{displayStatus === 'missing' ? 'Remind' : 'Follow up'}</GBtn> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Bento>
      );
    },

    deploy: () => {
      const pipelines = dashboardData?.deployments || [];
      if (dashboardLoading) return <Bento draggable onDragStart={e => handleDragStart(e, 'deploy')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'deploy')} style={{ gridColumn: `span ${SPANS.deploy.col}`, gridRow: `span ${SPANS.deploy.row}` }}><div style={{padding:20,color:'rgba(255,255,255,0.4)',fontSize:12}}>Loading deployments...</div></Bento>;
      if (dashboardError) return <Bento draggable onDragStart={e => handleDragStart(e, 'deploy')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'deploy')} style={{ gridColumn: `span ${SPANS.deploy.col}`, gridRow: `span ${SPANS.deploy.row}` }}><div style={{padding:20,color:'#ef4444',fontSize:12}}>Failed to load deployments</div></Bento>;
      const current = pipelines[0] || { name: 'Staging', version: 'v2.4.2', status: 'running', progress: 67, risk: 'medium', uptime: '—', deployed: 'Running' };
      return (
        <Bento draggable onDragStart={e => handleDragStart(e, 'deploy')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'deploy')} style={{ gridColumn: `span ${SPANS.deploy.col}`, gridRow: `span ${SPANS.deploy.row}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 700, marginRight: 16 }}>Deployment Pipeline</span>
              {[
                { label: 'Build', status: 'done' },
                { label: 'Test', status: 'done' },
                { label: `Staging ${Math.round(current.progress || 0)}%`, status: current.status === 'live' ? 'done' : 'active' },
                { label: 'Production locked', status: current.status === 'live' ? 'done' : 'wait' }
              ].map((step, i, arr) => (
                <React.Fragment key={step.label}>
                  <div style={{ padding: '6px 12px', borderRadius: 99, background: step.status === 'done' ? `${BASE.green}15` : step.status === 'active' ? `${T.primary}15` : 'rgba(255,255,255,0.05)', border: `1px solid ${step.status === 'done' ? BASE.green : step.status === 'active' ? T.primary : 'rgba(255,255,255,0.1)'}`, color: step.status === 'wait' ? 'rgba(255,255,255,0.5)' : '#fff', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {step.status === 'done' && <span style={{ color: BASE.green }}>✓</span>}
                    {step.status === 'active' && <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.primary, animation: 'pulse 2s infinite' }} />}
                    {step.label}
                  </div>
                  {i < arr.length - 1 && <span style={{ color: 'rgba(255,255,255,0.2)' }}>→</span>}
                </React.Fragment>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
               <div style={{ textAlign: 'right' }}>
                 <div style={{ fontSize: 13, fontWeight: 600 }}>{current.version || 'v2.4.2'}</div>
                 <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{current.uptime || '99.9% Uptime'}</div>
               </div>
               <GBtn color={BASE.red}>Rollback</GBtn>
            </div>
          </div>
        </Bento>
      );
    },

    briefing: () => {
      const alerts = dashboardData?.alerts || [];
      if (dashboardLoading) return <Bento draggable onDragStart={e => handleDragStart(e, 'briefing')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'briefing')} style={{ gridColumn: `span ${SPANS.briefing.col}`, gridRow: `span ${SPANS.briefing.row}`, background: `linear-gradient(145deg, #101014, ${T.primary}10)` }}><div style={{padding:20,color:'rgba(255,255,255,0.4)',fontSize:12}}>Loading briefing...</div></Bento>;
      if (dashboardError) return <Bento draggable onDragStart={e => handleDragStart(e, 'briefing')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'briefing')} style={{ gridColumn: `span ${SPANS.briefing.col}`, gridRow: `span ${SPANS.briefing.row}`, background: `linear-gradient(145deg, #101014, ${T.primary}10)` }}><div style={{padding:20,color:'#ef4444',fontSize:12}}>Failed to load briefing</div></Bento>;
      return (
        <Bento draggable onDragStart={e => handleDragStart(e, 'briefing')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'briefing')} style={{ gridColumn: `span ${SPANS.briefing.col}`, gridRow: `span ${SPANS.briefing.row}`, background: `linear-gradient(145deg, #101014, ${T.primary}10)` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🌅</span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Morning Briefing</span>
            </div>
            <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>{I.x}</button>
          </div>
          <ul style={{ margin: 0, padding: '0 0 0 16px', color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.length === 0 ? (
              <li style={{color:'rgba(255,255,255,0.4)'}}>All clear — no urgent items right now.</li>
            ) : alerts.map((a, i) => (
              <li key={i}>{a.message}</li>
            ))}
          </ul>
          <PBtn T={T} style={{ width: '100%', justifyContent: 'center', marginTop: 24 }} onClick={onOpenCockpit}>Tell AI to handle all</PBtn>
        </Bento>
      );
    },

    aiActions: () => {
      const actions = dashboardData?.aiActions || [];
      if (dashboardLoading) return <Bento draggable onDragStart={e => handleDragStart(e, 'aiActions')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'aiActions')} style={{ gridColumn: `span ${SPANS.aiActions.col}`, gridRow: `span ${SPANS.aiActions.row}` }}><div style={{padding:20,color:'rgba(255,255,255,0.4)',fontSize:12}}>Loading AI actions...</div></Bento>;
      if (dashboardError) return <Bento draggable onDragStart={e => handleDragStart(e, 'aiActions')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'aiActions')} style={{ gridColumn: `span ${SPANS.aiActions.col}`, gridRow: `span ${SPANS.aiActions.row}` }}><div style={{padding:20,color:'#ef4444',fontSize:12}}>Failed to load AI actions</div></Bento>;
      return (
        <Bento draggable onDragStart={e => handleDragStart(e, 'aiActions')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'aiActions')} style={{ gridColumn: `span ${SPANS.aiActions.col}`, gridRow: `span ${SPANS.aiActions.row}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Recent AI Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {actions.length === 0 ? (
              <div style={{padding:'10px 0',textAlign:'center',color:'rgba(255,255,255,0.3)',fontSize:12}}>No AI actions yet. Start using WorkPilot AI.</div>
            ) : actions.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="truncate-text" style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{a.text || a.action || 'AI action'}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{a.time || a.createdAt || ''}</div>
                </div>
                {a.reversible && <GBtn color={T.secondary}>{I.undo} Undo</GBtn>}
              </div>
            ))}
          </div>
        </Bento>
      );
    },

    docs: () => {
      const docs = dashboardData?.documents || [];
      const docStatusColor = { analyzed: BASE.green, pending: BASE.amber, ready: T.primary, issues: BASE.red };
      if (dashboardLoading) return <Bento draggable onDragStart={e => handleDragStart(e, 'docs')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'docs')} style={{ gridColumn: `span ${SPANS.docs.col}`, gridRow: `span ${SPANS.docs.row}`, display: 'flex', flexDirection: 'column' }}><div style={{padding:20,color:'rgba(255,255,255,0.4)',fontSize:12}}>Loading documents...</div></Bento>;
      if (dashboardError) return <Bento draggable onDragStart={e => handleDragStart(e, 'docs')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'docs')} style={{ gridColumn: `span ${SPANS.docs.col}`, gridRow: `span ${SPANS.docs.row}`, display: 'flex', flexDirection: 'column' }}><div style={{padding:20,color:'#ef4444',fontSize:12}}>Failed to load documents</div></Bento>;
      return (
      <Bento draggable onDragStart={e => handleDragStart(e, 'docs')} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, 'docs')} style={{ gridColumn: `span ${SPANS.docs.col}`, gridRow: `span ${SPANS.docs.row}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Documents</span>
          <Pill label={`${docs.length} files`} color="rgba(255,255,255,0.4)" bg="rgba(255,255,255,0.06)" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          {docs.length === 0 ? (
            <div style={{padding:'20px 10px',textAlign:'center',color:'rgba(255,255,255,0.3)',fontSize:12}}>No documents yet. Upload your first file.</div>
          ) : docs.map(d => {
            const status = (d.status || 'ready').toLowerCase();
            const sc = docStatusColor[status] || BASE.green;
            const ext = (d.name || d.fileName || 'file').split('.').pop()?.toUpperCase() || 'FILE';
            return (
            <div key={d.id || d.name} className="email-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px', borderRadius: 8, transition: 'all 0.15s', cursor: 'pointer' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${sc}15`, border: `1px solid ${sc}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: sc, flexShrink: 0, fontSize: 13 }}>{I.docs}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="truncate-text" style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{d.name || d.fileName || 'Untitled'}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, fontFamily: "'JetBrains Mono',monospace" }}>{ext}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: `${sc}15`, border: `1px solid ${sc}30`, color: sc, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>{status}</span>
                <GBtn color={T.primary}>Ask AI</GBtn>
              </div>
            </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12, border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 10, padding: '12px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
          📤 Drop files here
        </div>
      </Bento>
      );
    },
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0a0d', color: '#fff', overflow: 'hidden', fontFamily: "'Inter',sans-serif" }}>
      
      {/* ══ SIDEBAR ══ */}
      <aside className="sidebar" style={{ width: collapsed ? 64 : 220, background: '#0a0a0d', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)', flexShrink: 0, zIndex: 60, position: 'relative' }}>
        <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
           {collapsed ? (
             <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${T.primary}, ${T.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{I.bolt}</div>
           ) : (
             <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8 }}>
               <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${T.primary}, ${T.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{I.bolt}</div>
               <span style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 16 }}>WorkPilot</span>
             </div>
           )}
        </div>

        <nav style={{ flex: 1, padding: '16px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_SECTIONS.flatMap(sec => sec.items).map(item => {
            const active = activeNav === item.id;
            return (
              <button key={item.id} className={`nav-item ${active ? 'nav-active' : ''}`} onClick={() => { if (item.id === 'chat') { onOpenCockpit && onOpenCockpit(); } else setActiveNav(item.id); }} title={collapsed ? item.label : ''} style={{
                display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '12px 0' : '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: active ? 600 : 400,
                transition: 'all 0.15s', gap: 12
              }}>
                <span style={{ color: active ? T.primary : 'inherit' }}>{I[item.icon]}</span>
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
        
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {!collapsed && <ThemeSwitcher theme={theme} setTheme={setTheme} onThemeChange={onThemeChange} />}
          {collapsed && <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.primary }} />}
          {!collapsed && (
             <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
               <Av name={displayName} size={32} />
               <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div className="truncate-text" style={{ fontSize: 13, fontWeight: 600 }}>{displayName}</div>
               </div>
             </div>
          )}
        </div>

        <button onClick={() => setCollapsed(!collapsed)} style={{ position: 'absolute', bottom: 16, right: -12, width: 24, height: 24, background: '#101014', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 70 }} className="sidebar-toggle">
          {collapsed ? I.chevR : I.chevL}
        </button>
      </aside>

      {/* ══ MAIN CONTENT ══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* TOPBAR */}
        <header style={{ height: 52, background: '#0a0a0d', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
           <div className="mobile-menu-btn" style={{ display: 'none' }}>
             <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>{I.menu || I.grid}</button>
           </div>
           
           <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
             <div style={{ position: 'relative', width: 240 }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>{I.search}</div>
                <input id="cmd-input" placeholder="Search... (⌘K)" style={{ width: '100%', padding: '6px 16px 6px 36px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#fff', outline: 'none', fontSize: 13, fontFamily: "'Inter',sans-serif" }} />
             </div>
           </div>

           <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
             <div ref={notifRef} style={{ position: 'relative' }}>
                <button onClick={() => setShowNotif(!showNotif)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', position: 'relative', display: 'flex' }}>
                   {I.bell}
                   <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: BASE.red, borderRadius: '50%', border: '2px solid #0a0a0d' }} />
                </button>
             </div>
             
             <div ref={userRef} style={{ position: 'relative' }}>
                <button onClick={() => setShowUserMenu(!showUserMenu)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <Av name={displayName} size={32} />
                </button>
                {showUserMenu && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 220, background: '#101014', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 8, zIndex: 100 }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 4 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{displayName}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{user?.email}</div>
                    </div>
                    <div style={{ padding: '4px 12px' }}>
                       <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 6, letterSpacing: '0.05em' }}>ROLE</div>
                       {['Employee', 'Manager', 'Executive'].map(r => (
                          <div key={r} onClick={() => setRole(r)} style={{ padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 13, background: role === r ? 'rgba(255,255,255,0.05)' : 'transparent', color: role === r ? T.primary : 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 8 }}>
                             <div style={{ width: 8, height: 8, borderRadius: '50%', background: role === r ? T.primary : 'transparent', border: role === r ? 'none' : '1px solid rgba(255,255,255,0.2)' }} />
                             {r}
                          </div>
                       ))}
                    </div>
                    <div style={{ padding: '8px 12px 4px' }}>
                      <GBtn color={BASE.red} style={{ width: '100%', justifyContent: 'center' }} onClick={async () => { try { await backendLogout(); } catch {} localStorage.removeItem('wp_tokens'); signOut(auth); }}>Sign out</GBtn>
                    </div>
                  </div>
                )}
             </div>
           </div>
        </header>

        {activeNav === 'dashboard' && (
           <div style={{ background: '#0a0a0d', display: 'flex', alignItems: 'center' }}>
             <Ticker T={T} />
           </div>
        )}

        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {activeNav === 'email'        && <EmailPage T={T} />}
          {activeNav === 'calendar'     && <CalendarPage T={T} />}
          {activeNav === 'team'         && <TeamPage T={T} />}
          {activeNav === 'deployments'  && <DeploymentsPage T={T} />}
          {activeNav === 'documents'    && <DocumentsPage T={T} />}
          {activeNav === 'analytics'    && <AnalyticsPage T={T} />}
          {activeNav === 'integrations' && <IntegrationsPage T={T} />}
          {activeNav === 'settings'     && <SettingsPage T={T} user={user} onSignOut={async () => { try { await backendLogout(); } catch(e) {} localStorage.removeItem('wp_tokens'); signOut(auth); }} />}

          {activeNav === 'dashboard' && (
             <div>
                {/* GREETING BAND */}
                <div style={{ height: 68, background: `linear-gradient(90deg, ${T.primary}15, transparent)`, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                      <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20 }}>Good morning, {firstName}</span>
                      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{dateStr}</span>
                   </div>
                   <div className="alerts-container" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                      {ALERTS.map(a => (
                         <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: `${a.c}15`, border: `1px solid ${a.c}30`, borderRadius: 99, whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: 12, fontWeight: 500, color: '#fff' }}>{a.text}</span>
                            <button onClick={() => setDismissedAlerts(p => [...p, a.id])} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0, display: 'flex' }}>{I.x}</button>
                         </div>
                      ))}
                   </div>
                   <PBtn T={T} onClick={onOpenCockpit}>Handle all with AI →</PBtn>
                </div>

                <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
                   
                   {/* COMMAND BAR */}
                   <div style={{ marginBottom: 24, padding: '16px 20px', background: 'rgba(255,255,255,0.025)', border: `1px solid ${T.primary}20`, borderRadius: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                         <span style={{ color: T.primary, display: 'flex' }}>{I.bolt}</span>
                         <input value={cmdVal} onChange={e => setCmdVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendCmd()} placeholder="Ask WorkPilot or give a command..." style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: 15, outline: 'none', fontFamily: "'Inter',sans-serif" }} />
                         <button onClick={sendCmd} style={{ background: 'none', border: 'none', color: cmdVal ? T.primary : 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex' }}>{I.send}</button>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto' }}>
                         {['Check emails', 'Schedule meeting', 'Team status', 'Deploy status'].map(chip => (
                            <button key={chip} onClick={() => { setCmdVal(chip); setTimeout(sendCmd, 100); }} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 99, color: 'rgba(255,255,255,0.7)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }} className="chip-h">{chip}</button>
                         ))}
                      </div>
                   </div>

                   {/* WIDGET GRID */}
                   <div className="widget-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
                      {widgetOrder.map(id => WIDGETS[id] && React.cloneElement(WIDGETS[id](), { key: id }))}
                   </div>

                </div>
             </div>
          )}
        </main>
      </div>

      {/* ══ FLOATING CHAT BUBBLE ══ */}
      {(!chatOpen && activeNav === 'dashboard') && (
         <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100 }}>
            <button onClick={() => setChatOpen(true)} style={{ width: 52, height: 52, borderRadius: '50%', background: `linear-gradient(135deg, ${T.primary}, ${T.secondary})`, border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 32px ${T.glow}`, transition: 'transform 0.2s' }} className="fab-h">
               {I.bolt}
            </button>
            <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `1px solid ${T.primary}`, opacity: 0.5, animation: 'pulseRing 2s infinite' }} />
         </div>
      )}

      {/* ══ CHAT WINDOW ══ */}
      {chatOpen && (
         <div style={{ position: 'fixed', bottom: 24, right: 24, width: 380, height: 600, background: '#101014', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, zIndex: 200, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}>
            <div style={{ padding: '16px', background: `linear-gradient(135deg, ${T.primary}20, transparent)`, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${T.primary}, ${T.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{I.bolt}</div>
                  <span style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 14 }}>WorkPilot AI</span>
               </div>
               <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>{I.x}</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
               {msgs.map(m => (
                  <div key={m.id} style={{ alignSelf: m.r === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '10px 14px', borderRadius: 16, background: m.r === 'user' ? `linear-gradient(135deg, ${T.primary}, ${T.secondary})` : 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 13, lineHeight: 1.5 }}>
                     {m.text}
                  </div>
               ))}
               {typing && <div style={{ alignSelf: 'flex-start', padding: '10px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.05)' }}><span style={{ color: T.primary }}>● ● ●</span></div>}
               <div ref={chatEndRef} />
            </div>
            <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 8 }}>
               <input value={chatVal} onChange={e => setChatVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Ask something..." style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 12, padding: '10px 16px', color: '#fff', outline: 'none', fontSize: 13 }} />
               <PBtn T={T} onClick={sendChat} style={{ padding: '10px' }}>{I.send}</PBtn>
            </div>
         </div>
      )}

      {/* GLOBAL STYLES */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
        
        :root {
          --theme-primary: ${T.primary};
          --theme-primary-15: ${T.primary}26;
        }

        .card {
          background: #101014;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.07);
          padding: 24px;
          transition: all 0.22s ease;
        }
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.6);
        }
        .card:hover .drag-handle {
          opacity: 1 !important;
        }

        .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .btn-ghost:hover { background: rgba(255,255,255,0.1) !important; color: #fff !important; }
        .email-row:hover { background: rgba(255,255,255,0.04) !important; }
        
        .nav-item:hover { background: rgba(255,255,255,0.04) !important; color: #fff !important; }
        .nav-active {
          background: var(--theme-primary-15) !important;
          border-right: 2px solid var(--theme-primary) !important;
          color: #fff !important;
        }
        .nav-active span:first-child { color: var(--theme-primary) !important; }

        .chip-h:hover { background: var(--theme-primary-15) !important; border-color: var(--theme-primary) !important; color: var(--theme-primary) !important; }
        .fab-h:hover { transform: scale(1.08); }

        .truncate-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.2)} }
        @keyframes pulseRing { 0%{transform:scale(1);opacity:0.5} 100%{transform:scale(1.3);opacity:0} }
        @keyframes tickerMove { from{transform:translateX(0)} to{transform:translateX(-50%)} }

        @media (max-width: 1024px) {
           .widget-grid { grid-template-columns: repeat(6, 1fr) !important; }
           .card { grid-column: span 6 !important; grid-row: span 1 !important; }
        }

        @media (max-width: 768px) {
           .sidebar {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              width: 100% !important;
              height: 64px;
              flex-direction: row;
              z-index: 1000;
              border-right: none;
              border-top: 1px solid rgba(255,255,255,0.07);
           }
           .sidebar > div:first-child, .sidebar > div:nth-child(3), .sidebar-toggle {
              display: none !important;
           }
           .sidebar nav {
              flex-direction: row;
              justify-content: space-around;
              padding: 0;
           }
           .sidebar nav button {
              flex-direction: column;
              padding: 8px 0;
              gap: 4px;
           }
           .sidebar nav button span:nth-child(2) {
              display: none;
           }
           .mobile-menu-btn {
              display: block !important;
           }
           .widget-grid { grid-template-columns: 1fr !important; }
           .card { grid-column: span 1 !important; }
           .alerts-container { display: none !important; }
        }
      `}</style>
    </div>
  );
}
