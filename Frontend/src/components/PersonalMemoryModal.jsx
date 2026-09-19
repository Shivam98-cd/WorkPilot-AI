import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiCheck, FiUser, FiSliders, FiClock, FiList, FiTrash2, FiLoader } from 'react-icons/fi';
import { API_BASE } from '../api';

const BrainIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z"/>
  </svg>
);

export default function PersonalMemoryModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [memoryData, setMemoryData] = useState(null);

  // Preference fields
  const [role, setRole] = useState('');
  const [tone, setTone] = useState('executive');
  const [conciseness, setConciseness] = useState('brief');
  const [workingHours, setWorkingHours] = useState('9:00 AM – 6:00 PM');
  const [customInstructions, setCustomInstructions] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchMemory();
    }
  }, [isOpen]);

  const fetchMemory = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/ai/superbrain/memory`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (data.success && data.memory) {
        setMemoryData(data.memory);
        const prefs = data.memory.preferences || {};
        if (prefs.role) setRole(prefs.role);
        if (prefs.tone) setTone(prefs.tone);
        if (prefs.conciseness) setConciseness(prefs.conciseness);
        if (prefs.working_hours) setWorkingHours(prefs.working_hours);
        if (prefs.custom_instructions) setCustomInstructions(prefs.custom_instructions);
      }
    } catch (e) {
      console.error('Failed to load memory:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setSuccessMsg('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/ai/superbrain/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          preferences: {
            role,
            tone,
            conciseness,
            working_hours: workingHours,
            custom_instructions: customInstructions,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Style & Memory cloned successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (e) {
      console.error('Failed to save memory preferences:', e);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          maxHeight: '90vh',
          background: 'linear-gradient(135deg, #131722 0%, #0d1017 100%)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: 20,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(139, 92, 246, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.05))',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: 8, borderRadius: 10, background: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd' }}>
              <BrainIcon size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
                Personal Memory & Style Cloning
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
                Teach SuperBrain your organizational role, communication tone & response rules
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              color: '#94a3b8',
              padding: 6,
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <FiLoader className="animate-spin" size={24} style={{ margin: '0 auto 10px auto' }} />
              <div>Loading memory graph...</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Role & Persona */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <FiUser className="text-purple-400" size={14} /> Your Role & Title
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="e.g., VP of Product, Engineering Lead, Founder"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Communication Style Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <FiSliders className="text-purple-400" size={14} /> Preferred Tone
                  </label>
                  <select
                    value={tone}
                    onChange={e => setTone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  >
                    <option value="executive">Executive (Ultra concise & direct)</option>
                    <option value="professional">Professional & Structured</option>
                    <option value="casual">Casual & Collaborative</option>
                    <option value="technical">Deep Technical & Rigorous</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <FiList className="text-purple-400" size={14} /> Output Length
                  </label>
                  <select
                    value={conciseness}
                    onChange={e => setConciseness(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  >
                    <option value="brief">Max 3 sentences (Punchy)</option>
                    <option value="standard">Standard with Bullet Points</option>
                    <option value="detailed">Comprehensive Analysis</option>
                  </select>
                </div>
              </div>

              {/* Working Hours */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <FiClock className="text-purple-400" size={14} /> Preferred Working Hours
                </label>
                <input
                  type="text"
                  value={workingHours}
                  onChange={e => setWorkingHours(e.target.value)}
                  placeholder="e.g. 9:00 AM – 6:00 PM EST, no meetings before 10 AM"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Custom Rules */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 6, display: 'block' }}>
                  Custom Instructions (Always follow these rules)
                </label>
                <textarea
                  rows={3}
                  value={customInstructions}
                  onChange={e => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Always include a Google Meet link when proposing meetings. Highlight urgent blockers with 🚨."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Learned Context Preview */}
              {memoryData && (memoryData.entities?.names?.length > 0 || memoryData.entities?.emails?.length > 0) && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8 }}>
                    🧠 Auto-Discovered Memory Entities
                  </div>
                  {memoryData.entities?.names?.length > 0 && (
                    <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 4 }}>
                      <strong style={{ color: '#c4b5fd' }}>Frequent Collaborators:</strong>{' '}
                      {memoryData.entities.names.join(', ')}
                    </div>
                  )}
                  {memoryData.entities?.emails?.length > 0 && (
                    <div style={{ fontSize: 12, color: '#cbd5e1' }}>
                      <strong style={{ color: '#c4b5fd' }}>Known Emails:</strong>{' '}
                      {memoryData.entities.emails.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <div>
            {successMsg && (
              <span style={{ color: '#34d399', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiCheck size={16} /> {successMsg}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSavePreferences}
              disabled={saving}
              style={{
                padding: '9px 20px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
              }}
            >
              {saving ? <FiLoader className="animate-spin" size={14} /> : <FiSave size={14} />}
              Save Memory & Style
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
