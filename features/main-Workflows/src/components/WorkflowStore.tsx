'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { WorkflowStoreItem, CardBadge } from '@xgen/types';
import { Button, ResourceCardGrid, EmptyState } from '@xgen/ui';
import { FiFolder, FiDownload, FiSearch, FiRefreshCw, FiUpload, FiStar, FiUser, FiCalendar, FiBox } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import { listWorkflowStore, downloadWorkflowTemplate, uploadWorkflowToStore } from '../api';
import styles from '../styles/workflow-store.module.scss';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type StoreFilterMode = 'all' | 'my' | 'template' | 'shared';

interface WorkflowStoreProps {
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
      setError(t('workflowStore.error.loadFailed'));
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
      // Search filter
      const matchesSearch =
        !searchTerm ||
        workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workflow.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workflow.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      // Mode filter
      let matchesFilter = true;
      if (filterMode === 'my') {
        matchesFilter = !!(user && workflow.userId === user.id);
      } else if (filterMode === 'template') {
        matchesFilter = workflow.isTemplate === true;
      } else if (filterMode === 'shared') {
        matchesFilter =
          workflow.isTemplate === false && (!user || workflow.userId !== user.id);
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
        // Trigger storage refresh if provided
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
        badges.push({ text: 'TEMPLATE', variant: 'purple' });
      }

      if (user && workflow.userId === user.id) {
        badges.push({ text: 'MY', variant: 'primary' });
      }

      return {
        id: workflow.id.toString(),
        data: workflow,
        title: workflow.name,
        description: workflow.description || t('workflowStore.card.noDescription'),
        thumbnail: {
          icon: <FiBox />,
          backgroundColor: 'rgba(120, 60, 237, 0.1)',
          iconColor: '#783ced',
        },
        badges,
        metadata: [
          { icon: <FiUser />, value: workflow.username || 'Unknown' },
          { icon: <FiCalendar />, value: formatDate(workflow.createdAt) },
          { icon: <FiStar />, value: avgRating > 0 ? `${avgRating.toFixed(1)} (${workflow.ratingCount})` : t('workflowStore.card.noRating') },
          { value: `${workflow.nodeCount} nodes` },
        ],
        primaryActions: [
          {
            id: 'download',
            icon: <FiDownload />,
            label: t('workflowStore.actions.download'),
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
    { key: 'all', label: t('workflowStore.filter.all') },
    { key: 'my', label: t('workflowStore.filter.my') },
    { key: 'template', label: t('workflowStore.filter.template') },
    { key: 'shared', label: t('workflowStore.filter.shared') },
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.searchContainer}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder={t('workflowStore.search.placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.filterTabs}>
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                className={`${styles.filterTab} ${filterMode === tab.key ? styles.active : ''}`}
                onClick={() => setFilterMode(tab.key as StoreFilterMode)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            title={t('workflowStore.upload')}
          >
            <FiUpload />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchWorkflows}
            disabled={loading}
            title={t('workflowStore.refresh')}
          >
            <FiRefreshCw className={loading ? styles.spinning : ''} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {!isInitialized ? (
          <div className={styles.loadingState}>
            <p>{t('workflowStore.loading')}</p>
          </div>
        ) : error ? (
          <EmptyState
            icon={<FiFolder />}
            title={t('workflowStore.error.title')}
            description={error}
            action={{
              label: t('workflowStore.buttons.retry'),
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
              title: t('workflowStore.empty.title'),
              description: searchTerm
                ? t('workflowStore.empty.searchDescription', { term: searchTerm })
                : t('workflowStore.empty.description'),
              action: {
                label: t('workflowStore.empty.action'),
                onClick: handleUploadClick,
              },
            }}
          />
        )}
      </div>

      {/* TODO: Upload Modal */}
      {isUploadModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsUploadModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>{t('workflowStore.upload.title')}</h3>
            <p>{t('workflowStore.upload.description')}</p>
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
