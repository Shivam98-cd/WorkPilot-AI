import React, { useEffect } from 'react';

/**
 * Synthetic Web Audio API chime generator for incoming alerts and reminders.
 * Zero external audio assets needed.
 */
export function playAlertChime(priority = 'normal') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    const freq = priority === 'urgent' || priority === 'high' ? 880 : 587.33; // A5 or D5
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 1.5, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.45);
  } catch {
    // AudioContext blocked by browser autoplay policy until user interacts
  }
}

export default function ToastNotification({ toasts, onDismiss, onAction }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 68,
      right: 24,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      maxWidth: 380,
      width: '100%',
      pointerEvents: 'none',
    }}>
      {toasts.map(toast => {
        const isUrgent = toast.priority === 'urgent' || toast.priority === 'high';
        const borderColor = isUrgent ? '#ef4444' : '#3b82f6';
        const bgGlow = isUrgent ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.12)';

        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              background: '#121217',
              border: `1px solid ${borderColor}`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 16px ${bgGlow}`,
              borderRadius: 12,
              padding: '14px 16px',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              animation: 'workpilotSlideIn 0.25s ease-out forwards',
              position: 'relative',
              backdropFilter: 'blur(16px)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{isUrgent ? '🚨' : '⏰'}</span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: isUrgent ? '#ef4444' : '#60a5fa',
                  background: isUrgent ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                  padding: '2px 6px',
                  borderRadius: 4,
                }}>
                  {toast.type || 'Reminder'}
                </span>
              </div>
              <button
                onClick={() => onDismiss(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  fontSize: 16,
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Dismiss"
              >
                &times;
              </button>
            </div>

            {/* Content */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3 }}>
                {toast.title}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
                {toast.body || toast.message}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              {toast.meeting_link && (
                <a
                  href={toast.meeting_link}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '5px 12px',
                    background: '#3b82f6',
                    color: '#fff',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  Join Meeting &rarr;
                </a>
              )}
              <button
                onClick={() => onDismiss(toast.id)}
                style={{
                  padding: '5px 10px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)',
                  borderRadius: 6,
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
