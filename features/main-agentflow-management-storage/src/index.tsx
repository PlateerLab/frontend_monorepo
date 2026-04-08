'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { AgentflowDetail, CardBadge, AgentflowStatusFilter, AgentflowOwnerFilter, AgentflowTabPlugin, AgentflowTabPluginProps } from '@xgen/types';
import { Button, EmptyState, ResourceCardGrid, FilterTabs, Modal, Label, Switch } from '@xgen/ui';
import { FiFolder, FiPlay, FiEdit2, FiCopy, FiTrash2, FiSettings, FiFileText, FiServer, FiGitBranch, FiUser, FiClock, FiCheckSquare, FiRefreshCw, FiPlus, FiArrowLeft } from '@xgen/icons';
import { DeploymentModal } from '@xgen/feature-canvas-deploy';
import { DeploySettings } from '@xgen/feature-deploy-settings';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import { listAgentflowsDetail, deleteAgentflow, duplicateAgentflow } from './api';

// ─────────────────────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────────────────────

const DEPLOY_BADGE_VARIANT: Record<string, CardBadge['variant']> = {
  deployed: 'purple',
  pending: 'warning',
  not_deployed: 'error',
};

const DEPLOY_BADGE_KEY: Record<string, string> = {
  deployed: 'agentflows.badges.deployed',
  pending: 'agentflows.badges.pending',
  not_deployed: 'agentflows.badges.close',
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
// AgentflowStorage Component
// ─────────────────────────────────────────────────────────────

export interface AgentflowStorageProps extends AgentflowTabPluginProps {}

export const AgentflowStorage: React.FC<AgentflowStorageProps> = ({ onNavigate, onSubToolbarChange }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isInitialized } = useAuth();

  // State
  const [agentflows, setAgentflows] = useState<AgentflowDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AgentflowStatusFilter>('all');
  const [ownerFilter, setOwnerFilter] = useState<AgentflowOwnerFilter>('all');
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deployStatus, setDeployStatus] = useState<Record<string, string>>({});
  const [activeModal, setActiveModal] = useState<'logs' | 'settings' | 'deploy-info' | 'versions' | null>(null);
  const [selectedAgentflow, setSelectedAgentflow] = useState<AgentflowDetail | null>(null);
  const [deploySettingsAgentflow, setDeploySettingsAgentflow] = useState<AgentflowDetail | null>(null);

  // Load agentflows
  const fetchAgentflows = useCallback(async () => {
    if (!isInitialized) return;

    try {
      setLoading(true);
      setError(null);
      const data = await listAgentflowsDetail();
      setAgentflows(data);

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
      console.error('Failed to fetch agentflows:', err);
      setError(t('agentflows.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [isInitialized, user?.id, t]);

  useEffect(() => {
    fetchAgentflows();
  }, [fetchAgentflows]);

  const isOwner = useCallback(
    (userId?: number): boolean => {
      if (!isInitialized || !user) return false;
      if (userId === undefined || userId === null) return false;
      return Number(user.id) === Number(userId);
    },
    [isInitialized, user]
  );

  // Filter agentflows
  const filteredAgentflows = useMemo(() => {
    return agentflows.filter((w) => {
      if (statusFilter === 'all') {
        if (w.status === 'unactive') return false;
      } else if (w.status !== statusFilter) {
        return false;
      }
      if (ownerFilter === 'personal' && w.isShared) return false;
      if (ownerFilter === 'shared' && !w.isShared) return false;
      return true;
    });
  }, [agentflows, statusFilter, ownerFilter]);

  // Handlers
  const handleExecute = useCallback(
    (agentflow: AgentflowDetail) => {
      const interactionId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      try {
        localStorage.setItem('xgen_current_chat', JSON.stringify({
          workflowId: agentflow.id,
          workflowName: agentflow.name,
          interactionId,
          userId: agentflow.userId,
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
    (agentflow: AgentflowDetail) => {
      localStorage.setItem(
        'canvas-previous-page',
        JSON.stringify({ path: '/main?section=agentflows', timestamp: Date.now() })
      );
      router.push(`/canvas?load=${encodeURIComponent(agentflow.id)}&user_id=${agentflow.userId}`);
    },
    [router]
  );

  const handleDuplicate = useCallback(
    async (agentflow: AgentflowDetail) => {
      if (!agentflow.userId) return;
      try {
        await duplicateAgentflow(agentflow.id, agentflow.userId);
        await fetchAgentflows();
      } catch (err) {
        console.error('Failed to duplicate workflow:', err);
      }
    },
    [fetchAgentflows]
  );

  const handleDelete = useCallback(
    async (agentflow: AgentflowDetail) => {
      if (!confirm(t('agentflows.confirm.delete', { name: agentflow.name }))) return;
      try {
        await deleteAgentflow(agentflow.id);
        await fetchAgentflows();
      } catch (err) {
        console.error('Failed to delete workflow:', err);
      }
    },
    [fetchAgentflows, t]
  );

  const handleToggleMultiSelect = useCallback(() => {
    setIsMultiSelectMode((prev) => {
      if (prev) setSelectedIds([]);
      return !prev;
    });
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;

    const toDelete = agentflows.filter(
      (w) => selectedIds.includes(w.id) && isOwner(w.userId)
    );

    if (toDelete.length === 0) {
      alert(t('agentflows.error.noDeletePermission'));
      return;
    }

    if (!confirm(t('agentflows.confirm.bulkDelete', { count: toDelete.length }))) return;

    try {
      for (const w of toDelete) {
        await deleteAgentflow(w.id);
      }
      setSelectedIds([]);
      setIsMultiSelectMode(false);
      await fetchAgentflows();
    } catch (err) {
      console.error('Failed to bulk delete:', err);
    }
  }, [selectedIds, agentflows, isOwner, fetchAgentflows, t]);

  const openAgentflowModal = useCallback((agentflow: AgentflowDetail, modal: typeof activeModal | 'deploy-settings') => {
    if (modal === 'deploy-settings') {
      setDeploySettingsAgentflow(agentflow);
      return;
    }
    setSelectedAgentflow(agentflow);
    setActiveModal(modal);
  }, []);

  const handleCloseModal = useCallback(() => {
    setActiveModal(null);
    setSelectedAgentflow(null);
  }, []);

  const handleCreateNew = useCallback(() => {
    onNavigate?.('canvas-intro');
  }, [onNavigate]);

  // Filter tabs
  const statusTabs = [
    { key: 'all', label: t('agentflows.filter.all') },
    { key: 'active', label: t('agentflows.filter.active') },
    { key: 'archived', label: t('agentflows.filter.archived') },
    { key: 'unactive', label: t('agentflows.filter.unactive') },
  ];

  const ownerTabs = [
    { key: 'all', label: t('agentflows.filter.all') },
    { key: 'personal', label: t('agentflows.filter.personal') },
    { key: 'shared', label: t('agentflows.filter.shared') },
  ];

  // Build card items
  const cardItems = useMemo(() => {
    return filteredAgentflows.map((agentflow) => {
      const badges: CardBadge[] = [];

      badges.push({
        text: agentflow.isShared ? t('agentflows.badges.shared') : t('agentflows.badges.my'),
        variant: agentflow.isShared ? 'primary' : 'secondary',
      });

      if (isOwner(agentflow.userId)) {
        const deployKey = deployStatus[agentflow.name] || 'not_deployed';
        const deployVariant = DEPLOY_BADGE_VARIANT[deployKey];
        const deployI18nKey = DEPLOY_BADGE_KEY[deployKey];
        if (deployVariant && deployI18nKey) {
          badges.push({ text: t(deployI18nKey), variant: deployVariant });
        }
      }

      const primaryActions = agentflow.status !== 'unactive' ? [
        {
          id: 'execute',
          icon: <FiPlay />,
          label: t('agentflows.actions.execute'),
          onClick: () => handleExecute(agentflow),
        },
        {
          id: 'edit',
          icon: <FiEdit2 />,
          label: t('agentflows.actions.edit'),
          onClick: () => handleEdit(agentflow),
          disabled: !isOwner(agentflow.userId) && agentflow.sharePermissions !== 'read_write',
          disabledMessage: t('agentflows.messages.readOnly'),
        },
        {
          id: 'copy',
          icon: <FiCopy />,
          label: t('agentflows.actions.copy'),
          onClick: () => handleDuplicate(agentflow),
        },
      ] : [];

      const dropdownActions = isOwner(agentflow.userId)
        ? [
            { id: 'logs', icon: <FiFileText />, label: t('agentflows.actions.logs'), onClick: () => openAgentflowModal(agentflow, 'logs') },
            { id: 'settings', icon: <FiSettings />, label: t('agentflows.actions.settings'), onClick: () => openAgentflowModal(agentflow, 'settings') },
            { id: 'deploy-info', icon: <FiServer />, label: t('agentflows.actions.deployInfo'), onClick: () => openAgentflowModal(agentflow, 'deploy-info') },
            { id: 'deploy-settings', icon: <FiSettings />, label: t('agentflows.actions.deploySettings'), onClick: () => openAgentflowModal(agentflow, 'deploy-settings') },
            { id: 'versions', icon: <FiGitBranch />, label: t('agentflows.actions.versions'), onClick: () => openAgentflowModal(agentflow, 'versions') },
            { id: 'delete', icon: <FiTrash2 />, label: t('agentflows.actions.delete'), onClick: () => handleDelete(agentflow), danger: true, dividerBefore: true },
          ]
        : [
            { id: 'logs', icon: <FiFileText />, label: t('agentflows.actions.logs'), onClick: () => openAgentflowModal(agentflow, 'logs') },
            { id: 'versions', icon: <FiGitBranch />, label: t('agentflows.actions.versions'), onClick: () => openAgentflowModal(agentflow, 'versions') },
          ];

      return {
        id: agentflow.id,
        data: agentflow,
        title: agentflow.name,
        description: agentflow.description,
        errorMessage: agentflow.error,
        thumbnail: {
          icon: <FiFolder />,
          backgroundColor: 'rgba(48, 94, 235, 0.1)',
          iconColor: '#305eeb',
        },
        badges,
        metadata: [
          { icon: <FiUser />, value: agentflow.author },
          ...(agentflow.lastModified
            ? [{ icon: <FiClock />, value: formatDate(agentflow.lastModified) }]
            : []),
          { value: t('agentflows.card.nodes', { count: agentflow.nodeCount }) },
          ...(agentflow.shareGroup
            ? [{ value: `${t('agentflows.card.organization')}: ${agentflow.shareGroup}` }]
            : []),
        ],
        primaryActions,
        dropdownActions,
        inactive: agentflow.status === 'unactive',
        inactiveMessage: t('agentflows.messages.unactive'),
        onClick: () => {},
      };
    });
  }, [
    filteredAgentflows,
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
    if (deploySettingsAgentflow) {
      onSubToolbarChange?.(
        <div className="flex items-center gap-4">
          <button
            onClick={() => setDeploySettingsAgentflow(null)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 hover:border-blue-500 hover:text-blue-500 transition-all"
          >
            <FiArrowLeft className="w-4 h-4" />
            {t('deploySettings.back')}
          </button>
        </div>
      );
      return;
    }

    onSubToolbarChange?.(
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <FilterTabs
            tabs={statusTabs}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as AgentflowStatusFilter)}
            variant="underline"
          />
        </div>

        <div className="flex items-center gap-2">
          <FilterTabs
            tabs={ownerTabs}
            activeKey={ownerFilter}
            onChange={(key) => setOwnerFilter(key as AgentflowOwnerFilter)}
            variant="underline"
          />

          <Button
            variant={isMultiSelectMode ? 'primary' : 'outline'}
            size="sm"
            onClick={handleToggleMultiSelect}
            title={isMultiSelectMode ? t('agentflows.buttons.multiSelectDisable') : t('agentflows.buttons.multiSelectEnable')}
          >
            <FiCheckSquare />
          </Button>

          {isMultiSelectMode && selectedIds.length > 0 && (
            <Button variant="danger" size="sm" onClick={handleBulkDelete}>
              <FiTrash2 />
              {t('agentflows.buttons.deleteSelected')}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchAgentflows}
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>
    );
  }, [deploySettingsAgentflow, onSubToolbarChange, statusFilter, ownerFilter, isMultiSelectMode, selectedIds, loading, handleToggleMultiSelect, handleBulkDelete, fetchAgentflows, t]);

  // Cleanup subToolbar on unmount
  useEffect(() => {
    return () => { onSubToolbarChange?.(null); };
  }, [onSubToolbarChange]);

  return (
    <div className={`flex flex-col flex-1 min-h-0 ${deploySettingsAgentflow ? '' : 'p-6'}`}>
      {/* Deploy Settings — full page panel */}
      {deploySettingsAgentflow ? (
        <DeploySettings
          agentflow={{
            id: deploySettingsAgentflow.id,
            name: deploySettingsAgentflow.name,
            userId: deploySettingsAgentflow.userId,
          }}
          onBack={() => setDeploySettingsAgentflow(null)}
        />
      ) : (
        <>
          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {!isInitialized ? (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                <p>{t('agentflows.messages.loadingAuth')}</p>
              </div>
            ) : error ? (
              <EmptyState
                icon={<FiFolder />}
                title={t('agentflows.error.title')}
                description={error}
                action={{
                  label: t('agentflows.buttons.retry'),
                  onClick: fetchAgentflows,
                }}
              />
            ) : (
              <ResourceCardGrid
                items={cardItems}
                loading={loading}
                showEmptyState
                emptyStateProps={{
                  icon: <FiFolder />,
                  title: t('agentflows.empty.title'),
                  description: t('agentflows.empty.description'),
                  action: {
                    label: t('agentflows.empty.action'),
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
            title={`${t('agentflows.actions.logs')} — ${selectedAgentflow?.name || ''}`}
            size="lg"
          >
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs text-muted-foreground max-h-[400px] overflow-y-auto">
                <p>[2025-01-28 10:32:15] Agentflow started</p>
                <p>[2025-01-28 10:32:16] Node &quot;Input&quot; executed (0.12s)</p>
                <p>[2025-01-28 10:32:18] Node &quot;Process&quot; executed (1.84s)</p>
                <p>[2025-01-28 10:32:19] Node &quot;Output&quot; executed (0.45s)</p>
                <p>[2025-01-28 10:32:19] Agentflow completed successfully</p>
              </div>
              <p className="text-xs text-muted-foreground">{t('agentflows.storage.logsModal.placeholder')}</p>
            </div>
          </Modal>

          {/* Settings Modal */}
          <Modal
            isOpen={activeModal === 'settings'}
            onClose={handleCloseModal}
            title={`${t('agentflows.actions.settings')} — ${selectedAgentflow?.name || ''}`}
            size="md"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>{t('agentflows.storage.settingsModal.share')}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('agentflows.storage.settingsModal.shareDesc')}</p>
                </div>
                <Switch checked={selectedAgentflow?.isShared ?? false} onCheckedChange={() => {}} />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>{t('agentflows.storage.settingsModal.active')}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('agentflows.storage.settingsModal.activeDesc')}</p>
                </div>
                <Switch checked={selectedAgentflow?.status === 'active'} onCheckedChange={() => {}} />
              </div>
            </div>
          </Modal>

          {/* Deploy Info Modal — reuses DeploymentModal from canvas-deploy */}
          {selectedAgentflow && (
            <DeploymentModal
              isOpen={activeModal === 'deploy-info'}
              onClose={handleCloseModal}
              agentflow={{
                id: selectedAgentflow.id,
                name: selectedAgentflow.name,
                user_id: selectedAgentflow.userId,
              }}
              onDeployStatusChange={(workflowName, isDeployed) => {
                setDeployStatus((prev) => ({
                  ...prev,
                  [workflowName]: isDeployed ? 'deployed' : 'not_deployed',
                }));
              }}
            />
          )}

          {/* Versions Modal */}
          <Modal
            isOpen={activeModal === 'versions'}
            onClose={handleCloseModal}
            title={`${t('agentflows.actions.versions')} — ${selectedAgentflow?.name || ''}`}
            size="lg"
          >
            <div className="space-y-3">
              <div className="border border-border rounded-lg divide-y divide-border">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded">v1</span>
                    <span className="text-sm">{t('agentflows.storage.versionsModal.current')}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{selectedAgentflow?.lastModified ? formatDate(selectedAgentflow.lastModified) : '-'}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{t('agentflows.storage.versionsModal.placeholder')}</p>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
};

export default AgentflowStorage;

export const agentflowStoragePlugin: AgentflowTabPlugin = {
  id: 'storage',
  name: 'Agentflow Storage',
  tabLabelKey: 'agentflows.tabs.storage',
  order: 1,
  component: AgentflowStorage,
};
