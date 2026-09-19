import React, { useState } from 'react';
import { FiClock, FiCheck, FiCalendar, FiLoader, FiCheckCircle } from 'react-icons/fi';
import { API_BASE } from '../api';

export default function VisualSlotPickerCard({ data = {}, onSlotSelected }) {
  const title = data.title || 'Choose a Time Slot';
  const duration = data.duration_minutes || data.duration || 30;
  const initialSlots = data.slots || [
    { date: 'Tomorrow', time: '10:00 AM', available: true },
    { date: 'Tomorrow', time: '02:30 PM', available: true },
    { date: 'Tomorrow', time: '04:00 PM', available: true },
    { date: 'Day After', time: '11:00 AM', available: true },
    { date: 'Day After', time: '03:00 PM', available: true },
  ];

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookedSlot, setBookedSlot] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Group slots by date
  const groupedSlots = initialSlots.reduce((acc, slot) => {
    const d = slot.date || 'Available Dates';
    if (!acc[d]) acc[d] = [];
    acc[d].push(slot);
    return acc;
  }, {});

  const handleBookSelected = async () => {
    if (!selectedSlot) return;
    setLoading(true);
    setErrorMsg('');

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE}/ai/superbrain/execute_tool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tool: 'create_calendar_event',
          args: {
            title: data.meeting_title || 'Confirmed Meeting',
            date: selectedSlot.date,
            time: selectedSlot.time,
            duration_minutes: duration,
            attendees: data.attendees || [],
          },
        }),
      });

      const res = await response.json();
      if (res.success) {
        setBookedSlot(selectedSlot);
        if (onSlotSelected) onSlotSelected(selectedSlot, res.result);
      } else {
        setErrorMsg(res.error || 'Failed to book slot.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Booking request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        margin: '14px 0',
        borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(20, 24, 33, 0.95) 0%, rgba(13, 16, 23, 0.98) 100%)',
        border: bookedSlot ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(139, 92, 246, 0.3)',
        boxShadow: '0 12px 28px rgba(0,0,0,0.35)',
        overflow: 'hidden',
        backdropFilter: 'blur(16px)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 16px',
          background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.15), rgba(99, 102, 241, 0.05))',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiCalendar className="text-purple-400" size={16} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#c4b5fd' }}>
            {title}
          </span>
        </div>
        <span style={{ fontSize: 11, color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 12 }}>
          {duration} min duration
        </span>
      </div>

      {/* Slots Body */}
      <div style={{ padding: '16px' }}>
        {bookedSlot ? (
          <div
            style={{
              padding: '16px',
              borderRadius: 12,
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <FiCheckCircle size={24} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Slot Reserved Successfully!</div>
              <div style={{ fontSize: 12, color: '#a7f3d0', marginTop: 2 }}>
                {bookedSlot.date} at {bookedSlot.time} has been added to your Google Calendar.
              </div>
            </div>
          </div>
        ) : (
          <div>
            {Object.entries(groupedSlots).map(([dateLabel, slots]) => (
              <div key={dateLabel} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  {dateLabel}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {slots.map((slot, i) => {
                    const isSelected = selectedSlot?.date === slot.date && selectedSlot?.time === slot.time;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '7px 14px',
                          borderRadius: 10,
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          background: isSelected
                            ? 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)'
                            : 'rgba(255, 255, 255, 0.05)',
                          border: isSelected
                            ? '1px solid #a78bfa'
                            : '1px solid rgba(255, 255, 255, 0.08)',
                          color: isSelected ? '#fff' : '#cbd5e1',
                          boxShadow: isSelected ? '0 4px 12px rgba(124, 58, 237, 0.35)' : 'none',
                        }}
                      >
                        <FiClock size={12} style={{ opacity: isSelected ? 1 : 0.6 }} />
                        <span>{slot.time}</span>
                        {isSelected && <FiCheck size={13} style={{ marginLeft: 2 }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {errorMsg && (
              <div style={{ marginTop: 10, padding: '6px 12px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', fontSize: 12 }}>
                {errorMsg}
              </div>
            )}

            {/* Book Button */}
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleBookSelected}
                disabled={!selectedSlot || loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 18px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  cursor: !selectedSlot || loading ? 'not-allowed' : 'pointer',
                  background: selectedSlot ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' : 'rgba(255, 255, 255, 0.08)',
                  color: selectedSlot ? '#fff' : '#64748b',
                  boxShadow: selectedSlot ? '0 4px 14px rgba(139, 92, 246, 0.4)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? <FiLoader className="animate-spin" size={14} /> : <FiCheck size={14} />}
                {selectedSlot ? `Book ${selectedSlot.time} Slot` : 'Select a Slot'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
