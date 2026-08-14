import React, { useState, useEffect } from 'react';
import { SiGmail, SiGooglecalendar, SiGithub, SiZoom, SiNotion, SiJira, SiGoogledrive } from 'react-icons/si';
import { useToast } from './Toast';
import { SkeletonCard, SkeletonTable } from './Skeleton';
import { getEmails, markEmailRead, draftEmail, getCalendarEvents, createCalendarEvent, getTeamMembers, updateTeamMember, getDeployments, getDeploymentLogs, getDocuments, uploadDocument, askDocumentAI, getAnalytics, getIntegrations, getIntegrationsCatalogPublic, authorizeIntegration, disconnectIntegration, syncIntegration, requestIntegration, updateProfile } from '../api';
import { useIntegrationAgents } from '../hooks/useIntegrationAgents';

/* ─── Brand icon map ─── */
const SlackIcon = () => <svg width="20" height="20" viewBox="0 0 24 24"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.04a2.528 2.528 0 0 1-2.522 2.52H8.823a2.528 2.528 0 0 1-2.52-2.52v-5.04z" fill="#36C5F0"/><path d="M8.823 5.043a2.528 2.528 0 0 1-2.52-2.52A2.528 2.528 0 0 1 8.823 0a2.528 2.528 0 0 1 2.522 2.522v2.52H8.823zm0 1.262a2.528 2.528 0 0 1 2.522 2.52v5.043a2.528 2.528 0 0 1-2.522 2.52H3.78a2.528 2.528 0 0 1-2.522-2.52V8.825a2.528 2.528 0 0 1 2.522-2.52h5.043z" fill="#2EB67D"/><path d="M18.958 8.825a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52 2.528 2.528 0 0 1-2.522 2.52h-2.52v-2.52zm-1.261 0a2.528 2.528 0 0 1-2.52 2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52v-5.04a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.04z" fill="#ECB22E"/><path d="M15.177 18.957a2.528 2.528 0 0 1 2.52 2.522 2.528 2.528 0 0 1-2.52 2.52 2.528 2.528 0 0 1-2.522-2.52v-2.522h2.522zm0-1.261a2.528 2.528 0 0 1-2.522-2.52v-5.043a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.043a2.528 2.528 0 0 1-2.522 2.52h-5.043z" fill="#E01E5A"/></svg>;
const MsTeamsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/></svg>;

const BRAND_ICONS = {
  'Gmail':           <SiGmail size={22} color="#EA4335" />,
  'Google Calendar': <SiGooglecalendar size={22} color="#4285F4" />,
  'Google Drive':    <SiGoogledrive size={22} color="#4285F4" />,
  'GitHub':          <SiGithub size={22} color="#ffffff" />,
  'Slack':           <SlackIcon />,
  'Zoom':            <SiZoom size={22} color="#2D8CFF" />,
  'Microsoft Teams': <MsTeamsIcon />,
  'Notion':          <SiNotion size={22} color="#ffffff" />,
  'Jira':            <SiJira size={22} color="#0052CC" />,
};

/* ─── Shared mini helpers ─── */
const C = {
  blue: '#3b82f6', violet: '#7c3aed', cyan: '#06b6d4',
  green: '#10b981', amber: '#f59e0b', red: '#ef4444',
  indigo: '#6366f1', surface: '#0c0c0f',
  text: '#fff', sub: 'rgba(255,255,255,0.55)', muted: 'rgba(255,255,255,0.28)',
  border: 'rgba(255,255,255,0.07)',
};

export function PageShell({ title, subtitle, icon, accent = C.blue, children, actions }) {
  return (
    <div style={{ padding: '0 28px 80px', animation: 'pageEnter 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
      <style>{`
        @keyframes pageEnter { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .card { transition: all 0.2s cubic-bezier(0.16,1,0.3,1); }
        .card:hover { transform: translateY(-2px); box-shadow: 0 16px 48px rgba(0,0,0,0.5)!important; }
        .pg-row:hover { background: rgba(255,255,255,0.035)!important; }
        .pg-btn { transition: all 0.2s cubic-bezier(0.16,1,0.3,1); }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px var(--glow,rgba(59,130,246,0.4))!important; }
        .btn-ghost:hover { background: rgba(255,255,255,0.08)!important; }
        .pg-tab-active { border-bottom: 2px solid currentColor; }
        .avatar { transition: all 0.2s; }
        .avatar:hover { box-shadow: 0 0 0 2px rgba(255,255,255,0.2); }
        @keyframes barGrow { from { width: 0; } }
        @keyframes barGrowVertical { from { height: 0; } }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12, position: 'sticky', top: 0, zIndex: 10, background: '#000', padding: '28px 0 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${accent}25,${accent}12)`, border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{icon}</div>
          <div>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 22, margin: 0, color: C.text }}>{title}</h1>
            {subtitle && <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{subtitle}</p>}
          </div>
        </div>
        {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function Card({ children, style = {}, accent, className = "" }) {
  return (
    <div className={`card ${className}`} style={{ background: '#101014', borderRadius: 20, border: `1px solid ${C.border}`, padding: '20px 22px', position: 'relative', overflow: 'hidden', ...style }}>
      {accent && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${accent}50,transparent)` }} />}
      {children}
    </div>
  );
}

export function Btn({ children, onClick, color = C.blue, ghost = false, size = 'md', style = {} }) {
  return (
    <button onClick={onClick} style={{
      '--glow': `${color}60`,
      height: size === 'md' ? 38 : size === 'sm' ? 30 : 44,
      padding: size === 'md' ? '0 18px' : size === 'sm' ? '0 12px' : '0 24px',
      borderRadius: 9, cursor: 'pointer', fontFamily: "'Inter',sans-serif",
      fontSize: size === 'sm' ? 12 : 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
      background: ghost ? `${color}15` : `linear-gradient(135deg,${color},${color}cc)`,
      border: ghost ? `1px solid ${color}35` : 'none',
      color: ghost ? color : '#fff',
      boxShadow: ghost ? 'none' : `0 3px 14px ${color}30`,
      ...style,
    }} className={`pg-btn ${ghost ? 'btn-ghost' : 'btn-primary'}`}>{children}</button>
  );
}

export function Tag({ label, color }) {
  return <span style={{ padding: '3px 9px', borderRadius: 99, background: `${color}15`, border: `1px solid ${color}28`, color, fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap' }}>{label}</span>;
}

export function Avatar({ name, size = 34 }) {
  const letters = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hue = (name.charCodeAt(0) * 47) % 360;
  return <div className="avatar" style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: '#fff', fontFamily: "'Sora',sans-serif", background: `linear-gradient(135deg,hsl(${hue},65%,42%),hsl(${(hue+60)%360},65%,52%))` }}>{letters}</div>;
}

/* ════════════════════════════════════════
   EMAIL PAGE
════════════════════════════════════════ */
const EMAILS = [
  { id: 1, from: 'Robert Chen', role: 'CFO', subject: 'Q3 Budget Approval — Action Required', preview: 'Please review the attached Q3 budget report and approve...', time: '8m ago', priority: 'urgent', read: false },
  { id: 2, from: 'Acme Corp', role: 'Client', subject: 'Re: Service complaint — ticket #4821', preview: 'We are still experiencing the issue with the onboarding flow...', time: '32m ago', priority: 'urgent', read: false },
  { id: 3, from: 'HR Team', role: 'Internal', subject: 'Team offsite planning for August', preview: 'Hi everyone, we are planning the August offsite...', time: '1h ago', priority: 'normal', read: true },
  { id: 4, from: 'Stripe', role: 'Billing', subject: 'Your invoice is ready — $2,490', preview: 'Your monthly invoice for WorkPilot is ready to download...', time: '3h ago', priority: 'normal', read: true },
  { id: 5, from: 'GitHub', role: 'Dev', subject: 'PR #142 needs your review', preview: '[workpilot-backend] Feature/auth-tokens — 3 files changed...', time: '5h ago', priority: 'normal', read: true },
  { id: 6, from: 'Priya Sharma', role: 'Team', subject: 'Weekly report — missing from Mike', preview: "Hey, I noticed Mike hasn't submitted his weekly report...", time: 'Yesterday', priority: 'low', read: true },
];

export function EmailPage({ T }) {
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('inbox');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draftText, setDraftText] = useState('');
  const { showToast } = useToast();
  
  useEffect(() => {
    getEmails().then(r => setData(r.data)).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const tabs = ['inbox', 'sent', 'drafts', 'archived'];
  const emailsList = data || EMAILS;

  return (
    <PageShell title="Email" subtitle="Powered by WorkPilot AI — connected to Gmail" icon="📧" accent={T.primary}
      actions={<><Btn color={T.primary} ghost>⚡ AI Triage</Btn><Btn color={T.primary}>✉ Compose</Btn></>}>
      <div style={{ display: 'flex', gap: 14, height: 'calc(100vh - 220px)', minHeight: 400 }}>
        {/* List panel */}
        <Card style={{ width: 380, flexShrink: 0, padding: 0, display: 'flex', flexDirection: 'column' }} accent={T.primary}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, padding: '0 4px' }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '11px 4px', background: 'none', border: 'none', color: tab === t ? T.primary : C.muted, fontSize: 12, fontWeight: tab === t ? 700 : 400, cursor: 'pointer', textTransform: 'capitalize', borderBottom: tab === t ? `2px solid ${T.primary}` : '2px solid transparent', fontFamily: "'Inter',sans-serif", transition: 'all 0.15s' }}>{t}</button>
            ))}
          </div>
          {/* Stats bar */}
          <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.border}` }}>
            {[['3', 'Urgent', C.red], ['7', 'Unread', T.primary], ['12', 'Total', C.muted]].map(([n, l, c]) => (
              <div key={l} style={{ flex: 1, padding: '10px 14px', textAlign: 'center', borderRight: `1px solid ${C.border}` }}>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 18, color: c }}>{n}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{l}</div>
              </div>
            ))}
          </div>
          {/* Email list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? <SkeletonTable rows={5} cols={1} /> : error ? <div style={{padding: 20, color: C.red}}>{error}</div> : emailsList.map(em => (
              <div key={em.id} onClick={() => setSelected(em)} style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', background: selected?.id === em.id ? `${T.primary}12` : em.read ? 'transparent' : 'rgba(255,255,255,0.02)', borderLeft: selected?.id === em.id ? `3px solid ${T.primary}` : '3px solid transparent', transition: 'all 0.15s' }} className="pg-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: em.priority === 'urgent' ? C.red : em.read ? 'transparent' : T.primary, flexShrink: 0, boxShadow: em.priority === 'urgent' ? `0 0 5px ${C.red}` : 'none' }} />
                  <Avatar name={em.from} size={20} />
                  <span style={{ fontSize: 13, fontWeight: em.read ? 400 : 700, color: C.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{em.from}</span>
                  <Tag label={em.role} color={C.muted} style={{ fontSize: 10, padding: '1px 6px', fontFamily: "'JetBrains Mono',monospace" }} />
                  <span style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>{em.time}</span>
                </div>
                <div style={{ fontSize: 12, color: C.sub, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: em.read ? 400 : 600 }}>{em.subject}</div>
                <div style={{ fontSize: 11, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{em.preview}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Detail panel */}
        <Card style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column' }} accent={selected ? T.primary : undefined}>
          {selected ? (
            <>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <h2 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 17, margin: 0, color: C.text }}>{selected.subject}</h2>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                      <Avatar name={selected.from} size={28} />
                      <span style={{ fontSize: 13, color: C.sub }}><strong style={{ color: C.text, fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 16 }}>{selected.from}</strong> <span style={{color: C.muted}}>({selected.from.toLowerCase().replace(' ','')}@example.com)</span> · {selected.time}</span>
                      <Tag label={selected.role} color={C.muted} />
                      {selected.priority === 'urgent' && <Tag label="⚠ Urgent" color={C.red} />}
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.muted, cursor: 'pointer', borderRadius: 7, padding: '5px 9px', fontSize: 12 }}>✕</button>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn color={T.primary} style={{ fontSize: 12, padding: '7px 14px' }} onClick={async () => {
                    const res = await draftEmail({to: selected.from, subject: selected.subject});
                    setDraftText(res.data?.draft || 'Draft generated by AI...');
                  }}>⚡ AI Draft Reply</Btn>
                  <Btn color={T.primary} ghost style={{ fontSize: 12, padding: '7px 14px' }}>↩ Reply</Btn>
                  <Btn color={C.green} ghost style={{ fontSize: 12, padding: '7px 14px' }}>→ Forward</Btn>
                  <Btn color={C.red} ghost style={{ fontSize: 12, padding: '7px 14px' }}>🗑 Archive</Btn>
                </div>
              </div>
              <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                <div style={{ background: 'rgba(255,255,255,0.025)', borderRadius: 12, border: `1px solid ${C.border}`, padding: '20px', fontSize: 14, color: C.sub, lineHeight: 1.8 }}>
                  <p>Hi there,</p>
                  <p>{selected.preview}</p>
                  <p>Please let me know if you need any additional information. Looking forward to your response.</p>
                  <p>Best regards,<br /><strong style={{ color: C.text }}>{selected.from}</strong></p>
                </div>
                {draftText && (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ fontSize: 12, color: T.primary, marginBottom: 8, fontWeight: 700 }}>AI Drafted Reply:</div>
                    <textarea value={draftText} onChange={e => setDraftText(e.target.value)} style={{ width: '100%', minHeight: 120, padding: 12, background: '#18181f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, fontFamily: "'Inter',sans-serif", outline: 'none' }} />
                    <Btn color={T.primary} style={{ marginTop: 8 }} onClick={() => { showToast('Email sent!', 'success'); setDraftText(''); }}>Send Email</Btn>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 40 }}>📬</div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, color: C.sub }}>Select an email to read</div>
              <div style={{ fontSize: 12, color: C.muted }}>Or let AI triage your inbox automatically</div>
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}

/* ════════════════════════════════════════
   CALENDAR PAGE
════════════════════════════════════════ */
const EVENTS = [
  { id: 1, time: '09:00', end: '09:15', title: 'Daily Standup', people: 5, color: C.green, tag: 'Meeting' },
  { id: 2, time: '10:00', end: '11:00', title: 'Q3 Planning Session', people: 8, color: C.blue, tag: 'Important' },
  { id: 3, time: '14:00', end: '15:00', title: 'Client Call — Acme Corp', people: 3, color: C.indigo, tag: 'Client' },
  { id: 4, time: '16:00', end: '18:00', title: 'Deep Work Block 🔒', people: 1, color: C.violet, tag: 'Protected' },
];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

export function CalendarPage({ T }) {
  const [view, setView] = useState('week');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    getCalendarEvents().then(r => setData(r.data)).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const today = new Date();
  const monthStr = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const eventsList = data || EVENTS;

  return (
    <PageShell title="Calendar" subtitle="Your schedule, powered by WorkPilot AI" icon="📅" accent={T.accent}
      actions={<>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: 9, overflow: 'hidden' }}>
          {['Day','Week','Month'].map(v => <button key={v} onClick={() => setView(v.toLowerCase())} style={{ padding: '7px 14px', background: view === v.toLowerCase() ? `${T.primary}20` : 'none', border: 'none', color: view === v.toLowerCase() ? T.primary : C.muted, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>{v}</button>)}
        </div>
        <Btn color={T.primary} onClick={() => setShowEventForm(!showEventForm)}>+ New Event</Btn>
      </>}>

      {showEventForm && (
        <Card style={{ marginBottom: 14, background: '#18181f' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Event Title</div>
              <input type="text" placeholder="e.g. Team Sync" style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 6, color: '#fff', fontSize: 13 }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Date</div>
              <input type="date" style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 6, color: '#fff', fontSize: 13 }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Time</div>
              <input type="time" style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 6, color: '#fff', fontSize: 13 }} />
            </div>
            <Btn color={T.primary} onClick={() => { setShowEventForm(false); createCalendarEvent({title: 'New Event'}).then(() => showToast('Event created', 'success')); }}>Create Event</Btn>
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', gap: 14 }}>
        {/* Week grid */}
        <Card style={{ flex: 1, padding: 0, overflow: 'hidden' }} accent={T.accent}>
          {/* Header */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: '#09090d' }}>
            <div style={{ width: 56, flexShrink: 0 }} />
            {DAYS.map((d, i) => {
              const isToday = i === (today.getDay() + 6) % 7;
              return (
                <div key={d} style={{ flex: 1, padding: '10px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>{d}</div>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: isToday ? T.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px auto 0', fontFamily: "'Sora',sans-serif", fontWeight: isToday ? 700 : 400, fontSize: 13, color: isToday ? '#fff' : C.sub }}>
                    {today.getDate() - ((today.getDay() + 6) % 7) + i}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Time grid */}
          <div style={{ overflowY: 'auto', maxHeight: 480 }}>
            {HOURS.map(hr => (
              <div key={hr} style={{ display: 'flex', height: 52, borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                <div style={{ width: 56, flexShrink: 0, paddingTop: 4, paddingRight: 8, textAlign: 'right', fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>{hr}</div>
                {DAYS.map((d, di) => {
                  const event = eventsList.find(e => e.time === hr && di === 3); // Thursday
                  return (
                    <div key={d} style={{ flex: 1, borderLeft: `1px solid rgba(255,255,255,0.03)`, position: 'relative' }}>
                      {event && (
                        <div style={{ position: 'absolute', left: 2, right: 2, top: 2, padding: '6px 8px', borderRadius: 8, background: `${event.color}20`, borderLeft: `3px solid ${event.color}`, cursor: 'pointer' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: event.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</div>
                          <div style={{ fontSize: 9, color: `${event.color}90`, marginTop: 2 }}>{event.time} - {event.end}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>

        {/* Side panel */}
        <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card accent={T.accent}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Today's Events</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {loading ? <SkeletonCard /> : error ? <div style={{color: C.red}}>{error}</div> : eventsList.map(ev => (
                <Card key={ev.id} style={{ padding: '10px 12px', background: `${ev.color}15`, border: `1px solid ${ev.color}20`, borderRadius: 12, boxShadow: `0 4px 12px rgba(0,0,0,0.2)` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: ev.color }}>{ev.title}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <div style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>{ev.time}</div>
                    <div style={{ fontSize: 10, color: C.muted, background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: 4 }}>👥 {ev.people}</div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
          <Card accent={T.primary}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 10 }}>⚡ AI Suggestions</div>
            {['Schedule CFO call before 5pm', 'Block focus time Tuesday AM', 'Move standup to 9:30am'].map(s => (
              <div key={s} style={{ padding: '8px 10px', marginBottom: 6, background: `${T.primary}08`, border: `1px solid ${T.primary}18`, borderRadius: 8, fontSize: 11, color: C.sub, cursor: 'pointer' }} className="pg-row">{s} →</div>
            ))}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

/* ════════════════════════════════════════
   TEAM PAGE
════════════════════════════════════════ */
const MEMBERS = [
  { id: 1, name: 'Sarah Chen', role: 'UI/UX Designer', task: 'Dashboard mockups', progress: 100, status: 'done', online: true },
  { id: 2, name: 'John Smith', role: 'Backend Engineer', task: 'API integration v2', progress: 65, status: 'on-track', online: true },
  { id: 3, name: 'Mike Chen', role: 'QA Engineer', task: 'Backend testing', progress: 30, status: 'delayed', online: false },
  { id: 4, name: 'Priya Sharma', role: 'Product Manager', task: 'No update submitted', progress: 0, status: 'missing', online: false },
  { id: 5, name: 'Alex Kim', role: 'DevOps', task: 'Staging deployment', progress: 80, status: 'on-track', online: true },
];
const statusColor = { done: C.green, 'on-track': '#3b82f6', delayed: C.amber, missing: C.red };
const statusLabel = { done: '✓ Done', 'on-track': '● On track', delayed: '⚠ Delayed', missing: '✕ Missing' };

export function TeamPage({ T }) {
  const [filter, setFilter] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    getTeamMembers().then(r => setData(r.data)).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const membersList = data || MEMBERS;
  const filtered = filter === 'all' ? membersList : membersList.filter(m => m.status === filter);

  return (
    <PageShell title="Team" subtitle="Real-time team status and task tracking" icon="👥" accent={T.primary}
      actions={<><Btn color={T.primary} ghost>⚡ Run Standup</Btn><Btn color={T.primary}>+ Add Member</Btn></>}>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[['5', 'Total Members', T.primary], ['3', 'Online Now', C.green], ['1', 'Tasks Delayed', C.amber], ['1', 'No Update', C.red]].map(([n, l, c]) => (
          <Card key={l} accent={c}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 26, color: c }}>{n}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{l}</div>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['all', 'done', 'on-track', 'delayed', 'missing'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 13px', borderRadius: 99, background: filter === f ? `${T.primary}18` : 'rgba(255,255,255,0.04)', border: `1px solid ${filter === f ? T.primary + '35' : C.border}`, color: filter === f ? T.primary : C.muted, fontSize: 12, fontWeight: filter === f ? 600 : 400, cursor: 'pointer', textTransform: 'capitalize', fontFamily: "'Inter',sans-serif", transition: 'all 0.15s' }}>{f}</button>
        ))}
      </div>

      {/* Team table */}
      <Card accent={T.primary} style={{ padding: 0 }}>
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', gap: 12 }}>
          {['Member', 'Task', 'Progress', 'Status', 'Actions'].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: C.muted, fontFamily: "'Inter',sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>
        {loading ? <SkeletonTable rows={4} cols={5} /> : error ? <div style={{padding: 20, color: C.red}}>{error}</div> : filtered.map(m => (
          <div key={m.id} style={{ padding: '14px 20px', borderBottom: `1px solid rgba(255,255,255,0.04)`, display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', gap: 12, alignItems: 'center', transition: 'all 0.15s' }} className="pg-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <Avatar name={m.name} size={34} />
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: m.online ? C.green : 'rgba(255,255,255,0.2)', border: '2px solid #0c0c0f' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{m.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{m.role}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: C.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.task}</div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: C.muted }}>{m.progress}%</span>
              </div>
              <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${m.progress}%`, height: '100%', background: statusColor[m.status], borderRadius: 99, boxShadow: `0 0 6px ${statusColor[m.status]}60` }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor[m.status], boxShadow: `0 0 5px ${statusColor[m.status]}` }} />
              <span style={{ fontSize: 12, color: statusColor[m.status], fontWeight: 600 }}>{statusLabel[m.status].replace(/^./, '').trim()}</span>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              {m.status === 'delayed' && <Btn ghost color={C.amber} style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => updateTeamMember(m.id, {status: 'reminded'}).then(()=>showToast('Action sent', 'success'))}>Follow up</Btn>}
              {m.status === 'missing' && <Btn ghost color={C.red} style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => updateTeamMember(m.id, {status: 'reminded'}).then(()=>showToast('Action sent', 'success'))}>Remind</Btn>}
              {(m.status === 'done' || m.status === 'on-track') && <Btn ghost color={T.primary} style={{ padding: '4px 10px', fontSize: 11 }}>View</Btn>}
            </div>
          </div>
        ))}
      </Card>
    </PageShell>
  );
}

/* ════════════════════════════════════════
   DEPLOYMENTS PAGE
════════════════════════════════════════ */
const PIPELINES = [
  { id: 1, name: 'Production', version: 'v2.4.1', status: 'live', uptime: '99.9%', latency: '142ms', deployed: '2h ago', risk: 'low' },
  { id: 2, name: 'Staging', version: 'v2.4.2', status: 'running', progress: 67, uptime: '—', latency: '—', deployed: 'Running', risk: 'medium' },
  { id: 3, name: 'Dev', version: 'v2.5.0-beta', status: 'failed', uptime: '—', latency: '—', deployed: '1h ago', risk: 'high' },
];
const DEPLOY_LOGS = [
  { t: '14:22:01', msg: 'Build started — v2.4.2', level: 'info' },
  { t: '14:23:10', msg: '✓ Dependency checks passed (247 packages)', level: 'success' },
  { t: '14:24:33', msg: '✓ Unit tests passed (143/143)', level: 'success' },
  { t: '14:25:11', msg: '⚠ Warning: Auth module dependency conflict detected', level: 'warn' },
  { t: '14:26:04', msg: 'Deploying to staging cluster...', level: 'info' },
  { t: '14:27:30', msg: 'Health check in progress...', level: 'info' },
];
const statusCfg = { live: { c: C.green, l: '● Live' }, running: { c: C.blue, l: '⟳ Running' }, failed: { c: C.red, l: '✕ Failed' } };
const riskCfg = { low: C.green, medium: C.amber, high: C.red };

export function DeploymentsPage({ T }) {
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState(null);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    getDeployments().then(r => {
      setData(r.data);
      if (r.data && r.data.length > 0) setSelectedPipeline(r.data[0]);
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const pId = selectedPipeline?.id || (data ? data[0]?.id : PIPELINES[0].id);
    if (pId) {
      setLogsLoading(true);
      getDeploymentLogs(pId).then(r => setLogs(r.data)).finally(() => setLogsLoading(false));
    }
  }, [selectedPipeline, data]);

  const pipelinesList = data || PIPELINES;
  const currentPipeline = selectedPipeline || pipelinesList[0];

  return (
    <PageShell title="Deployments" subtitle="CI/CD pipeline monitor" icon="🚀" accent={C.green}
      actions={<><Btn color={C.green} ghost>↻ Refresh</Btn><Btn color={T.primary}>+ New Deploy</Btn></>}>

      {/* HORIZONTAL TABS */}
      <div style={{ display: 'flex', gap: 20, borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
        {pipelinesList.map(p => {
          const active = currentPipeline?.id === p.id;
          return (
            <div key={p.id} onClick={() => setSelectedPipeline(p)} style={{ padding: '0 4px 12px', cursor: 'pointer', borderBottom: active ? `2px solid ${T.primary}` : '2px solid transparent', color: active ? C.text : C.muted, fontWeight: active ? 700 : 400, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8 }}>
              {p.name}
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusCfg[p.status].c }} />
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {currentPipeline && (
          <>
          {/* Stage indicators */}
          <Card accent={statusCfg[currentPipeline.status].c}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 16 }}>{currentPipeline.name} — {currentPipeline.version}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>Last updated: {currentPipeline.deployed}</div>
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                <Btn ghost color={C.red} style={{ padding: '7px 12px', fontSize: 12 }}>🔴 Rollback</Btn>
                <Btn ghost color={T.primary} style={{ padding: '7px 12px', fontSize: 12 }}>▶ Redeploy</Btn>
              </div>
            </div>
            
            {/* Horizontal Arrow Pipeline */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0', overflowX: 'auto', paddingBottom: 8 }}>
              {['Build', 'Test', 'Staging', 'Production'].map((stage, i) => {
                const isActive = currentPipeline.status === 'running' && i === 1; // dummy logic
                const isDone = i < 1 || currentPipeline.status === 'live';
                return (
                  <React.Fragment key={stage}>
                    <div style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: isDone ? `${C.green}20` : isActive ? `${T.primary}20` : 'rgba(255,255,255,0.05)', color: isDone ? C.green : isActive ? T.primary : C.muted, border: `1px solid ${isDone ? C.green+'40' : isActive ? T.primary+'40' : 'transparent'}` }}>
                      {stage}
                    </div>
                    {i < 3 && <div style={{ color: C.muted, fontSize: 16 }}>→</div>}
                  </React.Fragment>
                );
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {[['Uptime', currentPipeline.uptime, C.green], ['Latency', currentPipeline.latency, C.blue], ['Risk', currentPipeline.risk?.toUpperCase(), riskCfg[currentPipeline.risk]], ['Status', statusCfg[currentPipeline.status].l, statusCfg[currentPipeline.status].c]].map(([k, v, c]) => (
                <div key={k} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: `1px solid rgba(255,255,255,0.05)` }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: c }}>{v || '—'}</div>
                </div>
              ))}
            </div>
          </Card>
          {/* Live logs */}
          <Card accent={C.green} style={{ flex: 1, minHeight: 300 }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              Build Logs
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, animation: 'pulse 1.5s infinite' }} />
            </div>
            <div style={{ background: '#050507', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', padding: '16px', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, lineHeight: 2, height: 280, overflowY: 'auto' }}>
              {logsLoading ? <div style={{color: C.muted}}>Loading logs...</div> : (logs || DEPLOY_LOGS).map((l, i) => (
                <div key={i} style={{ color: l.level === 'success' ? '#22c55e' : l.level === 'warn' ? '#eab308' : l.level === 'error' ? '#ef4444' : '#9ca3af' }}>
                  <span style={{ color: '#4b5563', marginRight: 12 }}>{l.t}</span>{l.msg}
                </div>
              ))}
              {!logsLoading && <div style={{ color: C.blue, animation: 'blink 1s infinite' }}>▌</div>}
            </div>
          </Card>
          </>
        )}
      </div>
    </PageShell>
  );
}

/* ════════════════════════════════════════
   DOCUMENTS PAGE
════════════════════════════════════════ */
const DOCS_LIST = [
  { id: 1, name: 'Q3_Contract_Acme.pdf', type: 'PDF', size: '2.4 MB', modified: '2h ago', status: '3 questions', warn: false },
  { id: 2, name: 'Team_Policy_v2.docx', type: 'DOCX', size: '840 KB', modified: '1d ago', status: '2 conflicts', warn: true },
  { id: 3, name: 'Budget_2026.xlsx', type: 'XLSX', size: '1.1 MB', modified: 'Just now', status: 'Analyzing...', warn: false },
  { id: 4, name: 'Product_Roadmap_Q4.pdf', type: 'PDF', size: '3.8 MB', modified: '3d ago', status: 'Reviewed', warn: false },
  { id: 5, name: 'Onboarding_SOP.docx', type: 'DOCX', size: '560 KB', modified: '1w ago', status: 'Outdated', warn: true },
];
const typeColor = { PDF: C.red, DOCX: C.blue, XLSX: C.green };

export function DocumentsPage({ T }) {
  const [drag, setDrag] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    getDocuments().then(r => setData(r.data)).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const docsList = data || DOCS_LIST;

  return (
    <PageShell title="Documents" subtitle="AI-powered document analysis and Q&A" icon="📄" accent={C.amber}
      actions={<><Btn ghost color={T.primary}>🔍 Search docs</Btn><Btn color={T.primary} onClick={() => uploadDocument({file: 'new.pdf'}).then(() => showToast('Document uploaded', 'success'))}>+ Upload</Btn></>}>

      {/* Drop zone */}
      <div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); uploadDocument({file: 'drop.pdf'}).then(() => showToast('Document uploaded', 'success')); }}
        style={{ border: `2px dashed ${drag ? T.primary : 'rgba(255,255,255,0.12)'}`, borderRadius: 14, padding: '30px', textAlign: 'center', marginBottom: 20, background: drag ? `${T.primary}06` : 'transparent', transition: 'all 0.2s', cursor: 'pointer' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📤</div>
        <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: drag ? T.primary : C.sub }}>Drop files here or click to upload</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>PDF, DOCX, XLSX supported · AI analyzes automatically</div>
      </div>

      {/* Docs table */}
      <Card accent={C.amber} style={{ padding: 0 }}>
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr', gap: 12 }}>
          {['Filename', 'Type', 'Size', 'Modified', 'AI Status'].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: C.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.08em' }}>{h}</div>
          ))}
        </div>
        {loading ? <SkeletonTable rows={5} cols={5} /> : error ? <div style={{padding: 20, color: C.red}}>{error}</div> : docsList.map(doc => (
          <div key={doc.id} className="pg-row" style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr', gap: 12, alignItems: 'center', transition: 'background 0.15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${typeColor[doc.type]}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                {doc.type === 'PDF' ? '📕' : doc.type === 'DOCX' ? '📘' : '📗'}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: "'JetBrains Mono',monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</span>
            </div>
            <Tag label={doc.type} color={typeColor[doc.type]} />
            <span style={{ fontSize: 12, color: C.muted }}>{doc.size}</span>
            <span style={{ fontSize: 12, color: C.muted }}>{doc.modified}</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: doc.warn ? C.amber : C.green }}>{doc.status}</span>
              <Btn ghost color={T.primary} style={{ padding: '3px 9px', fontSize: 11 }} onClick={() => askDocumentAI(doc.id, 'summary').then(r => showToast(r.data?.answer || 'Analysis complete', 'info'))}>Ask AI</Btn>
            </div>
          </div>
        ))}
      </Card>
    </PageShell>
  );
}

/* ════════════════════════════════════════
   ANALYTICS PAGE
════════════════════════════════════════ */
export function AnalyticsPage({ T }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAnalytics().then(r => setData(r.data)).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const metrics = data?.metrics || [
    { label: 'Focus Hours', value: '26.5h', delta: '+12%', color: T.primary },
    { label: 'Emails Handled by AI', value: '247', delta: '+34%', color: C.green },
    { label: 'Tasks Completed', value: '48', delta: '-3%', color: C.amber },
    { label: 'AI Time Saved', value: '8.2h', delta: '+21%', color: T.secondary },
  ];

  const chart = data?.chart || { weeks: ['W1', 'W2', 'W3', 'W4'], data: [45, 62, 38, 77] };
  const breakdown = data?.breakdown || [['Deep work', 38, T.primary], ['Meetings', 28, C.indigo], ['Email', 18, C.amber], ['Admin', 16, C.muted]];

  const maxBar = Math.max(...chart.data);

  return (
    <PageShell title="Analytics" subtitle="Your productivity and AI performance metrics" icon="📊" accent={T.secondary}
      actions={<>
        <select style={{ padding: '7px 12px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: 8, color: C.sub, fontSize: 12, cursor: 'pointer', outline: 'none', fontFamily: "'Inter',sans-serif" }}>
          <option>This Month</option><option>Last 7 days</option><option>This Quarter</option>
        </select>
        <Btn ghost color={T.primary}>Export CSV</Btn>
      </>}>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {loading ? <SkeletonCard /> : error ? <div style={{color: C.red}}>{error}</div> : metrics.map(k => (
          <Card key={k.label} accent={k.color} style={{ borderTop: `2px solid ${k.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: C.muted }}>{k.label}</div>
              <Tag label={k.delta} color={k.delta.startsWith('+') ? C.green : C.red} />
            </div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 26, color: C.text }}>{k.value}</div>
            <div style={{ marginTop: 12, height: 24, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
              {[1,3,2,5,4,7,6,8,5,9].map((v, i) => <div key={i} style={{ flex: 1, background: k.color, height: `${v*10}%`, opacity: 0.3 + (i/20), borderRadius: 2 }} />)}
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        {/* Bar chart */}
        <Card accent={T.secondary}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 20 }}>Weekly Focus Hours</div>
          {loading ? <SkeletonCard /> : error ? <div style={{color:C.red}}>{error}</div> : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 160 }}>
            {chart.weeks.map((w, i) => (
              <div key={w} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 11, color: T.secondary, fontWeight: 700 }}>{chart.data[i]}h</div>
                <div style={{ width: '100%', height: `${(chart.data[i] / maxBar) * 130}px`, background: `linear-gradient(180deg,${T.secondary},${T.primary})`, borderRadius: '6px 6px 2px 2px', boxShadow: `0 0 12px ${T.secondary}30`, animation: 'barGrowVertical 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
                <div style={{ fontSize: 11, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>{w}</div>
              </div>
            ))}
          </div>
          )}
        </Card>

        {/* Activity breakdown */}
        <Card accent={T.primary}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Time Breakdown</div>
          {loading ? <SkeletonCard /> : error ? <div style={{color: C.red}}>{error}</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {breakdown.map(([l, pct, c]) => (
              <div key={l}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: C.sub }}>{l}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: c, fontFamily: "'JetBrains Mono',monospace" }}>{pct}%</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: c, borderRadius: 99, boxShadow: `0 0 5px ${c}50` }} />
                </div>
              </div>
            ))}
          </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}

/* ════════════════════════════════════════
   INTEGRATIONS PAGE
════════════════════════════════════════ */
export function IntegrationsPage({ T }) {
  const { showToast } = useToast();
  const {
    integrations,
    health,
    syncingAll,
    syncingPlatform,
    lastSyncResults,
    loading,
    error,
    connectedCount,
    totalCount,
    syncAll,
    syncPlatform,
    getHealthForPlatform,
    reload,
  } = useIntegrationAgents();

  const [busy, setBusy] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [showSyncResults, setShowSyncResults] = useState(false);
  const [justConnected, setJustConnected] = useState(null); // platform that just connected

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const integration = params.get('integrations');
    const status = params.get('status');
    const message = params.get('message');
    if (integration) {
      if (status === 'connected') {
        setStatusMessage(`Connected ${integration}`);
        showToast(`Successfully connected ${integration}`, 'success');
        setJustConnected(integration);
        setTimeout(() => setJustConnected(null), 2500);
      }
      else if (status === 'error') { const d = message || 'Connection failed'; setStatusMessage(d); showToast(d, 'error'); }
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleConnect = async (platform, displayName, available) => {
    if (!available) { showToast(`${displayName} is coming soon`, 'info'); return; }
    setBusy(platform);
    try {
      const res = await authorizeIntegration(platform);
      const url = res.data?.authorizeUrl || res.data?.url;
      if (!url) throw new Error('No OAuth URL returned');
      window.location.href = url;
    } catch (e) {
      showToast(e.message || `Could not connect ${displayName}`, 'error');
      setBusy(null);
    }
  };

  const handleDisconnect = async (platform, displayName) => {
    setBusy(platform);
    try {
      await disconnectIntegration(platform);
      showToast(`Disconnected ${displayName}`, 'success');
      reload();
    } catch (e) {
      showToast(e.message || `Could not disconnect ${displayName}`, 'error');
    } finally { setBusy(null); }
  };

  const toggle = (ig) => {
    if (busy === ig.platform || syncingPlatform === ig.platform) return;
    ig.connected ? handleDisconnect(ig.platform, ig.displayName) : handleConnect(ig.platform, ig.displayName, ig.available);
  };

  const handleSync = async (platform, displayName) => {
    try { await syncPlatform(platform); showToast(`Synced ${displayName}`, 'success'); }
    catch (e) { showToast(e.message || `Could not sync ${displayName}`, 'error'); }
  };

  const handleSyncAll = async () => {
    try {
      const result = await syncAll();
      showToast(`Synced ${result?.success_count || 0} integrations`, 'success');
      setShowSyncResults(true);
      setTimeout(() => setShowSyncResults(false), 5000);
    } catch (e) { showToast(e.message || 'Sync all failed', 'error'); }
  };

  const handleRequest = () => {
    const name = window.prompt('Which integration would you like us to add?');
    if (!name?.trim()) return;
    requestIntegration({ name: name.trim() })
      .then(() => showToast('Request submitted — thank you!', 'success'))
      .catch(e => showToast(e.message || 'Could not submit request', 'error'));
  };

  const HealthDot = ({ platform }) => {
    const h = getHealthForPlatform(platform);
    const color = { healthy: C.green, degraded: C.amber, down: C.red }[h.status] || C.muted;
    const label = { healthy: '●', degraded: '▲', down: '✕' }[h.status] || '○';
    return <span title={h.message || h.status} style={{ fontSize: 10, color, fontWeight: 700, cursor: 'help', marginLeft: 2 }}>{label}</span>;
  };

  return (
    <PageShell
      title="Integrations"
      subtitle={loading ? 'Loading...' : `${connectedCount} of ${totalCount} platforms connected`}
      icon="🔌"
      accent={T.primary}
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          {connectedCount > 0 && (
            <Btn color={T.primary} ghost onClick={handleSyncAll} style={{ opacity: syncingAll ? 0.6 : 1 }}>
              {syncingAll ? '⟳ Syncing...' : '⟳ Sync All'}
            </Btn>
          )}
          <Btn ghost color={T.primary} onClick={handleRequest}>+ Request</Btn>
        </div>
      }
    >
      <style>{`
        @keyframes ig-glow-in {
          0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0); transform: scale(1); }
          30%  { box-shadow: 0 0 0 6px rgba(16,185,129,0.3); transform: scale(1.02); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); transform: scale(1); }
        }
        @keyframes ig-icon-bounce {
          0%,100% { transform: scale(1); }
          40%      { transform: scale(1.25); }
          70%      { transform: scale(0.92); }
        }
        .ig-just-connected { animation: ig-glow-in 1.2s cubic-bezier(0.16,1,0.3,1) both; }
        .ig-icon-bounce     { animation: ig-icon-bounce 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
      `}</style>
      {statusMessage && (
        <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 10, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: C.text, fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {showSyncResults && lastSyncResults && (
        <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', fontSize: 12, color: C.text }}>
          <strong style={{ color: C.green }}>Sync complete:</strong>{' '}
          {lastSyncResults.success_count}/{lastSyncResults.total_platforms} platforms synced
          {lastSyncResults.error_count > 0 && <span style={{ color: C.amber }}> · {lastSyncResults.error_count} failed</span>}
        </div>
      )}

      {error && (
        <div style={{ marginBottom: 14, padding: '12px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span>{error}</span>
          <Btn ghost color={C.red} onClick={reload} style={{ padding: '4px 10px', fontSize: 11 }}>Retry</Btn>
        </div>
      )}

      {!loading && integrations.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            [connectedCount, 'Connected', T.primary],
            [integrations.filter(i => i.lastSyncStatus === 'success').length, 'Synced OK', C.green],
            [Object.values(health).filter(h => h.status === 'degraded').length, 'Degraded', C.amber],
            [Object.values(health).filter(h => h.status === 'down').length, 'Down', C.red],
          ].map(([n, l, c]) => (
            <Card key={l} accent={c} style={{ padding: '12px 16px' }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 22, color: c }}>{n}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{l}</div>
            </Card>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {[1,2,3,4,5,6].map(n => <SkeletonCard key={n} />)}
        </div>
      ) : integrations.length === 0 ? (
        <div style={{ padding: 20, color: C.muted }}>No integrations available.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {integrations.map(ig => {
            const isBusy = busy === ig.platform || syncingPlatform === ig.platform;
            const ph = getHealthForPlatform(ig.platform);
            const healthColor = ig.connected ? ({ healthy: C.green, degraded: C.amber, down: C.red }[ph.status] || C.green) : undefined;

            return (
              <Card key={ig.platform} accent={healthColor} style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: ig.available ? 1 : 0.72, transition: 'all 0.2s' }} className={justConnected === ig.platform ? 'ig-just-connected' : ''}>
                <div className={justConnected === ig.platform ? 'ig-icon-bounce' : ''} style={{ width: 40, height: 40, borderRadius: 12, background: ig.connected ? `${C.green}12` : 'rgba(255,255,255,0.05)', border: `1px solid ${ig.connected ? (healthColor || C.green) + '40' : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                  {BRAND_ICONS[ig.displayName] || <span style={{ fontSize: 18 }}>🔌</span>}
                  {ig.connected && <div style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: '50%', background: healthColor || C.green, border: '2px solid #101014' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{ig.displayName}</span>
                    {!ig.available && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 99, background: 'rgba(255,255,255,0.08)', color: C.muted }}>Soon</span>}
                    {ig.connected && <HealthDot platform={ig.platform} />}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted }}>{ig.description}</div>
                  {ig.connected && (
                    <div style={{ fontSize: 11, color: healthColor || C.green, marginTop: 4 }}>
                      ✓ {ig.accountLabel || 'Connected'}
                      {ig.lastSyncLabel && <span style={{ color: C.muted }}> · {ig.lastSyncLabel}</span>}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  {ig.connected && (
                    <button onClick={(e) => { e.stopPropagation(); handleSync(ig.platform, ig.displayName); }} disabled={isBusy}
                      style={{ padding: '4px 9px', borderRadius: 8, border: `1px solid ${C.border}`, background: isBusy ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)', color: isBusy ? C.muted : C.text, fontSize: 11, cursor: isBusy ? 'wait' : 'pointer' }}>
                      {syncingPlatform === ig.platform ? '⟳' : '↻ Sync'}
                    </button>
                  )}
                  <div onClick={() => toggle(ig)}
                    style={{ width: 42, height: 24, borderRadius: 99, background: ig.connected ? C.green : 'rgba(255,255,255,0.12)', cursor: (ig.available || ig.connected) && !isBusy ? 'pointer' : 'not-allowed', position: 'relative', transition: 'all 0.2s', opacity: isBusy ? 0.5 : 1 }}>
                    <div style={{ position: 'absolute', top: 3, left: ig.connected ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

/* ════════════════════════════════════════
   SETTINGS PAGE
════════════════════════════════════════ */
export function SettingsPage({ T, user, onSignOut }) {
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSlack, setNotifSlack] = useState(false);
  const [aiMode, setAiMode] = useState('suggest');
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const SETTINGS_TABS = ['profile', 'notifications', 'ai', 'security', 'billing'];

  const handleSaveProfile = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast('Profile updated successfully', 'success');
    }, 1000);
  };

  const Toggle = ({ on, setOn }) => (
    <div onClick={() => setOn(v => !v)} style={{ width: 44, height: 26, borderRadius: 99, background: on ? C.green : 'rgba(255,255,255,0.12)', cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'all 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.4)' }} />
    </div>
  );

  const Row = ({ label, desc, right }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: `1px solid ${C.border}` }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{desc}</div>}
      </div>
      {right}
    </div>
  );

  return (
    <PageShell title="Settings" subtitle="Manage your WorkPilot AI preferences" icon="⚙️" accent={T.secondary}>
      <div style={{ display: 'flex', gap: 14 }}>
        {/* Tab list */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {SETTINGS_TABS.map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: 'none', border: 'none', borderLeft: tab === t ? `3px solid ${T.primary}` : '3px solid transparent', color: tab === t ? T.primary : C.muted, fontSize: 13, fontWeight: tab === t ? 600 : 400, cursor: 'pointer', textTransform: 'capitalize', textAlign: 'left', fontFamily: "'Inter',sans-serif", transition: 'all 0.15s' }}>
                  {{ profile: '👤', notifications: '🔔', ai: '⚡', security: '🔒', billing: '💳' }[t]} {t}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Tab content */}
        <Card style={{ flex: 1 }} accent={T.secondary}>
          {tab === 'profile' && (
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Profile</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: '16px', background: 'rgba(255,255,255,0.025)', borderRadius: 12, border: `1px solid ${C.border}` }}>
                <Avatar name={user?.displayName || 'User'} size={54} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{user?.displayName || 'User'}</div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{user?.email}</div>
                  <Btn ghost color={T.primary} style={{ marginTop: 8, fontSize: 11, padding: '5px 12px' }}>Change photo</Btn>
                </div>
              </div>
              <form onSubmit={e => { e.preventDefault(); handleSaveProfile(); }}>
                {[['Display Name', user?.displayName || ''], ['Email', user?.email || ''], ['Job Title', 'Manager'], ['Department', 'Engineering']].map(([l, v]) => (
                  <div key={l} style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 6, fontWeight: 600 }}>{l}</label>
                    <input defaultValue={v} style={{ width: '100%', padding: '10px 14px', background: '#18181f', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 9, color: C.text, fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box', transition: 'all 0.2s' }} onFocus={e => e.target.style.border = `1px solid ${T.primary}`} onBlur={e => e.target.style.border = `1px solid rgba(255,255,255,0.1)`} />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
                  <Btn color={T.primary} onClick={handleSaveProfile}>{saving ? 'Saving...' : 'Save changes'}</Btn>
                  <Btn ghost color={C.red} onClick={onSignOut}>Sign out</Btn>
                </div>
              </form>
            </div>
          )}

          {tab === 'notifications' && (
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Notifications</div>
              <Row label="Email notifications" desc="Get notified about urgent emails" right={<Toggle on={notifEmail} setOn={setNotifEmail} />} />
              <Row label="Slack notifications" desc="Send alerts to Slack channel" right={<Toggle on={notifSlack} setOn={setNotifSlack} />} />
              <Row label="Deployment alerts" desc="Notify on failed deployments" right={<Toggle on={true} setOn={() => {}} />} />
              <Row label="Team updates" desc="Daily team standup digest" right={<Toggle on={true} setOn={() => {}} />} />
              <Row label="AI action log" desc="Weekly summary of AI actions taken" right={<Toggle on={false} setOn={() => {}} />} />
            </div>
          )}

          {tab === 'ai' && (
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>AI Preferences</div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, fontWeight: 600 }}>DEFAULT AI MODE</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[['autopilot', 'Auto-pilot', 'AI acts instantly without asking', C.green], ['suggest', 'Suggest', 'AI suggests, you approve before acting', T.primary], ['ask', 'Ask First', 'AI always confirms before any action', C.amber]].map(([val, label, desc, c]) => (
                    <div key={val} onClick={() => setAiMode(val)} style={{ padding: '12px 14px', borderRadius: 11, border: `1px solid ${aiMode === val ? c + '40' : C.border}`, background: aiMode === val ? `${c}08` : 'rgba(255,255,255,0.02)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.18s' }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${aiMode === val ? c : 'rgba(255,255,255,0.2)'}`, background: aiMode === val ? c : 'transparent', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: aiMode === val ? c : C.sub }}>{label}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Row label="AI briefing time" desc="When to receive your morning briefing" right={<input type="time" defaultValue="08:00" style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, borderRadius: 7, color: C.text, padding: '5px 9px', fontSize: 12, outline: 'none' }} />} />
              <Row label="Auto-archive newsletters" desc="Automatically archive promotional emails" right={<Toggle on={true} setOn={() => {}} />} />
            </div>
          )}

          {tab === 'security' && (
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Security</div>
              <Row label="Two-factor authentication" desc="Add an extra layer of security" right={<Btn ghost color={T.primary} style={{ fontSize: 12, padding: '6px 12px' }}>Enable 2FA</Btn>} />
              <div style={{ marginTop: 20, marginBottom: 10, fontSize: 12, color: C.muted, fontWeight: 600 }}>ACTIVE SESSIONS</div>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 20 }}>💻</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>MacBook Pro 14" (Current)</div>
                    <div style={{ fontSize: 11, color: C.muted }}>San Francisco, CA · Chrome</div>
                  </div>
                </div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 20 }}>📱</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>iPhone 14 Pro</div>
                    <div style={{ fontSize: 11, color: C.muted }}>San Jose, CA · Safari</div>
                  </div>
                </div>
                <Btn ghost color={C.red} style={{ fontSize: 11, padding: '4px 10px' }}>Revoke</Btn>
              </div>
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, fontWeight: 600 }}>CHANGE PASSWORD</div>
                {['Current password', 'New password', 'Confirm password'].map(l => (
                  <input key={l} type="password" placeholder={l} style={{ width: '100%', padding: '9px 12px', background: '#18181f', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 9, color: C.text, fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box', marginBottom: 10 }} />
                ))}
                <Btn color={T.primary} style={{ marginTop: 4 }}>Update password</Btn>
              </div>
            </div>
          )}

          {tab === 'billing' && (
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Billing</div>
              <div style={{ padding: '16px 18px', background: `linear-gradient(135deg,${T.primary}18,${T.secondary}10)`, border: `1px solid ${T.primary}28`, borderRadius: 12, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, color: C.text }}>Pro Plan</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>$49/month · Renews Aug 1, 2026</div>
                  </div>
                  <Btn ghost color={T.primary} style={{ fontSize: 12 }}>Upgrade →</Btn>
                </div>
              </div>
              <Row label="Payment method" desc="Visa ending in 4242" right={<Btn ghost color={T.primary} style={{ fontSize: 12, padding: '6px 12px' }}>Update</Btn>} />
              <Row label="Next invoice" desc="$49 on August 1, 2026" right={<Btn ghost color={T.primary} style={{ fontSize: 12, padding: '6px 12px' }}>Download</Btn>} />
              <Row label="Usage this month" desc="247 AI actions · 26.5h focus tracked" right={<span style={{ fontSize: 13, color: C.green, fontWeight: 700 }}>85% used</span>} />
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
