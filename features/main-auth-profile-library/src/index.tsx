'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  AuthProfileStoreItem,
  AuthProfileStoreFilter,
  AuthProfileTabPluginProps,
  CardBadge,
} from '@xgen/types';
import {
  Button,
  EmptyState,
  ResourceCardGrid,
  FilterTabs,
  SearchInput,
  useToast,
} from '@xgen/ui';
import {
  FiKey,
  FiDownload,
  FiTrash2,
  FiUser,
  FiClock,
  FiRefreshCw,
  FiUpload,
} from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import {
  listAuthProfileStore,
  downloadFromAuthProfileStore,
  deleteFromAuthProfileStore,
} from './api';
import AuthProfileUploadModal from './auth-profile-upload-modal';
import './locales';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\. /g, '. ');
}

function getAuthTypeLabel(authType: string): string {
  const labels: Record<string, string> = {
    bearer: 'Bearer Token',
    api_key: 'API Key',
    oauth2: 'OAuth 2.0',
    basic: 'Basic Auth',
    custom: 'Custom',
  };
  return labels[authType] || authType;
}

// ─────────────────────────────────────────────────────────────
// AuthProfileLibrary Component
// ─────────────────────────────────────────────────────────────

export interface AuthProfileLibraryProps extends AuthProfileTabPluginProps {}

export const AuthProfileLibrary: React.FC<AuthProfileLibraryProps> = ({
  onNavigate,
  onSubToolbarChange,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, isInitialized } = useAuth();

  // State
  const [storeProfiles, setStoreProfiles] = useState<AuthProfileStoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<AuthProfileStoreFilter>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // ─────────────────────────────────────────────────────────
  // Data Fetching
  // ─────────────────────────────────────────────────────────

  const fetchStoreProfiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listAuthProfileStore();
      setStoreProfiles(data);
    } catch (err) {
      console.error('Failed to fetch store profiles:', err);
      setError(t('authProfileLibrary.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchStoreProfiles();
  }, [fetchStoreProfiles]);

  // ─────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────

  const handleDownload = useCallback(async (item: AuthProfileStoreItem) => {
    setDownloading(item.templateId);
    try {
      await downloadFromAuthProfileStore(item.templateId);
      toast.success(t('authProfileLibrary.messages.downloadSuccess', { name: item.name }));
    } catch (err) {
      console.error('Download failed:', err);
      toast.error(t('authProfileLibrary.error.downloadFailed'));
    } finally {
      setDownloading(null);
    }
  }, [t, toast]);

  const handleDelete = useCallback(async (item: AuthProfileStoreItem) => {
    const ok = await toast.confirm({
      title: t('authProfileLibrary.confirm.deleteTitle'),
      message: t('authProfileLibrary.confirm.delete', { name: item.name }),
      variant: 'danger',
      confirmText: t('authProfileLibrary.confirm.confirmDelete'),
      cancelText: t('authProfileLibrary.confirm.cancel'),
    });
    if (!ok) return;

    try {
      await deleteFromAuthProfileStore(item.templateId);
      toast.success(t('authProfileLibrary.messages.deleteSuccess', { name: item.name }));
      await fetchStoreProfiles();
    } catch (err) {
      console.error('Failed to delete from store:', err);
      toast.error(t('authProfileLibrary.messages.deleteFailed', { name: item.name }));
    }
  }, [fetchStoreProfiles, t, toast]);

  // ─────────────────────────────────────────────────────────
  // Filtered Data
  // ─────────────────────────────────────────────────────────

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    storeProfiles.forEach((sp) => {
      sp.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [storeProfiles]);

  const filteredStoreProfiles = useMemo(() => {
    return storeProfiles.filter((sp) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        !search ||
        sp.name?.toLowerCase().includes(search) ||
        sp.description?.toLowerCase().includes(search) ||
        sp.authType?.toLowerCase().includes(search);

      const matchesFilter =
        filterMode === 'all' ||
        (filterMode === 'my' && user && sp.userId === Number(user.id));

      const matchesTag = !selectedTag || sp.tags.includes(selectedTag);

      return matchesSearch && matchesFilter && matchesTag;
    });
  }, [storeProfiles, searchTerm, filterMode, selectedTag, user]);

  // ─────────────────────────────────────────────────────────
  // Filter Tabs
  // ─────────────────────────────────────────────────────────

  const ownerTabs = useMemo(() => [
    { key: 'all', label: t('authProfileLibrary.filter.all') },
    { key: 'my', label: t('authProfileLibrary.filter.my') },
  ], [t]);

  // ─────────────────────────────────────────────────────────
  // Build Card Items
  // ─────────────────────────────────────────────────────────

  const cardItems = useMemo(() => {
    return filteredStoreProfiles.map((item) => {
      const badges: CardBadge[] = [
        {
          text: getAuthTypeLabel(item.authType),
          variant: 'secondary' as const,
        },
      ];

      const primaryActions = [
        {
          id: 'download',
          icon: <FiDownload />,
          label: t('authProfileLibrary.actions.download'),
          onClick: () => handleDownload(item),
          loading: downloading === item.templateId,
        },
      ];

      const isOwner = user && item.userId === Number(user.id);
      const dropdownActions = isOwner
        ? [
            {
              id: 'delete',
              icon: <FiTrash2 />,
              label: t('authProfileLibrary.actions.delete'),
              onClick: () => handleDelete(item),
              danger: true,
            },
          ]
        : [];

      return {
        id: item.templateId,
        data: item,
        title: item.name,
        description: item.description || getAuthTypeLabel(item.authType),
        thumbnail: {
          icon: <FiKey />,
          backgroundColor: 'rgba(48, 94, 235, 0.1)',
          iconColor: '#305eeb',
        },
        badges,
        metadata: [
          { icon: <FiUser />, value: item.username || '-' },
          { icon: <FiClock />, value: formatDate(item.createdAt) },
        ],
        tags: item.tags,
        primaryActions,
        dropdownActions,
        onClick: () => {},
      };
    });
  }, [filteredStoreProfiles, downloading, handleDownload, handleDelete, user, t]);

  // ─────────────────────────────────────────────────────────
  // Push subToolbar content to orchestrator
  // ─────────────────────────────────────────────────────────

  useEffect(() => {
    onSubToolbarChange?.(
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <FilterTabs
            tabs={ownerTabs}
            activeKey={filterMode}
            onChange={(key) => setFilterMode(key as AuthProfileStoreFilter)}
            variant="underline"
          />
        </div>
        <div className="flex items-center gap-2">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={t('authProfileLibrary.searchPlaceholder')}
            size="sm"
            showClear
          />
          <Button variant="outline" size="sm" onClick={fetchStoreProfiles} disabled={loading}>
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsUploadModalOpen(true)}>
            <FiUpload />
          </Button>
        </div>
      </div>,
    );
  }, [onSubToolbarChange, filterMode, loading, searchTerm, fetchStoreProfiles, t, ownerTabs]);

  // Cleanup subToolbar on unmount
  useEffect(() => {
    return () => { onSubToolbarChange?.(null); };
  }, [onSubToolbarChange]);

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 min-h-0 p-6">
      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span
            className={`inline-flex items-center px-3 py-1 border rounded-full text-xs cursor-pointer transition-all ${
              selectedTag === null
                ? 'bg-primary border-primary text-white'
                : 'bg-gray-100 border-border text-muted-foreground hover:bg-gray-200'
            }`}
            onClick={() => setSelectedTag(null)}
          >
            {t('authProfileLibrary.allTags')}
          </span>
          {allTags.map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center px-3 py-1 border rounded-full text-xs cursor-pointer transition-all ${
                selectedTag === tag
                  ? 'bg-primary border-primary text-white'
                  : 'bg-gray-100 border-border text-muted-foreground hover:bg-gray-200'
              }`}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto">
        {error ? (
          <EmptyState
            icon={<FiKey />}
            title={t('authProfileLibrary.error.title')}
            description={error}
            action={{
              label: t('authProfileLibrary.buttons.retry'),
              onClick: fetchStoreProfiles,
            }}
          />
        ) : (
          <ResourceCardGrid
            items={cardItems}
            loading={loading}
            showEmptyState
            emptyStateProps={{
              icon: <FiKey />,
              title: t('authProfileLibrary.empty.title'),
              description: t('authProfileLibrary.empty.description'),
            }}
          />
        )}
      </div>

      {/* Upload to Library Modal */}
      <AuthProfileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => fetchStoreProfiles()}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Tab Plugin Export
// ─────────────────────────────────────────────────────────────

export const authProfileLibraryPlugin = {
  id: 'library',
  name: 'Auth Profile Library',
  tabLabelKey: 'authProfileManagement.tabs.library',
  order: 2,
  component: AuthProfileLibrary,
};
