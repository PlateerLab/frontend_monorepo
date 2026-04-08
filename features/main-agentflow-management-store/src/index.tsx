'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { AgentflowStoreItem, CardBadge, AgentflowTabPlugin, AgentflowTabPluginProps } from '@xgen/types';
import { Button, ResourceCardGrid, EmptyState, FilterTabs, Modal, Input, Label, Textarea } from '@xgen/ui';
import { FiFolder, FiDownload, FiSearch, FiRefreshCw, FiUpload, FiStar, FiUser, FiCalendar, FiBox } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import { listAgentflowStore, downloadAgentflowTemplate } from './api';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type StoreFilterMode = 'all' | 'my' | 'template' | 'shared';

export interface AgentflowStoreProps extends AgentflowTabPluginProps {
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

function calculateAverageRating(agentflow: AgentflowStoreItem): number {
  if (!agentflow.ratingCount || agentflow.ratingCount === 0) return 0;
  return (agentflow.ratingSum ?? 0) / agentflow.ratingCount;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const AgentflowStore: React.FC<AgentflowStoreProps> = ({ onStorageRefresh, onSubToolbarChange }) => {
  const { t } = useTranslation();
  const { user, isInitialized } = useAuth();

  // State
  const [agentflows, setAgentflows] = useState<AgentflowStoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<StoreFilterMode>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploading, setUploading] = useState(false);

  // Load agentflows
  const fetchAgentflows = useCallback(async () => {
    if (!isInitialized) return;

    try {
      setLoading(true);
      setError(null);
      const data = await listAgentflowStore();
      setAgentflows(data);
    } catch (err) {
      console.error('Failed to fetch workflow store:', err);
      setError(t('agentflows.store.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [isInitialized, t]);

  useEffect(() => {
    fetchAgentflows();
  }, [fetchAgentflows]);

  // Filter agentflows
  const filteredAgentflows = useMemo(() => {
    return agentflows.filter((agentflow) => {
      const matchesSearch =
        !searchTerm ||
        agentflow.workflowName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agentflow.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agentflow.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesFilter = true;
      if (filterMode === 'my') {
        matchesFilter = !!(user && Number(agentflow.userId) === Number(user.id));
      } else if (filterMode === 'template') {
        matchesFilter = agentflow.isTemplate === true;
      } else if (filterMode === 'shared') {
        matchesFilter =
          agentflow.isTemplate === false && (!user || Number(agentflow.userId) !== Number(user.id));
      }

      return matchesSearch && matchesFilter;
    });
  }, [agentflows, searchTerm, filterMode, user]);

  // Handlers
  const handleDownload = useCallback(
    async (agentflow: AgentflowStoreItem) => {
      try {
        await downloadAgentflowTemplate(
          agentflow.workflowId,
          agentflow.userId,
          agentflow.currentVersion
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

  const handleUploadSubmit = useCallback(async () => {
    if (!uploadTitle.trim()) return;
    setUploading(true);
    try {
      // TODO: API call to upload workflow to store
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsUploadModalOpen(false);
      setUploadTitle('');
      setUploadDescription('');
      setUploadTags('');
      await fetchAgentflows();
    } catch (err) {
      console.error('Failed to upload workflow:', err);
    } finally {
      setUploading(false);
    }
  }, [uploadTitle, fetchAgentflows]);

  const handleCloseUploadModal = useCallback(() => {
    setIsUploadModalOpen(false);
    setUploadTitle('');
    setUploadDescription('');
    setUploadTags('');
  }, []);

  // Build card items
  const cardItems = useMemo(() => {
    return filteredAgentflows.map((agentflow) => {
      const avgRating = calculateAverageRating(agentflow);
      const badges: CardBadge[] = [
        { text: `v${agentflow.currentVersion}`, variant: 'secondary' },
      ];

      if (agentflow.isTemplate) {
        badges.push({ text: t('agentflows.badges.template'), variant: 'purple' });
      }

      if (user && Number(agentflow.userId) === Number(user.id)) {
        badges.push({ text: t('agentflows.badges.my'), variant: 'primary' });
      }

      return {
        id: agentflow.id.toString(),
        data: agentflow,
        title: agentflow.workflowName,
        description: agentflow.description || t('agentflows.store.card.noDescription'),
        thumbnail: {
          icon: <FiBox />,
          backgroundColor: 'rgba(120, 60, 237, 0.1)',
          iconColor: '#783ced',
        },
        badges,
        metadata: [
          { icon: <FiUser />, value: agentflow.username || 'Unknown' },
          { icon: <FiCalendar />, value: formatDate(agentflow.createdAt) },
          { icon: <FiStar />, value: avgRating > 0 ? `${avgRating.toFixed(1)} (${agentflow.ratingCount})` : t('agentflows.store.card.noRating') },
          { value: t('agentflows.card.nodes', { count: agentflow.nodeCount }) },
        ],
        primaryActions: [
          {
            id: 'download',
            icon: <FiDownload />,
            label: t('agentflows.store.actions.download'),
            onClick: () => handleDownload(agentflow),
          },
        ],
        dropdownActions: [],
        onClick: () => {},
      };
    });
  }, [filteredAgentflows, user, handleDownload, t]);

  // Filter tabs
  const filterTabs = [
    { key: 'all', label: t('agentflows.store.filter.all') },
    { key: 'my', label: t('agentflows.store.filter.my') },
    { key: 'template', label: t('agentflows.store.filter.template') },
    { key: 'shared', label: t('agentflows.store.filter.shared') },
  ];

  // Push subToolbar content to orchestrator
  useEffect(() => {
    onSubToolbarChange?.(
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-1 min-w-[200px] max-w-[400px]">
          <div className="relative w-full">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-[18px] h-[18px] pointer-events-none" />
            <input
              type="text"
              placeholder={t('agentflows.store.searchPlaceholder')}
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
            title={t('agentflows.store.upload')}
          >
            <FiUpload />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchAgentflows}
            disabled={loading}
            title={t('agentflows.store.refresh')}
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>
    );
  }, [onSubToolbarChange, searchTerm, filterMode, loading, handleUploadClick, fetchAgentflows, t]);

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
            <p>{t('agentflows.store.loading')}</p>
          </div>
        ) : error ? (
          <EmptyState
            icon={<FiFolder />}
            title={t('agentflows.store.error.title')}
            description={error}
            action={{
              label: t('agentflows.store.buttons.retry'),
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
              title: t('agentflows.store.empty.title'),
              description: searchTerm
                ? t('agentflows.store.empty.searchDescription', { term: searchTerm })
                : t('agentflows.store.empty.description'),
              action: {
                label: t('agentflows.store.empty.action'),
                onClick: handleUploadClick,
              },
            }}
          />
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={handleCloseUploadModal}
        title={t('agentflows.store.uploadModal.title')}
        size="md"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCloseUploadModal}>
              {t('agentflows.store.uploadModal.cancel')}
            </Button>
            <Button onClick={handleUploadSubmit} disabled={uploading || !uploadTitle.trim()}>
              {uploading ? t('agentflows.store.uploadModal.uploading') : t('agentflows.store.uploadModal.upload')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('agentflows.store.uploadModal.description')}</p>

          <div className="space-y-2">
            <Label>{t('agentflows.store.uploadModal.uploadTitle')}</Label>
            <Input
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder={t('agentflows.store.uploadModal.uploadTitlePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('agentflows.store.uploadModal.uploadDescription')}</Label>
            <Textarea
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              placeholder={t('agentflows.store.uploadModal.uploadDescriptionPlaceholder')}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('agentflows.store.uploadModal.tags')}</Label>
            <Input
              value={uploadTags}
              onChange={(e) => setUploadTags(e.target.value)}
              placeholder={t('agentflows.store.uploadModal.tagsPlaceholder')}
            />
            <p className="text-xs text-muted-foreground">{t('agentflows.store.uploadModal.tagsHint')}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AgentflowStore;

export const agentflowStorePlugin: AgentflowTabPlugin = {
  id: 'store',
  name: 'Agentflow Store',
  tabLabelKey: 'agentflows.tabs.store',
  order: 2,
  component: AgentflowStore,
};
