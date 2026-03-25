'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea, SearchInput, FilterTabs, Button, EmptyState } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { createApiClient } from '@xgen/api-client';

import styles from './styles/workflows.module.scss';
import type { WorkflowItem, WorkflowFilter } from './types';

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const WorkflowIcon: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 6V42M6 24H42M14 34L34 14M14 14L34 34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const GridIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="11" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="2" y="11" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="11" y="11" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const ListIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 4.5H15M6 9H15M6 13.5H15M3 4.5H3.0075M3 9H3.0075M3 13.5H3.0075" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PlusIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const NodeIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="3" cy="3" r="1" stroke="currentColor" strokeWidth="1"/>
    <circle cx="11" cy="3" r="1" stroke="currentColor" strokeWidth="1"/>
    <circle cx="3" cy="11" r="1" stroke="currentColor" strokeWidth="1"/>
    <circle cx="11" cy="11" r="1" stroke="currentColor" strokeWidth="1"/>
    <path d="M4 4L5.5 5.5M10 4L8.5 5.5M4 10L5.5 8.5M10 10L8.5 8.5" stroke="currentColor" strokeWidth="1"/>
  </svg>
);

const PlayIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.083 2.917L10.5 7L4.083 11.083V2.917Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ClockIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 3.5V7L9.333 8.167M12.833 7C12.833 10.222 10.222 12.833 7 12.833C3.778 12.833 1.167 10.222 1.167 7C1.167 3.778 3.778 1.167 7 1.167C10.222 1.167 12.833 3.778 12.833 7Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EditIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.333 2L14 4.667L5.333 13.333H2.667V10.667L11.333 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrashIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 4H14M12.667 4V13.333C12.667 14 12 14.667 11.333 14.667H4.667C4 14.667 3.333 14 3.333 13.333V4M5.333 4V2.667C5.333 2 6 1.333 6.667 1.333H9.333C10 1.333 10.667 2 10.667 2.667V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MoreIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="1" fill="currentColor"/>
    <circle cx="8" cy="4" r="1" fill="currentColor"/>
    <circle cx="8" cy="12" r="1" fill="currentColor"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

const MOCK_WORKFLOWS: WorkflowItem[] = [
  {
    id: 'wf-001',
    name: '이커머스 법률 상담',
    description: '전자상거래 관련 법률 문의에 대해 AI 기반으로 전문적인 답변을 제공하는 워크플로우입니다.',
    status: 'published',
    category: '법무',
    version: '1.2.0',
    nodeCount: 12,
    tags: ['법률', '전자상거래', 'AI'],
    executionCount: 245,
    lastExecutedAt: '2025-01-28T10:30:00Z',
    createdAt: '2025-01-15T09:00:00Z',
    updatedAt: '2025-01-27T14:00:00Z',
    createdBy: 'user-001',
  },
  {
    id: 'wf-002',
    name: '고객지원 자동응답',
    description: '고객 문의에 대한 자동 응답 시스템으로 24시간 지원이 가능한 챗봇 워크플로우입니다.',
    status: 'published',
    category: 'CS',
    version: '2.0.0',
    nodeCount: 18,
    tags: ['고객지원', '자동화', '챗봇'],
    executionCount: 512,
    lastExecutedAt: '2025-01-28T09:00:00Z',
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-01-26T16:00:00Z',
    createdBy: 'user-002',
  },
  {
    id: 'wf-003',
    name: 'HR 문서 검색 (Draft)',
    description: '인사 관련 문서를 빠르게 검색하고 필요한 정보를 추출하는 RAG 기반 워크플로우입니다.',
    status: 'draft',
    category: 'HR',
    version: '0.5.0',
    nodeCount: 8,
    tags: ['HR', 'RAG', '문서검색'],
    executionCount: 0,
    createdAt: '2025-01-25T11:00:00Z',
    updatedAt: '2025-01-28T08:00:00Z',
    createdBy: 'user-001',
  },
  {
    id: 'wf-004',
    name: '레거시 마케팅 봇',
    description: '더 이상 사용되지 않는 마케팅 콘텐츠 생성 워크플로우입니다.',
    status: 'archived',
    category: '마케팅',
    version: '1.0.0',
    nodeCount: 6,
    tags: ['마케팅'],
    executionCount: 89,
    lastExecutedAt: '2025-01-10T12:00:00Z',
    createdAt: '2024-12-01T09:00:00Z',
    updatedAt: '2025-01-20T10:00:00Z',
    createdBy: 'user-003',
  },
];

// ─────────────────────────────────────────────────────────────
// Workflows Page
// ─────────────────────────────────────────────────────────────

interface WorkflowsPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
  onSelectWorkflow?: (workflow: WorkflowItem) => void;
}

const WorkflowsPage: React.FC<WorkflowsPageProps> = ({ onNavigate, onSelectWorkflow }) => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [filter, setFilter] = useState<WorkflowFilter>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const loadWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: API 연동
      await new Promise(resolve => setTimeout(resolve, 400));
      setWorkflows(MOCK_WORKFLOWS);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

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

      // 상태 필터
      if (filter !== 'all' && workflow.status !== filter) return false;

      return true;
    });
  }, [workflows, search, filter]);

  // 필터 탭
  const filterTabs = [
    { key: 'all', label: t('workflows.filter.all'), count: workflows.length },
    { key: 'published', label: t('workflows.filter.published'), count: workflows.filter(w => w.status === 'published').length },
    { key: 'draft', label: t('workflows.filter.draft'), count: workflows.filter(w => w.status === 'draft').length },
    { key: 'archived', label: t('workflows.filter.archived'), count: workflows.filter(w => w.status === 'archived').length },
  ];

  const handleWorkflowClick = (workflow: WorkflowItem) => {
    onSelectWorkflow?.(workflow);
  };

  const handleCreateNew = () => {
    onNavigate?.('canvas-intro');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <ContentArea
      title={t('workflows.title')}
      headerActions={
        <Button onClick={handleCreateNew}>
          <PlusIcon />
          {t('workflows.createNew')}
        </Button>
      }
    >
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <FilterTabs
              tabs={filterTabs}
              activeKey={filter}
              onChange={(key) => setFilter(key as WorkflowFilter)}
            />
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('workflows.searchPlaceholder')}
              size="sm"
            />
          </div>
          <div className={styles.headerRight}>
            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
                onClick={() => setViewMode('grid')}
                title={t('workflows.viewGrid')}
              >
                <GridIcon />
              </button>
              <button
                className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
                onClick={() => setViewMode('list')}
                title={t('workflows.viewList')}
              >
                <ListIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <EmptyState
            icon={<WorkflowIcon />}
            title={t('workflows.empty.title')}
            description={t('workflows.empty.description')}
            action={{
              label: t('workflows.empty.action'),
              onClick: handleCreateNew,
            }}
          />
        ) : viewMode === 'grid' ? (
          <div className={styles.grid}>
            {filteredWorkflows.map(workflow => (
              <div
                key={workflow.id}
                className={styles.card}
                onClick={() => handleWorkflowClick(workflow)}
              >
                <div className={styles.cardThumbnail}>
                  {workflow.thumbnailUrl ? (
                    <img src={workflow.thumbnailUrl} alt="" />
                  ) : (
                    <WorkflowIcon />
                  )}
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{workflow.name}</h3>
                    <span className={`${styles.statusBadge} ${styles[workflow.status]}`}>
                      {t(`workflows.status.${workflow.status}`)}
                    </span>
                  </div>
                  <p className={styles.cardDescription}>{workflow.description}</p>
                  <div className={styles.cardMeta}>
                    <span className={styles.cardMetaItem}>
                      <NodeIcon />
                      {t('workflows.nodeCount', { count: workflow.nodeCount })}
                    </span>
                    <span className={styles.cardMetaItem}>
                      <PlayIcon />
                      {workflow.executionCount}
                    </span>
                    <span className={styles.cardMetaItem}>
                      <ClockIcon />
                      {formatDate(workflow.updatedAt)}
                    </span>
                  </div>
                  {workflow.tags && workflow.tags.length > 0 && (
                    <div className={styles.cardTags}>
                      {workflow.tags.slice(0, 3).map(tag => (
                        <span key={tag} className={styles.tag}>#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.list}>
            {filteredWorkflows.map(workflow => (
              <div
                key={workflow.id}
                className={styles.listItem}
                onClick={() => handleWorkflowClick(workflow)}
              >
                <div className={styles.listIcon}>
                  <WorkflowIcon />
                </div>
                <div className={styles.listContent}>
                  <h3 className={styles.listTitle}>{workflow.name}</h3>
                  <p className={styles.listDescription}>{workflow.description}</p>
                </div>
                <span className={`${styles.statusBadge} ${styles[workflow.status]}`}>
                  {t(`workflows.status.${workflow.status}`)}
                </span>
                <div className={styles.listMeta}>
                  <span>{workflow.nodeCount} nodes</span>
                  <span>{formatDate(workflow.updatedAt)}</span>
                </div>
                <div className={styles.listActions}>
                  <button
                    className={styles.actionButton}
                    onClick={(e) => { e.stopPropagation(); }}
                    title={t('workflows.edit')}
                  >
                    <EditIcon />
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.danger}`}
                    onClick={(e) => { e.stopPropagation(); }}
                    title={t('workflows.delete')}
                  >
                    <TrashIcon />
                  </button>
                </div>
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

export const mainWorkflowsFeature: MainFeatureModule = {
  id: 'main-Workflows',
  name: 'Workflows',
  sidebarSection: 'workflow',
  sidebarItems: [
    {
      id: 'workflows',
      titleKey: 'sidebar.workflow.workflows.title',
      descriptionKey: 'sidebar.workflow.workflows.description',
    },
  ],
  routes: {
    'workflows': WorkflowsPage,
  },
  requiresAuth: true,
};

export default mainWorkflowsFeature;

export type { WorkflowItem, WorkflowFilter, WorkflowStatus } from './types';
