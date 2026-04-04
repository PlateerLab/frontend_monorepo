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
    // Navigate to canvas editor; pass template via onCreateCanvas or fallback to /canvas
    if (onCreateCanvas) {
      onCreateCanvas(templateId);
    } else {
      window.location.href = '/canvas';
    }
  };

  return (
    <ContentArea title={t('canvasIntro.title')} description={t('canvasIntro.description')}>
      <div className="p-6 max-w-[1200px] mx-auto">
        {/* Hero */}
        <section className="text-center py-12 mb-12 bg-gradient-to-br from-primary/5 to-indigo-500/5 rounded-2xl">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary to-indigo-500 rounded-2xl flex items-center justify-center text-white">
            <CanvasIcon />
          </div>
          <h1 className="text-[32px] font-bold text-foreground mb-4">{t('canvasIntro.hero.title')}</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-[600px] mx-auto leading-relaxed">{t('canvasIntro.hero.description')}</p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => handleSelectTemplate('blank')}>
              {t('canvasIntro.hero.createBlank')}
            </Button>
            <Button variant="outline" onClick={() => onNavigate?.('workflows')}>
              {t('canvasIntro.hero.browseWorkflows')}
            </Button>
          </div>
        </section>

        {/* Templates */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-foreground mb-6 text-center">{t('canvasIntro.templates.title')}</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-8 bg-white border border-border rounded-xl cursor-pointer transition-all duration-200 text-center hover:shadow-md"
                onClick={() => handleSelectTemplate(template.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleSelectTemplate(template.id)}
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-xl flex items-center justify-center text-primary">{template.icon}</div>
                <h3 className="text-base font-semibold text-foreground mb-2">{template.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{template.description}</p>
                {template.badge && (
                  <span className="inline-block px-2 py-1 bg-primary/10 rounded text-xs text-primary font-medium mt-3">{template.badge}</span>
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
      href: '/canvas',
    },
  ],
  routes: {
    'canvas-intro': CanvasIntroPage,
  },
  requiresAuth: true,
};

export default mainCanvasIntroFeature;
