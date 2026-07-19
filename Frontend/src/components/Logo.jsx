import React from 'react';

/**
 * WorkPilot AI — Neural Cockpit SVG Logo
 * Pure SVG, transparent background, scales perfectly at any size.
 * Props:
 *  - height: number (default 36)
 *  - showText: boolean (default true) — show/hide "WorkPilot AI" wordmark
 *  - glowColor: string (default '#3b82f6')
 */
export default function Logo({ height = 36, showText = true, glowColor = '#3b82f6' }) {
  const iconSize = height;
  const textSize = height * 0.45;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: height * 0.3 + 'px',
    }}>
      {/* Neural Cockpit Icon Mark */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: `drop-shadow(0 0 6px ${glowColor}88)` }}
      >
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d2ff" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="circuitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d2ff" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>

        {/* Outer HUD Ring */}
        <circle
          cx="24" cy="24" r="22"
          stroke="url(#ringGrad)"
          strokeWidth="1.5"
          strokeDasharray="4 2.5"
          opacity="0.85"
        />

        {/* Inner ring */}
        <circle
          cx="24" cy="24" r="17"
          stroke="url(#ringGrad)"
          strokeWidth="0.75"
          opacity="0.4"
        />

        {/* Tick marks — cockpit instrument ticks at cardinal points */}
        <line x1="24" y1="2" x2="24" y2="6" stroke="#00d2ff" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="24" y1="42" x2="24" y2="46" stroke="#00d2ff" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="2" y1="24" x2="6" y2="24" stroke="#00d2ff" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="42" y1="24" x2="46" y2="24" stroke="#00d2ff" strokeWidth="1.5" strokeLinecap="round" />

        {/* Diagonal ticks */}
        <line x1="7.5" y1="7.5" x2="10.3" y2="10.3" stroke="#8b5cf6" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        <line x1="40.5" y1="7.5" x2="37.7" y2="10.3" stroke="#8b5cf6" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        <line x1="7.5" y1="40.5" x2="10.3" y2="37.7" stroke="#8b5cf6" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        <line x1="40.5" y1="40.5" x2="37.7" y2="37.7" stroke="#8b5cf6" strokeWidth="1" strokeLinecap="round" opacity="0.6" />

        {/* W letterform made from circuit trace lines */}
        {/* Left leg down */}
        <line x1="13" y1="17" x2="16" y2="28" stroke="url(#circuitGrad)" strokeWidth="2" strokeLinecap="round" />
        {/* Left leg up to center */}
        <line x1="16" y1="28" x2="20" y2="21" stroke="url(#circuitGrad)" strokeWidth="2" strokeLinecap="round" />
        {/* Center down */}
        <line x1="20" y1="21" x2="24" y2="30" stroke="url(#circuitGrad)" strokeWidth="2" strokeLinecap="round" />
        {/* Center up */}
        <line x1="24" y1="30" x2="28" y2="21" stroke="url(#circuitGrad)" strokeWidth="2" strokeLinecap="round" />
        {/* Right leg down */}
        <line x1="28" y1="21" x2="32" y2="28" stroke="url(#circuitGrad)" strokeWidth="2" strokeLinecap="round" />
        {/* Right leg up */}
        <line x1="32" y1="28" x2="35" y2="17" stroke="url(#circuitGrad)" strokeWidth="2" strokeLinecap="round" />

        {/* Circuit nodes — glowing dots at each junction */}
        <circle cx="13" cy="17" r="1.5" fill="#00d2ff" opacity="0.9" />
        <circle cx="16" cy="28" r="1.5" fill="#00d2ff" opacity="0.75" />
        <circle cx="20" cy="21" r="1.5" fill="#a78bfa" opacity="0.9" />
        <circle cx="24" cy="30" r="1.5" fill="#00d2ff" opacity="0.9" />
        <circle cx="28" cy="21" r="1.5" fill="#a78bfa" opacity="0.9" />
        <circle cx="32" cy="28" r="1.5" fill="#00d2ff" opacity="0.75" />
        <circle cx="35" cy="17" r="1.5" fill="#00d2ff" opacity="0.9" />

        {/* Center pulse dot */}
        <circle cx="24" cy="24" r="2.2" fill="url(#circuitGrad)" opacity="0.5" />
        <circle cx="24" cy="24" r="1.2" fill="#ffffff" opacity="0.9" />
      </svg>

      {/* Wordmark text */}
      {showText && (
        <span style={{
          fontFamily: "'Sora', 'Outfit', sans-serif",
          fontWeight: 800,
          fontSize: textSize + 'px',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}>
          <span style={{ color: '#ffffff' }}>WorkPilot</span>
          <span style={{
            background: 'linear-gradient(90deg, #00d2ff, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginLeft: '0.2em',
          }}>AI</span>
        </span>
      )}
    </div>
  );
}
