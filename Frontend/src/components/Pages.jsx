import React, { useState } from 'react';
import { SiGmail, SiGooglecalendar, SiGithub, SiZoom, SiNotion, SiJira, SiGoogledrive } from 'react-icons/si';

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
    <div style={{ padding: '28px 28px 80px', animation: 'pageIn .25s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: `linear-gradient(135deg,${accent}25,${accent}12)`, border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
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

export function Card({ children, style = {}, accent }) {
  return (
    <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: '20px 22px', position: 'relative', overflow: 'hidden', ...style }}>
      {accent && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${accent}50,transparent)` }} />}
      {children}
    </div>
  );
}

export function Btn({ children, onClick, color = C.blue, ghost = false, style = {} }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: "'Inter',sans-serif",
      fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
      transition: 'all 0.18s', border: 'none',
      background: ghost ? `${color}12` : `linear-gradient(135deg,${color},${color}cc)`,
      border: ghost ? `1px solid ${color}28` : 'none',
      color: ghost ? color : '#fff',
      boxShadow: ghost ? 'none' : `0 3px 14px ${color}30`,
      ...style,
    }} className="pg-btn">{children}</button>
  );
}

export function Tag({ label, color }) {
  return <span style={{ padding: '3px 9px', borderRadius: 99, background: `${color}15`, border: `1px solid ${color}28`, color, fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap' }}>{label}</span>;
}

export function Avatar({ name, size = 34 }) {
  const letters = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hue = (name.charCodeAt(0) * 47) % 360;
  return <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: '#fff', fontFamily: "'Sora',sans-serif", background: `linear-gradient(135deg,hsl(${hue},65%,42%),hsl(${(hue+60)%360},65%,52%))` }}>{letters}</div>;
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
  const tabs = ['inbox', 'sent', 'drafts', 'archived'];

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
            {EMAILS.map(em => (
              <div key={em.id} onClick={() => setSelected(em)} style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', background: selected?.id === em.id ? `${T.primary}08` : em.read ? 'transparent' : 'rgba(255,255,255,0.02)', transition: 'all 0.15s' }} className="pg-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: em.priority === 'urgent' ? C.red : em.read ? 'transparent' : T.primary, flexShrink: 0, boxShadow: em.priority === 'urgent' ? `0 0 5px ${C.red}` : 'none' }} />
                  <span style={{ fontSize: 13, fontWeight: em.read ? 400 : 700, color: C.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{em.from}</span>
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
                      <span style={{ fontSize: 13, color: C.sub }}><strong style={{ color: C.text }}>{selected.from}</strong> · {selected.time}</span>
                      <Tag label={selected.role} color={C.muted} />
                      {selected.priority === 'urgent' && <Tag label="⚠ Urgent" color={C.red} />}
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.muted, cursor: 'pointer', borderRadius: 7, padding: '5px 9px', fontSize: 12 }}>✕</button>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn color={T.primary} style={{ fontSize: 12, padding: '7px 14px' }}>⚡ AI Draft Reply</Btn>
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
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

export function CalendarPage({ T }) {
  const [view, setView] = useState('week');
  const today = new Date();
  const monthStr = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <PageShell title="Calendar" subtitle="Your schedule, powered by WorkPilot AI" icon="📅" accent={T.accent}
      actions={<>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: 9, overflow: 'hidden' }}>
          {['Day','Week','Month'].map(v => <button key={v} onClick={() => setView(v.toLowerCase())} style={{ padding: '7px 14px', background: view === v.toLowerCase() ? `${T.primary}20` : 'none', border: 'none', color: view === v.toLowerCase() ? T.primary : C.muted, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>{v}</button>)}
        </div>
        <Btn color={T.primary}>+ New Event</Btn>
      </>}>

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
                  const event = EVENTS.find(e => e.time === hr && di === 3); // Thursday
                  return (
                    <div key={d} style={{ flex: 1, borderLeft: `1px solid rgba(255,255,255,0.03)`, position: 'relative' }}>
                      {event && (
                        <div style={{ position: 'absolute', left: 2, right: 2, top: 2, padding: '4px 6px', borderRadius: 6, background: `${event.color}20`, border: `1px solid ${event.color}35`, cursor: 'pointer' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: event.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</div>
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
              {EVENTS.map(ev => (
                <div key={ev.id} style={{ display: 'flex', gap: 8, padding: '9px 10px', background: `${ev.color}08`, border: `1px solid ${ev.color}20`, borderLeft: `3px solid ${ev.color}`, borderRadius: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{ev.title}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2, fontFamily: "'JetBrains Mono',monospace" }}>{ev.time} — {ev.end} · {ev.people} people</div>
                  </div>
                </div>
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

  const filtered = filter === 'all' ? MEMBERS : MEMBERS.filter(m => m.status === filter);

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
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: C.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.08em' }}>{h}</div>
          ))}
        </div>
        {filtered.map(m => (
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
              <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${m.progress}%`, height: '100%', background: statusColor[m.status], borderRadius: 99, boxShadow: `0 0 4px ${statusColor[m.status]}60` }} />
              </div>
            </div>
            <Tag label={statusLabel[m.status]} color={statusColor[m.status]} />
            <div style={{ display: 'flex', gap: 5 }}>
              {m.status === 'delayed' && <Btn ghost color={C.amber} style={{ padding: '4px 10px', fontSize: 11 }}>Follow up</Btn>}
              {m.status === 'missing' && <Btn ghost color={C.red} style={{ padding: '4px 10px', fontSize: 11 }}>Remind</Btn>}
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
  const [selectedPipeline, setSelectedPipeline] = useState(PIPELINES[1]);

  return (
    <PageShell title="Deployments" subtitle="CI/CD pipeline monitor" icon="🚀" accent={C.green}
      actions={<><Btn color={C.green} ghost>↻ Refresh</Btn><Btn color={T.primary}>+ New Deploy</Btn></>}>

      <div style={{ display: 'flex', gap: 14 }}>
        {/* Pipeline list */}
        <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PIPELINES.map(p => {
            const s = statusCfg[p.status];
            const active = selectedPipeline.id === p.id;
            return (
              <Card key={p.id} accent={s.c} style={{ cursor: 'pointer', border: `1px solid ${active ? s.c + '50' : C.border}`, transition: 'all 0.2s', boxShadow: active ? `0 0 0 1px ${s.c}25` : 'none' }} onClick={() => setSelectedPipeline(p)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 13, color: C.text }}>{p.name}</span>
                  <Tag label={s.l} color={s.c} />
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.muted, marginBottom: 8 }}>{p.version}</div>
                {p.status === 'running' && (
                  <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ width: `${p.progress}%`, height: '100%', background: `linear-gradient(90deg,${T.primary},${T.secondary})`, borderRadius: 99 }} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  {p.uptime !== '—' && <div><div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{p.uptime}</div><div style={{ fontSize: 10, color: C.muted }}>Uptime</div></div>}
                  <div><div style={{ fontSize: 12, fontWeight: 700, color: riskCfg[p.risk] }}>{p.risk.toUpperCase()}</div><div style={{ fontSize: 10, color: C.muted }}>Risk</div></div>
                  <div><div style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>{p.deployed}</div><div style={{ fontSize: 10, color: C.muted }}>Deployed</div></div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Detail */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card accent={statusCfg[selectedPipeline.status].c}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 16 }}>{selectedPipeline.name} — {selectedPipeline.version}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>Last updated: {selectedPipeline.deployed}</div>
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                <Btn ghost color={C.red} style={{ padding: '7px 12px', fontSize: 12 }}>🔴 Rollback</Btn>
                <Btn ghost color={T.primary} style={{ padding: '7px 12px', fontSize: 12 }}>▶ Redeploy</Btn>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {[['Uptime', selectedPipeline.uptime, C.green], ['Latency', selectedPipeline.latency, C.blue], ['Risk', selectedPipeline.risk?.toUpperCase(), riskCfg[selectedPipeline.risk]], ['Status', statusCfg[selectedPipeline.status].l, statusCfg[selectedPipeline.status].c]].map(([k, v, c]) => (
                <div key={k} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: `1px solid rgba(255,255,255,0.05)` }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: c }}>{v || '—'}</div>
                </div>
              ))}
            </div>
          </Card>
          {/* Live logs */}
          <Card accent={C.green} style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              Build Logs
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, animation: 'pulse 1.5s infinite' }} />
            </div>
            <div style={{ background: '#050507', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', padding: '14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5, lineHeight: 2 }}>
              {DEPLOY_LOGS.map((l, i) => (
                <div key={i} style={{ color: l.level === 'success' ? C.green : l.level === 'warn' ? C.amber : l.level === 'error' ? C.red : 'rgba(255,255,255,0.5)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.25)', marginRight: 12 }}>{l.t}</span>{l.msg}
                </div>
              ))}
              <div style={{ color: C.blue, animation: 'blink 1s infinite' }}>▌</div>
            </div>
          </Card>
        </div>
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

  return (
    <PageShell title="Documents" subtitle="AI-powered document analysis and Q&A" icon="📄" accent={C.amber}
      actions={<><Btn ghost color={T.primary}>🔍 Search docs</Btn><Btn color={T.primary}>+ Upload</Btn></>}>

      {/* Drop zone */}
      <div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); }}
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
        {DOCS_LIST.map(doc => (
          <div key={doc.id} style={{ padding: '14px 20px', borderBottom: `1px solid rgba(255,255,255,0.04)`, display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr', gap: 12, alignItems: 'center', transition: 'all 0.15s' }} className="pg-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${typeColor[doc.type]}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                {doc.type === 'PDF' ? '📕' : doc.type === 'DOCX' ? '📘' : '📗'}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: "'JetBrains Mono',monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</span>
            </div>
            <Tag label={doc.type} color={typeColor[doc.type]} />
            <span style={{ fontSize: 12, color: C.muted }}>{doc.size}</span>
            <span style={{ fontSize: 12, color: C.muted }}>{doc.modified}</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: doc.warn ? C.amber : C.muted }}>{doc.status}</span>
              <Btn ghost color={T.primary} style={{ padding: '3px 9px', fontSize: 11 }}>Ask AI</Btn>
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
  const weeks = ['W1', 'W2', 'W3', 'W4'];
  const barData = [45, 62, 38, 77];
  const maxBar = Math.max(...barData);

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
        {[
          { label: 'Focus Hours', value: '26.5h', delta: '+12%', color: T.primary },
          { label: 'Emails Handled by AI', value: '247', delta: '+34%', color: C.green },
          { label: 'Tasks Completed', value: '48', delta: '-3%', color: C.amber },
          { label: 'AI Time Saved', value: '8.2h', delta: '+21%', color: T.secondary },
        ].map(k => (
          <Card key={k.label} accent={k.color}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 26, color: C.text }}>{k.value}</div>
            <div style={{ fontSize: 11, color: k.delta.startsWith('+') ? C.green : C.red, marginTop: 6, fontFamily: "'JetBrains Mono',monospace" }}>{k.delta} vs last month</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        {/* Bar chart */}
        <Card accent={T.secondary}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 20 }}>Weekly Focus Hours</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 160 }}>
            {weeks.map((w, i) => (
              <div key={w} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 11, color: T.secondary, fontWeight: 700 }}>{barData[i]}h</div>
                <div style={{ width: '100%', height: `${(barData[i] / maxBar) * 130}px`, background: `linear-gradient(180deg,${T.secondary},${T.primary})`, borderRadius: '6px 6px 2px 2px', boxShadow: `0 0 12px ${T.secondary}30`, transition: 'all 0.4s ease' }} />
                <div style={{ fontSize: 11, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>{w}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Activity breakdown */}
        <Card accent={T.primary}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Time Breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[['Deep work', 38, T.primary], ['Meetings', 28, C.indigo], ['Email', 18, C.amber], ['Admin', 16, C.muted]].map(([l, pct, c]) => (
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
        </Card>
      </div>
    </PageShell>
  );
}

/* ════════════════════════════════════════
   INTEGRATIONS PAGE
════════════════════════════════════════ */
const INTEGRATIONS_LIST = [
  { name: 'Gmail',           desc: 'Read, send and triage emails',         connected: true,  lastSync: '2 min ago' },
  { name: 'Google Calendar', desc: 'Sync events and schedule meetings',     connected: true,  lastSync: '5 min ago' },
  { name: 'GitHub',          desc: 'Monitor PRs, issues and deployments',   connected: true,  lastSync: '12 min ago' },
  { name: 'Slack',           desc: 'Send messages and notifications',       connected: false, lastSync: null },
  { name: 'Zoom',            desc: 'Create and join meetings instantly',     connected: false, lastSync: null },
  { name: 'Microsoft Teams', desc: 'Sync with MS Teams workspace',          connected: false, lastSync: null },
  { name: 'Notion',          desc: 'Sync notes, tasks and wikis',           connected: false, lastSync: null },
  { name: 'Jira',            desc: 'Track project tasks and sprints',       connected: false, lastSync: null },
];

export function IntegrationsPage({ T }) {
  const [integrations, setIntegrations] = useState(INTEGRATIONS_LIST);

  const toggle = (name) => setIntegrations(prev => prev.map(i => i.name === name ? { ...i, connected: !i.connected, lastSync: !i.connected ? 'Just now' : null } : i));

  return (
    <PageShell title="Integrations" subtitle="Connect WorkPilot AI to your favourite tools" icon="🔌" accent={T.primary}
      actions={<Btn ghost color={T.primary}>+ Request integration</Btn>}>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
        {integrations.map(ig => (
          <Card key={ig.name} accent={ig.connected ? C.green : undefined} style={{ display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: ig.connected ? `${C.green}12` : 'rgba(255,255,255,0.05)', border: `1px solid ${ig.connected ? C.green + '28' : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {BRAND_ICONS[ig.name] || <span style={{ fontSize: 20 }}>🔌</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>{ig.name}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{ig.desc}</div>
              {ig.connected && ig.lastSync && <div style={{ fontSize: 11, color: C.green, marginTop: 4 }}>✓ Synced {ig.lastSync}</div>}
            </div>
            <button onClick={() => toggle(ig.name)} style={{ padding: '7px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, transition: 'all 0.2s', background: ig.connected ? `${C.red}12` : `linear-gradient(135deg,${T.primary},${T.secondary})`, color: ig.connected ? C.red : '#fff', border: ig.connected ? `1px solid ${C.red}25` : 'none', boxShadow: ig.connected ? 'none' : `0 2px 12px ${T.glow || T.primary + '40'}`, flexShrink: 0 }}>
              {ig.connected ? 'Disconnect' : 'Connect'}
            </button>
          </Card>
        ))}
      </div>
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

  const SETTINGS_TABS = ['profile', 'notifications', 'ai', 'security', 'billing'];

  const Toggle = ({ on, setOn }) => (
    <div onClick={() => setOn(v => !v)} style={{ width: 40, height: 22, borderRadius: 99, background: on ? T.primary : 'rgba(255,255,255,0.12)', cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
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
            {SETTINGS_TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: tab === t ? `${T.primary}18` : 'none', border: 'none', borderRadius: 8, color: tab === t ? T.primary : C.muted, fontSize: 13, fontWeight: tab === t ? 600 : 400, cursor: 'pointer', textTransform: 'capitalize', textAlign: 'left', fontFamily: "'Inter',sans-serif", marginBottom: 2, transition: 'all 0.15s' }}>
                {{ profile: '👤', notifications: '🔔', ai: '⚡', security: '🔒', billing: '💳' }[t]} {t}
              </button>
            ))}
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
              {[['Display Name', user?.displayName || ''], ['Email', user?.email || ''], ['Job Title', 'Manager'], ['Department', 'Engineering']].map(([l, v]) => (
                <div key={l} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontWeight: 600, letterSpacing: '0.06em' }}>{l.toUpperCase()}</div>
                  <input defaultValue={v} style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <Btn color={T.primary}>Save changes</Btn>
                <Btn ghost color={C.red} onClick={onSignOut}>Sign out</Btn>
              </div>
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
              <Row label="Active sessions" desc="2 active sessions" right={<Btn ghost color={C.red} style={{ fontSize: 12, padding: '6px 12px' }}>Revoke all</Btn>} />
              <Row label="API keys" desc="3 active API keys" right={<Btn ghost color={T.primary} style={{ fontSize: 12, padding: '6px 12px' }}>Manage</Btn>} />
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>CHANGE PASSWORD</div>
                {['Current password', 'New password', 'Confirm password'].map(l => (
                  <input key={l} type="password" placeholder={l} style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box', marginBottom: 10 }} />
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
