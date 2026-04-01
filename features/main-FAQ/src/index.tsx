'use client';

import React, { useState } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea, SearchInput, FilterTabs } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import './locales';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type FAQCategory = 'getting-started' | 'models' | 'data' | 'api' | 'billing' | 'security';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
  helpful: number;
  notHelpful: number;
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const ChevronIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
  >
    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ThumbUpIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.667 7V13.333H2.667C2.3 13.333 2 13.034 2 12.667V7.667C2 7.3 2.3 7 2.667 7H4.667ZM6 7L8.333 2C8.886 2 9.416 2.22 9.806 2.61C10.196 3 10.416 3.53 10.416 4.083V5.667H13.083C13.298 5.667 13.51 5.715 13.703 5.808C13.896 5.901 14.066 6.036 14.2 6.204C14.333 6.372 14.427 6.567 14.475 6.776C14.523 6.985 14.523 7.202 14.477 7.411L13.31 12.411C13.234 12.746 13.044 13.046 12.772 13.26C12.5 13.474 12.162 13.59 11.814 13.59H6.667C6.313 13.59 5.973 13.449 5.723 13.199C5.473 12.949 5.333 12.609 5.333 12.256V7.667C5.333 7.313 5.473 6.973 5.723 6.723L6 7Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ThumbDownIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.333 9V2.667H13.333C13.7 2.667 14 2.966 14 3.333V8.333C14 8.7 13.7 9 13.333 9H11.333ZM10 9L7.667 14C7.114 14 6.584 13.78 6.194 13.39C5.804 13 5.584 12.47 5.584 11.917V10.333H2.917C2.702 10.333 2.49 10.285 2.297 10.192C2.104 10.099 1.934 9.964 1.8 9.796C1.667 9.628 1.573 9.433 1.525 9.224C1.477 9.015 1.477 8.798 1.523 8.589L2.69 3.589C2.766 3.254 2.956 2.954 3.228 2.74C3.5 2.526 3.838 2.41 4.186 2.41H9.333C9.687 2.41 10.027 2.551 10.277 2.801C10.527 3.051 10.667 3.391 10.667 3.744V8.333C10.667 8.687 10.527 9.027 10.277 9.277L10 9Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: { padding: '24px', maxWidth: '900px', margin: '0 auto' },
  header: { textAlign: 'center' as const, marginBottom: '40px' },
  title: { fontSize: '32px', fontWeight: 700, color: '#1F2937', marginBottom: '12px' },
  subtitle: { fontSize: '16px', color: '#6B7280', lineHeight: 1.6 },
  searchSection: { marginBottom: '32px' },
  searchWrapper: { maxWidth: '600px', margin: '0 auto 20px' },
  tabsWrapper: { display: 'flex', justifyContent: 'center' },
  faqList: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
  faqItem: { background: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB', overflow: 'hidden' },
  faqQuestion: { padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s ease' },
  questionText: { fontSize: '15px', fontWeight: 600, color: '#1F2937', margin: 0, flex: 1 },
  categoryTag: { padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 500, marginRight: '16px' },
  chevron: { color: '#9CA3AF', flexShrink: 0 },
  faqAnswer: { padding: '0 24px 20px', overflow: 'hidden', transition: 'max-height 0.3s ease, padding 0.3s ease' },
  answerText: { fontSize: '14px', color: '#6B7280', lineHeight: 1.8, margin: 0 },
  feedbackSection: { display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #F3F4F6' },
  feedbackLabel: { fontSize: '12px', color: '#9CA3AF' },
  feedbackButton: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: '#6B7280', transition: 'all 0.2s ease' },
  feedbackCount: { fontWeight: 600 },
  contactSection: { marginTop: '48px', padding: '32px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)', borderRadius: '20px', textAlign: 'center' as const },
  contactTitle: { fontSize: '20px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' },
  contactDesc: { fontSize: '14px', color: '#6B7280', marginBottom: '20px' },
  contactLink: { color: '#6366F1', fontWeight: 500, textDecoration: 'none', cursor: 'pointer' },
};

const categoryStyles: Record<FAQCategory, { bg: string; color: string }> = {
  'getting-started': { bg: 'rgba(34, 197, 94, 0.1)', color: '#16A34A' },
  'models': { bg: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' },
  'data': { bg: 'rgba(6, 182, 212, 0.1)', color: '#0891B2' },
  'api': { bg: 'rgba(245, 158, 11, 0.1)', color: '#D97706' },
  'billing': { bg: 'rgba(236, 72, 153, 0.1)', color: '#DB2777' },
  'security': { bg: 'rgba(139, 92, 246, 0.1)', color: '#7C3AED' },
};

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

const mockFAQs: FAQItem[] = [
  {
    id: 'faq-001',
    question: '처음 사용하는데 어떻게 시작하나요?',
    answer: '시작하기 가이드를 따라 첫 번째 프로젝트를 만들어보세요. 대시보드에서 "새 프로젝트" 버튼을 클릭하고, 원하는 템플릿을 선택하면 됩니다. 기본 설정은 자동으로 구성되며, 필요에 따라 커스터마이징할 수 있습니다.',
    category: 'getting-started',
    helpful: 45,
    notHelpful: 3,
  },
  {
    id: 'faq-002',
    question: '모델 배포는 어떻게 하나요?',
    answer: '모델 배포는 Model Storage에서 배포하려는 모델을 선택한 후 "Deploy" 버튼을 클릭하면 됩니다. 배포 환경(개발/스테이징/프로덕션)을 선택하고, 리소스 할당량을 설정한 후 배포를 시작합니다. 배포 진행 상황은 실시간으로 모니터링할 수 있습니다.',
    category: 'models',
    helpful: 67,
    notHelpful: 5,
  },
  {
    id: 'faq-003',
    question: '데이터 업로드 시 지원하는 파일 형식은 무엇인가요?',
    answer: 'CSV, JSON, Parquet, JSONL 등 다양한 형식을 지원합니다. 이미지 데이터의 경우 JPEG, PNG, WebP를, 오디오 데이터의 경우 WAV, MP3, FLAC를 지원합니다. 대용량 파일은 청크 업로드를 통해 안정적으로 업로드할 수 있습니다.',
    category: 'data',
    helpful: 89,
    notHelpful: 2,
  },
  {
    id: 'faq-004',
    question: 'API 호출 제한은 어떻게 되나요?',
    answer: '기본 플랜은 분당 60회, 시간당 1,000회 API 호출이 가능합니다. 프로 플랜은 분당 300회, 시간당 10,000회입니다. 엔터프라이즈 플랜은 무제한 호출을 지원합니다. API 사용량은 대시보드에서 실시간으로 확인할 수 있습니다.',
    category: 'api',
    helpful: 34,
    notHelpful: 8,
  },
  {
    id: 'faq-005',
    question: '요금제는 어떻게 구성되어 있나요?',
    answer: '무료, 프로, 엔터프라이즈 세 가지 플랜이 있습니다. 무료 플랜은 기본 기능과 제한된 리소스를 제공합니다. 프로 플랜은 월 $99부터 시작하며 더 많은 리소스와 우선 지원을 제공합니다. 엔터프라이즈 플랜은 맞춤 가격으로, 전담 지원과 커스텀 SLA를 포함합니다.',
    category: 'billing',
    helpful: 56,
    notHelpful: 4,
  },
  {
    id: 'faq-006',
    question: '데이터 보안은 어떻게 관리되나요?',
    answer: '모든 데이터는 AES-256 암호화로 저장되며, 전송 시 TLS 1.3을 사용합니다. SOC 2 Type II, ISO 27001 인증을 보유하고 있으며, GDPR을 준수합니다. 또한 역할 기반 접근 제어(RBAC)와 감사 로그를 제공하여 데이터 접근을 추적할 수 있습니다.',
    category: 'security',
    helpful: 78,
    notHelpful: 1,
  },
  {
    id: 'faq-007',
    question: '커스텀 모델을 업로드할 수 있나요?',
    answer: '네, PyTorch, TensorFlow, ONNX 형식의 커스텀 모델을 업로드할 수 있습니다. Model Storage에서 "Upload Model" 버튼을 클릭하고, 모델 파일과 메타데이터를 입력하면 됩니다. 업로드 후 자동으로 검증 과정을 거친 후 사용 가능합니다.',
    category: 'models',
    helpful: 92,
    notHelpful: 3,
  },
];

// ─────────────────────────────────────────────────────────────
// FAQ Page
// ─────────────────────────────────────────────────────────────

interface FAQPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const FAQPage: React.FC<FAQPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const tabs = [
    { id: 'all', label: t('faq.tabs.all') },
    { id: 'getting-started', label: t('faq.tabs.gettingStarted') },
    { id: 'models', label: t('faq.tabs.models') },
    { id: 'data', label: t('faq.tabs.data') },
    { id: 'api', label: t('faq.tabs.api') },
  ];

  const filteredFAQs = mockFAQs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || faq.category === activeTab;
    return matchesSearch && matchesTab;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <ContentArea title={t('faq.title')}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>{t('faq.title')}</h1>
          <p style={styles.subtitle}>{t('faq.subtitle')}</p>
        </div>

        <div style={styles.searchSection}>
          <div style={styles.searchWrapper}>
            <SearchInput
              placeholder={t('faq.searchPlaceholder')}
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
          <div style={styles.tabsWrapper}>
            <FilterTabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </div>

        <div style={styles.faqList}>
          {filteredFAQs.map(faq => (
            <div key={faq.id} style={styles.faqItem}>
              <div
                style={{
                  ...styles.faqQuestion,
                  background: expandedId === faq.id ? '#F9FAFB' : 'transparent',
                }}
                onClick={() => toggleExpand(faq.id)}
              >
                <span
                  style={{
                    ...styles.categoryTag,
                    background: categoryStyles[faq.category].bg,
                    color: categoryStyles[faq.category].color,
                  }}
                >
                  {faq.category}
                </span>
                <h3 style={styles.questionText}>{faq.question}</h3>
                <div style={styles.chevron}>
                  <ChevronIcon expanded={expandedId === faq.id} />
                </div>
              </div>

              {expandedId === faq.id && (
                <div style={styles.faqAnswer}>
                  <p style={styles.answerText}>{faq.answer}</p>
                  <div style={styles.feedbackSection}>
                    <span style={styles.feedbackLabel}>{t('faq.wasHelpful')}</span>
                    <button style={styles.feedbackButton}>
                      <ThumbUpIcon />
                      <span style={styles.feedbackCount}>{faq.helpful}</span>
                    </button>
                    <button style={styles.feedbackButton}>
                      <ThumbDownIcon />
                      <span style={styles.feedbackCount}>{faq.notHelpful}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={styles.contactSection}>
          <h2 style={styles.contactTitle}>{t('faq.contact.title')}</h2>
          <p style={styles.contactDesc}>{t('faq.contact.description')}</p>
          <span style={styles.contactLink} onClick={() => onNavigate?.('service-request')}>
            {t('faq.contact.link')} →
          </span>
        </div>
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const mainFAQFeature: MainFeatureModule = {
  id: 'main-FAQ',
  name: 'FAQ',
  sidebarSection: 'support',
  sidebarItems: [
    {
      id: 'faq',
      titleKey: 'sidebar.support.faq.title',
      descriptionKey: 'sidebar.support.faq.description',
    },
  ],
  routes: {
    'faq': FAQPage,
  },
  requiresAuth: false,
};

export default mainFAQFeature;
