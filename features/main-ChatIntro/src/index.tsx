'use client';

import React from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import './locales';
import styles from './styles/chat-intro.module.scss';

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const ChatAiIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 44C35.046 44 44 35.046 44 24C44 12.954 35.046 4 24 4C12.954 4 4 12.954 4 24C4 28.5 5.5 32.5 8 35.5L6 42L12.5 40C15.5 42.5 19.5 44 24 44Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 22C16 20.896 16.896 20 18 20H30C31.104 20 32 20.896 32 22V26C32 27.104 31.104 28 30 28H18C16.896 28 16 27.104 16 26V22Z" stroke="currentColor" strokeWidth="2"/>
    <circle cx="20" cy="24" r="1.5" fill="currentColor"/>
    <circle cx="28" cy="24" r="1.5" fill="currentColor"/>
  </svg>
);

const MessageIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.75 11.25C15.75 11.6478 15.592 12.0294 15.3107 12.3107C15.0294 12.592 14.6478 12.75 14.25 12.75H5.25L2.25 15.75V3.75C2.25 3.35218 2.40804 2.97064 2.68934 2.68934C2.97064 2.40804 3.35218 2.25 3.75 2.25H14.25C14.6478 2.25 15.0294 2.40804 15.3107 2.68934C15.592 2.97064 15.75 3.35218 15.75 3.75V11.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ClockIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="9" r="6.75" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M9 5.25V9L11.25 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ArrowRightIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.75 9H14.25M14.25 9L9 3.75M14.25 9L9 14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SearchIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2"/>
    <path d="M20 20L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ZapIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Chat Introduction Page
// ─────────────────────────────────────────────────────────────

interface ChatIntroPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const ChatIntroPage: React.FC<ChatIntroPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();

  const handleStartNewChat = () => {
    onNavigate?.('new-chat');
  };

  const handleViewHistory = () => {
    onNavigate?.('chat-history');
  };

  return (
    <ContentArea>
      <div className={styles.container}>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <div className={styles.heroIcon}>
            <ChatAiIcon />
          </div>
          <h1 className={styles.heroTitle}>
            {t('chatIntro.heroTitle')}
          </h1>
          <p className={styles.heroDescription}>
            {t('chatIntro.heroDescription')}
          </p>

          <div className={styles.buttonGroup}>
            <button onClick={handleStartNewChat} className={styles.primaryButton}>
              <MessageIcon />
              {t('chatIntro.startNewChat')}
              <ArrowRightIcon />
            </button>
            <button onClick={handleViewHistory} className={styles.secondaryButton}>
              <ClockIcon />
              {t('chatIntro.viewHistory')}
            </button>
          </div>
        </section>

        {/* Features Grid */}
        <section className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <ChatAiIcon />
            </div>
            <h3>{t('chatIntro.features.naturalLanguage.title')}</h3>
            <p>{t('chatIntro.features.naturalLanguage.description')}</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <SearchIcon />
            </div>
            <h3>{t('chatIntro.features.contextSearch.title')}</h3>
            <p>{t('chatIntro.features.contextSearch.description')}</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <ZapIcon />
            </div>
            <h3>{t('chatIntro.features.toolIntegration.title')}</h3>
            <p>{t('chatIntro.features.toolIntegration.description')}</p>
          </div>
        </section>

        {/* Quick Start Guide */}
        <section className={styles.quickStart}>
          <h3>{t('chatIntro.quickStart.title')}</h3>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h4>{t('chatIntro.quickStart.step1.title')}</h4>
                <p>{t('chatIntro.quickStart.step1.description')}</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h4>{t('chatIntro.quickStart.step2.title')}</h4>
                <p>{t('chatIntro.quickStart.step2.description')}</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h4>{t('chatIntro.quickStart.step3.title')}</h4>
                <p>{t('chatIntro.quickStart.step3.description')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Additional Features */}
        <section className={styles.additionalInfo}>
          <h3>{t('chatIntro.additionalFeatures.title')}</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <h4>{t('chatIntro.additionalFeatures.multimodal.title')}</h4>
              <p>{t('chatIntro.additionalFeatures.multimodal.description')}</p>
            </div>
            <div className={styles.infoCard}>
              <h4>{t('chatIntro.additionalFeatures.history.title')}</h4>
              <p>{t('chatIntro.additionalFeatures.history.description')}</p>
            </div>
            <div className={styles.infoCard}>
              <h4>{t('chatIntro.additionalFeatures.workflow.title')}</h4>
              <p>{t('chatIntro.additionalFeatures.workflow.description')}</p>
            </div>
          </div>
        </section>
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const mainChatIntroFeature: MainFeatureModule = {
  id: 'main-ChatIntro',
  name: 'Chat Introduction',
  sidebarSection: 'chat',
  sidebarItems: [
    {
      id: 'chat-intro',
      titleKey: 'sidebar.chat.intro.title',
      descriptionKey: 'sidebar.chat.intro.description',
    },
  ],
  routes: {
    'chat-intro': ChatIntroPage,
  },
  requiresAuth: true,
};

export default mainChatIntroFeature;
