'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button, Modal, Input, Label, Switch, DirectoryTree } from '@xgen/ui';
import type { TreeFolder, TreeFile } from '@xgen/ui';
import { FiArrowLeft, FiFileText, FiFolder, FiChevronRight, FiTrash2, FiClock, FiUpload, FiPlus } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import type { CollectionItem, DocumentItem, FolderItem } from '../api';
import { listDocumentsSummary, deleteDocument, deleteFolderWithDocuments, uploadDocument, createFolder, moveFolder, updateDocumentFolder } from '../api';

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

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [chunkSize, setChunkSize] = useState('1000');
  const [chunkOverlap, setChunkOverlap] = useState('150');
  const [useOcr, setUseOcr] = useState(false);
  const [useLlm, setUseLlm] = useState(false);
  const [useMeta, setUseMeta] = useState(true);
  const [forceChunk, setForceChunk] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    try {
      await uploadDocument({
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
      });
      setIsUploadModalOpen(false);
      setUploadFile(null);
      await loadData();
    } catch (err) {
      console.error('Failed to upload document:', err);
    } finally {
      setUploading(false);
    }
  }, [uploadFile, collection.name, chunkSize, chunkOverlap, useOcr, useLlm, useMeta, forceChunk, currentFolder, loadData]);

  const handleCloseUploadModal = useCallback(() => {
    setIsUploadModalOpen(false);
    setUploadFile(null);
  }, []);

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
            title={t('documents.collection.detail.directoryTree.title')}
            fileSuffix={t('documents.collection.detail.directoryTree.filesSuffix')}
            searchPlaceholder={t('documents.collection.detail.directoryTree.searchPlaceholder')}
          />
        </div>

        {/* Document Cards (Right Panel) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
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
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <FiFolder className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{folder.folderName}</p>
                  </div>
                  <button
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                    onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder); }}
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Document Cards */}
              {paginatedDocuments.map(doc => (
                <div
                  key={doc.documentId}
                  className="group flex flex-col p-4 bg-card border border-border rounded-lg cursor-pointer hover:shadow-sm transition-all"
                  onClick={() => onSelectDocument(doc)}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                      <FiFileText className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{doc.fileName}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {doc.totalChunks} chunks
                        {doc.fileSize > 0 && ` · ${formatSize(doc.fileSize)}`}
                      </p>
                    </div>
                    <button
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                      onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc); }}
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-auto">
                    <span className="uppercase">{doc.fileType}</span>
                    {doc.processedAt && (
                      <span className="flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        {formatDate(doc.processedAt)}
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
            <Button onClick={handleUpload} disabled={uploading || !uploadFile}>
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
            <div
              className="flex items-center gap-3 p-3 border border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FiUpload className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {uploadFile ? uploadFile.name : t('documents.collection.detail.uploadModal.selectFile')}
              </span>
            </div>
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
    </div>
  );
};

export default CollectionDocuments;
