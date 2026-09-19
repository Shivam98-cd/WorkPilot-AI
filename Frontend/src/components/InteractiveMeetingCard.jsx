import React, { useState } from 'react';
import { FiCalendar, FiClock, FiVideo, FiUsers, FiCheck, FiEdit2, FiExternalLink, FiLoader, FiX, FiMail } from 'react-icons/fi';
import { SiGooglemeet, SiGooglecalendar, SiZoom } from 'react-icons/si';
import { API_BASE } from '../api';

export default function InteractiveMeetingCard({ data = {}, onScheduled }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(data.status || 'draft'); // draft | scheduled | error
  const [resultData, setResultData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Editable form fields
  const [title, setTitle] = useState(data.title || 'Product Sync');
  const [date, setDate] = useState(data.date || 'Tomorrow');
  const [time, setTime] = useState(data.time || '15:00');
  const [duration, setDuration] = useState(data.duration_minutes || data.duration || 30);
  const [platform, setPlatform] = useState(data.platform || 'Google Meet');
  const [attendees, setAttendees] = useState(
    Array.isArray(data.attendees) ? data.attendees.join(', ') : (data.attendees || '')
  );
  const [description, setDescription] = useState(data.description || data.notes || '');

  const handleConfirmSchedule = async () => {
    setLoading(true);
    setErrorMessage('');

    const attendeeList = attendees
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE}/ai/superbrain/execute_tool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tool: attendeeList.length > 0 ? 'create_meet_and_email' : 'create_calendar_event',
          args: {
            title,
            date,
            time,
            duration_minutes: Number(duration),
            attendees: attendeeList,
            description,
          },
        }),
      });

      const res = await response.json();
      if (res.success && res.result) {
        setStatus('scheduled');
        setResultData(res.result);
        if (onScheduled) onScheduled(res.result);
      } else {
        setErrorMessage(res.error || 'Failed to schedule event. Please try again.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Network error while booking event.');
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = () => {
    const p = platform.toLowerCase();
    if (p.includes('zoom')) return <SiZoom className="text-blue-400" size={18} />;
    if (p.includes('meet') || p.includes('google')) return <SiGooglemeet className="text-emerald-400" size={18} />;
    return <SiGooglecalendar className="text-amber-400" size={18} />;
  };

  const attendeeList = attendees
    .split(',')
    .map(e => e.trim())
    .filter(Boolean);

  return (
    <div
      style={{
        margin: '14px 0',
        borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(24, 28, 38, 0.95) 0%, rgba(17, 20, 29, 0.98) 100%)',
        border: status === 'scheduled' ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(99, 102, 241, 0.3)',
        boxShadow: status === 'scheduled' 
          ? '0 12px 32px rgba(16, 185, 129, 0.15), 0 0 0 1px rgba(52, 211, 153, 0.2)'
          : '0 12px 32px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(99, 102, 241, 0.15)',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Top Header Badge */}
      <div
        style={{
          padding: '10px 16px',
          background: status === 'scheduled' 
            ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.05))'
            : 'linear-gradient(90deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.05))',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              padding: 5,
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {getPlatformIcon()}
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', color: status === 'scheduled' ? '#34d399' : '#818cf8', textTransform: 'uppercase' }}>
            {status === 'scheduled' ? 'Confirmed & Scheduled' : 'Smart Meeting Draft'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {status !== 'scheduled' && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                borderRadius: 8,
                padding: '4px 10px',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
            >
              <FiEdit2 size={12} /> Edit Details
            </button>
          )}
          {isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                borderRadius: 8,
                padding: '4px 10px',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <FiX size={12} /> Done Editing
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div style={{ padding: '16px 20px' }}>
        {isEditing ? (
          /* Inline Editing Form */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Meeting Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: 4,
                  padding: '8px 12px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Date</label>
                <input
                  type="text"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  placeholder="Tomorrow / YYYY-MM-DD"
                  style={{
                    width: '100%',
                    marginTop: 4,
                    padding: '8px 12px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Time</label>
                <input
                  type="text"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  placeholder="3:00 PM"
                  style={{
                    width: '100%',
                    marginTop: 4,
                    padding: '8px 12px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Duration</label>
                <select
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: 4,
                    padding: '8px 12px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                >
                  <option value={15}>15 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>60 mins</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Attendees (comma separated)</label>
              <input
                type="text"
                value={attendees}
                onChange={e => setAttendees(e.target.value)}
                placeholder="colleague@company.com, client@domain.com"
                style={{
                  width: '100%',
                  marginTop: 4,
                  padding: '8px 12px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
          </div>
        ) : (
          /* Presentation View */
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>
              {title}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1', fontSize: 13 }}>
                <FiCalendar style={{ color: '#818cf8', flexShrink: 0 }} size={16} />
                <span>{date}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1', fontSize: 13 }}>
                <FiClock style={{ color: '#818cf8', flexShrink: 0 }} size={16} />
                <span>{time} ({duration} mins)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1', fontSize: 13 }}>
                <FiVideo style={{ color: '#34d399', flexShrink: 0 }} size={16} />
                <span>{platform} auto-link</span>
              </div>
            </div>

            {/* Attendees Chips */}
            {attendeeList.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <FiUsers size={12} /> Invitees ({attendeeList.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {attendeeList.map((att, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        background: 'rgba(99, 102, 241, 0.12)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        borderRadius: 20,
                        padding: '3px 10px',
                        fontSize: 12,
                        color: '#c7d2fe',
                      }}
                    >
                      <FiMail size={11} /> {att}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {description && (
              <div style={{ marginTop: 12, fontSize: 12, color: '#94a3b8', background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: 8 }}>
                {description}
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#f87171', fontSize: 12 }}>
            {errorMessage}
          </div>
        )}

        {/* Scheduled Confirmation View */}
        {status === 'scheduled' && (
          <div
            style={{
              marginTop: 14,
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#34d399', fontSize: 13, fontWeight: 600 }}>
              <FiCheck size={18} /> Calendar Event Created & Invitations Sent!
            </div>
            {resultData?.meetLink && (
              <a
                href={resultData.meetLink}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 8,
                  background: '#059669',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <FiVideo size={13} /> Join Google Meet <FiExternalLink size={12} />
              </a>
            )}
          </div>
        )}

        {/* Action Button Bar */}
        {status !== 'scheduled' && (
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              onClick={handleConfirmSchedule}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin" size={15} /> Booking Slot...
                </>
              ) : (
                <>
                  <FiCheck size={16} /> Confirm & Schedule Event
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
