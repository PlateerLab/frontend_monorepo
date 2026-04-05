'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { DocumentTabPlugin, DocumentTabPluginProps, CardBadge } from '@xgen/types';
import { Button, FilterTabs, SearchInput, Modal, Input, Label, Switch, Textarea, ResourceCardGrid } from '@xgen/ui';
import { FiFolder, FiFileText, FiClock, FiTrash2 } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { listCollections, createCollection, deleteCollection, type CollectionItem } from './api';
import './locales';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type OwnerFilter = 'all' | 'personal' | 'shared';

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
  const [creating, setCreating] = useState(false);

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
      });
      setIsCreateModalOpen(false);
      setNewCollectionName('');
      setNewCollectionDesc('');
      setNewCollectionSparse(false);
      setNewCollectionFullText(false);
      setNewCollectionEncrypt(false);
      await loadData();
    } catch (err) {
      console.error('Failed to create collection:', err);
    } finally {
      setCreating(false);
    }
  }, [newCollectionName, newCollectionDesc, newCollectionSparse, newCollectionFullText, newCollectionEncrypt, loadData]);

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
  }, []);

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
        dropdownActions: [
          {
            id: 'delete',
            icon: <FiTrash2 />,
            label: t('common.delete'),
            danger: true,
            onClick: () => handleDeleteCollection(col),
          },
        ],
        onClick: () => {},
      };
    });
  }, [filteredCollections, handleDeleteCollection, t]);

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
            placeholder={t('documents.collection.searchPlaceholder')}
            size="sm"
          />
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <PlusIcon />
            {t('documents.collection.buttons.newCollection')}
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
