'use client';

import React from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea, Button, CardGrid } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const DataIcon: React.FC = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="32" cy="16" rx="20" ry="8" stroke="currentColor" strokeWidth="3"/>
    <path d="M12 16V32C12 36.418 20.954 40 32 40C43.046 40 52 36.418 52 32V16" stroke="currentColor" strokeWidth="3"/>
    <path d="M12 32V48C12 52.418 20.954 56 32 56C43.046 56 52 52.418 52 48V32" stroke="currentColor" strokeWidth="3"/>
  </svg>
);

const StationIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M4 12H28M12 12V28M12 20H28" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const StorageIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="6" width="24" height="8" rx="2" stroke="currentColor" strokeWidth="2"/>
    <rect x="4" y="18" width="24" height="8" rx="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="8" cy="10" r="1.5" fill="currentColor"/>
    <circle cx="8" cy="22" r="1.5" fill="currentColor"/>
  </svg>
);

const PipelineIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="6" cy="16" r="4" stroke="currentColor" strokeWidth="2"/>
    <circle cx="26" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
    <circle cx="26" cy="24" r="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M10 14L22 10M10 18L22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: { padding: '24px' },
  hero: { textAlign: 'center' as const, padding: '80px 24px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)', borderRadius: '24px', marginBottom: '48px' },
  heroIcon: { width: '120px', height: '120px', margin: '0 auto 24px', background: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' },
  heroTitle: { fontSize: '40px', fontWeight: 800, color: '#1F2937', marginBottom: '16px' },
  heroSubtitle: { fontSize: '18px', color: '#6B7280', maxWidth: '700px', margin: '0 auto 40px', lineHeight: 1.7 },
  heroActions: { display: 'flex', gap: '16px', justifyContent: 'center' },
  statsSection: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '56px' },
  statCard: { padding: '28px', background: '#fff', borderRadius: '20px', border: '1px solid #E5E7EB', textAlign: 'center' as const },
  statValue: { fontSize: '36px', fontWeight: 700, background: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' },
  statLabel: { fontSize: '14px', color: '#6B7280', fontWeight: 500 },
  sectionTitle: { fontSize: '28px', fontWeight: 700, color: '#1F2937', marginBottom: '32px', textAlign: 'center' as const },
  featureCard: { padding: '36px', background: '#fff', borderRadius: '20px', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', textAlign: 'center' as const, cursor: 'pointer', transition: 'all 0.2s ease' },
  featureIcon: { width: '72px', height: '72px', borderRadius: '18px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', marginBottom: '20px' },
  featureTitle: { fontSize: '20px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' },
  featureDesc: { fontSize: '14px', color: '#6B7280', lineHeight: 1.7 },
  dataSourcesSection: { marginTop: '64px', padding: '48px', background: '#F9FAFB', borderRadius: '24px' },
  sourcesTitle: { fontSize: '24px', fontWeight: 700, color: '#1F2937', marginBottom: '32px', textAlign: 'center' as const },
  sourcesGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '20px' },
  sourceItem: { padding: '24px 16px', background: 'white', borderRadius: '16px', border: '1px solid #E5E7EB', textAlign: 'center' as const },
  sourceIcon: { fontSize: '28px', marginBottom: '8px' },
  sourceName: { fontSize: '13px', fontWeight: 500, color: '#1F2937' },
};

// ─────────────────────────────────────────────────────────────
// Data Intro Page
// ─────────────────────────────────────────────────────────────

interface DataIntroPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const DataIntroPage: React.FC<DataIntroPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();

  const features = [
    {
      id: 'data-station',
      icon: <StationIcon />,
      title: t('dataIntro.features.station.title'),
      description: t('dataIntro.features.station.description'),
    },
    {
      id: 'data-storage',
      icon: <StorageIcon />,
      title: t('dataIntro.features.storage.title'),
      description: t('dataIntro.features.storage.description'),
    },
    {
      id: 'data-pipeline',
      icon: <PipelineIcon />,
      title: t('dataIntro.features.pipeline.title'),
      description: t('dataIntro.features.pipeline.description'),
    },
  ];

  const stats = [
    { value: '100TB+', label: t('dataIntro.stats.storage') },
    { value: '50+', label: t('dataIntro.stats.connectors') },
    { value: '1M+', label: t('dataIntro.stats.rowsPerSec') },
    { value: '99.9%', label: t('dataIntro.stats.reliability') },
  ];

  const dataSources = [
    { icon: '🗄️', name: 'PostgreSQL' },
    { icon: '🐬', name: 'MySQL' },
    { icon: '📊', name: 'BigQuery' },
    { icon: '❄️', name: 'Snowflake' },
    { icon: '📁', name: 'S3' },
    { icon: '🔗', name: 'API' },
  ];

  return (
    <ContentArea title={t('dataIntro.title')}>
      <div style={styles.container}>
        {/* Hero Section */}
        <div style={styles.hero}>
          <div style={styles.heroIcon}>
            <DataIcon />
          </div>
          <h1 style={styles.heroTitle}>{t('dataIntro.hero.title')}</h1>
          <p style={styles.heroSubtitle}>{t('dataIntro.hero.subtitle')}</p>
          <div style={styles.heroActions}>
            <Button variant="primary" onClick={() => onNavigate?.('data-station')}>
              {t('dataIntro.hero.exploreData')}
            </Button>
            <Button variant="outline" onClick={() => onNavigate?.('data-storage')}>
              {t('dataIntro.hero.manageStorage')}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div style={styles.statsSection}>
          {stats.map((stat, index) => (
            <div key={index} style={styles.statCard}>
              <div style={styles.statValue}>{stat.value}</div>
              <div style={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <h2 style={styles.sectionTitle}>{t('dataIntro.capabilities')}</h2>
        <CardGrid columns={3}>
          {features.map((feature) => (
            <div
              key={feature.id}
              style={styles.featureCard}
              onClick={() => onNavigate?.(feature.id)}
            >
              <div style={styles.featureIcon}>{feature.icon}</div>
              <h3 style={styles.featureTitle}>{feature.title}</h3>
              <p style={styles.featureDesc}>{feature.description}</p>
            </div>
          ))}
        </CardGrid>

        {/* Data Sources */}
        <div style={styles.dataSourcesSection}>
          <h2 style={styles.sourcesTitle}>{t('dataIntro.supportedSources')}</h2>
          <div style={styles.sourcesGrid}>
            {dataSources.map((source, index) => (
              <div key={index} style={styles.sourceItem}>
                <div style={styles.sourceIcon}>{source.icon}</div>
                <div style={styles.sourceName}>{source.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const mainDataIntroFeature: MainFeatureModule = {
  id: 'main-DataIntro',
  name: 'Data Intro',
  sidebarSection: 'data',
  sidebarItems: [
    {
      id: 'data-intro',
      titleKey: 'sidebar.data.intro.title',
      descriptionKey: 'sidebar.data.intro.description',
    },
  ],
  routes: {
    'data-intro': DataIntroPage,
  },
  requiresAuth: true,
};

export default mainDataIntroFeature;
