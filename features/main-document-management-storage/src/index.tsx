'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { DocumentTabPlugin, DocumentTabPluginProps } from '@xgen/types';
import { Button, EmptyState, FilterTabs, SearchInput, Modal, Input, Label, Switch, Textarea } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import './locales';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type OwnerFilter = 'all' | 'personal' | 'shared';

export interface FileStorageItem {
  id: string;
  name: string;
  fileCount: number;
  totalSize: number;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const StorageIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.667 2.5H3.333c-.92 0-1.666.746-1.666 1.667v3.333c0 .92.746 1.667 1.666 1.667h13.334c.92 0 1.666-.747 1.666-1.667V4.167c0-.92-.746-1.667-1.666-1.667zM16.667 10.833H3.333c-.92 0-1.666.747-1.666 1.667v3.333c0 .921.746 1.667 1.666 1.667h13.334c.92 0 1.666-.746 1.666-1.667V12.5c0-.92-.746-1.667-1.666-1.667z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.833 5.833h.009M5.833 14.167h.009" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const SharedIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.5 4.667a1.75 1.75 0 100-3.5 1.75 1.75 0 000 3.5zM3.5 8.75a1.75 1.75 0 100-3.5 1.75 1.75 0 000 3.5zM10.5 12.833a1.75 1.75 0 100-3.5 1.75 1.75 0 000 3.5zM5.075 7.928l3.858 2.227M5.075 5.845l3.858-2.228" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PlusIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const EmptyIcon: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M28 6H14C12.939 6 11.922 6.421 11.172 7.172C10.421 7.922 10 8.939 10 10V38C10 39.061 10.421 40.078 11.172 40.828C11.922 41.579 12.939 42 14 42H34C35.061 42 36.078 41.579 36.828 40.828C37.579 40.078 38 39.061 38 38V16L28 6Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M28 6V16H38M32 26H16M32 34H16M20 18H16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
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

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

const MOCK_FILE_STORAGES: FileStorageItem[] = [
  {
    id: 'fs-001',
    name: '프로젝트 문서함',
    fileCount: 48,
    totalSize: 125600000,
    isShared: false,
    createdAt: '2025-01-05T10:00:00Z',
    updatedAt: '2025-01-28T09:00:00Z',
  },
  {
    id: 'fs-002',
    name: '공유 자료실',
    fileCount: 120,
    totalSize: 534200000,
    isShared: true,
    createdAt: '2025-01-02T08:00:00Z',
    updatedAt: '2025-01-27T15:00:00Z',
  },
  {
    id: 'fs-003',
    name: '계약서 보관함',
    fileCount: 23,
    totalSize: 45300000,
    isShared: true,
    createdAt: '2025-01-10T12:00:00Z',
    updatedAt: '2025-01-26T14:00:00Z',
  },
];

// ─────────────────────────────────────────────────────────────
// DocumentStorage Component (파일 저장소 탭)
// ─────────────────────────────────────────────────────────────

export interface DocumentStorageProps extends DocumentTabPluginProps {}

export const DocumentStorage: React.FC<DocumentStorageProps> = ({ onSubToolbarChange }) => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');
  const [fileStorages, setFileStorages] = useState<FileStorageItem[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newStorageName, setNewStorageName] = useState('');
  const [newStorageDesc, setNewStorageDesc] = useState('');
  const [newStorageEncrypt, setNewStorageEncrypt] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      setFileStorages(MOCK_FILE_STORAGES);
    } catch (error) {
      console.error('Failed to load file storages:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const ownerFilterTabs = useMemo(() => [
    { key: 'all', label: t('documents.storage.filters.all') },
    { key: 'personal', label: t('documents.storage.filters.personal') },
    { key: 'shared', label: t('documents.storage.filters.shared') },
  ], [t]);

  const handleCreateStorage = useCallback(async () => {
    if (!newStorageName.trim()) return;
    setCreating(true);
    try {
      // TODO: API call to create file storage
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsCreateModalOpen(false);
      setNewStorageName('');
      setNewStorageDesc('');
      setNewStorageEncrypt(false);
      await loadData();
    } catch (error) {
      console.error('Failed to create file storage:', error);
    } finally {
      setCreating(false);
    }
  }, [newStorageName, loadData]);

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setNewStorageName('');
    setNewStorageDesc('');
    setNewStorageEncrypt(false);
  }, []);

  const filteredFileStorages = useMemo(() => {
    return fileStorages.filter(fs => {
      if (search && !fs.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (ownerFilter === 'personal' && fs.isShared) return false;
      if (ownerFilter === 'shared' && !fs.isShared) return false;
      return true;
    });
  }, [fileStorages, search, ownerFilter]);

  // Push subToolbar content to orchestrator
  useEffect(() => {
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
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <PlusIcon />
            {t('documents.storage.buttons.newStorage')}
          </Button>
        </div>
      </div>
    );
  }, [onSubToolbarChange, ownerFilterTabs, ownerFilter, search, t]);

  // Cleanup subToolbar on unmount
  useEffect(() => {
    return () => { onSubToolbarChange?.(null); };
  }, [onSubToolbarChange]);

  return (
    <div className="flex flex-col flex-1 min-h-0 p-6">
      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="w-10 h-10 border-3 border-border border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredFileStorages.length === 0 ? (
          <EmptyState
            icon={<EmptyIcon />}
            title={t('documents.storage.empty.title')}
            description={t('documents.storage.empty.description')}
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {filteredFileStorages.map(fs => (
              <div key={fs.id} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-500">
                  <StorageIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground truncate">{fs.name}</h3>
                    {fs.isShared && (
                      <span className="text-muted-foreground shrink-0"><SharedIcon /></span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex gap-3">
                    <span>{fs.fileCount} {t('documents.storage.files')}</span>
                    <span>{formatSize(fs.totalSize)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
