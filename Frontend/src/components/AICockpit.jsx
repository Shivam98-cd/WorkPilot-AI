import React, { useState, useEffect, useRef, useCallback } from 'react';
import ComposeEmailCard from './ComposeEmailCard';

/* ══════════════════════════════════════
   ICONS
══════════════════════════════════════ */
const Ic = {
  bolt:    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  send:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  mic:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  mail:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  cal:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  deploy:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
  team:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  docs:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  check:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  copy:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  undo:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.08"/></svg>,
  x:       <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  pin:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  arr:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  plus:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  star:    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  search:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  back:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
  clock:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  brain:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z"/></svg>,
};

/* ══════════════════════════════════════
   AI MODES
══════════════════════════════════════ */
const MODES = {
  autopilot: { label: 'Auto-pilot', color: '#10b981', desc: 'AI acts instantly on your behalf' },
  suggest:   { label: 'Suggest', color: '#3b82f6', desc: 'AI suggests, you approve before acting' },
  ask:       { label: 'Ask First', color: '#f59e0b', desc: 'AI always asks before taking any action' },
};

/* ══════════════════════════════════════
   PINNED PROMPTS
══════════════════════════════════════ */
const DEFAULT_PINS = [
  { id: 1, label: 'Morning briefing', prompt: 'Give me my morning briefing with top priorities' },
  { id: 2, label: 'Draft CFO reply', prompt: 'Draft a reply to the CFO budget email' },
  { id: 3, label: 'Team standup', prompt: 'Generate team standup report' },
  { id: 4, label: 'Deploy status', prompt: 'What is the current deployment status?' },
  { id: 5, label: 'Email summary', prompt: 'Summarize my unread emails' },
];

/* ══════════════════════════════════════
   THINKING MESSAGES (cycle through)
══════════════════════════════════════ */
const THINKING_MSGS = [
  'Reading your emails...',
  'Analyzing your calendar...',
  'Checking team status...',
  'Reviewing deployments...',
  'Generating response...',
];

/* ══════════════════════════════════════
   RICH CARD TEMPLATES
══════════════════════════════════════ */

function EmailCard({ T, onSend, onDiscard }) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState('Hi Robert,\n\nThank you for sending over the Q3 budget proposal. I\'ve reviewed the figures and would like to schedule a 30-minute call to discuss a few line items before final approval.\n\nAre you available this Thursday at 2:00 PM? Please let me know if another time works better.\n\nBest regards,\nAlex');
  return (
    <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 14, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>{Ic.mail}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono',monospace" }}>EMAIL DRAFT</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>To: Robert Chen (CFO)</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Subject: Re: Q3 Budget Approval</div>
        </div>
      </div>
      <div style={{ padding: '12px 14px' }}>
        {editing ? (
          <textarea value={body} onChange={e => setBody(e.target.value)} style={{ width: '100%', minHeight: 120, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12, lineHeight: 1.7, padding: '10px', outline: 'none', resize: 'vertical', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' }} />
        ) : (
          <pre style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', fontFamily: "'Inter',sans-serif" }}>{body}</pre>
        )}
      </div>
      <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(59,130,246,0.1)', display: 'flex', gap: 7 }}>
        <button onClick={onSend} style={{ padding: '7px 14px', borderRadius: 8, background: `linear-gradient(135deg,${T.primary},${T.secondary})`, border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, boxShadow: `0 2px 10px ${T.glow}` }}>✉ Send Now</button>
        <button onClick={() => setEditing(v => !v)} style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: 12, cursor: 'pointer' }}>✏ {editing ? 'Done' : 'Edit'}</button>
        <button onClick={onDiscard} style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>🗑 Discard</button>
      </div>
    </div>
  );
}

/** Shows real Gmail messages fetched from the backend */
function RealEmailsCard({ emails, source, T, onDismiss }) {
  const PRIORITY_COLOR = { urgent: '#ef4444', high: '#f59e0b', normal: '#3b82f6', low: 'rgba(255,255,255,0.3)' };
  return (
    <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 14, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', flexShrink: 0 }}>{Ic.mail}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono',monospace" }}>
            {source === 'gmail' ? 'GMAIL INBOX' : 'EMAIL INBOX'} · {emails.length} messages
          </div>
        </div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16 }}>×</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {emails.slice(0, 5).map((email, i) => {
          const prioColor = PRIORITY_COLOR[email.priority] || PRIORITY_COLOR.normal;
          return (
            <div key={email.id || i} style={{ padding: '10px 14px', borderBottom: i < emails.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: prioColor, marginTop: 5, flexShrink: 0, boxShadow: email.priority === 'urgent' ? `0 0 6px ${prioColor}` : 'none' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email.from || 'Unknown'}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', flexShrink: 0, fontFamily: "'JetBrains Mono',monospace" }}>{email.time || ''}</span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{email.subject || 'No subject'}</div>
                {email.preview && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email.preview}</div>}
              </div>
              {email.priority === 'urgent' && (
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', flexShrink: 0 }}>Urgent</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Shows real calendar events fetched from Google Calendar */
function RealCalendarCard({ events, T, onDismiss }) {
  const formatTime = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  };
  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    } catch { return iso; }
  };
  return (
    <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>{Ic.cal}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono',monospace" }}>
            GOOGLE CALENDAR · {events.length} upcoming
          </div>
        </div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16 }}>×</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {events.slice(0, 5).map((ev, i) => {
          const start = ev.time || ev.start;
          const isDateOnly = start && !start.includes('T');
          return (
            <div key={ev.id || i} style={{ padding: '10px 14px', borderBottom: i < events.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 38, textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', fontFamily: "'JetBrains Mono',monospace" }}>{isDateOnly ? formatDate(start).split(' ')[0] : formatTime(start)}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{isDateOnly ? formatDate(start).split(' ').slice(1).join(' ') : formatDate(start)}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title || ev.summary || 'Untitled event'}</div>
                {ev.tag && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{ev.tag}</div>}
                {ev.meetingLink && (
                  <a href={ev.meetingLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#10b981', marginTop: 2, display: 'inline-block' }}>🎥 Join meeting</a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarCard({ T, onConfirm, onDiscard }) {
  return (
    <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid rgba(16,185,129,0.12)', display: 'flex', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>{Ic.cal}</div>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono',monospace" }}>CALENDAR EVENT</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Team Weekly Sync</div>
        </div>
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', gap: 16 }}>
        {[['📅', 'Wed, Jul 23'], ['⏰', '3:00 PM — 4:00 PM'], ['👥', '5 attendees'], ['📍', 'Google Meet']].map(([e, v]) => (
          <div key={v} style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{e}</div>
            <div style={{ fontSize: 12, color: '#fff', fontWeight: 500, marginTop: 2 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(16,185,129,0.1)', display: 'flex', gap: 7 }}>
        <button onClick={onConfirm} style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>✓ Confirm & Invite</button>
        <button onClick={onDiscard} style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}>Edit Time</button>
      </div>
    </div>
  );
}

function DeployCard({ T, data }) {
  // Use real pipelines if available, else show mock
  const pipelines = data?.pipelines?.length
    ? data.pipelines.slice(0, 3)
    : [
        { name: 'Production', version: 'v2.4.1', status: 'live', progress: 100, risk: 'low', uptime: '99.9%' },
        { name: 'Staging', version: 'v2.4.2', status: 'in_progress', progress: 67, risk: 'medium', uptime: '' },
        { name: 'Dev', version: 'v2.5.0-beta', status: 'pending', progress: 20, risk: 'low', uptime: '' },
      ];
  const statusColor = { live: '#10b981', in_progress: '#6366f1', failed: '#ef4444', pending: '#f59e0b' };
  const riskColor = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };
  return (
    <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', flexShrink: 0 }}>{Ic.deploy}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono',monospace" }}>DEPLOYMENT STATUS · {pipelines.length} pipelines</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {pipelines.map((p, i) => {
          const sc = statusColor[p.status] || '#6366f1';
          const rc = riskColor[p.risk] || '#f59e0b';
          const pct = typeof p.progress === 'number' ? p.progress : 0;
          return (
            <div key={p.name || i} style={{ padding: '10px 14px', borderBottom: i < pipelines.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{p.name}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginLeft: 8, fontFamily: "'JetBrains Mono',monospace" }}>{p.version || ''}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {p.risk && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: `${rc}18`, border: `1px solid ${rc}40`, color: rc }}>{p.risk?.toUpperCase()} RISK</span>}
                  <span style={{ fontSize: 11, fontWeight: 700, color: sc }}>{p.status?.replace('_', ' ').toUpperCase()}</span>
                </div>
              </div>
              <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg,${T.primary},${T.secondary})`, borderRadius: 99, transition: 'width 0.6s ease' }} />
              </div>
              {p.uptime && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Uptime: {p.uptime}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TeamCard({ data }) {
  const STATUS_COLOR = { done: '#10b981', 'on-track': '#3b82f6', delayed: '#f59e0b', missing: '#ef4444' };
  const members = data?.members?.length
    ? data.members
    : [
        { name: 'Sarah Chen', status: 'done', task: 'UI mockups complete ✓' },
        { name: 'John Smith', status: 'on-track', task: 'API integration 65% done' },
        { name: 'Mike Chen', status: 'delayed', task: '⚠ Backend testing — 2 days late' },
        { name: 'Priya Sharma', status: 'missing', task: '🔴 No update today' },
      ];
  const delayed = members.filter(m => m.status === 'delayed' || m.status === 'missing');
  return (
    <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0 }}>{Ic.team}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono',monospace" }}>TEAM STANDUP · {members.length} members</div>
        </div>
        {delayed.length > 0 && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>{delayed.length} need attention</span>}
      </div>
      <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {members.map((m, i) => {
          const c = STATUS_COLOR[m.status] || '#3b82f6';
          return (
            <div key={m.name || i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: c, boxShadow: `0 0 5px ${c}`, flexShrink: 0 }} />
              <span style={{ width: 100, fontSize: 12, fontWeight: 600, color: '#fff', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.task || m.role || ''}</span>
              {typeof m.progress === 'number' && (
                <span style={{ fontSize: 10, color: c, marginLeft: 'auto', flexShrink: 0, fontFamily: "'JetBrains Mono',monospace" }}>{m.progress}%</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IntegrationsStatusCard({ data, T, onDismiss }) {
  const platforms = data?.platforms || [];
  const connected = data?.connected ?? 0;
  const total = data?.total ?? platforms.length;
  const ICONS = { gmail: '📧', google_calendar: '📅', github: '🐙', slack: '💬', zoom: '📹', notion: '📝', jira: '🎯', microsoft_teams: '🟦' };
  return (
    <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', flexShrink: 0 }}>🔗</div>
        <div style={{ flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono',monospace" }}>INTEGRATIONS · {connected}/{total} connected</div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16 }}>×</button>
      </div>
      <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {platforms.slice(0, 8).map((p, i) => (
          <div key={p.name || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: p.connected ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${p.connected ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
            <span style={{ fontSize: 14 }}>{ICONS[p.name?.toLowerCase().replace(' ', '_')] || '🔌'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
              <div style={{ fontSize: 10, color: p.connected ? '#10b981' : 'rgba(255,255,255,0.3)' }}>{p.connected ? '● Connected' : '○ Not connected'}</div>
            </div>
          </div>
        ))}
      </div>
      {connected === 0 && (
        <div style={{ padding: '8px 14px 12px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          Go to <strong style={{ color: '#6366f1' }}>Dashboard → Integrations</strong> to connect platforms
        </div>
      )}
    </div>
  );
}

function AnalyticsCard({ data, T, onDismiss }) {
  const d = data || {};
  const stats = [
    { label: 'Focus Hours', value: d.focus_hours ?? '6.5', unit: 'hrs', color: T?.primary || '#3b82f6' },
    { label: 'Emails Handled', value: d.emails_handled ?? 23, unit: '', color: '#10b981' },
    { label: 'Tasks Done', value: d.tasks_completed ?? 8, unit: '', color: '#f59e0b' },
    { label: 'AI Time Saved', value: d.ai_time_saved ?? '2.3', unit: 'hrs', color: T?.secondary || '#7c3aed' },
  ];
  return (
    <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 14, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', flexShrink: 0 }}>📊</div>
        <div style={{ flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono',monospace" }}>PRODUCTIVITY ANALYTICS · This Week</div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16 }}>×</button>
      </div>
      <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {stats.map(s => (
          <div key={s.label} style={{ padding: '10px 12px', borderRadius: 10, background: `${s.color}10`, border: `1px solid ${s.color}25` }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1 }}>
              {s.value}<span style={{ fontSize: 11, marginLeft: 2, opacity: 0.7 }}>{s.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Render markdown: **bold**, *italic*, bullet • */
function MdText({ text }) {
  if (!text) return null;
  // Split by lines, then parse inline bold/italic
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, li) => {
        // Parse **bold** and *italic* inline
        const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
        const inline = parts.map((part, pi) => {
          if (part.startsWith('**') && part.endsWith('**'))
            return <strong key={pi} style={{ color: '#fff', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
          if (part.startsWith('*') && part.endsWith('*'))
            return <em key={pi} style={{ color: 'rgba(255,255,255,0.85)' }}>{part.slice(1, -1)}</em>;
          return <span key={pi}>{part}</span>;
        });
        return (
          <span key={li}>
            {inline}
            {li < lines.length - 1 && <br />}
          </span>
        );
      })}
    </>
  );
}

/** Render markdown: **bold**, *italic*, bullet • */
function StreamText({ text, onDone, speed = 18 }) {
  const [displayed, setDisplayed] = useState('');
  const idx = useRef(0);
  useEffect(() => {
    idx.current = 0;
    setDisplayed('');
    const t = setInterval(() => {
      idx.current++;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) { clearInterval(t); onDone && onDone(); }
    }, speed);
    return () => clearInterval(t);
  }, [text]);
  return <span>{displayed}<span style={{ display: idx.current < text.length ? 'inline-block' : 'none', width: 2, height: '1em', background: 'rgba(255,255,255,0.7)', marginLeft: 2, animation: 'blink .7s step-end infinite', verticalAlign: 'text-bottom' }} /></span>;
}

/* ══════════════════════════════════════
   TOOL STATUS BADGE
══════════════════════════════════════ */
function ToolStatusBadge({ label }) {
  const icons = {
    'Reading your emails': '📧',
    'Checking your calendar': '📅',
    'Checking integrations': '🔗',
    'Loading analytics': '📊',
    'Fetching team status': '👥',
    'Checking deployments': '🚀',
    'Syncing': '🔄',
  };
  const icon = Object.keys(icons).find(k => label?.startsWith(k));
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: '5px 12px', borderRadius: 20, marginTop: 8,
      background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
      fontSize: 12, color: 'rgba(255,255,255,0.7)',
      animation: 'fadeIn 0.3s ease'
    }}>
      <span style={{ fontSize: 14 }}>{icon ? icons[icon] : '🤖'}</span>
      <span>{label}</span>
      <span style={{ display: 'flex', gap: 3 }}>
        {[0,1,2].map(i => (
          <span key={i} style={{
            width: 4, height: 4, borderRadius: '50%',
            background: '#818cf8',
            animation: `bounce 1s ${i * 0.15}s infinite ease-in-out`
          }} />
        ))}
      </span>
    </div>
  );
}


/* ══════════════════════════════════════
   AI MESSAGE RESPONSES
══════════════════════════════════════ */
const AI_RESPONSES = {
  default: (q) => ({
    text: `I've analyzed your request: "${q.slice(0, 60)}". I'm processing this now and will have a response ready shortly. Here's what I found based on your current workspace data:`,
    card: null,
  }),
  morning: {
    text: "Good morning! Here's your daily briefing: You have 3 urgent emails (CFO budget reply due 5pm is most critical), Mike Chen's task is 2 days overdue, and deployment v2.4.2 is in staging. I recommend starting with the CFO email — I've drafted a reply for you below.",
    card: 'email',
  },
  email: {
    text: "I've reviewed Robert Chen's Q3 Budget email. The key ask is approval by EOD. I've drafted a professional reply that buys you time for a deeper review while showing responsiveness:",
    card: 'email',
  },
  deploy: {
    text: "Here's the current deployment status. v2.4.1 is live in production with 99.9% uptime. v2.4.2 is in staging at 67% completion with medium risk — there's a dependency conflict in the auth module you should be aware of:",
    card: 'deploy',
  },
  team: {
    text: "I've compiled the team standup report from all 4 members' activity data. Here's where things stand today:",
    card: 'team',
  },
  meeting: {
    text: "I've found the best time slot based on everyone's calendars. Wednesday at 3pm works for all 5 attendees. I've pre-filled the invite with the agenda from your last meeting:",
    card: 'calendar',
  },
};

function getAIResponse(input) {
  const q = input.toLowerCase();
  if (q.includes('morning') || q.includes('brief')) return AI_RESPONSES.morning;
  if (q.includes('email') || q.includes('cfo') || q.includes('draft')) return AI_RESPONSES.email;
  if (q.includes('deploy') || q.includes('staging')) return AI_RESPONSES.deploy;
  if (q.includes('team') || q.includes('standup') || q.includes('mike')) return AI_RESPONSES.team;
  if (q.includes('meeting') || q.includes('schedule') || q.includes('calendar')) return AI_RESPONSES.meeting;
  return AI_RESPONSES.default(input);
}

export default function AICockpit({ user, theme, onBack }) {
  const T = theme || { primary: '#3b82f6', secondary: '#7c3aed', accent: '#06b6d4', glow: 'rgba(59,130,246,0.3)' };
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Alex';
  const firstName = displayName.split(' ')[0];

  const [mode, setMode] = useState('suggest');
  const [msgs, setMsgs] = useState([
    { id: 1, r: 'ai', text: `Welcome back, ${firstName}! I'm your AI Chief of Staff. I've reviewed your emails, calendar, and team status. You have 3 urgent items today. How can I help?`, card: null, streaming: false, done: true },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [thinkMsg, setThinkMsg] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [pins, setPins] = useState(DEFAULT_PINS);
  const [showAddPin, setShowAddPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [statsCount, setStatsCount] = useState({ handled: 12, saved: 3, actions: 7 });

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const endRef = useRef(null);
  const inputRef = useRef(null);
  const thinkIdx = useRef(0);

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth >= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, thinking]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const sendMsg = useCallback(async () => {
    if (!input.trim() || thinking) return;
    const userText = input.trim();
    setInput('');
    setMsgs(p => [...p, { id: Date.now(), r: 'user', text: userText, card: null, done: true }]);

    setThinking(true);
    thinkIdx.current = 0;
    setThinkMsg(THINKING_MSGS[0]);
    const thinkTimer = setInterval(() => {
      thinkIdx.current = (thinkIdx.current + 1) % THINKING_MSGS.length;
      setThinkMsg(THINKING_MSGS[thinkIdx.current]);
    }, 700);

    try {
      const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

      // Get best available auth token
      let authToken = '';
      try {
        const { auth } = await import('../firebase');
        authToken = (await auth.currentUser?.getIdToken()) || '';
      } catch {}
      if (!authToken) {
        const stored = JSON.parse(localStorage.getItem('wp_tokens') || 'null');
        authToken = stored?.accessToken || '';
      }

      const res = await fetch(`${API}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({
          message: userText,
          history: msgs.slice(-8).map(m => ({ role: m.r === 'ai' ? 'assistant' : 'user', content: m.text }))
        }),
      });

      clearInterval(thinkTimer);
      setThinking(false);

      const msgId = Date.now() + 1;
      setMsgs(p => [...p, { id: msgId, r: 'ai', text: '', card: null, toolCall: null, toolResult: null, streaming: true, done: false }]);
      setStatsCount(p => ({ ...p, handled: p.handled + 1 }));

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let full = '';
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop(); // keep incomplete line
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') {
            setMsgs(p => p.map(m => m.id === msgId ? { ...m, done: true, streaming: false, toolCall: null } : m));
            break;
          }
          try {
            const parsed = JSON.parse(payload);
            const { event, data } = parsed;

            if (event === 'token') {
              full += data;
              setMsgs(p => p.map(m => m.id === msgId ? { ...m, text: full } : m));

            } else if (event === 'tool_call') {
              const labels = {
                get_emails: 'Reading your emails...',
                get_calendar_events: 'Checking your calendar...',
                get_integrations_status: 'Checking integrations...',
                get_analytics: 'Loading analytics...',
                get_team_members: 'Fetching team status...',
                get_deployments: 'Checking deployments...',
                sync_integration: `Syncing ${data.args?.platform || 'integration'}...`,
                compose_email: 'Preparing compose form...',
                improve_text: `${data.args?.mode === 'fix_grammar' ? 'Fixing grammar' : data.args?.mode === 'rephrase' ? 'Rephrasing' : 'Improving'} your text...`,
              };
              const label = labels[data.name] || 'Using tool...';
              setThinkMsg(label);
              setThinking(true);
              setMsgs(p => p.map(m => m.id === msgId ? { ...m, toolCall: { name: data.name, label } } : m));

            } else if (event === 'tool_result') {
              setThinking(false);
              const cardMap = {
                get_emails: 'email', get_calendar_events: 'calendar',
                get_team_members: 'team', get_deployments: 'deploy',
                get_integrations_status: 'integrations', get_analytics: 'analytics',
                compose_email: 'compose', improve_text: 'improve_text',
              };
              const card = cardMap[data.name] || null;
              // For compose and improve_text: pass raw tool result as toolResult
              setMsgs(p => p.map(m => m.id === msgId ? { ...m, toolCall: null, toolResult: data.result, card } : m));

            } else if (event === 'done') {
              setMsgs(p => p.map(m => m.id === msgId ? { ...m, done: true, streaming: false, toolCall: null, card: m.card || data?.card || null } : m));

            } else if (event === 'error') {
              setMsgs(p => p.map(m => m.id === msgId ? { ...m, text: `Error: ${data}`, done: true, streaming: false } : m));
            }
          } catch { /* skip malformed line */ }
        }
      }
    } catch (err) {
      clearInterval(thinkTimer);
      setThinking(false);
      // Offline fallback
      const fallbacks = {
        email: 'I checked your inbox. You have 5 emails — 2 urgent (CFO Budget, Acme complaint). Want me to draft replies?',
        calendar: 'You have 4 events today: Standup 9AM, Client Meeting 11AM, Lunch 1:30PM, Project Sync 3PM.',
        team: 'Team update: Sarah on-track, John 65%, Mike 2 days delayed, Priya no update submitted.',
        deploy: 'Production v2.4.1 is live (99.9% uptime). Staging v2.4.2 is at 67% — auth conflict detected.',
      };
      const key = Object.keys(fallbacks).find(k => userText.toLowerCase().includes(k));
      const fallbackText = fallbacks[key] || 'I encountered a connection issue. Please make sure the backend is running at localhost:8000.';
      const msgId = Date.now() + 1;
      setMsgs(p => [...p, { id: msgId, r: 'ai', text: fallbackText, card: key || null, streaming: false, done: true }]);
      setStatsCount(p => ({ ...p, handled: p.handled + 1 }));
    }
  }, [input, thinking, msgs]);


  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = false; r.interimResults = false;
    r.onresult = (e) => setInput(e.results[0][0].transcript);
    r.onend = () => setIsListening(false);
    r.onerror = () => setIsListening(false);
    setIsListening(true);
    r.start();
  }, []);

  const usePin = (prompt) => { setInput(prompt); inputRef.current?.focus(); };

  const copyMsg = (id, text) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const removeCard = (id) => setMsgs(p => p.map(m => m.id === id ? { ...m, card: null } : m));

  const filteredMsgs = searchQ
    ? msgs.filter(m => m.text?.toLowerCase().includes(searchQ.toLowerCase()))
    : msgs;

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: "'Inter',sans-serif", overflow: 'hidden', position: 'relative' }}>
      
      {/* ══ LEFT SIDEBAR ══ */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
          <button onClick={() => setSidebarOpen(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }} title="Collapse sidebar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${T.primary},${T.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: `0 4px 14px ${T.glow}` }}>{Ic.brain}</div>
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 14, color: '#fff' }}>WorkPilot AI</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono',monospace" }}>AI Chief of Staff</div>
            </div>
          </div>

          {/* AI MODE SWITCHER */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 }}>
            {Object.entries(MODES).map(([key, val]) => {
              const isActive = mode === key;
              return (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6px 4px',
                    borderRadius: 8,
                    background: isActive ? `linear-gradient(135deg, ${val.color}20, ${val.color}05)` : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: val.color, marginBottom: 4, boxShadow: isActive ? `0 0 6px ${val.color}` : 'none' }} />
                  <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 500, color: isActive ? val.color : 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>{val.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pinned Prompts */}
        <div style={{ padding: '16px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', fontFamily: "'JetBrains Mono',monospace" }}>SAVED PROMPTS</span>
            <button onClick={() => setShowAddPin(v => !v)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', padding: 2 }}>{Ic.plus}</button>
          </div>

          {showAddPin && (
            <div style={{ marginBottom: 10, display: 'flex', gap: 6 }}>
              <input value={newPin} onChange={e => setNewPin(e.target.value)} placeholder="Type a prompt..." onKeyDown={e => { if (e.key === 'Enter' && newPin.trim()) { setPins(p => [...p, { id: Date.now(), label: newPin.slice(0, 30), prompt: newPin }]); setNewPin(''); setShowAddPin(false); }}} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '6px 9px', color: '#fff', fontSize: 12, outline: 'none', fontFamily: "'Inter',sans-serif" }} autoFocus />
              <button onClick={() => { if(newPin.trim()){ setPins(p => [...p, { id: Date.now(), label: newPin.slice(0, 30), prompt: newPin }]); setNewPin(''); } setShowAddPin(false); }} style={{ background: T.primary, border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', padding: '0 8px', fontSize: 12, fontWeight: 600 }}>Add</button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {pins.map(p => (
              <div key={p.id} className="pin-row" style={{ display: 'flex', alignItems: 'center' }}>
                <button onClick={() => usePin(p.prompt)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }} className="pin-btn">
                  <span style={{ color: T.accent, display: 'flex', flexShrink: 0 }}>{Ic.star}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.label}</span>
                </button>
                <button onClick={() => setPins(prev => prev.filter(x => x.id !== p.id))} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'none', padding: '4px 6px' }} className="pin-del">{Ic.x}</button>
              </div>
            ))}
          </div>

          {/* Session context */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', fontFamily: "'JetBrains Mono',monospace", marginBottom: 12 }}>TODAY'S CONTEXT</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { icon: Ic.mail, label: '3 urgent emails' },
                { icon: Ic.team, label: 'Mike overdue' },
                { icon: Ic.deploy, label: 'v2.4.2 staging' },
                { icon: Ic.cal, label: '3 meetings' },
              ].map(ctx => (
                <div key={ctx.label} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '6px 8px' }}>
                  <span style={{ color: T.primary, display: 'flex', opacity: 0.8, transform: 'scale(0.9)' }}>{ctx.icon}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ctx.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats footer */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {[
            { label: 'Handled', value: statsCount.handled, c: T.primary },
            { label: 'Saved', value: statsCount.saved, c: '#10b981' },
            { label: 'Actions', value: statsCount.actions, c: T.secondary }
          ].map(stat => (
            <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: stat.c }}>{stat.value}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{stat.label}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ══ MAIN CHAT AREA ══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* TOP BAR */}
        <header style={{ height: 52, background: '#0a0a0d', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0 }}>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 6, borderRadius: 6 }} className="back-btn" title="Expand sidebar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          )}

          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer', fontFamily: "'Inter',sans-serif", fontWeight: 500 }} className="back-btn">
            {Ic.back} Dashboard
          </button>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
            <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, color: '#fff' }}>AI Cockpit</span>
            <div style={{ padding: '2px 8px', borderRadius: 99, background: `${MODES[mode].color}15`, border: `1px solid ${MODES[mode].color}30`, fontSize: 10, fontWeight: 600, color: MODES[mode].color, marginLeft: 4 }}>
              {MODES[mode].label}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', left: 10, color: 'rgba(255,255,255,0.3)', display: 'flex' }}>{Ic.search}</div>
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search..." style={{ padding: '6px 28px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, color: '#fff', fontSize: 12, outline: 'none', width: 160, fontFamily: "'Inter',sans-serif", transition: 'all 0.2s' }} className="sinput" />
              {searchQ && (
                <button onClick={() => setSearchQ('')} style={{ position: 'absolute', right: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', padding: 2 }}>{Ic.x}</button>
              )}
            </div>
          </div>
        </header>

        {/* MESSAGES */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {filteredMsgs.map(msg => (
            <div key={msg.id} className="msg-wrap" style={{ position: 'relative', display: 'flex', justifyContent: msg.r === 'user' ? 'flex-end' : 'flex-start', gap: 12, animation: 'msgIn .25s ease' }}>
              
              {/* Timestamp */}
              <div className="msg-ts" style={{ position: 'absolute', top: -18, [msg.r === 'user' ? 'right' : 'left']: 46, fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: "'JetBrains Mono',monospace", pointerEvents: 'none' }}>
                {new Date(msg.id > 100 ? msg.id : Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>

              {msg.r === 'ai' && (
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg,${T.primary},${T.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, boxShadow: `0 2px 10px ${T.glow}`, marginTop: 2 }}>{Ic.bolt}</div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.r === 'user' ? 'flex-end' : 'flex-start', maxWidth: msg.r === 'ai' ? '75%' : '65%', minWidth: 80 }}>
                
                <div style={{
                  padding: msg.r === 'user' ? '12px 16px' : '14px 16px',
                  borderRadius: msg.r === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                  background: msg.r === 'user' ? `linear-gradient(135deg,${T.primary},${T.secondary})` : 'rgba(255,255,255,0.08)',
                  border: msg.r === 'ai' ? '1px solid rgba(255,255,255,0.09)' : 'none',
                  borderLeft: msg.r === 'ai' ? `3px solid ${T.primary}50` : 'none',
                  fontSize: 14, lineHeight: 1.7, color: '#fff',
                  boxShadow: msg.r === 'user' ? `0 6px 24px ${T.glow}` : 'none',
                  width: '100%'
                }}>
                  {msg.streaming && !msg.done
                    ? <StreamText text={msg.text} onDone={() => setMsgs(p => p.map(m => m.id === msg.id ? { ...m, done: true } : m))} />
                    : <MdText text={msg.text} />}

                  {/* Tool call status badge */}
                  {msg.toolCall && (
                    <ToolStatusBadge label={msg.toolCall.label} />
                  )}

                  {/* Rich card */}
                  {msg.card && msg.done && (
                    <>
                      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '12px -16px' }} />
                      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, margin: '0 -2px' }}>
                        {msg.card === 'email' && (
                          msg.toolResult?.emails?.length > 0
                            ? <RealEmailsCard emails={msg.toolResult.emails} source={msg.toolResult.source} T={T} onDismiss={() => removeCard(msg.id)} />
                            : <EmailCard T={T} onSend={() => { removeCard(msg.id); setStatsCount(p => ({ ...p, saved: p.saved + 1, actions: p.actions + 1 })); }} onDiscard={() => removeCard(msg.id)} />
                        )}
                        {msg.card === 'compose' && msg.toolResult && (
                          <ComposeEmailCard
                            data={msg.toolResult}
                            onSend={(emailData) => {
                              removeCard(msg.id);
                              setStatsCount(p => ({ ...p, saved: p.saved + 1, actions: p.actions + 1 }));
                              setMsgs(p => [...p, { id: Date.now(), r: 'ai', text: `✓ Email to **${emailData.to}** — "${emailData.subject}" sent successfully.`, card: null, done: true }]);
                            }}
                            onDismiss={() => removeCard(msg.id)}
                          />
                        )}
                        {msg.card === 'improve_text' && msg.toolResult?.result && (
                          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, padding: '12px 14px', marginTop: 8 }}>
                            <div style={{ fontSize: 10, color: '#10b981', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>✨ {msg.toolResult.mode} result</div>
                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.toolResult.result}</div>
                            <button
                              onClick={() => { navigator.clipboard.writeText(msg.toolResult.result); removeCard(msg.id); }}
                              style={{ marginTop: 8, padding: '5px 12px', borderRadius: 7, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                            >
                              Copy & use
                            </button>
                          </div>
                        )}
                        {msg.card === 'calendar' && (
                          msg.toolResult?.events?.length > 0
                            ? <RealCalendarCard events={msg.toolResult.events} T={T} onDismiss={() => removeCard(msg.id)} />
                            : <CalendarCard T={T} onConfirm={() => { removeCard(msg.id); setStatsCount(p => ({ ...p, actions: p.actions + 1 })); }} onDiscard={() => removeCard(msg.id)} />
                        )}
                        {msg.card === 'deploy' && <DeployCard T={T} data={msg.toolResult} />}
                        {msg.card === 'team' && <TeamCard data={msg.toolResult} />}
                        {msg.card === 'integrations' && msg.toolResult && (
                          <IntegrationsStatusCard data={msg.toolResult} T={T} onDismiss={() => removeCard(msg.id)} />
                        )}
                        {msg.card === 'analytics' && (
                          <AnalyticsCard data={msg.toolResult} T={T} onDismiss={() => removeCard(msg.id)} />
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                {msg.done && (
                  <div className="msg-actions" style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <button onClick={() => copyMsg(msg.id, msg.text)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, background: 'transparent', border: 'none', color: copiedId === msg.id ? '#10b981' : 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
                      {copiedId === msg.id ? Ic.check : Ic.copy} {copiedId === msg.id ? 'Copied' : 'Copy'}
                    </button>
                    <button onClick={() => setMsgs(p => p.filter(m => m.id !== msg.id))} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
                      {Ic.x} Remove
                    </button>
                  </div>
                )}
              </div>

              {msg.r === 'user' && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, hsl(${(displayName.charCodeAt(0)*47)%360},65%,45%), hsl(${((displayName.charCodeAt(0)*47)+60)%360},65%,55%))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, color: '#fff', flexShrink: 0, marginTop: 2, boxShadow: `0 2px 10px rgba(0,0,0,0.5)` }}>
                  {firstName[0].toUpperCase()}
                </div>
              )}
            </div>
          ))}

          {/* THINKING INDICATOR */}
          {thinking && (
            <div style={{ display: 'flex', gap: 12, animation: 'msgIn .2s ease' }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg,${T.primary},${T.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, boxShadow: `0 2px 10px ${T.glow}` }}>{Ic.bolt}</div>
              <div style={{ flex: 1, maxWidth: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ 
                  height: 3, 
                  borderRadius: 99, 
                  background: `linear-gradient(90deg, transparent, ${T.primary}, ${T.accent}, ${T.secondary}, transparent)`,
                  backgroundSize: '200% 100%',
                  animation: 'thinkSlide 1.5s ease infinite',
                  margin: '8px 0 4px'
                }} />
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', paddingLeft: 8 }}>
                  {thinkMsg}
                </div>
              </div>
            </div>
          )}

          <div ref={endRef} style={{ height: 20 }} />
        </div>

        {/* ══ INPUT AREA ══ */}
        <div style={{ padding: '0 20px 20px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <div style={{ 
            display: 'flex', 
            gap: 8, 
            marginBottom: 16, 
            width: '100%', 
            maxWidth: 800, 
            overflowX: 'auto', 
            flexWrap: 'nowrap', 
            scrollbarWidth: 'none', 
            WebkitOverflowScrolling: 'touch' 
          }} className="chips-container">
            {[
              ['Morning briefing', 'brain'],
              ['Draft CFO reply', 'mail'],
              ['Team standup', 'team'],
              ['Deploy status', 'deploy'],
              ['Schedule meeting', 'cal'],
            ].map(([label, icon]) => (
              <button key={label} onClick={() => { setInput(label); inputRef.current?.focus(); }} style={{ padding: '0 16px', height: 32, borderRadius: 99, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Inter',sans-serif", transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0 }} className="chip-h">
                <span style={{ color: T.primary, display: 'flex' }}>{Ic[icon] || Ic.bolt}</span>{label}
              </button>
            ))}
          </div>

          <div style={{ 
            width: '100%', 
            maxWidth: 800, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 8,
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              background: 'rgba(255,255,255,0.04)', 
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: 20, 
              padding: '10px 14px', 
              transition: 'all 0.25s' 
            }} className="ibar">
              <div style={{ color: T.primary, display: 'flex', flexShrink: 0, paddingLeft: 4 }}>{Ic.bolt}</div>
              
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                placeholder="Message WorkPilot AI..."
                rows={1}
                style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: 14, outline: 'none', resize: 'none', fontFamily: "'Inter',sans-serif", lineHeight: 1.5, maxHeight: 120, overflow: 'auto', padding: '4px 0' }}
              />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={startListening}
                  title="Voice input"
                  style={{ 
                    width: 34, height: 34, borderRadius: '50%', 
                    background: 'rgba(255,255,255,0.05)', 
                    border: isListening ? '1px solid #ef4444' : '1px solid transparent', 
                    color: isListening ? '#ef4444' : 'rgba(255,255,255,0.4)', 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    transition: 'all 0.2s', 
                    animation: isListening ? 'thinkPulse 1s infinite' : 'none' 
                  }}
                  className="mic-btn"
                >
                  {Ic.mic}
                </button>
                <button
                  onClick={sendMsg}
                  disabled={!input.trim() || thinking}
                  style={{ 
                    width: 38, height: 38, borderRadius: '50%', 
                    background: `linear-gradient(135deg,${T.primary},${T.secondary})`, 
                    border: 'none', color: '#fff', 
                    cursor: input.trim() && !thinking ? 'pointer' : 'not-allowed', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    transition: 'all 0.2s', 
                    boxShadow: input.trim() && !thinking ? `0 4px 14px ${T.glow}` : 'none',
                    opacity: input.trim() && !thinking ? 1 : 0.4
                  }}
                >
                  {Ic.send}
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 12px' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Inter',sans-serif" }}>Enter to send · Shift+Enter for newline</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Inter',sans-serif" }}>{input.length}/2000</span>
            </div>
          </div>
        </div>
      </div>

      {/* STYLES */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
        
        .chips-container::-webkit-scrollbar { display: none; }
        
        .sidebar {
          width: 260px;
          min-width: 260px;
          height: 100%;
          background: #08080b;
          border-right: 1px solid rgba(255,255,255,0.07);
          display: flex;
          flex-direction: column;
          transition: margin-left 0.3s ease, transform 0.3s ease;
          z-index: 50;
        }
        .sidebar.closed { margin-left: -260px; }
        @media (max-width: 768px) {
          .sidebar { position: absolute; margin-left: 0; box-shadow: 4px 0 24px rgba(0,0,0,0.5); }
          .sidebar.closed { transform: translateX(-100%); }
        }

        .msg-wrap .msg-actions { opacity: 0; transition: opacity 0.2s; }
        .msg-wrap:hover .msg-actions { opacity: 1; }
        .msg-wrap .msg-ts { opacity: 0; transition: opacity 0.2s; }
        .msg-wrap:hover .msg-ts { opacity: 0.6; }
        
        .chip-h:hover { background: rgba(59,130,246,0.12)!important; border-color: rgba(59,130,246,0.3)!important; color: #3b82f6!important; }
        
        @keyframes thinkSlide { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
        @keyframes thinkPulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.15)} }
        @keyframes msgIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

        .back-btn:hover { color: #fff!important; background: rgba(255,255,255,0.05)!important; }
        .pin-btn:hover { background: rgba(255,255,255,0.06)!important; }
        .pin-row:hover .pin-del { display: flex!important; }
        .sinput:focus { border-color: rgba(59,130,246,0.4)!important; background: rgba(255,255,255,0.08)!important; }
        .ibar:focus-within { border-color: rgba(59,130,246,0.4)!important; box-shadow: 0 0 0 3px rgba(59,130,246,0.1)!important; }
        .mic-btn:hover { background: rgba(255,255,255,0.1)!important; }
      `}</style>
    </div>
  );
}
