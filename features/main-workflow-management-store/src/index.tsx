'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { WorkflowStoreItem, CardBadge, WorkflowTabPlugin, WorkflowTabPluginProps } from '@xgen/types';
import { Button, ResourceCardGrid, EmptyState, FilterTabs } from '@xgen/ui';
import { FiFolder, FiDownload, FiSearch, FiRefreshCw, FiUpload, FiStar, FiUser, FiCalendar, FiBox } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import { listWorkflowStore, downloadWorkflowTemplate } from './api';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type StoreFilterMode = 'all' | 'my' | 'template' | 'shared';

export interface WorkflowStoreProps extends WorkflowTabPluginProps {
  onStorageRefresh?: () => void | Promise<void>;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function calculateAverageRating(workflow: WorkflowStoreItem): number {
  if (!workflow.ratingCount || workflow.ratingCount === 0) return 0;
  return (workflow.ratingSum ?? 0) / workflow.ratingCount;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const WorkflowStore: React.FC<WorkflowStoreProps> = ({ onStorageRefresh }) => {
  const { t } = useTranslation();
  const { user, isInitialized } = useAuth();

  // State
  const [workflows, setWorkflows] = useState<WorkflowStoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<StoreFilterMode>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Load workflows
  const fetchWorkflows = useCallback(async () => {
    if (!isInitialized) return;

    try {
      setLoading(true);
      setError(null);
      const data = await listWorkflowStore();
      setWorkflows(data);
    } catch (err) {
      console.error('Failed to fetch workflow store:', err);
      setError(t('workflows.store.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [isInitialized, t]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  // Filter workflows
  const filteredWorkflows = useMemo(() => {
    return workflows.filter((workflow) => {
      const matchesSearch =
        !searchTerm ||
        workflow.workflowName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workflow.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workflow.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesFilter = true;
      if (filterMode === 'my') {
        matchesFilter = !!(user && Number(workflow.userId) === Number(user.id));
      } else if (filterMode === 'template') {
        matchesFilter = workflow.isTemplate === true;
      } else if (filterMode === 'shared') {
        matchesFilter =
          workflow.isTemplate === false && (!user || Number(workflow.userId) !== Number(user.id));
      }

      return matchesSearch && matchesFilter;
    });
  }, [workflows, searchTerm, filterMode, user]);

  // Handlers
  const handleDownload = useCallback(
    async (workflow: WorkflowStoreItem) => {
      try {
        await downloadWorkflowTemplate(
          workflow.workflowId,
          workflow.userId,
          workflow.currentVersion
        );
        if (onStorageRefresh) {
          await onStorageRefresh();
        }
      } catch (err) {
        console.error('Failed to download workflow:', err);
      }
    },
    [onStorageRefresh]
  );

  const handleUploadClick = useCallback(() => {
    setIsUploadModalOpen(true);
  }, []);

  // Build card items
  const cardItems = useMemo(() => {
    return filteredWorkflows.map((workflow) => {
      const avgRating = calculateAverageRating(workflow);
      const badges: CardBadge[] = [
        { text: `v${workflow.currentVersion}`, variant: 'secondary' },
      ];

      if (workflow.isTemplate) {
        badges.push({ text: t('workflows.badges.template'), variant: 'purple' });
      }

      if (user && Number(workflow.userId) === Number(user.id)) {
        badges.push({ text: t('workflows.badges.my'), variant: 'primary' });
      }

      return {
        id: workflow.id.toString(),
        data: workflow,
        title: workflow.workflowName,
        description: workflow.description || t('workflows.store.card.noDescription'),
        thumbnail: {
          icon: <FiBox />,
          backgroundColor: 'rgba(120, 60, 237, 0.1)',
          iconColor: '#783ced',
        },
        badges,
        metadata: [
          { icon: <FiUser />, value: workflow.username || 'Unknown' },
          { icon: <FiCalendar />, value: formatDate(workflow.createdAt) },
          { icon: <FiStar />, value: avgRating > 0 ? `${avgRating.toFixed(1)} (${workflow.ratingCount})` : t('workflows.store.card.noRating') },
          { value: t('workflows.card.nodes', { count: workflow.nodeCount }) },
        ],
        primaryActions: [
          {
            id: 'download',
            icon: <FiDownload />,
            label: t('workflows.store.actions.download'),
            onClick: () => handleDownload(workflow),
          },
        ],
        dropdownActions: [],
        onClick: () => {},
      };
    });
  }, [filteredWorkflows, user, handleDownload, t]);

  // Filter tabs
  const filterTabs = [
    { key: 'all', label: t('workflows.store.filter.all') },
    { key: 'my', label: t('workflows.store.filter.my') },
    { key: 'template', label: t('workflows.store.filter.template') },
    { key: 'shared', label: t('workflows.store.filter.shared') },
  ];

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-1 min-w-[200px] max-w-[400px]">
          <div className="relative w-full">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-[18px] h-[18px] pointer-events-none" />
            <input
              type="text"
              placeholder={t('workflows.store.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2.5 pl-10 pr-4 border border-border rounded-lg text-sm outline-none transition-colors duration-150 focus:border-primary placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <FilterTabs
            tabs={filterTabs}
            activeKey={filterMode}
            onChange={(key) => setFilterMode(key as StoreFilterMode)}
            variant="underline"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            title={t('workflows.store.upload')}
          >
            <FiUpload />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchWorkflows}
            disabled={loading}
            title={t('workflows.store.refresh')}
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {!isInitialized ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
            <p>{t('workflows.store.loading')}</p>
          </div>
        ) : error ? (
          <EmptyState
            icon={<FiFolder />}
            title={t('workflows.store.error.title')}
            description={error}
            action={{
              label: t('workflows.store.buttons.retry'),
              onClick: fetchWorkflows,
            }}
          />
        ) : (
          <ResourceCardGrid
            items={cardItems}
            loading={loading}
            showEmptyState
            emptyStateProps={{
              icon: <FiFolder />,
              title: t('workflows.store.empty.title'),
              description: searchTerm
                ? t('workflows.store.empty.searchDescription', { term: searchTerm })
                : t('workflows.store.empty.description'),
              action: {
                label: t('workflows.store.empty.action'),
                onClick: handleUploadClick,
              },
            }}
          />
        )}
      </div>

      {/* TODO: Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={() => setIsUploadModalOpen(false)}>
          <div className="bg-white rounded-xl p-8 max-w-[500px] w-[90%] text-center [&_h3]:m-0 [&_h3]:mb-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_p]:m-0 [&_p]:mb-6 [&_p]:text-sm [&_p]:text-muted-foreground" onClick={(e) => e.stopPropagation()}>
            <h3>{t('workflows.store.uploadModal.title')}</h3>
            <p>{t('workflows.store.uploadModal.description')}</p>
            <Button variant="primary" onClick={() => setIsUploadModalOpen(false)}>
              {t('common.close')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowStore;

export const workflowStorePlugin: WorkflowTabPlugin = {
  id: 'store',
  name: 'Workflow Store',
  tabLabelKey: 'workflows.tabs.store',
  order: 2,
  component: WorkflowStore,
};
