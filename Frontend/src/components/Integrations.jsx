import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import BrandIcon from './BrandIcons';

const INTEGRATIONS = [
  { name: 'Gmail',           platform: 'gmail' },
  { name: 'Google Calendar', platform: 'google_calendar' },
  { name: 'Google Drive',    platform: 'google_drive' },
  { name: 'Google Meet',     platform: 'google_meet' },
  { name: 'GitHub',          platform: 'github' },
  { name: 'Slack',           platform: 'slack' },
  { name: 'Microsoft Teams', platform: 'microsoft_teams' },
  { name: 'Outlook',         platform: 'outlook' },
  { name: 'Microsoft 365',   platform: 'microsoft_365' },
  { name: 'Jira',            platform: 'jira' },
  { name: 'Notion',          platform: 'notion' },
  { name: 'Zoom',            platform: 'zoom' },
  { name: 'Trello',          platform: 'trello' },
];

const Integrations = memo(function Integrations() {
  const { t } = useTranslation('home');
  
  return (
    <section id="integrations" className="section-padding reveal-on-scroll" style={{ background: '#000000', overflow: 'hidden' }}>
      <div className="container">
        <div className="section-header">
          <div style={{ color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            {t('integrations.subtitle')}
          </div>
          <h2>{t('integrations.title')}</h2>
          <p>{t('integrations.description')}</p>
        </div>
      </div>

      <div className="marquee-container" style={{ margin: '2rem 0' }}>
        <div className="marquee-content">
          {INTEGRATIONS.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.25rem 2.5rem', margin: '0 1rem', background: 'rgba(10,10,10,0.65)', border: '1px solid var(--border)', borderRadius: '12px', color: '#ffffff' }}>
              <BrandIcon name={item.platform} size={24} />
              <span style={{ fontWeight: 500, fontSize: '1rem', letterSpacing: '-0.01em' }}>{item.name}</span>
            </div>
          ))}
        </div>
        <div className="marquee-content" aria-hidden="true">
          {INTEGRATIONS.map((item, idx) => (
            <div key={`dup-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.25rem 2.5rem', margin: '0 1rem', background: 'rgba(10,10,10,0.65)', border: '1px solid var(--border)', borderRadius: '12px', color: '#ffffff' }}>
              <BrandIcon name={item.platform} size={24} />
              <span style={{ fontWeight: 500, fontSize: '1rem', letterSpacing: '-0.01em' }}>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

export default Integrations;
