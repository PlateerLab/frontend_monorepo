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

const categoryClasses: Record<FAQCategory, string> = {
  'getting-started': 'bg-green-500/10 text-green-600',
  'models': 'bg-indigo-500/10 text-indigo-500',
  'data': 'bg-cyan-500/10 text-cyan-700',
  'api': 'bg-amber-500/10 text-amber-600',
  'billing': 'bg-pink-500/10 text-pink-600',
  'security': 'bg-violet-500/10 text-violet-600',
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
    <ContentArea title={t('faq.title')} description={t('faq.description')}>
      <div className="p-6 max-w-[900px] mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-[32px] font-bold text-foreground mb-3">{t('faq.title')}</h1>
          <p className="text-base text-muted-foreground leading-relaxed">{t('faq.subtitle')}</p>
        </div>

        <div className="mb-8">
          <div className="max-w-[600px] mx-auto mb-5">
            <SearchInput
              placeholder={t('faq.searchPlaceholder')}
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
          <div className="flex justify-center">
            <FilterTabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {filteredFAQs.map(faq => (
            <div key={faq.id} className="bg-white rounded-[14px] border border-border overflow-hidden">
              <div
                className={`px-6 py-5 flex justify-between items-center cursor-pointer transition-colors duration-200 ${expandedId === faq.id ? 'bg-muted/50' : ''}`}
                onClick={() => toggleExpand(faq.id)}
              >
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium mr-4 ${categoryClasses[faq.category]}`}>
                  {faq.category}
                </span>
                <h3 className="text-[15px] font-semibold text-foreground m-0 flex-1">{faq.question}</h3>
                <div className="text-muted-foreground/60 shrink-0">
                  <ChevronIcon expanded={expandedId === faq.id} />
                </div>
              </div>

              {expandedId === faq.id && (
                <div className="px-6 pb-5 overflow-hidden">
                  <p className="text-sm text-muted-foreground leading-[1.8] m-0">{faq.answer}</p>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50">
                    <span className="text-xs text-muted-foreground/60">{t('faq.wasHelpful')}</span>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 border border-border rounded-lg cursor-pointer text-xs text-muted-foreground transition-all duration-200 hover:bg-muted">
                      <ThumbUpIcon />
                      <span className="font-semibold">{faq.helpful}</span>
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 border border-border rounded-lg cursor-pointer text-xs text-muted-foreground transition-all duration-200 hover:bg-muted">
                      <ThumbDownIcon />
                      <span className="font-semibold">{faq.notHelpful}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 p-8 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-[20px] text-center">
          <h2 className="text-xl font-semibold text-foreground mb-3">{t('faq.contact.title')}</h2>
          <p className="text-sm text-muted-foreground mb-5">{t('faq.contact.description')}</p>
          <span className="text-indigo-500 font-medium cursor-pointer" onClick={() => onNavigate?.('service-request')}>
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
