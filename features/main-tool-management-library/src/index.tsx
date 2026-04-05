'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { CardBadge, ToolTabPlugin, ToolTabPluginProps } from '@xgen/types';
import { Button, EmptyState, ResourceCardGrid, FilterTabs } from '@xgen/ui';
import { FiDownload, FiTrash2, FiUser, FiClock, FiStar, FiRefreshCw, FiTool } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import { listStoreToolsDetail, downloadStoreToolToStorage, deleteStoreToolUpload } from './api';
import type { StoreTool } from './api';
import './locales';

// ─────────────────────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────────────────────

type LibraryFilter = 'all' | 'my';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\. /g, '. ');
}

// ─────────────────────────────────────────────────────────────
// ToolLibrary Component
// ─────────────────────────────────────────────────────────────

export interface ToolLibraryProps extends ToolTabPluginProps {}

export const ToolLibrary: React.FC<ToolLibraryProps> = ({ onNavigate, onSubToolbarChange }) => {
  const { t } = useTranslation();
  const { user, isInitialized } = useAuth();

  // State
  const [tools, setTools] = useState<StoreTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LibraryFilter>('all');

  // Load tools
  const fetchTools = useCallback(async () => {
    if (!isInitialized) return;

    try {
      setLoading(true);
      setError(null);
      const data = await listStoreToolsDetail();
      setTools(data);
    } catch (err) {
      console.error('Failed to fetch store tools:', err);
      setError(t('toolManagementLibrary.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [isInitialized, t]);

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

  // Filter
  const filteredTools = useMemo(() => {
    if (filter === 'my') {
      return tools.filter((tool) => isOwner(tool.userId));
    }
    return tools;
  }, [tools, filter, isOwner]);

  // Handlers
  const handleDownload = useCallback(
    async (tool: StoreTool) => {
      try {
        await downloadStoreToolToStorage(tool.keyValue, tool.uploadId);
        // Could add toast notification here
      } catch (err) {
        console.error('Failed to download tool:', err);
      }
    },
    [],
  );

  const handleDelete = useCallback(
    async (tool: StoreTool) => {
      if (!confirm(t('toolManagementLibrary.confirm.delete', { name: tool.name }))) return;
      try {
        await deleteStoreToolUpload(tool.uploadId);
        await fetchTools();
      } catch (err) {
        console.error('Failed to delete store tool:', err);
      }
    },
    [fetchTools, t],
  );

  // Filter tabs
  const filterTabs = [
    { key: 'all', label: t('toolManagementLibrary.filter.all') },
    { key: 'my', label: t('toolManagementLibrary.filter.my') },
  ];

  // Build card items
  const cardItems = useMemo(() => {
    return filteredTools.map((tool) => {
      const badges: CardBadge[] = [
        { text: t('toolManagementLibrary.badges.tool'), variant: 'primary' },
      ];

      const ratingText = tool.ratingCount > 0
        ? t('toolManagementLibrary.card.rating', { rating: tool.ratingAvg.toFixed(1), count: tool.ratingCount })
        : t('toolManagementLibrary.card.noRating');

      const primaryActions = [
        {
          id: 'download',
          icon: <FiDownload />,
          label: t('toolManagementLibrary.actions.download'),
          onClick: () => handleDownload(tool),
        },
      ];

      const dropdownActions = isOwner(tool.userId)
        ? [
            { id: 'delete', icon: <FiTrash2 />, label: t('toolManagementLibrary.actions.delete'), onClick: () => handleDelete(tool), danger: true },
          ]
        : [];

      return {
        id: tool.uploadId,
        data: tool,
        title: tool.name,
        description: tool.description,
        thumbnail: {
          icon: <FiTool />,
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          iconColor: '#8b5cf6',
        },
        badges,
        metadata: [
          { icon: <FiUser />, value: tool.author },
          { icon: <FiClock />, value: formatDate(tool.createdAt) },
          { icon: <FiStar />, value: ratingText },
          ...(tool.apiMethod
            ? [{ value: `${tool.apiMethod}` }]
            : []),
          ...(tool.parameterCount > 0
            ? [{ value: t('toolManagementLibrary.card.params', { count: tool.parameterCount }) }]
            : []),
        ],
        primaryActions,
        dropdownActions,
        onClick: () => {},
      };
    });
  }, [filteredTools, isOwner, handleDownload, handleDelete, t]);

  // Push subToolbar content to orchestrator
  useEffect(() => {
    onSubToolbarChange?.(
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <FilterTabs
            tabs={filterTabs}
            activeKey={filter}
            onChange={(key) => setFilter(key as LibraryFilter)}
            variant="underline"
          />
        </div>

        <div className="flex items-center gap-2">
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
  }, [onSubToolbarChange, filter, loading, fetchTools, t]);

  // Cleanup subToolbar on unmount
  useEffect(() => {
    return () => { onSubToolbarChange?.(null); };
  }, [onSubToolbarChange]);

  return (
    <div className="flex flex-col flex-1 min-h-0 p-6">
      <div className="flex-1 min-h-0 overflow-y-auto">
        {!isInitialized ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
            <p>{t('toolManagementLibrary.messages.loadingAuth')}</p>
          </div>
        ) : error ? (
          <EmptyState
            icon={<FiTool />}
            title={t('toolManagementLibrary.error.title')}
            description={error}
            action={{
              label: t('toolManagementLibrary.buttons.retry'),
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
              title: t('toolManagementLibrary.empty.title'),
              description: t('toolManagementLibrary.empty.description'),
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ToolLibrary;

export const toolLibraryPlugin: ToolTabPlugin = {
  id: 'library',
  name: 'Tool Library',
  tabLabelKey: 'toolStorage.tabs.library',
  order: 2,
  component: ToolLibrary,
};
