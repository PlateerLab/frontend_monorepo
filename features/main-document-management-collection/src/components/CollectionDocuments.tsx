'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button, Modal, Input, Label, Switch, DirectoryTree, DocumentCard, useUploadStatus, useExternalDrop, isExternalFileDrag, extractFilesFromDataTransfer } from '@xgen/ui';
import type { TreeFolder, TreeFile, ExternalDropResult } from '@xgen/ui';
import { FiArrowLeft, FiFileText, FiChevronRight, FiClock, FiUpload, FiPlus, FiFolder } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import type { CollectionItem, DocumentItem, FolderItem, UploadProgressEvent } from '../api';
import { listDocumentsSummary, deleteDocument, deleteFolderWithDocuments, uploadDocument, createFolder, moveFolder, updateDocumentFolder, ensureFolderStructure } from '../api';

// ─────────────────────────────────────────────────────────────
// Tree Adapters (FolderItem/DocumentItem → TreeFolder/TreeFile)
// ─────────────────────────────────────────────────────────────

function folderToTreeFolder(f: FolderItem): TreeFolder {
  return { id: f.id, name: f.folderName, fullPath: f.fullPath, parentFolderId: f.parentFolderId, isRoot: f.isRoot };
}

function docToTreeFile(doc: DocumentItem): TreeFile {
  return {
    id: doc.documentId,
    name: doc.fileName,
    folderPath: doc.directoryFullPath || '',
    badge: String(doc.totalChunks),
    sortKey: doc.processedAt ? new Date(doc.processedAt).getTime() : 0,
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

function getDocumentsInFolder(
  folder: FolderItem | null,
  documents: DocumentItem[],
  collectionName: string,
  allFolders: FolderItem[]
): DocumentItem[] {
  if (!folder) {
    // Root level: show docs that are NOT inside any known folder
    const folderPaths = new Set(allFolders.map(f => f.fullPath.replace(/\/+$/, '')));
    return documents.filter(doc => {
      const dirPath = (doc.directoryFullPath || '').replace(/\/+$/, '');
      // No path = root level
      if (!dirPath || dirPath === '/') return true;
      // Path matches collection root (e.g., "/CollectionName")
      const parts = dirPath.split('/').filter(Boolean);
      if (parts.length <= 1) return true;
      // Not in any subfolder = root level
      return !folderPaths.has(dirPath);
    });
  }
  const folderPath = folder.fullPath.replace(/\/+$/, '');
  return documents.filter(doc => {
    const dirPath = (doc.directoryFullPath || '').replace(/\/+$/, '');
    return dirPath === folderPath;
  });
}

function getFoldersInFolder(
  currentFolder: FolderItem | null,
  folders: FolderItem[]
): FolderItem[] {
  if (!currentFolder) {
    return folders.filter(f => f.isRoot || f.parentFolderId === null);
  }
  return folders.filter(f => f.parentFolderId === currentFolder.id);
}

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

interface CollectionDocumentsProps {
  collection: CollectionItem;
  onBack: () => void;
  onSelectDocument: (doc: DocumentItem) => void;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const CollectionDocuments: React.FC<CollectionDocumentsProps> = ({
  collection,
  onBack,
  onSelectDocument,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allDocuments, setAllDocuments] = useState<DocumentItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FolderItem | null>(null);
  const [folderPath, setFolderPath] = useState<FolderItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const { addSession, updateSession, registerSessionClickHandler } = useUploadStatus();

  // Register handler so clicking the status panel reopens the upload modal
  React.useEffect(() => {
    registerSessionClickHandler(() => {
      setIsUploadModalOpen(true);
    });
    return () => registerSessionClickHandler(null);
  }, [registerSessionClickHandler]);

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadFilesRelativePaths, setUploadFilesRelativePaths] = useState<Map<File, string>>(new Map());
  const [chunkSize, setChunkSize] = useState('1000');
  const [chunkOverlap, setChunkOverlap] = useState('150');
  const [useOcr, setUseOcr] = useState(false);
  const [useLlm, setUseLlm] = useState(false);
  const [useMeta, setUseMeta] = useState(true);
  const [forceChunk, setForceChunk] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressEvent | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const uploadSessionIdRef = useRef<string | null>(null);

  // External drop confirm state
  const [isDropConfirmOpen, setIsDropConfirmOpen] = useState(false);
  const [pendingDropFiles, setPendingDropFiles] = useState<File[]>([]);
  const [pendingDropRelativePaths, setPendingDropRelativePaths] = useState<Map<File, string>>(new Map());
  const [pendingDropTargetFolder, setPendingDropTargetFolder] = useState<FolderItem | null>(null);
  const [pendingDropTargetPath, setPendingDropTargetPath] = useState<string>('');

  // Create folder modal state
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listDocumentsSummary(collection.name);
      setAllDocuments(data.documents);
      setFolders(data.folders);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError(t('documents.collection.detail.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [collection.name, t]);

  useEffect(() => {
    loadData();
    setCurrentFolder(null);
    setFolderPath([]);
    setCurrentPage(1);
  }, [loadData]);

  // ── Current folder's contents ──
  const currentDocuments = useMemo(
    () => getDocumentsInFolder(currentFolder, allDocuments, collection.name, folders),
    [currentFolder, allDocuments, collection.name, folders]
  );

  const currentFolders = useMemo(
    () => getFoldersInFolder(currentFolder, folders),
    [currentFolder, folders]
  );

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(currentDocuments.length / pageSize));
  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return currentDocuments.slice(start, start + pageSize);
  }, [currentDocuments, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [currentFolder]);

  // ── Folder Navigation ──
  const handleNavigateToFolder = useCallback((folder: FolderItem | null) => {
    if (!folder) {
      // Navigate to root
      setFolderPath([]);
      setCurrentFolder(null);
    } else {
      // Build breadcrumb path from root to target folder
      const buildPath = (target: FolderItem): FolderItem[] => {
        const path: FolderItem[] = [];
        let current: FolderItem | undefined = target;
        while (current && !current.isRoot) {
          path.unshift(current);
          current = folders.find(f => f.id === current!.parentFolderId);
        }
        return path;
      };
      setFolderPath(buildPath(folder));
      setCurrentFolder(folder);
    }
  }, [folders]);

  const handleNavigateUp = useCallback(() => {
    setFolderPath(prev => {
      const next = prev.slice(0, -1);
      setCurrentFolder(next.length > 0 ? next[next.length - 1] : null);
      return next;
    });
  }, []);

  const handleBreadcrumbClick = useCallback((index: number) => {
    if (index < 0) {
      setCurrentFolder(null);
      setFolderPath([]);
    } else {
      const target = folderPath[index];
      setCurrentFolder(target);
      setFolderPath(prev => prev.slice(0, index + 1));
    }
  }, [folderPath]);

  // ── Actions ──
  const handleDeleteDocument = useCallback(async (doc: DocumentItem) => {
    try {
      await deleteDocument(collection.name, doc.documentId);
      await loadData();
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  }, [collection.name, loadData]);

  const handleDeleteFolder = useCallback(async (folder: FolderItem) => {
    try {
      await deleteFolderWithDocuments({
        folder_path: folder.fullPath,
        collection_id: folder.collectionId,
        collection_name: collection.name,
      });
      await loadData();
    } catch (err) {
      console.error('Failed to delete folder:', err);
    }
  }, [collection.name, loadData]);

  // ── Upload ──
  const handleUpload = useCallback(async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadProgress(null);

    // Create a session for the global status panel
    const sessionId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    uploadSessionIdRef.current = sessionId;
    addSession({
      id: sessionId,
      fileName: uploadFile.name,
      targetName: collection.displayName,
      status: 'uploading',
      totalChunks: 0,
      processedChunks: 0,
    });

    try {
      await uploadDocument(
        {
          file: uploadFile,
          collection_name: collection.name,
          user_id: user?.user_id,
          chunk_size: parseInt(chunkSize, 10) || 1000,
          chunk_overlap: parseInt(chunkOverlap, 10) || 150,
          use_ocr: useOcr,
          use_llm_metadata: useLlm,
          extract_default_metadata: useMeta,
          force_chunking: forceChunk,
          folder_path: currentFolder?.fullPath || undefined,
        },
        (evt) => {
          setUploadProgress(evt);
          // Map every SSE event to session status for real-time panel updates
          const statusMap: Record<string, 'uploading' | 'processing' | 'embedding' | 'complete' | 'error'> = {
            uploading: 'uploading',
            processing: 'processing',
            embedding: 'embedding',
            complete: 'complete',
            error: 'error',
          };
          const mappedStatus = statusMap[evt.event];
          if (mappedStatus) {
            updateSession(sessionId, {
              status: mappedStatus,
              totalChunks: evt.totalChunks ?? 0,
              processedChunks: evt.processedChunks ?? 0,
              ...(evt.message ? { errorMessage: evt.message } : {}),
            });
          }
        },
      );

      // Upload complete — auto-close modal after delay
      updateSession(sessionId, { status: 'complete' });
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadFile(null);
        setUploadProgress(null);
      }, 2000);
      await loadData();
    } catch (err) {
      console.error('Failed to upload document:', err);
      updateSession(sessionId, { status: 'error', errorMessage: String(err) });
    } finally {
      setUploading(false);
      uploadSessionIdRef.current = null;
    }
  }, [uploadFile, collection.name, collection.displayName, user, chunkSize, chunkOverlap, useOcr, useLlm, useMeta, forceChunk, currentFolder, loadData, addSession, updateSession]);

  const handleCloseUploadModal = useCallback(() => {
    // If uploading, just close the modal — progress continues in the status panel
    setIsUploadModalOpen(false);
    if (!uploading) {
      setUploadFile(null);
      setUploadFiles([]);
      setUploadFilesRelativePaths(new Map());
      setUploadProgress(null);
    }
  }, [uploading]);

  // ── Multi-file upload (from external drop) ──
  const handleUploadMultiple = useCallback(async () => {
    if (uploadFiles.length === 0) return;
    setUploading(true);
    setUploadProgress(null);
    // Auto-close modal immediately — progress shown in status panel
    setIsUploadModalOpen(false);
    const filesToUpload = [...uploadFiles];
    const pathsMap = new Map(uploadFilesRelativePaths);
    setUploadFiles([]);
    setUploadFilesRelativePaths(new Map());
    setUploadFile(null);

    try {
      // Create folder structure before uploading
      const basePath = pendingDropTargetFolder?.fullPath || currentFolder?.fullPath || undefined;
      await ensureFolderStructure(
        pathsMap,
        collection.collectionId,
        collection.name,
        collection.displayName,
        basePath,
      );

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const relPath = pathsMap.get(file) || '';

        // Compute target folder_path
        let targetFolderPath = pendingDropTargetFolder?.fullPath || currentFolder?.fullPath || undefined;
        if (relPath) {
          // Append relative path from folder structure
          const lastSlash = relPath.lastIndexOf('/');
          const folderPortion = lastSlash !== -1 ? relPath : relPath;
          targetFolderPath = targetFolderPath
            ? `${targetFolderPath}/${folderPortion}`
            : `/${collection.displayName}/${folderPortion}`;
        }

        const sessionId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        addSession({
          id: sessionId,
          fileName: file.name,
          targetName: collection.displayName,
          status: 'uploading',
          totalChunks: 0,
          processedChunks: 0,
        });

        await uploadDocument(
          {
            file,
            collection_name: collection.name,
            user_id: user?.user_id,
            chunk_size: parseInt(chunkSize, 10) || 1000,
            chunk_overlap: parseInt(chunkOverlap, 10) || 150,
            use_ocr: useOcr,
            use_llm_metadata: useLlm,
            extract_default_metadata: useMeta,
            force_chunking: forceChunk,
            folder_path: targetFolderPath,
          },
          (evt) => {
            setUploadProgress(evt);
            const statusMap: Record<string, 'uploading' | 'processing' | 'embedding' | 'complete' | 'error'> = {
              uploading: 'uploading', processing: 'processing', embedding: 'embedding', complete: 'complete', error: 'error',
            };
            const mappedStatus = statusMap[evt.event];
            if (mappedStatus) {
              updateSession(sessionId, {
                status: mappedStatus,
                totalChunks: evt.totalChunks ?? 0,
                processedChunks: evt.processedChunks ?? 0,
                ...(evt.message ? { errorMessage: evt.message } : {}),
              });
            }
          },
        );
        updateSession(sessionId, { status: 'complete' });
      }
      setUploadProgress(null);
      await loadData();
    } catch (err) {
      console.error('Failed to upload documents:', err);
    } finally {
      setUploading(false);
      setPendingDropTargetFolder(null);
    }
  }, [uploadFiles, uploadFilesRelativePaths, pendingDropTargetFolder, currentFolder, collection, user, chunkSize, chunkOverlap, useOcr, useLlm, useMeta, forceChunk, loadData, addSession, updateSession]);

  const handleFolderUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const paths = new Map<File, string>();
    for (const file of fileArray) {
      const fullPath = (file as any).webkitRelativePath || '';
      const lastSlash = fullPath.lastIndexOf('/');
      const relPath = lastSlash !== -1 ? fullPath.substring(0, lastSlash) : '';
      paths.set(file, relPath);
    }
    setUploadFiles(fileArray);
    setUploadFilesRelativePaths(paths);
    setIsUploadModalOpen(true);
    if (folderInputRef.current) folderInputRef.current.value = '';
  }, []);

  // ── External Drop Handlers ──
  const handleExternalDropToFolder = useCallback((result: ExternalDropResult, targetFolder: FolderItem | null, targetPath: string) => {
    setPendingDropFiles(result.files);
    setPendingDropRelativePaths(result.relativePaths);
    setPendingDropTargetFolder(targetFolder);
    setPendingDropTargetPath(targetPath || collection.displayName);
    setIsDropConfirmOpen(true);
  }, [collection.displayName]);

  const handleConfirmDrop = useCallback(() => {
    setIsDropConfirmOpen(false);
    // Move files to upload modal with pre-filled files
    setUploadFiles(pendingDropFiles);
    setUploadFilesRelativePaths(pendingDropRelativePaths);
    setIsUploadModalOpen(true);
    setPendingDropFiles([]);
    setPendingDropRelativePaths(new Map());
  }, [pendingDropFiles, pendingDropRelativePaths]);

  const handleCancelDrop = useCallback(() => {
    setIsDropConfirmOpen(false);
    setPendingDropFiles([]);
    setPendingDropRelativePaths(new Map());
    setPendingDropTargetFolder(null);
    setPendingDropTargetPath('');
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

  const handleFolderCardDrop = useCallback(async (e: React.DragEvent, folder: FolderItem) => {
    e.preventDefault();
    e.stopPropagation();
    folderCardDragCounterRef.current.set(folder.id, 0);
    setDropOverFolderCardId(null);
    if (!isExternalFileDrag(e)) return;
    const result = await extractFilesFromDataTransfer(e.dataTransfer);
    if (result.files.length > 0) {
      handleExternalDropToFolder(result, folder, folder.fullPath);
    }
  }, [handleExternalDropToFolder]);

  // External drop on the right panel (cards area) → current folder
  const { isDragOver: isCardAreaDragOver, dropHandlers: cardAreaDropHandlers } = useExternalDrop({
    onDrop: (result) => handleExternalDropToFolder(result, currentFolder, currentFolder?.fullPath || ''),
  });

  // External drop handler for DirectoryTree
  const handleTreeExternalDrop = useCallback((result: ExternalDropResult, targetTreeFolder: TreeFolder | null) => {
    if (targetTreeFolder) {
      const original = folders.find(f => f.id === targetTreeFolder.id);
      handleExternalDropToFolder(result, original || null, original?.fullPath || '');
    } else {
      handleExternalDropToFolder(result, null, '');
    }
  }, [folders, handleExternalDropToFolder]);

  // ── Create Folder ──
  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      await createFolder({
        folder_name: newFolderName.trim(),
        parent_collection_id: collection.collectionId,
        parent_folder_id: currentFolder?.id ?? null,
        parent_folder_name: currentFolder?.folderName ?? null,
        collection_name: collection.name,
      });
      setIsCreateFolderModalOpen(false);
      setNewFolderName('');
      await loadData();
    } catch (err) {
      console.error('Failed to create folder:', err);
    } finally {
      setCreatingFolder(false);
    }
  }, [newFolderName, currentFolder, loadData]);

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
            {collection.displayName}
          </span>
          {folderPath.map((folder, idx) => (
            <React.Fragment key={folder.id}>
              <FiChevronRight className="w-3.5 h-3.5" />
              <span
                className="cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleBreadcrumbClick(idx)}
              >
                {folder.folderName}
              </span>
            </React.Fragment>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground mr-2">
            {currentDocuments.length} {t('documents.collection.documents')}
          </span>
          <Button variant="outline" size="sm" onClick={() => setIsCreateFolderModalOpen(true)}>
            <FiPlus className="w-3.5 h-3.5 mr-1" />
            {t('documents.collection.detail.buttons.createFolder')}
          </Button>
          <Button size="sm" onClick={() => setIsUploadModalOpen(true)}>
            <FiUpload className="w-3.5 h-3.5 mr-1" />
            {t('documents.collection.detail.buttons.upload')}
          </Button>
          <Button size="sm" onClick={() => folderInputRef.current?.click()}>
            <FiFolder className="w-3.5 h-3.5 mr-1" />
            {t('documents.collection.detail.buttons.uploadFolder', '폴더 업로드')}
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
            root={{ displayName: collection.displayName }}
            folders={folders.map(folderToTreeFolder)}
            files={allDocuments.map(docToTreeFile)}
            currentFolder={currentFolder ? folderToTreeFolder(currentFolder) : null}
            loading={loading}
            onNavigateToFolder={(tf) => {
              if (!tf) { handleNavigateToFolder(null); return; }
              const original = folders.find(f => f.id === tf.id);
              if (original) handleNavigateToFolder(original);
            }}
            onSelectFile={(tf) => {
              const doc = allDocuments.find(d => d.documentId === tf.id);
              if (doc) onSelectDocument(doc);
            }}
            onMoveFile={async (tf, targetTf) => {
              const doc = allDocuments.find(d => d.documentId === tf.id);
              if (!doc) return;
              const targetPath = targetTf ? targetTf.fullPath : `/${collection.displayName}`;
              const ownerUserId = collection.ownerUserId !== user?.user_id ? collection.ownerUserId : undefined;
              try {
                await updateDocumentFolder(doc.documentId, collection.name, targetPath, ownerUserId);
                loadData();
              } catch (err) { console.error('Failed to move document:', err); }
            }}
            onMoveFolder={async (tf, targetTf) => {
              const ownerUserId = collection.ownerUserId !== user?.user_id ? collection.ownerUserId : undefined;
              try {
                await moveFolder(tf.id, targetTf?.id ?? null, collection.collectionId, ownerUserId);
                loadData();
              } catch (err) { console.error('Failed to move folder:', err); }
            }}
            onExternalFileDrop={handleTreeExternalDrop}
            title={t('documents.collection.detail.directoryTree.title')}
            fileSuffix={t('documents.collection.detail.directoryTree.filesSuffix')}
            searchPlaceholder={t('documents.collection.detail.directoryTree.searchPlaceholder')}
          />
        </div>

        {/* Document Cards (Right Panel) */}
        <div
          className={`flex-1 min-h-0 overflow-y-auto p-6 relative transition-colors ${isCardAreaDragOver ? 'bg-primary/5' : ''}`}
          {...cardAreaDropHandlers}
        >
        {/* Drop overlay */}
        {isCardAreaDragOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="absolute inset-3 border-2 border-dashed border-primary/50 rounded-xl" />
            <div className="bg-background/90 px-4 py-2 rounded-lg shadow-sm border border-primary/30">
              <p className="text-sm font-medium text-primary">{t('documents.collection.detail.dropOverlay', '파일을 여기에 놓아주세요')}</p>
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
            <Button variant="outline" onClick={loadData}>{t('common.retry')}</Button>
          </div>
        ) : currentFolders.length === 0 && paginatedDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
            <FiFileText className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t('documents.collection.detail.empty')}</p>
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
                    title={folder.folderName}
                    onClick={() => handleNavigateToFolder(folder)}
                    onDelete={() => handleDeleteFolder(folder)}
                  />
                </div>
              ))}

              {/* Document Cards */}
              {paginatedDocuments.map(doc => (
                <DocumentCard
                  key={doc.documentId}
                  variant="file"
                  title={doc.fileName}
                  subtitle={`${doc.totalChunks} chunks${doc.fileSize > 0 ? ` · ${formatSize(doc.fileSize)}` : ''}`}
                  metadata={[
                    ...(doc.processedAt ? [{ icon: <FiClock className="w-3 h-3" />, value: formatDate(doc.processedAt) }] : []),
                  ]}
                  onClick={() => onSelectDocument(doc)}
                  onDelete={() => handleDeleteDocument(doc)}
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
                  onClick={() => setCurrentPage(1)}
                >
                  {'<<'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => p - 1)}
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
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  {'>'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {'>>'}
                </Button>
              </div>
            )}
          </>
        )}
        </div>
      </div>

      {/* Upload Document Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={handleCloseUploadModal}
        title={t('documents.collection.detail.uploadModal.title')}
        size="md"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCloseUploadModal}>
              {t('documents.collection.createModal.cancel')}
            </Button>
            <Button onClick={uploadFiles.length > 0 ? handleUploadMultiple : handleUpload} disabled={uploading || (!uploadFile && uploadFiles.length === 0)}>
              {uploading ? t('documents.collection.detail.uploadModal.uploading') : t('documents.collection.detail.uploadModal.upload')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* File Input */}
          <div className="space-y-2">
            <Label>{t('documents.collection.detail.uploadModal.file')}</Label>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            />
            {uploadFiles.length > 0 ? (
              <div className="max-h-32 overflow-y-auto border border-border rounded-lg p-2 space-y-1">
                {uploadFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FiFileText className="w-3 h-3 shrink-0" />
                    <span className="truncate flex-1">{file.name}</span>
                    <button
                      className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => setUploadFiles(prev => prev.filter((_, i) => i !== idx))}
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground text-center pt-1">{uploadFiles.length}{t('documents.collection.detail.uploadModal.fileCount', '개 파일')}</p>
              </div>
            ) : (
              <div
                className="flex items-center gap-3 p-3 border border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <FiUpload className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {uploadFile ? uploadFile.name : t('documents.collection.detail.uploadModal.selectFile')}
                </span>
              </div>
            )}
          </div>

          {/* Chunk Size & Overlap */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('documents.collection.detail.uploadModal.chunkSize')}</Label>
              <Input
                type="number"
                value={chunkSize}
                onChange={(e) => setChunkSize(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('documents.collection.detail.uploadModal.chunkOverlap')}</Label>
              <Input
                type="number"
                value={chunkOverlap}
                onChange={(e) => setChunkOverlap(e.target.value)}
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between py-1">
              <Label>OCR</Label>
              <Switch checked={useOcr} onCheckedChange={setUseOcr} />
            </div>
            <div className="flex items-center justify-between py-1">
              <Label>LLM Metadata</Label>
              <Switch checked={useLlm} onCheckedChange={setUseLlm} />
            </div>
            <div className="flex items-center justify-between py-1">
              <Label>META</Label>
              <Switch checked={useMeta} onCheckedChange={setUseMeta} />
            </div>
            <div className="flex items-center justify-between py-1">
              <Label>FORCE CHUNK</Label>
              <Switch checked={forceChunk} onCheckedChange={setForceChunk} />
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && uploadProgress && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="animate-pulse">
                  {uploadProgress.event === 'embedding' ? '🧠' : uploadProgress.event === 'processing' ? '⚙️' : '📤'}
                </span>
                <span className="font-medium">
                  {uploadProgress.event === 'embedding'
                    ? t('documents.collection.detail.uploadStatus.embedding')
                    : uploadProgress.event === 'processing'
                      ? t('documents.collection.detail.uploadStatus.processing')
                      : t('documents.collection.detail.uploadStatus.uploading')}
                </span>
                {uploadProgress.totalChunks != null && uploadProgress.totalChunks > 0 && (
                  <span className="text-muted-foreground text-xs ml-auto">
                    {uploadProgress.processedChunks ?? 0}/{uploadProgress.totalChunks}
                  </span>
                )}
              </div>
              {uploadProgress.totalChunks != null && uploadProgress.totalChunks > 0 && (
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${Math.round(((uploadProgress.processedChunks ?? 0) / uploadProgress.totalChunks) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Create Folder Modal */}
      <Modal
        isOpen={isCreateFolderModalOpen}
        onClose={() => { setIsCreateFolderModalOpen(false); setNewFolderName(''); }}
        title={t('documents.collection.detail.createFolderModal.title')}
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setIsCreateFolderModalOpen(false); setNewFolderName(''); }}>
              {t('documents.collection.createModal.cancel')}
            </Button>
            <Button onClick={handleCreateFolder} disabled={creatingFolder || !newFolderName.trim()}>
              {creatingFolder ? t('documents.collection.createModal.creating') : t('documents.collection.createModal.create')}
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          <Label>{t('documents.collection.detail.createFolderModal.name')}</Label>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder={t('documents.collection.detail.createFolderModal.namePlaceholder')}
          />
        </div>
      </Modal>

      {/* Drop Confirm Modal */}
      <Modal
        isOpen={isDropConfirmOpen}
        onClose={handleCancelDrop}
        title={t('documents.collection.detail.dropConfirm.title', '파일 업로드 확인')}
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancelDrop}>
              {t('documents.collection.createModal.cancel')}
            </Button>
            <Button onClick={handleConfirmDrop}>
              {t('documents.collection.detail.dropConfirm.confirm', '임베딩 설정')}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-foreground">
            {pendingDropTargetPath || collection.displayName} {t('documents.collection.detail.dropConfirm.pathSuffix', '경로에')} {pendingDropFiles.length}{t('documents.collection.detail.dropConfirm.fileCountSuffix', '개의 파일을 업로드합니다.')}
          </p>
          {pendingDropFiles.length > 0 && (
            <div className="max-h-40 overflow-y-auto border border-border rounded-lg p-2 space-y-1">
              {pendingDropFiles.slice(0, 20).map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FiFileText className="w-3 h-3 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
              ))}
              {pendingDropFiles.length > 20 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  ... 외 {pendingDropFiles.length - 20}개 파일
                </p>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {t('documents.collection.detail.dropConfirm.hint', '확인 버튼을 누르면 임베딩 옵션을 설정할 수 있습니다.')}
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default CollectionDocuments;
