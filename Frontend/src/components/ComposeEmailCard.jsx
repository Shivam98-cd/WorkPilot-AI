/**
 * ComposeEmailCard
 * Smart email compose card with AI writing assistant.
 * Supports: rephrase, improve, fix grammar, tone variants, smart suggestions.
 */
import React, { useState, useRef } from 'react';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

async function getAuthToken() {
  try {
    const { auth } = await import('../firebase');
    const t = await auth.currentUser?.getIdToken();
    if (t) return t;
  } catch {}
  const stored = JSON.parse(localStorage.getItem('wp_tokens') || 'null');
  return stored?.accessToken || '';
}

async function callImprove(text, mode) {
  const token = await getAuthToken();
  const res = await fetch(`${API}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ message: `improve_text:${mode}:${text}` }),
  });
  // Read SSE stream
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let result = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') break;
      try {
        const { event, data } = JSON.parse(payload);
        if (event === 'tool_result' && data?.result) {
          result = data.result;
        } else if (event === 'token') {
          result += data;
        }
      } catch {}
    }
  }
  return result;
}

const TONE_BTNS = [
  { mode: 'formal',    label: 'Formal',    icon: '🎩' },
  { mode: 'friendly',  label: 'Friendly',  icon: '😊' },
  { mode: 'brief',     label: 'Brief',     icon: '⚡' },
];

const AI_BTNS = [
  { mode: 'rephrase',    label: 'Rephrase',  icon: '✨' },
  { mode: 'improve',     label: 'Improve',   icon: '🔧' },
  { mode: 'fix_grammar', label: 'Fix',       icon: '✅' },
];

export default function ComposeEmailCard({ data, onSend, onDismiss }) {
  const [to, setTo]           = useState(data?.to || '');
  const [subject, setSubject] = useState(data?.subject || '');
  const [body, setBody]       = useState(data?.body || '');
  const [improving, setImproving] = useState(null);
  const [suggestion, setSuggestion] = useState(null); // {mode, text}
  const bodyRef = useRef(null);

  const handleImprove = async (mode) => {
    if (!body.trim()) return;
    setImproving(mode);
    setSuggestion(null);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: `Please ${mode === 'fix_grammar' ? 'fix grammar in' : mode} this text. Return only the result:\n\n${body}` }),
      });
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      let result = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;
          try {
            const { event, data: d } = JSON.parse(payload);
            if (event === 'token') result += d;
            if (event === 'tool_result' && d?.result) result = d.result;
          } catch {}
        }
      }
      if (result.trim()) setSuggestion({ mode, text: result.trim() });
    } catch (e) {
      console.error('improve failed:', e);
    } finally {
      setImproving(null);
    }
  };

  const acceptSuggestion = () => {
    if (suggestion) { setBody(suggestion.text); setSuggestion(null); }
  };

  const handleSend = () => {
    if (!to.trim()) { bodyRef.current?.focus(); return; }
    onSend?.({ to, subject, body });
  };

  const isReady = to.trim() && subject.trim() && body.trim();

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(99,102,241,0.05))',
      border: '1px solid rgba(59,130,246,0.25)',
      borderRadius: 16, overflow: 'hidden', marginTop: 10,
    }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>✉</div>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.06em' }}>COMPOSE EMAIL</span>
        <button onClick={onDismiss} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
      </div>

      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* To field */}
        <div>
          <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>To</label>
          <input
            value={to}
            onChange={e => setTo(e.target.value)}
            placeholder="recipient@example.com or name"
            style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${to ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box', transition: 'border-color 0.2s' }}
            onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.6)'}
            onBlur={e => e.target.style.borderColor = to ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)'}
          />
        </div>

        {/* Subject field */}
        <div>
          <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Subject</label>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Email subject"
            style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${subject ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box', transition: 'border-color 0.2s' }}
            onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.6)'}
            onBlur={e => e.target.style.borderColor = subject ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)'}
          />
        </div>

        {/* Body field */}
        <div>
          <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Message</label>
          <textarea
            ref={bodyRef}
            value={body}
            onChange={e => { setBody(e.target.value); setSuggestion(null); }}
            placeholder="Write your message... or let AI draft it"
            rows={5}
            style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: "'Inter',sans-serif", lineHeight: 1.6, boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        {/* AI suggestion preview */}
        {suggestion && (
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: '#10b981', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>✨ AI {suggestion.mode} suggestion</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{suggestion.text}</div>
            <div style={{ display: 'flex', gap: 7, marginTop: 8 }}>
              <button onClick={acceptSuggestion} style={{ padding: '5px 12px', borderRadius: 7, background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.35)', color: '#10b981', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>✓ Use this</button>
              <button onClick={() => setSuggestion(null)} style={{ padding: '5px 12px', borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer' }}>Dismiss</button>
            </div>
          </div>
        )}

        {/* AI writing tools */}
        {body.trim() && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', alignSelf: 'center', marginRight: 2 }}>AI:</span>
            {AI_BTNS.map(btn => (
              <button
                key={btn.mode}
                onClick={() => handleImprove(btn.mode)}
                disabled={!!improving}
                style={{ padding: '4px 9px', borderRadius: 20, background: improving === btn.mode ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', fontSize: 11, cursor: improving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}
              >
                {improving === btn.mode ? '⟳' : btn.icon} {btn.label}
              </button>
            ))}
            {TONE_BTNS.map(btn => (
              <button
                key={btn.mode}
                onClick={() => handleImprove(btn.mode)}
                disabled={!!improving}
                style={{ padding: '4px 9px', borderRadius: 20, background: improving === btn.mode ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.55)', fontSize: 11, cursor: improving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}
              >
                {improving === btn.mode ? '⟳' : btn.icon} {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* Quick reply suggestions when body is empty */}
        {!body.trim() && to && subject && (
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 5 }}>Quick starts:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {[
                'Could we schedule a quick call to discuss this?',
                'Thank you for reaching out. I will review and get back to you shortly.',
                'Please let me know a convenient time for a meeting.',
              ].map((s, i) => (
                <button key={i} onClick={() => setBody(s)} style={{ padding: '5px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)', fontSize: 11, cursor: 'pointer', textAlign: 'left' }}>{s}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onDismiss} style={{ padding: '8px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
        <button
          onClick={handleSend}
          disabled={!isReady}
          style={{ padding: '8px 18px', borderRadius: 9, background: isReady ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'rgba(255,255,255,0.06)', border: 'none', color: isReady ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 700, cursor: isReady ? 'pointer' : 'not-allowed', boxShadow: isReady ? '0 3px 14px rgba(59,130,246,0.4)' : 'none', transition: 'all 0.2s' }}
        >
          ✉ Send Email
        </button>
      </div>
    </div>
  );
}
