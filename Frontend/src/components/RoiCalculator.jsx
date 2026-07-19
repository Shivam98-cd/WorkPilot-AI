import React, { useState } from 'react';
import GlassShader from './GlassShader';

export default function RoiCalculator() {
  const [tasks, setTasks] = useState(80);
  const [minutes, setMinutes] = useState(25);

  // Mathematics for calculations
  const hoursSavedPerMonth = Math.round((tasks * minutes * 4.33) / 60);
  const dollarsSavedPerMonth = Math.round(hoursSavedPerMonth * 65); // $65/hr average blend rate
  const virtualWorkers = (hoursSavedPerMonth / 160).toFixed(1); // 160 hours/month standard FTE

  return (
    <section id="roi-calculator" className="section-padding reveal-on-scroll" style={{ background: '#000000', borderTop: '1px solid rgba(255, 255, 255, 0.03)' }}>
      {/* Glow orb background */}
      <div className="glowing-orb glowing-orb-purple" style={{ bottom: '10%', right: '10%', width: '350px', height: '350px' }} />

      <div className="container">
        <div className="section-header">
          <div style={{
            color: 'var(--purple)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '0.75rem'
          }}>
            ROI Calculator
          </div>
          <h2>Calculate Your Autopilot Savings</h2>
          <p>Estimate the hours, operational capital, and engineering bandwidth recovered by automating tasks.</p>
        </div>

        <div className="roi-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '3rem',
          alignItems: 'center'
        }}>
          {/* Left Column: Sliders */}
          <div className="glass-card" style={{
            padding: '2.5rem',
            background: 'rgba(5, 5, 5, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <GlassShader />
            
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Slider 1: Tasks */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                  <span style={{ color: '#ffffff', fontWeight: 500 }}>Manual Tasks / Week</span>
                  <span style={{ color: 'var(--purple)', fontWeight: 600, fontFamily: 'var(--font-code)' }}>{tasks} tasks</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="400" 
                  step="10" 
                  value={tasks} 
                  onChange={(e) => setTasks(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: 'rgba(255,255,255,0.1)',
                    outline: 'none',
                    cursor: 'pointer',
                    accentColor: 'var(--purple)'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                  <span>10</span>
                  <span>400</span>
                </div>
              </div>

              {/* Slider 2: Minutes */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                  <span style={{ color: '#ffffff', fontWeight: 500 }}>Average Minutes / Task</span>
                  <span style={{ color: 'var(--purple)', fontWeight: 600, fontFamily: 'var(--font-code)' }}>{minutes} mins</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="120" 
                  step="5" 
                  value={minutes} 
                  onChange={(e) => setMinutes(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: 'rgba(255,255,255,0.1)',
                    outline: 'none',
                    cursor: 'pointer',
                    accentColor: 'var(--purple)'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                  <span>5m</span>
                  <span>120m</span>
                </div>
              </div>

              {/* Note */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                lineHeight: 1.5
              }}>
                <strong>SaaS Blend Assumption</strong>: Factoring average developer/operations base rate at $65/hr, including overheads, to calculate capital recovery metrics.
              </div>
            </div>
          </div>

          {/* Right Column: Calculations */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            {/* Stat 1: Hours Saved */}
            <div className="glass-card" style={{
              padding: '2rem',
              background: 'rgba(10, 10, 10, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Bandwidth Recovered</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--purple)', fontWeight: 500 }}>Hours saved / month</div>
              </div>
              <div style={{
                fontFamily: 'var(--font-headlines)',
                fontSize: '2.5rem',
                fontWeight: 800,
                color: '#ffffff'
              }}>
                {hoursSavedPerMonth}h
              </div>
            </div>

            {/* Stat 2: Dollars Saved */}
            <div className="glass-card" style={{
              padding: '2rem',
              background: 'rgba(10, 10, 10, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Capital Saved</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--green)', fontWeight: 500 }}>Operational rate savings / month</div>
              </div>
              <div style={{
                fontFamily: 'var(--font-headlines)',
                fontSize: '2.5rem',
                fontWeight: 800,
                color: 'var(--green)'
              }}>
                ${dollarsSavedPerMonth.toLocaleString()}
              </div>
            </div>

            {/* Stat 3: Virtual Assistants */}
            <div className="glass-card" style={{
              padding: '2rem',
              background: 'rgba(10, 10, 10, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Agent Worker Value</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--blue)', fontWeight: 500 }}>FTE equivalent coverage</div>
              </div>
              <div style={{
                fontFamily: 'var(--font-headlines)',
                fontSize: '2.5rem',
                fontWeight: 800,
                color: 'var(--blue)'
              }}>
                {virtualWorkers} FTEs
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .roi-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem;
          }
        }
      `}</style>
    </section>
  );
}
