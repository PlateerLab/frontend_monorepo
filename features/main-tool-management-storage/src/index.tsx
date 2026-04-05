'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { CardBadge, ToolTabPlugin, ToolTabPluginProps } from '@xgen/types';
import { Button, EmptyState, ResourceCardGrid, FilterTabs } from '@xgen/ui';
import { FiPlay, FiEdit2, FiCopy, FiTrash2, FiSettings, FiDownload, FiUser, FiClock, FiCheckSquare, FiRefreshCw, FiTool } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import { listToolsDetail, deleteTool, testTool } from './api';
import type { ToolDetail } from './api';
import './locales';

// ─────────────────────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'active' | 'inactive' | 'archived';
type OwnerFilter = 'all' | 'personal' | 'shared';

const STATUS_BADGE_VARIANT: Record<string, CardBadge['variant']> = {
  active: 'success',
  inactive: 'error',
  draft: 'warning',
  archived: 'secondary',
};

const STATUS_BADGE_KEY: Record<string, string> = {
  active: 'toolManagementStorage.badges.active',
  inactive: 'toolManagementStorage.badges.inactive',
  draft: 'toolManagementStorage.badges.draft',
  archived: 'toolManagementStorage.badges.archived',
};

const DEPLOY_BADGE_VARIANT: Record<string, CardBadge['variant']> = {
  deployed: 'purple',
  pending: 'warning',
  not_deployed: 'error',
};

const DEPLOY_BADGE_KEY: Record<string, string> = {
  deployed: 'toolManagementStorage.badges.deployed',
  pending: 'toolManagementStorage.badges.pending',
  not_deployed: 'toolManagementStorage.badges.notDeployed',
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
// ToolStorage Component
// ─────────────────────────────────────────────────────────────

export interface ToolStorageProps extends ToolTabPluginProps {}

export const ToolStorage: React.FC<ToolStorageProps> = ({ onNavigate, onSubToolbarChange }) => {
  const { t } = useTranslation();
  const { user, isInitialized } = useAuth();

  // State
  const [tools, setTools] = useState<ToolDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deployStatus, setDeployStatus] = useState<Record<string, string>>({});

  // Load tools
  const fetchTools = useCallback(async () => {
    if (!isInitialized) return;

    try {
      setLoading(true);
      setError(null);
      const data = await listToolsDetail();
      setTools(data);

      const statusMap: Record<string, string> = {};
      data.forEach((tool) => {
        if (tool.userId === Number(user?.id)) {
          if (tool.inquireDeploy) {
            statusMap[tool.name] = 'pending';
          } else if (tool.isDeployed) {
            statusMap[tool.name] = 'deployed';
          } else {
            statusMap[tool.name] = 'not_deployed';
          }
        }
      });
      setDeployStatus(statusMap);
    } catch (err) {
      console.error('Failed to fetch tools:', err);
      setError(t('toolManagementStorage.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [isInitialized, user?.id, t]);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  const isOwner = useCallback(
    (userId?: number): boolean => {
      if (!isInitialized || !user) return false;
      if (userId === undefined || userId === null) return false;
      return Number(user.id) === Number(userId);
    },
    [isInitialized, user],
  );

  // Filter tools
  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      if (statusFilter === 'all') {
        if (tool.status === 'inactive') return false;
      } else if (tool.status !== statusFilter) {
        return false;
      }
      if (ownerFilter === 'personal' && tool.isShared) return false;
      if (ownerFilter === 'shared' && !tool.isShared) return false;
      return true;
    });
  }, [tools, statusFilter, ownerFilter]);

  // Handlers
  const handleTest = useCallback(
    async (tool: ToolDetail) => {
      try {
        await testTool(tool.keyValue, tool.id);
      } catch (err) {
        console.error('Failed to test tool:', err);
      }
    },
    [],
  );

  const handleDelete = useCallback(
    async (tool: ToolDetail) => {
      if (!confirm(t('toolManagementStorage.confirm.delete', { name: tool.name }))) return;
      try {
        await deleteTool(tool.id);
        await fetchTools();
      } catch (err) {
        console.error('Failed to delete tool:', err);
      }
    },
    [fetchTools, t],
  );

  const handleToggleMultiSelect = useCallback(() => {
    setIsMultiSelectMode((prev) => {
      if (prev) setSelectedIds([]);
      return !prev;
    });
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;

    const toDelete = tools.filter(
      (tool) => selectedIds.includes(tool.id) && isOwner(tool.userId),
    );

    if (toDelete.length === 0) {
      alert(t('toolManagementStorage.error.noDeletePermission'));
      return;
    }

    if (!confirm(t('toolManagementStorage.confirm.bulkDelete', { count: toDelete.length }))) return;

    try {
      for (const tool of toDelete) {
        await deleteTool(tool.id);
      }
      setSelectedIds([]);
      setIsMultiSelectMode(false);
      await fetchTools();
    } catch (err) {
      console.error('Failed to bulk delete:', err);
    }
  }, [selectedIds, tools, isOwner, fetchTools, t]);

  // Filter tabs
  const statusTabs = [
    { key: 'all', label: t('toolManagementStorage.filter.all') },
    { key: 'active', label: t('toolManagementStorage.filter.active') },
    { key: 'inactive', label: t('toolManagementStorage.filter.inactive') },
    { key: 'archived', label: t('toolManagementStorage.filter.archived') },
  ];

  const ownerTabs = [
    { key: 'all', label: t('toolManagementStorage.owner.all') },
    { key: 'personal', label: t('toolManagementStorage.owner.personal') },
    { key: 'shared', label: t('toolManagementStorage.owner.shared') },
  ];

  // Build card items
  const cardItems = useMemo(() => {
    return filteredTools.map((tool) => {
      const badges: CardBadge[] = [];

      const statusVariant = STATUS_BADGE_VARIANT[tool.status];
      const statusKey = STATUS_BADGE_KEY[tool.status];
      if (statusVariant && statusKey) {
        badges.push({ text: t(statusKey), variant: statusVariant });
      }

      badges.push({
        text: tool.isShared ? t('toolManagementStorage.badges.shared') : t('toolManagementStorage.badges.my'),
        variant: tool.isShared ? 'primary' : 'secondary',
      });

      if (isOwner(tool.userId)) {
        const deployKey = deployStatus[tool.name] || 'not_deployed';
        const deployVariant = DEPLOY_BADGE_VARIANT[deployKey];
        const deployI18nKey = DEPLOY_BADGE_KEY[deployKey];
        if (deployVariant && deployI18nKey) {
          badges.push({ text: t(deployI18nKey), variant: deployVariant });
        }
      }

      const primaryActions = tool.status !== 'inactive'
        ? [
            {
              id: 'test',
              icon: <FiPlay />,
              label: t('toolManagementStorage.actions.test'),
              onClick: () => handleTest(tool),
            },
            {
              id: 'edit',
              icon: <FiEdit2 />,
              label: t('toolManagementStorage.actions.edit'),
              onClick: () => {},
              disabled: !isOwner(tool.userId) && tool.sharePermissions !== 'read_write',
            },
            {
              id: 'copy',
              icon: <FiCopy />,
              label: t('toolManagementStorage.actions.copy'),
              onClick: () => {},
            },
          ]
        : [];

      const dropdownActions = isOwner(tool.userId)
        ? [
            { id: 'download', icon: <FiDownload />, label: t('toolManagementStorage.actions.download'), onClick: () => {} },
            { id: 'settings', icon: <FiSettings />, label: t('toolManagementStorage.actions.settings'), onClick: () => {} },
            { id: 'delete', icon: <FiTrash2 />, label: t('toolManagementStorage.actions.delete'), onClick: () => handleDelete(tool), danger: true, dividerBefore: true },
          ]
        : [
            { id: 'download', icon: <FiDownload />, label: t('toolManagementStorage.actions.download'), onClick: () => {} },
          ];

      return {
        id: tool.id,
        data: tool,
        title: tool.name,
        description: tool.description,
        thumbnail: {
          icon: <FiTool />,
          backgroundColor: 'rgba(48, 94, 235, 0.1)',
          iconColor: '#305eeb',
        },
        badges,
        metadata: [
          { icon: <FiUser />, value: tool.author },
          ...(tool.lastModified
            ? [{ icon: <FiClock />, value: formatDate(tool.lastModified) }]
            : []),
          ...(tool.apiMethod
            ? [{ value: `${tool.apiMethod}` }]
            : []),
          ...(tool.parameterCount > 0
            ? [{ value: t('toolManagementStorage.card.params', { count: tool.parameterCount }) }]
            : []),
        ],
        primaryActions,
        dropdownActions,
        inactive: tool.status === 'inactive',
        onClick: () => {},
      };
    });
  }, [filteredTools, isOwner, deployStatus, handleTest, handleDelete, t]);

  // Push subToolbar content to orchestrator
  useEffect(() => {
    onSubToolbarChange?.(
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <FilterTabs
            tabs={statusTabs}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as StatusFilter)}
            variant="underline"
          />
        </div>

        <div className="flex items-center gap-2">
          <FilterTabs
            tabs={ownerTabs}
            activeKey={ownerFilter}
            onChange={(key) => setOwnerFilter(key as OwnerFilter)}
            variant="underline"
          />

          <Button
            variant={isMultiSelectMode ? 'primary' : 'outline'}
            size="sm"
            onClick={handleToggleMultiSelect}
            title={isMultiSelectMode ? t('toolManagementStorage.buttons.multiSelectDisable') : t('toolManagementStorage.buttons.multiSelectEnable')}
          >
            <FiCheckSquare />
          </Button>

          {isMultiSelectMode && selectedIds.length > 0 && (
            <Button variant="danger" size="sm" onClick={handleBulkDelete}>
              <FiTrash2 />
              {t('toolManagementStorage.buttons.deleteSelected')}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchTools}
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>,
    );
  }, [onSubToolbarChange, statusFilter, ownerFilter, isMultiSelectMode, selectedIds, loading, handleToggleMultiSelect, handleBulkDelete, fetchTools, t]);

  // Cleanup subToolbar on unmount
  useEffect(() => {
    return () => { onSubToolbarChange?.(null); };
  }, [onSubToolbarChange]);

  return (
    <div className="flex flex-col flex-1 min-h-0 p-6">
      <div className="flex-1 min-h-0 overflow-y-auto">
        {!isInitialized ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
            <p>{t('toolManagementStorage.messages.loadingAuth')}</p>
          </div>
        ) : error ? (
          <EmptyState
            icon={<FiTool />}
            title={t('toolManagementStorage.error.title')}
            description={error}
            action={{
              label: t('toolManagementStorage.buttons.retry'),
              onClick: fetchTools,
            }}
          />
        ) : (
          <ResourceCardGrid
            items={cardItems}
            loading={loading}
            showEmptyState
            emptyStateProps={{
              icon: <FiTool />,
              title: t('toolManagementStorage.empty.title'),
              description: t('toolManagementStorage.empty.description'),
              action: {
                label: t('toolManagementStorage.empty.action'),
                onClick: () => {},
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

export default ToolStorage;

export const toolStoragePlugin: ToolTabPlugin = {
  id: 'storage',
  name: 'Tool Storage',
  tabLabelKey: 'toolStorage.tabs.storage',
  order: 1,
  component: ToolStorage,
};
