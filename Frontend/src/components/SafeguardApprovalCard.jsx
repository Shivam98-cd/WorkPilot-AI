import React, { useState } from 'react';
import { FiShield, FiAlertTriangle, FiCheck, FiX, FiLoader, FiTerminal } from 'react-icons/fi';
import { API_BASE } from '../api';

export default function SafeguardApprovalCard({ data = {}, onActionComplete }) {
  const [status, setStatus] = useState(data.status || 'pending'); // pending | approved | rejected
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const actionName = data.action || data.tool || 'Sensitive Operation';
  const riskLevel = (data.risk_level || 'high').toLowerCase();
  const description = data.description || 'This action requires explicit human confirmation before execution.';
  const args = data.args || {};

  const handleApprove = async () => {
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
          tool: data.tool || data.action,
          args: args,
        }),
      });

      const res = await response.json();
      if (res.success) {
        setStatus('approved');
        setResult(res.result);
        if (onActionComplete) onActionComplete(true, res.result);
      } else {
        setErrorMsg(res.error || 'Execution failed.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Execution failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    setStatus('rejected');
    if (onActionComplete) onActionComplete(false, { reason: 'User declined' });
  };

  const isHighRisk = riskLevel === 'high' || riskLevel === 'critical';

  return (
    <div
      style={{
        margin: '14px 0',
        borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(28, 22, 22, 0.95) 0%, rgba(18, 14, 16, 0.98) 100%)',
        border: status === 'approved' 
          ? '1px solid rgba(52, 211, 153, 0.4)' 
          : status === 'rejected'
          ? '1px solid rgba(148, 163, 184, 0.2)'
          : isHighRisk 
          ? '1px solid rgba(239, 68, 68, 0.4)' 
          : '1px solid rgba(245, 158, 11, 0.4)',
        boxShadow: status === 'approved'
          ? '0 12px 28px rgba(16, 185, 129, 0.15)'
          : isHighRisk
          ? '0 12px 28px rgba(239, 68, 68, 0.18)'
          : '0 12px 28px rgba(245, 158, 11, 0.15)',
        overflow: 'hidden',
        backdropFilter: 'blur(16px)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Top Banner */}
      <div
        style={{
          padding: '10px 16px',
          background: status === 'approved'
            ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.15), transparent)'
            : status === 'rejected'
            ? 'linear-gradient(90deg, rgba(100, 116, 139, 0.15), transparent)'
            : isHighRisk
            ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.05))'
            : 'linear-gradient(90deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.05))',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {status === 'approved' ? (
            <FiCheck className="text-emerald-400" size={16} />
          ) : status === 'rejected' ? (
            <FiX className="text-slate-400" size={16} />
          ) : (
            <FiAlertTriangle className={isHighRisk ? "text-rose-400" : "text-amber-400"} size={16} />
          )}
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: status === 'approved' 
                ? '#34d399' 
                : status === 'rejected' 
                ? '#94a3b8' 
                : isHighRisk 
                ? '#f87171' 
                : '#fbbf24',
            }}
          >
            {status === 'approved' 
              ? 'Safeguard: Executed' 
              : status === 'rejected' 
              ? 'Safeguard: Cancelled' 
              : `${riskLevel} Impact Action Confirmation`}
          </span>
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            padding: '2px 8px',
            borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.08)',
            color: '#cbd5e1',
          }}
        >
          Human In The Loop
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        <h4 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
          {data.title || actionName}
        </h4>
        <p style={{ margin: '0 0 12px 0', fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 }}>
          {description}
        </p>

        {/* Parameters preview */}
        {Object.keys(args).length > 0 && (
          <div
            style={{
              margin: '10px 0',
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: 12,
              fontFamily: 'monospace',
              color: '#94a3b8',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: '#e2e8f0', fontWeight: 600 }}>
              <FiTerminal size={12} /> Execution Parameters:
            </div>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {JSON.stringify(args, null, 2)}
            </pre>
          </div>
        )}

        {errorMsg && (
          <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', fontSize: 12 }}>
            {errorMsg}
          </div>
        )}

        {status === 'approved' && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(52, 211, 153, 0.3)', color: '#34d399', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiCheck size={16} /> Operation verified and successfully completed!
          </div>
        )}

        {status === 'rejected' && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(100, 116, 139, 0.1)', border: '1px solid rgba(148, 163, 184, 0.2)', color: '#94a3b8', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiX size={16} /> Action was denied. No changes were made to your systems.
          </div>
        )}

        {/* Buttons */}
        {status === 'pending' && (
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              onClick={handleReject}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <FiX size={14} /> Reject & Cancel
            </button>

            <button
              type="button"
              onClick={handleApprove}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 18px',
                borderRadius: 8,
                background: isHighRisk 
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: isHighRisk 
                  ? '0 4px 12px rgba(239, 68, 68, 0.4)' 
                  : '0 4px 12px rgba(245, 158, 11, 0.4)',
              }}
            >
              {loading ? <FiLoader className="animate-spin" size={14} /> : <FiCheck size={14} />}
              {loading ? 'Executing...' : 'Approve & Execute'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
