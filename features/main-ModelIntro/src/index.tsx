'use client';

import React from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea, Button, Card, CardGrid } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import './locales';

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const BrainIcon: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 6C15.163 6 8 13.163 8 22C8 30.837 15.163 38 24 38C32.837 38 40 30.837 40 22C40 13.163 32.837 6 24 6Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M24 14V30M18 18L24 22L30 18M18 26L24 22L30 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrainIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 28L16 4L28 28H4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 20H22M13 24H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const EvalIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 26L12 14L18 20L26 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="26" cy="6" r="2" fill="currentColor"/>
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

const MetricsIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="18" width="6" height="10" rx="1" stroke="currentColor" strokeWidth="2"/>
    <rect x="13" y="12" width="6" height="16" rx="1" stroke="currentColor" strokeWidth="2"/>
    <rect x="22" y="6" width="6" height="22" rx="1" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: { padding: '24px' },
  hero: { textAlign: 'center' as const, padding: '64px 24px', background: 'linear-gradient(135deg, rgba(48, 94, 235, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)', borderRadius: '24px', marginBottom: '48px' },
  heroIcon: { width: '120px', height: '120px', margin: '0 auto 24px', background: 'linear-gradient(135deg, #305EEB 0%, #6366F1 100%)', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' },
  heroTitle: { fontSize: '36px', fontWeight: 800, color: '#1F2937', marginBottom: '16px' },
  heroSubtitle: { fontSize: '18px', color: '#6B7280', maxWidth: '600px', margin: '0 auto 32px', lineHeight: 1.6 },
  heroActions: { display: 'flex', gap: '16px', justifyContent: 'center' },
  statsSection: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '48px' },
  statCard: { padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', textAlign: 'center' as const },
  statValue: { fontSize: '32px', fontWeight: 700, color: '#305EEB', marginBottom: '8px' },
  statLabel: { fontSize: '14px', color: '#6B7280' },
  sectionTitle: { fontSize: '24px', fontWeight: 700, color: '#1F2937', marginBottom: '24px' },
  featureCard: { padding: '32px', background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'flex-start', gap: '20px', cursor: 'pointer', transition: 'all 0.2s ease' },
  featureIcon: { width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(48, 94, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#305EEB', flexShrink: 0 },
  featureContent: { flex: 1 },
  featureTitle: { fontSize: '18px', fontWeight: 600, color: '#1F2937', marginBottom: '8px' },
  featureDesc: { fontSize: '14px', color: '#6B7280', lineHeight: 1.6 },
};

// ─────────────────────────────────────────────────────────────
// Model Intro Page
// ─────────────────────────────────────────────────────────────

interface ModelIntroPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const ModelIntroPage: React.FC<ModelIntroPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();

  const features = [
    {
      id: 'model-train',
      icon: <TrainIcon />,
      title: t('modelIntro.features.train.title'),
      description: t('modelIntro.features.train.description'),
    },
    {
      id: 'model-eval',
      icon: <EvalIcon />,
      title: t('modelIntro.features.eval.title'),
      description: t('modelIntro.features.eval.description'),
    },
    {
      id: 'model-storage',
      icon: <StorageIcon />,
      title: t('modelIntro.features.storage.title'),
      description: t('modelIntro.features.storage.description'),
    },
    {
      id: 'model-metrics',
      icon: <MetricsIcon />,
      title: t('modelIntro.features.metrics.title'),
      description: t('modelIntro.features.metrics.description'),
    },
  ];

  const stats = [
    { value: '50+', label: t('modelIntro.stats.pretrainedModels') },
    { value: '99.5%', label: t('modelIntro.stats.accuracy') },
    { value: '1000+', label: t('modelIntro.stats.trainedModels') },
    { value: '24/7', label: t('modelIntro.stats.monitoring') },
  ];

  return (
    <ContentArea title={t('modelIntro.title')}>
      <div style={styles.container}>
        {/* Hero Section */}
        <div style={styles.hero}>
          <div style={styles.heroIcon}>
            <BrainIcon />
          </div>
          <h1 style={styles.heroTitle}>{t('modelIntro.hero.title')}</h1>
          <p style={styles.heroSubtitle}>{t('modelIntro.hero.subtitle')}</p>
          <div style={styles.heroActions}>
            <Button variant="primary" onClick={() => onNavigate?.('model-train')}>
              {t('modelIntro.hero.startTraining')}
            </Button>
            <Button variant="outline" onClick={() => onNavigate?.('model-storage')}>
              {t('modelIntro.hero.browseModels')}
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
        <h2 style={styles.sectionTitle}>{t('modelIntro.capabilities')}</h2>
        <CardGrid columns={2}>
          {features.map((feature) => (
            <div
              key={feature.id}
              style={styles.featureCard}
              onClick={() => onNavigate?.(feature.id)}
            >
              <div style={styles.featureIcon}>{feature.icon}</div>
              <div style={styles.featureContent}>
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.featureDesc}>{feature.description}</p>
              </div>
            </div>
          ))}
        </CardGrid>
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const mainModelIntroFeature: MainFeatureModule = {
  id: 'main-ModelIntro',
  name: 'Model Intro',
  sidebarSection: 'model',
  sidebarItems: [
    {
      id: 'model-intro',
      titleKey: 'sidebar.model.intro.title',
      descriptionKey: 'sidebar.model.intro.description',
    },
  ],
  routes: {
    'model-intro': ModelIntroPage,
  },
  requiresAuth: true,
};

export default mainModelIntroFeature;
