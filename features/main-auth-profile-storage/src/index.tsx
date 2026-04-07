'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  AuthProfile,
  AuthProfileFilter,
  AuthProfileTabPluginProps,
  CardBadge,
} from '@xgen/types';
import {
  Button,
  EmptyState,
  ResourceCardGrid,
  FilterTabs,
  useToast,
} from '@xgen/ui';
import {
  FiKey,
  FiPlay,
  FiEdit2,
  FiTrash2,
  FiUpload,
  FiUser,
  FiClock,
  FiRefreshCw,
  FiPlus,
  FiToggleLeft,
  FiToggleRight,
} from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import {
  listAuthProfiles,
  deleteAuthProfile,
  testAuthProfile,
  toggleAuthProfileStatus,
  uploadToAuthProfileStore,
} from './api';
import AuthProfileForm from './auth-profile-form';
import './locales';

// ─────────────────────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────────────────────

const STATUS_BADGE_MAP: Record<string, { textKey: string; variant: CardBadge['variant'] }> = {
  active: { textKey: 'authProfileStorage.filter.active', variant: 'success' },
  inactive: { textKey: 'authProfileStorage.filter.inactive', variant: 'secondary' },
};

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
// AuthProfileStorage Component
// ─────────────────────────────────────────────────────────────

export interface AuthProfileStorageProps extends AuthProfileTabPluginProps {}

export const AuthProfileStorage: React.FC<AuthProfileStorageProps> = ({
  onNavigate,
  onSubToolbarChange,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, isInitialized } = useAuth();

  // View mode: storage (list) | create | edit
  type ViewMode = 'storage' | 'create' | 'edit';
  const [viewMode, setViewMode] = useState<ViewMode>('storage');
  const [editingProfile, setEditingProfile] = useState<AuthProfile | null>(null);

  // State
  const [profiles, setProfiles] = useState<AuthProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AuthProfileFilter>('all');
  const [testingId, setTestingId] = useState<string | null>(null);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadSelectedServiceId, setUploadSelectedServiceId] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploading, setUploading] = useState(false);

  // ─────────────────────────────────────────────────────────
  // Data Fetching
  // ─────────────────────────────────────────────────────────

  const fetchProfiles = useCallback(async () => {
    if (!isInitialized) return;
    try {
      setLoading(true);
      setError(null);
      const data = await listAuthProfiles();
      setProfiles(data);
    } catch (err) {
      console.error('Failed to fetch auth profiles:', err);
      setError(t('authProfileStorage.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [isInitialized, t]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // ─────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────

  const handleTest = useCallback(async (serviceId: string) => {
    setTestingId(serviceId);
    try {
      const result = await testAuthProfile(serviceId);
      if (result.success) {
        toast.success(t('authProfileStorage.messages.testSuccess'));
      } else {
        toast.error(result.message || t('authProfileStorage.messages.testFailed'));
      }
    } catch (err) {
      console.error('Test failed:', err);
      toast.error(t('authProfileStorage.error.testFailed'));
    } finally {
      setTestingId(null);
    }
  }, [t, toast]);

  const handleEdit = useCallback((profile: AuthProfile) => {
    setEditingProfile(profile);
    setViewMode('edit');
  }, []);

  const handleDelete = useCallback(async (profile: AuthProfile) => {
    const ok = await toast.confirm({
      title: t('authProfileStorage.confirm.deleteTitle'),
      message: t('authProfileStorage.confirm.delete', { name: profile.name }),
      variant: 'danger',
      confirmText: t('authProfileStorage.confirm.confirmDelete'),
      cancelText: t('authProfileStorage.confirm.cancel'),
    });
    if (!ok) return;

    try {
      await deleteAuthProfile(profile.serviceId);
      toast.success(t('authProfileStorage.messages.deleteSuccess', { name: profile.name }));
      await fetchProfiles();
    } catch (err) {
      console.error('Failed to delete:', err);
      toast.error(t('authProfileStorage.messages.deleteFailed', { name: profile.name }));
    }
  }, [fetchProfiles, t, toast]);

  const handleToggleStatus = useCallback(async (profile: AuthProfile) => {
    try {
      await toggleAuthProfileStatus(profile.serviceId, profile.status);
      toast.success(t('authProfileStorage.messages.statusChanged'));
      await fetchProfiles();
    } catch (err) {
      console.error('Failed to toggle status:', err);
      toast.error(t('authProfileStorage.error.statusChangeFailed'));
    }
  }, [fetchProfiles, t, toast]);

  const handleCreateNew = useCallback(() => {
    setEditingProfile(null);
    setViewMode('create');
  }, []);

  const handleUploadToStore = useCallback(async () => {
    if (!uploadSelectedServiceId) return;
    setUploading(true);
    try {
      const profile = profiles.find((p) => p.serviceId === uploadSelectedServiceId);
      if (!profile) return;

      await uploadToAuthProfileStore({
        serviceId: uploadSelectedServiceId,
        name: profile.name,
        description: profile.description,
        tags: uploadTags ? uploadTags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      });
      toast.success(t('authProfileStorage.messages.uploadSuccess', { name: profile.name }));
      setIsUploadModalOpen(false);
      setUploadSelectedServiceId('');
      setUploadTags('');
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error(t('authProfileStorage.error.uploadFailed'));
    } finally {
      setUploading(false);
    }
  }, [uploadSelectedServiceId, uploadTags, profiles, t, toast]);

  // ─────────────────────────────────────────────────────────
  // Filtered Data
  // ─────────────────────────────────────────────────────────

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      if (statusFilter === 'all') return true;
      return p.status === statusFilter;
    });
  }, [profiles, statusFilter]);

  // ─────────────────────────────────────────────────────────
  // Filter Tabs
  // ─────────────────────────────────────────────────────────

  const statusTabs = useMemo(() => [
    { key: 'all', label: t('authProfileStorage.filter.all'), count: profiles.length },
    { key: 'active', label: t('authProfileStorage.filter.active'), count: profiles.filter((p) => p.status === 'active').length },
    { key: 'inactive', label: t('authProfileStorage.filter.inactive'), count: profiles.filter((p) => p.status === 'inactive').length },
  ], [profiles, t]);

  // ─────────────────────────────────────────────────────────
  // Build Card Items
  // ─────────────────────────────────────────────────────────

  const cardItems = useMemo(() => {
    return filteredProfiles.map((profile) => {
      const badges: CardBadge[] = [];

      const statusBadge = STATUS_BADGE_MAP[profile.status];
      if (statusBadge) {
        badges.push({ text: t(statusBadge.textKey), variant: statusBadge.variant });
      }

      badges.push({
        text: getAuthTypeLabel(profile.authType),
        variant: 'secondary' as const,
      });

      const primaryActions = [
        {
          id: 'test',
          icon: <FiPlay />,
          label: t('authProfileStorage.actions.test'),
          onClick: () => handleTest(profile.serviceId),
          loading: testingId === profile.serviceId,
        },
      ];

      const dropdownActions = [
        {
          id: 'toggle',
          icon: profile.status === 'active' ? <FiToggleRight /> : <FiToggleLeft />,
          label: profile.status === 'active'
            ? t('authProfileStorage.actions.deactivate')
            : t('authProfileStorage.actions.activate'),
          onClick: () => handleToggleStatus(profile),
        },
        {
          id: 'edit',
          icon: <FiEdit2 />,
          label: t('authProfileStorage.actions.edit'),
          onClick: () => handleEdit(profile),
        },
        {
          id: 'upload',
          icon: <FiUpload />,
          label: t('authProfileStorage.actions.uploadToStore'),
          onClick: () => {
            setUploadSelectedServiceId(profile.serviceId);
            setIsUploadModalOpen(true);
          },
        },
        {
          id: 'delete',
          icon: <FiTrash2 />,
          label: t('authProfileStorage.actions.delete'),
          onClick: () => handleDelete(profile),
          danger: true,
          dividerBefore: true,
        },
      ];

      return {
        id: profile.serviceId,
        data: profile,
        title: profile.name,
        description: profile.description || getAuthTypeLabel(profile.authType),
        thumbnail: {
          icon: <FiKey />,
          backgroundColor: 'rgba(48, 94, 235, 0.1)',
          iconColor: '#305eeb',
        },
        badges,
        metadata: [
          { icon: <FiKey />, value: `${profile.authType} · ${profile.serviceId}` },
          { icon: <FiUser />, value: profile.username || '-' },
          { icon: <FiClock />, value: formatDate(profile.createdAt) },
        ],
        primaryActions,
        dropdownActions,
        inactive: profile.status === 'inactive',
        inactiveMessage: t('authProfileStorage.messages.inactive'),
        onClick: () => {},
      };
    });
  }, [filteredProfiles, testingId, handleTest, handleToggleStatus, handleEdit, handleDelete, t]);

  // ─────────────────────────────────────────────────────────
  // Push subToolbar content to orchestrator
  // ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (viewMode !== 'storage') {
      onSubToolbarChange?.(null);
      return;
    }

    onSubToolbarChange?.(
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <FilterTabs
            tabs={statusTabs}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as AuthProfileFilter)}
            variant="underline"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchProfiles} disabled={loading}>
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </Button>
          <Button size="sm" onClick={handleCreateNew}>
            <FiPlus />
            {t('authProfileStorage.actions.new')}
          </Button>
        </div>
      </div>,
    );
  }, [onSubToolbarChange, viewMode, statusFilter, loading, fetchProfiles, t, statusTabs, handleCreateNew]);

  // Cleanup subToolbar on unmount
  useEffect(() => {
    return () => { onSubToolbarChange?.(null); };
  }, [onSubToolbarChange]);

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────

  const handleBackToStorage = useCallback(() => {
    setViewMode('storage');
    setEditingProfile(null);
    fetchProfiles();
  }, [fetchProfiles]);

  // Show form when creating or editing
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <AuthProfileForm
        editingProfile={editingProfile}
        onBack={handleBackToStorage}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 p-6">
      <div className="flex-1 min-h-0 overflow-y-auto">
        {!isInitialized ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
            <p>{t('authProfileStorage.messages.loadingAuth')}</p>
          </div>
        ) : error ? (
          <EmptyState
            icon={<FiKey />}
            title={t('authProfileStorage.error.title')}
            description={error}
            action={{
              label: t('authProfileStorage.buttons.retry'),
              onClick: fetchProfiles,
            }}
          />
        ) : (
          <ResourceCardGrid
            items={cardItems}
            loading={loading}
            showEmptyState
            emptyStateProps={{
              icon: <FiKey />,
              title: t('authProfileStorage.empty.title'),
              description: t('authProfileStorage.empty.description'),
              action: {
                label: t('authProfileStorage.actions.new'),
                onClick: handleCreateNew,
              },
            }}
          />
        )}
      </div>

      {/* Upload to Library Modal */}
      {isUploadModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
          onClick={() => setIsUploadModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl p-8 min-w-[400px] max-w-[500px] shadow-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="m-0 mb-6 text-lg font-semibold text-foreground">
              {t('authProfileStorage.uploadModal.title')}
            </h3>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-foreground">
                {t('authProfileStorage.uploadModal.selectProfile')}
              </label>
              <select
                value={uploadSelectedServiceId}
                onChange={(e) => setUploadSelectedServiceId(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg text-base transition-colors focus:outline-none focus:border-primary"
              >
                <option value="">{t('authProfileStorage.uploadModal.selectPlaceholder')}</option>
                {profiles.map((p) => (
                  <option key={p.serviceId} value={p.serviceId}>
                    {p.name} ({getAuthTypeLabel(p.authType)})
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-foreground">
                {t('authProfileStorage.uploadModal.tags')}
              </label>
              <input
                type="text"
                value={uploadTags}
                onChange={(e) => setUploadTags(e.target.value)}
                placeholder={t('authProfileStorage.uploadModal.tagsPlaceholder')}
                className="w-full px-4 py-2 border border-border rounded-lg text-base transition-colors focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
                {t('authProfileStorage.confirm.cancel')}
              </Button>
              <Button onClick={handleUploadToStore} loading={uploading} disabled={!uploadSelectedServiceId}>
                {t('authProfileStorage.uploadModal.upload')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Tab Plugin Export
// ─────────────────────────────────────────────────────────────

export const authProfileStoragePlugin = {
  id: 'storage',
  name: 'Auth Profile Storage',
  tabLabelKey: 'authProfileManagement.tabs.storage',
  order: 1,
  component: AuthProfileStorage,
};
