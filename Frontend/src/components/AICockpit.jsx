import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SiGmail, SiGooglecalendar, SiGoogledrive, SiGithub, SiZoom, SiNotion, SiJira, SiTrello, SiGooglemeet, SiDuckduckgo } from 'react-icons/si';
import BrandIcon, { SlackIcon } from './BrandIcons';
import ComposeEmailCard from './ComposeEmailCard';
import InteractiveMeetingCard from './InteractiveMeetingCard';
import VisualSlotPickerCard from './VisualSlotPickerCard';
import SafeguardApprovalCard from './SafeguardApprovalCard';
import InteractiveAnalyticsCard from './InteractiveAnalyticsCard';
import InteractiveOptionsCard from './InteractiveOptionsCard';
import PersonalMemoryModal from './PersonalMemoryModal';
import Logo from './Logo';
import { getChatConversations, getChatConversation, deleteChatConversation, uploadDocument, updateAutomation, deleteAutomation, getIntegrations } from '../api';

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

const INTEGRATION_ICONS = {
  gmail: <SiGmail size={14} color="#EA4335" />,
  google_calendar: <SiGooglecalendar size={14} color="#4285F4" />,
  google_drive: <SiGoogledrive size={14} color="#34A853" />,
  github: <SiGithub size={14} color="#fff" />,
  zoom: <SiZoom size={14} color="#2D8CFF" />,
  notion: <SiNotion size={14} color="#fff" />,
  jira: <SiJira size={14} color="#579DFF" />,
  trello: <SiTrello size={14} color="#579DFF" />,
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
  { id: 2, label: 'Draft an email', prompt: 'Help me draft a professional email' },
  { id: 3, label: 'Schedule meeting', prompt: 'Schedule a team sync meeting for tomorrow' },
  { id: 4, label: 'Check integrations', prompt: 'What is the status of my connected integrations?' },
  { id: 5, label: 'Workspace search', prompt: 'Search my workspace for recent updates' },
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

function EmailCard({ T, data, onSend, onDiscard }) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(data?.body || '');
  const to = data?.to || 'Recipient';
  const subject = data?.subject || 'No subject';
  return (
    <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 14, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>{Ic.mail}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono',monospace" }}>EMAIL DRAFT</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>To: {to}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Subject: {subject}</div>
        </div>
      </div>
      <div style={{ padding: '12px 14px' }}>
        {editing ? (
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Type email draft..." style={{ width: '100%', minHeight: 120, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12, lineHeight: 1.7, padding: '10px', outline: 'none', resize: 'vertical', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' }} />
        ) : (
          <pre style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', fontFamily: "'Inter',sans-serif" }}>{body || 'No draft body provided.'}</pre>
        )}
      </div>
      <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(59,130,246,0.1)', display: 'flex', gap: 7 }}>
        <button onClick={() => onSend && onSend({ to, subject, body })} style={{ padding: '7px 14px', borderRadius: 8, background: `linear-gradient(135deg,${T.primary},${T.secondary})`, border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, boxShadow: `0 2px 10px ${T.glow}` }}>✉ Send Now</button>
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

function LiveDataNotice({ source, message, T, onOpenIntegrations }) {
  const isError = source?.endsWith('_error');
  return (
    <div style={{ marginTop: 8, padding: '12px 14px', borderRadius: 12, background: isError ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.07)', border: `1px solid ${isError ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.2)'}` }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: isError ? '#fca5a5' : '#6ee7b7' }}>{isError ? 'Live data unavailable' : 'No live data found'}</div>
      <div style={{ marginTop: 4, fontSize: 11, lineHeight: 1.5, color: 'rgba(255,255,255,0.55)' }}>{message || (isError ? 'The provider returned an error. Reconnect the integration and try again.' : 'The connected account returned no records for this request.')}</div>
      {isError && <button onClick={onOpenIntegrations} style={{ marginTop: 9, padding: '5px 9px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)', color: T.primary, fontSize: 11, cursor: 'pointer' }}>Open Integrations</button>}
    </div>
  );
}

function CalendarCard({ T, data, onConfirm, onDiscard }) {
  const event = data || {};
  return (
    <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid rgba(16,185,129,0.12)', display: 'flex', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>{Ic.cal}</div>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono',monospace" }}>CALENDAR EVENT</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{event.title || 'Scheduled Meeting'}</div>
        </div>
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', gap: 16 }}>
        {[['📅', event.date || 'Upcoming'], ['⏰', event.time || 'TBD'], ['👥', `${(event.attendees || []).length || 0} attendees`], ['📍', event.platform || 'Google Meet']].map(([e, v]) => (
          <div key={e} style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{e}</div>
            <div style={{ fontSize: 12, color: '#fff', fontWeight: 500, marginTop: 2 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(16,185,129,0.1)', display: 'flex', gap: 7 }}>
        <button onClick={onConfirm} style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>✓ Confirm</button>
        <button onClick={onDiscard} style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}

function DeployCard({ T, data, onOpenIntegrations }) {
  const pipelines = data?.pipelines || [];
  const statusColor = { live: '#10b981', in_progress: '#6366f1', failed: '#ef4444', pending: '#f59e0b' };
  const riskColor = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };

  if (!pipelines.length) {
    return (
      <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: '16px', marginTop: 8, textAlign: 'center' }}>
        <div style={{ fontSize: 20, marginBottom: 6 }}>🚀</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>No Active Deployments</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, marginBottom: onOpenIntegrations ? 10 : 0 }}>
          {data?.note || 'Connect your GitHub repository in Integrations to monitor CI/CD pipelines.'}
        </div>
        {onOpenIntegrations && (
          <button onClick={onOpenIntegrations} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
            Connect GitHub
          </button>
        )}
      </div>
    );
  }

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
  const members = data?.members || [];
  const delayed = members.filter(m => m.status === 'delayed' || m.status === 'missing');

  if (!members.length) {
    return (
      <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: '16px', marginTop: 8, textAlign: 'center' }}>
        <div style={{ fontSize: 20, marginBottom: 6 }}>👥</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>No Team Members Configured</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
          {data?.note || 'Configure team members in Workspace Settings to view standups and task status.'}
        </div>
      </div>
    );
  }

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
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20 }}>
              <BrandIcon name={p.name} size={16} />
            </span>
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

function WorkPilotAvatar({ isThinking = false, isStreaming = false, size = 32, glowColor = '#00d2ff', T }) {
  const isPulsing = isThinking || isStreaming;
  return (
    <div
      className={`wp-ai-avatar ${isPulsing ? 'wp-avatar-pulse' : ''}`}
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        background: 'radial-gradient(circle at 35% 35%, rgba(15, 23, 42, 0.95), rgba(7, 10, 18, 0.98))',
        border: `1px solid ${isPulsing ? 'rgba(0, 210, 255, 0.5)' : 'rgba(255, 255, 255, 0.12)'}`,
        boxShadow: isPulsing
          ? '0 0 16px rgba(0, 210, 255, 0.45), inset 0 0 8px rgba(139, 92, 246, 0.3)'
          : '0 2px 10px rgba(0, 0, 0, 0.5), inset 0 0 6px rgba(0, 210, 255, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        transition: 'all 0.3s ease',
        marginTop: 2,
        overflow: 'hidden',
      }}
    >
      {/* Animated rotating accent halo when active/thinking */}
      {isPulsing && (
        <div
          style={{
            position: 'absolute',
            inset: -6,
            background: 'conic-gradient(from 0deg, transparent 0deg, rgba(0, 210, 255, 0.45) 90deg, transparent 180deg, rgba(139, 92, 246, 0.45) 270deg, transparent 360deg)',
            animation: 'wpSpin 3.5s linear infinite',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
      )}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Logo height={Math.round(size * 0.76)} showText={false} glowColor={isPulsing ? '#00d2ff' : glowColor} />
      </div>
    </div>
  );
}

function AnalyticsCard({ data, T, onDismiss }) {
  const d = data || {};
  const stats = [
    { label: 'Focus Hours', value: d.focus_hours ?? '0.0', unit: 'hrs', color: T?.primary || '#3b82f6' },
    { label: 'Emails Handled', value: d.emails_handled ?? 0, unit: '', color: '#10b981' },
    { label: 'Tasks Done', value: d.tasks_completed ?? 0, unit: '', color: '#f59e0b' },
    { label: 'AI Time Saved', value: d.ai_time_saved ?? '0.0', unit: 'hrs', color: T?.secondary || '#7c3aed' },
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


/** Enhanced markdown renderer: tables, headers, lists, code blocks, links, quotes, and Generative UI cards */
function normalizeArtifactTags(str) {
  if (!str || typeof str !== 'string') return str;
  let result = str;

  // 1. Convert XML-style <artifact:...> to ```artifact:...
  if (result.includes('<artifact:')) {
    const pattern = /<artifact:([a-zA-Z0-9_:-]+)\s*([\s\S]*?)(?:\/>|<\/artifact:\1>)/g;
    result = result.replace(pattern, (match, tag, attrs) => {
      try {
        const titleMatch = attrs.match(/title=["']([^"']+)["']/);
        const descMatch = attrs.match(/description=["']([^"']+)["']/);
        const submitMatch = attrs.match(/submit_label=["']([^"']+)["']/);
        const optMatch = attrs.match(/options=\{?(\[[\s\S]*?\])\}?/);
        const slotsMatch = attrs.match(/slots=\{?(\[[\s\S]*?\])\}?/);
        
        const payload = {
          title: titleMatch ? titleMatch[1] : undefined,
          description: descMatch ? descMatch[1] : undefined,
          submit_label: submitMatch ? submitMatch[1] : undefined,
        };

        if (optMatch) {
          try { payload.options = JSON.parse(optMatch[1]); } catch {}
        }
        if (slotsMatch) {
          try { payload.slots = JSON.parse(slotsMatch[1]); } catch {}
        }

        let resolvedTag = tag;
        if (tag === 'slot_picker' && payload.options && (!payload.slots || payload.slots.length === 0)) {
          resolvedTag = 'options';
        }

        return `\n\`\`\`artifact:${resolvedTag}\n${JSON.stringify(payload, null, 2)}\n\`\`\`\n`;
      } catch (e) {
        return match;
      }
    });
  }

  // 2. Auto-wrap bare JSON confirmation cards so users get interactive buttons instead of raw code
  const bareJsonPattern = /(?:^|\n)(\{\s*"title":\s*"[^"]*",[\s\S]*?"(?:confirmLabel|cancelLabel|details|risk_level)":[\s\S]*?\})(\n|$)/g;
  result = result.replace(bareJsonPattern, (match, jsonBlock, trailing) => {
    // If it's already inside a fenced code block, leave it alone
    if (match.includes('```')) return match;
    try {
      const parsed = JSON.parse(jsonBlock);
      const safeguardPayload = {
        title: parsed.title || 'Action Confirmation',
        description: parsed.description || '',
        action: parsed.action || parsed.tool || 'schedule_automation',
        tool: parsed.tool || parsed.action || 'schedule_automation',
        risk_level: parsed.risk_level || 'medium',
        args: parsed.args || parsed.config || {},
        confirmLabel: parsed.confirmLabel || parsed.submit_label || '✅ Activate Sequence',
        cancelLabel: parsed.cancelLabel || '❌ Cancel',
        details: parsed.details || [],
      };
      return `\n\`\`\`artifact:safeguard\n${JSON.stringify(safeguardPayload, null, 2)}\n\`\`\`${trailing}`;
    } catch {
      return match;
    }
  });

  return result;
}

function MdText({ text, onSelectOption }) {
  if (!text) return null;
  
  const cleanText = normalizeArtifactTags(text);
  const lines = cleanText.split('\n');
  const elements = [];
  let inTable = false;
  let tableRows = [];
  let inCodeBlock = false;
  let codeLines = [];
  let codeLang = '';
  
  // Helper: Parse inline markdown (bold, italic, code, links)
  const parseInline = (str, isTableCell = false) => {
    // Regex for: **bold**, *italic*, `code`, [link](url)
    const parts = str.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
    return parts.map((part, pi) => {
      // Bold
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={pi} style={{ color: '#fff', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      // Italic
      if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**'))
        return <em key={pi} style={{ color: 'rgba(255,255,255,0.85)', fontStyle: 'italic' }}>{part.slice(1, -1)}</em>;
      // Inline code
      if (part.startsWith('`') && part.endsWith('`')) {
        const val = part.slice(1, -1);
        const isClickable = isTableCell && (val.includes('/') || val.includes('-') || val.length > 5);
        return (
          <code
            key={pi}
            onClick={() => {
              if (onSelectOption && isClickable) {
                onSelectOption(val);
              } else {
                navigator.clipboard?.writeText?.(val);
              }
            }}
            title={isClickable ? `Click to select ${val}` : 'Click to copy'}
            style={{ 
              background: isClickable ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.08)', 
              border: isClickable ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.08)',
              padding: '2px 7px', 
              borderRadius: '5px', 
              fontSize: '12px',
              fontFamily: "'JetBrains Mono', monospace",
              color: isClickable ? '#a5b4fc' : '#10b981',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'inline-block',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99,102,241,0.25)';
              e.currentTarget.style.borderColor = '#818cf8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isClickable ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.08)';
              e.currentTarget.style.borderColor = isClickable ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)';
            }}
          >
            {val}
          </code>
        );
      }
      // Links: [text](url)
      const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        return <a key={pi} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" style={{
          color: '#3b82f6',
          textDecoration: 'underline',
          cursor: 'pointer'
        }}>{linkMatch[1]}</a>;
      }
      return <span key={pi}>{part}</span>;
    });
  };
  
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    
    // Code block detection: ```lang
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLang = line.trim().slice(3).trim() || 'text';
        codeLines = [];
      } else {
        // End of code block
        if (codeLang.startsWith('artifact:')) {
          try {
            const rawJson = codeLines.join('\n').trim();
            const artifactData = JSON.parse(rawJson);
            if (codeLang === 'artifact:meeting') {
              elements.push(<InteractiveMeetingCard key={`artifact-${li}`} data={artifactData} />);
            } else if (codeLang === 'artifact:options' || codeLang === 'artifact:choice_picker' || codeLang === 'artifact:repository_picker') {
              elements.push(<InteractiveOptionsCard key={`artifact-${li}`} data={artifactData} onSelectOption={onSelectOption} />);
            } else if (codeLang === 'artifact:slot_picker') {
              if (artifactData.options && (!artifactData.slots || artifactData.slots.length === 0)) {
                elements.push(<InteractiveOptionsCard key={`artifact-${li}`} data={artifactData} onSelectOption={onSelectOption} />);
              } else {
                elements.push(<VisualSlotPickerCard key={`artifact-${li}`} data={artifactData} onSlotSelected={(slot) => onSelectOption && onSelectOption(`${slot.date} at ${slot.time}`)} />);
              }
            } else if (codeLang === 'artifact:safeguard') {
              elements.push(<SafeguardApprovalCard key={`artifact-${li}`} data={artifactData} />);
            } else if (codeLang === 'artifact:analytics') {
              elements.push(<InteractiveAnalyticsCard key={`artifact-${li}`} data={artifactData} />);
            } else {
              elements.push(
                <div key={`code-${li}`} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', margin: '12px 0', overflow: 'auto' }}>
                  <pre style={{ margin: 0, fontSize: '12px', color: '#10b981', whiteSpace: 'pre-wrap' }}>{rawJson}</pre>
                </div>
              );
            }
          } catch (e) {
            elements.push(
              <div key={`code-${li}`} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', margin: '12px 0', overflow: 'auto' }}>
                <pre style={{ margin: 0, fontSize: '12px', color: '#10b981', whiteSpace: 'pre-wrap' }}>{codeLines.join('\n')}</pre>
              </div>
            );
          }
        } else {
          elements.push(
            <div key={`code-${li}`} style={{
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: '10px',
              padding: '12px 14px',
              margin: '12px 0',
              overflow: 'auto',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
            }}>
              <div style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.4)',
                marginBottom: '8px',
                fontFamily: "'JetBrains Mono', monospace",
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>{codeLang}</div>
              <pre style={{
                margin: 0,
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace",
                color: '#34d399',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>{codeLines.join('\n')}</pre>
            </div>
          );
        }
        inCodeBlock = false;
        codeLines = [];
        codeLang = '';
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }
    
    // Table detection: starts with |
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      tableRows.push(line);
      
      // Check if next line is not a table row (end of table)
      if (li === lines.length - 1 || !lines[li + 1]?.trim().startsWith('|')) {
        // Render table
        elements.push(
          <div key={`table-wrap-${li}`} style={{
            margin: '14px 0',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px'
            }}>
              <tbody>
                {tableRows.map((row, ri) => {
                  const cells = row.split('|').filter(c => c.trim());
                  const isHeader = ri === 0;
                  const isSeparator = ri === 1 && row.includes('---');
                  
                  if (isSeparator) return null; // Skip separator row
                  
                  return (
                    <tr
                      key={ri}
                      style={{
                        borderBottom: isHeader ? '2px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.04)',
                        background: isHeader ? 'rgba(255,255,255,0.05)' : (ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'),
                        transition: 'background 0.18s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isHeader) e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isHeader) e.currentTarget.style.background = (ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)');
                      }}
                    >
                      {cells.map((cell, ci) => {
                        const Tag = isHeader ? 'th' : 'td';
                        const content = parseInline(cell.trim(), true);
                        
                        return (
                          <Tag key={ci} style={{
                            padding: '11px 14px',
                            textAlign: 'left',
                            fontWeight: isHeader ? 600 : 400,
                            color: isHeader ? '#f1f5f9' : 'rgba(255,255,255,0.88)',
                            fontSize: '13px',
                            letterSpacing: isHeader ? '0.2px' : '0',
                          }}>
                            {content}
                          </Tag>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        inTable = false;
        tableRows = [];
      }
      continue;
    }
    
    // Blockquotes: > text
    if (line.trim().startsWith('> ')) {
      elements.push(
        <div key={li} style={{
          borderLeft: '3px solid #6366f1',
          background: 'rgba(99, 102, 241, 0.06)',
          borderRadius: '0 8px 8px 0',
          padding: '8px 14px',
          marginLeft: '2px',
          marginTop: '8px',
          marginBottom: '8px',
          color: 'rgba(255,255,255,0.85)',
          fontSize: '13px',
        }}>
          {parseInline(line.trim().slice(2))}
        </div>
      );
      continue;
    }
    
    // Horizontal rule: --- or ***
    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(
        <hr key={li} style={{
          border: 'none',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          margin: '16px 0'
        }} />
      );
      continue;
    }
    
    // Headers: ###, ##, or #
    if (line.startsWith('###')) {
      elements.push(
        <h4 key={li} style={{ 
          fontSize: '14px', 
          fontWeight: 600, 
          color: '#f8fafc', 
          margin: '14px 0 6px 0',
          letterSpacing: '0.2px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          {parseInline(line.replace(/^###\s*/, ''))}
        </h4>
      );
      continue;
    }
    if (line.startsWith('##')) {
      elements.push(
        <h3 key={li} style={{ 
          fontSize: '15px', 
          fontWeight: 700, 
          color: '#fff', 
          margin: '16px 0 8px 0',
          letterSpacing: '0.3px',
          paddingLeft: '8px',
          borderLeft: '3px solid #6366f1',
        }}>
          {parseInline(line.replace(/^##\s*/, ''))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('#')) {
      elements.push(
        <h2 key={li} style={{ 
          fontSize: '17px', 
          fontWeight: 800, 
          color: '#fff', 
          margin: '18px 0 10px 0',
          letterSpacing: '0.4px',
          paddingLeft: '10px',
          borderLeft: '4px solid #818cf8',
        }}>
          {parseInline(line.replace(/^#\s*/, ''))}
        </h2>
      );
      continue;
    }
    
    // Numbered lists: 1. item
    if (line.trim().match(/^\d+\.\s/)) {
      const content = line.trim().replace(/^\d+\.\s/, '');
      const num = line.trim().match(/^(\d+)\./)[1];
      elements.push(
        <div key={li} style={{ 
          display: 'flex', 
          gap: '10px', 
          marginLeft: '2px', 
          marginTop: '6px',
          alignItems: 'flex-start'
        }}>
          <span style={{ 
            background: 'rgba(99, 102, 241, 0.2)',
            color: '#a5b4fc',
            minWidth: '20px',
            height: '20px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '11px',
            flexShrink: 0,
            marginTop: '2px'
          }}>{num}</span>
          <span style={{ flex: 1, fontSize: '13.5px' }}>{parseInline(content)}</span>
        </div>
      );
      continue;
    }
    
    // Bullet lists: - or *
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const content = line.trim().slice(2);
      elements.push(
        <div key={li} style={{ 
          display: 'flex', 
          gap: '10px', 
          marginLeft: '4px', 
          marginTop: '4px',
          alignItems: 'flex-start'
        }}>
          <span style={{ color: '#818cf8', marginTop: '2px', fontSize: '14px' }}>•</span>
          <span style={{ flex: 1, fontSize: '13.5px' }}>{parseInline(content)}</span>
        </div>
      );
      continue;
    }
    
    // Regular text with inline formatting
    const inline = parseInline(line);
    
    elements.push(
      <div key={li} style={{ 
        marginTop: line.trim() === '' ? '10px' : '3px',
        lineHeight: '1.65',
        fontSize: '13.5px',
        color: 'rgba(255,255,255,0.92)'
      }}>
        {inline}
      </div>
    );
  }
  
  return <>{elements}</>;
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
  const getBrandIcon = (text) => {
    if (!text) return '🤖';
    const lower = text.toLowerCase();
    if (lower.includes('email') || lower.includes('gmail')) {
      return (
        <span style={{ width: 16, height: 16, borderRadius: 4, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
          <SiGmail size={11} color="#EA4335" />
        </span>
      );
    }
    if (lower.includes('calendar') || lower.includes('schedule') || lower.includes('event')) {
      return (
        <span style={{ width: 16, height: 16, borderRadius: 4, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
          <SiGooglecalendar size={11} color="#4285F4" />
        </span>
      );
    }
    if (lower.includes('meet')) {
      return (
        <span style={{ width: 16, height: 16, borderRadius: 4, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
          <SiGooglemeet size={11} color="#00AC47" />
        </span>
      );
    }
    if (lower.includes('notion')) {
      return (
        <span style={{ width: 16, height: 16, borderRadius: 4, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
          <SiNotion size={11} color="#000000" />
        </span>
      );
    }
    if (lower.includes('github')) {
      return (
        <span style={{ width: 16, height: 16, borderRadius: 4, background: '#181717', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
          <SiGithub size={11} color="#ffffff" />
        </span>
      );
    }
    if (lower.includes('jira')) {
      return (
        <span style={{ width: 16, height: 16, borderRadius: 4, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
          <SiJira size={11} color="#0052CC" />
        </span>
      );
    }
    if (lower.includes('slack')) {
      return (
        <span style={{ width: 16, height: 16, borderRadius: 4, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
          <SlackIcon size={11} />
        </span>
      );
    }
    if (lower.includes('zoom')) {
      return (
        <span style={{ width: 16, height: 16, borderRadius: 4, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
          <SiZoom size={11} color="#2D8CFF" />
        </span>
      );
    }
    if (lower.includes('search')) {
      return (
        <span style={{ width: 16, height: 16, borderRadius: 4, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
          <SiDuckduckgo size={11} color="#DE5833" />
        </span>
      );
    }
    if (lower.includes('briefing') || lower.includes('triage') || lower.includes('cross-search')) {
      return (
        <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 1.5 }}>
            <SiGooglecalendar size={10} color="#4285F4" />
          </span>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 1.5 }}>
            <SiGmail size={10} color="#EA4335" />
          </span>
        </span>
      );
    }
    if (lower.includes('teams') || lower.includes('microsoft_teams') || lower.includes('msteams')) {
      return <BrandIcon name="microsoft_teams" size={14} />;
    }
    if (lower.includes('outlook')) {
      return <BrandIcon name="outlook" size={14} />;
    }
    if (lower.includes('drive')) {
      return <BrandIcon name="google_drive" size={14} />;
    }
    if (lower.includes('trello')) {
      return <BrandIcon name="trello" size={14} />;
    }
    if (lower.includes('microsoft') || lower.includes('m365') || lower.includes('office')) {
      return <BrandIcon name="microsoft_365" size={14} />;
    }
    if (lower.includes('team')) return '👥';
    if (lower.includes('deploy')) return '🚀';
    if (lower.includes('analytics')) return '📊';
    return <Logo height={12} showText={false} glowColor="#00d2ff" />;
  };

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: '5px 12px', borderRadius: 20, marginTop: 8,
      background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
      fontSize: 12, color: 'rgba(255,255,255,0.85)',
      animation: 'fadeIn 0.3s ease'
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>{getBrandIcon(label)}</span>
      <span>{label}</span>
      <span style={{ display: 'flex', gap: 3, marginLeft: 2 }}>
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
   AUTONOMOUS WORKFLOW PROGRESS ACCORDION
══════════════════════════════════════ */
function formatStepTitle(title) {
  if (!title) return '';
  const friendlyMap = {
    get_emails: 'Gmail Inbox',
    get_calendar_events: 'Google Calendar',
    create_calendar_event: 'Google Calendar Event',
    create_meet_and_email: 'Google Meet',
    compose_email: 'Gmail Draft',
    notion_tool: 'Notion Workspace',
    github_tool: 'GitHub',
    jira_tool: 'Jira Backlog',
    slack_tool: 'Slack',
    zoom_tool: 'Zoom',
    web_search: 'Web Search',
    prepare_meeting_briefing: 'Meeting Briefing',
    inbox_triage_workflow: 'Inbox Triage & Schedule',
    workspace_cross_search: '360° Workspace Cross-Search',
    get_team_members: 'Team Roster',
    get_deployments: 'Deployments',
    get_analytics: 'Analytics',
    get_integrations_status: 'Integrations',
    improve_text: 'Text Polish',
    schedule_automation: 'Automation',
    generate_report: 'Report Generation',
    find_meeting_time: 'Availability Check',
    task_management: 'Task Manager',
    diagnose_issue: 'Diagnostics',
    set_reminder: 'Reminder',
  };

  let formatted = title;
  for (const [key, label] of Object.entries(friendlyMap)) {
    formatted = formatted.replace(new RegExp(`\\b${key}\\b`, 'g'), label);
  }
  return formatted;
}

function WorkflowProgressAccordion({ steps = [], done = false, T }) {
  const [isExpanded, setIsExpanded] = useState(!done);

  const toolLabels = {
    get_emails: {
      icon: <SiGmail size={12} color="#EA4335" />,
      iconBg: '#ffffff',
      name: 'Gmail Inbox',
      brandBg: 'rgba(234, 67, 53, 0.1)',
      brandBorder: 'rgba(234, 67, 53, 0.3)',
      brandColor: '#fca5a5'
    },
    get_calendar_events: {
      icon: <SiGooglecalendar size={12} color="#4285F4" />,
      iconBg: '#ffffff',
      name: 'Google Calendar',
      brandBg: 'rgba(66, 133, 244, 0.1)',
      brandBorder: 'rgba(66, 133, 244, 0.3)',
      brandColor: '#93c5fd'
    },
    compose_email: {
      icon: <SiGmail size={12} color="#EA4335" />,
      iconBg: '#ffffff',
      name: 'Gmail Draft',
      brandBg: 'rgba(234, 67, 53, 0.1)',
      brandBorder: 'rgba(234, 67, 53, 0.3)',
      brandColor: '#fca5a5'
    },
    create_calendar_event: {
      icon: <SiGooglecalendar size={12} color="#4285F4" />,
      iconBg: '#ffffff',
      name: 'Google Calendar Event',
      brandBg: 'rgba(66, 133, 244, 0.1)',
      brandBorder: 'rgba(66, 133, 244, 0.3)',
      brandColor: '#93c5fd'
    },
    create_meet_and_email: {
      icon: <SiGooglemeet size={12} color="#00AC47" />,
      iconBg: '#ffffff',
      name: 'Google Meet',
      brandBg: 'rgba(0, 172, 71, 0.1)',
      brandBorder: 'rgba(0, 172, 71, 0.3)',
      brandColor: '#86efac'
    },
    notion_tool: {
      icon: <SiNotion size={12} color="#000000" />,
      iconBg: '#ffffff',
      name: 'Notion Workspace',
      brandBg: 'rgba(255, 255, 255, 0.08)',
      brandBorder: 'rgba(255, 255, 255, 0.22)',
      brandColor: '#ffffff'
    },
    github_tool: {
      icon: <SiGithub size={12} color="#ffffff" />,
      iconBg: '#181717',
      name: 'GitHub',
      brandBg: 'rgba(255, 255, 255, 0.08)',
      brandBorder: 'rgba(255, 255, 255, 0.22)',
      brandColor: '#ffffff'
    },
    jira_tool: {
      icon: <SiJira size={12} color="#0052CC" />,
      iconBg: '#ffffff',
      name: 'Jira Backlog',
      brandBg: 'rgba(0, 82, 204, 0.12)',
      brandBorder: 'rgba(0, 82, 204, 0.3)',
      brandColor: '#93c5fd'
    },
    slack_tool: {
      icon: <SlackIcon size={12} />,
      iconBg: '#ffffff',
      name: 'Slack',
      brandBg: 'rgba(224, 30, 90, 0.1)',
      brandBorder: 'rgba(224, 30, 90, 0.28)',
      brandColor: '#f9a8d4'
    },
    zoom_tool: {
      icon: <SiZoom size={12} color="#2D8CFF" />,
      iconBg: '#ffffff',
      name: 'Zoom Video',
      brandBg: 'rgba(45, 140, 255, 0.1)',
      brandBorder: 'rgba(45, 140, 255, 0.28)',
      brandColor: '#93c5fd'
    },
    web_search: {
      icon: <SiDuckduckgo size={12} color="#DE5833" />,
      iconBg: '#ffffff',
      name: 'DuckDuckGo Search',
      brandBg: 'rgba(222, 88, 51, 0.1)',
      brandBorder: 'rgba(222, 88, 51, 0.28)',
      brandColor: '#fdba74'
    },
    prepare_meeting_briefing: {
      icon: (
        <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 1.5 }}>
            <SiGooglecalendar size={10} color="#4285F4" />
          </span>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 1.5 }}>
            <SiGmail size={10} color="#EA4335" />
          </span>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 1.5 }}>
            <SiNotion size={10} color="#000000" />
          </span>
        </span>
      ),
      name: 'Briefing Dossier',
      brandBg: 'rgba(99, 102, 241, 0.12)',
      brandBorder: 'rgba(99, 102, 241, 0.3)',
      brandColor: '#c7d2fe'
    },
    inbox_triage_workflow: {
      icon: (
        <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 1.5 }}>
            <SiGmail size={10} color="#EA4335" />
          </span>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 1.5 }}>
            <SiGooglecalendar size={10} color="#4285F4" />
          </span>
        </span>
      ),
      name: 'Inbox Triage & Schedule',
      brandBg: 'rgba(234, 67, 53, 0.1)',
      brandBorder: 'rgba(234, 67, 53, 0.28)',
      brandColor: '#fca5a5'
    },
    workspace_cross_search: {
      icon: (
        <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 1.5 }}>
            <SiGmail size={10} color="#EA4335" />
          </span>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 1.5 }}>
            <SiGooglecalendar size={10} color="#4285F4" />
          </span>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: '#181717', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 1.5 }}>
            <SiGithub size={10} color="#ffffff" />
          </span>
        </span>
      ),
      name: '360° Cross-Search',
      brandBg: 'rgba(99, 102, 241, 0.12)',
      brandBorder: 'rgba(99, 102, 241, 0.3)',
      brandColor: '#c7d2fe'
    },
    get_team_members: { icon: '👥', name: 'Team Roster' },
    get_deployments: { icon: '🚀', name: 'Deployments' },
    get_analytics: { icon: '📊', name: 'Productivity Analytics' },
    get_integrations_status: { icon: '🔗', name: 'Connected Platforms' },
    improve_text: { icon: '✨', name: 'AI Copy Editor' },
    schedule_automation: { icon: <Logo height={12} showText={false} glowColor="#00d2ff" />, name: 'Automations Engine' },
    generate_report: { icon: '📋', name: 'Executive Report' },
    find_meeting_time: { icon: '🕐', name: 'Calendar Availability' },
    task_management: { icon: '✅', name: 'Task Manager' },
    diagnose_issue: { icon: '🔬', name: 'System Diagnostics' },
    set_reminder: { icon: '⏰', name: 'Smart Reminders' },
  };

  if (!steps || steps.length === 0) return null;

  const completedCount = steps.filter(s => s.status === 'completed' || done).length;

  return (
    <div style={{
      marginTop: 10,
      marginBottom: 6,
      borderRadius: 12,
      background: 'rgba(99, 102, 241, 0.07)',
      border: '1px solid rgba(99, 102, 241, 0.22)',
      overflow: 'hidden',
      transition: 'all 0.2s ease',
      width: '100%',
    }}>
      {/* Header */}
      <div
        onClick={() => setIsExpanded(p => !p)}
        style={{
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          background: 'rgba(99, 102, 241, 0.1)',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 20,
            height: 20,
            borderRadius: 6,
            background: 'rgba(0, 210, 255, 0.15)',
            border: '1px solid rgba(0, 210, 255, 0.3)',
          }}>
            <Logo height={13} showText={false} glowColor="#00d2ff" />
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#e0e7ff', letterSpacing: '0.02em' }}>
            Autonomous Multi-Hop Workflow
          </span>
          <span style={{
            fontSize: 10,
            padding: '2px 7px',
            borderRadius: 10,
            background: done || completedCount === steps.length ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.25)',
            color: done || completedCount === steps.length ? '#6ee7b7' : '#c7d2fe',
            fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {done || completedCount === steps.length ? `✓ ${steps.length} hops completed` : `${completedCount}/${steps.length} hops`}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>{isExpanded ? 'Hide' : 'Details'}</span>
          <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
        </div>
      </div>

      {/* Expanded Step Timeline */}
      {isExpanded && (
        <div style={{ padding: '10px 14px 12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;
            const isCompleted = step.status === 'completed' || done;
            return (
              <div key={step.hop || idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', position: 'relative' }}>
                {/* Connector line */}
                {!isLast && (
                  <div style={{
                    position: 'absolute',
                    top: 18,
                    left: 9,
                    width: 2,
                    height: 'calc(100% + 6px)',
                    background: isCompleted ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255, 255, 255, 0.12)',
                    zIndex: 0,
                  }} />
                )}

                {/* Status Dot */}
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: isCompleted
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(99, 102, 241, 0.25)',
                  border: `1.5px solid ${isCompleted ? '#10b981' : '#818cf8'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  color: isCompleted ? '#34d399' : '#c7d2fe',
                  flexShrink: 0,
                  zIndex: 1,
                  boxShadow: !isCompleted ? '0 0 8px rgba(129, 140, 248, 0.5)' : 'none',
                }}>
                  {isCompleted ? '✓' : step.hop || idx + 1}
                </div>

                {/* Step Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#f3f4f6' }}>
                      {formatStepTitle(step.title) || `Hop ${step.hop}`}
                    </span>
                    {step.time && (
                      <span style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.35)', fontFamily: "'JetBrains Mono', monospace" }}>
                        {step.time}
                      </span>
                    )}
                  </div>
                  
                  {/* Chained tools tags with REAL brand logos */}
                  {step.tools && step.tools.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 5 }}>
                      {step.tools.map((tname) => {
                        const meta = toolLabels[tname] || { icon: '⚙️', name: tname };
                        return (
                          <span
                            key={tname}
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '3px 9px',
                              borderRadius: 8,
                              background: meta.brandBg || 'rgba(255, 255, 255, 0.05)',
                              border: `1px solid ${meta.brandBorder || 'rgba(255, 255, 255, 0.12)'}`,
                              color: meta.brandColor || '#f3f4f6',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
                            }}
                          >
                            {meta.iconBg ? (
                              <span style={{
                                width: 17,
                                height: 17,
                                borderRadius: 4,
                                background: meta.iconBg,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 2,
                                flexShrink: 0,
                                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                              }}>
                                {meta.icon}
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                {meta.icon}
                              </span>
                            )}
                            <span>{meta.name}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


/* ══════════════════════════════════════
   AI MESSAGE RESPONSES
══════════════════════════════════════ */
const AI_RESPONSES = {
  default: (q) => ({
    text: `I've analyzed your request: "${q.slice(0, 60)}". Checking your connected workspace integrations now.`,
    card: null,
  }),
  morning: {
    text: "Good morning! I've checked your workspace status. All integrations and automations are actively monitored. What would you like to prioritize today?",
    card: null,
  },
  email: {
    text: "I can help you draft or send an email. Please specify the recipient email, subject, and any notes to include.",
    card: 'compose',
  },
  deploy: {
    text: "Here is your deployment status across connected repositories:",
    card: 'deploy',
  },
  team: {
    text: "Here is your team activity and progress overview:",
    card: 'team',
  },
  meeting: {
    text: "I can schedule a meeting on your Google Calendar. What time, date, and attendees would you like to invite?",
    card: 'calendar',
  },
};

function getAIResponse(input) {
  const q = input.toLowerCase();
  if (q.includes('morning') || q.includes('brief')) return AI_RESPONSES.morning;
  if (q.includes('email') || q.includes('draft')) return AI_RESPONSES.email;
  if (q.includes('deploy') || q.includes('staging')) return AI_RESPONSES.deploy;
  if (q.includes('team') || q.includes('standup')) return AI_RESPONSES.team;
  if (q.includes('meeting') || q.includes('schedule') || q.includes('calendar')) return AI_RESPONSES.meeting;
  return AI_RESPONSES.default(input);
}

function TasksCard({ data, T, onDismiss }) {
  const PRIORITY_COLOR = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
  const STATUS_ICON = { pending: '⏳', in_progress: '🔄', completed: '✅' };
  const tasks = data?.tasks || [];
  return (
    <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✅</div>
        <div style={{ flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono',monospace" }}>
          TASKS · {data?.pending ?? 0} pending · {data?.in_progress ?? 0} in progress
        </div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16 }}>×</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {tasks.slice(0, 6).map((t, i) => (
          <div key={t.id || i} style={{ padding: '9px 14px', borderBottom: i < tasks.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13 }}>{STATUS_ICON[t.status] || '⏳'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>Due: {t.due_date || '—'} · {t.assignee || 'Unassigned'}</div>
            </div>
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: `${PRIORITY_COLOR[t.priority] || '#f59e0b'}18`, border: `1px solid ${PRIORITY_COLOR[t.priority] || '#f59e0b'}40`, color: PRIORITY_COLOR[t.priority] || '#f59e0b', flexShrink: 0 }}>{t.priority}</span>
          </div>
        ))}
      </div>
      {tasks.length === 0 && <div style={{ padding: '14px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>No tasks found. Try "Add task [title]"</div>}
    </div>
  );
}

function AutomationCard({ data, T, onDismiss }) {
  const [active, setActive] = useState(data?.status !== 'paused');
  const changeStatus = (nextActive) => {
    setActive(nextActive);
    updateAutomation(data?.id, { status: nextActive ? 'active' : 'paused' }).catch(() => setActive(!nextActive));
  };
  return (
    <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 14, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(0,210,255,0.15)', border: '1px solid rgba(0,210,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Logo height={13} showText={false} glowColor="#00d2ff" />
        </div>
        <div style={{ flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono',monospace" }}>AUTOMATION CREATED</div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16 }}>×</button>
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{data?.name || 'Automation'}</span>
          <button onClick={() => changeStatus(!active)} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, background: active ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.12)', border: `1px solid ${active ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`, color: active ? '#10b981' : '#f59e0b', cursor: 'pointer' }}>{active ? '● Active' : 'Ⅱ Paused'}</button>
        </div>
        {[['Schedule', data?.schedule_human || data?.schedule || '—'], ['Next Run', data?.next_run || 'Tomorrow 08:00'], ['Type', data?.type?.replace('_', ' ') || 'custom']].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>{k}</span>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{v}</span>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 7, marginTop: 3 }}>
          <button onClick={() => changeStatus(true)} style={{ flex: 1, padding: '7px 8px', borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 11 }}>Activate</button>
          <button onClick={() => { deleteAutomation(data?.id).catch(() => {}); onDismiss(); }} style={{ padding: '7px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 11 }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ data, T, onDismiss }) {
  const s = data?.sections || {};
  const stats = [
    { label: 'Emails Sent', value: s.emails?.sent ?? 15, color: '#3b82f6' },
    { label: 'Team On-Track', value: s.team?.on_track ?? 3, color: '#10b981' },
    { label: 'Deployments', value: s.deployments?.successful ?? 2, color: '#6366f1' },
    { label: 'Productivity', value: `${s.productivity?.score ?? 87}%`, color: '#f59e0b' },
  ];
  return (
    <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 14, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>📋</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono',monospace" }}>{data?.report_type?.toUpperCase() || 'WEEKLY'} REPORT · {data?.period || 'This Week'}</div>
        </div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16 }}>×</button>
      </div>
      {s.summary && <div style={{ padding: '10px 14px', fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{s.summary}</div>}
      <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {stats.map(stat => (
          <div key={stat.label} style={{ padding: '8px 10px', borderRadius: 8, background: `${stat.color}10`, border: `1px solid ${stat.color}25` }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>{stat.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: stat.color, fontFamily: "'JetBrains Mono',monospace" }}>{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MeetingTimeCard({ data, T, onDismiss }) {
  const slots = data?.suggestions || [];
  return (
    <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🕐</div>
        <div style={{ flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono',monospace" }}>AVAILABLE TIME SLOTS · {data?.duration_minutes || 30} min</div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16 }}>×</button>
      </div>
      <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {slots.map((slot, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: i === 0 ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${i === 0 ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
            {i === 0 && <span style={{ fontSize: 10, color: '#10b981', fontWeight: 700 }}>BEST</span>}
            <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', flex: 1 }}>{slot.date} at {slot.time}</span>
            <span style={{ fontSize: 10, color: slot.conflicts === 0 ? '#10b981' : '#f59e0b' }}>{slot.conflicts === 0 ? '✓ No conflicts' : `${slot.conflicts} conflict`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreatedEventCard({ data, T, onDismiss }) {
  return (
    <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 14, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>📅</div>
        <div style={{ flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono',monospace" }}>EVENT SCHEDULED · {data?.source === 'google_calendar' ? 'Google Calendar' : 'Calendar'}</div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16 }}>×</button>
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{data?.title || data?.event?.title || 'New Event'}</div>
        {[
          ['📅 Date', data?.date || data?.event?.date || '—'],
          ['⏰ Time', `${data?.time || data?.event?.time || '—'} (${data?.duration_minutes || 30} min)`],
          ['👥 Attendees', (data?.attendees || data?.event?.attendees || []).join(', ') || 'None'],
        ].map(([label, value]) => value && value !== '—' && (
          <div key={label} style={{ display: 'flex', gap: 8, fontSize: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', minWidth: 70 }}>{label}</span>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>{value}</span>
          </div>
        ))}
        {data?.meetLink && <a href={data.meetLink} target="_blank" rel="noopener noreferrer" style={{ marginTop: 4, padding: '8px 10px', borderRadius: 7, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', fontSize: 11, color: '#6ee7b7', textAlign: 'center', textDecoration: 'none' }}>🎥 Join Google Meet</a>}
        <div style={{ marginTop: 4, padding: '6px 10px', borderRadius: 7, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', fontSize: 11, color: '#10b981', textAlign: 'center' }}>
          {data?.email ? `✓ Invitation sent to ${data.attendees?.length || 0} recipients` : data?.message || '✓ Event added to Google Calendar'}
        </div>
      </div>
    </div>
  );
}

function GitHubReposCard({ data, T, onDismiss, onSelectRepo }) {
  const repos = Array.isArray(data?.repos)
    ? data.repos
    : (Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []));

  const getLangColor = (lang) => {
    const colors = {
      Python: '#3572A5',
      JavaScript: '#f1e05a',
      TypeScript: '#3178c6',
      HTML: '#e34c26',
      CSS: '#563d7c',
      Java: '#b07219',
      Go: '#00ADD8',
      Rust: '#dea584',
      C: '#555555',
      'C++': '#f34b7d',
      'C#': '#178600',
      PHP: '#4F5D95',
      Ruby: '#701516',
      Swift: '#F05138',
      Kotlin: '#A97BFF',
      Dart: '#00B4AB',
      Shell: '#89e051'
    };
    return colors[lang] || '#94a3b8';
  };

  return (
    <div style={{
      background: 'rgba(24, 23, 23, 0.75)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: 14,
      overflow: 'hidden',
      marginTop: 8,
      backdropFilter: 'blur(16px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.35)'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255, 255, 255, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: '#24292e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.15)'
          }}>
            <SiGithub size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              Connected GitHub Repositories
              <span style={{
                fontSize: 10,
                padding: '1px 7px',
                borderRadius: 99,
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontFamily: "'JetBrains Mono', monospace"
              }}>
                {repos.length} Repositories
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
              Live codebases synchronized with WorkPilot AI
            </div>
          </div>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 18 }}>×</button>
        )}
      </div>

      {/* Repo list */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
        {repos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 10px', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
            No repositories found or access restricted.
          </div>
        ) : (
          repos.map((repo, idx) => (
            <div
              key={repo.id || idx}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 10,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <a
                    href={repo.html_url || `https://github.com/${repo.full_name || repo.name}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: '#60a5fa',
                      fontWeight: 600,
                      fontSize: 13,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {repo.full_name || repo.name}
                  </a>
                  {repo.private && (
                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>Private</span>
                  )}
                  {repo.default_branch && (
                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', fontFamily: "'JetBrains Mono', monospace" }}>{repo.default_branch}</span>
                  )}
                </div>
                {repo.description && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {repo.description}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 5, fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                  {repo.language && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: getLangColor(repo.language) }} />
                      {repo.language}
                    </span>
                  )}
                  {repo.open_issues_count !== undefined && (
                    <span>{repo.open_issues_count} open issues</span>
                  )}
                  {repo.stargazers_count > 0 && (
                    <span>★ {repo.stargazers_count}</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <a
                  href={repo.html_url || `https://github.com/${repo.full_name || repo.name}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '5px 9px',
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: 11,
                    textDecoration: 'none',
                    fontWeight: 500,
                    whiteSpace: 'nowrap'
                  }}
                >
                  View ↗
                </a>
                {onSelectRepo && (
                  <button
                    onClick={() => onSelectRepo(repo.full_name || repo.name)}
                    style={{
                      padding: '5px 9px',
                      borderRadius: 6,
                      background: 'rgba(99,102,241,0.18)',
                      border: '1px solid rgba(99,102,241,0.35)',
                      color: '#a5b4fc',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    + Issue
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function AICockpit({ user, theme, initialPrompt, onBack, onOpenIntegrations }) {
  const T = theme || { primary: '#3b82f6', secondary: '#7c3aed', accent: '#06b6d4', glow: 'rgba(59,130,246,0.3)' };
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Alex';
  const firstName = displayName.split(' ')[0];
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('wp_ai_mode') || 'suggest';
  });

  const handleSetMode = (newMode) => {
    setMode(newMode);
    localStorage.setItem('wp_ai_mode', newMode);
  };
  const [conversationId, setConversationId] = useState(() => {
    return localStorage.getItem('wp_active_conversation') || crypto.randomUUID();
  });
  const [msgs, setMsgs] = useState(() => {
    const savedId = localStorage.getItem('wp_active_conversation');
    if (savedId) {
      try {
        const cached = JSON.parse(localStorage.getItem(`wp_chat_${savedId}`) || 'null');
        if (Array.isArray(cached) && cached.length > 0) return cached;
      } catch {}
    }
    return [
      { id: 1, r: 'ai', text: `Welcome back, ${firstName}! I'm your AI Chief of Staff. How can I assist you across your workspace today?`, card: null, streaming: false, done: true },
    ];
  });
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [thinkMsg, setThinkMsg] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [pins, setPins] = useState(DEFAULT_PINS);
  const [showAddPin, setShowAddPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [statsCount, setStatsCount] = useState({ handled: 0, saved: 0, actions: 0 });
  const [canvasItem, setCanvasItem] = useState(null);
  const [canvasOpen, setCanvasOpen] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversationTitle, setConversationTitle] = useState('New workspace chat');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [activeProvider, setActiveProvider] = useState('Groq GPT OSS 120B');
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [connectionState, setConnectionState] = useState({ platforms: [], loading: true, error: false });

  // ── SuperBrain Flagship Additions: Memory, Guardian & Voice TTS ──
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const [guardianData, setGuardianData] = useState(null);
  const [guardianDismissed, setGuardianDismissed] = useState(false);
  const recognitionRef = useRef(null);

  const toggleSpeak = useCallback((msgId, text) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const clean = (text || '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]*`/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_#~>]/g, '')
      .replace(/•/g, '')
      .trim();
    if (!clean) return;
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  }, [speakingId]);

  // Check Schedule Guardian on load
  useEffect(() => {
    const fetchGuardian = async () => {
      let authToken = '';
      try {
        const { auth } = await import('../firebase');
        authToken = (await auth.currentUser?.getIdToken()) || '';
      } catch {}
      if (!authToken) {
        const stored = JSON.parse(localStorage.getItem('wp_tokens') || 'null');
        authToken = stored?.accessToken || '';
      }
      if (!authToken) return;
      try {
        const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
        const res = await fetch(`${API}/ai/superbrain/guardian`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        if (data && data.alerts && data.alerts.length > 0) {
          setGuardianData(data);
        }
      } catch (err) {
        console.debug('[Guardian] check failed:', err);
      }
    };
    fetchGuardian();
  }, []);

  const endRef = useRef(null);
  const inputRef = useRef(null);
  const thinkIdx = useRef(0);
  const initialPromptSent = useRef('');
  const fileInputRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth >= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadConnectionState = useCallback(async () => {
    setConnectionState(prev => ({ ...prev, loading: true, error: false }));
    try {
      const result = await getIntegrations();
      const integrations = result?.data || [];
      setConnectionState({ platforms: integrations, loading: false, error: false });
    } catch {
      setConnectionState(prev => ({ ...prev, loading: false, error: true }));
    }
  }, []);

  useEffect(() => { loadConnectionState(); }, [loadConnectionState]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, thinking]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('wp_cockpit_history') || '[]');
      setConversationHistory(Array.isArray(saved) ? saved : []);
    } catch { setConversationHistory([]); }
    try {
      const savedPins = JSON.parse(localStorage.getItem('wp_cockpit_pins') || 'null');
      if (Array.isArray(savedPins)) setPins(savedPins);
    } catch { /* ignore malformed local state */ }
    getChatConversations().then(result => {
      const conversations = result?.conversations || result?.data?.conversations;
      if (Array.isArray(conversations)) setConversationHistory(conversations);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem('wp_active_conversation', conversationId);
  }, [conversationId]);

  useEffect(() => {
    localStorage.setItem('wp_cockpit_pins', JSON.stringify(pins));
  }, [pins]);

  useEffect(() => {
    const latestUserMessage = [...msgs].reverse().find(m => m.r === 'user');
    if (!latestUserMessage) return;
    const title = latestUserMessage.text.slice(0, 42) || 'New workspace chat';
    setConversationTitle(title);
    const record = { id: conversationId, title, updatedAt: Date.now() };
    setConversationHistory(prev => {
      const next = [record, ...prev.filter(item => item.id !== conversationId)].slice(0, 20);
      try { localStorage.setItem('wp_cockpit_history', JSON.stringify(next)); } catch {}
      return next;
    });
    if (msgs.length > 0) {
      try {
        localStorage.setItem(`wp_chat_${conversationId}`, JSON.stringify(msgs));
      } catch {}
    }
  }, [msgs, conversationId]);

  const sendMsg = useCallback(async (promptOverride) => {
    const userText = (promptOverride ?? input).trim();
    if (!userText || thinking) return;
    const requestStartTime = performance.now();
    const requestText = attachedFile ? `${userText}\n\nAttached file: ${attachedFile.name}` : userText;
    setInput('');
    setAttachedFile(null);
    setMsgs(p => [...p, { id: Date.now(), r: 'user', text: requestText, card: null, done: true }]);

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

      if (!authToken) {
        throw new Error('Your workspace session is not authenticated. Sign in again to load live Gmail and Calendar data.');
      }
      let endpoint = `${API}/ai/superchat`;  // SuperBrain multi-agent endpoint
      console.log('[WorkPilot] Chat endpoint:', endpoint, '| Auth: YES');

      abortRef.current = new AbortController();
      const streamTimeout = setTimeout(() => abortRef.current?.abort(), 90000);
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          message: requestText,
          conversation_id: conversationId,
          mode: mode,
          history: msgs.slice(-8).map(m => ({ role: m.r === 'ai' ? 'assistant' : 'user', content: m.text }))
        }),
        signal: abortRef.current.signal,
      };
      let res = await fetch(endpoint, requestOptions);

      // A stale token must not silently switch to a debug user with no workspace data.
      if (res.status === 401 && authToken) {
        throw new Error('Your workspace session expired. Sign in again to load live Gmail and Calendar data.');
      }

      clearInterval(thinkTimer);
      setThinking(false);

      // Log non-200 status for debugging
      if (!res.ok) {
        clearTimeout(streamTimeout);
        abortRef.current = null;
        const errText = await res.text();
        console.error('[WorkPilot] Chat API error:', res.status, errText);
        const msgId2 = Date.now() + 1;
        setMsgs(p => [...p, { id: msgId2, r: 'ai', text: `❌ Backend error ${res.status}: ${errText.slice(0, 200)}`, card: null, streaming: false, done: true }]);
        return;
      }

      const msgId = Date.now() + 1;
      setMsgs(p => [...p, { id: msgId, r: 'ai', text: '', card: null, toolCall: null, toolResult: null, workflowSteps: [], streaming: true, done: false }]);
      setStatsCount(p => ({ ...p, handled: p.handled + 1 }));

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let full = '';
      let buf = '';
      let lastActivityTime = Date.now();
      
      // Monitor for stuck streams (allow up to 60s for multi-hop tool reasoning + 3-model fallback)
      const activityMonitor = setInterval(() => {
        const elapsed = Date.now() - lastActivityTime;
        if (elapsed > 60000) { // 60 seconds without activity
          console.warn('[WorkPilot] Stream appears stuck, forcing completion');
          clearInterval(activityMonitor);
          clearTimeout(streamTimeout);
          setThinking(false);
          const duration = ((performance.now() - requestStartTime) / 1000).toFixed(1);
          setMsgs(p => p.map(m => m.id === msgId ? {
            ...m,
            duration,
            text: m.text || 'I encountered an issue processing your request. Please try again.',
            done: true,
            streaming: false,
            toolCall: null,
            error: true
          } : m));
          reader.cancel();
        }
      }, 2000);

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          clearInterval(activityMonitor);
          const duration = ((performance.now() - requestStartTime) / 1000).toFixed(1);
          setMsgs(p => p.map(m => m.id === msgId ? { ...m, duration: m.duration || duration, done: true, streaming: false } : m));
          break;
        }
        lastActivityTime = Date.now(); // Reset activity timer
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop(); // keep incomplete line
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') {
            clearTimeout(streamTimeout);
            clearInterval(activityMonitor);
            setThinking(false);  // Stop thinking animation
            const duration = ((performance.now() - requestStartTime) / 1000).toFixed(1);
            setMsgs(p => p.map(m => m.id === msgId ? {
              ...m,
              duration,
              done: true,
              streaming: false,
              toolCall: null,
              workflowSteps: (m.workflowSteps || []).map(s => ({ ...s, status: 'completed' }))
            } : m));
            break;
          }
          try {
            const parsed = JSON.parse(payload);

            // ── SuperBrain new event format: { type, content/tool/level/items } ──
            if (parsed.type !== undefined) {
              const { type, content, tool, message, level, items, hop, step_title, tools } = parsed;

              if (type === 'token') {
                full += content;
                setMsgs(p => p.map(m => m.id === msgId ? { ...m, text: full } : m));

              } else if (type === 'thinking') {
                setThinkMsg(content || 'Thinking...');
                setThinking(true);

              } else if (type === 'workflow_step') {
                setThinkMsg(message || `Autonomous Hop ${hop}...`);
                setThinking(true);
                setMsgs(p => p.map(m => {
                  if (m.id !== msgId) return m;
                  const currentSteps = m.workflowSteps || [];
                  const updatedSteps = currentSteps.map(s => ({ ...s, status: 'completed' }));
                  updatedSteps.push({
                    hop,
                    title: step_title || `Step ${hop}`,
                    tools: tools || [],
                    message: message || '',
                    status: 'running',
                    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                  });
                  return { ...m, workflowSteps: updatedSteps };
                }));

              } else if (type === 'tool_start') {
                setThinkMsg(message || `Running ${tool}...`);
                setThinking(true);
                setMsgs(p => p.map(m => m.id === msgId ? { ...m, toolCall: { name: tool, label: message } } : m));

              } else if (type === 'tool_done') {
                setThinking(false);
                // Map tool name to card type
                const cardMap = {
                  get_emails: 'email', get_calendar_events: 'calendar',
                  get_team_members: 'team', get_deployments: 'deploy',
                  get_integrations_status: 'integrations', get_analytics: 'analytics',
                  compose_email: 'compose', improve_text: 'improve_text',
                  create_calendar_event: 'create_event', create_meet_and_email: 'create_event',
                  schedule_automation: 'automation', generate_report: 'report',
                  find_meeting_time: 'meeting_time', task_management: 'tasks',
                  notion_tool: 'notion', diagnose_issue: 'diagnose',
                  get_system_health: 'health', get_weather: 'weather',
                  github_tool: 'github', jira_tool: 'jira',
                  prepare_meeting_briefing: 'briefing',
                  inbox_triage_workflow: 'triage',
                  workspace_cross_search: 'cross_search',
                };
                const card = cardMap[tool] || null;
                setMsgs(p => p.map(m => m.id === msgId ? { ...m, toolCall: null, card: m.card || card } : m));

              } else if (type === 'alert') {
                // Show alert as a special inline message
                const alertColors = { error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
                const alertIcons  = { error: '🔴', warning: '⚠️', info: 'ℹ️' };
                setMsgs(p => p.map(m => m.id === msgId
                  ? { ...m, alerts: [...(m.alerts || []), { level: level || 'info', message, color: alertColors[level] || '#3b82f6', icon: alertIcons[level] || 'ℹ️' }] }
                  : m
                ));

              } else if (type === 'suggestions') {
                setMsgs(p => p.map(m => m.id === msgId ? { ...m, suggestions: items || [] } : m));
              }

            // ── Legacy format: { event, data } (old /ai/chat endpoint) ──
            } else {
              const { event, data } = parsed;
              if (event === 'token') {
                full += data;
                setMsgs(p => p.map(m => m.id === msgId ? { ...m, text: full } : m));
              } else if (event === 'tool_call') {
                setThinkMsg(data?.label || '🤖 Processing...');
                setThinking(true);
                setMsgs(p => p.map(m => m.id === msgId ? { ...m, toolCall: { name: data?.name, label: data?.label } } : m));
              } else if (event === 'tool_result') {
                setThinking(false);
                setMsgs(p => p.map(m => m.id === msgId ? { ...m, toolCall: null } : m));
              } else if (event === 'done') {
                if (data?.provider === 'gemini') setActiveProvider('Gemini');
                if (data?.provider === 'groq') setActiveProvider('Groq Llama');
                setMsgs(p => p.map(m => m.id === msgId ? { ...m, done: true, streaming: false, toolCall: null } : m));
              } else if (event === 'error') {
                setThinking(false);
                setMsgs(p => p.map(m => m.id === msgId ? { ...m, text: `I couldn't complete that action.\n\n${data}`, error: true, done: true, streaming: false } : m));
              }
            }

            // Also check for simple { token: "..." } legacy format
            if (parsed.token !== undefined && parsed.type === undefined && parsed.event === undefined) {
              full += parsed.token;
              setMsgs(p => p.map(m => m.id === msgId ? { ...m, text: full } : m));
            }

          } catch { /* skip malformed line */ }
        }
      }
      
      // Safety net: Ensure stream is marked complete even if [DONE] wasn't received
      clearInterval(activityMonitor);
      clearTimeout(streamTimeout);
      setThinking(false);
      setMsgs(p => p.map(m => {
        if (m.id === msgId && !m.done) {
          console.warn('[WorkPilot] Stream ended without [DONE], forcing completion');
          return {
            ...m,
            done: true,
            streaming: false,
            toolCall: null,
            workflowSteps: (m.workflowSteps || []).map(s => ({ ...s, status: 'completed' }))
          };
        }
        return m;
      }));
      
      abortRef.current = null;
    } catch (err) {
      clearInterval(activityMonitor);
      clearInterval(thinkTimer);
      setThinking(false);
      abortRef.current = null;
      if (err?.name === 'AbortError') return;
      const fallbackText = 'I encountered a connection issue communicating with the AI backend. Please verify that the backend server is active and try again.';
      const msgId = Date.now() + 1;
      setMsgs(p => [...p, { id: msgId, r: 'ai', text: fallbackText, card: null, streaming: false, done: true, error: true }]);
    }
  }, [attachedFile, conversationId, input, thinking, msgs]);

  useEffect(() => {
    if (initialPrompt && initialPromptSent.current !== initialPrompt) {
      initialPromptSent.current = initialPrompt;
      sendMsg(initialPrompt);
    }
  }, [initialPrompt, sendMsg]);


  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    const r = new SR();
    recognitionRef.current = r;
    r.continuous = false;
    r.interimResults = true;
    r.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(result => result[0].transcript)
        .join('');
      setInput(transcript);
    };
    r.onend = () => setIsListening(false);
    r.onerror = () => setIsListening(false);
    setIsListening(true);
    r.start();
  }, [isListening]);

  const applyPinnedPrompt = (prompt) => { setInput(prompt); inputRef.current?.focus(); };

  const copyMsg = (id, text) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const removeCard = (id) => setMsgs(p => p.map(m => m.id === id ? { ...m, card: null } : m));

  const startNewChat = () => {
    const newId = crypto.randomUUID();
    setConversationId(newId);
    setConversationTitle('New workspace chat');
    const initial = [{ id: Date.now(), r: 'ai', text: `Welcome back, ${firstName}! What would you like to get done?`, card: null, streaming: false, done: true }];
    setMsgs(initial);
    setInput('');
    setSearchQ('');
    try { localStorage.setItem('wp_active_conversation', newId); } catch {}
    inputRef.current?.focus();
  };

  const attachFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);
    uploadDocument(formData)
      .then(result => setAttachedFile({ name: file.name, size: file.size, documentId: result?.id || result?.data?.id }))
      .catch(() => setAttachedFile({ name: file.name, size: file.size }))
      .finally(() => setUploadingFile(false));
    event.target.value = '';
  };

  const filteredMsgs = searchQ
    ? msgs.filter(m => m.text?.toLowerCase().includes(searchQ.toLowerCase()))
    : msgs;
  const connectedPlatforms = connectionState.platforms.filter(integration => integration.connected);
  const integrationCount = connectionState.platforms.length;

  const renderCanvasArtifact = (item) => {
    if (!item) return null;
    const { type, data, msgId } = item;

    switch (type) {
      case 'interactive_meeting':
      case 'create_event':
        return (
          <InteractiveMeetingCard
            data={data?.event || data}
            onScheduled={(res) => {
              setStatsCount(p => ({ ...p, actions: p.actions + 1, saved: p.saved + 1 }));
              setMsgs(p => [...p, { id: Date.now(), r: 'ai', text: `✓ Meeting **${res.title || 'Event'}** confirmed and invitation sent.`, done: true }]);
            }}
          />
        );

      case 'slot_picker':
      case 'meeting_time':
        return (
          <VisualSlotPickerCard
            data={data}
            onSelectSlot={(slot) => {
              sendMsg(`Schedule meeting on ${slot.date} at ${slot.time}`);
            }}
          />
        );

      case 'approval':
        return (
          <SafeguardApprovalCard
            data={data}
            onApprove={() => {
              setMsgs(p => [...p, { id: Date.now(), r: 'ai', text: 'Action successfully approved and executed.', done: true }]);
              if (msgId) removeCard(msgId);
              setCanvasOpen(false);
            }}
            onReject={() => {
              if (msgId) removeCard(msgId);
              setCanvasOpen(false);
            }}
          />
        );

      case 'interactive_analytics':
      case 'analytics':
        return <InteractiveAnalyticsCard data={data} onDismiss={() => setCanvasOpen(false)} />;

      case 'email':
        return data?.emails?.length > 0 ? (
          <RealEmailsCard emails={data.emails} source={data.source} T={T} onDismiss={() => setCanvasOpen(false)} />
        ) : (
          <LiveDataNotice source={data?.source} message={data?.note || data?.error} T={T} onOpenIntegrations={onOpenIntegrations} />
        );

      case 'calendar':
        return data?.events?.length > 0 ? (
          <RealCalendarCard events={data.events} T={T} onDismiss={() => setCanvasOpen(false)} />
        ) : (
          <LiveDataNotice source={data?.source} message={data?.note || data?.error} T={T} onOpenIntegrations={onOpenIntegrations} />
        );

      case 'compose':
        return (
          <ComposeEmailCard
            data={data}
            onSend={(emailData) => {
              if (msgId) removeCard(msgId);
              setStatsCount(p => ({ ...p, saved: p.saved + 1, actions: p.actions + 1 }));
              setMsgs(p => [...p, { id: Date.now(), r: 'ai', text: `✓ Email to **${emailData.to}** — "${emailData.subject}" sent successfully.`, card: null, done: true }]);
              setCanvasOpen(false);
            }}
            onDismiss={() => setCanvasOpen(false)}
          />
        );

      case 'deploy':
        return <DeployCard T={T} data={data} onOpenIntegrations={onOpenIntegrations} />;

      case 'team':
        return <TeamCard data={data} />;

      case 'integrations':
        return <IntegrationsStatusCard data={data} T={T} onDismiss={() => setCanvasOpen(false)} />;

      case 'tasks':
        return <TasksCard data={data} T={T} onDismiss={() => setCanvasOpen(false)} />;

      case 'automation':
        return <AutomationCard data={data} T={T} onDismiss={() => setCanvasOpen(false)} />;

      case 'report':
        return <ReportCard data={data} T={T} onDismiss={() => setCanvasOpen(false)} />;

      case 'github':
        return (
          <GitHubReposCard
            data={data}
            T={T}
            onDismiss={() => setCanvasOpen(false)}
            onSelectRepo={(repoName) => {
              setCanvasOpen(false);
              sendMsg(`Create a new GitHub issue in ${repoName}`);
            }}
          />
        );

      default:
        return (
          <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            <p>Artifact details loaded.</p>
            {data && <pre style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, fontSize: 11, overflowX: 'auto' }}>{JSON.stringify(data, null, 2)}</pre>}
          </div>
        );
    }
  };

  return (
    <div className="cockpit-root" style={{ display: 'flex', height: '100vh', background: 'var(--wp-bg, #000)', color: 'var(--wp-text, #fff)', fontFamily: "'Inter',sans-serif", overflow: 'hidden', position: 'relative' }}>
      
      {/* ══ LEFT SIDEBAR ══ */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`} style={{ background: 'var(--wp-bg-sidebar, #08080b)', borderRight: '1px solid var(--wp-border, rgba(255,255,255,0.07))' }}>
        <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
          <button onClick={() => setSidebarOpen(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }} title="Collapse sidebar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <WorkPilotAvatar size={34} T={T} />
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 14, color: '#fff' }}>WorkPilot AI</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono',monospace" }}>AI Chief of Staff</div>
            </div>
          </div>

          <button onClick={startNewChat} className="new-chat-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 36, borderRadius: 9, background: '#fff', color: '#08080b', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
            {Ic.plus} New chat
          </button>

          {/* AI MODE SWITCHER */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 }}>
            {Object.entries(MODES).map(([key, val]) => {
              const isActive = mode === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSetMode(key)}
                  title={`${val.label}: ${val.desc}`}
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

        <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => setShowHistory(v => !v)} className="section-toggle" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', padding: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', fontFamily: "'JetBrains Mono',monospace" }}>RECENT CHATS</span>
            <span style={{ fontSize: 11 }}>{showHistory ? 'Hide' : conversationHistory.length || '0'}</span>
          </button>
          {showHistory && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 9 }}>
              {conversationHistory.length === 0 && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Your recent chats will appear here.</span>}
              {conversationHistory.map(chat => (
                <div key={chat.id} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <button onClick={() => {
                    const targetId = chat.id;
                    setConversationId(targetId);
                    setConversationTitle(chat.title || 'Workspace chat');
                    try { localStorage.setItem('wp_active_conversation', targetId); } catch {}

                    // 1. Instant load from local cache if present (zero-latency UI switch)
                    try {
                      const cached = JSON.parse(localStorage.getItem(`wp_chat_${targetId}`) || 'null');
                      if (Array.isArray(cached) && cached.length > 0) {
                        setMsgs(cached);
                      }
                    } catch {}

                    // 2. Refresh full message history from cloud database (Firestore)
                    getChatConversation(targetId).then(result => {
                      const conversation = result?.conversation || result?.data?.conversation;
                      if (conversation && Array.isArray(conversation.messages) && conversation.messages.length > 0) {
                        const mapped = conversation.messages.map((message, index) => ({
                          id: `${targetId}-${index}`,
                          r: message.role === 'assistant' ? 'ai' : 'user',
                          text: message.content,
                          card: null,
                          done: true,
                        }));
                        setMsgs(mapped);
                        setConversationTitle(conversation.title || chat.title);
                        try { localStorage.setItem(`wp_chat_${targetId}`, JSON.stringify(mapped)); } catch {}
                      }
                    }).catch(() => {});
                    setInput(''); inputRef.current?.focus();
                  }} className="history-row" style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.65)', padding: '7px 8px', borderRadius: 7, cursor: 'pointer', fontSize: 11 }}>
                    {chat.title}
                  </button>
                  <button onClick={() => {
                    deleteChatConversation(chat.id).catch(() => {});
                    try { localStorage.removeItem(`wp_chat_${chat.id}`); } catch {}
                    setConversationHistory(prev => {
                      const next = prev.filter(item => item.id !== chat.id);
                      try { localStorage.setItem('wp_cockpit_history', JSON.stringify(next)); } catch {}
                      return next;
                    });
                    if (conversationId === chat.id) {
                      startNewChat();
                    }
                  }} aria-label="Delete conversation" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 3 }}>{Ic.x}</button>
                </div>
              ))}
            </div>
          )}
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
                <button onClick={() => applyPinnedPrompt(p.prompt)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }} className="pin-btn">
                  <span style={{ color: T.accent, display: 'flex', flexShrink: 0 }}>{Ic.star}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.label}</span>
                </button>
                <button onClick={() => setPins(prev => prev.filter(x => x.id !== p.id))} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'none', padding: '4px 6px' }} className="pin-del">{Ic.x}</button>
              </div>
            ))}
          </div>

          {/* Workspace Status */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', fontFamily: "'JetBrains Mono',monospace", marginBottom: 12 }}>WORKSPACE HEALTH</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { icon: Ic.bolt, label: `${connectedPlatforms.length} Connected` },
                { icon: Ic.check, label: 'All Systems Live' },
                { icon: Ic.brain, label: 'SuperBrain Ready' },
                { icon: Ic.docs, label: 'Live Data Only' },
              ].map(ctx => (
                <div key={ctx.label} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '6px 8px' }}>
                  <span style={{ color: T.primary, display: 'flex', opacity: 0.8, transform: 'scale(0.9)' }}>{ctx.icon}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ctx.label}</span>
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, position: 'relative', background: 'var(--wp-bg, #000)' }}>

        {/* ══ UNIFIED 56px EXECUTIVE TOPBAR ══ */}
        <header style={{ 
          height: 56, 
          background: 'var(--wp-surface, rgba(10, 10, 13, 0.85))', 
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--wp-border, rgba(255,255,255,0.08))', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0 18px', 
          gap: 12, 
          flexShrink: 0,
          zIndex: 40,
        }}>
          {/* Left: Sidebar toggle + Dashboard breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 6, borderRadius: 6 }} className="back-btn" title="Expand sidebar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            )}
            <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer', fontFamily: "'Inter',sans-serif", fontWeight: 500 }} className="back-btn">
              {Ic.back} Dashboard
            </button>
          </div>

          {/* Center: Title + Mode Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', flexShrink: 0 }} />
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {conversationTitle}
            </div>
            <div 
              title={`${MODES[mode]?.label}: ${MODES[mode]?.desc}`}
              style={{ padding: '2px 8px', borderRadius: 99, background: `${MODES[mode].color}15`, border: `1px solid ${MODES[mode].color}35`, fontSize: 10, fontWeight: 600, color: MODES[mode].color, cursor: 'help' }}
            >
              {MODES[mode].label}
            </div>
          </div>

          {/* Right: Integrations Pill + Memory + Search + Canvas Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Integrations micro-button */}
            <button 
              onClick={() => setShowIntegrations(v => !v)} 
              title="Connected Workspace Integrations"
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 6, 
                padding: '5px 10px', 
                borderRadius: 8, 
                border: '1px solid rgba(255,255,255,0.1)', 
                background: showIntegrations ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)', 
                color: '#fff', 
                fontSize: 11, 
                cursor: 'pointer' 
              }}
            >
              <span style={{ display: 'flex', gap: 3 }}>
                {connectedPlatforms.slice(0, 3).map(integration => (
                  <span key={integration.platform}>{INTEGRATION_ICONS[integration.platform] || Ic.pin}</span>
                ))}
              </span>
              <span>{connectedPlatforms.length}/{integrationCount}</span>
              <span style={{ color: '#10b981' }}>●</span>
            </button>

            {/* Personal Memory Button */}
            <button
              onClick={() => setShowMemoryModal(true)}
              title="Personal Memory & Style"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 10px',
                borderRadius: 8,
                border: '1px solid rgba(139, 92, 246, 0.3)',
                background: 'rgba(139, 92, 246, 0.12)',
                color: '#c4b5fd',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <span>🧠</span>
              <span className="memory-btn-text">Memory</span>
            </button>

            {/* Split-Canvas Toggle */}
            {canvasItem && (
              <button
                onClick={() => setCanvasOpen(v => !v)}
                title={canvasOpen ? "Hide Artifact Canvas" : "Show Artifact Canvas"}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 10px',
                  borderRadius: 8,
                  border: canvasOpen ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                  background: canvasOpen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.04)',
                  color: canvasOpen ? '#6ee7b7' : 'rgba(255,255,255,0.7)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span>⤢</span>
                <span>Canvas</span>
              </button>
            )}

            {/* Search Box */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', left: 8, color: 'rgba(255,255,255,0.3)', display: 'flex' }}>{Ic.search}</div>
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search..." style={{ padding: '5px 10px 5px 26px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, color: '#fff', fontSize: 11, outline: 'none', width: 120, fontFamily: "'Inter',sans-serif", transition: 'all 0.2s' }} className="sinput" />
              {searchQ && (
                <button onClick={() => setSearchQ('')} style={{ position: 'absolute', right: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', padding: 2 }}>{Ic.x}</button>
              )}
            </div>
          </div>
        </header>

        {/* Integrations dropdown modal */}
        {showIntegrations && !connectionState.loading && !connectionState.error && (
          <div style={{ position: 'absolute', zIndex: 60, top: 62, right: 20, width: 'min(360px, calc(100vw - 40px))', padding: 12, borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', background: '#101014', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 5px 10px', color: 'rgba(255,255,255,0.55)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <span>Live Integrations</span>
              <span>{connectedPlatforms.length} active</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6 }}>
              {connectionState.platforms.map(integration => (
                <button key={integration.platform} onClick={onOpenIntegrations} title={`Manage ${integration.displayName}`} style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, padding: '7px 8px', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, background: 'rgba(255,255,255,0.03)', color: integration.connected ? '#d1fae5' : 'rgba(255,255,255,0.48)', cursor: 'pointer', fontSize: 11, textAlign: 'left' }}>
                  <span style={{ display: 'flex', flexShrink: 0 }}>{INTEGRATION_ICONS[integration.platform] || Ic.pin}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{integration.displayName}</span>
                  <span style={{ marginLeft: 'auto', color: integration.connected ? '#10b981' : '#6b7280' }}>●</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══ SPLIT-CANVAS WORKBENCH STAGE ══ */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minWidth: 0, position: 'relative' }}>

          {/* Left: Chat stream and input composer */}
          <div style={{
            flex: canvasOpen && canvasItem ? '1 1 56%' : '1 1 100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minWidth: 0,
            transition: 'flex 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {/* MESSAGES */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* ── Schedule Guardian Banner ── */}
          {guardianData && !guardianDismissed && guardianData.alerts?.length > 0 && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 14,
                background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.12) 0%, rgba(245, 158, 11, 0.08) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10,
                marginBottom: 6,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                animation: 'msgIn 0.3s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 240 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', fontSize: 14, flexShrink: 0 }}>
                  🛡️
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fca5a5' }}>
                    Schedule Guardian Alert: {guardianData.alerts.length} item{guardianData.alerts.length > 1 ? 's' : ''} need attention
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.65)' }}>
                    {guardianData.alerts[0]?.message}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => sendMsg('Review my calendar for today and add Google Meet video links to meetings missing links')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#fecaca',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Quick Fix Links
                </button>

                <button
                  onClick={() => sendMsg('Give me my complete morning briefing with priorities, calendar, and emails')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Morning Briefing
                </button>

                <button
                  onClick={() => setGuardianDismissed(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: 14,
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {filteredMsgs.map(msg => (
            <div key={msg.id} className="msg-wrap" style={{ position: 'relative', display: 'flex', justifyContent: msg.r === 'user' ? 'flex-end' : 'flex-start', gap: 12, animation: 'msgIn .25s ease' }}>
              
              {/* Timestamp */}
              <div className="msg-ts" style={{ position: 'absolute', top: -18, [msg.r === 'user' ? 'right' : 'left']: 46, fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: "'JetBrains Mono',monospace", pointerEvents: 'none' }}>
                {new Date(msg.id > 100 ? msg.id : Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>

              {msg.r === 'ai' && (
                <WorkPilotAvatar isStreaming={msg.streaming && !msg.done} T={T} />
              )}

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.r === 'user' ? 'flex-end' : 'flex-start', maxWidth: msg.r === 'ai' ? '78%' : '65%', minWidth: 80 }}>
                
                <div
                  className={msg.r === 'ai' ? 'chat-msg-ai' : 'chat-msg-user'}
                  style={{
                    padding: msg.r === 'user' ? '12px 16px' : '14px 18px',
                    borderRadius: msg.r === 'user' ? '18px 4px 18px 18px' : '6px 18px 18px 18px',
                    background: msg.r === 'user' 
                      ? `linear-gradient(135deg,${T.primary},${T.secondary})` 
                      : msg.error 
                        ? 'rgba(239,68,68,0.1)' 
                        : 'var(--wp-surface, rgba(15, 20, 32, 0.75))',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: msg.r === 'ai' ? `1px solid ${msg.error ? 'rgba(239,68,68,0.35)' : 'var(--wp-border, rgba(255,255,255,0.09))'}` : 'none',
                    borderLeft: msg.r === 'ai' ? `3px solid ${msg.error ? '#ef4444' : T.primary}` : 'none',
                    fontSize: 14, lineHeight: 1.7, color: msg.r === 'user' ? '#fff' : 'var(--wp-text, #fff)',
                    boxShadow: msg.r === 'user' ? `0 6px 24px ${T.glow}` : '0 4px 20px rgba(0,0,0,0.35)',
                    width: '100%'
                  }}>
                  {(!msg.text && msg.streaming && !msg.done) ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '2px 0' }}>
                      <div style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        border: '2px solid rgba(0, 210, 255, 0.25)',
                        borderTopColor: '#00d2ff',
                        animation: 'wpSpin 0.75s linear infinite',
                        flexShrink: 0,
                      }} />
                      <span style={{
                        fontSize: 13,
                        fontWeight: 500,
                        background: 'linear-gradient(90deg, rgba(255,255,255,0.5) 0%, #ffffff 50%, rgba(255,255,255,0.5) 100%)',
                        backgroundSize: '200% 100%',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        animation: 'wpShimmerText 2s infinite ease-in-out',
                        fontFamily: "'Inter', sans-serif",
                      }}>
                        WorkPilot AI is preparing your response...
                      </span>
                    </div>
                  ) : (
                    <>
                      <MdText text={msg.text} onSelectOption={(val) => sendMsg(val)} />
                      {msg.streaming && !msg.done && (
                        <span style={{ display: 'inline-block', width: 2, height: '1em', background: '#00d2ff', marginLeft: 3, boxShadow: '0 0 6px #00d2ff', animation: 'blink .7s step-end infinite', verticalAlign: 'text-bottom' }} />
                      )}
                    </>
                  )}

                  {/* Tool call status badge */}
                  {msg.toolCall && (
                    <ToolStatusBadge label={msg.toolCall.label} />
                  )}

                  {/* Autonomous Multi-Hop Workflow Stepper */}
                  {msg.workflowSteps && msg.workflowSteps.length > 0 && (
                    <WorkflowProgressAccordion steps={msg.workflowSteps} done={msg.done} T={T} />
                  )}

                  {/* Rich card */}
                  {Boolean(
                    msg.done && (
                      [
                        'interactive_meeting', 'slot_picker', 'approval', 'interactive_analytics',
                        'compose', 'improve_text', 'deploy', 'team', 'integrations', 'analytics',
                        'tasks', 'automation', 'report', 'meeting_time', 'create_event', 'github'
                      ].includes(msg.card) ||
                      (msg.card === 'email' && (msg.toolResult?.emails?.length > 0 || (!msg.text || msg.text.length < 100))) ||
                      (msg.card === 'calendar' && (msg.toolResult?.events?.length > 0 || (!msg.text || msg.text.length < 100)))
                    )
                  ) && (
                    <>
                      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '12px -16px' }} />
                      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, margin: '0 -2px' }}>
                        {/* Open in Canvas quick button */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
                          <button
                            onClick={() => {
                              const cardTitles = {
                                interactive_meeting: 'Meeting Invitation',
                                create_event: 'Meeting Invitation',
                                slot_picker: 'Select Meeting Time',
                                meeting_time: 'Available Time Slots',
                                approval: 'Action Safeguard Approval',
                                interactive_analytics: 'Workspace Analytics',
                                analytics: 'Productivity Analytics',
                                compose: 'Compose Email',
                                deploy: 'Deployment Pipelines',
                                team: 'Team Standup',
                                report: 'Workspace Report',
                                email: 'Email Inbox',
                                calendar: 'Google Calendar',
                                github: 'Connected GitHub Repositories'
                              };
                              setCanvasItem({
                                type: msg.card,
                                title: cardTitles[msg.card] || 'Artifact Details',
                                data: msg.toolResult,
                                msgId: msg.id
                              });
                              setCanvasOpen(true);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '3px 8px',
                              borderRadius: 6,
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.12)',
                              color: 'rgba(255,255,255,0.7)',
                              fontSize: 10,
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                            title="Inspect in side-by-side Canvas stage"
                          >
                            <span>⤢</span>
                            <span>Open in Canvas</span>
                          </button>
                        </div>

                        {msg.card === 'interactive_meeting' && (
                          <InteractiveMeetingCard
                            data={msg.toolResult?.event || msg.toolResult}
                            onScheduled={(res) => {
                              setStatsCount(p => ({ ...p, actions: p.actions + 1, saved: p.saved + 1 }));
                              setMsgs(p => [...p, { id: Date.now(), r: 'ai', text: `✓ Meeting **${res.title || 'Event'}** confirmed and invitation sent.`, done: true }]);
                            }}
                          />
                        )}
                        {msg.card === 'slot_picker' && (
                          <VisualSlotPickerCard
                            data={msg.toolResult}
                            onSelectSlot={(slot) => {
                              sendMsg(`Schedule meeting on ${slot.date} at ${slot.time}`);
                            }}
                          />
                        )}
                        {msg.card === 'approval' && (
                          <SafeguardApprovalCard
                            data={msg.toolResult}
                            onApprove={() => {
                              setMsgs(p => [...p, { id: Date.now(), r: 'ai', text: 'Action successfully approved and executed.', done: true }]);
                              removeCard(msg.id);
                            }}
                            onReject={() => removeCard(msg.id)}
                          />
                        )}
                        {msg.card === 'interactive_analytics' && (
                          <InteractiveAnalyticsCard data={msg.toolResult} onDismiss={() => removeCard(msg.id)} />
                        )}
                        {msg.card === 'email' && (
                          msg.toolResult?.emails?.length > 0
                            ? <RealEmailsCard emails={msg.toolResult.emails} source={msg.toolResult.source} T={T} onDismiss={() => removeCard(msg.id)} />
                            : (!msg.text || msg.text.length < 100)
                                ? <LiveDataNotice source={msg.toolResult?.source} message={msg.toolResult?.note || msg.toolResult?.error} T={T} onOpenIntegrations={onOpenIntegrations} />
                                : null
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
                            : (!msg.text || msg.text.length < 100)
                                ? <LiveDataNotice source={msg.toolResult?.source} message={msg.toolResult?.note || msg.toolResult?.error} T={T} onOpenIntegrations={onOpenIntegrations} />
                                : null
                        )}
                        {msg.card === 'deploy' && <DeployCard T={T} data={msg.toolResult} onOpenIntegrations={onOpenIntegrations} />}
                        {msg.card === 'team' && <TeamCard data={msg.toolResult} />}
                        {msg.card === 'integrations' && msg.toolResult && (
                          <IntegrationsStatusCard data={msg.toolResult} T={T} onDismiss={() => removeCard(msg.id)} />
                        )}
                        {msg.card === 'analytics' && (
                          <AnalyticsCard data={msg.toolResult} T={T} onDismiss={() => removeCard(msg.id)} />
                        )}
                        {msg.card === 'tasks' && msg.toolResult && (
                          <TasksCard data={msg.toolResult} T={T} onDismiss={() => removeCard(msg.id)} />
                        )}
                        {msg.card === 'automation' && msg.toolResult && (
                          <AutomationCard data={msg.toolResult} T={T} onDismiss={() => removeCard(msg.id)} />
                        )}
                        {msg.card === 'report' && msg.toolResult && (
                          <ReportCard data={msg.toolResult} T={T} onDismiss={() => removeCard(msg.id)} />
                        )}
                        {msg.card === 'meeting_time' && msg.toolResult && (
                          <MeetingTimeCard data={msg.toolResult} T={T} onDismiss={() => removeCard(msg.id)} />
                        )}
                        {msg.card === 'create_event' && msg.toolResult && (
                          <CreatedEventCard data={msg.toolResult} T={T} onDismiss={() => removeCard(msg.id)} />
                        )}
                        {msg.card === 'github' && (
                          <GitHubReposCard
                            data={msg.toolResult}
                            T={T}
                            onDismiss={() => removeCard(msg.id)}
                            onSelectRepo={(repoName) => {
                              sendMsg(`Create a new GitHub issue in ${repoName}`);
                            }}
                          />
                        )}
                      </div>
                    </>
                  )}

                  {/* ── Response Generation Latency / Thought Time Metric ── */}
                  {msg.r === 'ai' && msg.duration && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '3px 10px',
                      borderRadius: 12,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      fontSize: 11,
                      color: 'rgba(255, 255, 255, 0.55)',
                      fontFamily: "'JetBrains Mono', monospace",
                      marginTop: 10,
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <Logo height={12} showText={false} glowColor="#00d2ff" />
                      </span>
                      <span>Thought for {msg.duration}s</span>
                      {msg.workflowSteps?.length > 0 && (
                        <span style={{ color: 'rgba(255, 255, 255, 0.35)' }}>
                          · {msg.workflowSteps.length} action{msg.workflowSteps.length > 1 ? 's' : ''} chained
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* ── SuperBrain Alert Banners ───────────────────────────── */}
                {msg.r === 'ai' && msg.alerts?.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                    {msg.alerts.map((alert, ai) => (
                      <div key={ai} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                        padding: '8px 12px', borderRadius: 10,
                        background: alert.level === 'error'   ? 'rgba(239,68,68,0.1)'
                                  : alert.level === 'warning' ? 'rgba(245,158,11,0.1)'
                                  : 'rgba(59,130,246,0.1)',
                        border: `1px solid ${
                          alert.level === 'error'   ? 'rgba(239,68,68,0.3)'
                        : alert.level === 'warning' ? 'rgba(245,158,11,0.3)'
                        : 'rgba(59,130,246,0.3)'}`,
                      }}>
                        <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>
                          {alert.level === 'error' ? '🔴' : alert.level === 'warning' ? '⚠️' : 'ℹ️'}
                        </span>
                        <span style={{
                          fontSize: 12, lineHeight: 1.5,
                          color: alert.level === 'error'   ? '#fca5a5'
                               : alert.level === 'warning' ? '#fcd34d'
                               : '#93c5fd',
                        }}>{alert.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Smart Suggestion Chips ─────────────────────────────── */}
                {msg.r === 'ai' && msg.done && msg.suggestions?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    {msg.suggestions.map((sug, si) => (
                      <button
                        key={si}
                        onClick={() => sendMsg(sug)}
                        style={{
                          padding: '5px 11px', borderRadius: 20,
                          background: 'rgba(255,255,255,0.05)',
                          border: `1px solid ${T.primary}40`,
                          color: T.primary, fontSize: 11, fontWeight: 500,
                          cursor: 'pointer', fontFamily: "'Inter',sans-serif",
                          whiteSpace: 'nowrap', transition: 'all 0.15s',
                          display: 'flex', alignItems: 'center', gap: 5,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${T.primary}18`; e.currentTarget.style.borderColor = `${T.primary}80`; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = `${T.primary}40`; }}
                      >
                        {Ic.arr} {sug}
                      </button>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {msg.done && (
                  <div className="msg-actions" style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    {/* Voice TTS Listen/Stop button */}
                    {msg.r === 'ai' && (
                      <button
                        onClick={() => toggleSpeak(msg.id, msg.text)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 8px',
                          borderRadius: 6,
                          background: speakingId === msg.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                          border: speakingId === msg.id ? '1px solid rgba(99, 102, 241, 0.4)' : 'none',
                          color: speakingId === msg.id ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
                          fontSize: 11,
                          cursor: 'pointer',
                          fontFamily: "'Inter',sans-serif",
                          transition: 'all 0.2s',
                        }}
                      >
                        {speakingId === msg.id ? (
                          <>
                            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#818cf8', animation: 'pulse 1s infinite' }} />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <span>🔊</span>
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                    )}
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
              <WorkPilotAvatar isThinking={true} T={T} />
              <div style={{ flex: 1, maxWidth: 360, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ 
                  height: 3, 
                  borderRadius: 99, 
                  background: `linear-gradient(90deg, transparent, #00d2ff, #8b5cf6, #3b82f6, transparent)`,
                  backgroundSize: '200% 100%',
                  animation: 'thinkSlide 1.5s ease infinite',
                  margin: '8px 0 4px',
                  boxShadow: '0 0 8px rgba(0, 210, 255, 0.4)'
                }} />
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontStyle: 'italic', paddingLeft: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#00d2ff', boxShadow: '0 0 6px #00d2ff', animation: 'wpAvatarPulse 1.2s infinite' }} />
                  <span>{thinkMsg}</span>
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
              ['Draft an email', 'mail'],
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
              <button onClick={() => fileInputRef.current?.click()} title="Attach a file" className="composer-icon" style={{ color: T.primary, display: 'flex', flexShrink: 0, padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}>{Ic.docs}</button>
              <input ref={fileInputRef} type="file" onChange={attachFile} style={{ display: 'none' }} />
              
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
                  onClick={() => { if (thinking) abortRef.current?.abort(); else sendMsg(); }}
                  disabled={uploadingFile || (!input.trim() && !thinking)}
                  style={{ 
                    width: 38, height: 38, borderRadius: '50%', 
                    background: `linear-gradient(135deg,${T.primary},${T.secondary})`, 
                    border: 'none', color: '#fff', 
                    cursor: thinking || input.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    transition: 'all 0.2s', 
                    boxShadow: input.trim() && !thinking ? `0 4px 14px ${T.glow}` : 'none',
                    opacity: thinking || input.trim() ? 1 : 0.4
                  }}
                >
                  {thinking ? Ic.x : Ic.send}
                </button>
              </div>
            </div>
            {attachedFile && (
              <div className="attachment-chip" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 7, padding: '5px 9px', borderRadius: 7, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>
                {Ic.docs} <span>{attachedFile.name}</span>
                <button onClick={() => setAttachedFile(null)} aria-label="Remove attachment" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0 }}>{Ic.x}</button>
            </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 12px' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Inter',sans-serif" }}>Enter to send · Shift+Enter for newline · Attach context</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Inter',sans-serif" }}>{input.length}/2000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Dynamic Split-Canvas Stage */}
      {canvasOpen && canvasItem && (
        <aside
          className="canvas-workbench"
          style={{
            flex: '1 1 44%',
            minWidth: 360,
            maxWidth: 640,
            borderLeft: '1px solid rgba(255,255,255,0.09)',
            background: 'linear-gradient(180deg, rgba(13,13,17,0.97) 0%, rgba(9,9,12,0.99) 100%)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'canvasSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 25,
            boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
          }}
        >
          {/* Canvas Topbar */}
          <div style={{
            height: 52,
            padding: '0 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            background: 'rgba(255,255,255,0.02)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(0,210,255,0.15)', border: '1px solid rgba(0,210,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Logo height={14} showText={false} glowColor="#00d2ff" />
              </div>
              <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {canvasItem.title || 'Interactive Artifact'}
              </span>
              <span style={{
                fontSize: 9,
                padding: '2px 7px',
                borderRadius: 99,
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                color: '#a5b4fc',
                fontFamily: "'JetBrains Mono',monospace",
                fontWeight: 600,
                letterSpacing: '0.05em',
                flexShrink: 0
              }}>
                CANVAS
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => setCanvasOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 12,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontFamily: "'Inter',sans-serif",
                  transition: 'all 0.15s',
                }}
                title="Close canvas stage"
              >
                ✕ Close
              </button>
            </div>
          </div>

          {/* Canvas Content Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {renderCanvasArtifact(canvasItem)}
          </div>
        </aside>
      )}

    </div>
  </div>

  {/* STYLES */}
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');
    * { box-sizing: border-box; }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
    
    @keyframes canvasSlideIn {
      from { opacity: 0; transform: translateX(30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @media (max-width: 960px) {
      .canvas-workbench {
        position: absolute!important;
        top: 0; right: 0; bottom: 0; left: 0;
        max-width: 100%!important;
        width: 100%!important;
        z-index: 50!important;
      }
    }
        
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
        @keyframes wpSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes wpAvatarPulse { 0%, 100% { transform: scale(1); box-shadow: 0 0 14px rgba(0,210,255,0.4), inset 0 0 8px rgba(139,92,246,0.25); } 50% { transform: scale(1.04); box-shadow: 0 0 24px rgba(0,210,255,0.7), inset 0 0 14px rgba(139,92,246,0.5); } }
        @keyframes wpShimmerText { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }
        .wp-avatar-pulse { animation: wpAvatarPulse 2.2s ease-in-out infinite; }

        .back-btn:hover { color: #fff!important; background: rgba(255,255,255,0.05)!important; }
        .pin-btn:hover { background: rgba(255,255,255,0.06)!important; }
        .new-chat-btn:hover { background: #dbeafe!important; transform: translateY(-1px); }
        .history-row:hover { background: rgba(255,255,255,0.07)!important; color: #fff!important; }
        .section-toggle:hover { color: #fff!important; }
        .composer-icon:hover { color: #fff!important; background: rgba(255,255,255,0.07)!important; border-radius: 6px; }
        .pin-row:hover .pin-del { display: flex!important; }
        .sinput:focus { border-color: rgba(59,130,246,0.4)!important; background: rgba(255,255,255,0.08)!important; }
        .ibar:focus-within { border-color: rgba(59,130,246,0.4)!important; box-shadow: 0 0 0 3px rgba(59,130,246,0.1)!important; }
        .mic-btn:hover { background: rgba(255,255,255,0.1)!important; }
        .status-pill { display: inline-flex; align-items: center; gap: 5px; color: rgba(255,255,255,0.4); font-size: 10px; }
        .status-dot { width: 5px; height: 5px; border-radius: 50%; background: #f59e0b; box-shadow: 0 0 5px rgba(245,158,11,0.55); }
        .status-dot.connected { background: #10b981; box-shadow: 0 0 5px rgba(16,185,129,0.55); }
        @media (max-width: 640px) {
          .status-pill:nth-child(3) { display: none; }
          .status-pill { font-size: 9px; }
          .sinput { width: 34px!important; padding: 6px 10px!important; }
        }

        /* ── AICockpit Specific Light Theme Overrides ── */
        body.wp-light .cockpit-root {
          background: #f8fafc !important;
          color: #0f172a !important;
        }
        body.wp-light .chat-msg-ai {
          background: #ffffff !important;
          border: 1px solid rgba(0, 0, 0, 0.08) !important;
          border-left: 3px solid #2563eb !important;
          color: #0f172a !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04) !important;
        }
        body.wp-light .chat-msg-ai * {
          color: #0f172a;
        }
        body.wp-light .chat-msg-ai a {
          color: #2563eb !important;
        }
        body.wp-light .new-chat-btn {
          background: #2563eb !important;
          color: #ffffff !important;
        }
        body.wp-light .new-chat-btn * {
          color: #ffffff !important;
        }
      `}</style>
      <PersonalMemoryModal isOpen={showMemoryModal} onClose={() => setShowMemoryModal(false)} />
    </div>
  );
}
