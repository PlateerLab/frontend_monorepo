'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { WorkflowDetail, CardBadge, WorkflowStatusFilter, WorkflowOwnerFilter, WorkflowTabPlugin, WorkflowTabPluginProps } from '@xgen/types';
import { Button, EmptyState, ResourceCardGrid } from '@xgen/ui';
import { FiFolder, FiPlay, FiEdit2, FiCopy, FiTrash2, FiSettings, FiFileText, FiServer, FiGitBranch, FiUser, FiClock, FiCheckSquare, FiRefreshCw, FiPlus } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import { listWorkflowsDetail, deleteWorkflow, duplicateWorkflow } from './api';
import styles from './styles/workflows.module.scss';

// ─────────────────────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────────────────────

const STATUS_BADGE_VARIANT: Record<string, CardBadge['variant']> = {
  active: 'success',
  draft: 'warning',
  archived: 'secondary',
  unactive: 'error',
};

const STATUS_BADGE_KEY: Record<string, string> = {
  active: 'workflows.badges.live',
  draft: 'workflows.badges.draft',
  archived: 'workflows.badges.archived',
  unactive: 'workflows.badges.disabled',
};

const DEPLOY_BADGE_VARIANT: Record<string, CardBadge['variant']> = {
  deployed: 'purple',
  pending: 'warning',
  not_deployed: 'error',
};

const DEPLOY_BADGE_KEY: Record<string, string> = {
  deployed: 'workflows.badges.deployed',
  pending: 'workflows.badges.pending',
  not_deployed: 'workflows.badges.close',
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

export interface WorkflowStorageProps extends WorkflowTabPluginProps {}

export const WorkflowStorage: React.FC<WorkflowStorageProps> = ({ onNavigate }) => {
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
      if (statusFilter === 'all') {
        if (w.status === 'unactive') return false;
      } else if (w.status !== statusFilter) {
        return false;
      }
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

  // Filter tabs
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

      const statusVariant = STATUS_BADGE_VARIANT[workflow.status];
      const statusKey = STATUS_BADGE_KEY[workflow.status];
      if (statusVariant && statusKey) {
        badges.push({ text: t(statusKey), variant: statusVariant });
      }

      badges.push({
        text: workflow.isShared ? t('workflows.badges.shared') : t('workflows.badges.my'),
        variant: workflow.isShared ? 'primary' : 'secondary',
      });

      if (isOwner(workflow.userId)) {
        const deployKey = deployStatus[workflow.name] || 'not_deployed';
        const deployVariant = DEPLOY_BADGE_VARIANT[deployKey];
        const deployI18nKey = DEPLOY_BADGE_KEY[deployKey];
        if (deployVariant && deployI18nKey) {
          badges.push({ text: t(deployI18nKey), variant: deployVariant });
        }
      }

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
          { value: t('workflows.card.nodes', { count: workflow.nodeCount }) },
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

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              className={`${styles.filterTab || ''} ${statusFilter === tab.key ? styles.active || '' : ''}`}
              onClick={() => setStatusFilter(tab.key as WorkflowStatusFilter)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.headerRight}>
          {ownerTabs.map((tab) => (
            <button
              key={tab.key}
              className={`${styles.filterTab || ''} ${ownerFilter === tab.key ? styles.active || '' : ''}`}
              onClick={() => setOwnerFilter(tab.key as WorkflowOwnerFilter)}
            >
              {tab.label}
            </button>
          ))}

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

export default WorkflowStorage;

export const workflowStoragePlugin: WorkflowTabPlugin = {
  id: 'storage',
  name: 'Workflow Storage',
  tabLabelKey: 'workflows.tabs.storage',
  order: 1,
  component: WorkflowStorage,
};
