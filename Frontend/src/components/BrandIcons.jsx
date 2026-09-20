import React from 'react';
import { 
  SiGmail, 
  SiGooglecalendar, 
  SiGoogledrive, 
  SiGoogle, 
  SiGithub, 
  SiZoom, 
  SiNotion, 
  SiJira, 
  SiTrello, 
  SiGooglemeet 
} from 'react-icons/si';

// Inline SVGs for authentic brand logos
export const SlackIcon = ({ size = 20, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A"/>
  </svg>
);

export const MicrosoftIcon = ({ size = 20, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <rect x="1" y="1" width="10.5" height="10.5" fill="#F25022"/>
    <rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00"/>
    <rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF"/>
    <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900"/>
  </svg>
);

export const TeamsIcon = ({ size = 20, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <path d="M15 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="#7B83EB"/>
    <path d="M19 12.5v-3a1.5 1.5 0 0 0-1.5-1.5H13a4.5 4.5 0 0 1 2 3.75V15a3.5 3.5 0 0 0 4-2.5z" fill="#7B83EB"/>
    <path d="M10 5.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" fill="#505AC9"/>
    <path d="M13.5 8H6.5A2.5 2.5 0 0 0 4 10.5V15a4 4 0 0 0 8 0v-4.5a2.5 2.5 0 0 1 1.5-2.5z" fill="#505AC9"/>
    <rect x="1" y="9" width="11" height="11" rx="2.5" fill="#464EB8"/>
    <path d="M4.2 12.2h4.6v1.3H7.2V17H5.8v-3.5H4.2v-1.3z" fill="#FFFFFF"/>
  </svg>
);

export const OutlookIcon = ({ size = 20, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <rect x="9" y="5" width="14" height="14" rx="2" fill="#0078D4"/>
    <path d="M9 9.5l7 4.5 7-4.5" stroke="#ffffff" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
    <rect x="1" y="6" width="12" height="12" rx="2" fill="#005A9E"/>
    <circle cx="7" cy="12" r="3" stroke="#ffffff" strokeWidth="1.5" fill="none"/>
  </svg>
);

export default function BrandIcon({ name, size = 20, style = {}, title }) {
  const norm = String(name || '').toLowerCase().replace(/[\s_-]+/g, '');

  let iconContent = null;
  if (norm === 'gmail') {
    iconContent = <SiGmail size={size} color="#EA4335" style={style} />;
  } else if (norm === 'googlecalendar' || norm === 'calendar') {
    iconContent = <SiGooglecalendar size={size} color="#4285F4" style={style} />;
  } else if (norm === 'googledrive' || norm === 'drive') {
    iconContent = <SiGoogledrive size={size} color="#4285F4" style={style} />;
  } else if (norm === 'googlemeet' || norm === 'meet') {
    iconContent = <SiGooglemeet size={size} color="#00AC47" style={style} />;
  } else if (norm === 'google') {
    iconContent = <SiGoogle size={size} color="#4285F4" style={style} />;
  } else if (norm === 'github') {
    iconContent = <SiGithub size={size} color="#FFFFFF" style={style} />;
  } else if (norm === 'slack') {
    iconContent = <SlackIcon size={size} style={style} />;
  } else if (norm === 'zoom') {
    iconContent = <SiZoom size={size} color="#2D8CFF" style={style} />;
  } else if (norm === 'notion') {
    iconContent = <SiNotion size={size} color="#FFFFFF" style={style} />;
  } else if (norm === 'jira') {
    iconContent = <SiJira size={size} color="#0052CC" style={style} />;
  } else if (norm === 'microsoftteams' || norm === 'teams' || norm === 'msteams') {
    iconContent = <TeamsIcon size={size} style={style} />;
  } else if (norm === 'outlook') {
    iconContent = <OutlookIcon size={size} style={style} />;
  } else if (norm === 'microsoft365' || norm === 'microsoft' || norm === 'ms365') {
    iconContent = <MicrosoftIcon size={size} style={style} />;
  } else if (norm === 'trello') {
    iconContent = <SiTrello size={size} color="#0079BF" style={style} />;
  }

  if (!iconContent) return null;
  return (
    <span title={title || name} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
      {iconContent}
    </span>
  );
}

export function BrandBadge({ name, label, connected, onClick, compact = false }) {
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
        background: 'rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        padding: 4,
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }}>
        <BrandIcon name={name} size={compact ? 18 : 20} />
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

