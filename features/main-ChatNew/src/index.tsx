'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { RouteComponentProps, MainFeatureModule, WorkflowOption } from '@xgen/types';
import { SearchInput, EmptyState, FilterTabs } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import './locales';
import { listWorkflowsDetail } from '@xgen/api-client';
import type { WorkflowListItem } from '@xgen/api-client';

import type { ChatNewPageProps, WorkflowOwnerFilter } from './types';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY_CURRENT_CHAT = 'xgen_current_chat';
const STORAGE_KEY_FAVORITES = 'xgen_workflow_favorites';

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const WorkflowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2.5" y="2.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="11.5" y="2.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="2.5" y="11.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="11.5" y="11.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8.5 5.5H11.5M14.5 8.5V11.5M8.5 14.5H11.5M5.5 8.5V11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const StarIcon: React.FC<{ filled?: boolean; className?: string }> = ({ filled, className }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 16 16" fill={filled ? 'currentColor' : 'none'} xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1L10.163 5.279L15 5.919L11.5 9.321L12.326 14L8 11.779L3.674 14L4.5 9.321L1 5.919L5.837 5.279L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UserIcon: React.FC = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.667 12.25V11.083C11.667 10.4645 11.4214 9.87141 10.9838 9.43382C10.5462 8.99624 9.95311 8.75 9.33467 8.75H4.66801C4.04956 8.75 3.45647 8.99624 3.01889 9.43382C2.58131 9.87141 2.33301 10.4645 2.33301 11.083V12.25M9.33301 4.08333C9.33301 5.37196 8.28831 6.41667 6.99967 6.41667C5.71101 6.41667 4.66634 5.37196 4.66634 4.08333C4.66634 2.79467 5.71101 1.75 6.99967 1.75C8.28831 1.75 9.33301 2.79467 9.33301 4.08333Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UsersIcon: React.FC = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 12.25V11.083C10 10.4645 9.7544 9.87141 9.31682 9.43382C8.87924 8.99624 8.28616 8.75 7.66772 8.75H3C2.38156 8.75 1.78847 8.99624 1.35089 9.43382C0.91331 9.87141 0.667 10.4645 0.667 11.083V12.25M13.333 12.25V11.083C13.3326 10.5731 13.1571 10.0785 12.8345 9.68123C12.5119 9.28398 12.0613 9.00785 11.558 8.90083M9.225 1.81749C9.73005 1.92336 10.1825 2.19952 10.5065 2.59769C10.8305 2.99586 11.0067 3.4919 11.0067 4.00332C11.0067 4.51475 10.8305 5.01079 10.5065 5.40896C10.1825 5.80713 9.73005 6.08329 9.225 6.18916M7.667 4C7.667 5.28866 6.6223 6.33333 5.33364 6.33333C4.04498 6.33333 3.00031 5.28866 3.00031 4C3.00031 2.71134 4.04498 1.66667 5.33364 1.66667C6.6223 1.66667 7.667 2.71134 7.667 4Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const NodesIcon: React.FC = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="3" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="11" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="7" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M4.2 3.9L6.1 9.5M9.8 3.9L7.9 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const ArrowRightIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
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

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite();
  };

  return (
    <article
      className="group flex flex-col p-4 bg-white border border-border rounded-lg cursor-pointer transition-all duration-150 hover:border-primary/40 hover:shadow-sm"
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      aria-label={workflow.name}
    >
      {/* Top row: Icon + Name + Favorite */}
      <div className="flex items-start gap-3 mb-2">
        <div className="flex items-center justify-center w-9 h-9 bg-primary/8 rounded-lg text-primary shrink-0">
          <WorkflowIcon />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="m-0 text-sm font-semibold text-foreground truncate">{workflow.name}</h3>
          {workflow.description && (
            <p className="m-0 mt-0.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">{workflow.description}</p>
          )}
        </div>
        <button
          className={`flex items-center justify-center w-7 h-7 p-0 bg-transparent border-none rounded-md cursor-pointer transition-colors shrink-0 ${isFavorite ? 'text-yellow-500' : 'text-muted-foreground/30 hover:text-yellow-400'}`}
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? t('chatNew.removeFavorite') : t('chatNew.addFavorite')}
        >
          <StarIcon filled={isFavorite} />
        </button>
      </div>

      {/* Footer: Meta info + Action hint */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
        <div className="flex items-center gap-3">
          {workflow.isShared ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <UsersIcon />
              {workflow.username || t('chatNew.shared')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <UserIcon />
              {t('chatNew.personal')}
            </span>
          )}
          {workflow.nodeCount !== undefined && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <NodesIcon />
              {workflow.nodeCount}
            </span>
          )}
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          {t('chatNew.startChat')}
          <ArrowRightIcon />
        </span>
      </div>
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workflows, setWorkflows] = useState<WorkflowOption[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<WorkflowOwnerFilter>('all');

  // ─────────────────────────────────────────────────────────────
  // API
  // ─────────────────────────────────────────────────────────────

  const loadWorkflows = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const workflowList = await listWorkflowsDetail();

      const transformed: WorkflowOption[] = workflowList
        .filter((detail: WorkflowListItem) => detail.is_accepted !== false)
        .map((detail: WorkflowListItem) => ({
          id: detail.workflow_id,
          name: detail.workflow_name.replace('.json', '') || detail.workflow_id,
          description: detail.metadata?.description as string | undefined,
          status: 'active' as const,
          nodeCount: detail.node_count,
          isShared: detail.is_shared,
          userId: detail.user_id,
          username: detail.username || detail.full_name,
          lastModified: detail.updated_at,
        }));

      setWorkflows(transformed);
      setFavorites(getFavorites());
    } catch (err) {
      console.error('Failed to load workflows:', err);
      setError(t('chatNew.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  // ─────────────────────────────────────────────────────────────
  // Filtering
  // ─────────────────────────────────────────────────────────────

  const filteredWorkflows = useMemo(() => {
    return workflows.filter((workflow) => {
      if (search) {
        const searchLower = search.toLowerCase();
        const matchName = workflow.name.toLowerCase().includes(searchLower);
        const matchDesc = workflow.description?.toLowerCase().includes(searchLower);
        if (!matchName && !matchDesc) return false;
      }

      if (ownerFilter === 'personal' && workflow.isShared) return false;
      if (ownerFilter === 'shared' && !workflow.isShared) return false;

      return true;
    });
  }, [workflows, search, ownerFilter]);

  const favoriteWorkflows = useMemo(() => {
    return filteredWorkflows.filter((w) => favorites.includes(w.id));
  }, [filteredWorkflows, favorites]);

  const regularWorkflows = useMemo(() => {
    return filteredWorkflows.filter((w) => !favorites.includes(w.id));
  }, [filteredWorkflows, favorites]);

  const ownerCounts = useMemo(() => ({
    all: workflows.length,
    personal: workflows.filter((w) => !w.isShared).length,
    shared: workflows.filter((w) => w.isShared).length,
  }), [workflows]);

  const ownerTabs = [
    { key: 'all', label: t('chatNew.owner.all'), count: ownerCounts.all },
    { key: 'personal', label: t('chatNew.owner.personal'), count: ownerCounts.personal },
    { key: 'shared', label: t('chatNew.owner.shared'), count: ownerCounts.shared },
  ];

  // ─────────────────────────────────────────────────────────────
  // Event Handlers
  // ─────────────────────────────────────────────────────────────

  const handleSelectWorkflow = (workflow: WorkflowOption) => {
    const interactionId = generateInteractionId();

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

    onSelectWorkflow?.({
      workflowId: workflow.id,
      workflowName: workflow.name,
      userId: workflow.userId,
    });

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
    <div className="flex flex-col h-screen overflow-hidden bg-[#f8f9fa]">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-border shrink-0">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-bold text-foreground m-0">{t('chatNew.title')}</h1>
        </div>
        <button
          onClick={loadWorkflows}
          className={`inline-flex items-center justify-center w-9 h-9 border border-border rounded-lg bg-white text-muted-foreground cursor-pointer transition-all hover:border-primary hover:text-primary hover:bg-primary/5 disabled:opacity-60 disabled:cursor-not-allowed ${loading ? '[&_svg]:animate-spin' : ''}`}
          disabled={loading}
          aria-label={t('common.refresh')}
        >
          <RefreshIcon />
        </button>
      </header>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="flex flex-col gap-5 p-6">
        {/* Toolbar: Filter + Search */}
        <div className="flex items-center justify-between gap-4">
          <FilterTabs
            tabs={ownerTabs}
            activeKey={ownerFilter}
            onChange={(key) => setOwnerFilter(key as WorkflowOwnerFilter)}
            variant="underline"
          />
          <div className="w-72">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('chatNew.searchPlaceholder')}
              size="sm"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            <span>{error}</span>
            <button
              onClick={loadWorkflows}
              className="px-3 py-1 text-xs font-medium text-red-600 bg-white border border-red-300 rounded-md cursor-pointer transition-colors hover:bg-red-600 hover:text-white hover:border-red-600"
            >
              {t('common.retry')}
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
            <div className="w-8 h-8 border-[3px] border-border border-t-primary rounded-full animate-spin" />
            <p className="m-0 text-sm">{t('common.loading')}</p>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <EmptyState
            icon={<WorkflowIcon />}
            title={t('chatNew.empty.title')}
            description={t('chatNew.empty.description')}
          />
        ) : (
          <div className="flex flex-col gap-6">
            {/* Favorites */}
            {favoriteWorkflows.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="flex items-center gap-2 m-0 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <StarIcon filled className="text-yellow-500" />
                  {t('chatNew.sections.favorites')}
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold text-muted-foreground bg-muted rounded-full">{favoriteWorkflows.length}</span>
                </h2>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
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

            {/* All Workflows */}
            <section className="flex flex-col gap-3">
              {favoriteWorkflows.length > 0 && (
                <h2 className="flex items-center gap-2 m-0 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {t('chatNew.sections.all')}
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold text-muted-foreground bg-muted rounded-full">{regularWorkflows.length}</span>
                </h2>
              )}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
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
      </div>
    </div>
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
