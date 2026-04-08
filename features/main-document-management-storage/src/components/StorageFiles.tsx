'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button, Modal, Input, Label, DirectoryTree, DocumentCard, useExternalDrop, isExternalFileDrag, extractFilesFromDataTransfer } from '@xgen/ui';
import type { TreeFolder, TreeFile, ExternalDropResult } from '@xgen/ui';
import { FiArrowLeft, FiFile, FiFolder, FiChevronRight, FiClock, FiDownload, FiUpload, FiPlus } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import type { FileStorageItem, StorageFileItem, StorageFolderItem, PaginationInfo } from '../api';
import { listStorageFiles, getStorageFolderTree, deleteStorageFile, deleteStorageFolder, downloadStorageFile, uploadStorageFile, createStorageFolder } from '../api';

// ─────────────────────────────────────────────────────────────
// Tree Adapters (StorageFolderItem/StorageFileItem → TreeFolder/TreeFile)
// ─────────────────────────────────────────────────────────────

function storageFolderToTreeFolder(f: StorageFolderItem): TreeFolder {
  return { id: f.id, name: f.name, fullPath: f.fullPath, parentFolderId: f.parentFolderId, isRoot: f.isRoot };
}

function storageFileToTreeFile(f: StorageFileItem, folders: StorageFolderItem[]): TreeFile {
  // Resolve folderId to the folder's fullPath for tree placement
  let folderPath = '';
  if (f.folderId != null) {
    const folder = folders.find(fl => fl.id === f.folderId);
    if (folder) folderPath = folder.fullPath;
  }
  return {
    id: f.id,
    name: f.fileName,
    folderPath,
    sortKey: f.uploadedAt ? new Date(f.uploadedAt).getTime() : 0,
  };
}

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

  // External drop state
  const [isDropConfirmOpen, setIsDropConfirmOpen] = useState(false);
  const [pendingDropFiles, setPendingDropFiles] = useState<File[]>([]);
  const [pendingDropRelativePaths, setPendingDropRelativePaths] = useState<Map<File, string>>(new Map());
  const [pendingDropTargetFolderId, setPendingDropTargetFolderId] = useState<number | null>(null);
  const [pendingDropTargetPath, setPendingDropTargetPath] = useState<string>('');

  // Duplicate folder detection state
  const [isDuplicateFolderModalOpen, setIsDuplicateFolderModalOpen] = useState(false);
  const [duplicateFolderNames, setDuplicateFolderNames] = useState<string[]>([]);
  const [pendingUploadFiles, setPendingUploadFiles] = useState<File[]>([]);
  const [pendingUploadRelativePaths, setPendingUploadRelativePaths] = useState<Map<File, string>>(new Map());
  const [pendingUploadFolderId, setPendingUploadFolderId] = useState<number | null>(null);

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
      if (data.folders.length > 0) {
        setAllFolders(prev => prev.length === 0 ? data.folders : prev);
      }
    } catch (err) {
      console.error('Failed to load files:', err);
      setError(t('documents.storage.detail.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [storage.storageId, t]);

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

  // ── Filter files to only show those belonging to the current folder level ──
  // Without this, the backend returns ALL files (including nested) when no folder_id is specified.
  const currentFiles = useMemo(() => {
    if (currentFolder) {
      // Inside a folder: show files whose folderId matches
      return files.filter(f => f.folderId === currentFolder.id);
    }
    // At root: only show files that are NOT inside any folder
    return files.filter(f => f.folderId == null);
  }, [files, currentFolder]);

  // ── Folder Navigation ──
  const handleNavigateToFolder = useCallback((folder: StorageFolderItem | null) => {
    if (!folder) {
      // Navigate to root
      setFolderPath([]);
      setCurrentFolder(null);
      setCurrentPage(1);
      loadFiles(1, null);
    } else {
      // Build breadcrumb path from root to target folder
      const buildPath = (target: StorageFolderItem): StorageFolderItem[] => {
        const path: StorageFolderItem[] = [];
        let current: StorageFolderItem | undefined = target;
        while (current && !current.isRoot) {
          path.unshift(current);
          current = allFolders.find(f => f.id === current!.parentFolderId);
        }
        return path;
      };
      setFolderPath(buildPath(folder));
      setCurrentFolder(folder);
      setCurrentPage(1);
      loadFiles(1, folder.id);
    }
  }, [loadFiles, allFolders]);

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

  // ── Duplicate folder detection helpers ──
  const getTopLevelFolderNames = useCallback((relativePaths: Map<File, string>): string[] => {
    const names = new Set<string>();
    for (const relPath of relativePaths.values()) {
      if (!relPath) continue;
      const topLevel = relPath.split('/')[0];
      if (topLevel) names.add(topLevel);
    }
    return [...names];
  }, []);

  const findDuplicateFolders = useCallback((topLevelNames: string[], parentFolderId: number | null): string[] => {
    return topLevelNames.filter(name =>
      allFolders.some(f =>
        f.name === name &&
        (parentFolderId != null ? f.parentFolderId === parentFolderId : (f.isRoot || f.parentFolderId === null))
      )
    );
  }, [allFolders]);

  const renameDuplicatePaths = useCallback((relativePaths: Map<File, string>, parentFolderId: number | null): Map<File, string> => {
    const newPaths = new Map<File, string>();
    const renamedMap = new Map<string, string>();

    for (const [file, relPath] of relativePaths) {
      if (!relPath) { newPaths.set(file, relPath); continue; }

      const parts = relPath.split('/');
      const topLevel = parts[0];

      if (!renamedMap.has(topLevel)) {
        const isDuplicate = allFolders.some(f =>
          f.name === topLevel &&
          (parentFolderId != null ? f.parentFolderId === parentFolderId : (f.isRoot || f.parentFolderId === null))
        );
        if (isDuplicate) {
          let counter = 1;
          let newName = `${topLevel} (${counter})`;
          while (allFolders.some(f =>
            f.name === newName &&
            (parentFolderId != null ? f.parentFolderId === parentFolderId : (f.isRoot || f.parentFolderId === null))
          )) {
            counter++;
            newName = `${topLevel} (${counter})`;
          }
          renamedMap.set(topLevel, newName);
        } else {
          renamedMap.set(topLevel, topLevel);
        }
      }

      parts[0] = renamedMap.get(topLevel)!;
      newPaths.set(file, parts.join('/'));
    }
    return newPaths;
  }, [allFolders]);

  // ── Unified upload (called after duplicate resolution) ──
  const executeUpload = useCallback(async (files: File[], relativePaths: Map<File, string>, folderId: number | null) => {
    setUploading(true);
    try {
      for (const file of files) {
        const relPath = relativePaths.get(file) || '';
        const lastSlash = relPath.lastIndexOf('/');
        const folderPart = lastSlash !== -1 ? relPath : (relPath || null);
        await uploadStorageFile({
          file,
          storage_id: storage.storageId,
          folder_id: folderId,
          relative_path: folderPart,
        });
      }
      await loadFolders();
      await loadFiles(currentPage, currentFolder?.id ?? null);
    } catch (err) {
      console.error('Failed to upload files:', err);
    } finally {
      setUploading(false);
    }
  }, [storage.storageId, currentPage, currentFolder, loadFiles, loadFolders]);

  // ── Check duplicates then upload or show modal ──
  const checkDuplicatesAndUpload = useCallback((files: File[], relativePaths: Map<File, string>, folderId: number | null) => {
    const topLevelNames = getTopLevelFolderNames(relativePaths);
    const duplicates = findDuplicateFolders(topLevelNames, folderId);

    if (duplicates.length > 0) {
      setDuplicateFolderNames(duplicates);
      setPendingUploadFiles(files);
      setPendingUploadRelativePaths(relativePaths);
      setPendingUploadFolderId(folderId);
      setIsDuplicateFolderModalOpen(true);
    } else {
      executeUpload(files, relativePaths, folderId);
    }
  }, [getTopLevelFolderNames, findDuplicateFolders, executeUpload]);

  const handleDuplicateMerge = useCallback(() => {
    setIsDuplicateFolderModalOpen(false);
    executeUpload(pendingUploadFiles, pendingUploadRelativePaths, pendingUploadFolderId);
  }, [pendingUploadFiles, pendingUploadRelativePaths, pendingUploadFolderId, executeUpload]);

  const handleDuplicateCreateNew = useCallback(() => {
    setIsDuplicateFolderModalOpen(false);
    const renamedPaths = renameDuplicatePaths(pendingUploadRelativePaths, pendingUploadFolderId);
    executeUpload(pendingUploadFiles, renamedPaths, pendingUploadFolderId);
  }, [pendingUploadFiles, pendingUploadRelativePaths, pendingUploadFolderId, renameDuplicatePaths, executeUpload]);

  const handleDuplicateCancel = useCallback(() => {
    setIsDuplicateFolderModalOpen(false);
    setPendingUploadFiles([]);
    setPendingUploadRelativePaths(new Map());
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

  const handleFolderUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const paths = new Map<File, string>();
    for (const file of fileArray) {
      const fullPath = (file as any).webkitRelativePath || '';
      const lastSlash = fullPath.lastIndexOf('/');
      const relativePath = lastSlash !== -1 ? fullPath.substring(0, lastSlash) : '';
      paths.set(file, relativePath);
    }
    if (folderInputRef.current) folderInputRef.current.value = '';
    checkDuplicatesAndUpload(fileArray, paths, currentFolder?.id ?? null);
  }, [currentFolder, checkDuplicatesAndUpload]);

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

  // ── External Drop ──
  const handleExternalDropToFolder = useCallback((result: ExternalDropResult, targetFolderId: number | null, targetPath: string) => {
    setPendingDropFiles(result.files);
    setPendingDropRelativePaths(result.relativePaths);
    setPendingDropTargetFolderId(targetFolderId);
    setPendingDropTargetPath(targetPath || storage.name);
    setIsDropConfirmOpen(true);
  }, [storage.name]);

  const handleConfirmDrop = useCallback(() => {
    setIsDropConfirmOpen(false);
    checkDuplicatesAndUpload(pendingDropFiles, pendingDropRelativePaths, pendingDropTargetFolderId);
    setPendingDropFiles([]);
    setPendingDropRelativePaths(new Map());
  }, [pendingDropFiles, pendingDropRelativePaths, pendingDropTargetFolderId, checkDuplicatesAndUpload]);

  const handleCancelDrop = useCallback(() => {
    setIsDropConfirmOpen(false);
    setPendingDropFiles([]);
    setPendingDropRelativePaths(new Map());
  }, []);

  // Folder card drop highlight state
  const [dropOverFolderCardId, setDropOverFolderCardId] = useState<number | null>(null);
  const folderCardDragCounterRef = useRef<Map<number, number>>(new Map());

  const handleFolderCardDragEnter = useCallback((e: React.DragEvent, folderId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isExternalFileDrag(e)) return;
    const counter = (folderCardDragCounterRef.current.get(folderId) || 0) + 1;
    folderCardDragCounterRef.current.set(folderId, counter);
    if (counter === 1) setDropOverFolderCardId(folderId);
  }, []);

  const handleFolderCardDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleFolderCardDragLeave = useCallback((e: React.DragEvent, folderId: number) => {
    e.preventDefault();
    e.stopPropagation();
    const counter = (folderCardDragCounterRef.current.get(folderId) || 1) - 1;
    folderCardDragCounterRef.current.set(folderId, Math.max(0, counter));
    if (counter <= 0) {
      setDropOverFolderCardId(prev => prev === folderId ? null : prev);
    }
  }, []);

  const handleFolderCardDrop = useCallback(async (e: React.DragEvent, folder: StorageFolderItem) => {
    e.preventDefault();
    e.stopPropagation();
    folderCardDragCounterRef.current.set(folder.id, 0);
    setDropOverFolderCardId(null);
    if (!isExternalFileDrag(e)) return;
    const result = await extractFilesFromDataTransfer(e.dataTransfer);
    if (result.files.length > 0) {
      handleExternalDropToFolder(result, folder.id, folder.fullPath);
    }
  }, [handleExternalDropToFolder]);

  // External drop on the right panel (cards area) → current folder
  const { isDragOver: isCardAreaDragOver, dropHandlers: cardAreaDropHandlers } = useExternalDrop({
    onDrop: (result) => handleExternalDropToFolder(result, currentFolder?.id ?? null, currentFolder?.fullPath || ''),
  });

  // External drop handler for DirectoryTree
  const handleTreeExternalDrop = useCallback((result: ExternalDropResult, targetTreeFolder: TreeFolder | null) => {
    if (targetTreeFolder) {
      const original = allFolders.find(f => f.id === targetTreeFolder.id);
      handleExternalDropToFolder(result, original?.id ?? null, original?.fullPath || '');
    } else {
      handleExternalDropToFolder(result, null, '');
    }
  }, [allFolders, handleExternalDropToFolder]);

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

      {/* Content: Tree + Cards */}
      <div className="flex flex-1 min-h-0">
        {/* Directory Tree (Left Panel) */}
        <div className="w-64 shrink-0 min-h-0 overflow-hidden">
          <DirectoryTree
            root={{ displayName: storage.name }}
            folders={allFolders.map(storageFolderToTreeFolder)}
            files={files.map(f => storageFileToTreeFile(f, allFolders))}
            currentFolder={currentFolder ? storageFolderToTreeFolder(currentFolder) : null}
            loading={loading}
            onNavigateToFolder={(tf) => {
              if (!tf) { handleNavigateToFolder(null); return; }
              const original = allFolders.find(f => f.id === tf.id);
              if (original) handleNavigateToFolder(original);
            }}
            onExternalFileDrop={handleTreeExternalDrop}
            title={t('documents.storage.detail.directoryTree.title', '디렉토리 구조')}
            fileSuffix={t('documents.storage.detail.directoryTree.filesSuffix', ' 파일')}
            searchPlaceholder={t('documents.storage.detail.directoryTree.searchPlaceholder', '파일 검색...')}
          />
        </div>

        {/* File Cards (Right Panel) */}
        <div
          className={`flex-1 min-h-0 overflow-y-auto p-6 relative transition-colors ${isCardAreaDragOver ? 'bg-primary/5' : ''}`}
          {...cardAreaDropHandlers}
        >
        {/* Drop overlay */}
        {isCardAreaDragOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="absolute inset-3 border-2 border-dashed border-primary/50 rounded-xl" />
            <div className="bg-background/90 px-4 py-2 rounded-lg shadow-sm border border-primary/30">
              <p className="text-sm font-medium text-primary">{t('documents.storage.detail.dropOverlay', '파일을 여기에 놓아주세요')}</p>
            </div>
          </div>
        )}
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
        ) : currentFolders.length === 0 && currentFiles.length === 0 && !currentFolder ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
            <FiFile className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t('documents.storage.detail.empty')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
              {/* Parent Folder Card */}
              {currentFolder && (
                <DocumentCard
                  variant="parent"
                  title=".."
                  onClick={handleNavigateUp}
                />
              )}

              {/* Folder Cards */}
              {currentFolders.map(folder => (
                <div
                  key={`folder-${folder.id}`}
                  className={`rounded-lg transition-all h-fit ${dropOverFolderCardId === folder.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  onDragEnter={(e) => handleFolderCardDragEnter(e, folder.id)}
                  onDragOver={handleFolderCardDragOver}
                  onDragLeave={(e) => handleFolderCardDragLeave(e, folder.id)}
                  onDrop={(e) => handleFolderCardDrop(e, folder)}
                >
                  <DocumentCard
                    variant="folder"
                    title={folder.name || folder.fullPath.split('/').filter(Boolean).pop() || ''}
                    onClick={() => handleNavigateToFolder(folder)}
                    onDelete={() => handleDeleteFolder(folder)}
                  />
                </div>
              ))}

              {/* File Cards */}
              {currentFiles.map(file => (
                <DocumentCard
                  key={file.id}
                  variant="file"
                  title={file.fileName}
                  subtitle={formatSize(file.fileSize)}
                  metadata={[
                    ...(file.uploadedAt ? [{ icon: <FiClock className="w-3 h-3" />, value: formatDate(file.uploadedAt) }] : []),
                  ]}
                  hoverActions={[
                    {
                      id: 'download',
                      icon: <FiDownload className="w-3.5 h-3.5" />,
                      onClick: () => handleDownloadFile(file),
                      title: t('documents.storage.detail.actions.download', '다운로드'),
                    },
                  ]}
                  onDelete={() => handleDeleteFile(file)}
                />
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

      {/* Drop Confirm Modal */}
      <Modal
        isOpen={isDropConfirmOpen}
        onClose={handleCancelDrop}
        title={t('documents.storage.detail.dropConfirm.title', '파일 업로드 확인')}
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancelDrop}>
              {t('documents.storage.createModal.cancel')}
            </Button>
            <Button onClick={handleConfirmDrop}>
              {t('documents.storage.detail.dropConfirm.upload', '업로드')}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-foreground">
            {pendingDropTargetPath || storage.name} {t('documents.storage.detail.dropConfirm.pathSuffix', '경로에')} {pendingDropFiles.length}{t('documents.storage.detail.dropConfirm.fileCountSuffix', '개의 파일을 업로드합니다.')}
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
                  ... {t('documents.storage.detail.dropConfirm.moreFiles', { count: pendingDropFiles.length - 20, defaultValue: `외 ${pendingDropFiles.length - 20}개 파일` })}
                </p>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Duplicate Folder Modal */}
      <Modal
        isOpen={isDuplicateFolderModalOpen}
        onClose={handleDuplicateCancel}
        title={t('documents.storage.detail.duplicateFolder.title', '동일한 폴더가 이미 존재합니다')}
        size="sm"
        footer={<div />}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('documents.storage.detail.duplicateFolder.description', '이미 같은 이름의 폴더가 존재합니다. 어떻게 처리할까요?')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {duplicateFolderNames.map((name, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded text-xs font-medium">
                <FiFolder className="w-3 h-3" />
                {name}
              </span>
            ))}
          </div>
          <div className="space-y-2">
            <button
              onClick={handleDuplicateMerge}
              className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <p className="text-sm font-medium">{t('documents.storage.detail.duplicateFolder.merge', '기존 폴더에 추가')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('documents.storage.detail.duplicateFolder.mergeDesc', '기존 폴더에 파일을 추가합니다')}</p>
            </button>
            <button
              onClick={handleDuplicateCreateNew}
              className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <p className="text-sm font-medium">{t('documents.storage.detail.duplicateFolder.createNew', '새 폴더로 업로드')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('documents.storage.detail.duplicateFolder.createNewDesc', '번호가 붙은 새 폴더를 생성합니다')}</p>
            </button>
            <button
              onClick={handleDuplicateCancel}
              className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <p className="text-sm font-medium text-muted-foreground">{t('documents.storage.detail.duplicateFolder.cancel', '취소')}</p>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StorageFiles;
