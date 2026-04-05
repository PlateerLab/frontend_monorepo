'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { WorkflowDetail, CardBadge, WorkflowStatusFilter, WorkflowOwnerFilter, WorkflowTabPlugin, WorkflowTabPluginProps } from '@xgen/types';
import { Button, EmptyState, ResourceCardGrid, FilterTabs, Modal, Label, Switch } from '@xgen/ui';
import { FiFolder, FiPlay, FiEdit2, FiCopy, FiTrash2, FiSettings, FiFileText, FiServer, FiGitBranch, FiUser, FiClock, FiCheckSquare, FiRefreshCw, FiPlus } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import { listWorkflowsDetail, deleteWorkflow, duplicateWorkflow } from './api';

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

export const WorkflowStorage: React.FC<WorkflowStorageProps> = ({ onNavigate, onSubToolbarChange }) => {
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
  const [activeModal, setActiveModal] = useState<'logs' | 'settings' | 'deploy-info' | 'deploy-settings' | 'versions' | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDetail | null>(null);

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
      const interactionId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      try {
        localStorage.setItem('xgen_current_chat', JSON.stringify({
          workflowId: workflow.id,
          workflowName: workflow.name,
          interactionId,
          userId: workflow.userId,
          startedAt: new Date().toISOString(),
        }));
      } catch (err) {
        console.error('Failed to save current chat data:', err);
        return;
      }
      onNavigate?.('current-chat');
    },
    [onNavigate]
  );

  const handleEdit = useCallback(
    (workflow: WorkflowDetail) => {
      localStorage.setItem(
        'canvas-previous-page',
        JSON.stringify({ path: '/main?section=workflows', timestamp: Date.now() })
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

  const openWorkflowModal = useCallback((workflow: WorkflowDetail, modal: typeof activeModal) => {
    setSelectedWorkflow(workflow);
    setActiveModal(modal);
  }, []);

  const handleCloseModal = useCallback(() => {
    setActiveModal(null);
    setSelectedWorkflow(null);
  }, []);

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
            { id: 'logs', icon: <FiFileText />, label: t('workflows.actions.logs'), onClick: () => openWorkflowModal(workflow, 'logs') },
            { id: 'settings', icon: <FiSettings />, label: t('workflows.actions.settings'), onClick: () => openWorkflowModal(workflow, 'settings') },
            { id: 'deploy-info', icon: <FiServer />, label: t('workflows.actions.deployInfo'), onClick: () => openWorkflowModal(workflow, 'deploy-info') },
            { id: 'deploy-settings', icon: <FiSettings />, label: t('workflows.actions.deploySettings'), onClick: () => openWorkflowModal(workflow, 'deploy-settings') },
            { id: 'versions', icon: <FiGitBranch />, label: t('workflows.actions.versions'), onClick: () => openWorkflowModal(workflow, 'versions') },
            { id: 'delete', icon: <FiTrash2 />, label: t('workflows.actions.delete'), onClick: () => handleDelete(workflow), danger: true, dividerBefore: true },
          ]
        : [
            { id: 'logs', icon: <FiFileText />, label: t('workflows.actions.logs'), onClick: () => openWorkflowModal(workflow, 'logs') },
            { id: 'versions', icon: <FiGitBranch />, label: t('workflows.actions.versions'), onClick: () => openWorkflowModal(workflow, 'versions') },
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

  // Push subToolbar content to orchestrator
  useEffect(() => {
    onSubToolbarChange?.(
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <FilterTabs
            tabs={statusTabs}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as WorkflowStatusFilter)}
            variant="underline"
          />
        </div>

        <div className="flex items-center gap-2">
          <FilterTabs
            tabs={ownerTabs}
            activeKey={ownerFilter}
            onChange={(key) => setOwnerFilter(key as WorkflowOwnerFilter)}
            variant="underline"
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
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>
    );
  }, [onSubToolbarChange, statusFilter, ownerFilter, isMultiSelectMode, selectedIds, loading, handleToggleMultiSelect, handleBulkDelete, fetchWorkflows, t]);

  // Cleanup subToolbar on unmount
  useEffect(() => {
    return () => { onSubToolbarChange?.(null); };
  }, [onSubToolbarChange]);

  return (
    <div className="flex flex-col flex-1 min-h-0 p-6">
      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {!isInitialized ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
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

      {/* Logs Modal */}
      <Modal
        isOpen={activeModal === 'logs'}
        onClose={handleCloseModal}
        title={`${t('workflows.actions.logs')} — ${selectedWorkflow?.name || ''}`}
        size="lg"
      >
        <div className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs text-muted-foreground max-h-[400px] overflow-y-auto">
            <p>[2025-01-28 10:32:15] Workflow started</p>
            <p>[2025-01-28 10:32:16] Node "Input" executed (0.12s)</p>
            <p>[2025-01-28 10:32:18] Node "Process" executed (1.84s)</p>
            <p>[2025-01-28 10:32:19] Node "Output" executed (0.45s)</p>
            <p>[2025-01-28 10:32:19] Workflow completed successfully</p>
          </div>
          <p className="text-xs text-muted-foreground">{t('workflows.storage.logsModal.placeholder')}</p>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={activeModal === 'settings'}
        onClose={handleCloseModal}
        title={`${t('workflows.actions.settings')} — ${selectedWorkflow?.name || ''}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <Label>{t('workflows.storage.settingsModal.share')}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t('workflows.storage.settingsModal.shareDesc')}</p>
            </div>
            <Switch checked={selectedWorkflow?.isShared ?? false} onCheckedChange={() => {}} />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <Label>{t('workflows.storage.settingsModal.active')}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t('workflows.storage.settingsModal.activeDesc')}</p>
            </div>
            <Switch checked={selectedWorkflow?.status === 'active'} onCheckedChange={() => {}} />
          </div>
        </div>
      </Modal>

      {/* Deploy Info Modal */}
      <Modal
        isOpen={activeModal === 'deploy-info'}
        onClose={handleCloseModal}
        title={`${t('workflows.actions.deployInfo')} — ${selectedWorkflow?.name || ''}`}
        size="md"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
            <span className="text-muted-foreground">{t('workflows.storage.deployInfoModal.status')}</span>
            <span className="font-medium">{selectedWorkflow ? (deployStatus[selectedWorkflow.name] || 'not_deployed') : '-'}</span>
            <span className="text-muted-foreground">{t('workflows.storage.deployInfoModal.owner')}</span>
            <span>{selectedWorkflow?.author || '-'}</span>
            <span className="text-muted-foreground">{t('workflows.storage.deployInfoModal.nodes')}</span>
            <span>{selectedWorkflow?.nodeCount || 0}</span>
            <span className="text-muted-foreground">{t('workflows.storage.deployInfoModal.lastModified')}</span>
            <span>{selectedWorkflow?.lastModified ? formatDate(selectedWorkflow.lastModified) : '-'}</span>
          </div>
        </div>
      </Modal>

      {/* Deploy Settings Modal */}
      <Modal
        isOpen={activeModal === 'deploy-settings'}
        onClose={handleCloseModal}
        title={`${t('workflows.actions.deploySettings')} — ${selectedWorkflow?.name || ''}`}
        size="md"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCloseModal}>
              {t('workflows.storage.deploySettingsModal.cancel')}
            </Button>
            <Button onClick={handleCloseModal}>
              {t('workflows.storage.deploySettingsModal.save')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <Label>{t('workflows.storage.deploySettingsModal.deploy')}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t('workflows.storage.deploySettingsModal.deployDesc')}</p>
            </div>
            <Switch checked={selectedWorkflow?.isDeployed ?? false} onCheckedChange={() => {}} />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <Label>{t('workflows.storage.deploySettingsModal.approval')}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t('workflows.storage.deploySettingsModal.approvalDesc')}</p>
            </div>
            <Switch checked={false} onCheckedChange={() => {}} />
          </div>
        </div>
      </Modal>

      {/* Versions Modal */}
      <Modal
        isOpen={activeModal === 'versions'}
        onClose={handleCloseModal}
        title={`${t('workflows.actions.versions')} — ${selectedWorkflow?.name || ''}`}
        size="lg"
      >
        <div className="space-y-3">
          <div className="border border-border rounded-lg divide-y divide-border">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded">v1</span>
                <span className="text-sm">{t('workflows.storage.versionsModal.current')}</span>
              </div>
              <span className="text-xs text-muted-foreground">{selectedWorkflow?.lastModified ? formatDate(selectedWorkflow.lastModified) : '-'}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t('workflows.storage.versionsModal.placeholder')}</p>
        </div>
      </Modal>
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
