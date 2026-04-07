'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { DocumentTabPlugin, DocumentTabPluginProps, CardBadge } from '@xgen/types';
import { Button, FilterTabs, SearchInput, Modal, Input, Label, Switch, Textarea, ResourceCardGrid, useExternalDrop, useUploadStatus } from '@xgen/ui';
import type { ExternalDropResult } from '@xgen/ui';
import { FiFolder, FiFileText, FiClock, FiTrash2, FiLock, FiSettings } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { listCollections, createCollection, deleteCollection, updateCollection, verifyCollectionPassword, storeCollectionSessionToken, getCollectionSessionToken, sha256, uploadDocument, ensureFolderStructure, type CollectionItem, type DocumentItem, type UploadProgressEvent } from './api';
import { useAuth } from '@xgen/auth-provider';
import { CollectionDocuments } from './components/CollectionDocuments';
import { DocumentDetail } from './components/DocumentDetail';
import './locales';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type OwnerFilter = 'all' | 'personal' | 'shared';
type ViewMode = 'list' | 'documents' | 'document-detail';

// ─────────────────────────────────────────────────────────────
// Icons (for plus button in toolbar)
// ─────────────────────────────────────────────────────────────

const PlusIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch { return dateStr; }
}

// ─────────────────────────────────────────────────────────────
// DocumentCollection Component
// ─────────────────────────────────────────────────────────────

export interface DocumentCollectionProps extends DocumentTabPluginProps {}

export const DocumentCollection: React.FC<DocumentCollectionProps> = ({ onSubToolbarChange }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { addSession, updateSession } = useUploadStatus();

  // ── View Mode ──
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCollection, setSelectedCollection] = useState<CollectionItem | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);

  // ── List View State ──
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');
  const [newCollectionSparse, setNewCollectionSparse] = useState(false);
  const [newCollectionFullText, setNewCollectionFullText] = useState(false);
  const [newCollectionEncrypt, setNewCollectionEncrypt] = useState(false);
  const [newCollectionPassword, setNewCollectionPassword] = useState('');
  const [newCollectionPasswordConfirm, setNewCollectionPasswordConfirm] = useState('');
  const [creating, setCreating] = useState(false);

  // Password verification modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pendingCollection, setPendingCollection] = useState<CollectionItem | null>(null);
  const [verifyPassword, setVerifyPassword] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  // External drop state
  const [isDropConfirmOpen, setIsDropConfirmOpen] = useState(false);
  const [pendingDropFiles, setPendingDropFiles] = useState<File[]>([]);
  const [pendingDropRelativePaths, setPendingDropRelativePaths] = useState<Map<File, string>>(new Map());
  const [pendingDropCollection, setPendingDropCollection] = useState<CollectionItem | null>(null);
  const [dropUploading, setDropUploading] = useState(false);

  // Drop on encrypted collection - need password first
  const [isDropPasswordModalOpen, setIsDropPasswordModalOpen] = useState(false);
  const [dropPasswordCollection, setDropPasswordCollection] = useState<CollectionItem | null>(null);
  const [dropPassword, setDropPassword] = useState('');
  const [dropPasswordError, setDropPasswordError] = useState<string | null>(null);
  const [dropPasswordVerifying, setDropPasswordVerifying] = useState(false);
  const [pendingDropResult, setPendingDropResult] = useState<ExternalDropResult | null>(null);

  // Drop select collection (when multiple)
  const [isDropSelectOpen, setIsDropSelectOpen] = useState(false);
  const [dropSelectResult, setDropSelectResult] = useState<ExternalDropResult | null>(null);
  const [dropCreateMode, setDropCreateMode] = useState(false);

  // Drop upload modal (embedding options)
  const [isDropUploadModalOpen, setIsDropUploadModalOpen] = useState(false);
  const [dropChunkSize, setDropChunkSize] = useState('1000');
  const [dropChunkOverlap, setDropChunkOverlap] = useState('150');
  const [dropUseOcr, setDropUseOcr] = useState(false);
  const [dropUseLlm, setDropUseLlm] = useState(false);
  const [dropUseMeta, setDropUseMeta] = useState(true);
  const [dropForceChunk, setDropForceChunk] = useState(false);

  // Settings modal state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsCollection, setSettingsCollection] = useState<CollectionItem | null>(null);
  const [settingsName, setSettingsName] = useState('');
  const [settingsShared, setSettingsShared] = useState(false);
  const [settingsSecured, setSettingsSecured] = useState(false);
  const [settingsUpdating, setSettingsUpdating] = useState(false);
  const [settingsPassword, setSettingsPassword] = useState('');
  const [settingsPasswordConfirm, setSettingsPasswordConfirm] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCollections();
      setCollections(data);
    } catch (err) {
      console.error('Failed to load collections:', err);
      setError(t('documents.collection.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const ownerFilterTabs = useMemo(() => [
    { key: 'all', label: t('documents.collection.filters.all') },
    { key: 'personal', label: t('documents.collection.filters.personal') },
    { key: 'shared', label: t('documents.collection.filters.shared') },
  ], [t]);

  // ── View Transitions ──
  const handleSelectCollection = useCallback((col: CollectionItem) => {
    if (col.isSecured) {
      // Check if we already have a valid session token
      const token = getCollectionSessionToken(col.name);
      if (token) {
        setSelectedCollection(col);
        setSelectedDocument(null);
        setViewMode('documents');
      } else {
        setPendingCollection(col);
        setVerifyPassword('');
        setVerifyError(null);
        setIsPasswordModalOpen(true);
      }
    } else {
      setSelectedCollection(col);
      setSelectedDocument(null);
      setViewMode('documents');
    }
  }, []);

  const handleSelectDocument = useCallback((doc: DocumentItem) => {
    setSelectedDocument(doc);
    setViewMode('document-detail');
  }, []);

  const handleBackToList = useCallback(() => {
    setViewMode('list');
    setSelectedCollection(null);
    setSelectedDocument(null);
    loadData();
  }, [loadData]);

  const handleBackToDocuments = useCallback(() => {
    setViewMode('documents');
    setSelectedDocument(null);
  }, []);

  // ── CRUD ──
  const handleCreateCollection = useCallback(async () => {
    if (!newCollectionName.trim()) return;
    setCreating(true);
    try {
      const createdName = newCollectionName.trim();
      await createCollection({
        collection_make_name: createdName,
        description: newCollectionDesc.trim() || undefined,
        enable_sparse_vector: newCollectionSparse,
        enable_full_text: newCollectionFullText,
        is_secured: newCollectionEncrypt,
        password: newCollectionEncrypt ? newCollectionPassword : undefined,
      });
      setIsCreateModalOpen(false);
      setNewCollectionName('');
      setNewCollectionDesc('');
      setNewCollectionSparse(false);
      setNewCollectionFullText(false);
      setNewCollectionEncrypt(false);
      setNewCollectionPassword('');
      setNewCollectionPasswordConfirm('');
      const updatedData = await listCollections();
      setCollections(updatedData);

      // If came from drop select flow, auto-proceed with upload
      if (dropCreateMode && dropSelectResult) {
        const newCol = updatedData.find(c => c.name === createdName);
        if (newCol) {
          setIsDropSelectOpen(false);
          setDropCreateMode(false);
          if (newCol.isSecured) {
            const token = getCollectionSessionToken(newCol.name);
            if (!token) {
              setDropPasswordCollection(newCol);
              setPendingDropResult(dropSelectResult);
              setDropPassword('');
              setDropPasswordError(null);
              setIsDropPasswordModalOpen(true);
              setDropSelectResult(null);
              return;
            }
          }
          setPendingDropCollection(newCol);
          setPendingDropFiles(dropSelectResult.files);
          setPendingDropRelativePaths(dropSelectResult.relativePaths);
          setDropSelectResult(null);
          setIsDropConfirmOpen(true);
        }
      }
    } catch (err) {
      console.error('Failed to create collection:', err);
    } finally {
      setCreating(false);
    }
  }, [newCollectionName, newCollectionDesc, newCollectionSparse, newCollectionFullText, newCollectionEncrypt, newCollectionPassword, loadData, dropCreateMode, dropSelectResult]);

  const handleDeleteCollection = useCallback(async (col: CollectionItem) => {
    try {
      await deleteCollection(col.name);
      await loadData();
    } catch (err) {
      console.error('Failed to delete collection:', err);
    }
  }, [loadData]);

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setDropCreateMode(false);
    setNewCollectionName('');
    setNewCollectionDesc('');
    setNewCollectionSparse(false);
    setNewCollectionFullText(false);
    setNewCollectionEncrypt(false);
    setNewCollectionPassword('');
    setNewCollectionPasswordConfirm('');
  }, []);

  const handleVerifyCollectionPassword = useCallback(async () => {
    if (!pendingCollection || !verifyPassword) {
      setVerifyError(t('documents.collection.passwordModal.passwordRequired'));
      return;
    }
    setVerifying(true);
    setVerifyError(null);
    try {
      const result = await verifyCollectionPassword(pendingCollection.name, verifyPassword);
      const sessionToken = result.session_token;
      if (result.valid && sessionToken) {
        storeCollectionSessionToken(pendingCollection.name, sessionToken);
        setIsPasswordModalOpen(false);
        setSelectedCollection(pendingCollection);
        setSelectedDocument(null);
        setViewMode('documents');
        setPendingCollection(null);
        setVerifyPassword('');
      } else {
        setVerifyError(t('documents.collection.passwordModal.passwordIncorrect'));
      }
    } catch {
      setVerifyError(t('documents.collection.passwordModal.passwordIncorrect'));
    } finally {
      setVerifying(false);
    }
  }, [pendingCollection, verifyPassword, t]);

  const handleClosePasswordModal = useCallback(() => {
    setIsPasswordModalOpen(false);
    setPendingCollection(null);
    setVerifyPassword('');
    setVerifyError(null);
  }, []);

  const handleOpenSettings = useCallback((col: CollectionItem) => {
    setSettingsCollection(col);
    setSettingsName(col.displayName);
    setSettingsShared(col.isShared);
    setSettingsSecured(col.isSecured);
    setIsSettingsModalOpen(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setIsSettingsModalOpen(false);
    setSettingsCollection(null);
    setSettingsPassword('');
    setSettingsPasswordConfirm('');
  }, []);

  const handleUpdateCollection = useCallback(async () => {
    if (!settingsCollection || !settingsName.trim()) return;
    if (settingsSecured && settingsPassword && settingsPassword !== settingsPasswordConfirm) return;
    setSettingsUpdating(true);
    try {
      const updateData: Record<string, any> = {
        is_shared: settingsShared,
        is_secured: settingsSecured,
      };
      if (settingsName.trim() !== settingsCollection.displayName) {
        updateData.collection_make_name = settingsName.trim();
      }
      if (settingsSecured && settingsPassword) {
        updateData.password_hash = await sha256(settingsPassword);
      }
      if (!settingsSecured && settingsCollection.isSecured) {
        updateData.password_hash = null;
      }
      await updateCollection(settingsCollection.name, updateData);
      setIsSettingsModalOpen(false);
      setSettingsCollection(null);
      setSettingsPassword('');
      setSettingsPasswordConfirm('');
      await loadData();
    } catch (err) {
      console.error('Failed to update collection:', err);
    } finally {
      setSettingsUpdating(false);
    }
  }, [settingsCollection, settingsName, settingsShared, settingsSecured, settingsPassword, settingsPasswordConfirm, loadData]);

  // ── External Drag & Drop on List View ──
  const handleExternalDrop = useCallback((result: ExternalDropResult) => {
    if (collections.length === 0) return;
    if (collections.length === 1) {
      const target = collections[0];
      if (target.isSecured) {
        const token = getCollectionSessionToken(target.name);
        if (!token) {
          setDropPasswordCollection(target);
          setPendingDropResult(result);
          setDropPassword('');
          setDropPasswordError(null);
          setIsDropPasswordModalOpen(true);
          return;
        }
      }
      setPendingDropCollection(target);
      setPendingDropFiles(result.files);
      setPendingDropRelativePaths(result.relativePaths);
      setIsDropConfirmOpen(true);
      return;
    }
    setDropSelectResult(result);
    setIsDropSelectOpen(true);
  }, [collections]);

  const handleSelectDropCollection = useCallback((col: CollectionItem) => {
    if (!dropSelectResult) return;
    setIsDropSelectOpen(false);
    if (col.isSecured) {
      const token = getCollectionSessionToken(col.name);
      if (!token) {
        setDropPasswordCollection(col);
        setPendingDropResult(dropSelectResult);
        setDropPassword('');
        setDropPasswordError(null);
        setIsDropPasswordModalOpen(true);
        setDropSelectResult(null);
        return;
      }
    }
    setPendingDropCollection(col);
    setPendingDropFiles(dropSelectResult.files);
    setPendingDropRelativePaths(dropSelectResult.relativePaths);
    setDropSelectResult(null);
    setIsDropConfirmOpen(true);
  }, [dropSelectResult]);

  const handleDropPasswordVerify = useCallback(async () => {
    if (!dropPasswordCollection || !dropPassword || !pendingDropResult) return;
    setDropPasswordVerifying(true);
    setDropPasswordError(null);
    try {
      const result = await verifyCollectionPassword(dropPasswordCollection.name, dropPassword);
      if (result.valid && result.session_token) {
        storeCollectionSessionToken(dropPasswordCollection.name, result.session_token);
        setIsDropPasswordModalOpen(false);
        setPendingDropCollection(dropPasswordCollection);
        setPendingDropFiles(pendingDropResult.files);
        setPendingDropRelativePaths(pendingDropResult.relativePaths);
        setDropPasswordCollection(null);
        setPendingDropResult(null);
        setDropPassword('');
        setIsDropConfirmOpen(true);
      } else {
        setDropPasswordError(t('documents.collection.passwordModal.passwordIncorrect'));
      }
    } catch {
      setDropPasswordError(t('documents.collection.passwordModal.passwordIncorrect'));
    } finally {
      setDropPasswordVerifying(false);
    }
  }, [dropPasswordCollection, dropPassword, pendingDropResult, t]);

  const handleCloseDropPasswordModal = useCallback(() => {
    setIsDropPasswordModalOpen(false);
    setDropPasswordCollection(null);
    setPendingDropResult(null);
    setDropPassword('');
    setDropPasswordError(null);
  }, []);

  const handleConfirmDrop = useCallback(() => {
    // Show embedding options modal
    setIsDropConfirmOpen(false);
    setIsDropUploadModalOpen(true);
  }, []);

  const handleCancelDrop = useCallback(() => {
    setIsDropConfirmOpen(false);
    setPendingDropFiles([]);
    setPendingDropRelativePaths(new Map());
    setPendingDropCollection(null);
  }, []);

  const handleDropUpload = useCallback(async () => {
    if (!pendingDropCollection || pendingDropFiles.length === 0) return;
    setDropUploading(true);
    // Auto-close modal immediately — progress shown in status panel
    setIsDropUploadModalOpen(false);
    const filesToUpload = [...pendingDropFiles];
    const pathsMap = new Map(pendingDropRelativePaths);
    const targetCollection = pendingDropCollection;
    setPendingDropFiles([]);
    setPendingDropRelativePaths(new Map());
    setPendingDropCollection(null);
    try {
      // Create folder structure before uploading
      await ensureFolderStructure(
        pathsMap,
        targetCollection.collectionId,
        targetCollection.name,
        targetCollection.displayName,
      );

      for (const file of filesToUpload) {
        const relPath = pathsMap.get(file) || '';
        let targetFolderPath: string | undefined;
        if (relPath) {
          targetFolderPath = `/${targetCollection.displayName}/${relPath}`;
        }

        const sessionId = `drop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        addSession({
          id: sessionId,
          fileName: file.name,
          targetName: targetCollection.displayName,
          status: 'uploading',
          totalChunks: 0,
          processedChunks: 0,
        });

        await uploadDocument(
          {
            file,
            collection_name: targetCollection.name,
            user_id: user?.user_id,
            chunk_size: parseInt(dropChunkSize, 10) || 1000,
            chunk_overlap: parseInt(dropChunkOverlap, 10) || 150,
            use_ocr: dropUseOcr,
            use_llm_metadata: dropUseLlm,
            extract_default_metadata: dropUseMeta,
            force_chunking: dropForceChunk,
            folder_path: targetFolderPath,
          },
          (evt) => {
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
      await loadData();
    } catch (err) {
      console.error('Failed to upload dropped documents:', err);
    } finally {
      setDropUploading(false);
    }
  }, [pendingDropCollection, pendingDropFiles, pendingDropRelativePaths, user, dropChunkSize, dropChunkOverlap, dropUseOcr, dropUseLlm, dropUseMeta, dropForceChunk, addSession, updateSession, loadData]);

  const handleCancelDropUpload = useCallback(() => {
    setIsDropUploadModalOpen(false);
    setPendingDropFiles([]);
    setPendingDropRelativePaths(new Map());
    setPendingDropCollection(null);
  }, []);

  const { isDragOver: isListDragOver, dropHandlers: listDropHandlers } = useExternalDrop({
    onDrop: handleExternalDrop,
    disabled: viewMode !== 'list',
  });

  const filteredCollections = useMemo(() => {
    return collections.filter(c => {
      if (search && !c.displayName.toLowerCase().includes(search.toLowerCase())) return false;
      if (ownerFilter === 'personal' && c.isShared) return false;
      if (ownerFilter === 'shared' && !c.isShared) return false;
      return true;
    });
  }, [collections, search, ownerFilter]);

  // ── Card Items ──
  const cardItems = useMemo(() => {
    return filteredCollections.map((col) => {
      const badges: CardBadge[] = [];
      badges.push({
        text: col.isShared ? t('documents.collection.filters.shared') : t('documents.collection.filters.personal'),
        variant: col.isShared ? 'primary' : 'secondary',
      });
      if (col.isSecured) {
        badges.push({ text: t('documents.collection.createModal.encrypt'), variant: 'purple' });
      }

      return {
        id: col.id,
        data: col,
        title: col.displayName,
        description: col.description || undefined,
        thumbnail: {
          icon: <FiFolder />,
          backgroundColor: 'rgba(48, 94, 235, 0.1)',
          iconColor: '#305eeb',
        },
        badges,
        metadata: [
          { icon: <FiFileText />, value: `${col.documentCount} ${t('documents.collection.documents')}` },
          ...(col.embedding ? [{ value: col.embedding }] : []),
          ...(col.updatedAt ? [{ icon: <FiClock />, value: formatDate(col.updatedAt) }] : []),
        ],
        primaryActions: [
          {
            id: 'settings',
            icon: <FiSettings />,
            label: t('documents.collection.buttons.settings'),
            onClick: () => handleOpenSettings(col),
          },
          {
            id: 'delete',
            icon: <FiTrash2 />,
            label: t('documents.collection.buttons.delete'),
            onClick: () => handleDeleteCollection(col),
          },
        ],
        onClick: () => handleSelectCollection(col),
      };
    });
  }, [filteredCollections, handleDeleteCollection, handleOpenSettings, handleSelectCollection, t]);

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
            placeholder={t('documents.collection.searchPlaceholder')}
            size="sm"
          />
          <Button size="toolbar" onClick={() => setIsCreateModalOpen(true)}>
            <PlusIcon />
            {t('documents.collection.buttons.newCollection')}
          </Button>
        </div>
      </div>
    );
  }, [onSubToolbarChange, ownerFilterTabs, ownerFilter, search, t, viewMode]);

  useEffect(() => {
    return () => { onSubToolbarChange?.(null); };
  }, [onSubToolbarChange]);

  // ── Render ──

  // Document Detail View
  if (viewMode === 'document-detail' && selectedCollection && selectedDocument) {
    return (
      <DocumentDetail
        collection={selectedCollection}
        document={selectedDocument}
        onBack={handleBackToDocuments}
      />
    );
  }

  // Documents View (inside collection)
  if (viewMode === 'documents' && selectedCollection) {
    return (
      <CollectionDocuments
        collection={selectedCollection}
        onBack={handleBackToList}
        onSelectDocument={handleSelectDocument}
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
            <p className="text-sm font-medium text-primary">{t('documents.collection.dropOverlay', '컬렉션에 파일을 놓아주세요')}</p>
          </div>
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ResourceCardGrid
          items={cardItems}
          loading={loading}
          showEmptyState
          emptyStateProps={{
            icon: <FiFolder />,
            title: error || t('documents.collection.empty.title'),
            description: error ? undefined : t('documents.collection.empty.description'),
            action: error
              ? { label: t('common.retry'), onClick: loadData }
              : { label: t('documents.collection.buttons.newCollection'), onClick: () => setIsCreateModalOpen(true) },
          }}
        />
      </div>

      {/* Create Collection Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        title={t('documents.collection.createModal.title')}
        size="md"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCloseCreateModal}>
              {t('documents.collection.createModal.cancel')}
            </Button>
            <Button onClick={handleCreateCollection} disabled={creating || !newCollectionName.trim()}>
              {creating ? t('documents.collection.createModal.creating') : t('documents.collection.createModal.create')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('documents.collection.createModal.name')}</Label>
            <Input
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder={t('documents.collection.createModal.namePlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('documents.collection.createModal.description')}</Label>
            <Textarea
              value={newCollectionDesc}
              onChange={(e) => setNewCollectionDesc(e.target.value)}
              placeholder={t('documents.collection.createModal.descriptionPlaceholder')}
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <Label>{t('documents.collection.createModal.sparseVector')}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t('documents.collection.createModal.sparseVectorDesc')}</p>
            </div>
            <Switch checked={newCollectionSparse} onCheckedChange={setNewCollectionSparse} />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <Label>{t('documents.collection.createModal.fullText')}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t('documents.collection.createModal.fullTextDesc')}</p>
            </div>
            <Switch checked={newCollectionFullText} onCheckedChange={setNewCollectionFullText} />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <Label>{t('documents.collection.createModal.encrypt')}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t('documents.collection.createModal.encryptDesc')}</p>
            </div>
            <Switch checked={newCollectionEncrypt} onCheckedChange={setNewCollectionEncrypt} />
          </div>
          {newCollectionEncrypt && (
            <>
              <div className="space-y-2">
                <Label>{t('documents.collection.createModal.password')}</Label>
                <Input
                  type="password"
                  value={newCollectionPassword}
                  onChange={(e) => setNewCollectionPassword(e.target.value)}
                  placeholder={t('documents.collection.createModal.passwordPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('documents.collection.createModal.passwordConfirm')}</Label>
                <Input
                  type="password"
                  value={newCollectionPasswordConfirm}
                  onChange={(e) => setNewCollectionPasswordConfirm(e.target.value)}
                  placeholder={t('documents.collection.createModal.passwordConfirmPlaceholder')}
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
        title={t('documents.collection.settingsModal.title')}
        size="md"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleCloseSettings}>
              {t('documents.collection.settingsModal.cancel')}
            </Button>
            <Button
              className="flex-1"
              onClick={handleUpdateCollection}
              disabled={settingsUpdating || !settingsName.trim() || (settingsSecured && settingsPassword !== '' && settingsPassword !== settingsPasswordConfirm)}
            >
              {settingsUpdating ? t('documents.collection.settingsModal.updating') : t('documents.collection.settingsModal.update')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Name — read-only display */}
          <div className="space-y-1">
            <Label>{t('documents.collection.settingsModal.name')}</Label>
            <p className="text-sm text-foreground py-1">{settingsName}</p>
          </div>

          {/* Sharing — toggle button */}
          <div className="space-y-1">
            <Label>{t('documents.collection.settingsModal.sharing')}</Label>
            <button
              type="button"
              onClick={() => setSettingsShared(!settingsShared)}
              className="w-full px-4 py-2.5 text-sm text-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            >
              {settingsShared ? t('documents.collection.settingsModal.sharingShared') : t('documents.collection.settingsModal.sharingPrivate')}
            </button>
          </div>

          {/* Encryption — toggle button */}
          <div className="space-y-1">
            <Label>{t('documents.collection.settingsModal.encryption')}</Label>
            <button
              type="button"
              onClick={() => {
                setSettingsSecured(!settingsSecured);
                if (settingsSecured) {
                  setSettingsPassword('');
                  setSettingsPasswordConfirm('');
                }
              }}
              className={`w-full px-4 py-2.5 text-sm text-center rounded-lg border transition-colors ${
                settingsSecured
                  ? 'border-blue-400 bg-blue-50 text-blue-600'
                  : 'border-gray-200 bg-white text-foreground hover:bg-gray-50'
              }`}
            >
              {settingsSecured ? t('documents.collection.settingsModal.encryptionEnabled') : t('documents.collection.settingsModal.encryptionNone')}
            </button>
          </div>

          {/* Password fields — shown when encryption is enabled */}
          {settingsSecured && (
            <>
              <div className="space-y-1">
                <Label>{t('documents.collection.settingsModal.newPassword')}</Label>
                <Input
                  type="password"
                  value={settingsPassword}
                  onChange={(e) => setSettingsPassword(e.target.value)}
                  placeholder={t('documents.collection.settingsModal.newPasswordPlaceholder')}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('documents.collection.settingsModal.confirmPassword')}</Label>
                <Input
                  type="password"
                  value={settingsPasswordConfirm}
                  onChange={(e) => setSettingsPasswordConfirm(e.target.value)}
                  placeholder={t('documents.collection.settingsModal.confirmPasswordPlaceholder')}
                />
                {settingsPassword && settingsPasswordConfirm && settingsPassword !== settingsPasswordConfirm && (
                  <p className="text-xs text-red-500 mt-1">{t('documents.collection.settingsModal.passwordMismatch')}</p>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Password Verification Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={handleClosePasswordModal}
        title={t('documents.collection.passwordModal.title')}
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClosePasswordModal}>
              {t('documents.collection.createModal.cancel')}
            </Button>
            <Button onClick={handleVerifyCollectionPassword} disabled={verifying || !verifyPassword}>
              {verifying ? t('documents.collection.passwordModal.verifying') : t('documents.collection.passwordModal.verify')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-2 py-2">
            <FiLock className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm font-medium">{pendingCollection?.displayName}</p>
            <p className="text-xs text-muted-foreground text-center">
              {t('documents.collection.passwordModal.description')}
            </p>
          </div>
          {verifyError && (
            <p className="text-sm text-destructive text-center">{verifyError}</p>
          )}
          <div className="space-y-2">
            <Label>{t('documents.collection.passwordModal.passwordLabel')}</Label>
            <Input
              type="password"
              value={verifyPassword}
              onChange={(e) => setVerifyPassword(e.target.value)}
              placeholder={t('documents.collection.passwordModal.passwordPlaceholder')}
              onKeyDown={(e) => { if (e.key === 'Enter' && !verifying) handleVerifyCollectionPassword(); }}
              autoFocus
            />
          </div>
        </div>
      </Modal>

      {/* Drop Confirm Modal */}
      <Modal
        isOpen={isDropConfirmOpen}
        onClose={handleCancelDrop}
        title={t('documents.collection.dropConfirm.title', '파일 업로드 확인')}
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancelDrop}>
              {t('documents.collection.createModal.cancel')}
            </Button>
            <Button onClick={handleConfirmDrop}>
              {t('documents.collection.dropConfirm.confirm', '임베딩 설정')}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-foreground">
            {pendingDropCollection?.displayName} {t('documents.collection.dropConfirm.collectionSuffix', '컬렉션에')} {pendingDropFiles.length}{t('documents.collection.dropConfirm.fileCountSuffix', '개의 파일을 업로드합니다.')}
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
            {t('documents.collection.dropConfirm.hint', '확인 버튼을 누르면 임베딩 옵션을 설정할 수 있습니다.')}
          </p>
        </div>
      </Modal>

      {/* Drop Collection Select Modal */}
      <Modal
        isOpen={isDropSelectOpen}
        onClose={() => { setIsDropSelectOpen(false); setDropSelectResult(null); }}
        title={t('documents.collection.dropSelect.title', '업로드할 컬렉션 선택')}
        size="sm"
      >
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground mb-3">
            {t('documents.collection.dropSelect.description', '파일을 업로드할 컬렉션을 선택해주세요.')}
          </p>
          {collections.map(col => (
            <button
              key={col.id}
              className="w-full flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors text-left"
              onClick={() => handleSelectDropCollection(col)}
            >
              <FiFolder className="w-5 h-5 text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{col.displayName}</p>
                <p className="text-xs text-muted-foreground">{col.documentCount} {t('documents.collection.documents')}</p>
              </div>
              {col.isSecured && <FiLock className="w-4 h-4 text-muted-foreground shrink-0" />}
            </button>
          ))}

          {/* Create new collection */}
          <div className="pt-3 mt-2 border-t border-border">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => { setDropCreateMode(true); setIsCreateModalOpen(true); }}
            >
              {t('documents.collection.dropSelect.createNew')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Drop Password Modal */}
      <Modal
        isOpen={isDropPasswordModalOpen}
        onClose={handleCloseDropPasswordModal}
        title={t('documents.collection.passwordModal.title')}
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCloseDropPasswordModal}>
              {t('documents.collection.createModal.cancel')}
            </Button>
            <Button onClick={handleDropPasswordVerify} disabled={dropPasswordVerifying || !dropPassword}>
              {dropPasswordVerifying ? t('documents.collection.passwordModal.verifying') : t('documents.collection.passwordModal.verify')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-2 py-2">
            <FiLock className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm font-medium">{dropPasswordCollection?.displayName}</p>
            <p className="text-xs text-muted-foreground text-center">
              {t('documents.collection.passwordModal.description')}
            </p>
          </div>
          {dropPasswordError && (
            <p className="text-sm text-destructive text-center">{dropPasswordError}</p>
          )}
          <div className="space-y-2">
            <Label>{t('documents.collection.passwordModal.passwordLabel')}</Label>
            <Input
              type="password"
              value={dropPassword}
              onChange={(e) => setDropPassword(e.target.value)}
              placeholder={t('documents.collection.passwordModal.passwordPlaceholder')}
              onKeyDown={(e) => { if (e.key === 'Enter' && !dropPasswordVerifying) handleDropPasswordVerify(); }}
              autoFocus
            />
          </div>
        </div>
      </Modal>

      {/* Drop Upload Modal (Embedding Options) */}
      <Modal
        isOpen={isDropUploadModalOpen}
        onClose={handleCancelDropUpload}
        title={t('documents.collection.detail.uploadModal.title', '문서 업로드')}
        size="md"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancelDropUpload}>
              {t('documents.collection.createModal.cancel')}
            </Button>
            <Button onClick={handleDropUpload} disabled={dropUploading || pendingDropFiles.length === 0}>
              {dropUploading ? t('documents.collection.detail.uploadModal.uploading', '업로드 중...') : t('documents.collection.detail.uploadModal.upload', '업로드')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* File list */}
          <div className="space-y-2">
            <Label>{t('documents.collection.detail.uploadModal.file', '파일')}</Label>
            <div className="max-h-32 overflow-y-auto border border-border rounded-lg p-2 space-y-1">
              {pendingDropFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FiFileText className="w-3 h-3 shrink-0" />
                  <span className="truncate flex-1">{file.name}</span>
                </div>
              ))}
              <p className="text-xs text-muted-foreground text-center pt-1">{pendingDropFiles.length}개 파일</p>
            </div>
          </div>

          {/* Chunk Size & Overlap */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('documents.collection.detail.uploadModal.chunkSize', '청크 크기')}</Label>
              <Input type="number" value={dropChunkSize} onChange={(e) => setDropChunkSize(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('documents.collection.detail.uploadModal.chunkOverlap', '청크 오버랩')}</Label>
              <Input type="number" value={dropChunkOverlap} onChange={(e) => setDropChunkOverlap(e.target.value)} />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between py-1">
              <Label>OCR</Label>
              <Switch checked={dropUseOcr} onCheckedChange={setDropUseOcr} />
            </div>
            <div className="flex items-center justify-between py-1">
              <Label>LLM Metadata</Label>
              <Switch checked={dropUseLlm} onCheckedChange={setDropUseLlm} />
            </div>
            <div className="flex items-center justify-between py-1">
              <Label>META</Label>
              <Switch checked={dropUseMeta} onCheckedChange={setDropUseMeta} />
            </div>
            <div className="flex items-center justify-between py-1">
              <Label>FORCE CHUNK</Label>
              <Switch checked={dropForceChunk} onCheckedChange={setDropForceChunk} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentCollection;

export const documentCollectionPlugin: DocumentTabPlugin = {
  id: 'collection',
  name: 'Document Collection',
  tabLabelKey: 'documents.tabs.collection',
  order: 1,
  component: DocumentCollection,
};
