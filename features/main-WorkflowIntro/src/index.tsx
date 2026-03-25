'use client';

import React from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea, Button } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

import styles from './styles/workflow-intro.module.scss';

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const WorkflowIcon: React.FC = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 5V35M5 20H35M11.667 28.333L28.333 11.667M11.667 11.667L28.333 28.333" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const CanvasIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.5 10.5H24.5M10.5 3.5V24.5M7 3.5H21C22.933 3.5 24.5 5.067 24.5 7V21C24.5 22.933 22.933 24.5 21 24.5H7C5.067 24.5 3.5 22.933 3.5 21V7C3.5 5.067 5.067 3.5 7 3.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const NodeIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="14" r="4" stroke="currentColor" strokeWidth="2"/>
    <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="22" cy="6" r="2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="6" cy="22" r="2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="22" cy="22" r="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 8L11 11M20 8L17 11M8 20L11 17M20 20L17 17" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const AiIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 3.5L3.5 8.75V19.25L14 24.5L24.5 19.25V8.75L14 3.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 24.5V14M14 14L3.5 8.75M14 14L24.5 8.75" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const DeployIcon: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 3.5V14M14 14L21 21M14 14L7 21M3.5 24.5H24.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DocumentIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.667 1.667H5C4.558 1.667 4.134 1.842 3.822 2.155C3.51 2.467 3.333 2.891 3.333 3.333V16.667C3.333 17.109 3.51 17.533 3.822 17.845C4.134 18.158 4.558 18.333 5 18.333H15C15.442 18.333 15.866 18.158 16.178 17.845C16.49 17.533 16.667 17.109 16.667 16.667V6.667L11.667 1.667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11.667 1.667V6.667H16.667M13.333 10.833H6.667M13.333 14.167H6.667M8.333 7.5H6.667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ToolIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.667 3.333L16.667 8.333L8.333 16.667H3.333V11.667L11.667 3.333ZM11.667 3.333L13.333 1.667L18.333 6.667L16.667 8.333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PromptIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.667 7.5L3.333 10L6.667 12.5M13.333 7.5L16.667 10L13.333 12.5M11.667 3.333L8.333 16.667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PlusIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 4.167V15.833M4.167 10H15.833" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Workflow Intro Page
// ─────────────────────────────────────────────────────────────

interface WorkflowIntroPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const WorkflowIntroPage: React.FC<WorkflowIntroPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();

  const features = [
    {
      icon: <CanvasIcon />,
      title: t('workflowIntro.features.canvas.title'),
      description: t('workflowIntro.features.canvas.description'),
    },
    {
      icon: <NodeIcon />,
      title: t('workflowIntro.features.nodes.title'),
      description: t('workflowIntro.features.nodes.description'),
    },
    {
      icon: <AiIcon />,
      title: t('workflowIntro.features.ai.title'),
      description: t('workflowIntro.features.ai.description'),
    },
    {
      icon: <DeployIcon />,
      title: t('workflowIntro.features.deploy.title'),
      description: t('workflowIntro.features.deploy.description'),
    },
  ];

  const stats = [
    { value: '120+', label: t('workflowIntro.stats.workflows') },
    { value: '50+', label: t('workflowIntro.stats.nodeTypes') },
    { value: '1000+', label: t('workflowIntro.stats.executions') },
    { value: '99.9%', label: t('workflowIntro.stats.uptime') },
  ];

  const quickActions = [
    { icon: <PlusIcon />, label: t('workflowIntro.actions.createCanvas'), action: 'canvas-intro' },
    { icon: <DocumentIcon />, label: t('workflowIntro.actions.manageDocuments'), action: 'documents' },
    { icon: <ToolIcon />, label: t('workflowIntro.actions.viewTools'), action: 'tool-storage' },
    { icon: <PromptIcon />, label: t('workflowIntro.actions.editPrompts'), action: 'prompt-storage' },
  ];

  return (
    <ContentArea title={t('workflowIntro.title')}>
      <div className={styles.container}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroIcon}>
            <WorkflowIcon />
          </div>
          <h1 className={styles.heroTitle}>{t('workflowIntro.hero.title')}</h1>
          <p className={styles.heroDescription}>{t('workflowIntro.hero.description')}</p>
          <div className={styles.heroActions}>
            <Button onClick={() => onNavigate?.('canvas-intro')}>
              {t('workflowIntro.hero.primaryAction')}
            </Button>
            <Button variant="outline" onClick={() => onNavigate?.('workflows')}>
              {t('workflowIntro.hero.secondaryAction')}
            </Button>
          </div>
        </section>

        {/* Stats */}
        <section className={styles.statsSection}>
          <div className={styles.statsGrid}>
            {stats.map((stat, index) => (
              <div key={index} className={styles.statCard}>
                <p className={styles.statValue}>{stat.value}</p>
                <p className={styles.statLabel}>{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className={styles.featuresSection}>
          <h2 className={styles.sectionTitle}>{t('workflowIntro.features.title')}</h2>
          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div key={index} className={styles.featureCard}>
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className={styles.sectionTitle}>{t('workflowIntro.quickActions.title')}</h2>
          <div className={styles.quickActions}>
            {quickActions.map((action, index) => (
              <button
                key={index}
                className={styles.quickAction}
                onClick={() => onNavigate?.(action.action)}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const mainWorkflowIntroFeature: MainFeatureModule = {
  id: 'main-WorkflowIntro',
  name: 'Workflow Introduction',
  sidebarSection: 'workflow',
  sidebarItems: [
    {
      id: 'workflow-intro',
      titleKey: 'sidebar.workflow.intro.title',
      descriptionKey: 'sidebar.workflow.intro.description',
    },
  ],
  routes: {
    'workflow-intro': WorkflowIntroPage,
  },
  requiresAuth: true,
};

export default mainWorkflowIntroFeature;
