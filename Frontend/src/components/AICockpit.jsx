import React, { useState, useEffect, useRef, useCallback } from 'react';

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
  const [body, setBody] = useState('Hi Robert,\n\nThank you for sending over the Q3 budget proposal. I\'ve reviewed the figures and would like to schedule a 30-minute call to discuss a few line items before final approval.\n\nAre you available this Thursday at 2:00 PM? Please let me know if another time works better.\n\nBest regards,\n' + 'Alex');
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

function DeployCard({ T }) {
  return (
    <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid rgba(99,102,241,0.12)', display: 'flex', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>{Ic.deploy}</div>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono',monospace" }}>DEPLOYMENT STATUS</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>v2.4.2 — Staging</div>
        </div>
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          {[['Status', '⟳ In Progress', '#6366f1'], ['Risk', 'MEDIUM', '#f59e0b'], ['ETA', '~8 min', '#fff'], ['Progress', '67%', '#10b981']].map(([k, v, c]) => (
            <div key={k}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{k}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: c }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: '67%', height: '100%', background: `linear-gradient(90deg,${T.primary},${T.secondary})`, borderRadius: 99 }} />
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>3 checks passed · 1 running · 0 failed</div>
      </div>
      <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(99,102,241,0.1)', display: 'flex', gap: 7 }}>
        <button style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#6366f1', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>🔴 Rollback</button>
        <button style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}>View Logs</button>
      </div>
    </div>
  );
}

function TeamCard() {
  return (
    <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid rgba(245,158,11,0.12)', display: 'flex', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>{Ic.team}</div>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono',monospace" }}>TEAM STANDUP REPORT</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Today — 4 members</div>
        </div>
      </div>
      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { name: 'Sarah Chen', status: 'done', task: 'UI mockups complete ✓', c: '#10b981' },
          { name: 'John Smith', status: 'on-track', task: 'API integration 65% done', c: '#3b82f6' },
          { name: 'Mike Chen', status: 'delayed', task: '⚠ Backend testing — 2 days late', c: '#f59e0b' },
          { name: 'Priya Sharma', status: 'missing', task: '🔴 No update today', c: '#ef4444' },
        ].map(m => (
          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: m.c, boxShadow: `0 0 5px ${m.c}`, flexShrink: 0 }} />
            <span style={{ width: 90, fontSize: 12, fontWeight: 600, color: '#fff', flexShrink: 0 }}>{m.name}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{m.task}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(245,158,11,0.1)' }}>
        <button style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>⚡ Follow up with Mike</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   STREAMING TEXT
══════════════════════════════════════ */
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

/* ══════════════════════════════════════
   MAIN AI COCKPIT
══════════════════════════════════════ */
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

  const endRef = useRef(null);
  const inputRef = useRef(null);
  const thinkIdx = useRef(0);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, thinking]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const sendMsg = useCallback(() => {
    if (!input.trim() || thinking) return;
    const userText = input.trim();
    setInput('');
    setMsgs(p => [...p, { id: Date.now(), r: 'user', text: userText, card: null, done: true }]);

    // Thinking phase
    setThinking(true);
    thinkIdx.current = 0;
    setThinkMsg(THINKING_MSGS[0]);
    const thinkTimer = setInterval(() => {
      thinkIdx.current = (thinkIdx.current + 1) % THINKING_MSGS.length;
      setThinkMsg(THINKING_MSGS[thinkIdx.current]);
    }, 700);

    setTimeout(() => {
      clearInterval(thinkTimer);
      setThinking(false);
      const resp = getAIResponse(userText);
      const msgId = Date.now() + 1;
      setMsgs(p => [...p, { id: msgId, r: 'ai', text: resp.text, card: resp.card, streaming: true, done: false }]);
      setStatsCount(p => ({ ...p, handled: p.handled + 1 }));
    }, 2200);
  }, [input, thinking]);

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
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff', fontFamily: "'Inter',sans-serif", overflow: 'hidden' }}>

      {/* ══ LEFT SIDEBAR ══ */}
      <aside style={{ width: 260, minWidth: 260, background: '#08080b', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${T.primary},${T.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: `0 4px 14px ${T.glow}` }}>{Ic.brain}</div>
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 14, color: '#fff' }}>WorkPilot AI</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono',monospace" }}>AI Chief of Staff</div>
            </div>
          </div>

          {/* AI Mode Selector */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowModeMenu(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: `${MODES[mode].color}12`, border: `1px solid ${MODES[mode].color}28`, borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: MODES[mode].color, boxShadow: `0 0 6px ${MODES[mode].color}`, animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: MODES[mode].color }}>{MODES[mode].label}</span>
              </div>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={MODES[mode].color} strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {showModeMenu && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#0f0f14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', zIndex: 100, animation: 'ddrop .18s ease' }}>
                {Object.entries(MODES).map(([key, val]) => (
                  <button key={key} onClick={() => { setMode(key); setShowModeMenu(false); }} style={{ width: '100%', padding: '10px 12px', background: mode === key ? `${val.color}10` : 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }} className="menu-row">
                    <div style={{ fontSize: 12, fontWeight: 600, color: val.color, marginBottom: 2 }}>{val.label}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{val.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pinned Prompts */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', fontFamily: "'JetBrains Mono',monospace" }}>PINNED PROMPTS</span>
            <button onClick={() => setShowAddPin(v => !v)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', padding: 2 }}>{Ic.plus}</button>
          </div>

          {showAddPin && (
            <div style={{ marginBottom: 10, display: 'flex', gap: 6 }}>
              <input value={newPin} onChange={e => setNewPin(e.target.value)} placeholder="Type a prompt..." onKeyDown={e => { if (e.key === 'Enter' && newPin.trim()) { setPins(p => [...p, { id: Date.now(), label: newPin.slice(0, 22), prompt: newPin }]); setNewPin(''); setShowAddPin(false); }}} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '6px 9px', color: '#fff', fontSize: 12, outline: 'none', fontFamily: "'Inter',sans-serif" }} autoFocus />
              <button onClick={() => setShowAddPin(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>{Ic.x}</button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {pins.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, group: true }} className="pin-row">
                <button onClick={() => usePin(p.prompt)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s' }} className="pin-btn">
                  <span style={{ color: T.primary, display: 'flex', flexShrink: 0 }}>{Ic.star}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.label}</span>
                </button>
                <button onClick={() => setPins(prev => prev.filter(x => x.id !== p.id))} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', display: 'none', padding: 2, flexShrink: 0 }} className="pin-del">{Ic.x}</button>
              </div>
            ))}
          </div>

          {/* Session context */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>TODAY'S CONTEXT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                { icon: Ic.mail, label: '3 urgent emails' },
                { icon: Ic.team, label: 'Mike overdue 2d' },
                { icon: Ic.deploy, label: 'v2.4.2 staging' },
                { icon: Ic.cal, label: '3 meetings today' },
              ].map(ctx => (
                <div key={ctx.label} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 0' }}>
                  <span style={{ color: T.primary, display: 'flex', opacity: 0.7 }}>{ctx.icon}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{ctx.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats footer */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.08em' }}>SESSION STATS</div>
          {[['Handled', statsCount.handled, T.primary], ['Saved', statsCount.saved, '#10b981'], ['Actions', statsCount.actions, T.secondary]].map(([k, v, c]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{k}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: c }}>{v}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ══ MAIN CHAT AREA ══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* TOP BAR */}
        <header style={{ height: 56, background: '#08080b', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, flexShrink: 0 }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '6px 11px', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', fontFamily: "'Inter',sans-serif", transition: 'all 0.15s' }} className="back-btn">
            {Ic.back} Dashboard
          </button>

          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite', boxShadow: '0 0 6px #10b981' }} />
            <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14 }}>AI Cockpit</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono',monospace" }}>— WorkPilot AI</span>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Search chat */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', display: 'flex' }}>{Ic.search}</div>
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search conversation..." style={{ padding: '7px 12px 7px 30px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: '#fff', fontSize: 12, outline: 'none', width: 190, fontFamily: "'Inter',sans-serif" }} className="sinput" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: `${MODES[mode].color}12`, border: `1px solid ${MODES[mode].color}25`, borderRadius: 99 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: MODES[mode].color, animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 11, color: MODES[mode].color, fontWeight: 600 }}>{MODES[mode].label}</span>
            </div>
          </div>
        </header>

        {/* MESSAGES */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredMsgs.map(msg => (
            <div key={msg.id} style={{ display: 'flex', justifyContent: msg.r === 'user' ? 'flex-end' : 'flex-start', gap: 10, animation: 'msgIn .25s ease' }}>
              {msg.r === 'ai' && (
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg,${T.primary},${T.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, boxShadow: `0 2px 10px ${T.glow}`, marginTop: 2 }}>{Ic.bolt}</div>
              )}

              <div style={{ maxWidth: msg.r === 'ai' ? '72%' : '56%', minWidth: 80 }}>
                {msg.r === 'ai' && (
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 5, fontFamily: "'JetBrains Mono',monospace", display: 'flex', alignItems: 'center', gap: 5 }}>
                    {Ic.clock} WorkPilot AI · {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}

                <div style={{
                  padding: '12px 15px', borderRadius: msg.r === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                  background: msg.r === 'user' ? `linear-gradient(135deg,${T.primary},${T.secondary})` : 'rgba(255,255,255,0.05)',
                  border: msg.r === 'ai' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  fontSize: 13.5, lineHeight: 1.65, color: '#fff',
                  boxShadow: msg.r === 'user' ? `0 4px 16px ${T.glow}` : 'none',
                }}>
                  {msg.streaming && !msg.done
                    ? <StreamText text={msg.text} onDone={() => setMsgs(p => p.map(m => m.id === msg.id ? { ...m, done: true } : m))} />
                    : msg.text}
                </div>

                {/* Rich card */}
                {msg.card === 'email' && msg.done && (
                  <EmailCard T={T} onSend={() => { removeCard(msg.id); setStatsCount(p => ({ ...p, saved: p.saved + 1, actions: p.actions + 1 })); }} onDiscard={() => removeCard(msg.id)} />
                )}
                {msg.card === 'calendar' && msg.done && <CalendarCard T={T} onConfirm={() => { removeCard(msg.id); setStatsCount(p => ({ ...p, actions: p.actions + 1 })); }} onDiscard={() => removeCard(msg.id)} />}
                {msg.card === 'deploy' && msg.done && <DeployCard T={T} />}
                {msg.card === 'team' && msg.done && <TeamCard />}

                {/* Actions */}
                {msg.r === 'ai' && msg.done && (
                  <div style={{ display: 'flex', gap: 5, marginTop: 7 }}>
                    <button onClick={() => copyMsg(msg.id, msg.text)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: copiedId === msg.id ? '#10b981' : 'rgba(255,255,255,0.35)', fontSize: 11, cursor: 'pointer', fontFamily: "'Inter',sans-serif", transition: 'all 0.2s' }}>
                      {copiedId === msg.id ? Ic.check : Ic.copy} {copiedId === msg.id ? 'Copied' : 'Copy'}
                    </button>
                    <button onClick={() => setMsgs(p => p.filter(m => m.id !== msg.id))} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)', fontSize: 11, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
                      {Ic.x} Remove
                    </button>
                  </div>
                )}
              </div>

              {msg.r === 'user' && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, hsl(${(displayName.charCodeAt(0)*47)%360},65%,45%), hsl(${((displayName.charCodeAt(0)*47)+60)%360},65%,55%))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, color: '#fff', flexShrink: 0, marginTop: 2 }}>
                  {firstName[0].toUpperCase()}
                </div>
              )}
            </div>
          ))}

          {/* THINKING INDICATOR */}
          {thinking && (
            <div style={{ display: 'flex', gap: 10, animation: 'msgIn .2s ease' }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg,${T.primary},${T.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, boxShadow: `0 2px 10px ${T.glow}` }}>{Ic.bolt}</div>
              <div style={{ padding: '12px 15px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px 16px 16px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', gap: 4 }}>{[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: T.primary, animation: `tdot 1.2s ${i * 0.2}s ease infinite` }} />)}</div>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>{thinkMsg}</span>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* ══ INPUT AREA ══ */}
        <div style={{ padding: '12px 20px 20px', background: '#000', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          {/* Quick action chips */}
          <div style={{ display: 'flex', gap: 7, marginBottom: 12, flexWrap: 'wrap' }}>
            {[
              ['Morning briefing', 'brain'],
              ['Draft CFO reply', 'mail'],
              ['Team standup', 'team'],
              ['Deploy status', 'deploy'],
              ['Schedule meeting', 'cal'],
            ].map(([label, icon]) => (
              <button key={label} onClick={() => { setInput(label); inputRef.current?.focus(); }} style={{ padding: '5px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Inter',sans-serif", transition: 'all 0.18s', whiteSpace: 'nowrap' }} className="chip-h">
                <span style={{ color: T.primary, display: 'flex' }}>{Ic[icon] || Ic.bolt}</span>{label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: 9, alignItems: 'flex-end', background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.primary}22`, borderRadius: 14, padding: '10px 12px', transition: 'all 0.25s' }} className="ibar">
            <div style={{ color: T.primary, display: 'flex', paddingBottom: 2, flexShrink: 0 }}>{Ic.bolt}</div>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
              placeholder="Ask WorkPilot anything... (Enter to send, Shift+Enter for newline)"
              rows={1}
              style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: 14, outline: 'none', resize: 'none', fontFamily: "'Inter',sans-serif", lineHeight: 1.5, maxHeight: 120, overflow: 'auto', paddingBottom: 2 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <button
                onClick={() => setIsListening(v => !v)}
                title="Voice input"
                style={{ width: 34, height: 34, borderRadius: '50%', background: isListening ? `${T.primary}25` : 'rgba(255,255,255,0.05)', border: `1px solid ${isListening ? T.primary + '40' : 'rgba(255,255,255,0.1)'}`, color: isListening ? T.primary : 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', animation: isListening ? 'pulse 1s infinite' : 'none' }}>
                {Ic.mic}
              </button>
              <button
                onClick={sendMsg}
                disabled={!input.trim() || thinking}
                style={{ width: 36, height: 36, borderRadius: '50%', background: input.trim() && !thinking ? `linear-gradient(135deg,${T.primary},${T.secondary})` : 'rgba(255,255,255,0.07)', border: 'none', color: input.trim() && !thinking ? '#fff' : 'rgba(255,255,255,0.3)', cursor: input.trim() && !thinking ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: input.trim() && !thinking ? `0 2px 12px ${T.glow}` : 'none' }}>
                {Ic.send}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: "'JetBrains Mono',monospace" }}>Enter to send · Shift+Enter for newline</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: "'JetBrains Mono',monospace" }}>{input.length}/2000</span>
          </div>
        </div>
      </div>

      {/* STYLES */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }

        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.15)} }
        @keyframes ddrop { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes msgIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tdot { 0%,60%,100%{transform:translateY(0);opacity:.3} 30%{transform:translateY(-4px);opacity:1} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

        .back-btn:hover { background:rgba(255,255,255,0.08)!important; color:#fff!important; }
        .chip-h:hover { background:rgba(59,130,246,0.1)!important; border-color:rgba(59,130,246,0.28)!important; color:#3b82f6!important; }
        .pin-btn:hover { background:rgba(255,255,255,0.07)!important; border-color:rgba(255,255,255,0.12)!important; }
        .pin-row:hover .pin-del { display:flex!important; }
        .menu-row:hover { background:rgba(255,255,255,0.05)!important; }
        .sinput:focus { border-color:rgba(59,130,246,0.3)!important; background:rgba(255,255,255,0.06)!important; outline:none; }
        .ibar:focus-within { border-color:rgba(59,130,246,0.35)!important; box-shadow:0 0 0 3px rgba(59,130,246,0.07)!important; }
      `}</style>
    </div>
  );
}
