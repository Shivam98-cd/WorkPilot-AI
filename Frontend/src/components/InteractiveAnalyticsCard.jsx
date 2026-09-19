import React, { useState } from 'react';
import { FiBarChart2, FiTrendingUp, FiActivity, FiZap } from 'react-icons/fi';

export default function InteractiveAnalyticsCard({ data = {} }) {
  const title = data.title || 'Productivity & Focus Trends';
  const labels = data.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const values = data.values || [4.2, 5.8, 6.1, 6.5, 7.2, 5.9, 6.5];
  const unit = data.unit || 'hrs';
  const highlight = data.highlight || 'Peak performance on Friday (7.2 hrs)';

  const [hoveredIdx, setHoveredIdx] = useState(null);

  const maxValue = Math.max(...values, 1);
  const avgValue = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);

  // SVG dimensions
  const width = 460;
  const height = 140;
  const paddingBottom = 26;
  const paddingTop = 20;
  const chartHeight = height - paddingBottom - paddingTop;
  const colWidth = width / values.length;

  return (
    <div
      style={{
        margin: '14px 0',
        borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(20, 24, 35, 0.95) 0%, rgba(13, 16, 26, 0.98) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        boxShadow: '0 12px 28px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(59, 130, 246, 0.1)',
        overflow: 'hidden',
        backdropFilter: 'blur(16px)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.12), rgba(99, 102, 241, 0.05))',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ padding: 5, borderRadius: 8, background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            <FiBarChart2 size={16} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>{title}</h4>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Weekly metric distribution</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ padding: '3px 8px', borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <FiTrendingUp size={12} /> Avg: {avgValue} {unit}
          </div>
        </div>
      </div>

      {/* Chart SVG */}
      <div style={{ padding: '14px 16px 8px 16px', position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          <defs>
            <linearGradient id="barGradientNormal" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="barGradientHover" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="1" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="barGradientPeak" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="1" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1={paddingTop} x2={width} y2={paddingTop} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
          <line x1="0" y1={paddingTop + chartHeight / 2} x2={width} y2={paddingTop + chartHeight / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
          <line x1="0" y1={paddingTop + chartHeight} x2={width} y2={paddingTop + chartHeight} stroke="rgba(255,255,255,0.12)" />

          {/* Bars */}
          {values.map((val, idx) => {
            const barH = (val / maxValue) * chartHeight;
            const x = idx * colWidth + (colWidth - 28) / 2;
            const y = paddingTop + (chartHeight - barH);
            const isHovered = hoveredIdx === idx;
            const isPeak = val === maxValue;

            return (
              <g key={idx} style={{ cursor: 'pointer' }} onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)}>
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={28}
                  height={barH}
                  rx={6}
                  fill={isPeak ? "url(#barGradientPeak)" : isHovered ? "url(#barGradientHover)" : "url(#barGradientNormal)"}
                  filter={isHovered ? "drop-shadow(0 4px 8px rgba(59, 130, 246, 0.4))" : "none"}
                />

                {/* Value on top of bar */}
                <text
                  x={x + 14}
                  y={y - 6}
                  textAnchor="middle"
                  fill={isHovered || isPeak ? "#fff" : "#94a3b8"}
                  fontSize={11}
                  fontWeight={isHovered || isPeak ? "700" : "500"}
                >
                  {val}
                </text>

                {/* Day label */}
                <text
                  x={x + 14}
                  y={height - 6}
                  textAnchor="middle"
                  fill={isHovered ? "#60a5fa" : "#64748b"}
                  fontSize={11}
                  fontWeight={isHovered ? "700" : "500"}
                >
                  {labels[idx] || ''}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Highlight footer */}
        {highlight && (
          <div
            style={{
              marginTop: 6,
              padding: '6px 12px',
              borderRadius: 8,
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#c7d2fe',
              fontSize: 12,
            }}
          >
            <FiZap className="text-amber-400" size={13} />
            <span>{highlight}</span>
          </div>
        )}
      </div>
    </div>
  );
}
