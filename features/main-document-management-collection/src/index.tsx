'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { DocumentTabPlugin, DocumentTabPluginProps, CardBadge } from '@xgen/types';
import { Button, FilterTabs, SearchInput, Modal, Input, Label, Switch, Textarea, ResourceCardGrid } from '@xgen/ui';
import { FiFolder, FiFileText, FiClock, FiTrash2, FiLock, FiSettings } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { listCollections, createCollection, deleteCollection, updateCollection, verifyCollectionPassword, storeCollectionSessionToken, getCollectionSessionToken, sha256, type CollectionItem, type DocumentItem } from './api';
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
      await createCollection({
        collection_make_name: newCollectionName.trim(),
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
      await loadData();
    } catch (err) {
      console.error('Failed to create collection:', err);
    } finally {
      setCreating(false);
    }
  }, [newCollectionName, newCollectionDesc, newCollectionSparse, newCollectionFullText, newCollectionEncrypt, newCollectionPassword, loadData]);

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
    <div className="flex flex-col flex-1 min-h-0 p-6">
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
