'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { RouteComponentProps, MainFeatureModule, WorkflowOption } from '@xgen/types';
import { ContentArea, SearchInput, EmptyState, FilterTabs } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import './locales';
import { createApiClient } from '@xgen/api-client';

import styles from './styles/chat-new.module.scss';
import type { ChatNewPageProps, WorkflowDetailFromAPI, WorkflowFilter, WorkflowOwnerFilter } from './types';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY_CURRENT_CHAT = 'xgen_current_chat';
const STORAGE_KEY_FAVORITES = 'xgen_workflow_favorites';

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const WorkflowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
    <path d="M10 6.5H14M17.5 10V14M10 17.5H14M6.5 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const StarIcon: React.FC<{ filled?: boolean; className?: string }> = ({ filled, className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill={filled ? 'currentColor' : 'none'} xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1L10.163 5.279L15 5.919L11.5 9.321L12.326 14L8 11.779L3.674 14L4.5 9.321L1 5.919L5.837 5.279L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 3L13 8L4 13V3Z" fill="currentColor"/>
  </svg>
);

const UserIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.667 12.25V11.083C11.667 10.4645 11.4214 9.87141 10.9838 9.43382C10.5462 8.99624 9.95311 8.75 9.33467 8.75H4.66801C4.04956 8.75 3.45647 8.99624 3.01889 9.43382C2.58131 9.87141 2.33301 10.4645 2.33301 11.083V12.25M9.33301 4.08333C9.33301 5.37196 8.28831 6.41667 6.99967 6.41667C5.71101 6.41667 4.66634 5.37196 4.66634 4.08333C4.66634 2.79467 5.71101 1.75 6.99967 1.75C8.28831 1.75 9.33301 2.79467 9.33301 4.08333Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UsersIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 12.25V11.083C10 10.4645 9.7544 9.87141 9.31682 9.43382C8.87924 8.99624 8.28616 8.75 7.66772 8.75H3C2.38156 8.75 1.78847 8.99624 1.35089 9.43382C0.91331 9.87141 0.667 10.4645 0.667 11.083V12.25M13.333 12.25V11.083C13.3326 10.5731 13.1571 10.0785 12.8345 9.68123C12.5119 9.28398 12.0613 9.00785 11.558 8.90083M9.225 1.81749C9.73005 1.92336 10.1825 2.19952 10.5065 2.59769C10.8305 2.99586 11.0067 3.4919 11.0067 4.00332C11.0067 4.51475 10.8305 5.01079 10.5065 5.40896C10.1825 5.80713 9.73005 6.08329 9.225 6.18916M7.667 4C7.667 5.28866 6.6223 6.33333 5.33364 6.33333C4.04498 6.33333 3.00031 5.28866 3.00031 4C3.00031 2.71134 4.04498 1.66667 5.33364 1.66667C6.6223 1.66667 7.667 2.71134 7.667 4Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const NodesIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="3" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="11" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="7" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M4.2 3.9L6.1 9.5M9.8 3.9L7.9 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const ArrowRightIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.333 8H12.667M12.667 8L8 3.333M12.667 8L8 12.667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.5 3V7.5H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.5 15V10.5H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.715 6.75C14.31 5.633 13.589 4.659 12.64 3.946C11.692 3.233 10.559 2.811 9.376 2.731C8.193 2.652 7.013 2.919 5.976 3.5C4.94 4.081 4.093 4.95 3.538 6M3.285 11.25C3.69 12.367 4.411 13.341 5.36 14.054C6.308 14.767 7.442 15.189 8.624 15.269C9.807 15.348 10.987 15.081 12.024 14.5C13.06 13.919 13.907 13.05 14.462 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────

/** interaction_id 생성 */
const generateInteractionId = (prefix = 'chat'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
};

/** 현재 채팅 데이터 저장 */
const saveCurrentChatData = (data: {
  workflowId: string;
  workflowName: string;
  interactionId: string;
  userId?: number;
}): boolean => {
  try {
    const chatData = {
      workflowId: data.workflowId,
      workflowName: data.workflowName,
      interactionId: data.interactionId,
      userId: data.userId,
      startedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY_CURRENT_CHAT, JSON.stringify(chatData));
    return true;
  } catch (error) {
    console.error('Failed to save current chat data:', error);
    return false;
  }
};

/** 즐겨찾기 목록 가져오기 */
const getFavorites = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_FAVORITES);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/** 즐겨찾기 토글 */
const toggleFavorite = (workflowId: string): string[] => {
  const favorites = getFavorites();
  const index = favorites.indexOf(workflowId);
  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(workflowId);
  }
  localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favorites));
  return favorites;
};

// ─────────────────────────────────────────────────────────────
// Workflow Card Component
// ─────────────────────────────────────────────────────────────

interface WorkflowCardProps {
  workflow: WorkflowOption;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({
  workflow,
  isFavorite,
  onSelect,
  onToggleFavorite,
}) => {
  const { t } = useTranslation();
  const isActive = workflow.status === 'active';

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite();
  };

  return (
    <article
      className={`${styles.workflowCard} ${!isActive ? styles.draft : ''}`}
      onClick={isActive ? onSelect : undefined}
      role="button"
      tabIndex={isActive ? 0 : -1}
      aria-label={workflow.name}
    >
      <div className={styles.cardHeader}>
        <div className={styles.cardIcon}>
          <WorkflowIcon />
        </div>
        <button
          className={`${styles.favoriteButton} ${isFavorite ? styles.active : ''}`}
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? t('chatNew.removeFavorite') : t('chatNew.addFavorite')}
        >
          <StarIcon filled={isFavorite} />
        </button>
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{workflow.name}</h3>
        {workflow.description && (
          <p className={styles.cardDescription}>{workflow.description}</p>
        )}
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.cardMeta}>
          {workflow.isShared ? (
            <span className={styles.metaItem} title={t('chatNew.shared')}>
              <UsersIcon />
              {workflow.username || t('chatNew.shared')}
            </span>
          ) : (
            <span className={styles.metaItem} title={t('chatNew.personal')}>
              <UserIcon />
              {t('chatNew.personal')}
            </span>
          )}
          {workflow.nodeCount !== undefined && (
            <span className={styles.metaItem}>
              <NodesIcon />
              {workflow.nodeCount}
            </span>
          )}
        </div>

        <span className={`${styles.statusBadge} ${styles[workflow.status]}`}>
          {t(`chatNew.status.${workflow.status}`)}
        </span>
      </div>

      {isActive && (
        <div className={styles.cardOverlay}>
          <button className={styles.startButton}>
            <PlayIcon />
            <span>{t('chatNew.startChat')}</span>
            <ArrowRightIcon />
          </button>
        </div>
      )}
    </article>
  );
};

// ─────────────────────────────────────────────────────────────
// Chat New Page Component
// ─────────────────────────────────────────────────────────────

const ChatNewPage: React.FC<RouteComponentProps & ChatNewPageProps> = ({
  onNavigate,
  onSelectWorkflow,
}) => {
  const { t } = useTranslation();
  const api = createApiClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workflows, setWorkflows] = useState<WorkflowOption[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkflowFilter>('active');
  const [ownerFilter, setOwnerFilter] = useState<WorkflowOwnerFilter>('all');

  // ─────────────────────────────────────────────────────────────
  // API 호출
  // ─────────────────────────────────────────────────────────────

  const loadWorkflows = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.get<WorkflowDetailFromAPI[]>('/api/workflow/detail/list');
      const workflowList = result?.data || [];

      // API 응답을 WorkflowOption 형태로 변환
      const transformed: WorkflowOption[] = workflowList
        .filter((detail) => detail.is_accepted !== false)
        .map((detail) => {
          // 상태 결정
          let status: 'active' | 'draft' | 'archived' = 'active';
          if (!detail.has_startnode || !detail.has_endnode || detail.node_count < 3) {
            status = 'draft';
          }

          return {
            id: detail.workflow_id,
            name: detail.workflow_name.replace('.json', '') || detail.workflow_id,
            description: detail.metadata?.description as string | undefined,
            status,
            nodeCount: detail.node_count,
            isShared: detail.is_shared,
            userId: detail.user_id,
            username: detail.username || detail.full_name,
            lastModified: detail.updated_at,
          };
        });

      setWorkflows(transformed);
      setFavorites(getFavorites());
    } catch (err) {
      console.error('Failed to load workflows:', err);
      setError(t('chatNew.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [api, t]);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  // ─────────────────────────────────────────────────────────────
  // 필터링
  // ─────────────────────────────────────────────────────────────

  const filteredWorkflows = useMemo(() => {
    return workflows.filter((workflow) => {
      // 검색 필터
      if (search) {
        const searchLower = search.toLowerCase();
        const matchName = workflow.name.toLowerCase().includes(searchLower);
        const matchDesc = workflow.description?.toLowerCase().includes(searchLower);
        if (!matchName && !matchDesc) return false;
      }

      // 상태 필터
      if (statusFilter !== 'all' && workflow.status !== statusFilter) {
        return false;
      }

      // 소유자 필터
      if (ownerFilter === 'personal' && workflow.isShared) {
        return false;
      }
      if (ownerFilter === 'shared' && !workflow.isShared) {
        return false;
      }

      return true;
    });
  }, [workflows, search, statusFilter, ownerFilter]);

  // 즐겨찾기 워크플로우
  const favoriteWorkflows = useMemo(() => {
    return filteredWorkflows.filter((w) => favorites.includes(w.id));
  }, [filteredWorkflows, favorites]);

  // 일반 워크플로우 (즐겨찾기 제외)
  const regularWorkflows = useMemo(() => {
    return filteredWorkflows.filter((w) => !favorites.includes(w.id));
  }, [filteredWorkflows, favorites]);

  // 카운트 계산
  const counts = {
    all: workflows.length,
    active: workflows.filter((w) => w.status === 'active').length,
    draft: workflows.filter((w) => w.status === 'draft').length,
  };

  const statusTabs = [
    { key: 'all', label: t('chatNew.filter.all'), count: counts.all },
    { key: 'active', label: t('chatNew.filter.active'), count: counts.active },
    { key: 'draft', label: t('chatNew.filter.draft'), count: counts.draft },
  ];

  const ownerTabs = [
    { key: 'all', label: t('chatNew.owner.all') },
    { key: 'personal', label: t('chatNew.owner.personal') },
    { key: 'shared', label: t('chatNew.owner.shared') },
  ];

  // ─────────────────────────────────────────────────────────────
  // Event Handlers
  // ─────────────────────────────────────────────────────────────

  const handleSelectWorkflow = (workflow: WorkflowOption) => {
    if (workflow.status !== 'active') {
      alert(t('chatNew.error.draftWorkflow'));
      return;
    }

    // 새 interaction_id 생성
    const interactionId = generateInteractionId();

    // 현재 채팅 데이터 저장
    const saved = saveCurrentChatData({
      workflowId: workflow.id,
      workflowName: workflow.name,
      interactionId,
      userId: workflow.userId,
    });

    if (!saved) {
      alert(t('chatNew.error.saveFailed'));
      return;
    }

    // 콜백 호출
    onSelectWorkflow?.({
      workflowId: workflow.id,
      workflowName: workflow.name,
      userId: workflow.userId,
    });

    // 현재 채팅 페이지로 이동
    onNavigate?.('current-chat');
  };

  const handleToggleFavorite = (workflowId: string) => {
    const newFavorites = toggleFavorite(workflowId);
    setFavorites(newFavorites);
  };

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <ContentArea
      title={t('chatNew.title')}
      headerActions={
        <button
          onClick={loadWorkflows}
          className={`${styles.refreshButton} ${loading ? styles.loading : ''}`}
          disabled={loading}
          aria-label={t('common.refresh')}
        >
          <RefreshIcon />
        </button>
      }
    >
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h1 className={styles.title}>{t('chatNew.header.title')}</h1>
            <p className={styles.subtitle}>{t('chatNew.header.subtitle')}</p>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterRow}>
            <FilterTabs
              tabs={statusTabs}
              activeKey={statusFilter}
              onChange={(key) => setStatusFilter(key as WorkflowFilter)}
              variant="pills"
            />
            <div className={styles.ownerFilters}>
              {ownerTabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`${styles.ownerButton} ${ownerFilter === tab.key ? styles.active : ''}`}
                  onClick={() => setOwnerFilter(tab.key as WorkflowOwnerFilter)}
                >
                  {tab.key === 'personal' && <UserIcon />}
                  {tab.key === 'shared' && <UsersIcon />}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('chatNew.searchPlaceholder')}
            size="md"
          />
        </div>

        {/* Error State */}
        {error && (
          <div className={styles.errorBanner}>
            <span>{error}</span>
            <button onClick={loadWorkflows}>{t('common.retry')}</button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>{t('common.loading')}</p>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <EmptyState
            icon={<WorkflowIcon />}
            title={t('chatNew.empty.title')}
            description={t('chatNew.empty.description')}
          />
        ) : (
          <div className={styles.content}>
            {/* Favorites Section */}
            {favoriteWorkflows.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  <StarIcon filled />
                  {t('chatNew.sections.favorites')}
                  <span className={styles.sectionCount}>{favoriteWorkflows.length}</span>
                </h2>
                <div className={styles.workflowGrid}>
                  {favoriteWorkflows.map((workflow) => (
                    <WorkflowCard
                      key={workflow.id}
                      workflow={workflow}
                      isFavorite={true}
                      onSelect={() => handleSelectWorkflow(workflow)}
                      onToggleFavorite={() => handleToggleFavorite(workflow.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* All Workflows Section */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <WorkflowIcon />
                {t('chatNew.sections.all')}
                <span className={styles.sectionCount}>{regularWorkflows.length}</span>
              </h2>
              <div className={styles.workflowGrid}>
                {regularWorkflows.map((workflow) => (
                  <WorkflowCard
                    key={workflow.id}
                    workflow={workflow}
                    isFavorite={false}
                    onSelect={() => handleSelectWorkflow(workflow)}
                    onToggleFavorite={() => handleToggleFavorite(workflow.id)}
                  />
                ))}
              </div>
            </section>
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
export type { WorkflowOption } from '@xgen/types';
