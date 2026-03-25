'use client';

import React from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea, Button, CardGrid } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const MlIcon: React.FC = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="3"/>
    <circle cx="32" cy="20" r="4" fill="currentColor"/>
    <circle cx="20" cy="38" r="4" fill="currentColor"/>
    <circle cx="44" cy="38" r="4" fill="currentColor"/>
    <path d="M32 24V32L24 36M32 32L40 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const TrainIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M16 16L28 10M16 16L4 10M16 16V28" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
  </svg>
);

const HubIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
    <rect x="18" y="4" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
    <rect x="4" y="18" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
    <rect x="18" y="18" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const InferenceIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 16H12M20 16H28M16 4V12M16 20V28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: { padding: '24px' },
  hero: { textAlign: 'center' as const, padding: '80px 24px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)', borderRadius: '24px', marginBottom: '48px' },
  heroIcon: { width: '120px', height: '120px', margin: '0 auto 24px', background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' },
  heroTitle: { fontSize: '40px', fontWeight: 800, color: '#1F2937', marginBottom: '16px' },
  heroSubtitle: { fontSize: '18px', color: '#6B7280', maxWidth: '700px', margin: '0 auto 40px', lineHeight: 1.7 },
  heroActions: { display: 'flex', gap: '16px', justifyContent: 'center' },
  statsSection: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '56px' },
  statCard: { padding: '28px', background: '#fff', borderRadius: '20px', border: '1px solid #E5E7EB', textAlign: 'center' as const },
  statValue: { fontSize: '36px', fontWeight: 700, background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' },
  statLabel: { fontSize: '14px', color: '#6B7280', fontWeight: 500 },
  sectionTitle: { fontSize: '28px', fontWeight: 700, color: '#1F2937', marginBottom: '32px', textAlign: 'center' as const },
  featureCard: { padding: '36px', background: '#fff', borderRadius: '20px', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', textAlign: 'center' as const, cursor: 'pointer', transition: 'all 0.2s ease' },
  featureIcon: { width: '72px', height: '72px', borderRadius: '18px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1', marginBottom: '20px' },
  featureTitle: { fontSize: '20px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' },
  featureDesc: { fontSize: '14px', color: '#6B7280', lineHeight: 1.7 },
  workflowSection: { marginTop: '64px', padding: '48px', background: '#F9FAFB', borderRadius: '24px' },
  workflowTitle: { fontSize: '24px', fontWeight: 700, color: '#1F2937', marginBottom: '32px', textAlign: 'center' as const },
  workflowSteps: { display: 'flex', gap: '24px', justifyContent: 'center', alignItems: 'center' },
  workflowStep: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '12px' },
  stepNumber: { width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700 },
  stepLabel: { fontSize: '14px', fontWeight: 500, color: '#1F2937' },
  stepArrow: { fontSize: '24px', color: '#D1D5DB' },
};

// ─────────────────────────────────────────────────────────────
// ML Model Intro Page
// ─────────────────────────────────────────────────────────────

interface MlModelIntroPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const MlModelIntroPage: React.FC<MlModelIntroPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();

  const features = [
    {
      id: 'ml-train',
      icon: <TrainIcon />,
      title: t('mlIntro.features.train.title'),
      description: t('mlIntro.features.train.description'),
    },
    {
      id: 'ml-model-hub',
      icon: <HubIcon />,
      title: t('mlIntro.features.hub.title'),
      description: t('mlIntro.features.hub.description'),
    },
    {
      id: 'ml-inference',
      icon: <InferenceIcon />,
      title: t('mlIntro.features.inference.title'),
      description: t('mlIntro.features.inference.description'),
    },
  ];

  const stats = [
    { value: '100+', label: t('mlIntro.stats.algorithms') },
    { value: '10x', label: t('mlIntro.stats.faster') },
    { value: '99.9%', label: t('mlIntro.stats.uptime') },
    { value: 'Auto', label: t('mlIntro.stats.scaling') },
  ];

  const workflowSteps = [
    t('mlIntro.workflow.prepare'),
    t('mlIntro.workflow.train'),
    t('mlIntro.workflow.evaluate'),
    t('mlIntro.workflow.deploy'),
  ];

  return (
    <ContentArea title={t('mlIntro.title')}>
      <div style={styles.container}>
        {/* Hero Section */}
        <div style={styles.hero}>
          <div style={styles.heroIcon}>
            <MlIcon />
          </div>
          <h1 style={styles.heroTitle}>{t('mlIntro.hero.title')}</h1>
          <p style={styles.heroSubtitle}>{t('mlIntro.hero.subtitle')}</p>
          <div style={styles.heroActions}>
            <Button variant="primary" onClick={() => onNavigate?.('ml-train')}>
              {t('mlIntro.hero.startTraining')}
            </Button>
            <Button variant="outline" onClick={() => onNavigate?.('ml-model-hub')}>
              {t('mlIntro.hero.exploreModels')}
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
        <h2 style={styles.sectionTitle}>{t('mlIntro.capabilities')}</h2>
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

        {/* Workflow */}
        <div style={styles.workflowSection}>
          <h2 style={styles.workflowTitle}>{t('mlIntro.workflow.title')}</h2>
          <div style={styles.workflowSteps}>
            {workflowSteps.map((step, index) => (
              <React.Fragment key={index}>
                <div style={styles.workflowStep}>
                  <div style={styles.stepNumber}>{index + 1}</div>
                  <span style={styles.stepLabel}>{step}</span>
                </div>
                {index < workflowSteps.length - 1 && (
                  <span style={styles.stepArrow}>→</span>
                )}
              </React.Fragment>
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

export const mainMlModelIntroFeature: MainFeatureModule = {
  id: 'main-MlModelIntro',
  name: 'ML Model Intro',
  sidebarSection: 'ml',
  sidebarItems: [
    {
      id: 'ml-model-intro',
      titleKey: 'sidebar.ml.intro.title',
      descriptionKey: 'sidebar.ml.intro.description',
    },
  ],
  routes: {
    'ml-model-intro': MlModelIntroPage,
  },
  requiresAuth: true,
};

export default mainMlModelIntroFeature;
