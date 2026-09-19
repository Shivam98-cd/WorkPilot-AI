import React, { useState } from 'react';
import { FiCheckCircle, FiCircle, FiArrowRight, FiLoader, FiLayers, FiFolder, FiCheck } from 'react-icons/fi';
import { API_BASE } from '../api';

export default function InteractiveOptionsCard({ data = {}, onSelectOption }) {
  const title = data.title || 'Select an Option';
  const description = data.description || 'Choose one of the available options below to continue:';
  const submitLabel = data.submit_label || 'Proceed with Selection';
  
  // Normalize options: can be array of objects { label, value, badge, description } or strings
  const rawOptions = data.options || data.items || data.repositories || [];
  const options = rawOptions.map((opt, idx) => {
    if (typeof opt === 'string') {
      return { id: idx, label: opt, value: opt, badge: null, description: null };
    }
    return {
      id: opt.id || idx,
      label: opt.label || opt.name || opt.value || `Option ${idx + 1}`,
      value: opt.value || opt.label || opt.name || '',
      badge: opt.badge || opt.tag || null,
      description: opt.description || opt.desc || null,
    };
  });

  const [selectedVal, setSelectedVal] = useState(options[0]?.value || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleOptionClick = (val) => {
    setSelectedVal(val);
  };

  const handleConfirm = async () => {
    if (!selectedVal) return;
    setIsSubmitting(true);
    setErrorMsg('');

    // If a tool execution payload is attached (e.g. tool + action)
    if (data.tool) {
      const token = localStorage.getItem('token');
      try {
        const mergedArgs = { ...(data.base_args || {}), [data.target_arg || 'repo']: selectedVal };
        const response = await fetch(`${API_BASE}/ai/superbrain/execute_tool`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            tool: data.tool,
            action: data.action,
            args: mergedArgs,
          }),
        });
        const res = await response.json();
        if (res.success) {
          setSuccessMsg(`Action completed successfully for ${selectedVal}!`);
          if (onSelectOption) onSelectOption(selectedVal, res.result);
          return;
        } else {
          setErrorMsg(res.error || 'Execution failed. Passing selection to chat...');
        }
      } catch (err) {
        setErrorMsg(err.message || 'Execution error. Falling back to chat...');
      } finally {
        setIsSubmitting(false);
      }
    }

    // Default: pass selected value to chat flow
    if (onSelectOption) {
      onSelectOption(selectedVal);
    }
    setIsSubmitting(false);
  };

  return (
    <div
      style={{
        margin: '14px 0',
        borderRadius: '16px',
        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35), 0 0 15px rgba(99, 102, 241, 0.1)',
        backdropFilter: 'blur(16px)',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(99, 102, 241, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '14px',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
          }}
        >
          <FiLayers />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', letterSpacing: '0.2px' }}>
            {title}
          </div>
          {description && (
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.55)', marginTop: '2px' }}>
              {description}
            </div>
          )}
        </div>
      </div>

      {/* Options List */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {options.map((opt) => {
          const isSelected = selectedVal === opt.value;
          return (
            <div
              key={opt.id}
              onClick={() => handleOptionClick(opt.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: isSelected ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.07)',
                boxShadow: isSelected ? '0 0 12px rgba(99, 102, 241, 0.2)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)';
                }
              }}
            >
              <div style={{ color: isSelected ? '#818cf8' : 'rgba(255, 255, 255, 0.35)', display: 'flex', alignItems: 'center' }}>
                {isSelected ? <FiCheckCircle size={16} /> : <FiCircle size={16} />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '12px',
                      color: isSelected ? '#e0e7ff' : '#cbd5e1',
                      fontWeight: isSelected ? 600 : 400,
                      wordBreak: 'break-all',
                    }}
                  >
                    {opt.label}
                  </span>
                  {opt.badge && (
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: '#a5b4fc',
                        fontWeight: 500,
                      }}
                    >
                      {opt.badge}
                    </span>
                  )}
                </div>
                {opt.description && (
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '2px' }}>
                    {opt.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Messages */}
      {errorMsg && (
        <div style={{ padding: '0 16px 8px 16px', fontSize: '11px', color: '#f87171' }}>
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '0 16px 8px 16px', fontSize: '11px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FiCheck /> {successMsg}
        </div>
      )}

      {/* Footer / Submit */}
      <div
        style={{
          padding: '10px 16px 14px 16px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '10px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(0, 0, 0, 0.1)',
        }}
      >
        <button
          onClick={handleConfirm}
          disabled={!selectedVal || isSubmitting}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            border: 'none',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 600,
            cursor: !selectedVal || isSubmitting ? 'not-allowed' : 'pointer',
            opacity: !selectedVal || isSubmitting ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 10px rgba(99, 102, 241, 0.35)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (selectedVal && !isSubmitting) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(99, 102, 241, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(99, 102, 241, 0.35)';
          }}
        >
          {isSubmitting ? (
            <>
              <FiLoader className="spin" /> Processing...
            </>
          ) : (
            <>
              {submitLabel} <FiArrowRight />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
