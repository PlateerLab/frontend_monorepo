'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { CardBadge, PromptTabPlugin, PromptTabPluginProps } from '@xgen/types';
import { Button, EmptyState, ResourceCardGrid, FilterTabs } from '@xgen/ui';
import { FiDownload, FiTrash2, FiUser, FiClock, FiStar, FiRefreshCw, FiFileText, FiHash } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import { listPromptStore, downloadFromPromptStore, deleteFromPromptStore } from './api';
import type { StorePrompt } from './api';
import './locales';

// ─────────────────────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────────────────────

type LibraryFilter = 'all' | 'my';

const TYPE_BADGE_VARIANT: Record<string, CardBadge['variant']> = {
  system: 'info',
  user: 'primary',
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
// PromptLibrary Component
// ─────────────────────────────────────────────────────────────

export interface PromptLibraryProps extends PromptTabPluginProps {}

export const PromptLibrary: React.FC<PromptLibraryProps> = ({ onNavigate, onSubToolbarChange }) => {
  const { t } = useTranslation();
  const { user, isInitialized } = useAuth();

  // State
  const [prompts, setPrompts] = useState<StorePrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LibraryFilter>('all');

  // Load prompts
  const fetchPrompts = useCallback(async () => {
    if (!isInitialized) return;

    try {
      setLoading(true);
      setError(null);
      const data = await listPromptStore();
      setPrompts(data);
    } catch (err) {
      console.error('Failed to fetch store prompts:', err);
      setError(t('promptManagementLibrary.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [isInitialized, t]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const isOwner = useCallback(
    (userId?: string): boolean => {
      if (!isInitialized || !user) return false;
      if (userId === undefined || userId === null) return false;
      return String(user.id) === String(userId);
    },
    [isInitialized, user],
  );

  // Filter
  const filteredPrompts = useMemo(() => {
    if (filter === 'my') {
      return prompts.filter((prompt) => isOwner(prompt.userId));
    }
    return prompts;
  }, [prompts, filter, isOwner]);

  // Handlers
  const handleDownload = useCallback(
    async (prompt: StorePrompt) => {
      try {
        await downloadFromPromptStore(prompt.keyValue);
      } catch (err) {
        console.error('Failed to download prompt:', err);
      }
    },
    [],
  );

  const handleDelete = useCallback(
    async (prompt: StorePrompt) => {
      if (!confirm(t('promptManagementLibrary.confirm.delete', { name: prompt.title }))) return;
      try {
        await deleteFromPromptStore(prompt.uploadId);
        await fetchPrompts();
      } catch (err) {
        console.error('Failed to delete store prompt:', err);
      }
    },
    [fetchPrompts, t],
  );

  // Filter tabs
  const filterTabs = [
    { key: 'all', label: t('promptManagementLibrary.filter.all') },
    { key: 'my', label: t('promptManagementLibrary.filter.my') },
  ];

  // Build card items
  const cardItems = useMemo(() => {
    return filteredPrompts.map((prompt) => {
      const badges: CardBadge[] = [
        {
          text: t(`promptManagementLibrary.types.${prompt.type}`),
          variant: TYPE_BADGE_VARIANT[prompt.type] || 'default',
        },
      ];

      if (prompt.isTemplate) {
        badges.push({ text: t('promptManagementLibrary.badges.template'), variant: 'warning' });
      }

      const ratingText = prompt.ratingCount > 0
        ? t('promptManagementLibrary.card.rating', { rating: prompt.ratingAvg.toFixed(1), count: prompt.ratingCount })
        : t('promptManagementLibrary.card.noRating');

      const primaryActions = [
        {
          id: 'download',
          icon: <FiDownload />,
          label: t('promptManagementLibrary.actions.download'),
          onClick: () => handleDownload(prompt),
        },
      ];

      const dropdownActions = isOwner(prompt.userId)
        ? [
            {
              id: 'delete',
              icon: <FiTrash2 />,
              label: t('promptManagementLibrary.actions.delete'),
              onClick: () => handleDelete(prompt),
              danger: true,
            },
          ]
        : [];

      const metadata = [
        { icon: <FiUser />, value: prompt.author },
        { icon: <FiClock />, value: formatDate(prompt.createdAt) },
        { icon: <FiStar />, value: ratingText },
        ...(prompt.variables.length > 0
          ? [{ icon: <FiHash />, value: prompt.variables.map((v) => `{{${v}}}`).join(', ') }]
          : []),
      ];

      return {
        id: prompt.uploadId,
        data: prompt,
        title: prompt.title,
        description: prompt.content.length > 120 ? prompt.content.slice(0, 120) + '...' : prompt.content,
        thumbnail: {
          icon: <FiFileText />,
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          iconColor: '#8b5cf6',
        },
        badges,
        metadata,
        primaryActions,
        dropdownActions,
        onClick: () => {},
      };
    });
  }, [filteredPrompts, isOwner, handleDownload, handleDelete, t]);

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
            onClick={fetchPrompts}
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>,
    );
  }, [onSubToolbarChange, filter, loading, fetchPrompts, t]);

  // Cleanup subToolbar on unmount
  useEffect(() => {
    return () => { onSubToolbarChange?.(null); };
  }, [onSubToolbarChange]);

  return (
    <div className="flex flex-col flex-1 min-h-0 p-6">
      <div className="flex-1 min-h-0 overflow-y-auto">
        {!isInitialized ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
            <p>{t('promptManagementLibrary.messages.loadingAuth')}</p>
          </div>
        ) : error ? (
          <EmptyState
            icon={<FiFileText />}
            title={t('promptManagementLibrary.error.title')}
            description={error}
            action={{
              label: t('promptManagementLibrary.buttons.retry'),
              onClick: fetchPrompts,
            }}
          />
        ) : (
          <ResourceCardGrid
            items={cardItems}
            loading={loading}
            showEmptyState
            emptyStateProps={{
              icon: <FiFileText />,
              title: t('promptManagementLibrary.empty.title'),
              description: t('promptManagementLibrary.empty.description'),
            }}
          />
        )}
      </div>
    </div>
  );
};

export default PromptLibrary;

export const promptLibraryPlugin: PromptTabPlugin = {
  id: 'library',
  name: 'Prompt Library',
  tabLabelKey: 'promptManagement.tabs.library',
  order: 2,
  component: PromptLibrary,
};
