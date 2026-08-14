import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import GlassShader from './GlassShader';

const UniqueFeatures = memo(function UniqueFeatures() {
  const { t } = useTranslation('home');
  
  const uniques = [
    {
      title: t('uniqueFeatures.feature1.title'),
      subtitle: t('uniqueFeatures.feature1.subtitle'),
      description: t('uniqueFeatures.feature1.description'),
      glowColor: 'var(--blue)'
    },
    {
      title: t('uniqueFeatures.feature2.title'),
      subtitle: t('uniqueFeatures.feature2.subtitle'),
      description: t('uniqueFeatures.feature2.description'),
      glowColor: 'var(--purple)'
    },
    {
      title: t('uniqueFeatures.feature3.title'),
      subtitle: t('uniqueFeatures.feature3.subtitle'),
      description: t('uniqueFeatures.feature3.description'),
      glowColor: 'var(--pink)'
    },
    {
      title: t('uniqueFeatures.feature4.title'),
      subtitle: t('uniqueFeatures.feature4.subtitle'),
      description: t('uniqueFeatures.feature4.description'),
      glowColor: 'var(--green)'
    },
    {
      title: t('uniqueFeatures.feature5.title'),
      subtitle: t('uniqueFeatures.feature5.subtitle'),
      description: t('uniqueFeatures.feature5.description'),
      glowColor: 'var(--amber)'
    },
    {
      title: t('uniqueFeatures.feature6.title'),
      subtitle: t('uniqueFeatures.feature6.subtitle'),
      description: t('uniqueFeatures.feature6.description'),
      glowColor: 'var(--indigo)'
    }
  ];

  return (
    <section id="unique-features" className="section-padding reveal-on-scroll" style={{ background: '#000000', borderTop: '1px solid rgba(255, 255, 255, 0.03)' }}>
      <div className="glowing-orb glowing-orb-pink" style={{ top: '40%', right: '-10%', width: '380px', height: '380px' }} />

      <div className="container">
        <div className="section-header">
          <div style={{
            color: 'var(--pink)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '0.75rem'
          }}>
            {t('uniqueFeatures.subtitle')}
          </div>
          <h2>{t('uniqueFeatures.title')}</h2>
          <p style={{ maxWidth: '800px', margin: '0 auto' }}>
            {t('uniqueFeatures.description')}
          </p>
        </div>

        <div className="uniques-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '2.5rem'
        }}>
          {uniques.map((item, index) => (
            <div 
              key={index}
              className="glass-card glow-card-top"
              style={{
                padding: '2.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                alignItems: 'flex-start',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <GlassShader />

              {/* Header emoji and Title */}
              <div style={{
                fontSize: '1.3rem',
                fontFamily: 'var(--font-headlines)',
                fontWeight: 800,
                color: '#ffffff',
                position: 'relative',
                zIndex: 1
              }}>
                {item.title}
              </div>

              {/* Subtitle / Catchphrase */}
              <div style={{
                color: 'var(--pink)',
                fontSize: '0.9rem',
                fontWeight: 600,
                letterSpacing: '0.02em',
                fontFamily: 'var(--font-body)',
                position: 'relative',
                zIndex: 1
              }}>
                {item.subtitle}
              </div>

              {/* Description */}
              <p style={{
                color: 'var(--text-muted)',
                fontSize: '0.92rem',
                lineHeight: 1.6,
                position: 'relative',
                zIndex: 1
              }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .uniques-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
});

export default UniqueFeatures;
