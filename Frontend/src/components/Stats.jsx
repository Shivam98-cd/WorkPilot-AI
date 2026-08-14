import React, { useState, useEffect, useRef, memo } from 'react';
import { useTranslation } from 'react-i18next';

const CountUp = ({ endVal, duration = 2000, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0);
  const elementRef = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    let start = 0;
    const startTimestamp = performance.now();

    const step = (now) => {
      const progress = Math.min((now - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // cubic ease out
      const currentCount = Math.floor(easeProgress * endVal);
      
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCount(endVal);
      }
    };

    requestAnimationFrame(step);
  }, [hasStarted, endVal, duration]);

  return (
    <span ref={elementRef}>
      {prefix}
      {count}
      {suffix}
    </span>
  );
};

const Stats = memo(function Stats() {
  const { t } = useTranslation('home');
  
  const stats = [
    {
      labelKey: 'stats.agents',
      element: <CountUp endVal={176} suffix="" />
    },
    {
      labelKey: 'stats.automated',
      element: <CountUp endVal={70} suffix="%" />
    },
    {
      labelKey: 'stats.cost',
      element: <CountUp endVal={0} prefix="$" />
    },
    {
      labelKey: 'stats.integrations',
      element: <CountUp endVal={10} suffix="+" />
    }
  ];

  return (
    <section id="stats" className="section-padding reveal-on-scroll" style={{ background: '#000000', borderTop: '1px solid rgba(255, 255, 255, 0.03)' }}>
      {/* Background glow orb */}
      <div className="glowing-orb glowing-orb-blue" style={{ top: '20%', left: '40%', width: '400px', height: '400px' }} />

      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
          gap: '2rem',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          {stats.map((stat, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{
                fontFamily: 'var(--font-headlines)',
                fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.1,
                background: 'linear-gradient(135deg, #ffffff, rgba(255,255,255,0.7))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.03em'
              }}>
                {stat.element}
              </div>
              <div style={{
                color: 'var(--text-muted)',
                fontSize: '0.95rem',
                fontWeight: 400
              }}>
                {t(stat.labelKey)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

export default Stats;
