'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button, Modal, Input, Label } from '@xgen/ui';
import { FiArrowLeft, FiFile, FiFolder, FiChevronRight, FiTrash2, FiClock, FiDownload, FiUpload, FiPlus } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import type { FileStorageItem, StorageFileItem, StorageFolderItem, PaginationInfo } from '../api';
import { listStorageFiles, getStorageFolderTree, deleteStorageFile, deleteStorageFolder, downloadStorageFile, uploadStorageFile, createStorageFolder } from '../api';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch { return dateStr; }
}

function formatSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

interface StorageFilesProps {
  storage: FileStorageItem;
  onBack: () => void;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const StorageFiles: React.FC<StorageFilesProps> = ({ storage, onBack }) => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<StorageFileItem[]>([]);
  const [allFolders, setAllFolders] = useState<StorageFolderItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<StorageFolderItem | null>(null);
  const [folderPath, setFolderPath] = useState<StorageFolderItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Folder upload state
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Create folder state
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  const loadFolders = useCallback(async () => {
    try {
      const folders = await getStorageFolderTree(storage.storageId);
      setAllFolders(folders);
    } catch (err) {
      console.error('Failed to load folders:', err);
    }
  }, [storage.storageId]);

  const loadFiles = useCallback(async (page: number = 1, folderId?: number | null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listStorageFiles(storage.storageId, page, 50, folderId);
      setFiles(data.files);
      setPagination(data.pagination);
      if (data.folders.length > 0 && allFolders.length === 0) {
        setAllFolders(data.folders);
      }
    } catch (err) {
      console.error('Failed to load files:', err);
      setError(t('documents.storage.detail.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [storage.storageId, allFolders.length, t]);

  useEffect(() => {
    loadFolders();
    loadFiles(1, null);
  }, [loadFolders, loadFiles]);

  // ── Current folder's subfolders ──
  const currentFolders = useMemo(() => {
    if (!currentFolder) {
      return allFolders.filter(f => f.isRoot || f.parentFolderId === null);
    }
    return allFolders.filter(f => f.parentFolderId === currentFolder.id);
  }, [currentFolder, allFolders]);

  // ── Folder Navigation ──
  const handleNavigateToFolder = useCallback((folder: StorageFolderItem) => {
    setFolderPath(prev => [...prev, folder]);
    setCurrentFolder(folder);
    setCurrentPage(1);
    loadFiles(1, folder.id);
  }, [loadFiles]);

  const handleNavigateUp = useCallback(() => {
    setFolderPath(prev => {
      const next = prev.slice(0, -1);
      const parentFolder = next.length > 0 ? next[next.length - 1] : null;
      setCurrentFolder(parentFolder);
      setCurrentPage(1);
      loadFiles(1, parentFolder?.id ?? null);
      return next;
    });
  }, [loadFiles]);

  const handleBreadcrumbClick = useCallback((index: number) => {
    if (index < 0) {
      setCurrentFolder(null);
      setFolderPath([]);
      setCurrentPage(1);
      loadFiles(1, null);
    } else {
      const target = folderPath[index];
      setCurrentFolder(target);
      setFolderPath(prev => prev.slice(0, index + 1));
      setCurrentPage(1);
      loadFiles(1, target.id);
    }
  }, [folderPath, loadFiles]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    loadFiles(page, currentFolder?.id ?? null);
  }, [loadFiles, currentFolder]);

  // ── Actions ──
  const handleDeleteFile = useCallback(async (file: StorageFileItem) => {
    try {
      await deleteStorageFile(parseInt(file.id, 10), storage.storageId);
      await loadFiles(currentPage, currentFolder?.id ?? null);
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  }, [currentPage, currentFolder, loadFiles]);

  const handleDeleteFolder = useCallback(async (folder: StorageFolderItem) => {
    try {
      await deleteStorageFolder(folder.id, true, storage.storageId);
      await loadFolders();
      await loadFiles(currentPage, currentFolder?.id ?? null);
    } catch (err) {
      console.error('Failed to delete folder:', err);
    }
  }, [currentPage, currentFolder, loadFolders, loadFiles]);

  const handleDownloadFile = useCallback(async (file: StorageFileItem) => {
    try {
      const blob = await downloadStorageFile(parseInt(file.id, 10), storage.storageId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download file:', err);
    }
  }, []);

  // ── Upload ──
  const handleFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadStorageFile({
        file,
        storage_id: storage.storageId,
        folder_id: currentFolder?.id ?? null,
      });
      await loadFiles(currentPage, currentFolder?.id ?? null);
    } catch (err) {
      console.error('Failed to upload file:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [storage.storageId, currentFolder, currentPage, loadFiles]);

  const handleFolderUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    // Extract folder name from the first file's path
    const firstPath = fileArray[0].webkitRelativePath || '';
    const folderName = firstPath.split('/')[0] || 'uploaded-folder';
    setUploading(true);
    try {
      for (const file of fileArray) {
        await uploadStorageFile({
          file,
          storage_id: storage.storageId,
          folder_id: currentFolder?.id ?? null,
        });
      }
      await loadFolders();
      await loadFiles(currentPage, currentFolder?.id ?? null);
    } catch (err) {
      console.error('Failed to upload folder:', err);
    } finally {
      setUploading(false);
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  }, [storage.storageId, currentFolder, currentPage, loadFiles, loadFolders]);

  // ── Create Folder ──
  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      await createStorageFolder({
        folder_name: newFolderName.trim(),
        storage_id: storage.storageId,
        parent_folder_id: currentFolder?.id ?? null,
      });
      setIsCreateFolderModalOpen(false);
      setNewFolderName('');
      await loadFolders();
      await loadFiles(currentPage, currentFolder?.id ?? null);
    } catch (err) {
      console.error('Failed to create folder:', err);
    } finally {
      setCreatingFolder(false);
    }
  }, [newFolderName, storage.storageId, currentFolder, currentPage, loadFiles, loadFolders]);

  const totalPages = pagination?.totalPages ?? 1;

  // ── Render ──
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <FiArrowLeft />
        </Button>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span
            className="cursor-pointer hover:text-foreground transition-colors"
            onClick={() => handleBreadcrumbClick(-1)}
          >
            {storage.name}
          </span>
          {folderPath.map((folder, idx) => (
            <React.Fragment key={folder.id}>
              <FiChevronRight className="w-3.5 h-3.5" />
              <span
                className="cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleBreadcrumbClick(idx)}
              >
                {folder.name}
              </span>
            </React.Fragment>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground mr-2">
            {pagination ? `${pagination.totalDocuments} ${t('documents.storage.files')}` : ''}
          </span>
          <Button variant="outline" size="sm" onClick={() => setIsCreateFolderModalOpen(true)}>
            <FiPlus className="w-3.5 h-3.5 mr-1" />
            {t('documents.storage.detail.buttons.createFolder')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <FiUpload className="w-3.5 h-3.5 mr-1" />
            {uploading ? t('documents.storage.detail.uploadModal.uploading') : t('documents.storage.detail.buttons.uploadFile')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelected}
          />
          <Button size="sm" onClick={() => folderInputRef.current?.click()}>
            <FiFolder className="w-3.5 h-3.5 mr-1" />
            {t('documents.storage.detail.buttons.uploadFolder')}
          </Button>
          <input
            ref={folderInputRef}
            type="file"
            className="hidden"
            {...({ webkitdirectory: '', directory: '' } as any)}
            multiple
            onChange={handleFolderUpload}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="w-10 h-10 border-3 border-border border-t-primary rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => loadFiles(currentPage, currentFolder?.id ?? null)}>
              {t('common.retry')}
            </Button>
          </div>
        ) : currentFolders.length === 0 && files.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
            <FiFile className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t('documents.storage.detail.empty')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
              {/* Parent Folder Card */}
              {currentFolder && (
                <div
                  className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={handleNavigateUp}
                >
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FiArrowLeft className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">..</span>
                </div>
              )}

              {/* Folder Cards */}
              {currentFolders.map(folder => (
                <div
                  key={`folder-${folder.id}`}
                  className="group flex items-center gap-3 p-4 bg-card border border-border rounded-lg cursor-pointer hover:shadow-sm transition-all"
                  onClick={() => handleNavigateToFolder(folder)}
                >
                  <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                    <FiFolder className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{folder.name}</p>
                  </div>
                  <button
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                    onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder); }}
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* File Cards */}
              {files.map(file => (
                <div
                  key={file.id}
                  className="group flex flex-col p-4 bg-card border border-border rounded-lg hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                      <FiFile className="w-4 h-4 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{file.fileName}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {formatSize(file.fileSize)}
                        {file.fileType && ` · ${file.fileType}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        className="p-1 text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => handleDownloadFile(file)}
                      >
                        <FiDownload className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => handleDeleteFile(file)}
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-auto">
                    {file.uploadedAt && (
                      <span className="flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        {formatDate(file.uploadedAt)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(1)}
                >
                  {'<<'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  {'<'}
                </Button>
                <span className="text-sm text-muted-foreground px-3">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  {'>'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(totalPages)}
                >
                  {'>>'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Folder Modal */}
      <Modal
        isOpen={isCreateFolderModalOpen}
        onClose={() => { setIsCreateFolderModalOpen(false); setNewFolderName(''); }}
        title={t('documents.storage.detail.createFolderModal.title')}
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setIsCreateFolderModalOpen(false); setNewFolderName(''); }}>
              {t('documents.storage.createModal.cancel')}
            </Button>
            <Button onClick={handleCreateFolder} disabled={creatingFolder || !newFolderName.trim()}>
              {creatingFolder ? t('documents.storage.createModal.creating') : t('documents.storage.createModal.create')}
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          <Label>{t('documents.storage.detail.createFolderModal.name')}</Label>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder={t('documents.storage.detail.createFolderModal.namePlaceholder')}
          />
        </div>
      </Modal>
    </div>
  );
};

export default StorageFiles;
