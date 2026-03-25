'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea, SearchInput, EmptyState } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { createApiClient } from '@xgen/api-client';

import styles from './styles/chat-new.module.scss';
import type { WorkflowOption, WorkflowCategory } from './types';

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const WorkflowIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3V21M3 12H21M7 17L17 7M7 7L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const StarIcon: React.FC<{ filled?: boolean }> = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill={filled ? 'currentColor' : 'none'} xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1L10.163 5.279L15 5.919L11.5 9.321L12.326 14L8 11.779L3.674 14L4.5 9.321L1 5.919L5.837 5.279L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ClockIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 3.5V7L9.333 8.167M12.833 7C12.833 10.222 10.222 12.833 7 12.833C3.778 12.833 1.167 10.222 1.167 7C1.167 3.778 3.778 1.167 7 1.167C10.222 1.167 12.833 3.778 12.833 7Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FireIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 1.667C10 1.667 11.667 4.167 11.667 6.667C11.667 8.333 10.833 9.167 10 9.167C9.167 9.167 8.333 8.333 8.333 6.667C8.333 5 10 3.333 10 1.667ZM6.667 5.833C6.667 5.833 7.5 6.667 7.5 7.5C7.5 8.333 7.083 8.75 6.667 8.75C6.25 8.75 5.833 8.333 5.833 7.5C5.833 6.667 6.667 5.833 6.667 5.833ZM13.333 10C13.333 10 15 12.5 15 14.167C15 15.833 13.333 18.333 10 18.333C6.667 18.333 5 15.833 5 14.167C5 12.5 6.667 10 6.667 10C6.667 10 8.333 11.667 10 11.667C11.667 11.667 13.333 10 13.333 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChartIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.667 11.667H2.333V2.333M4.667 8.167V9.333M7 6.417V9.333M9.333 4.667V9.333" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SearchResultIcon: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 38C30.3888 38 38 30.3888 38 21C38 11.6112 30.3888 4 21 4C11.6112 4 4 11.6112 4 21C4 30.3888 11.6112 38 21 38Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M44 44L33 33" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

const MOCK_WORKFLOWS: WorkflowOption[] = [
  {
    workflowId: 'wf-001',
    name: '이커머스 법률 상담',
    description: '전자상거래 관련 법률 문의에 대해 AI 기반으로 전문적인 답변을 제공합니다.',
    category: '법무',
    usageCount: 245,
    isFavorite: true,
    lastUsedAt: '2025-01-28T10:30:00Z',
    tags: ['법률', '전자상거래', 'AI'],
  },
  {
    workflowId: 'wf-002',
    name: '고객지원 자동응답',
    description: '고객 문의에 대한 자동 응답 시스템으로 24시간 지원이 가능합니다.',
    category: 'CS',
    usageCount: 512,
    isFavorite: true,
    lastUsedAt: '2025-01-27T09:00:00Z',
    tags: ['고객지원', '자동화'],
  },
  {
    workflowId: 'wf-003',
    name: 'HR 문서 검색',
    description: '인사 관련 문서를 빠르게 검색하고 필요한 정보를 추출합니다.',
    category: 'HR',
    usageCount: 89,
    isFavorite: false,
    lastUsedAt: '2025-01-26T15:00:00Z',
    tags: ['HR', '문서검색'],
  },
  {
    workflowId: 'wf-004',
    name: '마케팅 콘텐츠 생성',
    description: 'SNS 게시물, 블로그 글, 광고 카피 등 다양한 마케팅 콘텐츠를 생성합니다.',
    category: '마케팅',
    usageCount: 178,
    isFavorite: false,
    lastUsedAt: '2025-01-25T14:00:00Z',
    tags: ['마케팅', '콘텐츠', 'AI'],
  },
  {
    workflowId: 'wf-005',
    name: '기술 문서 번역',
    description: '기술 문서를 다국어로 번역하며 전문 용어를 정확하게 처리합니다.',
    category: '개발',
    usageCount: 156,
    isFavorite: false,
    lastUsedAt: '2025-01-24T11:00:00Z',
    tags: ['번역', '기술문서'],
  },
  {
    workflowId: 'wf-006',
    name: '데이터 분석 리포트',
    description: '데이터를 분석하고 인사이트가 담긴 리포트를 자동으로 생성합니다.',
    category: '데이터',
    usageCount: 234,
    isFavorite: false,
    lastUsedAt: '2025-01-23T16:30:00Z',
    tags: ['데이터', '분석', '리포트'],
  },
];

const MOCK_CATEGORIES: WorkflowCategory[] = [
  { id: 'all', name: '전체', count: 6 },
  { id: 'legal', name: '법무', count: 1 },
  { id: 'cs', name: 'CS', count: 1 },
  { id: 'hr', name: 'HR', count: 1 },
  { id: 'marketing', name: '마케팅', count: 1 },
  { id: 'dev', name: '개발', count: 1 },
  { id: 'data', name: '데이터', count: 1 },
];

// ─────────────────────────────────────────────────────────────
// Chat New Page
// ─────────────────────────────────────────────────────────────

interface ChatNewPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
  onSelectWorkflow?: (workflow: WorkflowOption) => void;
}

const ChatNewPage: React.FC<ChatNewPageProps> = ({ onNavigate, onSelectWorkflow }) => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState<WorkflowOption[]>([]);
  const [categories, setCategories] = useState<WorkflowCategory[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const loadWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: API 연동
      // const api = createApiClient();
      // const response = await api.get<WorkflowOption[]>('/api/workflows');
      // setWorkflows(response.data);

      await new Promise(resolve => setTimeout(resolve, 400));
      setWorkflows(MOCK_WORKFLOWS);
      setCategories(MOCK_CATEGORIES);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  // 즐겨찾기 워크플로우
  const favoriteWorkflows = useMemo(() =>
    workflows.filter(w => w.isFavorite).slice(0, 4),
    [workflows]
  );

  // 최근 사용 워크플로우
  const recentWorkflows = useMemo(() =>
    workflows
      .filter(w => w.lastUsedAt)
      .sort((a, b) => new Date(b.lastUsedAt!).getTime() - new Date(a.lastUsedAt!).getTime())
      .slice(0, 4),
    [workflows]
  );

  // 필터링된 워크플로우
  const filteredWorkflows = useMemo(() => {
    return workflows.filter(workflow => {
      // 검색 필터
      if (search) {
        const searchLower = search.toLowerCase();
        const matchName = workflow.name.toLowerCase().includes(searchLower);
        const matchDesc = workflow.description?.toLowerCase().includes(searchLower);
        const matchTags = workflow.tags?.some(tag => tag.toLowerCase().includes(searchLower));
        if (!matchName && !matchDesc && !matchTags) return false;
      }

      // 카테고리 필터
      if (selectedCategory !== 'all') {
        if (workflow.category?.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      }

      return true;
    });
  }, [workflows, search, selectedCategory]);

  const handleWorkflowSelect = (workflow: WorkflowOption) => {
    onSelectWorkflow?.(workflow);
    onNavigate?.('current-chat');
  };

  const handleToggleFavorite = async (workflow: WorkflowOption, e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: API 연동
    setWorkflows(prev => prev.map(w =>
      w.workflowId === workflow.workflowId
        ? { ...w, isFavorite: !w.isFavorite }
        : w
    ));
  };

  const formatLastUsed = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('chatNew.today');
    if (diffDays === 1) return t('chatNew.yesterday');
    return t('chatNew.daysAgo', { days: diffDays });
  };

  return (
    <ContentArea title={t('chatNew.title')}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>{t('chatNew.header.title')}</h1>
          <p className={styles.subtitle}>{t('chatNew.header.subtitle')}</p>
        </div>

        {/* Quick Start (Favorites) */}
        {!loading && favoriteWorkflows.length > 0 && (
          <section className={styles.quickStartSection}>
            <h2 className={styles.sectionTitle}>
              <FireIcon />
              {t('chatNew.sections.favorites')}
            </h2>
            <div className={styles.quickStartGrid}>
              {favoriteWorkflows.map(workflow => (
                <button
                  key={workflow.workflowId}
                  className={styles.quickStartCard}
                  onClick={() => handleWorkflowSelect(workflow)}
                >
                  <div className={styles.quickStartIcon}>
                    <WorkflowIcon />
                  </div>
                  <div className={styles.quickStartText}>
                    <p className={styles.quickStartName}>{workflow.name}</p>
                    <p className={styles.quickStartMeta}>{workflow.category}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Search & Category Filter */}
        <div className={styles.searchWrapper}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('chatNew.searchPlaceholder')}
            size="md"
            className={styles.searchInput}
          />
        </div>

        <div className={styles.categoryFilter}>
          {categories.map(category => (
            <button
              key={category.id}
              className={`${styles.categoryChip} ${selectedCategory === category.id ? styles.active : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
              <span className={styles.categoryCount}>{category.count}</span>
            </button>
          ))}
        </div>

        {/* Workflow Grid */}
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <EmptyState
            icon={<SearchResultIcon />}
            title={t('chatNew.empty.title')}
            description={t('chatNew.empty.description')}
          />
        ) : (
          <div className={styles.workflowGrid}>
            {filteredWorkflows.map(workflow => (
              <div
                key={workflow.workflowId}
                className={`${styles.workflowCard} ${workflow.isFavorite ? styles.favorite : ''}`}
                onClick={() => handleWorkflowSelect(workflow)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleWorkflowSelect(workflow)}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}>
                    {workflow.iconUrl ? (
                      <img src={workflow.iconUrl} alt="" />
                    ) : (
                      <WorkflowIcon />
                    )}
                  </div>
                  <div className={styles.cardInfo}>
                    <h3 className={styles.cardName}>{workflow.name}</h3>
                    <p className={styles.cardCategory}>{workflow.category}</p>
                  </div>
                  <button
                    className={`${styles.favoriteButton} ${workflow.isFavorite ? styles.active : ''}`}
                    onClick={(e) => handleToggleFavorite(workflow, e)}
                    aria-label={workflow.isFavorite ? t('chatNew.removeFavorite') : t('chatNew.addFavorite')}
                  >
                    <StarIcon filled={workflow.isFavorite} />
                  </button>
                </div>
                <p className={styles.cardDescription}>{workflow.description}</p>
                <div className={styles.cardMeta}>
                  <span className={styles.cardMetaItem}>
                    <ChartIcon />
                    {t('chatNew.usageCount', { count: workflow.usageCount })}
                  </span>
                  {workflow.lastUsedAt && (
                    <span className={styles.cardMetaItem}>
                      <ClockIcon />
                      {formatLastUsed(workflow.lastUsedAt)}
                    </span>
                  )}
                </div>
                {workflow.tags && workflow.tags.length > 0 && (
                  <div className={styles.cardTags}>
                    {workflow.tags.slice(0, 3).map(tag => (
                      <span key={tag} className={styles.tag}>#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const mainChatNewFeature: MainFeatureModule = {
  id: 'main-ChatNew',
  name: 'New Chat',
  sidebarSection: 'chat',
  sidebarItems: [
    {
      id: 'new-chat',
      titleKey: 'sidebar.chat.new.title',
      descriptionKey: 'sidebar.chat.new.description',
    },
  ],
  routes: {
    'new-chat': ChatNewPage,
  },
  requiresAuth: true,
};

export default mainChatNewFeature;

export type { WorkflowOption, WorkflowCategory } from './types';
