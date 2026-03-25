'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { RouteComponentProps, MainFeatureModule, WorkflowDetail, CardBadge } from '@xgen/types';
import { ContentArea, FilterTabs, Button, EmptyState, ResourceCard, ResourceCardGrid } from '@xgen/ui';
import { FiFolder, FiPlay, FiEdit2, FiCopy, FiTrash2, FiSettings, FiFileText, FiServer, FiGitBranch, FiMoreVertical, FiUser, FiClock, FiCheckSquare, FiRefreshCw, FiPlus } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import './locales';
import { useAuth } from '@xgen/auth-provider';
import { listWorkflowsDetail, deleteWorkflow, duplicateWorkflow, getWorkflowIOLogs } from './api';
import { WorkflowStore } from './components/WorkflowStore';
import { WorkflowScheduler } from './components/WorkflowScheduler';
import { WorkflowTester } from './components/WorkflowTester';
import styles from './styles/workflows.module.scss';
import type { WorkflowStatusFilter, WorkflowOwnerFilter, WorkflowTab, WorkflowFilter, WorkflowItem } from './types';

// ─────────────────────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────────────────────

const STATUS_BADGE_MAP: Record<string, { text: string; variant: CardBadge['variant'] }> = {
  active: { text: 'LIVE', variant: 'success' },
  draft: { text: 'DRAFT', variant: 'warning' },
  archived: { text: 'ARCHIVED', variant: 'secondary' },
  unactive: { text: 'DISABLED', variant: 'error' },
};

const DEPLOY_BADGE_MAP: Record<string, { text: string; variant: CardBadge['variant'] }> = {
  deployed: { text: 'DEPLOYED', variant: 'purple' },
  pending: { text: 'PENDING', variant: 'warning' },
  not_deployed: { text: 'CLOSE', variant: 'error' },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\. /g, '. ');
}

// ─────────────────────────────────────────────────────────────
// WorkflowStorage Component
// ─────────────────────────────────────────────────────────────

interface WorkflowStorageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
  activeTab?: WorkflowTab;
  onTabChange?: (tab: WorkflowTab) => void;
}

const WorkflowStorage: React.FC<WorkflowStorageProps> = ({
  onNavigate,
  activeTab = 'storage',
  onTabChange,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isInitialized } = useAuth();

  // State
  const [workflows, setWorkflows] = useState<WorkflowDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<WorkflowStatusFilter>('all');
  const [ownerFilter, setOwnerFilter] = useState<WorkflowOwnerFilter>('all');
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deployStatus, setDeployStatus] = useState<Record<string, string>>({});

  // Load workflows
  const fetchWorkflows = useCallback(async () => {
    if (!isInitialized) return;

    try {
      setLoading(true);
      setError(null);
      const data = await listWorkflowsDetail();
      setWorkflows(data);

      // Set deploy status
      const statusMap: Record<string, string> = {};
      data.forEach((w) => {
        if (w.userId === user?.id) {
          if (w.inquireDeploy) {
            statusMap[w.name] = 'pending';
          } else if (w.isDeployed) {
            statusMap[w.name] = 'deployed';
          } else {
            statusMap[w.name] = 'not_deployed';
          }
        }
      });
      setDeployStatus(statusMap);
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
      setError(t('workflows.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [isInitialized, user?.id, t]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  // Check if user owns workflow
  const isOwner = useCallback(
    (userId?: number): boolean => {
      if (!isInitialized || !user) return false;
      if (userId === undefined || userId === null) return false;
      return Number(user.id) === Number(userId);
    },
    [isInitialized, user]
  );

  // Filter workflows
  const filteredWorkflows = useMemo(() => {
    return workflows.filter((w) => {
      // Status filter
      if (statusFilter === 'all') {
        // "all" excludes unactive
        if (w.status === 'unactive') return false;
      } else if (w.status !== statusFilter) {
        return false;
      }

      // Owner filter
      if (ownerFilter === 'personal' && w.isShared) return false;
      if (ownerFilter === 'shared' && !w.isShared) return false;

      return true;
    });
  }, [workflows, statusFilter, ownerFilter]);

  // Handlers
  const handleExecute = useCallback(
    (workflow: WorkflowDetail) => {
      router.push(
        `/main?view=new-chat&workflowName=${encodeURIComponent(workflow.name)}&workflowId=${encodeURIComponent(workflow.id)}&user_id=${workflow.userId}`
      );
    },
    [router]
  );

  const handleEdit = useCallback(
    (workflow: WorkflowDetail) => {
      localStorage.setItem(
        'canvas-previous-page',
        JSON.stringify({ path: '/main?view=workflows', timestamp: Date.now() })
      );
      router.push(`/canvas?load=${encodeURIComponent(workflow.id)}&user_id=${workflow.userId}`);
    },
    [router]
  );

  const handleDuplicate = useCallback(
    async (workflow: WorkflowDetail) => {
      if (!workflow.userId) return;
      try {
        await duplicateWorkflow(workflow.id, workflow.userId);
        await fetchWorkflows();
      } catch (err) {
        console.error('Failed to duplicate workflow:', err);
      }
    },
    [fetchWorkflows]
  );

  const handleDelete = useCallback(
    async (workflow: WorkflowDetail) => {
      if (!confirm(t('workflows.confirm.delete', { name: workflow.name }))) return;
      try {
        await deleteWorkflow(workflow.id);
        await fetchWorkflows();
      } catch (err) {
        console.error('Failed to delete workflow:', err);
      }
    },
    [fetchWorkflows, t]
  );

  const handleToggleMultiSelect = useCallback(() => {
    setIsMultiSelectMode((prev) => {
      if (prev) setSelectedIds([]);
      return !prev;
    });
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;

    const toDelete = workflows.filter(
      (w) => selectedIds.includes(w.id) && isOwner(w.userId)
    );

    if (toDelete.length === 0) {
      alert(t('workflows.error.noDeletePermission'));
      return;
    }

    if (!confirm(t('workflows.confirm.bulkDelete', { count: toDelete.length }))) return;

    try {
      for (const w of toDelete) {
        await deleteWorkflow(w.id);
      }
      setSelectedIds([]);
      setIsMultiSelectMode(false);
      await fetchWorkflows();
    } catch (err) {
      console.error('Failed to bulk delete:', err);
    }
  }, [selectedIds, workflows, isOwner, fetchWorkflows, t]);

  const handleCreateNew = useCallback(() => {
    onNavigate?.('canvas-intro');
  }, [onNavigate]);

  // Tab filters
  const tabTabs = [
    { key: 'storage', label: t('workflows.tabs.storage') },
    { key: 'store', label: t('workflows.tabs.store') },
    { key: 'scheduler', label: t('workflows.tabs.scheduler') },
    { key: 'tester', label: t('workflows.tabs.tester') },
  ];

  const statusTabs = [
    { key: 'all', label: t('workflows.filter.all') },
    { key: 'active', label: t('workflows.filter.active') },
    { key: 'archived', label: t('workflows.filter.archived') },
    { key: 'unactive', label: t('workflows.filter.unactive') },
  ];

  const ownerTabs = [
    { key: 'all', label: t('workflows.filter.all') },
    { key: 'personal', label: t('workflows.filter.personal') },
    { key: 'shared', label: t('workflows.filter.shared') },
  ];

  // Build card items
  const cardItems = useMemo(() => {
    return filteredWorkflows.map((workflow) => {
      const badges: CardBadge[] = [];

      // Status badge
      const statusBadge = STATUS_BADGE_MAP[workflow.status];
      if (statusBadge) {
        badges.push(statusBadge);
      }

      // Owner badge
      badges.push({
        text: workflow.isShared ? 'SHARED' : 'MY',
        variant: workflow.isShared ? 'primary' : 'secondary',
      });

      // Deploy badge (only for owner)
      if (isOwner(workflow.userId)) {
        const deployKey = deployStatus[workflow.name] || 'not_deployed';
        const deployBadge = DEPLOY_BADGE_MAP[deployKey];
        if (deployBadge) {
          badges.push(deployBadge);
        }
      }

      // Primary actions
      const primaryActions = workflow.status !== 'unactive' ? [
        {
          id: 'execute',
          icon: <FiPlay />,
          label: t('workflows.actions.execute'),
          onClick: () => handleExecute(workflow),
        },
        {
          id: 'edit',
          icon: <FiEdit2 />,
          label: t('workflows.actions.edit'),
          onClick: () => handleEdit(workflow),
          disabled: !isOwner(workflow.userId) && workflow.sharePermissions !== 'read_write',
          disabledMessage: t('workflows.messages.readOnly'),
        },
        {
          id: 'copy',
          icon: <FiCopy />,
          label: t('workflows.actions.copy'),
          onClick: () => handleDuplicate(workflow),
        },
      ] : [];

      // Dropdown actions
      const dropdownActions = isOwner(workflow.userId)
        ? [
            { id: 'logs', icon: <FiFileText />, label: t('workflows.actions.logs'), onClick: () => {} },
            { id: 'settings', icon: <FiSettings />, label: t('workflows.actions.settings'), onClick: () => {} },
            { id: 'deploy-info', icon: <FiServer />, label: t('workflows.actions.deployInfo'), onClick: () => {} },
            { id: 'deploy-settings', icon: <FiSettings />, label: t('workflows.actions.deploySettings'), onClick: () => {} },
            { id: 'versions', icon: <FiGitBranch />, label: t('workflows.actions.versions'), onClick: () => {} },
            { id: 'delete', icon: <FiTrash2 />, label: t('workflows.actions.delete'), onClick: () => handleDelete(workflow), danger: true, dividerBefore: true },
          ]
        : [
            { id: 'logs', icon: <FiFileText />, label: t('workflows.actions.logs'), onClick: () => {} },
            { id: 'versions', icon: <FiGitBranch />, label: t('workflows.actions.versions'), onClick: () => {} },
          ];

      return {
        id: workflow.id,
        data: workflow,
        title: workflow.name,
        description: workflow.description,
        errorMessage: workflow.error,
        thumbnail: {
          icon: <FiFolder />,
          backgroundColor: 'rgba(48, 94, 235, 0.1)',
          iconColor: '#305eeb',
        },
        badges,
        metadata: [
          { icon: <FiUser />, value: workflow.author },
          ...(workflow.lastModified
            ? [{ icon: <FiClock />, value: formatDate(workflow.lastModified) }]
            : []),
          { value: `${workflow.nodeCount} nodes` },
          ...(workflow.shareGroup
            ? [{ value: `${t('workflows.card.organization')}: ${workflow.shareGroup}` }]
            : []),
        ],
        primaryActions,
        dropdownActions,
        inactive: workflow.status === 'unactive',
        inactiveMessage: t('workflows.messages.unactive'),
        onClick: () => {},
      };
    });
  }, [
    filteredWorkflows,
    isOwner,
    deployStatus,
    handleExecute,
    handleEdit,
    handleDuplicate,
    handleDelete,
    t,
  ]);

  // Render other tabs
  if (activeTab === 'store') {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <FilterTabs
            tabs={tabTabs}
            activeKey={activeTab}
            onChange={(key) => onTabChange?.(key as WorkflowTab)}
          />
        </div>
        <WorkflowStore onStorageRefresh={fetchWorkflows} />
      </div>
    );
  }

  if (activeTab === 'scheduler') {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <FilterTabs
            tabs={tabTabs}
            activeKey={activeTab}
            onChange={(key) => onTabChange?.(key as WorkflowTab)}
          />
        </div>
        <WorkflowScheduler />
      </div>
    );
  }

  if (activeTab === 'tester') {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <FilterTabs
            tabs={tabTabs}
            activeKey={activeTab}
            onChange={(key) => onTabChange?.(key as WorkflowTab)}
          />
        </div>
        <WorkflowTester />
      </div>
    );
  }

  // Storage tab (default)
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <FilterTabs
            tabs={tabTabs}
            activeKey={activeTab}
            onChange={(key) => onTabChange?.(key as WorkflowTab)}
          />
        </div>

        <div className={styles.headerRight}>
          <FilterTabs
            tabs={statusTabs}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as WorkflowStatusFilter)}
          />
          <FilterTabs
            tabs={ownerTabs}
            activeKey={ownerFilter}
            onChange={(key) => setOwnerFilter(key as WorkflowOwnerFilter)}
          />

          <Button
            variant={isMultiSelectMode ? 'primary' : 'outline'}
            size="sm"
            onClick={handleToggleMultiSelect}
            title={isMultiSelectMode ? t('workflows.buttons.multiSelectDisable') : t('workflows.buttons.multiSelectEnable')}
          >
            <FiCheckSquare />
          </Button>

          {isMultiSelectMode && selectedIds.length > 0 && (
            <Button variant="danger" size="sm" onClick={handleBulkDelete}>
              <FiTrash2 />
              {t('workflows.buttons.deleteSelected')}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchWorkflows}
            disabled={loading}
          >
            <FiRefreshCw className={loading ? styles.spinning : ''} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {!isInitialized ? (
          <div className={styles.loadingState}>
            <p>{t('workflows.messages.loadingAuth')}</p>
          </div>
        ) : error ? (
          <EmptyState
            icon={<FiFolder />}
            title={t('workflows.error.title')}
            description={error}
            action={{
              label: t('workflows.buttons.retry'),
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
              title: t('workflows.empty.title'),
              description: t('workflows.empty.description'),
              action: {
                label: t('workflows.empty.action'),
                onClick: handleCreateNew,
              },
            }}
            multiSelectMode={isMultiSelectMode}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// WorkflowsPage Wrapper
// ─────────────────────────────────────────────────────────────

interface WorkflowsPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const WorkflowsPage: React.FC<WorkflowsPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<WorkflowTab>('storage');

  return (
    <ContentArea
      title={t('workflows.title')}
      description={t('workflows.description')}
    >
      <WorkflowStorage
        onNavigate={onNavigate}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
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
    workflows: WorkflowsPage,
  },
};

export default mainWorkflowsFeature;

// Re-export for convenience
export { WorkflowStorage, WorkflowsPage };
export * from './types';
export * from './api';
