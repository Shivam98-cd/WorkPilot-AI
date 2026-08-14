/**
 * ConnectionSheet
 *
 * Slide-up bottom sheet shown after OAuth connect/disconnect.
 * Success: green glow, account info, what will sync, quick action.
 * Failure: red shake, error message, retry button.
 *
 * Pure CSS animations — no external deps, no state lifted up.
 */
import React, { useEffect, useRef, useState } from 'react';

const PLATFORM_META = {
  gmail:           { label: 'Gmail',           emoji: '📧', syncs: ['Inbox emails', 'Draft replies', 'AI triage'], action: 'View Emails',    nav: 'email' },
  google_calendar: { label: 'Google Calendar', emoji: '📅', syncs: ['Upcoming events', 'Meeting links', 'Availability'], action: 'Open Calendar', nav: 'calendar' },
  google_drive:    { label: 'Google Drive',    emoji: '📁', syncs: ['Recent files', 'Shared documents', 'Storage usage'], action: 'View Files',    nav: 'documents' },
  google_meet:     { label: 'Google Meet',     emoji: '🎥', syncs: ['Meeting rooms', 'Recordings', 'Participants'], action: 'Schedule Meet',  nav: 'calendar' },
  github:          { label: 'GitHub',          emoji: '🐙', syncs: ['Repositories', 'Pull requests', 'Issues & deployments'], action: 'View Deployments', nav: 'deployments' },
  slack:           { label: 'Slack',           emoji: '💬', syncs: ['Channels', 'Direct messages', 'Notifications'], action: 'View Team',     nav: 'team' },
  zoom:            { label: 'Zoom',            emoji: '📹', syncs: ['Scheduled meetings', 'Recordings', 'Participants'], action: 'Open Calendar', nav: 'calendar' },
  jira:            { label: 'Jira',            emoji: '🗂️', syncs: ['Sprint issues', 'Project boards', 'Task status'], action: 'View Team',     nav: 'team' },
  notion:          { label: 'Notion',          emoji: '📓', syncs: ['Pages & databases', 'Tasks', 'Wikis'], action: 'View Docs',     nav: 'documents' },
  microsoft_teams: { label: 'Microsoft Teams', emoji: '👥', syncs: ['Team channels', 'Calendar events', 'Notifications'], action: 'View Team',     nav: 'team' },
  outlook:         { label: 'Outlook',         emoji: '📨', syncs: ['Inbox emails', 'Calendar events', 'Contacts'], action: 'View Emails',    nav: 'email' },
  microsoft_365:   { label: 'Microsoft 365',   emoji: '🏢', syncs: ['Emails', 'Calendar', 'OneDrive files'], action: 'View Docs',     nav: 'documents' },
  trello:          { label: 'Trello',          emoji: '📋', syncs: ['Boards', 'Lists & cards', 'Due dates'], action: 'View Team',     nav: 'team' },
};

const CSS = `
@keyframes cs-slide-up {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
@keyframes cs-slide-down {
  from { transform: translateY(0);    opacity: 1; }
  to   { transform: translateY(100%); opacity: 0; }
}
@keyframes cs-shake {
  0%,100% { transform: translateX(0); }
  20%      { transform: translateX(-8px); }
  40%      { transform: translateX(8px); }
  60%      { transform: translateX(-5px); }
  80%      { transform: translateX(5px); }
}
@keyframes cs-pop-in {
  0%   { transform: scale(0.6); opacity: 0; }
  70%  { transform: scale(1.12); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes cs-check-draw {
  from { stroke-dashoffset: 30; }
  to   { stroke-dashoffset: 0; }
}
@keyframes cs-syncs-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes cs-glow-pulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
  50%      { box-shadow: 0 0 24px 4px rgba(16,185,129,0.25); }
}
.cs-syncs-item { animation: cs-syncs-in 0.3s ease both; }
.cs-syncs-item:nth-child(1) { animation-delay: 0.25s; }
.cs-syncs-item:nth-child(2) { animation-delay: 0.35s; }
.cs-syncs-item:nth-child(3) { animation-delay: 0.45s; }
`;

export default function ConnectionSheet({ result, onClose, onNavigate }) {
  const [closing, setClosing] = useState(false);
  const [shaking, setShaking] = useState(false);
  const timerRef = useRef(null);

  // result = { platform, status, accountLabel, errorMessage }
  const isSuccess = result?.status === 'connected';
  const meta = PLATFORM_META[result?.platform] || {
    label: result?.platform || 'Integration',
    emoji: '🔌',
    syncs: ['Data sync enabled'],
    action: 'View Integrations',
    nav: 'integrations',
  };

  // Shake on failure after mount
  useEffect(() => {
    if (!isSuccess) {
      const t = setTimeout(() => setShaking(true), 100);
      return () => clearTimeout(t);
    }
  }, [isSuccess]);

  useEffect(() => {
    setShaking(false);
  }, [shaking]);

  // Auto-close success after 5s
  useEffect(() => {
    if (isSuccess) {
      timerRef.current = setTimeout(() => handleClose(), 5000);
    }
    return () => clearTimeout(timerRef.current);
  }, [isSuccess]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 320);
  };

  const handleAction = () => {
    handleClose();
    setTimeout(() => onNavigate?.(meta.nav), 350);
  };

  if (!result) return null;

  const accent = isSuccess ? '#10b981' : '#ef4444';
  const accentBg = isSuccess ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';
  const accentBorder = isSuccess ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)';

  return (
    <>
      <style>{CSS}</style>

      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1100,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(3px)',
          opacity: closing ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1101,
        animation: closing ? 'cs-slide-down 0.32s ease forwards' : 'cs-slide-up 0.38s cubic-bezier(0.16,1,0.3,1)',
        background: 'linear-gradient(180deg, #0f0f16 0%, #0a0a10 100%)',
        borderTop: `1px solid ${accentBorder}`,
        borderRadius: '24px 24px 0 0',
        padding: '28px 32px 40px',
        maxWidth: 560,
        margin: '0 auto',
        boxShadow: `0 -8px 48px rgba(0,0,0,0.6), 0 -1px 0 ${accentBorder}`,
        animation: `${closing ? 'cs-slide-down 0.32s ease forwards' : 'cs-slide-up 0.38s cubic-bezier(0.16,1,0.3,1)'}${!isSuccess && shaking ? ', cs-shake 0.5s ease' : ''}`,
      }}>

        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.12)', margin: '0 auto 24px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          {/* Animated icon */}
          <div style={{
            width: 56, height: 56, borderRadius: 16, flexShrink: 0,
            background: accentBg,
            border: `1.5px solid ${accentBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26,
            animation: isSuccess ? 'cs-pop-in 0.45s cubic-bezier(0.16,1,0.3,1) 0.1s both, cs-glow-pulse 2s ease 0.6s 2' : 'cs-pop-in 0.4s ease 0.1s both',
          }}>
            {meta.emoji}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: "'Sora',sans-serif", marginBottom: 4 }}>
              {isSuccess ? `${meta.label} Connected` : `Failed to connect ${meta.label}`}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter',sans-serif" }}>
              {isSuccess
                ? (result.accountLabel ? `Signed in as ${result.accountLabel}` : 'Integration is active')
                : (result.errorMessage || 'Something went wrong. Please try again.')}
            </div>
          </div>

          {/* Success checkmark / Error X */}
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: accentBg, border: `2px solid ${accent}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'cs-pop-in 0.4s cubic-bezier(0.16,1,0.3,1) 0.3s both',
          }}>
            {isSuccess ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" style={{ strokeDasharray: 30, strokeDashoffset: 0, animation: 'cs-check-draw 0.35s ease 0.5s both' }} />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
          </div>
        </div>

        {/* Success: what's syncing */}
        {isSuccess && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, fontFamily: "'Inter',sans-serif" }}>
              What's syncing
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {meta.syncs.map((item, i) => (
                <div key={i} className="cs-syncs-item" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.65)', fontFamily: "'Inter',sans-serif" }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: accent, flexShrink: 0 }} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Failure: error detail box */}
        {!isSuccess && result.errorMessage && (
          <div style={{ marginBottom: 20, padding: '12px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, color: 'rgba(255,255,255,0.55)', fontFamily: "'JetBrains Mono',monospace" }}>
            {result.errorMessage}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          {isSuccess ? (
            <>
              <button
                onClick={handleAction}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 12, border: 'none',
                  background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  fontFamily: "'Inter',sans-serif",
                  boxShadow: `0 4px 16px ${accent}40`,
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${accent}55`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 4px 16px ${accent}40`; }}
              >
                {meta.action} →
              </button>
              <button
                onClick={handleClose}
                style={{
                  padding: '12px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif",
                }}
              >
                Done
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { handleClose(); setTimeout(() => onNavigate?.('integrations'), 350); }}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  fontFamily: "'Inter',sans-serif", boxShadow: '0 4px 16px rgba(239,68,68,0.3)',
                }}
              >
                Try Again
              </button>
              <button
                onClick={handleClose}
                style={{
                  padding: '12px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif",
                }}
              >
                Dismiss
              </button>
            </>
          )}
        </div>

        {/* Auto-close progress bar for success */}
        {isSuccess && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, borderRadius: '0 0 0 0', overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: accent, borderRadius: 2,
              animation: 'cs-slide-down 5s linear forwards',
              transformOrigin: 'left',
              animationName: 'none',
              width: '100%',
              transition: 'width 5s linear',
            }} ref={el => { if (el) setTimeout(() => { el.style.width = '0%'; }, 50); }} />
          </div>
        )}

      </div>
    </>
  );
}
