'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { DocumentTabPlugin, DocumentTabPluginProps, CardBadge } from '@xgen/types';
import { Button, FilterTabs, SearchInput, Modal, Input, Label, Switch, Textarea, ResourceCardGrid, useExternalDrop } from '@xgen/ui';
import type { ExternalDropResult } from '@xgen/ui';
import { FiServer, FiFile, FiDatabase, FiClock, FiTrash2, FiLock, FiSettings } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { listStorages, createStorage, deleteStorage, updateStorage, verifyStoragePassword, storeStorageSessionToken, getStorageSessionToken, uploadStorageFile, sha256, type FileStorageItem } from './api';
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

  // Settings modal state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsStorage, setSettingsStorage] = useState<FileStorageItem | null>(null);
  const [settingsName, setSettingsName] = useState('');
  const [settingsShared, setSettingsShared] = useState(false);
  const [settingsSecured, setSettingsSecured] = useState(false);
  const [settingsUpdating, setSettingsUpdating] = useState(false);
  const [settingsPassword, setSettingsPassword] = useState('');
  const [settingsPasswordConfirm, setSettingsPasswordConfirm] = useState('');
  const [settingsChangePassword, setSettingsChangePassword] = useState(false);
  const [settingsCurrentPassword, setSettingsCurrentPassword] = useState('');
  const [settingsCurrentPasswordError, setSettingsCurrentPasswordError] = useState<string | null>(null);

  // External drop state
  const [isDropConfirmOpen, setIsDropConfirmOpen] = useState(false);
  const [pendingDropFiles, setPendingDropFiles] = useState<File[]>([]);
  const [pendingDropRelativePaths, setPendingDropRelativePaths] = useState<Map<File, string>>(new Map());
  const [pendingDropStorage, setPendingDropStorage] = useState<FileStorageItem | null>(null);
  const [dropUploading, setDropUploading] = useState(false);

  // Drop on encrypted storage - need password first
  const [isDropPasswordModalOpen, setIsDropPasswordModalOpen] = useState(false);
  const [dropPasswordStorage, setDropPasswordStorage] = useState<FileStorageItem | null>(null);
  const [dropPassword, setDropPassword] = useState('');
  const [dropPasswordError, setDropPasswordError] = useState<string | null>(null);
  const [dropPasswordVerifying, setDropPasswordVerifying] = useState(false);
  const [pendingDropResult, setPendingDropResult] = useState<ExternalDropResult | null>(null);

  // Drop select storage state (when multiple storages)
  const [isDropSelectOpen, setIsDropSelectOpen] = useState(false);
  const [dropSelectResult, setDropSelectResult] = useState<ExternalDropResult | null>(null);
  const [dropCreateMode, setDropCreateMode] = useState(false);

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
      const createdName = newStorageName.trim();
      await createStorage({
        storage_name: createdName,
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
      const updatedData = await listStorages();
      setFileStorages(updatedData);

      // If came from drop select flow, auto-proceed with upload
      if (dropCreateMode && dropSelectResult) {
        const newStorage = updatedData.find(s => s.name === createdName);
        if (newStorage) {
          setIsDropSelectOpen(false);
          setDropCreateMode(false);
          if (newStorage.isSecured) {
            const token = getStorageSessionToken(newStorage.storageId);
            if (!token) {
              setDropPasswordStorage(newStorage);
              setPendingDropResult(dropSelectResult);
              setDropPassword('');
              setDropPasswordError(null);
              setIsDropPasswordModalOpen(true);
              setDropSelectResult(null);
              return;
            }
          }
          setPendingDropStorage(newStorage);
          setPendingDropFiles(dropSelectResult.files);
          setPendingDropRelativePaths(dropSelectResult.relativePaths);
          setDropSelectResult(null);
          setIsDropConfirmOpen(true);
        }
      }
    } catch (err) {
      console.error('Failed to create file storage:', err);
    } finally {
      setCreating(false);
    }
  }, [newStorageName, newStorageDesc, newStorageEncrypt, newStoragePassword, loadData, dropCreateMode, dropSelectResult]);

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
    setDropCreateMode(false);
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

  // ── Settings ──
  const handleOpenSettings = useCallback((storage: FileStorageItem) => {
    setSettingsStorage(storage);
    setSettingsName(storage.name);
    setSettingsShared(storage.isShared);
    setSettingsSecured(storage.isSecured);
    setSettingsChangePassword(false);
    setSettingsPassword('');
    setSettingsPasswordConfirm('');
    setSettingsCurrentPassword('');
    setSettingsCurrentPasswordError(null);
    setIsSettingsModalOpen(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setIsSettingsModalOpen(false);
    setSettingsStorage(null);
    setSettingsChangePassword(false);
    setSettingsPassword('');
    setSettingsPasswordConfirm('');
    setSettingsCurrentPassword('');
    setSettingsCurrentPasswordError(null);
  }, []);

  const handleUpdateStorage = useCallback(async () => {
    if (!settingsStorage || !settingsName.trim()) return;
    if (settingsSecured && settingsChangePassword && settingsPassword && settingsPassword !== settingsPasswordConfirm) return;
    setSettingsUpdating(true);
    setSettingsCurrentPasswordError(null);
    try {
      // Verify current password before disabling encryption
      if (!settingsSecured && settingsStorage.isSecured) {
        if (!settingsCurrentPassword) {
          setSettingsCurrentPasswordError(t('documents.storage.settingsModal.currentPasswordRequired'));
          setSettingsUpdating(false);
          return;
        }
        const verifyResult = await verifyStoragePassword(settingsStorage.storageId, settingsCurrentPassword);
        if (!verifyResult.valid) {
          setSettingsCurrentPasswordError(t('documents.storage.settingsModal.currentPasswordIncorrect'));
          setSettingsUpdating(false);
          return;
        }
      }
      // Verify current password before changing password
      if (settingsSecured && settingsStorage.isSecured && settingsChangePassword) {
        if (!settingsCurrentPassword) {
          setSettingsCurrentPasswordError(t('documents.storage.settingsModal.currentPasswordRequired'));
          setSettingsUpdating(false);
          return;
        }
        const verifyResult = await verifyStoragePassword(settingsStorage.storageId, settingsCurrentPassword);
        if (!verifyResult.valid) {
          setSettingsCurrentPasswordError(t('documents.storage.settingsModal.currentPasswordIncorrect'));
          setSettingsUpdating(false);
          return;
        }
      }
      const updateData: Record<string, any> = {
        storage_name: settingsName.trim(),
        is_shared: settingsShared,
        is_secured: settingsSecured,
      };
      if (settingsSecured && settingsChangePassword && settingsPassword) {
        updateData.password_hash = await sha256(settingsPassword);
      }
      if (!settingsSecured && settingsStorage.isSecured) {
        updateData.password_hash = null;
      }
      await updateStorage(settingsStorage.storageId, updateData);
      setIsSettingsModalOpen(false);
      setSettingsStorage(null);
      setSettingsChangePassword(false);
      setSettingsPassword('');
      setSettingsPasswordConfirm('');
      setSettingsCurrentPassword('');
      setSettingsCurrentPasswordError(null);
      await loadData();
    } catch (err) {
      console.error('Failed to update storage:', err);
    } finally {
      setSettingsUpdating(false);
    }
  }, [settingsStorage, settingsName, settingsShared, settingsSecured, settingsChangePassword, settingsPassword, settingsPasswordConfirm, settingsCurrentPassword, loadData, t]);

  // ── External Drag & Drop on List View ──
  const handleExternalDrop = useCallback((result: ExternalDropResult) => {
    if (fileStorages.length === 0) return;
    if (fileStorages.length === 1) {
      const target = fileStorages[0];
      if (target.isSecured) {
        const token = getStorageSessionToken(target.storageId);
        if (!token) {
          setDropPasswordStorage(target);
          setPendingDropResult(result);
          setDropPassword('');
          setDropPasswordError(null);
          setIsDropPasswordModalOpen(true);
          return;
        }
      }
      setPendingDropStorage(target);
      setPendingDropFiles(result.files);
      setPendingDropRelativePaths(result.relativePaths);
      setIsDropConfirmOpen(true);
      return;
    }
    // Multiple storages: let user select which storage
    setDropSelectResult(result);
    setIsDropSelectOpen(true);
  }, [fileStorages]);

  const handleSelectDropStorage = useCallback((storageItem: FileStorageItem) => {
    if (!dropSelectResult) return;
    setIsDropSelectOpen(false);
    if (storageItem.isSecured) {
      const token = getStorageSessionToken(storageItem.storageId);
      if (!token) {
        setDropPasswordStorage(storageItem);
        setPendingDropResult(dropSelectResult);
        setDropPassword('');
        setDropPasswordError(null);
        setIsDropPasswordModalOpen(true);
        setDropSelectResult(null);
        return;
      }
    }
    setPendingDropStorage(storageItem);
    setPendingDropFiles(dropSelectResult.files);
    setPendingDropRelativePaths(dropSelectResult.relativePaths);
    setDropSelectResult(null);
    setIsDropConfirmOpen(true);
  }, [dropSelectResult]);

  const handleDropPasswordVerify = useCallback(async () => {
    if (!dropPasswordStorage || !dropPassword || !pendingDropResult) return;
    setDropPasswordVerifying(true);
    setDropPasswordError(null);
    try {
      const result = await verifyStoragePassword(dropPasswordStorage.storageId, dropPassword);
      if (result.valid && result.session_token) {
        storeStorageSessionToken(dropPasswordStorage.storageId, result.session_token);
        setIsDropPasswordModalOpen(false);
        setPendingDropStorage(dropPasswordStorage);
        setPendingDropFiles(pendingDropResult.files);
        setPendingDropRelativePaths(pendingDropResult.relativePaths);
        setDropPasswordStorage(null);
        setPendingDropResult(null);
        setDropPassword('');
        setIsDropConfirmOpen(true);
      } else {
        setDropPasswordError(t('documents.storage.passwordModal.passwordIncorrect'));
      }
    } catch {
      setDropPasswordError(t('documents.storage.passwordModal.passwordIncorrect'));
    } finally {
      setDropPasswordVerifying(false);
    }
  }, [dropPasswordStorage, dropPassword, pendingDropResult, t]);

  const handleCloseDropPasswordModal = useCallback(() => {
    setIsDropPasswordModalOpen(false);
    setDropPasswordStorage(null);
    setPendingDropResult(null);
    setDropPassword('');
    setDropPasswordError(null);
  }, []);

  const handleConfirmDrop = useCallback(async () => {
    if (!pendingDropStorage) return;
    setIsDropConfirmOpen(false);
    setDropUploading(true);
    try {
      for (const file of pendingDropFiles) {
        const relPath = pendingDropRelativePaths.get(file) || '';
        const lastSlash = relPath.lastIndexOf('/');
        const folderPart = lastSlash !== -1 ? relPath : (relPath || null);
        await uploadStorageFile({
          file,
          storage_id: pendingDropStorage.storageId,
          relative_path: folderPart,
        });
      }
      await loadData();
    } catch (err) {
      console.error('Failed to upload dropped files:', err);
    } finally {
      setDropUploading(false);
      setPendingDropFiles([]);
      setPendingDropRelativePaths(new Map());
      setPendingDropStorage(null);
    }
  }, [pendingDropFiles, pendingDropRelativePaths, pendingDropStorage, loadData]);

  const handleCancelDrop = useCallback(() => {
    setIsDropConfirmOpen(false);
    setPendingDropFiles([]);
    setPendingDropRelativePaths(new Map());
    setPendingDropStorage(null);
  }, []);

  const { isDragOver: isListDragOver, dropHandlers: listDropHandlers } = useExternalDrop({
    onDrop: handleExternalDrop,
    disabled: viewMode !== 'list',
  });

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
            id: 'settings',
            icon: <FiSettings />,
            label: t('documents.storage.buttons.settings'),
            onClick: () => handleOpenSettings(fs),
          },
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
  }, [filteredFileStorages, handleDeleteStorage, handleOpenSettings, handleSelectStorage, t]);

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
    <div className={`flex flex-col flex-1 min-h-0 p-6 relative transition-colors ${isListDragOver ? 'bg-primary/5' : ''}`} {...listDropHandlers}>
      {/* Drop overlay */}
      {isListDragOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-3 border-2 border-dashed border-primary/50 rounded-xl" />
          <div className="bg-background/90 px-4 py-2 rounded-lg shadow-sm border border-primary/30">
            <p className="text-sm font-medium text-primary">{t('documents.storage.dropOverlay', '파일 저장소에 파일을 놓아주세요')}</p>
          </div>
        </div>
      )}
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

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={handleCloseSettings}
        title={t('documents.storage.settingsModal.title')}
        size="md"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleCloseSettings}>
              {t('documents.storage.settingsModal.cancel')}
            </Button>
            <Button
              className="flex-1"
              onClick={handleUpdateStorage}
              disabled={settingsUpdating || !settingsName.trim() || (settingsSecured && settingsChangePassword && settingsPassword !== '' && settingsPassword !== settingsPasswordConfirm) || (!settingsSecured && settingsStorage?.isSecured && !settingsCurrentPassword) || (settingsSecured && settingsStorage?.isSecured && settingsChangePassword && !settingsCurrentPassword)}
            >
              {settingsUpdating ? t('documents.storage.settingsModal.updating') : t('documents.storage.settingsModal.update')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Name — editable */}
          <div className="space-y-1">
            <Label>{t('documents.storage.settingsModal.name')}</Label>
            <Input
              value={settingsName}
              onChange={(e) => setSettingsName(e.target.value)}
              placeholder={t('documents.storage.settingsModal.name')}
            />
          </div>

          {/* Sharing — toggle button */}
          <div className="space-y-1">
            <Label>{t('documents.storage.settingsModal.sharing')}</Label>
            <button
              type="button"
              onClick={() => setSettingsShared(!settingsShared)}
              className="w-full px-4 py-2.5 text-sm text-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            >
              {settingsShared ? t('documents.storage.settingsModal.sharingShared') : t('documents.storage.settingsModal.sharingPrivate')}
            </button>
          </div>

          {/* Encryption — toggle button */}
          <div className="space-y-1">
            <Label>{t('documents.storage.settingsModal.encryption')}</Label>
            <button
              type="button"
              onClick={() => {
                const next = !settingsSecured;
                setSettingsSecured(next);
                if (!next) {
                  setSettingsPassword('');
                  setSettingsPasswordConfirm('');
                  setSettingsChangePassword(false);
                } else {
                  setSettingsCurrentPassword('');
                  setSettingsCurrentPasswordError(null);
                  setSettingsChangePassword(false);
                }
              }}
              className={`w-full px-4 py-2.5 text-sm text-center rounded-lg border transition-colors ${
                settingsSecured
                  ? 'border-blue-400 bg-blue-50 text-blue-600'
                  : 'border-gray-200 bg-white text-foreground hover:bg-gray-50'
              }`}
            >
              {settingsSecured ? t('documents.storage.settingsModal.encryptionEnabled') : t('documents.storage.settingsModal.encryptionNone')}
            </button>
          </div>

          {/* Current password field — shown when disabling encryption on an encrypted item */}
          {!settingsSecured && settingsStorage?.isSecured && (
            <div className="space-y-1">
              <Label>{t('documents.storage.settingsModal.currentPassword')}</Label>
              <Input
                type="password"
                value={settingsCurrentPassword}
                onChange={(e) => { setSettingsCurrentPassword(e.target.value); setSettingsCurrentPasswordError(null); }}
                placeholder={t('documents.storage.settingsModal.currentPasswordPlaceholder')}
              />
              {settingsCurrentPasswordError && (
                <p className="text-xs text-red-500 mt-1">{settingsCurrentPasswordError}</p>
              )}
            </div>
          )}

          {/* Password change — shown when encryption is enabled */}
          {settingsSecured && (
            <>
              {settingsStorage?.isSecured && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="settingsChangeStoragePassword"
                    checked={settingsChangePassword}
                    onChange={(e) => {
                      setSettingsChangePassword(e.target.checked);
                      if (!e.target.checked) {
                        setSettingsCurrentPassword('');
                        setSettingsCurrentPasswordError(null);
                        setSettingsPassword('');
                        setSettingsPasswordConfirm('');
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="settingsChangeStoragePassword" className="cursor-pointer text-sm">
                    {t('documents.storage.settingsModal.changePassword')}
                  </Label>
                </div>
              )}
              {(settingsChangePassword || !settingsStorage?.isSecured) && (
                <>
                  {settingsStorage?.isSecured && settingsChangePassword && (
                    <div className="space-y-1">
                      <Label>{t('documents.storage.settingsModal.currentPassword')}</Label>
                      <Input
                        type="password"
                        value={settingsCurrentPassword}
                        onChange={(e) => { setSettingsCurrentPassword(e.target.value); setSettingsCurrentPasswordError(null); }}
                        placeholder={t('documents.storage.settingsModal.currentPasswordPlaceholder')}
                      />
                      {settingsCurrentPasswordError && (
                        <p className="text-xs text-red-500 mt-1">{settingsCurrentPasswordError}</p>
                      )}
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label>{t('documents.storage.settingsModal.newPassword')}</Label>
                    <Input
                      type="password"
                      value={settingsPassword}
                      onChange={(e) => setSettingsPassword(e.target.value)}
                      placeholder={t('documents.storage.settingsModal.newPasswordPlaceholder')}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{t('documents.storage.settingsModal.confirmPassword')}</Label>
                    <Input
                      type="password"
                      value={settingsPasswordConfirm}
                      onChange={(e) => setSettingsPasswordConfirm(e.target.value)}
                      placeholder={t('documents.storage.settingsModal.confirmPasswordPlaceholder')}
                    />
                    {settingsPassword && settingsPasswordConfirm && settingsPassword !== settingsPasswordConfirm && (
                      <p className="text-xs text-red-500 mt-1">{t('documents.storage.settingsModal.passwordMismatch')}</p>
                    )}
                  </div>
                </>
              )}
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

      {/* Drop Confirm Modal */}
      <Modal
        isOpen={isDropConfirmOpen}
        onClose={handleCancelDrop}
        title={t('documents.storage.dropConfirm.title', '파일 업로드 확인')}
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancelDrop}>
              {t('documents.storage.createModal.cancel')}
            </Button>
            <Button onClick={handleConfirmDrop} disabled={dropUploading}>
              {dropUploading ? t('documents.storage.dropConfirm.uploading', '업로드 중...') : t('documents.storage.dropConfirm.upload', '업로드')}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-foreground">
            {pendingDropStorage?.name} {t('documents.storage.dropConfirm.storageSuffix', '저장소')}에 {pendingDropFiles.length}{t('documents.storage.dropConfirm.fileCountSuffix', '개의 파일을 업로드합니다.')}
          </p>
          {pendingDropFiles.length > 0 && (
            <div className="max-h-40 overflow-y-auto border border-border rounded-lg p-2 space-y-1">
              {pendingDropFiles.slice(0, 20).map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FiFile className="w-3 h-3 shrink-0" />
                  <span className="truncate">{file.name}</span>
                  <span className="shrink-0 ml-auto">{formatSize(file.size)}</span>
                </div>
              ))}
              {pendingDropFiles.length > 20 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  ... 외 {pendingDropFiles.length - 20}개 파일
                </p>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Drop Storage Select Modal */}
      <Modal
        isOpen={isDropSelectOpen}
        onClose={() => { setIsDropSelectOpen(false); setDropSelectResult(null); }}
        title={t('documents.storage.dropSelect.title', '업로드할 저장소 선택')}
        size="sm"
      >
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground mb-3">
            {t('documents.storage.dropSelect.description', '파일을 업로드할 저장소를 선택해주세요.')}
          </p>
          {fileStorages.map(fs => (
            <button
              key={fs.id}
              className="w-full flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors text-left"
              onClick={() => handleSelectDropStorage(fs)}
            >
              <FiServer className="w-5 h-5 text-green-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fs.name}</p>
                <p className="text-xs text-muted-foreground">{fs.fileCount} {t('documents.storage.files')}</p>
              </div>
              {fs.isSecured && <FiLock className="w-4 h-4 text-muted-foreground shrink-0" />}
            </button>
          ))}

          {/* Create new storage */}
          <div className="pt-3 mt-2 border-t border-border">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => { setDropCreateMode(true); setIsCreateModalOpen(true); }}
            >
              {t('documents.storage.dropSelect.createNew')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Drop Password Modal */}
      <Modal
        isOpen={isDropPasswordModalOpen}
        onClose={handleCloseDropPasswordModal}
        title={t('documents.storage.passwordModal.title')}
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCloseDropPasswordModal}>
              {t('documents.storage.createModal.cancel')}
            </Button>
            <Button onClick={handleDropPasswordVerify} disabled={dropPasswordVerifying || !dropPassword}>
              {dropPasswordVerifying ? t('documents.storage.passwordModal.verifying') : t('documents.storage.passwordModal.verify')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-2 py-2">
            <FiLock className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm font-medium">{dropPasswordStorage?.name}</p>
            <p className="text-xs text-muted-foreground text-center">
              {t('documents.storage.passwordModal.description')}
            </p>
          </div>
          {dropPasswordError && (
            <p className="text-sm text-destructive text-center">{dropPasswordError}</p>
          )}
          <div className="space-y-2">
            <Label>{t('documents.storage.passwordModal.passwordLabel')}</Label>
            <Input
              type="password"
              value={dropPassword}
              onChange={(e) => setDropPassword(e.target.value)}
              placeholder={t('documents.storage.passwordModal.passwordPlaceholder')}
              onKeyDown={(e) => { if (e.key === 'Enter' && !dropPasswordVerifying) handleDropPasswordVerify(); }}
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
