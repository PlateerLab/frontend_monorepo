'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { DocumentTabPlugin, DocumentTabPluginProps, CardBadge } from '@xgen/types';
import { Button, FilterTabs, SearchInput, Modal, Input, Label, Switch, Textarea, ResourceCardGrid } from '@xgen/ui';
import { FiServer, FiFile, FiDatabase, FiClock, FiTrash2, FiLock } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { listStorages, createStorage, deleteStorage, verifyStoragePassword, storeStorageSessionToken, getStorageSessionToken, type FileStorageItem } from './api';
import { StorageFiles } from './components/StorageFiles';
import './locales';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type OwnerFilter = 'all' | 'personal' | 'shared';
type ViewMode = 'list' | 'files';

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const PlusIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch { return dateStr; }
}

// ─────────────────────────────────────────────────────────────
// DocumentStorage Component
// ─────────────────────────────────────────────────────────────

export interface DocumentStorageProps extends DocumentTabPluginProps {}

export const DocumentStorage: React.FC<DocumentStorageProps> = ({ onSubToolbarChange }) => {
  const { t } = useTranslation();

  // ── View Mode ──
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedStorage, setSelectedStorage] = useState<FileStorageItem | null>(null);

  // ── List View State ──
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');
  const [fileStorages, setFileStorages] = useState<FileStorageItem[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newStorageName, setNewStorageName] = useState('');
  const [newStorageDesc, setNewStorageDesc] = useState('');
  const [newStorageEncrypt, setNewStorageEncrypt] = useState(false);
  const [newStoragePassword, setNewStoragePassword] = useState('');
  const [newStoragePasswordConfirm, setNewStoragePasswordConfirm] = useState('');
  const [creating, setCreating] = useState(false);

  // Password verification modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pendingStorage, setPendingStorage] = useState<FileStorageItem | null>(null);
  const [verifyPassword, setVerifyPassword] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listStorages();
      setFileStorages(data);
    } catch (err) {
      console.error('Failed to load file storages:', err);
      setError(t('documents.storage.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const ownerFilterTabs = useMemo(() => [
    { key: 'all', label: t('documents.storage.filters.all') },
    { key: 'personal', label: t('documents.storage.filters.personal') },
    { key: 'shared', label: t('documents.storage.filters.shared') },
  ], [t]);

  // ── View Transitions ──
  const handleSelectStorage = useCallback((storage: FileStorageItem) => {
    if (storage.isSecured) {
      const token = getStorageSessionToken(storage.storageId);
      if (token) {
        setSelectedStorage(storage);
        setViewMode('files');
      } else {
        setPendingStorage(storage);
        setVerifyPassword('');
        setVerifyError(null);
        setIsPasswordModalOpen(true);
      }
    } else {
      setSelectedStorage(storage);
      setViewMode('files');
    }
  }, []);

  const handleBackToList = useCallback(() => {
    setViewMode('list');
    setSelectedStorage(null);
    loadData();
  }, [loadData]);

  // ── CRUD ──
  const handleCreateStorage = useCallback(async () => {
    if (!newStorageName.trim()) return;
    setCreating(true);
    try {
      await createStorage({
        storage_name: newStorageName.trim(),
        description: newStorageDesc.trim() || undefined,
        is_secured: newStorageEncrypt,
        password: newStorageEncrypt ? newStoragePassword : undefined,
      });
      setIsCreateModalOpen(false);
      setNewStorageName('');
      setNewStorageDesc('');
      setNewStorageEncrypt(false);
      setNewStoragePassword('');
      setNewStoragePasswordConfirm('');
      await loadData();
    } catch (err) {
      console.error('Failed to create file storage:', err);
    } finally {
      setCreating(false);
    }
  }, [newStorageName, newStorageDesc, newStorageEncrypt, newStoragePassword, loadData]);

  const handleDeleteStorage = useCallback(async (item: FileStorageItem) => {
    try {
      await deleteStorage(item.storageId);
      await loadData();
    } catch (err) {
      console.error('Failed to delete storage:', err);
    }
  }, [loadData]);

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setNewStorageName('');
    setNewStorageDesc('');
    setNewStorageEncrypt(false);
    setNewStoragePassword('');
    setNewStoragePasswordConfirm('');
  }, []);

  const handleVerifyStoragePassword = useCallback(async () => {
    if (!pendingStorage || !verifyPassword) {
      setVerifyError(t('documents.storage.passwordModal.passwordRequired'));
      return;
    }
    setVerifying(true);
    setVerifyError(null);
    try {
      const result = await verifyStoragePassword(pendingStorage.storageId, verifyPassword);
      const sessionToken = result.session_token;
      if (result.valid && sessionToken) {
        storeStorageSessionToken(pendingStorage.storageId, sessionToken);
        setIsPasswordModalOpen(false);
        setSelectedStorage(pendingStorage);
        setViewMode('files');
        setPendingStorage(null);
        setVerifyPassword('');
      } else {
        setVerifyError(t('documents.storage.passwordModal.passwordIncorrect'));
      }
    } catch {
      setVerifyError(t('documents.storage.passwordModal.passwordIncorrect'));
    } finally {
      setVerifying(false);
    }
  }, [pendingStorage, verifyPassword, t]);

  const handleClosePasswordModal = useCallback(() => {
    setIsPasswordModalOpen(false);
    setPendingStorage(null);
    setVerifyPassword('');
    setVerifyError(null);
  }, []);

  const filteredFileStorages = useMemo(() => {
    return fileStorages.filter(fs => {
      if (search && !fs.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (ownerFilter === 'personal' && fs.isShared) return false;
      if (ownerFilter === 'shared' && !fs.isShared) return false;
      return true;
    });
  }, [fileStorages, search, ownerFilter]);

  // ── Card Items ──
  const cardItems = useMemo(() => {
    return filteredFileStorages.map((fs) => {
      const badges: CardBadge[] = [];
      badges.push({
        text: fs.isShared ? t('documents.storage.filters.shared') : t('documents.storage.filters.personal'),
        variant: fs.isShared ? 'primary' : 'secondary',
      });
      if (fs.isSecured) {
        badges.push({ text: t('documents.storage.createModal.encrypt'), variant: 'purple' });
      }

      return {
        id: fs.id,
        data: fs,
        title: fs.name,
        description: fs.description || undefined,
        thumbnail: {
          icon: <FiServer />,
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          iconColor: '#22c55e',
        },
        badges,
        metadata: [
          { icon: <FiFile />, value: `${fs.fileCount} ${t('documents.storage.files')}` },
          { icon: <FiDatabase />, value: formatSize(fs.totalSize) },
          ...(fs.updatedAt ? [{ icon: <FiClock />, value: formatDate(fs.updatedAt) }] : []),
        ],
        dropdownActions: [],
        primaryActions: [
          {
            id: 'delete',
            icon: <FiTrash2 />,
            label: t('common.delete'),
            danger: true,
            onClick: () => handleDeleteStorage(fs),
          },
        ],
        onClick: () => handleSelectStorage(fs),
      };
    });
  }, [filteredFileStorages, handleDeleteStorage, handleSelectStorage, t]);

  // ── SubToolbar ──
  useEffect(() => {
    if (viewMode !== 'list') {
      onSubToolbarChange?.(null);
      return;
    }
    onSubToolbarChange?.(
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <FilterTabs
          tabs={ownerFilterTabs}
          activeKey={ownerFilter}
          onChange={(key: string) => setOwnerFilter(key as OwnerFilter)}
          variant="underline"
        />
        <div className="flex items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('documents.storage.searchPlaceholder')}
            size="sm"
          />
          <Button size="toolbar" onClick={() => setIsCreateModalOpen(true)}>
            <PlusIcon />
            {t('documents.storage.buttons.newStorage')}
          </Button>
        </div>
      </div>
    );
  }, [onSubToolbarChange, ownerFilterTabs, ownerFilter, search, t, viewMode]);

  useEffect(() => {
    return () => { onSubToolbarChange?.(null); };
  }, [onSubToolbarChange]);

  // ── Render ──

  // Files View (inside storage)
  if (viewMode === 'files' && selectedStorage) {
    return (
      <StorageFiles
        storage={selectedStorage}
        onBack={handleBackToList}
      />
    );
  }

  // List View (default)
  return (
    <div className="flex flex-col flex-1 min-h-0 p-6">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ResourceCardGrid
          items={cardItems}
          loading={loading}
          showEmptyState
          emptyStateProps={{
            icon: <FiServer />,
            title: error || t('documents.storage.empty.title'),
            description: error ? undefined : t('documents.storage.empty.description'),
            action: error
              ? { label: t('common.retry'), onClick: loadData }
              : { label: t('documents.storage.buttons.newStorage'), onClick: () => setIsCreateModalOpen(true) },
          }}
        />
      </div>

      {/* Create Storage Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        title={t('documents.storage.createModal.title')}
        size="md"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCloseCreateModal}>
              {t('documents.storage.createModal.cancel')}
            </Button>
            <Button onClick={handleCreateStorage} disabled={creating || !newStorageName.trim()}>
              {creating ? t('documents.storage.createModal.creating') : t('documents.storage.createModal.create')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('documents.storage.createModal.name')}</Label>
            <Input
              value={newStorageName}
              onChange={(e) => setNewStorageName(e.target.value)}
              placeholder={t('documents.storage.createModal.namePlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('documents.storage.createModal.description')}</Label>
            <Textarea
              value={newStorageDesc}
              onChange={(e) => setNewStorageDesc(e.target.value)}
              placeholder={t('documents.storage.createModal.descriptionPlaceholder')}
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <Label>{t('documents.storage.createModal.encrypt')}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t('documents.storage.createModal.encryptDesc')}</p>
            </div>
            <Switch checked={newStorageEncrypt} onCheckedChange={setNewStorageEncrypt} />
          </div>
          {newStorageEncrypt && (
            <>
              <div className="space-y-2">
                <Label>{t('documents.storage.createModal.password')}</Label>
                <Input
                  type="password"
                  value={newStoragePassword}
                  onChange={(e) => setNewStoragePassword(e.target.value)}
                  placeholder={t('documents.storage.createModal.passwordPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('documents.storage.createModal.passwordConfirm')}</Label>
                <Input
                  type="password"
                  value={newStoragePasswordConfirm}
                  onChange={(e) => setNewStoragePasswordConfirm(e.target.value)}
                  placeholder={t('documents.storage.createModal.passwordConfirmPlaceholder')}
                />
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Password Verification Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={handleClosePasswordModal}
        title={t('documents.storage.passwordModal.title')}
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClosePasswordModal}>
              {t('documents.storage.createModal.cancel')}
            </Button>
            <Button onClick={handleVerifyStoragePassword} disabled={verifying || !verifyPassword}>
              {verifying ? t('documents.storage.passwordModal.verifying') : t('documents.storage.passwordModal.verify')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-2 py-2">
            <FiLock className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm font-medium">{pendingStorage?.name}</p>
            <p className="text-xs text-muted-foreground text-center">
              {t('documents.storage.passwordModal.description')}
            </p>
          </div>
          {verifyError && (
            <p className="text-sm text-destructive text-center">{verifyError}</p>
          )}
          <div className="space-y-2">
            <Label>{t('documents.storage.passwordModal.passwordLabel')}</Label>
            <Input
              type="password"
              value={verifyPassword}
              onChange={(e) => setVerifyPassword(e.target.value)}
              placeholder={t('documents.storage.passwordModal.passwordPlaceholder')}
              onKeyDown={(e) => { if (e.key === 'Enter' && !verifying) handleVerifyStoragePassword(); }}
              autoFocus
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentStorage;

export const documentStoragePlugin: DocumentTabPlugin = {
  id: 'storage',
  name: 'Document Storage',
  tabLabelKey: 'documents.tabs.storage',
  order: 2,
  component: DocumentStorage,
};
