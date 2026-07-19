import React from 'react';
import { SiGmail, SiGooglecalendar, SiGoogledrive, SiGoogle, SiGithub, SiZoom, SiNotion, SiJira, SiTrello } from 'react-icons/si';

// Inline SVGs for brands not in react-icons
const SlackIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A"/>
  </svg>
);

const MicrosoftIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <rect x="1" y="1" width="10.5" height="10.5" fill="#F25022"/>
    <rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00"/>
    <rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF"/>
    <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900"/>
  </svg>
);

const BRAND_COMPONENTS = {
  gmail: SiGmail,
  'google-calendar': SiGooglecalendar,
  'google-drive': SiGoogledrive,
  google: SiGoogle,
  outlook: MicrosoftIcon,
  github: SiGithub,
  slack: SlackIcon,
  zoom: SiZoom,
  notion: SiNotion,
  jira: SiJira,
  microsoft: MicrosoftIcon,
  trello: SiTrello,
};

export default function BrandIcon({ name, size = 20, style = {}, title }) {
  const Icon = BRAND_COMPONENTS[name];
  if (!Icon) return null;

  return <Icon size={size} style={{ display: 'block', flexShrink: 0, ...style }} title={title || name} />;
}

export function BrandBadge({ name, label, connected, onClick, compact = false }) {
  const Icon = BRAND_COMPONENTS[name];
  if (!Icon) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      title={connected ? `${label} is connected` : `Connect ${label}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 0 : 8,
        padding: compact ? '6px' : '8px 12px',
        borderRadius: compact ? 10 : 12,
        background: connected ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${connected ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.08)'}`,
        cursor: 'pointer',
        transition: 'all 0.2s',
        width: compact ? 'auto' : '100%',
        textAlign: 'left',
      }}
      className="brand-badge-hover"
    >
      <div style={{
        width: compact ? 28 : 32,
        height: compact ? 28 : 32,
        borderRadius: 8,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        padding: 4,
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }}>
        <Icon size={compact ? 18 : 20} />
      </div>
      {!compact && (
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: connected ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)' }}>
            {label}
          </div>
          <div style={{ fontSize: 11, color: connected ? '#22c55e' : 'rgba(255,255,255,0.35)', marginTop: 1 }}>
            {connected ? 'Connected' : 'Tap to connect'}
          </div>
        </div>
      )}
      {!compact && (
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: connected ? '#22c55e' : 'rgba(255,255,255,0.15)',
          boxShadow: connected ? '0 0 8px rgba(34,197,94,0.6)' : 'none',
          flexShrink: 0,
        }} />
      )}
    </button>
  );
}

