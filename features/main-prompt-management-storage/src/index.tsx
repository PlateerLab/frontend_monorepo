'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { CardBadge, PromptTabPlugin, PromptTabPluginProps } from '@xgen/types';
import { Button, EmptyState, ResourceCardGrid, FilterTabs } from '@xgen/ui';
import { FiEdit2, FiCopy, FiTrash2, FiUpload, FiUser, FiClock, FiRefreshCw, FiFileText, FiPlus, FiHash } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import { listPrompts, deletePrompt, createPrompt, uploadToPromptStore } from './api';
import type { PromptDetail } from './api';
import './locales';

// ─────────────────────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────────────────────

type TypeFilter = 'all' | 'system' | 'user' | 'template';
type OwnerFilter = 'all' | 'personal' | 'shared';

const TYPE_BADGE_VARIANT: Record<string, CardBadge['variant']> = {
  system: 'info',
  user: 'primary',
  template: 'warning',
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
// PromptStorage Component
// ─────────────────────────────────────────────────────────────

export interface PromptStorageProps extends PromptTabPluginProps {}

export const PromptStorage: React.FC<PromptStorageProps> = ({ onNavigate, onSubToolbarChange }) => {
  const { t } = useTranslation();
  const { user, isInitialized } = useAuth();

  // State
  const [prompts, setPrompts] = useState<PromptDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');

  // Load prompts
  const fetchPrompts = useCallback(async () => {
    if (!isInitialized) return;

    try {
      setLoading(true);
      setError(null);
      const data = await listPrompts();
      setPrompts(data);
    } catch (err) {
      console.error('Failed to fetch prompts:', err);
      setError(t('promptManagementStorage.error.loadFailed'));
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

  // Filter prompts
  const filteredPrompts = useMemo(() => {
    return prompts.filter((prompt) => {
      if (typeFilter === 'template') {
        if (!prompt.isTemplate) return false;
      } else if (typeFilter !== 'all') {
        if (prompt.type !== typeFilter) return false;
      }
      if (ownerFilter === 'personal' && prompt.isPublic) return false;
      if (ownerFilter === 'shared' && !prompt.isPublic) return false;
      return true;
    });
  }, [prompts, typeFilter, ownerFilter]);

  // Handlers
  const handleDelete = useCallback(
    async (prompt: PromptDetail) => {
      if (!confirm(t('promptManagementStorage.confirm.delete', { name: prompt.title }))) return;
      try {
        await deletePrompt(prompt.uid);
        await fetchPrompts();
      } catch (err) {
        console.error('Failed to delete prompt:', err);
      }
    },
    [fetchPrompts, t],
  );

  const handleDuplicate = useCallback(
    async (prompt: PromptDetail) => {
      try {
        await createPrompt({
          prompt_title: `${prompt.title} (Copy)`,
          prompt_content: prompt.content,
          public_available: false,
          language: prompt.language,
          prompt_type: prompt.type,
        });
        await fetchPrompts();
      } catch (err) {
        console.error('Failed to duplicate prompt:', err);
      }
    },
    [fetchPrompts],
  );

  const handleUploadToStore = useCallback(
    async (prompt: PromptDetail) => {
      try {
        await uploadToPromptStore(prompt.keyValue);
      } catch (err) {
        console.error('Failed to upload to store:', err);
      }
    },
    [],
  );

  // Filter tabs
  const typeTabs = useMemo(() => [
    { key: 'all', label: t('promptManagementStorage.filter.all'), count: prompts.length },
    { key: 'system', label: t('promptManagementStorage.filter.system'), count: prompts.filter((p) => p.type === 'system').length },
    { key: 'user', label: t('promptManagementStorage.filter.user'), count: prompts.filter((p) => p.type === 'user').length },
    { key: 'template', label: t('promptManagementStorage.filter.template'), count: prompts.filter((p) => p.isTemplate).length },
  ], [prompts, t]);

  const ownerTabs = [
    { key: 'all', label: t('promptManagementStorage.owner.all') },
    { key: 'personal', label: t('promptManagementStorage.owner.personal') },
    { key: 'shared', label: t('promptManagementStorage.owner.shared') },
  ];

  // Build card items
  const cardItems = useMemo(() => {
    return filteredPrompts.map((prompt) => {
      const badges: CardBadge[] = [
        {
          text: t(`promptManagementStorage.types.${prompt.type}`),
          variant: TYPE_BADGE_VARIANT[prompt.type] || 'default',
        },
      ];

      if (prompt.isTemplate) {
        badges.push({ text: t('promptManagementStorage.badges.template'), variant: 'warning' });
      }
      if (prompt.isPublic) {
        badges.push({ text: t('promptManagementStorage.badges.shared'), variant: 'primary' });
      } else {
        badges.push({ text: t('promptManagementStorage.badges.personal'), variant: 'secondary' });
      }

      const primaryActions = [
        {
          id: 'edit',
          icon: <FiEdit2 />,
          label: t('promptManagementStorage.actions.edit'),
          onClick: () => {},
        },
        {
          id: 'copy',
          icon: <FiCopy />,
          label: t('promptManagementStorage.actions.duplicate'),
          onClick: () => handleDuplicate(prompt),
        },
      ];

      const dropdownActions = [
        ...(isOwner(prompt.userId)
          ? [
              {
                id: 'upload',
                icon: <FiUpload />,
                label: t('promptManagementStorage.actions.uploadToStore'),
                onClick: () => handleUploadToStore(prompt),
              },
            ]
          : []),
        ...(isOwner(prompt.userId)
          ? [
              {
                id: 'delete',
                icon: <FiTrash2 />,
                label: t('promptManagementStorage.actions.delete'),
                onClick: () => handleDelete(prompt),
                danger: true,
                dividerBefore: true,
              },
            ]
          : []),
      ];

      const metadata = [
        { icon: <FiUser />, value: prompt.author },
        { icon: <FiClock />, value: formatDate(prompt.updatedAt) },
        ...(prompt.variables.length > 0
          ? [{ icon: <FiHash />, value: prompt.variables.map((v) => `{{${v}}}`).join(', ') }]
          : []),
      ];

      return {
        id: prompt.uid,
        data: prompt,
        title: prompt.title,
        description: prompt.content.length > 120 ? prompt.content.slice(0, 120) + '...' : prompt.content,
        thumbnail: {
          icon: <FiFileText />,
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          iconColor: '#3b82f6',
        },
        badges,
        metadata,
        primaryActions,
        dropdownActions,
        onClick: () => {},
      };
    });
  }, [filteredPrompts, isOwner, handleDelete, handleDuplicate, handleUploadToStore, t]);

  // Push subToolbar content to orchestrator
  useEffect(() => {
    onSubToolbarChange?.(
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <FilterTabs
            tabs={typeTabs}
            activeKey={typeFilter}
            onChange={(key) => setTypeFilter(key as TypeFilter)}
            variant="underline"
          />
          <FilterTabs
            tabs={ownerTabs}
            activeKey={ownerFilter}
            onChange={(key) => setOwnerFilter(key as OwnerFilter)}
            variant="underline"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchPrompts} disabled={loading}>
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </Button>
          <Button size="sm">
            <FiPlus />
            {t('promptManagementStorage.createNew')}
          </Button>
        </div>
      </div>,
    );
  }, [onSubToolbarChange, typeFilter, ownerFilter, loading, fetchPrompts, t, typeTabs]);

  // Cleanup subToolbar on unmount
  useEffect(() => {
    return () => { onSubToolbarChange?.(null); };
  }, [onSubToolbarChange]);

  return (
    <div className="flex flex-col flex-1 min-h-0 p-6">
      <div className="flex-1 min-h-0 overflow-y-auto">
        {!isInitialized ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
            <p>{t('promptManagementStorage.messages.loadingAuth')}</p>
          </div>
        ) : error ? (
          <EmptyState
            icon={<FiFileText />}
            title={t('promptManagementStorage.error.title')}
            description={error}
            action={{
              label: t('promptManagementStorage.buttons.retry'),
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
              title: t('promptManagementStorage.empty.title'),
              description: t('promptManagementStorage.empty.description'),
            }}
          />
        )}
      </div>
    </div>
  );
};

export default PromptStorage;

export const promptStoragePlugin: PromptTabPlugin = {
  id: 'storage',
  name: 'Prompt Storage',
  tabLabelKey: 'promptManagement.tabs.storage',
  order: 1,
  component: PromptStorage,
};
