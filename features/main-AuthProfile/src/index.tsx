'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  RouteComponentProps,
  MainFeatureModule,
  AuthProfile,
  AuthProfileStoreItem,
  AuthProfileTab,
  AuthProfileFilter,
  AuthProfileStoreFilter,
  CardBadge,
} from '@xgen/types';
import {
  ContentArea,
  FilterTabs,
  Button,
  EmptyState,
  ResourceCard,
  ResourceCardGrid,
  SearchInput,
} from '@xgen/ui';
import {
  FiKey,
  FiPlay,
  FiEdit2,
  FiTrash2,
  FiMoreVertical,
  FiUser,
  FiClock,
  FiRefreshCw,
  FiPlus,
  FiDownload,
  FiUpload,
  FiToggleLeft,
  FiToggleRight,
} from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import {
  listAuthProfiles,
  getAuthProfile,
  deleteAuthProfile,
  testAuthProfile,
  toggleAuthProfileStatus,
  listAuthProfileStore,
  uploadToAuthProfileStore,
  downloadFromAuthProfileStore,
  deleteFromAuthProfileStore,
} from './api';

// 번역 등록 (모듈 로드 시 자동 등록)
import './locales';

// ─────────────────────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────────────────────

const STATUS_BADGE_MAP: Record<string, { textKey: string; variant: CardBadge['variant'] }> = {
  active: { textKey: 'authProfile.filter.active', variant: 'success' },
  inactive: { textKey: 'authProfile.filter.inactive', variant: 'secondary' },
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
// Auth Profile Storage Component
// ─────────────────────────────────────────────────────────────

interface AuthProfilePageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
  activeTab?: AuthProfileTab;
  onTabChange?: (tab: AuthProfileTab) => void;
}

const AuthProfilePage: React.FC<AuthProfilePageProps> = ({
  onNavigate,
  activeTab = 'storage',
  onTabChange,
}) => {
  const { t } = useTranslation();
  const { user, isInitialized } = useAuth();

  // Storage State
  const [profiles, setProfiles] = useState<AuthProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AuthProfileFilter>('all');
  const [testingId, setTestingId] = useState<string | null>(null);

  // Store State
  const [storeProfiles, setStoreProfiles] = useState<AuthProfileStoreItem[]>([]);
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeSearchTerm, setStoreSearchTerm] = useState('');
  const [storeFilterMode, setStoreFilterMode] = useState<AuthProfileStoreFilter>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

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
      setError(t('authProfile.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [isInitialized, t]);

  const fetchStoreProfiles = useCallback(async () => {
    try {
      setStoreLoading(true);
      const data = await listAuthProfileStore();
      setStoreProfiles(data);
    } catch (err) {
      console.error('Failed to fetch store profiles:', err);
    } finally {
      setStoreLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
    fetchStoreProfiles();
  }, [fetchProfiles, fetchStoreProfiles]);

  // ─────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────

  const handleTest = useCallback(async (serviceId: string) => {
    setTestingId(serviceId);
    try {
      const result = await testAuthProfile(serviceId);
      if (result.success) {
        alert(t('authProfile.messages.testSuccess'));
      } else {
        alert(result.message || t('authProfile.messages.testFailed'));
      }
    } catch (err) {
      console.error('Test failed:', err);
      alert(t('authProfile.messages.testFailed'));
    } finally {
      setTestingId(null);
    }
  }, [t]);

  const handleEdit = useCallback(async (profile: AuthProfile) => {
    // Navigate to edit page or open modal
    onNavigate?.(`auth-profile-edit?id=${profile.serviceId}`);
  }, [onNavigate]);

  const handleDelete = useCallback(async (profile: AuthProfile) => {
    if (!confirm(t('authProfile.confirm.delete', { name: profile.name }))) return;
    try {
      await deleteAuthProfile(profile.serviceId);
      await fetchProfiles();
    } catch (err) {
      console.error('Failed to delete:', err);
      alert(t('authProfile.error.deleteFailed'));
    }
  }, [fetchProfiles, t]);

  const handleToggleStatus = useCallback(async (profile: AuthProfile) => {
    try {
      await toggleAuthProfileStatus(profile.serviceId, profile.status);
      await fetchProfiles();
    } catch (err) {
      console.error('Failed to toggle status:', err);
      alert(t('authProfile.error.statusChangeFailed'));
    }
  }, [fetchProfiles, t]);

  const handleDownloadFromStore = useCallback(async (templateId: string) => {
    setDownloading(templateId);
    try {
      await downloadFromAuthProfileStore(templateId);
      alert(t('authProfile.messages.downloadSuccess'));
      await fetchProfiles();
      onTabChange?.('storage');
    } catch (err) {
      console.error('Download failed:', err);
      alert(t('authProfile.error.downloadFailed'));
    } finally {
      setDownloading(null);
    }
  }, [fetchProfiles, onTabChange, t]);

  const handleDeleteFromStore = useCallback(async (item: AuthProfileStoreItem) => {
    if (!confirm(t('authProfile.confirm.deleteFromStore', { name: item.name }))) return;
    try {
      await deleteFromAuthProfileStore(item.templateId);
      await fetchStoreProfiles();
    } catch (err) {
      console.error('Failed to delete from store:', err);
      alert(t('authProfile.error.deleteFailed'));
    }
  }, [fetchStoreProfiles, t]);

  const handleUploadToStore = useCallback(async () => {
    if (!uploadSelectedServiceId) {
      alert(t('authProfile.error.selectProfile'));
      return;
    }
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
      alert(t('authProfile.messages.uploadSuccess'));
      await fetchStoreProfiles();
      setIsUploadModalOpen(false);
      setUploadSelectedServiceId('');
      setUploadTags('');
    } catch (err) {
      console.error('Upload failed:', err);
      alert(t('authProfile.error.uploadFailed'));
    } finally {
      setUploading(false);
    }
  }, [uploadSelectedServiceId, uploadTags, profiles, fetchStoreProfiles, t]);

  const handleCreateNew = useCallback(() => {
    onNavigate?.('auth-profile-new');
  }, [onNavigate]);

  // ─────────────────────────────────────────────────────────
  // Filtered Data
  // ─────────────────────────────────────────────────────────

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      if (statusFilter === 'all') return true;
      return p.status === statusFilter;
    });
  }, [profiles, statusFilter]);

  const allStoreTags = useMemo(() => {
    const tagSet = new Set<string>();
    storeProfiles.forEach((sp) => {
      sp.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [storeProfiles]);

  const filteredStoreProfiles = useMemo(() => {
    return storeProfiles.filter((sp) => {
      // Search filter
      const search = storeSearchTerm.toLowerCase();
      const matchesSearch =
        !search ||
        sp.name?.toLowerCase().includes(search) ||
        sp.description?.toLowerCase().includes(search) ||
        sp.authType?.toLowerCase().includes(search);

      // Owner filter
      const matchesFilter =
        storeFilterMode === 'all' ||
        (storeFilterMode === 'my' && user && sp.userId === Number(user.id));

      // Tag filter
      const matchesTag = !selectedTag || sp.tags.includes(selectedTag);

      return matchesSearch && matchesFilter && matchesTag;
    });
  }, [storeProfiles, storeSearchTerm, storeFilterMode, selectedTag, user]);

  // ─────────────────────────────────────────────────────────
  // Tab Config
  // ─────────────────────────────────────────────────────────

  const tabTabs = [
    { key: 'storage', label: t('authProfile.tabs.storage') },
    { key: 'store', label: t('authProfile.tabs.store') },
  ];

  const statusTabs = [
    { key: 'all', label: t('authProfile.filter.all') },
    { key: 'active', label: t('authProfile.filter.active') },
    { key: 'inactive', label: t('authProfile.filter.inactive') },
  ];

  const storeFilterTabs = [
    { key: 'all', label: t('authProfile.storeFilter.all') },
    { key: 'my', label: t('authProfile.storeFilter.my') },
  ];

  // ─────────────────────────────────────────────────────────
  // Build Card Items (Storage)
  // ─────────────────────────────────────────────────────────

  const storageCardItems = useMemo(() => {
    return filteredProfiles.map((profile) => {
      const badges: CardBadge[] = [];

      // Status badge
      const statusBadge = STATUS_BADGE_MAP[profile.status];
      if (statusBadge) {
        badges.push({ text: t(statusBadge.textKey), variant: statusBadge.variant });
      }

      // Auth type badge
      badges.push({
        text: getAuthTypeLabel(profile.authType),
        variant: 'secondary',
      });

      // Primary actions
      const primaryActions = [
        {
          id: 'test',
          icon: <FiPlay />,
          label: t('authProfile.actions.test'),
          onClick: () => handleTest(profile.serviceId),
          loading: testingId === profile.serviceId,
        },
      ];

      // Dropdown actions
      const dropdownActions = [
        {
          id: 'toggle',
          icon: profile.status === 'active' ? <FiToggleRight /> : <FiToggleLeft />,
          label: profile.status === 'active' ? t('authProfile.actions.deactivate') : t('authProfile.actions.activate'),
          onClick: () => handleToggleStatus(profile),
        },
        {
          id: 'edit',
          icon: <FiEdit2 />,
          label: t('authProfile.actions.edit'),
          onClick: () => handleEdit(profile),
        },
        {
          id: 'upload',
          icon: <FiUpload />,
          label: t('authProfile.actions.uploadToStore'),
          onClick: () => {
            setUploadSelectedServiceId(profile.serviceId);
            setIsUploadModalOpen(true);
          },
        },
        {
          id: 'delete',
          icon: <FiTrash2 />,
          label: t('authProfile.actions.delete'),
          onClick: () => handleDelete(profile),
          danger: true,
          dividerBefore: true,
        },
      ];

      return {
        id: profile.serviceId,
        data: profile,
        title: profile.name,
        description: profile.description,
        thumbnail: {
          icon: <FiKey />,
          backgroundColor: 'rgba(48, 94, 235, 0.1)',
          iconColor: '#305eeb',
        },
        badges,
        metadata: [
          { icon: <FiKey />, value: profile.serviceId },
          { icon: <FiUser />, value: profile.username || '-' },
          { icon: <FiClock />, value: formatDate(profile.createdAt) },
        ],
        primaryActions,
        dropdownActions,
        inactive: profile.status === 'inactive',
        inactiveMessage: t('authProfile.messages.inactive'),
        onClick: () => {},
      };
    });
  }, [filteredProfiles, testingId, handleTest, handleToggleStatus, handleEdit, handleDelete, t]);

  // ─────────────────────────────────────────────────────────
  // Build Card Items (Store)
  // ─────────────────────────────────────────────────────────

  const storeCardItems = useMemo(() => {
    return filteredStoreProfiles.map((item) => {
      const badges: CardBadge[] = [
        {
          text: getAuthTypeLabel(item.authType),
          variant: 'secondary',
        },
      ];

      const primaryActions = [
        {
          id: 'download',
          icon: <FiDownload />,
          label: t('authProfile.actions.download'),
          onClick: () => handleDownloadFromStore(item.templateId),
          loading: downloading === item.templateId,
        },
      ];

      const dropdownActions = [
        {
          id: 'delete',
          icon: <FiTrash2 />,
          label: t('authProfile.actions.delete'),
          onClick: () => handleDeleteFromStore(item),
          danger: true,
        },
      ];

      return {
        id: item.templateId,
        data: item,
        title: item.name,
        description: item.description,
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
  }, [filteredStoreProfiles, downloading, handleDownloadFromStore, handleDeleteFromStore, t]);

  // ─────────────────────────────────────────────────────────
  // Render: Store Tab
  // ─────────────────────────────────────────────────────────

  if (activeTab === 'store') {
    return (
      <ContentArea title={t('authProfile.title')} description={t('authProfile.description')}>
      <div className="p-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-[300px]">
            <FilterTabs
              tabs={tabTabs}
              activeKey={activeTab}
              onChange={(key) => onTabChange?.(key as AuthProfileTab)}
            />
            <SearchInput
              value={storeSearchTerm}
              onChange={setStoreSearchTerm}
              placeholder={t('authProfile.search.placeholder')}
            />
          </div>
          <div className="flex items-center gap-2">
            <FilterTabs
              tabs={storeFilterTabs}
              activeKey={storeFilterMode}
              onChange={(key) => setStoreFilterMode(key as AuthProfileStoreFilter)}
              variant="underline"
            />
            <Button
              variant="icon"
              onClick={fetchStoreProfiles}
              loading={storeLoading}
              title={t('common.refresh')}
            >
              <FiRefreshCw />
            </Button>
          </div>
        </div>

        {/* Tag Filter */}
        {allStoreTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <span
              className={`inline-flex items-center px-4 py-1 border rounded-full text-sm cursor-pointer transition-all ${selectedTag === null ? 'bg-primary border-primary text-white' : 'bg-gray-100 border-border text-muted-foreground hover:bg-gray-200'}`}
              onClick={() => setSelectedTag(null)}
            >
              {t('authProfile.store.allTags')}
            </span>
            {allStoreTags.map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center px-4 py-1 border rounded-full text-sm cursor-pointer transition-all ${selectedTag === tag ? 'bg-primary border-primary text-white' : 'bg-gray-100 border-border text-muted-foreground hover:bg-gray-200'}`}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="min-h-[400px]">
          {storeLoading ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">{t('common.loading')}</div>
          ) : filteredStoreProfiles.length === 0 ? (
            <EmptyState
              icon={<FiKey />}
              title={t('authProfile.store.empty.title')}
              description={t('authProfile.store.empty.description')}
            />
          ) : (
            <ResourceCardGrid
              items={storeCardItems}
              addCard={{
                title: t('authProfile.store.addCard.title'),
                description: t('authProfile.store.addCard.description'),
                onClick: () => {
                  fetchProfiles();
                  setIsUploadModalOpen(true);
                },
              }}
            />
          )}
        </div>

        {/* Upload Modal */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={() => setIsUploadModalOpen(false)}>
            <div className="bg-white rounded-xl p-8 min-w-[400px] max-w-[500px] shadow-md [&_h3]:m-0 [&_h3]:mb-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground" onClick={(e) => e.stopPropagation()}>
              <h3>{t('authProfile.uploadModal.title')}</h3>
              <div className="mb-4 [&_label]:block [&_label]:mb-2 [&_label]:text-sm [&_label]:font-medium [&_label]:text-foreground [&_select]:w-full [&_select]:px-4 [&_select]:py-2 [&_select]:border [&_select]:border-border [&_select]:rounded-lg [&_select]:text-base [&_select]:transition-colors focus:[&_select]:outline-none focus:[&_select]:border-primary">
                <label>{t('authProfile.uploadModal.selectProfile')}</label>
                <select
                  value={uploadSelectedServiceId}
                  onChange={(e) => setUploadSelectedServiceId(e.target.value)}
                >
                  <option value="">{t('authProfile.uploadModal.selectPlaceholder')}</option>
                  {profiles.map((p) => (
                    <option key={p.serviceId} value={p.serviceId}>
                      {p.name} ({p.authType})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4 [&_label]:block [&_label]:mb-2 [&_label]:text-sm [&_label]:font-medium [&_label]:text-foreground [&_input]:w-full [&_input]:px-4 [&_input]:py-2 [&_input]:border [&_input]:border-border [&_input]:rounded-lg [&_input]:text-base [&_input]:transition-colors focus:[&_input]:outline-none focus:[&_input]:border-primary">
                <label>{t('authProfile.uploadModal.tags')}</label>
                <input
                  type="text"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder={t('authProfile.uploadModal.tagsPlaceholder')}
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleUploadToStore} loading={uploading}>
                  {t('authProfile.uploadModal.upload')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      </ContentArea>
    );
  }

  // ─────────────────────────────────────────────────────────
  // Render: Storage Tab (Default)
  // ─────────────────────────────────────────────────────────

  return (
    <ContentArea title={t('authProfile.title')} description={t('authProfile.description')}>
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
          <FilterTabs
            tabs={tabTabs}
            activeKey={activeTab}
            onChange={(key) => onTabChange?.(key as AuthProfileTab)}
          />
        </div>
        <div className="flex items-center gap-2">
          <FilterTabs
            tabs={statusTabs}
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key as AuthProfileFilter)}
            variant="underline"
          />
          <Button variant="primary" onClick={handleCreateNew}>
            <FiPlus />
            {t('authProfile.actions.new')}
          </Button>
          <Button
            variant="icon"
            onClick={fetchProfiles}
            loading={loading}
            title={t('common.refresh')}
          >
            <FiRefreshCw />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">{t('common.loading')}</div>
        ) : error ? (
          <div className="flex items-center justify-center h-[300px] text-red-500">{error}</div>
        ) : filteredProfiles.length === 0 ? (
          <EmptyState
            icon={<FiKey />}
            title={t('authProfile.empty.title')}
            description={t('authProfile.empty.description')}
            action={{
              label: t('authProfile.actions.new'),
              onClick: handleCreateNew,
            }}
          />
        ) : (
          <ResourceCardGrid items={storageCardItems} />
        )}
      </div>
    </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const mainAuthProfileFeature: MainFeatureModule = {
  id: 'main-AuthProfile',
  name: 'Auth Profile',
  sidebarSection: 'workflow',
  sidebarItems: [
    {
      id: 'auth-profile',
      titleKey: 'sidebar.workflow.authProfile.title',
      descriptionKey: 'sidebar.workflow.authProfile.description',
    },
  ],
  routes: {
    'auth-profile': AuthProfilePage,
  },
  requiresAuth: true,
};

export default mainAuthProfileFeature;
