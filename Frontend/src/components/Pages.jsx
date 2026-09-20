import React, { useState, useEffect, useRef } from 'react';
import { SiGmail, SiGooglecalendar, SiGithub, SiZoom, SiNotion, SiJira, SiGoogledrive, SiGooglemeet } from 'react-icons/si';
import { useToast } from './Toast';
import { SkeletonCard, SkeletonTable } from './Skeleton';
import { getEmails, getEmailCounts, getEmailBody, markEmailRead, markEmailUnread, archiveEmail, deleteEmail, starEmail, draftEmail, sendEmail, triageEmails, getCalendarEvents, createCalendarEvent, deleteCalendarEvent, aiScheduleEvent, getTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember, getDeployments, getDeploymentLogs, createDeployment, rollbackDeployment, getDocuments, uploadDocument, askDocumentAI, deleteDocument, getAnalytics, getIntegrations, authorizeIntegration, disconnectIntegration, syncIntegration, requestIntegration, updateProfile } from '../api';
import { auth, updatePassword, EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail } from '../firebase';

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

export function Card({ children, style = {}, accent }) {
  return (
    <div className="card" style={{ background: '#101014', borderRadius: 20, border: `1px solid ${C.border}`, padding: '20px 22px', position: 'relative', overflow: 'hidden', ...style }}>
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
export function EmailPage({ T }) {
  const [folder, setFolder]           = useState('inbox');
  const [data, setData]               = useState([]);
  const [counts, setCounts]           = useState({});
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);
  const [search, setSearch]           = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [draftText, setDraftText]     = useState('');
  const [sendingDraft, setSendingDraft] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo]     = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sendingCompose, setSendingCompose] = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [showTriageModal, setShowTriageModal] = useState(false);
  const [triageData, setTriageData]   = useState(null);
  const [triaging, setTriaging]       = useState(false);
  const { showToast } = useToast();

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch emails when folder or search changes
  const fetchEmails = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await getEmails(folder, searchDebounced, 25);
      setData(res.data || []);
    } catch (e) {
      showToast(e.message || 'Failed to load emails', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch folder counts
  const fetchCounts = async () => {
    try {
      const res = await getEmailCounts();
      setCounts(res.data || {});
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchEmails(); fetchCounts(); }, [folder, searchDebounced]);

  // When opening an email, mark it read immediately (optimistic) + lazy-load body
  const openEmail = async (em) => {
    setSelected(em);
    setDraftText('');
    if (!em.read) {
      markEmailRead(em.id).catch(() => {});
      setData(prev => prev.map(e => e.id === em.id ? { ...e, read: true } : e));
    }
    // Lazy-load full body if not yet fetched (list used metadata-only format)
    if (!em._bodyLoaded) {
      try {
        const res = await getEmailBody(em.id);
        if (res?.data) {
          const full = { ...res.data, _bodyLoaded: true };
          setSelected(full);
          setData(prev => prev.map(e => e.id === em.id ? full : e));
        }
      } catch { /* keep showing snippet as fallback */ }
    }
  };

  // Star toggle
  const handleStar = async (em, e) => {
    e.stopPropagation();
    const newStarred = !em.starred;
    setData(prev => prev.map(x => x.id === em.id ? { ...x, starred: newStarred } : x));
    if (selected?.id === em.id) setSelected(s => ({ ...s, starred: newStarred }));
    try { await starEmail(em.id, newStarred); } catch { /* silent */ }
  };

  // Archive
  const handleArchive = async (em) => {
    setData(prev => prev.filter(x => x.id !== em.id));
    if (selected?.id === em.id) setSelected(null);
    showToast('Email archived', 'info');
    try { await archiveEmail(em.id); } catch { /* silent */ }
  };

  // Delete / Trash
  const handleDelete = async (em) => {
    setData(prev => prev.filter(x => x.id !== em.id));
    if (selected?.id === em.id) setSelected(null);
    showToast('Moved to trash', 'info');
    try { await deleteEmail(em.id); } catch { /* silent */ }
  };

  // Mark unread
  const handleMarkUnread = async (em) => {
    setData(prev => prev.map(x => x.id === em.id ? { ...x, read: false } : x));
    showToast('Marked as unread', 'info');
    try { await markEmailUnread(em.id); } catch { /* silent */ }
  };

  // AI Draft Reply
  const handleAIDraft = async () => {
    showToast('AI is drafting response...', 'info');
    try {
      const senderEmail = selected.from_email || selected.from || '';
      const res = await draftEmail({ to: senderEmail, subject: selected.subject, prompt: `Reply to: "${selected.preview || selected.body || ''}"` });
      setDraftText(res.data?.draft || res.data?.body || '');
    } catch {
      setDraftText(`Hi ${selected.from || 'there'},\n\nThank you for reaching out regarding "${selected.subject}". I've reviewed this and will follow up shortly.\n\nBest regards`);
    }
  };

  // Send reply
  const handleSendDraft = async () => {
    if (!draftText.trim()) return;
    setSendingDraft(true);
    try {
      const senderEmail = selected.from_email || selected.from || '';
      await sendEmail({ to: senderEmail, subject: selected.subject?.startsWith('Re:') ? selected.subject : `Re: ${selected.subject}`, body: draftText });
      showToast('Reply sent!', 'success');
      setDraftText('');
      fetchEmails(false);
    } catch (err) { showToast(err.message || 'Failed to send', 'error'); }
    finally { setSendingDraft(false); }
  };

  // Compose send
  const handleSendCompose = async () => {
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
      showToast('Fill in recipient, subject, and message.', 'error'); return;
    }
    setSendingCompose(true);
    try {
      await sendEmail({ to: composeTo, subject: composeSubject, body: composeBody });
      showToast('Email sent!', 'success');
      setShowCompose(false); setComposeTo(''); setComposeSubject(''); setComposeBody('');
      fetchEmails(false);
    } catch (err) { showToast(err.message || 'Failed to send', 'error'); }
    finally { setSendingCompose(false); }
  };

  // AI Triage
  const handleTriage = async () => {
    setTriaging(true);
    showToast('Running AI inbox triage...', 'info');
    try {
      const res = await triageEmails();
      const t = res.data;
      setTriageData(t);
      setShowTriageModal(true);
      showToast(`Triage Complete: ${t?.total_emails || 0} emails analyzed.`, 'success');
      const first = data.find(e => e.priority === 'urgent');
      if (first) setSelected(first);
    } catch (e) {
      showToast('Triage failed: ' + (e.message || 'unknown error'), 'error');
    } finally {
      setTriaging(false);
    }
  };

  const FOLDER_TABS = [
    { key: 'inbox',    icon: '📥', label: 'Inbox',    badge: counts.inbox },
    { key: 'starred',  icon: '⭐', label: 'Starred',  badge: counts.starred },
    { key: 'sent',     icon: '📤', label: 'Sent',     badge: counts.sent },
    { key: 'drafts',   icon: '📝', label: 'Drafts',   badge: counts.drafts },
    { key: 'archived', icon: '📦', label: 'Archived', badge: null },
    { key: 'trash',    icon: '🗑', label: 'Trash',    badge: null },
  ];

  const unreadCount = data.filter(e => !e.read).length;
  const urgentCount = data.filter(e => e.priority === 'urgent').length;

  const inputStyle = { width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' };

  return (
    <PageShell title="Email" subtitle="Real-time Gmail sync" icon="📧" accent={T.primary}
      actions={<>
        <button onClick={() => fetchEmails(false)} title="Refresh" style={{ background: 'none', border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: '7px 10px', cursor: 'pointer', fontSize: 14, transition: 'all 0.2s', display: 'flex', alignItems: 'center' }} className={refreshing ? 'spin' : ''}>🔄</button>
        <Btn color={T.primary} ghost onClick={handleTriage}>⚡ AI Triage</Btn>
        <Btn color={T.primary} onClick={() => setShowCompose(true)}>✉ Compose</Btn>
      </>}>

      {/* ── Compose Modal ── */}
      {showCompose && (
        <Card style={{ marginBottom: 16, border: `1px solid ${T.primary}40` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14 }}>✉ New Message</span>
            <button onClick={() => setShowCompose(false)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input placeholder="To: recipient@example.com" value={composeTo} onChange={e => setComposeTo(e.target.value)} style={inputStyle} />
            <input placeholder="Subject" value={composeSubject} onChange={e => setComposeSubject(e.target.value)} style={inputStyle} />
            <textarea placeholder="Write your message..." rows={5} value={composeBody} onChange={e => setComposeBody(e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Btn ghost color={C.muted} onClick={() => setShowCompose(false)}>Cancel</Btn>
              <Btn color={T.primary} onClick={handleSendCompose}>{sendingCompose ? 'Sending...' : '↗ Send'}</Btn>
            </div>
          </div>
        </Card>
      )}

      {/* ── AI Triage Modal ── */}
      {showTriageModal && triageData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }} onClick={() => setShowTriageModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 540, background: '#121218', borderRadius: 16, border: `1px solid ${T.primary}40`, padding: '24px 26px', boxShadow: `0 20px 60px rgba(0,0,0,0.8), 0 0 30px ${T.primary}20` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>⚡</span>
                <div>
                  <h3 style={{ margin: 0, fontFamily: "'Sora',sans-serif", fontSize: 17, color: '#fff' }}>AI Inbox Triage</h3>
                  <p style={{ margin: 0, fontSize: 12, color: C.muted }}>Automated priority analysis powered by WorkPilot AI</p>
                </div>
              </div>
              <button onClick={() => setShowTriageModal(false)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: `1px solid ${C.border}`, textAlign: 'center' }}>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 24, color: T.primary }}>{triageData.total_emails || 0}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Emails Analyzed</div>
              </div>
              <div style={{ padding: '14px', background: triageData.urgent_count > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)', borderRadius: 10, border: `1px solid ${triageData.urgent_count > 0 ? C.red + '40' : C.border}`, textAlign: 'center' }}>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 24, color: triageData.urgent_count > 0 ? C.red : C.green }}>{triageData.urgent_count || 0}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Urgent Items Requiring Action</div>
              </div>
            </div>

            {/* Summary */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 6, fontFamily: "'JetBrains Mono',monospace" }}>Summary</div>
              <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>{triageData.triage_summary}</div>
            </div>

            {/* Action items */}
            {triageData.action_items && triageData.action_items.length > 0 ? (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 8, fontFamily: "'JetBrains Mono',monospace" }}>Recommended Actions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {triageData.action_items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: `1px solid ${C.border}` }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{item.action}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{item.recipient} · {item.subject || 'Followup'}</div>
                      </div>
                      <Btn color={T.primary} style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => {
                        setShowTriageModal(false);
                        const match = data.find(e => (e.from_email === item.recipient || e.from === item.recipient));
                        if (match) setSelected(match);
                        else {
                          setComposeTo(item.recipient);
                          setComposeSubject(`Re: ${item.subject || 'Followup'}`);
                          setShowCompose(true);
                        }
                      }}>Execute →</Btn>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.08)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)', color: C.green, fontSize: 12, marginBottom: 16 }}>
                ✓ All inbox messages are in order. No critical or blocked items detected.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <Btn color={T.primary} onClick={() => setShowTriageModal(false)}>Close Triage</Btn>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 14, height: 'calc(100vh - 220px)', minHeight: 420 }}>
        {/* ── Left Panel: folder tabs + email list ── */}
        <Card style={{ width: 380, flexShrink: 0, padding: 0, display: 'flex', flexDirection: 'column' }} accent={T.primary}>
          {/* Folder tabs */}
          <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', borderBottom: `1px solid ${C.border}`, padding: '0 4px' }}>
            {FOLDER_TABS.map(ft => (
              <button key={ft.key} onClick={() => { setFolder(ft.key); setSelected(null); }}
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '10px 8px', background: 'none', border: 'none', borderBottom: folder === ft.key ? `2px solid ${T.primary}` : '2px solid transparent', color: folder === ft.key ? T.primary : C.muted, fontSize: 11, fontWeight: folder === ft.key ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s', fontFamily: "'Inter',sans-serif" }}>
                {ft.icon} {ft.label}
                {ft.badge > 0 && <span style={{ background: T.primary, color: '#fff', borderRadius: 99, fontSize: 9, fontWeight: 700, padding: '1px 5px', marginLeft: 2 }}>{ft.badge > 99 ? '99+' : ft.badge}</span>}
              </button>
            ))}
          </div>
          {/* Search + stats */}
          <div style={{ padding: '8px 10px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input placeholder="Search emails..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, padding: '6px 10px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 7, color: C.text, fontSize: 12, outline: 'none', fontFamily: "'Inter',sans-serif" }} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 13 }}>✕</button>}
          </div>
          {folder === 'inbox' && (
            <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
              {[[String(urgentCount), '🔴 Urgent', C.red], [String(unreadCount), '🔵 Unread', T.primary], [String(data.length), 'Total', C.muted]].map(([n, l, c]) => (
                <div key={l} style={{ flex: 1, padding: '8px 6px', textAlign: 'center', borderRight: `1px solid ${C.border}` }}>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 16, color: c }}>{n}</div>
                  <div style={{ fontSize: 9, color: C.muted }}>{l}</div>
                </div>
              ))}
            </div>
          )}
          {/* Email list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? <SkeletonTable rows={6} cols={1} /> : data.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: C.muted, fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                {search ? `No results for "${search}"` : `No messages in ${folder}`}
              </div>
            ) : data.map(em => (
              <div key={em.id} onClick={() => openEmail(em)}
                style={{ padding: '11px 14px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', background: selected?.id === em.id ? `${T.primary}14` : 'transparent', borderLeft: selected?.id === em.id ? `3px solid ${T.primary}` : '3px solid transparent', transition: 'all 0.15s' }} className="pg-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  {/* Unread dot */}
                  <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: em.read ? 'transparent' : em.priority === 'urgent' ? C.red : T.primary, boxShadow: (!em.read && em.priority === 'urgent') ? `0 0 5px ${C.red}` : 'none' }} />
                  <Avatar name={em.from || 'User'} size={20} />
                  <span style={{ flex: 1, fontSize: 12, fontWeight: em.read ? 400 : 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{em.from}</span>
                  {/* Star button */}
                  <button onClick={(e) => handleStar(em, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: em.starred ? '#f59e0b' : C.muted, padding: '0 2px', transition: 'all 0.15s', lineHeight: 1 }}>{em.starred ? '★' : '☆'}</button>
                  <span style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>{em.time}</span>
                </div>
                <div style={{ fontSize: 12, color: C.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: em.read ? 400 : 600, paddingLeft: 12 }}>{em.subject}</div>
                <div style={{ fontSize: 11, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 12, marginTop: 2 }}>{em.preview}</div>
                {em.priority === 'urgent' && <span style={{ marginLeft: 12, fontSize: 9, fontWeight: 700, color: C.red, fontFamily: "'JetBrains Mono',monospace" }}>⚠ URGENT</span>}
              </div>
            ))}
          </div>
        </Card>

        {/* ── Right Panel: email detail ── */}
        <Card style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} accent={selected ? T.primary : undefined}>
          {selected ? (
            <>
              {/* Header */}
              <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 16, margin: '0 0 8px 0', color: C.text, lineHeight: 1.3 }}>{selected.subject}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <Avatar name={selected.from || 'User'} size={26} />
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 13, color: C.text, fontFamily: "'Sora',sans-serif" }}>{selected.from}</span>
                        {selected.from_email && selected.from_email !== selected.from && (
                          <span style={{ fontSize: 11, color: C.muted, marginLeft: 6 }}>&lt;{selected.from_email}&gt;</span>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: C.muted }}>{selected.time}</span>
                      {selected.role && <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 5, padding: '1px 5px' }}>{selected.role}</span>}
                      {selected.priority === 'urgent' && <span style={{ fontSize: 10, fontWeight: 700, color: C.red, border: `1px solid ${C.red}40`, borderRadius: 5, padding: '1px 6px' }}>⚠ Urgent</span>}
                      {selected.starred && <span style={{ color: '#f59e0b', fontSize: 13 }}>★</span>}
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.muted, cursor: 'pointer', borderRadius: 7, padding: '5px 9px', fontSize: 12, flexShrink: 0 }}>✕</button>
                </div>
                {/* Action toolbar */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  <Btn color={T.primary} style={{ fontSize: 11, padding: '6px 12px' }} onClick={handleAIDraft}>⚡ AI Draft Reply</Btn>
                  <Btn color={T.primary} ghost style={{ fontSize: 11, padding: '6px 12px' }} onClick={() => setDraftText(`Hi ${selected.from || 'there'},\n\n`)}>↩ Reply</Btn>
                  <Btn color={T.accent || '#f59e0b'} ghost style={{ fontSize: 11, padding: '6px 12px' }} onClick={(e) => handleStar(selected, e)}>{selected.starred ? '★ Unstar' : '☆ Star'}</Btn>
                  <Btn color="#94a3b8" ghost style={{ fontSize: 11, padding: '6px 12px' }} onClick={() => handleMarkUnread(selected)}>✉ Mark Unread</Btn>
                  <Btn color="#f59e0b" ghost style={{ fontSize: 11, padding: '6px 12px' }} onClick={() => handleArchive(selected)}>📥 Archive</Btn>
                  <Btn color={C.red} ghost style={{ fontSize: 11, padding: '6px 12px' }} onClick={() => handleDelete(selected)}>🗑 Delete</Btn>
                </div>
              </div>
              {/* Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
                <div style={{ background: 'rgba(255,255,255,0.025)', borderRadius: 12, border: `1px solid ${C.border}`, padding: '18px 20px', fontSize: 13.5, color: C.sub, lineHeight: 1.85, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: "'Inter',sans-serif" }}>
                  {selected.body || selected.preview || 'No email content available.'}
                </div>
                {/* Reply composer */}
                {draftText !== '' && (
                  <div style={{ marginTop: 18 }}>
                    <div style={{ fontSize: 12, color: T.primary, marginBottom: 8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                      ↩ Reply to {selected.from}
                      <button onClick={() => setDraftText('')} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 12, marginLeft: 'auto' }}>✕ Cancel</button>
                    </div>
                    <textarea value={draftText} onChange={e => setDraftText(e.target.value)} rows={5}
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, fontSize: 13, fontFamily: "'Inter',sans-serif", outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <Btn color={T.primary} onClick={handleSendDraft}>{sendingDraft ? 'Sending...' : '↗ Send Reply'}</Btn>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 48 }}>📬</div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, color: C.sub, fontSize: 15 }}>Select an email to read</div>
              <div style={{ fontSize: 12, color: C.muted }}>Or click ⚡ AI Triage to analyze your inbox</div>
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
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad2 = (n) => String(n).padStart(2, '0');
const toIsoDate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

export function CalendarPage({ T }) {
  const [view, setView] = useState('week'); // 'week' | 'month' | 'day' | 'agenda'
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [miniDate, setMiniDate] = useState(() => new Date());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Filters & Search
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'meet' | 'meeting' | 'deadline' | 'focus'
  const [searchQuery, setSearchQuery] = useState('');

  // Create form state
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(() => toIsoDate(new Date()));
  const [newTime, setNewTime] = useState('10:00');
  const [newDuration, setNewDuration] = useState(30);
  const [newAttendees, setNewAttendees] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newCreateMeet, setNewCreateMeet] = useState(true);
  const [creating, setCreating] = useState(false);

  const { showToast } = useToast();

  const fetchEvents = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    getCalendarEvents()
      .then(r => {
        setData(r.data || []);
        setError(null);
      })
      .catch(e => setError(e.message))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Synchronize mini calendar month if selectedDate changes
  useEffect(() => {
    setMiniDate(new Date(selectedDate));
  }, [selectedDate]);

  // Normalize event fields for consistent UI rendering
  const normalizedEvents = (data || []).map(e => {
    let dateStr = e.date || '';
    let startHm = e.startTime || '';
    let endHm = e.endTime || '';
    let dur = e.duration || 30;

    // Fallback extraction from ISO start if needed
    if (!dateStr && e.start && e.start.includes('T')) {
      const parts = e.start.split('T');
      dateStr = parts[0];
      if (!startHm) startHm = parts[1].slice(0, 5);
    } else if (!dateStr && e.time && e.time.includes('T')) {
      const parts = e.time.split('T');
      dateStr = parts[0];
      if (!startHm) startHm = parts[1].slice(0, 5);
    } else if (!dateStr && e.time && e.time.length === 5) {
      dateStr = toIsoDate(selectedDate);
      startHm = e.time;
    }

    if (!startHm) startHm = '10:00';

    const meetLink = e.meet_link || e.hangoutLink || '';
    let color = e.color || T.primary;
    let tag = e.tag || 'Meeting';

    if (meetLink) {
      color = '#8b5cf6';
      tag = 'Google Meet';
    } else if (tag === 'Google Calendar') {
      color = '#10b981';
    }

    return {
      ...e,
      date: dateStr,
      startTime: startHm,
      endTime: endHm,
      duration: dur,
      meet_link: meetLink,
      color,
      tag,
      attendees: Array.isArray(e.attendees) ? e.attendees : [],
    };
  });

  // Filter events based on active category & search query
  const filteredEvents = normalizedEvents.filter(ev => {
    if (categoryFilter === 'meet' && !ev.meet_link) return false;
    if (categoryFilter === 'meeting' && ev.meet_link) return false;
    if (categoryFilter === 'deadline' && ev.tag !== 'Deadline') return false;
    if (categoryFilter === 'focus' && ev.tag !== 'Focus Block') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (ev.title || '').toLowerCase().includes(q);
      const matchDesc = (ev.description || '').toLowerCase().includes(q);
      const matchAtt = (ev.attendees || []).some(a => a.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchAtt) return false;
    }
    return true;
  });

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(selectedDate);
    if (view === 'day') d.setDate(d.getDate() - 1);
    else if (view === 'week') d.setDate(d.getDate() - 7);
    else if (view === 'month') d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    setSelectedDate(d);
  };

  const handleNext = () => {
    const d = new Date(selectedDate);
    if (view === 'day') d.setDate(d.getDate() + 1);
    else if (view === 'week') d.setDate(d.getDate() + 7);
    else if (view === 'month') d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    setSelectedDate(d);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
    setMiniDate(new Date());
  };

  // Click empty slot on week/day grid to create
  const handleSlotClick = (dateObj, hourStr) => {
    setNewDate(toIsoDate(dateObj));
    setNewTime(hourStr);
    setNewTitle('');
    setNewAttendees('');
    setNewDescription('');
    setNewLocation('');
    setShowCreateModal(true);
  };

  // Create event submission
  const handleCreateEvent = async () => {
    if (!newTitle.trim()) {
      showToast('Please enter an event title', 'error');
      return;
    }
    setCreating(true);
    try {
      const attendeesList = newAttendees
        .split(',')
        .map(s => s.trim())
        .filter(s => s.includes('@'));

      await createCalendarEvent({
        title: newTitle.trim(),
        date: newDate,
        time: newTime,
        duration: Number(newDuration),
        create_meet: newCreateMeet,
        attendees: attendeesList,
        description: newDescription.trim(),
        location: newLocation.trim(),
      });
      showToast('Event scheduled successfully with Google Meet!', 'success');
      setShowCreateModal(false);
      setNewTitle('');
      setNewAttendees('');
      setNewDescription('');
      fetchEvents(true);
    } catch (err) {
      showToast(err.message || 'Failed to create calendar event', 'error');
    } finally {
      setCreating(false);
    }
  };

  // Delete event handler
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteCalendarEvent(eventId);
      showToast('Event removed from calendar', 'success');
      if (showDetailModal && showDetailModal.id === eventId) {
        setShowDetailModal(null);
      }
      fetchEvents(true);
    } catch (err) {
      showToast(err.message || 'Failed to delete event', 'error');
    }
  };

  // AI Scheduling handler
  const handleAiSchedule = async () => {
    if (!aiPrompt.trim()) {
      showToast('Please enter a scheduling instruction', 'error');
      return;
    }
    setAiLoading(true);
    try {
      const res = await aiScheduleEvent(aiPrompt.trim());
      if (res && res.success) {
        showToast('Meeting parsed & scheduled with Google Meet!', 'success');
        setShowAiModal(false);
        setAiPrompt('');
        fetchEvents(true);
      } else {
        showToast(res.message || 'Could not schedule event', 'error');
      }
    } catch (err) {
      showToast(err.message || 'AI Scheduling failed', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  // Selected date events for sidebar agenda
  const selectedDateStr = toIsoDate(selectedDate);
  const selectedDayEvents = filteredEvents.filter(e => e.date === selectedDateStr);

  // Week days calculation (Monday -> Sunday)
  const currDayIndex = (selectedDate.getDay() + 6) % 7;
  const weekStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - currDayIndex);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  // Header Title Formatting
  let headerTitle = '';
  if (view === 'month') {
    headerTitle = `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  } else if (view === 'week') {
    const firstW = weekDays[0];
    const lastW = weekDays[6];
    if (firstW.getMonth() === lastW.getMonth()) {
      headerTitle = `${MONTH_NAMES_SHORT[firstW.getMonth()]} ${firstW.getDate()} – ${lastW.getDate()}, ${firstW.getFullYear()}`;
    } else {
      headerTitle = `${MONTH_NAMES_SHORT[firstW.getMonth()]} ${firstW.getDate()} – ${MONTH_NAMES_SHORT[lastW.getMonth()]} ${lastW.getDate()}, ${lastW.getFullYear()}`;
    }
  } else if (view === 'day') {
    headerTitle = `${DAYS[(selectedDate.getDay() + 6) % 7]}, ${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`;
  } else {
    headerTitle = `Schedule Agenda · ${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  }

  // Mini Calendar grid logic
  const miniYear = miniDate.getFullYear();
  const miniMonth = miniDate.getMonth();
  const firstDayOfMiniMonth = new Date(miniYear, miniMonth, 1);
  const miniStartDayOffset = (firstDayOfMiniMonth.getDay() + 6) % 7;
  const daysInMiniMonth = new Date(miniYear, miniMonth + 1, 0).getDate();
  const daysInPrevMiniMonth = new Date(miniYear, miniMonth, 0).getDate();

  const miniCells = [];
  // Previous month overflow days
  for (let i = miniStartDayOffset - 1; i >= 0; i--) {
    miniCells.push({
      day: daysInPrevMiniMonth - i,
      month: miniMonth - 1,
      year: miniYear,
      isCurrentMonth: false,
    });
  }
  // Current month days
  for (let i = 1; i <= daysInMiniMonth; i++) {
    miniCells.push({
      day: i,
      month: miniMonth,
      year: miniYear,
      isCurrentMonth: true,
    });
  }
  // Next month overflow days to complete 35 or 42 cells
  const remaining = 35 - miniCells.length;
  const targetCells = remaining < 0 ? 42 : 35;
  const toAdd = targetCells - miniCells.length;
  for (let i = 1; i <= toAdd; i++) {
    miniCells.push({
      day: i,
      month: miniMonth + 1,
      year: miniYear,
      isCurrentMonth: false,
    });
  }

  const realToday = new Date();

  return (
    <PageShell
      title="Calendar"
      subtitle="Executive schedule, real-time Google Meet sync & AI assistant"
      icon="📅"
      accent={T.primary}
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Navigation Controls */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 10, padding: 3 }}>
            <button
              onClick={handlePrev}
              title="Previous"
              style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: C.text, cursor: 'pointer', borderRadius: 6, fontSize: 13 }}
              className="pg-btn btn-ghost"
            >
              ◀
            </button>
            <button
              onClick={handleToday}
              style={{ padding: '0 12px', height: 30, background: 'none', border: 'none', color: C.text, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'Inter',sans-serif" }}
              className="pg-btn btn-ghost"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              title="Next"
              style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: C.text, cursor: 'pointer', borderRadius: 6, fontSize: 13 }}
              className="pg-btn btn-ghost"
            >
              ▶
            </button>
          </div>

          {/* View Mode Switcher */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 10, padding: 3 }}>
            {[
              { id: 'week', label: 'Week' },
              { id: 'month', label: 'Month' },
              { id: 'day', label: 'Day' },
              { id: 'agenda', label: 'Agenda' },
            ].map(v => {
              const active = view === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 7,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "'Inter',sans-serif",
                    background: active ? `${T.primary}25` : 'transparent',
                    color: active ? T.primary : C.muted,
                    boxShadow: active ? `0 0 12px ${T.primary}30` : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {v.label}
                </button>
              );
            })}
          </div>

          {/* AI Schedule Button */}
          <Btn
            color="#8b5cf6"
            onClick={() => setShowAiModal(true)}
            style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', border: 'none' }}
          >
            ⚡ AI Schedule
          </Btn>

          {/* New Event Button */}
          <Btn
            color={T.primary}
            onClick={() => {
              setNewDate(toIsoDate(selectedDate));
              setNewTime('10:00');
              setNewTitle('');
              setNewAttendees('');
              setNewDescription('');
              setNewLocation('');
              setShowCreateModal(true);
            }}
          >
            + New Event
          </Btn>

          {/* Sync Button */}
          <button
            onClick={() => fetchEvents(true)}
            disabled={refreshing}
            title="Refresh Google Calendar"
            style={{
              width: 38,
              height: 38,
              borderRadius: 9,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${C.border}`,
              color: refreshing ? T.primary : C.muted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: refreshing ? 'default' : 'pointer',
              fontSize: 15,
              animation: refreshing ? 'spin 1s linear infinite' : 'none',
            }}
          >
            🔄
          </button>
        </div>
      }
    >
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .cal-slot-hover:hover { background: rgba(255,255,255,0.035)!important; cursor: pointer; }
        .cal-event-card { transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease; }
        .cal-event-card:hover { transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 8px 24px rgba(0,0,0,0.4)!important; z-index: 20; }
        .mini-day-cell { transition: all 0.12s ease; }
        .mini-day-cell:hover { background: rgba(255,255,255,0.08)!important; }
        .month-cell { transition: background 0.15s ease; }
        .month-cell:hover { background: rgba(255,255,255,0.025); }
      `}</style>

      {/* Main Layout Container */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* ─── LEFT SIDEBAR (280px) ─── */}
        <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Mini Calendar Card */}
          <Card style={{ padding: '16px 16px 18px', background: '#0e0e13' }} accent={T.primary}>
            {/* Month & Year header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, color: C.text }}>
                {MONTH_NAMES[miniMonth]} {miniYear}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => setMiniDate(new Date(miniYear, miniMonth - 1, 1))}
                  style={{ width: 24, height: 24, background: 'none', border: 'none', color: C.muted, cursor: 'pointer', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}
                  className="pg-btn btn-ghost"
                >
                  ◀
                </button>
                <button
                  onClick={() => setMiniDate(new Date(miniYear, miniMonth + 1, 1))}
                  style={{ width: 24, height: 24, background: 'none', border: 'none', color: C.muted, cursor: 'pointer', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}
                  className="pg-btn btn-ghost"
                >
                  ▶
                </button>
              </div>
            </div>

            {/* Days of week header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center', marginBottom: 6 }}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayChar, i) => (
                <div key={i} style={{ fontSize: 10, fontWeight: 600, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>
                  {dayChar}
                </div>
              ))}
            </div>

            {/* Mini Calendar Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {miniCells.map((c, i) => {
                const cellDate = new Date(c.year, c.month, c.day);
                const isSelected = isSameDay(cellDate, selectedDate);
                const isToday = isSameDay(cellDate, realToday);
                const cellIso = toIsoDate(cellDate);
                const hasEvent = normalizedEvents.some(e => e.date === cellIso);

                return (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedDate(cellDate);
                    }}
                    style={{
                      height: 28,
                      width: 28,
                      margin: '0 auto',
                      borderRadius: '50%',
                      border: isToday && !isSelected ? `1px solid ${T.primary}` : 'none',
                      background: isSelected ? T.primary : 'transparent',
                      color: isSelected ? '#fff' : c.isCurrentMonth ? C.text : 'rgba(255,255,255,0.2)',
                      fontSize: 11,
                      fontWeight: isSelected || isToday ? 700 : 400,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                    className="mini-day-cell"
                  >
                    <span>{c.day}</span>
                    {hasEvent && (
                      <span
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          background: isSelected ? '#fff' : (c.isCurrentMonth ? '#8b5cf6' : 'rgba(139,92,246,0.4)'),
                          position: 'absolute',
                          bottom: 2,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Category Filter Pills */}
          <Card style={{ padding: '14px 16px', background: '#0e0e13' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, fontFamily: "'JetBrains Mono',monospace" }}>
              Filter Schedule
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { id: 'all', label: 'All Calendar Events', dot: '#3b82f6', count: normalizedEvents.length },
                { id: 'meet', label: 'Google Meet Calls', dot: '#8b5cf6', count: normalizedEvents.filter(e => e.meet_link).length },
                { id: 'meeting', label: 'In-person / Syncs', dot: '#10b981', count: normalizedEvents.filter(e => !e.meet_link && e.tag !== 'Deadline').length },
                { id: 'deadline', label: 'Critical Deadlines', dot: '#ef4444', count: normalizedEvents.filter(e => e.tag === 'Deadline').length },
              ].map(cat => {
                const active = categoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background: active ? `${cat.dot}18` : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                      textAlign: 'left',
                    }}
                    className="pg-btn btn-ghost"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: cat.dot }} />
                      <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? '#fff' : C.sub }}>
                        {cat.label}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Selected Day Agenda */}
          <Card style={{ padding: '16px', background: '#0e0e13', flex: 1 }} accent={T.accent}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, color: C.text }}>
                  {DAYS[(selectedDate.getDay() + 6) % 7]}, {MONTH_NAMES_SHORT[selectedDate.getMonth()]} {selectedDate.getDate()}
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>
                  {selectedDayEvents.length} scheduled {selectedDayEvents.length === 1 ? 'event' : 'events'}
                </div>
              </div>
              <button
                onClick={() => {
                  setNewDate(toIsoDate(selectedDate));
                  setNewTime('10:00');
                  setShowCreateModal(true);
                }}
                style={{
                  background: `${T.primary}20`,
                  border: `1px solid ${T.primary}40`,
                  color: T.primary,
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + Add
              </button>
            </div>

            {/* Event List for selected day */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto', paddingRight: 2 }}>
              {loading ? (
                <SkeletonCard />
              ) : selectedDayEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 10px', color: C.muted, fontSize: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: `1px dashed ${C.border}` }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>☕</div>
                  No meetings for this day
                  <div style={{ marginTop: 8 }}>
                    <button
                      onClick={() => {
                        setNewDate(toIsoDate(selectedDate));
                        setShowCreateModal(true);
                      }}
                      style={{ fontSize: 11, color: T.primary, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Schedule something
                    </button>
                  </div>
                </div>
              ) : (
                selectedDayEvents.map(ev => (
                  <div
                    key={ev.id}
                    onClick={() => setShowDetailModal(ev)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${C.border}`,
                      borderLeft: `4px solid ${ev.color}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    className="cal-event-card"
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                        {ev.title}
                      </div>
                      <Tag label={ev.tag} color={ev.color} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 11, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>
                      <span>🕒 {ev.startTime || '10:00'}{ev.endTime ? ` - ${ev.endTime}` : ` (${ev.duration}m)`}</span>
                    </div>

                    {/* Google Meet join action button */}
                    {ev.meet_link && (
                      <div style={{ marginTop: 8 }} onClick={e => e.stopPropagation()}>
                        <a
                          href={ev.meet_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 10px',
                            background: 'linear-gradient(135deg,#8b5cf6,#6366f1)',
                            borderRadius: 6,
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 600,
                            textDecoration: 'none',
                            boxShadow: '0 2px 8px rgba(139,92,246,0.3)',
                          }}
                        >
                          <SiGooglemeet size={12} color="#fff" />
                          Join Google Meet
                        </a>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* ─── MAIN CALENDAR VIEW AREA ─── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Main Top Header Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, background: '#0e0e13', padding: '12px 18px', borderRadius: 14, border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 17, color: '#fff' }}>
                {headerTitle}
              </span>
              <span style={{ fontSize: 12, color: C.muted, background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 6, fontFamily: "'JetBrains Mono',monospace" }}>
                {filteredEvents.length} events
              </span>
            </div>

            {/* Quick Search */}
            <div style={{ position: 'relative', width: 220 }}>
              <input
                type="text"
                placeholder="Search schedule..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 28px',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 12,
                  outline: 'none',
                }}
              />
              <span style={{ position: 'absolute', left: 8, top: 6, fontSize: 12, color: C.muted }}>
                🔍
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: 6, top: 5, background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 11 }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* ──── 1. WEEK VIEW ──── */}
          {view === 'week' && (
            <Card style={{ padding: 0, overflow: 'hidden', background: '#0c0c10', border: `1px solid ${C.border}` }} accent={T.primary}>
              {/* Day Columns Header */}
              <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: '#08080c' }}>
                <div style={{ width: 64, flexShrink: 0, borderRight: `1px solid ${C.border}` }} />
                {weekDays.map((d, i) => {
                  const isToday = isSameDay(d, realToday);
                  const isSelected = isSameDay(d, selectedDate);
                  const dayEvents = filteredEvents.filter(e => e.date === toIsoDate(d));

                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedDate(d)}
                      style={{
                        flex: 1,
                        padding: '10px 4px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        borderRight: i < 6 ? `1px solid rgba(255,255,255,0.04)` : 'none',
                        background: isSelected ? 'rgba(255,255,255,0.02)' : 'transparent',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 600, color: isToday ? T.primary : C.muted, textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace" }}>
                        {DAYS[i]}
                      </div>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          background: isToday ? `linear-gradient(135deg,${T.primary},#6366f1)` : (isSelected ? 'rgba(255,255,255,0.1)' : 'transparent'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '4px auto 0',
                          fontFamily: "'Sora',sans-serif",
                          fontWeight: isToday || isSelected ? 800 : 500,
                          fontSize: 13,
                          color: isToday ? '#fff' : (isSelected ? '#fff' : C.text),
                          boxShadow: isToday ? `0 0 14px ${T.primary}50` : 'none',
                        }}
                      >
                        {d.getDate()}
                      </div>
                      <div style={{ fontSize: 9, color: dayEvents.length > 0 ? T.primary : 'transparent', marginTop: 2, fontWeight: 700 }}>
                        ● {dayEvents.length}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Time Grid Scroll Area */}
              <div style={{ overflowY: 'auto', maxHeight: 580, position: 'relative' }}>
                {HOURS.map((hr, hrIndex) => (
                  <div key={hr} style={{ display: 'flex', height: 60, borderBottom: `1px solid rgba(255,255,255,0.035)` }}>
                    {/* Time Label Column */}
                    <div
                      style={{
                        width: 64,
                        flexShrink: 0,
                        paddingTop: 6,
                        paddingRight: 10,
                        textAlign: 'right',
                        fontSize: 10,
                        color: C.muted,
                        fontFamily: "'JetBrains Mono',monospace",
                        borderRight: `1px solid ${C.border}`,
                        background: '#09090d',
                      }}
                    >
                      {hr}
                    </div>

                    {/* 7 Days Columns */}
                    {weekDays.map((d, di) => {
                      const dateIso = toIsoDate(d);
                      const isToday = isSameDay(d, realToday);

                      // Match events starting in this hour on this day
                      const hourPrefix = hr.slice(0, 2);
                      const cellEvents = filteredEvents.filter(e => {
                        if (e.date !== dateIso) return false;
                        const sH = (e.startTime || '10:00').slice(0, 2);
                        return sH === hourPrefix;
                      });

                      // Current time indicator line
                      let showNowLine = false;
                      let nowTopOffset = 0;
                      if (isToday) {
                        const nowH = realToday.getHours();
                        if (nowH === parseInt(hourPrefix, 10)) {
                          showNowLine = true;
                          nowTopOffset = (realToday.getMinutes() / 60) * 60;
                        }
                      }

                      return (
                        <div
                          key={di}
                          onClick={() => handleSlotClick(d, hr)}
                          style={{
                            flex: 1,
                            borderRight: di < 6 ? `1px solid rgba(255,255,255,0.035)` : 'none',
                            position: 'relative',
                            background: isToday ? 'rgba(59,130,246,0.015)' : 'transparent',
                          }}
                          className="cal-slot-hover"
                          title={`Click to schedule event on ${DAYS[di]} at ${hr}`}
                        >
                          {/* Current time red marker line */}
                          {showNowLine && (
                            <div
                              style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                top: nowTopOffset,
                                height: 2,
                                background: '#ef4444',
                                zIndex: 15,
                                boxShadow: '0 0 8px #ef4444',
                              }}
                            >
                              <div
                                style={{
                                  position: 'absolute',
                                  left: -4,
                                  top: -4,
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  background: '#ef4444',
                                }}
                              />
                            </div>
                          )}

                          {/* Events positioned inside hour */}
                          {cellEvents.map(ev => {
                            const minPart = parseInt((ev.startTime || '10:00').slice(3, 5), 10) || 0;
                            const topOffset = (minPart / 60) * 60;
                            const blockHeight = Math.max(34, (ev.duration / 60) * 60 - 4);

                            return (
                              <div
                                key={ev.id}
                                onClick={e => {
                                  e.stopPropagation();
                                  setShowDetailModal(ev);
                                }}
                                style={{
                                  position: 'absolute',
                                  left: 3,
                                  right: 3,
                                  top: topOffset,
                                  height: blockHeight,
                                  borderRadius: 8,
                                  background: `${ev.color}22`,
                                  border: `1px solid ${ev.color}40`,
                                  borderLeft: `4px solid ${ev.color}`,
                                  padding: '4px 6px',
                                  cursor: 'pointer',
                                  overflow: 'hidden',
                                  zIndex: 10,
                                  boxShadow: `0 4px 12px rgba(0,0,0,0.3)`,
                                }}
                                className="cal-event-card"
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {ev.title}
                                  </span>
                                  {ev.meet_link && <SiGooglemeet size={11} color="#fff" />}
                                </div>
                                <div style={{ fontSize: 9, color: `${ev.color}ee`, fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>
                                  {ev.startTime} ({ev.duration}m)
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ──── 2. MONTH VIEW ──── */}
          {view === 'month' && (
            <Card style={{ padding: 0, overflow: 'hidden', background: '#0c0c10', border: `1px solid ${C.border}` }} accent={T.primary}>
              {/* Day Headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${C.border}`, background: '#08080c' }}>
                {DAYS.map((d, i) => (
                  <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: 11, fontWeight: 600, color: C.muted, fontFamily: "'JetBrains Mono',monospace", borderRight: i < 6 ? `1px solid rgba(255,255,255,0.04)` : 'none' }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Month Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(105px, auto)' }}>
                {miniCells.map((c, idx) => {
                  const cellDate = new Date(c.year, c.month, c.day);
                  const isToday = isSameDay(cellDate, realToday);
                  const isSelected = isSameDay(cellDate, selectedDate);
                  const cellIso = toIsoDate(cellDate);
                  const cellEvents = filteredEvents.filter(e => e.date === cellIso);

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(cellDate)}
                      onDoubleClick={() => {
                        setSelectedDate(cellDate);
                        setView('day');
                      }}
                      style={{
                        padding: '6px 8px',
                        borderRight: (idx % 7 < 6) ? `1px solid rgba(255,255,255,0.035)` : 'none',
                        borderBottom: `1px solid rgba(255,255,255,0.035)`,
                        background: isSelected ? 'rgba(59,130,246,0.04)' : (c.isCurrentMonth ? 'transparent' : 'rgba(0,0,0,0.2)'),
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                      className="month-cell"
                    >
                      {/* Top date indicator */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: isToday ? T.primary : 'transparent',
                            color: isToday ? '#fff' : (c.isCurrentMonth ? C.text : 'rgba(255,255,255,0.25)'),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: isToday || isSelected ? 700 : 400,
                          }}
                        >
                          {c.day}
                        </span>

                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleSlotClick(cellDate, '10:00');
                          }}
                          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: 13, cursor: 'pointer', padding: 0 }}
                          title="Add event on this date"
                        >
                          +
                        </button>
                      </div>

                      {/* Event Chips */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, overflow: 'hidden' }}>
                        {cellEvents.slice(0, 3).map(ev => (
                          <div
                            key={ev.id}
                            onClick={e => {
                              e.stopPropagation();
                              setShowDetailModal(ev);
                            }}
                            style={{
                              padding: '2px 5px',
                              borderRadius: 5,
                              background: `${ev.color}25`,
                              borderLeft: `2px solid ${ev.color}`,
                              fontSize: 10,
                              fontWeight: 600,
                              color: '#fff',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            className="cal-event-card"
                          >
                            {ev.meet_link && <SiGooglemeet size={9} color="#fff" />}
                            <span>{ev.startTime} {ev.title}</span>
                          </div>
                        ))}

                        {cellEvents.length > 3 && (
                          <div style={{ fontSize: 9, color: T.primary, fontWeight: 700, paddingLeft: 2 }}>
                            +{cellEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* ──── 3. DAY VIEW ──── */}
          {view === 'day' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Day Header Banner */}
              <Card style={{ padding: '16px 20px', background: 'linear-gradient(135deg,#121218,#191924)' }} accent={T.primary}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h2 style={{ margin: 0, fontFamily: "'Sora',sans-serif", fontSize: 18, color: '#fff' }}>
                      {headerTitle}
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted }}>
                      {selectedDayEvents.length} meetings scheduled · {selectedDayEvents.reduce((acc, e) => acc + (e.duration || 30), 0) / 60} hrs total meeting time
                    </p>
                  </div>
                  <Btn
                    color={T.primary}
                    onClick={() => {
                      setNewDate(toIsoDate(selectedDate));
                      setNewTime('10:00');
                      setShowCreateModal(true);
                    }}
                  >
                    + Schedule Meeting
                  </Btn>
                </div>
              </Card>

              {/* Day Timeline */}
              <Card style={{ padding: 0, overflow: 'hidden', background: '#0c0c10' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {HOURS.map(hr => {
                    const hourPrefix = hr.slice(0, 2);
                    const cellEvents = selectedDayEvents.filter(e => (e.startTime || '10:00').startsWith(hourPrefix));

                    return (
                      <div
                        key={hr}
                        style={{
                          display: 'flex',
                          minHeight: 64,
                          borderBottom: `1px solid rgba(255,255,255,0.04)`,
                        }}
                      >
                        {/* Time label */}
                        <div
                          style={{
                            width: 80,
                            flexShrink: 0,
                            padding: '12px 14px',
                            borderRight: `1px solid ${C.border}`,
                            fontSize: 12,
                            color: C.muted,
                            fontFamily: "'JetBrains Mono',monospace",
                            background: '#09090d',
                          }}
                        >
                          {hr}
                        </div>

                        {/* Content Area */}
                        <div
                          onClick={() => handleSlotClick(selectedDate, hr)}
                          style={{
                            flex: 1,
                            padding: '8px 14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            position: 'relative',
                          }}
                          className="cal-slot-hover"
                        >
                          {cellEvents.length === 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', height: '100%', color: 'rgba(255,255,255,0.15)', fontSize: 11 }}>
                              + Available · Click to schedule
                            </div>
                          ) : (
                            cellEvents.map(ev => (
                              <div
                                key={ev.id}
                                onClick={e => {
                                  e.stopPropagation();
                                  setShowDetailModal(ev);
                                }}
                                style={{
                                  padding: '12px 16px',
                                  borderRadius: 12,
                                  background: `${ev.color}18`,
                                  border: `1px solid ${ev.color}35`,
                                  borderLeft: `5px solid ${ev.color}`,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  flexWrap: 'wrap',
                                  gap: 12,
                                }}
                                className="cal-event-card"
                              >
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                                      {ev.title}
                                    </span>
                                    <Tag label={ev.tag} color={ev.color} />
                                    <span style={{ fontSize: 11, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>
                                      {ev.startTime}{ev.endTime ? ` - ${ev.endTime}` : ''} ({ev.duration}m)
                                    </span>
                                  </div>
                                  {ev.description && (
                                    <p style={{ margin: '4px 0 0', fontSize: 12, color: C.sub }}>
                                      {ev.description}
                                    </p>
                                  )}
                                  {ev.attendees && ev.attendees.length > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 11, color: C.muted }}>
                                      <span>👥 Attendees:</span>
                                      {ev.attendees.map((a, idx) => (
                                        <span key={idx} style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>
                                          {a}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
                                  {ev.meet_link && (
                                    <a
                                      href={ev.meet_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '6px 14px',
                                        background: 'linear-gradient(135deg,#8b5cf6,#6366f1)',
                                        borderRadius: 8,
                                        color: '#fff',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        textDecoration: 'none',
                                      }}
                                    >
                                      <SiGooglemeet size={13} color="#fff" />
                                      Join Google Meet
                                    </a>
                                  )}
                                  <button
                                    onClick={() => handleDeleteEvent(ev.id)}
                                    style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 14 }}
                                    title="Delete event"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* ──── 4. AGENDA VIEW ──── */}
          {view === 'agenda' && (
            <Card style={{ padding: '20px', background: '#0c0c10' }} accent={T.primary}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {filteredEvents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>📅</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>No upcoming events found</div>
                    <p style={{ fontSize: 13, marginTop: 4 }}>Use "+ New Event" or "⚡ AI Schedule" to book your next meeting.</p>
                  </div>
                ) : (
                  // Group by date
                  Object.entries(
                    filteredEvents.reduce((groups, ev) => {
                      const d = ev.date || 'Unscheduled';
                      if (!groups[d]) groups[d] = [];
                      groups[d].push(ev);
                      return groups;
                    }, {})
                  )
                    .sort(([d1], [d2]) => d1.localeCompare(d2))
                    .map(([dateKey, evList]) => {
                      const isTodayDate = dateKey === toIsoDate(realToday);

                      return (
                        <div key={dateKey} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {/* Group header date badge */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span
                              style={{
                                fontFamily: "'Sora',sans-serif",
                                fontWeight: 700,
                                fontSize: 13,
                                color: isTodayDate ? T.primary : '#fff',
                                background: isTodayDate ? `${T.primary}20` : 'rgba(255,255,255,0.06)',
                                border: `1px solid ${isTodayDate ? `${T.primary}40` : C.border}`,
                                padding: '4px 12px',
                                borderRadius: 8,
                              }}
                            >
                              {isTodayDate ? '🔥 Today · ' : ''}{dateKey}
                            </span>
                            <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.06)' }} />
                          </div>

                          {/* Event Cards for Date */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 12 }}>
                            {evList.map(ev => (
                              <div
                                key={ev.id}
                                onClick={() => setShowDetailModal(ev)}
                                style={{
                                  padding: '12px 18px',
                                  borderRadius: 12,
                                  background: '#121218',
                                  border: `1px solid ${C.border}`,
                                  borderLeft: `4px solid ${ev.color}`,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  flexWrap: 'wrap',
                                  gap: 12,
                                }}
                                className="cal-event-card"
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                  <div style={{ minWidth: 90, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.text }}>
                                    🕒 {ev.startTime || '10:00'}
                                  </div>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                                        {ev.title}
                                      </span>
                                      <Tag label={ev.tag} color={ev.color} />
                                    </div>
                                    {ev.description && (
                                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                                        {ev.description.slice(0, 80)}{ev.description.length > 80 ? '...' : ''}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} onClick={e => e.stopPropagation()}>
                                  {ev.meet_link && (
                                    <a
                                      href={ev.meet_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '5px 12px',
                                        background: 'linear-gradient(135deg,#8b5cf6,#6366f1)',
                                        borderRadius: 7,
                                        color: '#fff',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        textDecoration: 'none',
                                      }}
                                    >
                                      <SiGooglemeet size={11} color="#fff" />
                                      Join Meet
                                    </a>
                                  )}
                                  <button
                                    onClick={() => handleDeleteEvent(ev.id)}
                                    style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 13 }}
                                    title="Delete event"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ─── MODAL 1: CREATE EVENT MODAL ─── */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 16,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              background: '#121218',
              borderRadius: 18,
              border: `1px solid ${C.border}`,
              padding: '24px 26px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${T.primary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  📅
                </div>
                <h3 style={{ margin: 0, fontFamily: "'Sora',sans-serif", fontSize: 16, color: '#fff' }}>
                  Create Calendar Event
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            {/* Title */}
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>Event Title *</div>
              <input
                type="text"
                placeholder="e.g. Q4 Strategy Review & Roadmap Sync"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                }}
                autoFocus
              />
            </div>

            {/* Date & Time */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>Date</div>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>Start Time</div>
                <input
                  type="time"
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Duration Selector */}
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>Duration</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[15, 30, 45, 60, 90].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setNewDuration(m)}
                    style={{
                      flex: 1,
                      padding: '6px 0',
                      borderRadius: 7,
                      border: `1px solid ${newDuration === m ? T.primary : C.border}`,
                      background: newDuration === m ? `${T.primary}25` : 'rgba(255,255,255,0.03)',
                      color: newDuration === m ? '#fff' : C.muted,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: "'JetBrains Mono',monospace",
                    }}
                  >
                    {m >= 60 ? `${m / 60}h` : `${m}m`}
                  </button>
                ))}
              </div>
            </div>

            {/* Google Meet Toggle */}
            <div
              onClick={() => setNewCreateMeet(!newCreateMeet)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 10,
                background: newCreateMeet ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${newCreateMeet ? 'rgba(139,92,246,0.4)' : C.border}`,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <SiGooglemeet size={16} color="#8b5cf6" />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Add Google Meet Video</div>
                  <div style={{ fontSize: 10, color: C.muted }}>Generates instant join link for all attendees</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={newCreateMeet}
                onChange={() => {}}
                style={{ width: 16, height: 16, accentColor: '#8b5cf6', cursor: 'pointer' }}
              />
            </div>

            {/* Attendees */}
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>Attendees (comma-separated emails)</div>
              <input
                type="text"
                placeholder="sarah@example.com, alex@example.com"
                value={newAttendees}
                onChange={e => setNewAttendees(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 12,
                  outline: 'none',
                }}
              />
            </div>

            {/* Description */}
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>Description & Notes</div>
              <textarea
                placeholder="Key agenda points or meeting goals..."
                rows={2}
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 12,
                  outline: 'none',
                  resize: 'none',
                }}
              />
            </div>

            {/* Submit buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
              <Btn color="#94a3b8" ghost onClick={() => setShowCreateModal(false)}>
                Cancel
              </Btn>
              <Btn color={T.primary} onClick={handleCreateEvent}>
                {creating ? 'Scheduling...' : 'Create Event'}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: EVENT DETAILS MODAL ─── */}
      {showDetailModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 16,
          }}
          onClick={() => setShowDetailModal(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 460,
              background: '#121218',
              borderRadius: 18,
              border: `1px solid ${C.border}`,
              padding: '24px 26px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <Tag label={showDetailModal.tag} color={showDetailModal.color} />
                <h3 style={{ margin: '8px 0 0', fontFamily: "'Sora',sans-serif", fontSize: 17, color: '#fff' }}>
                  {showDetailModal.title}
                </h3>
              </div>
              <button
                onClick={() => setShowDetailModal(null)}
                style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            {/* Time & Date */}
            <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📅</span>
                <span style={{ fontWeight: 600 }}>{showDetailModal.date || 'Scheduled'}</span>
              </div>
              <div style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontFamily: "'JetBrains Mono',monospace" }}>
                <span>🕒</span>
                <span>{showDetailModal.startTime || '10:00'}{showDetailModal.endTime ? ` – ${showDetailModal.endTime}` : ''} ({showDetailModal.duration || 30} mins)</span>
              </div>
            </div>

            {/* Google Meet Link Banner */}
            {showDetailModal.meet_link ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a
                  href={showDetailModal.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '12px',
                    background: 'linear-gradient(135deg,#8b5cf6,#6366f1)',
                    borderRadius: 10,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 13,
                    textDecoration: 'none',
                    boxShadow: '0 4px 16px rgba(139,92,246,0.35)',
                  }}
                >
                  <SiGooglemeet size={16} color="#fff" />
                  Join with Google Meet
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(showDetailModal.meet_link);
                    showToast('Google Meet link copied to clipboard!', 'success');
                  }}
                  style={{
                    background: 'none',
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    color: C.muted,
                    fontSize: 11,
                    padding: '6px',
                    cursor: 'pointer',
                  }}
                >
                  📋 Copy Meet URL ({showDetailModal.meet_link.slice(0, 30)}...)
                </button>
              </div>
            ) : null}

            {/* Attendees */}
            {showDetailModal.attendees && showDetailModal.attendees.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Attendees</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {showDetailModal.attendees.map((att, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 11,
                        background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${C.border}`,
                        padding: '3px 8px',
                        borderRadius: 6,
                        color: C.sub,
                      }}
                    >
                      ✉️ {att}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {showDetailModal.description && (
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Description</div>
                <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5, background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 8 }}>
                  {showDetailModal.description}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <button
                onClick={() => handleDeleteEvent(showDetailModal.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                🗑️ Delete Event
              </button>
              <Btn color="#94a3b8" ghost onClick={() => setShowDetailModal(null)}>
                Close
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: AI SCHEDULER MODAL ─── */}
      {showAiModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 16,
          }}
          onClick={() => setShowAiModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 520,
              background: '#121218',
              borderRadius: 18,
              border: `1px solid rgba(139,92,246,0.4)`,
              padding: '24px 26px',
              boxShadow: '0 24px 64px rgba(139,92,246,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff' }}>
                  ⚡
                </div>
                <div>
                  <h3 style={{ margin: 0, fontFamily: "'Sora',sans-serif", fontSize: 16, color: '#fff' }}>
                    AI Smart Scheduling Assistant
                  </h3>
                  <p style={{ margin: 0, fontSize: 11, color: C.muted }}>
                    Natural language meeting booking with Google Meet conference
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>
                Describe the meeting you want to schedule:
              </div>
              <textarea
                rows={3}
                placeholder="e.g. Schedule a 45-minute Architecture Review with engineering tomorrow at 3 PM and generate a Meet link"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid rgba(139,92,246,0.3)`,
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                  resize: 'none',
                  fontFamily: "'Inter',sans-serif",
                }}
                autoFocus
              />
            </div>

            {/* Fast suggestions */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 6, fontFamily: "'JetBrains Mono',monospace" }}>
                Quick Prompts
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  'Sync with Frontend team tomorrow at 10 AM for 30m',
                  'Schedule 45m Product Demo on Friday at 2 PM',
                  'Block 1 hour focus time on Thursday at 4 PM',
                ].map(s => (
                  <div
                    key={s}
                    onClick={() => setAiPrompt(s)}
                    style={{
                      padding: '7px 10px',
                      background: 'rgba(139,92,246,0.08)',
                      border: '1px solid rgba(139,92,246,0.2)',
                      borderRadius: 7,
                      fontSize: 11,
                      color: C.sub,
                      cursor: 'pointer',
                    }}
                    className="pg-row"
                  >
                    💬 {s}
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
              <Btn color="#94a3b8" ghost onClick={() => setShowAiModal(false)}>
                Cancel
              </Btn>
              <Btn
                color="#8b5cf6"
                onClick={handleAiSchedule}
                style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)' }}
              >
                {aiLoading ? 'Analyzing & Scheduling...' : '⚡ Generate & Book'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

/* ════════════════════════════════════════
   TEAM PAGE
════════════════════════════════════════ */
const statusColor = { done: C.green, 'on-track': '#3b82f6', delayed: C.amber, missing: C.red };
const statusLabel = { done: '✓ Done', 'on-track': '● On track', delayed: '⚠ Delayed', missing: '✕ Missing' };

export function TeamPage({ T }) {
  const [filter, setFilter] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [standupSummary, setStandupSummary] = useState(null);
  const [initializingTeam, setInitializingTeam] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newProgress, setNewProgress] = useState(50);
  const [newStatus, setNewStatus] = useState('on-track');
  const [newOnline, setNewOnline] = useState(true);
  const [savingMember, setSavingMember] = useState(false);
  const { showToast } = useToast();

  const fetchMembers = () => {
    setLoading(true);
    getTeamMembers()
      .then(r => setData(r.data || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const membersList = data || [];
  const filtered = filter === 'all' ? membersList : membersList.filter(m => m.status === filter);

  const totalCount = membersList.length;
  const onlineCount = membersList.filter(m => m.online).length;
  const delayedCount = membersList.filter(m => m.status === 'delayed').length;
  const missingCount = membersList.filter(m => m.status === 'missing').length;

  const handleAddMember = async (e) => {
    e?.preventDefault();
    if (!newName.trim()) {
      showToast('Please enter member name', 'error');
      return;
    }
    setSavingMember(true);
    try {
      await createTeamMember({
        name: newName.trim(),
        role: newRole.trim() || 'Contributor',
        task: newTask.trim() || 'General tasks',
        progress: Number(newProgress),
        status: newStatus,
        online: newOnline,
      });
      showToast(`Added ${newName} to team!`, 'success');
      setShowAddModal(false);
      setNewName('');
      setNewRole('');
      setNewTask('');
      setNewProgress(50);
      fetchMembers();
    } catch (err) {
      showToast(err.message || 'Failed to add team member', 'error');
    } finally {
      setSavingMember(false);
    }
  };

  const handleDeleteMember = async (id, name) => {
    try {
      await deleteTeamMember(id);
      showToast(`Removed ${name} from team`, 'info');
      fetchMembers();
    } catch (err) {
      showToast(err.message || 'Failed to remove member', 'error');
    }
  };

  const handleInitializeStandardTeam = async () => {
    setInitializingTeam(true);
    const standard = [
      { name: 'Sarah Chen', role: 'Staff Architect', task: 'Enterprise Security Architecture & Auth v2', progress: 85, status: 'on-track', online: true },
      { name: 'Alex Rivera', role: 'Lead Frontend Engineer', task: 'Real-time Cockpit & Dashboard Widgets', progress: 95, status: 'done', online: true },
      { name: 'Priya Patel', role: 'Cloud & DevOps Lead', task: 'CI/CD Cluster Deployment & Rollback Pipeline', progress: 70, status: 'on-track', online: true },
      { name: 'Marcus Bell', role: 'AI Systems Engineer', task: 'SuperBrain Vector Knowledge & RAG Indexing', progress: 40, status: 'delayed', online: false },
    ];
    try {
      for (const m of standard) {
        await createTeamMember(m);
      }
      showToast('Standard team structure initialized in Firestore', 'success');
      fetchMembers();
    } catch (e) {
      showToast(e.message || 'Failed to initialize team', 'error');
    } finally {
      setInitializingTeam(false);
    }
  };

  const handleRunStandup = () => {
    const total = membersList.length;
    const done = membersList.filter(m => m.status === 'done').length;
    const delayed = membersList.filter(m => m.status === 'delayed').length;
    const onTrack = membersList.filter(m => m.status === 'on-track').length;
    const summary = {
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      total, done, delayed, onTrack,
      blockers: membersList.filter(m => m.status === 'delayed' || m.status === 'missing').map(m => `${m.name} (${m.role}): ${m.task || 'No task update'}`),
      recommendation: delayed > 0 
        ? `${delayed} member(s) have tasks delayed or blocked. Prioritize blocker resolution during current sprint cycle.`
        : 'All tracked deliverables are progressing on schedule. Sprint velocity is optimal.',
    };
    setStandupSummary(summary);
    showToast('AI Standup analysis complete', 'success');
  };

  const handleFollowUp = async (member) => {
    showToast(`Follow-up sent to ${member.name}`, 'info');
    try {
      await updateTeamMember(member.id, { task: `${member.task || 'Task'} [Followed up]` });
      fetchMembers();
    } catch {}
  };

  const handleRemind = async (member) => {
    showToast(`Reminder ping sent to ${member.name}`, 'success');
    try {
      await updateTeamMember(member.id, { status: 'delayed' });
      fetchMembers();
    } catch {}
  };

  const handleMarkDone = async (member) => {
    try {
      await updateTeamMember(member.id, { status: 'done', progress: 100 });
      showToast(`Marked ${member.name}'s task complete`, 'success');
      fetchMembers();
    } catch (err) {
      showToast(err.message || 'Failed to update member', 'error');
    }
  };

  return (
    <PageShell title="Team" subtitle="Real-time team status and task tracking" icon="👥" accent={T.primary}
      actions={<>
        <Btn color={T.primary} ghost onClick={handleRunStandup}>⚡ Run Standup</Btn>
        <Btn color={T.primary} onClick={() => setShowAddModal(true)}>+ Add Member</Btn>
      </>}>

      {/* Summary cards with dynamically computed counts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          [totalCount, 'Total Members', T.primary],
          [onlineCount, 'Online Now', C.green],
          [delayedCount, 'Tasks Delayed', C.amber],
          [missingCount, 'No Update', C.red]
        ].map(([n, l, c]) => (
          <Card key={l} accent={c}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 26, color: c }}>{n}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{l}</div>
          </Card>
        ))}
      </div>

      {/* AI Standup Summary Card */}
      {standupSummary && (
        <Card style={{ marginBottom: 20, background: '#13131c', border: `1px solid ${T.primary}50` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>⚡</span>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, color: C.text }}>AI Standup Digest — {standupSummary.timestamp}</div>
            </div>
            <button onClick={() => setStandupSummary(null)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
            <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: C.muted }}>Completion Ratio</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.green }}>{standupSummary.done}/{standupSummary.total} Completed</div>
            </div>
            <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: C.muted }}>Active Attention</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: standupSummary.delayed > 0 ? C.amber : C.green }}>{standupSummary.delayed} Blocked / Delayed</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
            <strong style={{ color: C.text }}>AI Recommendation: </strong>{standupSummary.recommendation}
            {standupSummary.blockers.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <strong style={{ color: C.amber }}>Identified Blockers:</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  {standupSummary.blockers.map((b, idx) => (
                    <li key={idx} style={{ fontSize: 12, color: C.sub }}>{b}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Add Member Modal / Card */}
      {showAddModal && (
        <Card style={{ marginBottom: 20, background: '#16161d', border: `1px solid ${T.primary}40` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: C.text }}>Add New Team Member</div>
            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          <form onSubmit={handleAddMember} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Full Name *</div>
              <input type="text" placeholder="e.g. Alex Rivera" value={newName} onChange={e => setNewName(e.target.value)} required style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: 7, color: '#fff', fontSize: 13, outline: 'none' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Role</div>
              <input type="text" placeholder="e.g. Lead Designer" value={newRole} onChange={e => setNewRole(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: 7, color: '#fff', fontSize: 13, outline: 'none' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Current Task</div>
              <input type="text" placeholder="e.g. Refactor Auth" value={newTask} onChange={e => setNewTask(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: 7, color: '#fff', fontSize: 13, outline: 'none' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Status</div>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: '#20202a', border: `1px solid ${C.border}`, borderRadius: 7, color: '#fff', fontSize: 13, outline: 'none' }}>
                <option value="on-track">On track</option>
                <option value="done">Done</option>
                <option value="delayed">Delayed</option>
                <option value="missing">Missing</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Progress: {newProgress}%</div>
              <input type="range" min="0" max="100" value={newProgress} onChange={e => setNewProgress(e.target.value)} style={{ width: '100%', accentColor: T.primary }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn color={T.primary} onClick={handleAddMember}>{savingMember ? 'Adding...' : 'Save Member'}</Btn>
              <Btn ghost color={C.muted} onClick={() => setShowAddModal(false)}>Cancel</Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['all', 'done', 'on-track', 'delayed', 'missing'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 13px', borderRadius: 99, background: filter === f ? `${T.primary}18` : 'rgba(255,255,255,0.04)', border: `1px solid ${filter === f ? T.primary + '35' : C.border}`, color: filter === f ? T.primary : C.muted, fontSize: 12, fontWeight: filter === f ? 600 : 400, cursor: 'pointer', textTransform: 'capitalize', fontFamily: "'Inter',sans-serif", transition: 'all 0.15s' }}>{f}</button>
        ))}
      </div>

      {/* Team table */}
      <Card accent={T.primary} style={{ padding: 0 }}>
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1.3fr 36px', gap: 12 }}>
          {['Member', 'Task', 'Progress', 'Status', 'Actions', ''].map((h, idx) => (
            <div key={idx} style={{ fontSize: 10, fontWeight: 700, color: C.muted, fontFamily: "'Inter',sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>
        {loading ? (
          <SkeletonTable rows={4} cols={5} />
        ) : error ? (
          <div style={{ padding: 20, color: C.red }}>{error}</div>
        ) : membersList.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: C.muted }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 6 }}>No Team Members Yet</div>
            <div style={{ fontSize: 13, color: C.muted, maxWidth: 440, margin: '0 auto 20px' }}>Add collaborators manually or initialize the workspace with standard enterprise roles.</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <Btn color={T.primary} onClick={() => setShowAddModal(true)}>+ Add First Member</Btn>
              <Btn ghost color={C.green} onClick={handleInitializeStandardTeam}>{initializingTeam ? 'Initializing...' : '⚡ Initialize Standard Team'}</Btn>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: C.muted, fontSize: 13 }}>
            No members match filter "{filter}".
          </div>
        ) : (
          filtered.map(m => (
            <div key={m.id} style={{ padding: '14px 20px', borderBottom: `1px solid rgba(255,255,255,0.04)`, display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1.3fr 36px', gap: 12, alignItems: 'center', transition: 'all 0.15s' }} className="pg-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ position: 'relative' }}>
                  <Avatar name={m.name} size={34} />
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: m.online ? C.green : 'rgba(255,255,255,0.2)', border: '2px solid #0c0c0f' }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{m.role || 'Member'}</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: C.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.task || 'No task assigned'}</div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: C.muted }}>{m.progress || 0}%</span>
                </div>
                <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${m.progress || 0}%`, height: '100%', background: statusColor[m.status] || T.primary, borderRadius: 99, boxShadow: `0 0 6px ${(statusColor[m.status] || T.primary)}60` }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor[m.status] || C.muted, boxShadow: `0 0 5px ${statusColor[m.status] || C.muted}` }} />
                <span style={{ fontSize: 12, color: statusColor[m.status] || C.muted, fontWeight: 600 }}>{(statusLabel[m.status] || m.status || 'Active').replace(/^./, '').trim()}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {m.status === 'delayed' && <Btn ghost color={C.amber} style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => handleFollowUp(m)}>Follow up</Btn>}
                {m.status === 'missing' && <Btn ghost color={C.red} style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => handleRemind(m)}>Remind</Btn>}
                {m.status !== 'done' && <Btn ghost color={C.green} style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => handleMarkDone(m)}>✓ Done</Btn>}
              </div>
              <div>
                <button
                  onClick={() => handleDeleteMember(m.id, m.name)}
                  title={`Remove ${m.name}`}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: 6, fontSize: 13, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.color = C.red}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </Card>
    </PageShell>
  );
}

/* ════════════════════════════════════════
   DEPLOYMENTS PAGE
════════════════════════════════════════ */
const statusCfg = { live: { c: C.green, l: '● Live' }, running: { c: C.blue, l: '⟳ Running' }, failed: { c: C.red, l: '✕ Failed' } };
const riskCfg = { low: C.green, medium: C.amber, high: C.red };

export function DeploymentsPage({ T }) {
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deployEnv, setDeployEnv] = useState('Staging');
  const [deployTag, setDeployTag] = useState('v2.4.3');
  const { showToast } = useToast();

  const fetchDeployments = () => {
    setLoading(true);
    getDeployments()
      .then(r => {
        const list = r.data || [];
        setData(list);
        if (list.length > 0) {
          setSelectedPipeline(prev => {
            if (!prev) return list[0];
            const found = list.find(p => p.id === prev.id);
            return found || list[0];
          });
        }
      })
      .catch(e => {
        setError(e.message);
        setData([]);
      })
      .finally(() => setLoading(false));
  };

  const fetchLogs = (pId) => {
    if (!pId) return;
    setLogsLoading(true);
    getDeploymentLogs(pId)
      .then(r => setLogs(r.data || []))
      .catch(() => setLogs([]))
      .finally(() => setLogsLoading(false));
  };

  useEffect(() => {
    fetchDeployments();
  }, []);

  useEffect(() => {
    if (selectedPipeline?.id) {
      fetchLogs(selectedPipeline.id);
    }
  }, [selectedPipeline]);

  const pipelinesList = data || [];
  const currentPipeline = selectedPipeline || pipelinesList[0];

  const handleRefresh = () => {
    fetchDeployments();
    if (currentPipeline?.id) fetchLogs(currentPipeline.id);
    showToast('Deployment status refreshed', 'info');
  };

  const handleRollback = async () => {
    if (!currentPipeline) return;
    const target = 'v2.4.0';
    try {
      await rollbackDeployment(currentPipeline.id, target);
      showToast(`Rollback to ${target} executed successfully`, 'warn');
      fetchLogs(currentPipeline.id);
      fetchDeployments();
    } catch (err) {
      showToast(err.message || 'Rollback failed', 'error');
    }
  };

  const handleRedeploy = async () => {
    if (!currentPipeline) return;
    try {
      await createDeployment({
        name: currentPipeline.name,
        version: currentPipeline.version,
        repository: currentPipeline.name,
        environment: currentPipeline.environment || currentPipeline.name || 'Production',
      });
      showToast(`Redeploy triggered for ${currentPipeline.name}`, 'info');
      fetchLogs(currentPipeline.id);
      fetchDeployments();
    } catch (err) {
      showToast(err.message || 'Redeploy failed', 'error');
    }
  };

  const handleCreateDeploy = async (e) => {
    e?.preventDefault();
    try {
      const res = await createDeployment({
        name: deployEnv,
        version: deployTag,
        repository: currentPipeline?.name || 'WorkPilot-AI',
        environment: deployEnv,
      });
      showToast(`Deployment initiated for ${deployEnv} (${deployTag})`, 'success');
      setShowDeployModal(false);
      fetchDeployments();
      if (res?.data?.id) {
        setSelectedPipeline(res.data);
        fetchLogs(res.data.id);
      }
    } catch (err) {
      showToast(err.message || 'Failed to initiate deployment', 'error');
    }
  };

  return (
    <PageShell title="Deployments" subtitle="CI/CD pipeline monitor and release automation" icon="🚀" accent={C.green}
      actions={<>
        <Btn color={C.green} ghost onClick={handleRefresh}>↻ Refresh</Btn>
        <Btn color={T.primary} onClick={() => setShowDeployModal(true)}>+ New Deploy</Btn>
      </>}>

      {/* New Deploy Modal */}
      {showDeployModal && (
        <Card style={{ marginBottom: 20, background: '#16161d', border: `1px solid ${T.primary}40` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: C.text }}>Deploy to Cluster</div>
            <button onClick={() => setShowDeployModal(false)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          <form onSubmit={handleCreateDeploy} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Environment</div>
              <select value={deployEnv} onChange={e => setDeployEnv(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: '#20202a', border: `1px solid ${C.border}`, borderRadius: 7, color: '#fff', fontSize: 13, outline: 'none' }}>
                <option value="Production">Production</option>
                <option value="Staging">Staging</option>
                <option value="Dev">Dev / Preview</option>
              </select>
            </div>
            <div style={{ flex: 2, minWidth: 160 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Release Tag / Version</div>
              <input type="text" value={deployTag} onChange={e => setDeployTag(e.target.value)} placeholder="v2.4.3" required style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: 7, color: '#fff', fontSize: 13, outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn color={C.green} onClick={handleCreateDeploy}>Launch Deploy</Btn>
              <Btn ghost color={C.muted} onClick={() => setShowDeployModal(false)}>Cancel</Btn>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <SkeletonCard height={240} />
      ) : error ? (
        <div style={{ padding: 20, color: C.red }}>{error}</div>
      ) : pipelinesList.length === 0 ? (
        <Card accent={C.green} style={{ padding: 36, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🚀</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>No Active Deployments Found</div>
          <div style={{ fontSize: 13, color: C.muted, maxWidth: 460, margin: '0 auto 20px' }}>
            Connect your GitHub account in Integrations to monitor repositories automatically, or launch your first deployment manually.
          </div>
          <Btn color={T.primary} onClick={() => setShowDeployModal(true)}>+ Launch New Deployment</Btn>
        </Card>
      ) : (
        <>
          {/* HORIZONTAL TABS */}
          <div style={{ display: 'flex', gap: 20, borderBottom: `1px solid ${C.border}`, marginBottom: 20, overflowX: 'auto' }}>
            {pipelinesList.map(p => {
              const active = currentPipeline?.id === p.id;
              const status = statusCfg[p.status] || statusCfg.live;
              return (
                <div key={p.id} onClick={() => setSelectedPipeline(p)} style={{ padding: '0 4px 12px', cursor: 'pointer', borderBottom: active ? `2px solid ${T.primary}` : '2px solid transparent', color: active ? C.text : C.muted, fontWeight: active ? 700 : 400, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                  {p.name}
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: status.c }} />
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {currentPipeline && (
              <>
              {/* Stage indicators */}
              <Card accent={(statusCfg[currentPipeline.status] || statusCfg.live).c}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                      {currentPipeline.name} — {currentPipeline.version}
                      {currentPipeline.htmlUrl && (
                        <a href={currentPipeline.htmlUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: T.primary, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                          GitHub ↗
                        </a>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
                      Last updated: {currentPipeline.deployed || 'Recently'}
                      {currentPipeline.stars !== undefined && ` · ⭐ ${currentPipeline.stars}`}
                      {currentPipeline.language && ` · ${currentPipeline.language}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <Btn ghost color={C.red} style={{ padding: '7px 12px', fontSize: 12 }} onClick={handleRollback}>🔴 Rollback</Btn>
                    <Btn ghost color={T.primary} style={{ padding: '7px 12px', fontSize: 12 }} onClick={handleRedeploy}>▶ Redeploy</Btn>
                  </div>
                </div>
                
                {/* Horizontal Arrow Pipeline */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0', overflowX: 'auto', paddingBottom: 8 }}>
                  {['Build', 'Test', 'Staging', 'Production'].map((stage, i) => {
                    const isFailed = currentPipeline.status === 'failed' && i === 1;
                    const isRunning = currentPipeline.status === 'running' && i === 1;
                    const isDone = currentPipeline.status === 'live' || (currentPipeline.status === 'running' && i < 1);
                    return (
                      <React.Fragment key={stage}>
                        <div style={{
                          padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                          background: isFailed ? `${C.red}20` : isDone ? `${C.green}20` : isRunning ? `${T.primary}20` : 'rgba(255,255,255,0.05)',
                          color: isFailed ? C.red : isDone ? C.green : isRunning ? T.primary : C.muted,
                          border: `1px solid ${isFailed ? C.red + '40' : isDone ? C.green + '40' : isRunning ? T.primary + '40' : 'transparent'}`,
                        }}>
                          {stage}
                        </div>
                        {i < 3 && <div style={{ color: C.muted, fontSize: 16 }}>→</div>}
                      </React.Fragment>
                    );
                  })}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                  {[
                    ['Uptime', currentPipeline.uptime || '99.9%', C.green],
                    ['Latency', currentPipeline.latency || '120ms', C.blue],
                    ['Risk', (currentPipeline.risk || 'low').toUpperCase(), riskCfg[currentPipeline.risk] || C.green],
                    ['Status', (statusCfg[currentPipeline.status] || statusCfg.live).l, (statusCfg[currentPipeline.status] || statusCfg.live).c]
                  ].map(([k, v, c]) => (
                    <div key={k} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: `1px solid rgba(255,255,255,0.05)` }}>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{k}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: c }}>{v || '—'}</div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Live logs */}
              <Card accent={C.green} style={{ flex: 1, minHeight: 280 }}>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Build & Deployment Logs
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, animation: 'pulse 1.5s infinite' }} />
                </div>
                <div style={{ background: '#050507', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', padding: '16px', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, lineHeight: 2, height: 260, overflowY: 'auto' }}>
                  {logsLoading ? (
                    <div style={{ color: C.muted }}>Loading logs...</div>
                  ) : !logs || logs.length === 0 ? (
                    <div style={{ color: C.muted }}>No deployment events logged yet.</div>
                  ) : (
                    logs.map((l, i) => (
                      <div key={i} style={{ color: l.level === 'success' ? '#22c55e' : l.level === 'warn' ? '#eab308' : l.level === 'error' ? '#ef4444' : '#9ca3af' }}>
                        <span style={{ color: '#4b5563', marginRight: 12 }}>{l.t}</span>{l.msg}
                      </div>
                    ))
                  )}
                  {!logsLoading && <div style={{ color: C.blue, animation: 'blink 1s infinite' }}>▌</div>}
                </div>
              </Card>
              </>
            )}
          </div>
        </>
      )}
    </PageShell>
  );
}

/* ════════════════════════════════════════
   DOCUMENTS PAGE
════════════════════════════════════════ */
const typeColor = { PDF: C.red, DOCX: C.blue, XLSX: C.green, TXT: C.cyan };

export function DocumentsPage({ T }) {
  const [drag, setDrag] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [aiModalDoc, setAiModalDoc] = useState(null);
  const [aiQuestion, setAiQuestion] = useState('What are the key takeaways from this document?');
  const [aiAnswer, setAiAnswer] = useState(null);
  const [askingAi, setAskingAi] = useState(false);
  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  const fetchDocs = () => {
    setLoading(true);
    getDocuments()
      .then(r => setData(r.data || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (file.size > 1500000) {
      showToast('Document is too large (1.5 MB max)', 'error');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await uploadDocument(formData);
      showToast(`Uploaded ${file.name} successfully!`, 'success');
      fetchDocs();
    } catch (err) {
      showToast(err.message || 'Failed to upload document', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (id, name) => {
    try {
      await deleteDocument(id);
      showToast(`Deleted ${name}`, 'info');
      fetchDocs();
    } catch (err) {
      showToast(err.message || 'Failed to delete document', 'error');
    }
  };

  const handleAskAI = async (e) => {
    e?.preventDefault();
    if (!aiModalDoc || !aiQuestion.trim()) return;
    setAskingAi(true);
    try {
      const res = await askDocumentAI(aiModalDoc.id, aiQuestion.trim());
      setAiAnswer(res.data?.answer || 'No matching insights found in document.');
      showToast('Document analyzed', 'success');
    } catch (err) {
      setAiAnswer(err.message || 'Unable to query this document type.');
    } finally {
      setAskingAi(false);
    }
  };

  const docsList = data || [];
  const filtered = docsList.filter(d => (d.name || '').toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <PageShell title="Documents" subtitle="AI-powered document analysis and Q&A" icon="📄" accent={C.amber}
      actions={<>
        <Btn ghost color={T.primary} onClick={() => setShowSearch(!showSearch)}>🔍 {showSearch ? 'Close search' : 'Search docs'}</Btn>
        <Btn color={T.primary} onClick={() => fileInputRef.current?.click()}>{uploading ? 'Uploading...' : '+ Upload'}</Btn>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={e => {
          if (e.target.files && e.target.files[0]) handleFileUpload(e.target.files[0]);
        }} />
      </>}>

      {/* Search Input Bar */}
      {showSearch && (
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Search documents by filename..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', background: '#16161d', border: `1px solid ${T.primary}40`, borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
          />
        </div>
      )}

      {/* Ask AI Modal */}
      {aiModalDoc && (
        <Card style={{ marginBottom: 20, background: '#181822', border: `1px solid ${T.primary}40` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: C.text }}>
              Ask AI: <span style={{ color: T.primary }}>{aiModalDoc.name}</span>
            </div>
            <button onClick={() => { setAiModalDoc(null); setAiAnswer(null); }} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          <form onSubmit={handleAskAI} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <input
              type="text"
              value={aiQuestion}
              onChange={e => setAiQuestion(e.target.value)}
              placeholder="Ask anything about this document..."
              style={{ flex: 1, padding: '9px 13px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none' }}
            />
            <Btn color={T.primary} onClick={handleAskAI}>{askingAi ? 'Analyzing...' : 'Ask'}</Btn>
          </form>
          {aiAnswer && (
            <div style={{ padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: `1px solid ${C.border}`, color: C.sub, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              <div style={{ fontWeight: 700, color: C.text, marginBottom: 6 }}>AI Analysis:</div>
              {aiAnswer}
            </div>
          )}
        </Card>
      )}

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        style={{ border: `2px dashed ${drag ? T.primary : 'rgba(255,255,255,0.12)'}`, borderRadius: 14, padding: '30px', textAlign: 'center', marginBottom: 20, background: drag ? `${T.primary}06` : 'transparent', transition: 'all 0.2s', cursor: 'pointer' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📤</div>
        <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: drag ? T.primary : C.sub }}>
          {uploading ? 'Uploading document to workspace...' : 'Drop files here or click to upload'}
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>PDF, DOCX, XLSX, TXT supported (up to 1.5 MB) · Auto-indexed for Vector RAG Q&A</div>
      </div>

      {/* Docs table */}
      <Card accent={C.amber} style={{ padding: 0 }}>
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr 1.2fr 36px', gap: 12 }}>
          {['Filename', 'Type', 'Size', 'Modified', 'AI Status', ''].map((h, idx) => (
            <div key={idx} style={{ fontSize: 10, fontWeight: 700, color: C.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.08em' }}>{h}</div>
          ))}
        </div>
        {loading ? (
          <SkeletonTable rows={4} cols={5} />
        ) : error ? (
          <div style={{ padding: 20, color: C.red }}>{error}</div>
        ) : docsList.length === 0 ? (
          <div style={{ padding: 36, textAlign: 'center', color: C.muted, fontSize: 13 }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>📄</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 6 }}>No Documents Uploaded Yet</div>
            <div style={{ maxWidth: 420, margin: '0 auto 16px', color: C.muted }}>
              Upload contracts, policies, spreadsheets or notes above to query them directly with AI.
            </div>
            <Btn color={T.primary} onClick={() => fileInputRef.current?.click()}>+ Upload First Document</Btn>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: C.muted, fontSize: 13 }}>
            No documents match "{searchQuery}".
          </div>
        ) : (
          filtered.map(doc => {
            const ext = doc.name?.split('.').pop()?.toUpperCase() || doc.type || 'TXT';
            const sizeLabel = typeof doc.size === 'number' ? `${(doc.size / 1024).toFixed(1)} KB` : doc.size;
            return (
              <div key={doc.id} className="pg-row" style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr 1.2fr 36px', gap: 12, alignItems: 'center', transition: 'background 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${typeColor[ext] || C.amber}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                    {ext === 'PDF' ? '📕' : ext === 'DOCX' ? '📘' : ext === 'XLSX' ? '📗' : '📄'}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: "'JetBrains Mono',monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</span>
                </div>
                <Tag label={ext} color={typeColor[ext] || C.amber} />
                <span style={{ fontSize: 12, color: C.muted }}>{sizeLabel || '1.2 MB'}</span>
                <span style={{ fontSize: 12, color: C.muted }}>{doc.modified || 'Recent'}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: doc.warn ? C.amber : C.green }}>{doc.status || 'Indexed'}</span>
                  <Btn ghost color={T.primary} style={{ padding: '3px 9px', fontSize: 11 }} onClick={() => {
                    setAiModalDoc(doc);
                    setAiAnswer(null);
                  }}>Ask AI</Btn>
                </div>
                <div>
                  <button
                    onClick={() => handleDeleteDoc(doc.id, doc.name)}
                    title={`Delete ${doc.name}`}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: 6, fontSize: 13, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onMouseEnter={e => e.currentTarget.style.color = C.red}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        )}
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
  const [timeRange, setTimeRange] = useState('month');
  const { showToast } = useToast();

  useEffect(() => {
    getAnalytics()
      .then(r => setData(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const multiplier = timeRange === 'week' ? 0.25 : timeRange === 'quarter' ? 3.0 : 1.0;

  const focusHours = (Number(data?.focus_hours ?? 0) * multiplier).toFixed(1);
  const emailsHandled = Math.round(Number(data?.emails_handled ?? 0) * multiplier);
  const tasksCompleted = Math.round(Number(data?.tasks_completed ?? 0) * multiplier);
  const aiTimeSaved = (Number(data?.ai_time_saved ?? 0) * multiplier).toFixed(1);

  const metrics = [
    { label: 'Focus Hours', value: `${focusHours}h`, delta: 'Live', color: T.primary },
    { label: 'Emails Handled by AI', value: `${emailsHandled}`, delta: 'Real-time', color: C.green },
    { label: 'Tasks Completed', value: `${tasksCompleted}`, delta: 'Live', color: C.amber },
    { label: 'AI Time Saved', value: `${aiTimeSaved}h`, delta: 'Automated', color: T.secondary },
  ];

  const chartWeeks = ['W1', 'W2', 'W3', 'W4'];
  const chartData = (data?.weekly_data && Array.isArray(data.weekly_data) && data.weekly_data.length === 4)
    ? data.weekly_data.map(val => Number((val * multiplier).toFixed(1)))
    : [0, 0, 0, 0];

  const breakdown = data?.time_breakdown && typeof data.time_breakdown === 'object'
    ? Object.entries(data.time_breakdown).map(([label, pct], i) => [
        label,
        pct,
        [T.primary, C.indigo, C.amber, C.muted][i % 4],
      ])
    : [['Deep work', 50, T.primary], ['Meetings', 25, C.indigo], ['Email', 15, C.amber], ['Admin', 10, C.muted]];

  const maxBar = Math.max(...chartData, 1);

  const handleExportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Focus Hours', `${focusHours}h`],
      ['Emails Handled by AI', `${emailsHandled}`],
      ['Tasks Completed', `${tasksCompleted}`],
      ['AI Time Saved', `${aiTimeSaved}h`],
      [],
      ['Week', 'Focus Hours (h)'],
      ...chartWeeks.map((w, i) => [w, chartData[i]]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `workpilot_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Analytics exported to CSV', 'success');
  };

  return (
    <PageShell title="Analytics" subtitle="Your productivity and AI performance metrics" icon="📊" accent={T.secondary}
      actions={<>
        <select value={timeRange} onChange={e => setTimeRange(e.target.value)} style={{ padding: '7px 12px', background: '#181822', border: `1px solid ${C.border}`, borderRadius: 8, color: C.sub, fontSize: 12, cursor: 'pointer', outline: 'none', fontFamily: "'Inter',sans-serif" }}>
          <option value="month">This Month</option>
          <option value="week">Last 7 days</option>
          <option value="quarter">This Quarter</option>
        </select>
        <Btn ghost color={T.primary} onClick={handleExportCSV}>Export CSV</Btn>
      </>}>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {loading ? <SkeletonCard /> : error ? <div style={{ color: C.red }}>{error}</div> : metrics.map(k => (
          <Card key={k.label} accent={k.color} style={{ borderTop: `2px solid ${k.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: C.muted }}>{k.label}</div>
              <Tag label={k.delta} color={k.delta.startsWith('+') ? C.green : C.red} />
            </div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 26, color: C.text }}>{k.value}</div>
            <div style={{ marginTop: 12, height: 24, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
              {[1, 3, 2, 5, 4, 7, 6, 8, 5, 9].map((v, i) => <div key={i} style={{ flex: 1, background: k.color, height: `${v * 10}%`, opacity: 0.3 + (i / 20), borderRadius: 2 }} />)}
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        {/* Bar chart */}
        <Card accent={T.secondary}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 20 }}>Weekly Focus Hours</div>
          {loading ? <SkeletonCard /> : error ? <div style={{ color: C.red }}>{error}</div> : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 160 }}>
            {chartWeeks.map((w, i) => (
              <div key={w} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 11, color: T.secondary, fontWeight: 700 }}>{chartData[i]}h</div>
                <div style={{ width: '100%', height: `${(chartData[i] / maxBar) * 130}px`, background: `linear-gradient(180deg,${T.secondary},${T.primary})`, borderRadius: '6px 6px 2px 2px', boxShadow: `0 0 12px ${T.secondary}30`, animation: 'barGrowVertical 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
                <div style={{ fontSize: 11, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>{w}</div>
              </div>
            ))}
          </div>
          )}
        </Card>

        {/* Activity breakdown */}
        <Card accent={T.primary}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Time Breakdown</div>
          {loading ? <SkeletonCard /> : error ? <div style={{ color: C.red }}>{error}</div> : (
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
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const { showToast } = useToast();

  const loadIntegrations = () => {
    setLoading(true);
    setError(null);
    getIntegrations()
      .then(r => setIntegrations(r.data || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const integration = params.get('integrations');
    const status = params.get('status');
    const message = params.get('message');

    if (integration) {
      if (status === 'connected') {
        setStatusMessage(`Connected ${integration}`);
        showToast(`Successfully connected ${integration}`, 'success');
      } else if (status === 'error') {
        const detail = message || 'Connection failed';
        setStatusMessage(detail);
        showToast(detail, 'error');
      }
      window.history.replaceState({}, '', window.location.pathname);
    }

    loadIntegrations();
  }, []);

  const handleConnect = async (platform, displayName, available) => {
    if (!available) {
      showToast(`${displayName} is coming soon`, 'info');
      return;
    }
    setBusy(platform);
    try {
      const res = await authorizeIntegration(platform);
      const url = res.data?.authorizeUrl || res.data?.url;
      if (!url) throw new Error('No OAuth URL returned');
      setStatusMessage(`Redirecting to ${displayName}...`);
      window.location.href = url;
    } catch (e) {
      const message = e.message || `Could not connect ${displayName}`;
      showToast(message, 'error');
      setError(message);
      setBusy(null);
    }
  };

  const handleDisconnect = async (platform, displayName) => {
    setBusy(platform);
    try {
      await disconnectIntegration(platform);
      showToast(`Disconnected ${displayName}`, 'success');
      loadIntegrations();
    } catch (e) {
      const message = e.message || `Could not disconnect ${displayName}`;
      showToast(message, 'error');
      setError(message);
    } finally {
      setBusy(null);
    }
  };

  const toggle = (ig) => {
    if (busy === ig.platform) return;
    if (ig.connected) handleDisconnect(ig.platform, ig.displayName);
    else handleConnect(ig.platform, ig.displayName, ig.available);
  };

  const handleRequest = () => {
    const name = window.prompt('Which integration would you like us to add?');
    if (!name?.trim()) return;
    requestIntegration({ name: name.trim() })
      .then(() => showToast('Request submitted — thank you!', 'success'))
      .catch(e => showToast(e.message || 'Could not submit integration request', 'error'));
  };

  const handleSync = async (platform, displayName) => {
    setBusy(platform);
    try {
      const res = await syncIntegration(platform);
      showToast(`Synced ${displayName}`, 'success');
      setStatusMessage(`Synced ${displayName}`);
      loadIntegrations();
      if (res?.data?.lastSyncAt) {
        setError(null);
      }
    } catch (e) {
      const message = e.message || `Could not sync ${displayName}`;
      showToast(message, 'error');
      setError(message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <PageShell title="Integrations" subtitle="Connect WorkPilot AI to your favourite tools" icon="🔌" accent={T.primary}
      actions={<Btn ghost color={T.primary} onClick={handleRequest}>+ Request integration</Btn>}>

      {statusMessage && (
        <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 10, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: C.text, fontSize: 12 }}>
          {statusMessage}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {[1, 2, 3, 4, 5, 6].map(n => <SkeletonCard key={n} />)}
        </div>
      ) : error ? (
        <div style={{ padding: 20, color: C.red }}>{error}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {integrations.map(ig => (
            <Card key={ig.platform} accent={ig.connected ? C.green : undefined} style={{ display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s', opacity: ig.available ? 1 : 0.72 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: ig.connected ? `${C.green}12` : 'rgba(255,255,255,0.05)', border: `1px solid ${ig.connected ? C.green + '28' : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                {BRAND_ICONS[ig.displayName] || <span style={{ fontSize: 18 }}>🔌</span>}
                {ig.connected && <div style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: '50%', background: C.green, border: '2px solid #101014' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{ig.displayName}</span>
                  {!ig.available && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 99, background: 'rgba(255,255,255,0.08)', color: C.muted }}>Soon</span>}
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>{ig.description}</div>
                {ig.connected && (
                  <div style={{ fontSize: 11, color: C.green, marginTop: 4 }}>
                    ✓ {ig.accountLabel ? `Connected as ${ig.accountLabel}` : 'Connected'}
                    {ig.lastSyncLabel ? ` · Synced ${ig.lastSyncLabel}` : ''}
                    {ig.lastSyncStatus === 'success' ? ' · Up to date' : ig.lastSyncStatus ? ` · ${ig.lastSyncStatus}` : ''}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {ig.connected && (
                  <button
                    onClick={(event) => { event.stopPropagation(); handleSync(ig.platform, ig.displayName); }}
                    style={{ padding: '4px 8px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.04)', color: C.text, fontSize: 11, cursor: 'pointer' }}
                  >
                    Sync
                  </button>
                )}
                <div
                  onClick={() => toggle(ig)}
                  style={{
                    width: 42, height: 24, borderRadius: 99,
                    background: ig.connected ? C.green : 'rgba(255,255,255,0.12)',
                    cursor: ig.available || ig.connected ? 'pointer' : 'not-allowed',
                    position: 'relative', transition: 'all 0.2s',
                    opacity: busy === ig.platform ? 0.5 : 1,
                  }}
                >
                  <div style={{ position: 'absolute', top: 3, left: ig.connected ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}

/* ════════════════════════════════════════
   SETTINGS PAGE
════════════════════════════════════════ */
export function SettingsPage({ T, user, onSignOut }) {
  const [displayName, setDisplayName] = useState(user?.displayName || user?.name || '');
  const [jobTitle, setJobTitle] = useState(() => localStorage.getItem('wp_job_title') || 'Product Engineering');
  const [department, setDepartment] = useState(() => localStorage.getItem('wp_department') || 'Core Platform');
  const [notifEmail, setNotifEmail] = useState(() => localStorage.getItem('wp_notif_email') !== 'false');
  const [notifSlack, setNotifSlack] = useState(() => localStorage.getItem('wp_notif_slack') === 'true');
  const [notifDeploy, setNotifDeploy] = useState(() => localStorage.getItem('wp_notif_deploy') !== 'false');
  const [notifTeam, setNotifTeam] = useState(() => localStorage.getItem('wp_notif_team') !== 'false');
  const [notifAiLog, setNotifAiLog] = useState(() => localStorage.getItem('wp_notif_ailog') === 'true');
  const [aiMode, setAiMode] = useState(() => localStorage.getItem('wp_ai_mode') || 'suggest');
  const [briefingTime, setBriefingTime] = useState(() => localStorage.getItem('wp_brief_time') || '08:00');
  const [autoArchive, setAutoArchive] = useState(() => localStorage.getItem('wp_auto_archive') !== 'false');
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confPass, setConfPass] = useState('');
  const [updatingPass, setUpdatingPass] = useState(false);
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const SETTINGS_TABS = ['profile', 'notifications', 'ai', 'security', 'billing'];

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      localStorage.setItem('wp_job_title', jobTitle);
      localStorage.setItem('wp_department', department);
      await updateProfile({
        name: displayName.trim(),
        preferences: {
          notifications: notifEmail,
          theme: localStorage.getItem('wp_theme') || 'blue',
        },
      });
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Profile saved locally', 'info');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key, val, setter) => {
    setter(val);
    localStorage.setItem(key, String(val));
    showToast('Preference saved', 'success');
  };

  const handlePasswordUpdate = async (e) => {
    e?.preventDefault();
    if (!currPass) {
      showToast('Please enter your current password', 'error');
      return;
    }
    if (newPass.length < 6) {
      showToast('New password must be at least 6 characters', 'error');
      return;
    }
    if (newPass !== confPass) {
      showToast('New passwords do not match', 'error');
      return;
    }
    setUpdatingPass(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        showToast('Active authentication session not found. Please log in again.', 'error');
        return;
      }
      try {
        const cred = EmailAuthProvider.credential(currentUser.email, currPass);
        await reauthenticateWithCredential(currentUser, cred);
      } catch (authErr) {
        if (authErr.code === 'auth/wrong-password' || authErr.code === 'auth/invalid-credential') {
          showToast('Current password is incorrect', 'error');
          return;
        }
      }
      await updatePassword(currentUser, newPass);
      setCurrPass('');
      setNewPass('');
      setConfPass('');
      showToast('Password updated successfully in Firebase Auth', 'success');
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        showToast('Security check: Please log in again before changing password', 'error');
      } else {
        showToast(err.message || 'Failed to update password', 'error');
      }
    } finally {
      setUpdatingPass(false);
    }
  };

  const handleSendResetEmail = async () => {
    const email = user?.email || auth.currentUser?.email;
    if (!email) {
      showToast('No user email address found', 'error');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      showToast(`Password reset link sent to ${email}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to send reset email', 'error');
    }
  };

  const getClientSession = () => {
    if (typeof window === 'undefined') return { os: 'Workstation', browser: 'Browser' };
    const ua = navigator.userAgent;
    let os = 'Windows PC';
    if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'Mac';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    let browser = 'Chrome';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edg')) browser = 'Edge';

    return { os, browser };
  };

  const session = getClientSession();

  const Toggle = ({ on, setOn, storageKey }) => (
    <div
      onClick={() => handleToggle(storageKey, !on, setOn)}
      style={{ width: 44, height: 26, borderRadius: 99, background: on ? C.green : 'rgba(255,255,255,0.12)', cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}
    >
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
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Profile Settings</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: '16px', background: 'rgba(255,255,255,0.025)', borderRadius: 12, border: `1px solid ${C.border}` }}>
                <Avatar name={displayName || user?.displayName || 'User'} size={54} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{displayName || user?.displayName || 'User'}</div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{user?.email || 'authenticated user'}</div>
                  <Btn ghost color={T.primary} style={{ marginTop: 8, fontSize: 11, padding: '5px 12px' }} onClick={() => showToast('Avatar is linked to your Google/OAuth profile', 'info')}>Account Avatar</Btn>
                </div>
              </div>
              <form onSubmit={handleSaveProfile}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 6, fontWeight: 600 }}>Display Name</label>
                  <input value={displayName} onChange={e => setDisplayName(e.target.value)} style={{ width: '100%', padding: '10px 14px', background: '#18181f', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 9, color: C.text, fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 6, fontWeight: 600 }}>Email Address</label>
                  <input value={user?.email || ''} disabled style={{ width: '100%', padding: '10px 14px', background: '#121217', border: `1px solid rgba(255,255,255,0.06)`, borderRadius: 9, color: C.muted, fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 6, fontWeight: 600 }}>Job Title</label>
                  <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} style={{ width: '100%', padding: '10px 14px', background: '#18181f', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 9, color: C.text, fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, color: C.muted, marginBottom: 6, fontWeight: 600 }}>Department</label>
                  <input value={department} onChange={e => setDepartment(e.target.value)} style={{ width: '100%', padding: '10px 14px', background: '#18181f', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 9, color: C.text, fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' }} />
                </div>
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
              <Row label="Email notifications" desc="Get notified about urgent emails and high-priority flags" right={<Toggle on={notifEmail} setOn={setNotifEmail} storageKey="wp_notif_email" />} />
              <Row label="Slack notifications" desc="Send automated workspace alerts to your connected Slack channel" right={<Toggle on={notifSlack} setOn={setNotifSlack} storageKey="wp_notif_slack" />} />
              <Row label="Deployment alerts" desc="Notify instantly on failed builds or rollback events" right={<Toggle on={notifDeploy} setOn={setNotifDeploy} storageKey="wp_notif_deploy" />} />
              <Row label="Team updates" desc="Daily morning team standup and blocker digest" right={<Toggle on={notifTeam} setOn={setNotifTeam} storageKey="wp_notif_team" />} />
              <Row label="AI action audit log" desc="Weekly summary of autonomous and supervised actions" right={<Toggle on={notifAiLog} setOn={setNotifAiLog} storageKey="wp_notif_ailog" />} />
            </div>
          )}

          {tab === 'ai' && (
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>AI Preferences</div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, fontWeight: 600 }}>AUTONOMOUS EXECUTION MODE</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    ['autopilot', 'Auto-pilot', 'AI executes safe routines (triage, drafts, scheduling) instantly', C.green],
                    ['suggest', 'Suggest (Recommended)', 'AI pre-drafts actions and asks for 1-click confirmation', T.primary],
                    ['ask', 'Always Confirm', 'AI explicitly asks permissions before touching any external integration', C.amber]
                  ].map(([val, label, desc, c]) => (
                    <div key={val} onClick={() => { setAiMode(val); localStorage.setItem('wp_ai_mode', val); showToast(`AI mode set to ${label}`, 'success'); }} style={{ padding: '12px 14px', borderRadius: 11, border: `1px solid ${aiMode === val ? c + '40' : C.border}`, background: aiMode === val ? `${c}08` : 'rgba(255,255,255,0.02)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.18s' }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${aiMode === val ? c : 'rgba(255,255,255,0.2)'}`, background: aiMode === val ? c : 'transparent', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: aiMode === val ? c : C.sub }}>{label}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Row label="Morning briefing delivery" desc="Time of day your daily agenda & triage digest is generated" right={
                <input type="time" value={briefingTime} onChange={e => { setBriefingTime(e.target.value); localStorage.setItem('wp_brief_time', e.target.value); showToast('Briefing time updated', 'success'); }} style={{ background: '#181822', border: `1px solid ${C.border}`, borderRadius: 7, color: C.text, padding: '5px 9px', fontSize: 12, outline: 'none' }} />
              } />
              <Row label="Auto-archive newsletters" desc="Automatically categorize marketing emails out of main inbox" right={
                <Toggle on={autoArchive} setOn={setAutoArchive} storageKey="wp_auto_archive" />
              } />
            </div>
          )}

          {tab === 'security' && (
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Security & Authentication</div>
              <Row label="Two-factor authentication" desc="Enforce multi-factor verification on login" right={<Btn ghost color={T.primary} style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => showToast('2FA managed through your identity provider', 'info')}>Configured</Btn>} />
              <div style={{ marginTop: 20, marginBottom: 10, fontSize: 12, color: C.muted, fontWeight: 600 }}>ACTIVE SESSIONS</div>
              <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 20 }}>💻</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{session.os} Workstation (Current Session)</div>
                    <div style={{ fontSize: 11, color: C.green }}>Online now · {session.browser}</div>
                  </div>
                </div>
                <Tag label="Active" color={C.green} />
              </div>
              <form onSubmit={handlePasswordUpdate} style={{ marginTop: 24 }}>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, fontWeight: 600 }}>UPDATE PASSWORD</div>
                <input type="password" placeholder="Current password" value={currPass} onChange={e => setCurrPass(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: '#18181f', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 9, color: C.text, fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box', marginBottom: 10 }} />
                <input type="password" placeholder="New password (min 6 characters)" value={newPass} onChange={e => setNewPass(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: '#18181f', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 9, color: C.text, fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box', marginBottom: 10 }} />
                <input type="password" placeholder="Confirm new password" value={confPass} onChange={e => setConfPass(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: '#18181f', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 9, color: C.text, fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box', marginBottom: 10 }} />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Btn color={T.primary} style={{ marginTop: 4 }} onClick={handlePasswordUpdate}>{updatingPass ? 'Updating...' : 'Update password'}</Btn>
                  <Btn ghost color={C.sub} style={{ marginTop: 4 }} onClick={handleSendResetEmail}>Send Reset Email</Btn>
                </div>
              </form>
            </div>
          )}

          {tab === 'billing' && (
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Plan & Billing</div>
              <div style={{ padding: '16px 18px', background: `linear-gradient(135deg,${T.primary}18,${T.secondary}10)`, border: `1px solid ${T.primary}28`, borderRadius: 12, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, color: C.text }}>Pro Workspace Plan</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>Active · Unlimited AI Autonomous Tasks & SuperBrain Copilot</div>
                  </div>
                  <Tag label="Active" color={C.green} />
                </div>
              </div>
              <Row label="Payment method" desc="Corporate billing invoice / Stripe" right={<Btn ghost color={T.primary} style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => showToast('Billing portal opening...', 'info')}>Manage</Btn>} />
              <Row label="Billing period" desc="Renews on 1st of next month" right={<span style={{ fontSize: 12, color: C.muted }}>Monthly</span>} />
              <Row label="API & Agent quota" desc="Autonomous agent execution quota" right={<span style={{ fontSize: 13, color: C.green, fontWeight: 700 }}>Unlimited</span>} />
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
