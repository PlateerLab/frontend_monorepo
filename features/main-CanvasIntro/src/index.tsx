'use client';

import React, { useState } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea, Button, Card, CardGrid } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import './locales';

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const CanvasIcon: React.FC = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 13.333H35M13.333 5V35M10 5H30C32.761 5 35 7.239 35 10V30C35 32.761 32.761 35 30 35H10C7.239 35 5 32.761 5 30V10C5 7.239 7.239 5 10 5Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BlankIcon: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="36" height="36" rx="4" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4"/>
    <path d="M24 18V30M18 24H30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const TemplateIcon: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
    <rect x="26" y="6" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
    <rect x="6" y="26" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
    <rect x="26" y="26" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const ChatbotIcon: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="10" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="2"/>
    <circle cx="18" cy="22" r="2" fill="currentColor"/>
    <circle cx="30" cy="22" r="2" fill="currentColor"/>
    <path d="M18 28C18 28 20 31 24 31C28 31 30 28 30 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M14 38L18 34H30L34 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RagIcon: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 8H28L36 16V40C36 41.1 35.1 42 34 42H12C10.9 42 10 41.1 10 40V10C10 8.9 10.9 8 12 8Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M28 8V16H36" stroke="currentColor" strokeWidth="2"/>
    <path d="M16 26H30M16 32H26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="38" cy="38" r="6" stroke="currentColor" strokeWidth="2"/>
    <path d="M42 42L45 45" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const AgentIcon: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="16" r="8" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 40C12 33.373 17.373 28 24 28C30.627 28 36 33.373 36 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="38" cy="14" r="4" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M42 18L46 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="10" cy="14" r="4" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M6 18L2 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  } as React.CSSProperties,
  hero: {
    textAlign: 'center' as const,
    padding: '48px 0',
    marginBottom: '48px',
    background: 'linear-gradient(135deg, rgba(48, 94, 235, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)',
    borderRadius: '16px',
  },
  heroIcon: {
    width: '80px',
    height: '80px',
    margin: '0 auto 24px',
    background: 'linear-gradient(135deg, #305EEB 0%, #6366F1 100%)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  },
  heroTitle: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#1F2937',
    margin: '0 0 16px',
  },
  heroDescription: {
    fontSize: '18px',
    color: '#6B7280',
    margin: '0 0 32px',
    maxWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto',
    lineHeight: 1.6,
  },
  heroActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
  },
  section: {
    marginBottom: '48px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#1F2937',
    margin: '0 0 24px',
    textAlign: 'center' as const,
  },
  templatesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
  },
  templateCard: {
    padding: '32px',
    background: '#fff',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center' as const,
  },
  templateIcon: {
    width: '64px',
    height: '64px',
    margin: '0 auto 16px',
    background: 'rgba(48, 94, 235, 0.1)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#305EEB',
  },
  templateTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1F2937',
    margin: '0 0 8px',
  },
  templateDescription: {
    fontSize: '14px',
    color: '#6B7280',
    margin: 0,
    lineHeight: 1.5,
  },
  templateBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    background: 'rgba(48, 94, 235, 0.1)',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#305EEB',
    fontWeight: 500,
    marginTop: '12px',
  },
};

// ─────────────────────────────────────────────────────────────
// Canvas Intro Page
// ─────────────────────────────────────────────────────────────

interface CanvasIntroPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
  onCreateCanvas?: (template?: string) => void;
}

const CanvasIntroPage: React.FC<CanvasIntroPageProps> = ({ onNavigate, onCreateCanvas }) => {
  const { t } = useTranslation();

  const templates = [
    {
      id: 'blank',
      icon: <BlankIcon />,
      title: t('canvasIntro.templates.blank.title'),
      description: t('canvasIntro.templates.blank.description'),
      badge: null,
    },
    {
      id: 'chatbot',
      icon: <ChatbotIcon />,
      title: t('canvasIntro.templates.chatbot.title'),
      description: t('canvasIntro.templates.chatbot.description'),
      badge: t('canvasIntro.templates.popular'),
    },
    {
      id: 'rag',
      icon: <RagIcon />,
      title: t('canvasIntro.templates.rag.title'),
      description: t('canvasIntro.templates.rag.description'),
      badge: t('canvasIntro.templates.recommended'),
    },
    {
      id: 'agent',
      icon: <AgentIcon />,
      title: t('canvasIntro.templates.agent.title'),
      description: t('canvasIntro.templates.agent.description'),
      badge: t('canvasIntro.templates.advanced'),
    },
  ];

  const handleSelectTemplate = (templateId: string) => {
    onCreateCanvas?.(templateId);
  };

  return (
    <ContentArea title={t('canvasIntro.title')}>
      <div style={styles.container}>
        {/* Hero */}
        <section style={styles.hero}>
          <div style={styles.heroIcon}>
            <CanvasIcon />
          </div>
          <h1 style={styles.heroTitle}>{t('canvasIntro.hero.title')}</h1>
          <p style={styles.heroDescription}>{t('canvasIntro.hero.description')}</p>
          <div style={styles.heroActions}>
            <Button onClick={() => handleSelectTemplate('blank')}>
              {t('canvasIntro.hero.createBlank')}
            </Button>
            <Button variant="outline" onClick={() => onNavigate?.('workflows')}>
              {t('canvasIntro.hero.browseWorkflows')}
            </Button>
          </div>
        </section>

        {/* Templates */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>{t('canvasIntro.templates.title')}</h2>
          <div style={styles.templatesGrid}>
            {templates.map((template) => (
              <div
                key={template.id}
                style={styles.templateCard}
                onClick={() => handleSelectTemplate(template.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleSelectTemplate(template.id)}
              >
                <div style={styles.templateIcon}>{template.icon}</div>
                <h3 style={styles.templateTitle}>{template.title}</h3>
                <p style={styles.templateDescription}>{template.description}</p>
                {template.badge && (
                  <span style={styles.templateBadge}>{template.badge}</span>
                )}
              </div>
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

export const mainCanvasIntroFeature: MainFeatureModule = {
  id: 'main-CanvasIntro',
  name: 'Canvas Introduction',
  sidebarSection: 'workflow',
  sidebarItems: [
    {
      id: 'canvas-intro',
      titleKey: 'sidebar.workflow.canvas.title',
      descriptionKey: 'sidebar.workflow.canvas.description',
    },
  ],
  routes: {
    'canvas-intro': CanvasIntroPage,
  },
  requiresAuth: true,
};

export default mainCanvasIntroFeature;
