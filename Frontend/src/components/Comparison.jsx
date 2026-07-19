import React from 'react';

export default function Comparison() {
  const checkIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--green)' }}>
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );

  const crossIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(255, 255, 255, 0.15)' }}>
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );

  const comparisonRows = [
    { feature: '60-Minute State Machine Rollback Buffer', workpilot: true, copilot: false, gemini: false, zapier: false },
    { feature: 'Heuristic Tone & Phrasing Adaptation Transformer', workpilot: true, copilot: false, gemini: false, zapier: false },
    { feature: 'Autonomous CI/CD Container Auto-Recovery', workpilot: true, copilot: false, gemini: false, zapier: false },
    { feature: 'Automated Multi-app Integration Flows', workpilot: true, copilot: true, gemini: false, zapier: true },
    { feature: 'Full DAG Reason Graph & Audit Explainers', workpilot: true, copilot: false, gemini: false, zapier: false },
    { feature: 'Zero prompt-storage policy (SOC2 compliance)', workpilot: true, workpilot_highlight: true, copilot: false, gemini: false, zapier: true }
  ];

  return (
    <section id="comparison" className="section-padding reveal-on-scroll" style={{ background: '#000000', borderTop: '1px solid rgba(255, 255, 255, 0.03)' }}>
      <div className="container">
        <div className="section-header">
          <div style={{
            color: 'var(--blue)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '0.75rem'
          }}>
            Capabilities Matrix
          </div>
          <h2>Why WorkPilot Leads</h2>
          <p>A side-by-side comparison of features, recovery guardrails, and enterprise security policies.</p>
        </div>

        <div className="comparison-scroll" style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            minWidth: '600px',
            fontSize: '0.9rem'
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ padding: '1.25rem 1rem', color: 'var(--text-muted)', fontWeight: 500 }}>System Parameters</th>
                <th style={{ 
                  padding: '1.25rem 1rem', 
                  color: '#ffffff', 
                  fontWeight: 800,
                  fontFamily: 'var(--font-headlines)',
                  background: 'rgba(59, 130, 246, 0.04)',
                  borderTopLeftRadius: '8px',
                  borderTopRightRadius: '8px',
                  borderLeft: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRight: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                  WorkPilot AI
                </th>
                <th style={{ padding: '1.25rem 1rem', color: 'var(--text-muted)', fontWeight: 500 }}>MS Copilot</th>
                <th style={{ padding: '1.25rem 1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Google Gemini</th>
                <th style={{ padding: '1.25rem 1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Zapier Paths</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, idx) => (
                <tr key={idx} style={{ 
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'
                }}>
                  <td style={{ padding: '1.25rem 1rem', color: 'rgba(255, 255, 255, 0.85)', fontWeight: 400 }}>
                    {row.feature}
                  </td>
                  <td style={{ 
                    padding: '1.25rem 1rem', 
                    textAlign: 'center',
                    background: 'rgba(59, 130, 246, 0.04)',
                    borderLeft: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRight: '1px solid rgba(59, 130, 246, 0.2)',
                    borderBottom: idx === comparisonRows.length - 1 ? '1px solid rgba(59, 130, 246, 0.2)' : 'none'
                  }}>
                    {row.workpilot ? checkIcon : crossIcon}
                  </td>
                  <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                    {row.copilot ? checkIcon : crossIcon}
                  </td>
                  <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                    {row.gemini ? checkIcon : crossIcon}
                  </td>
                  <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                    {row.zapier ? checkIcon : crossIcon}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
