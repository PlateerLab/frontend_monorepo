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

export interface CollectionItem {
  id: string;
  name: string;
  displayName: string;
  documentCount: number;
  isShared: boolean;
  embedding: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const FolderIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.5 15.833c0 .442-.176.866-.488 1.179a1.667 1.667 0 01-1.179.488H4.167c-.442 0-.866-.176-1.179-.488A1.667 1.667 0 012.5 15.833V4.167c0-.442.176-.866.488-1.179A1.667 1.667 0 014.167 2.5h4.166L10 5h6.333c.442 0 .866.176 1.179.488.312.313.488.737.488 1.179v9.166z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

const CollectionEmptyIcon: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M28 6H14C12.939 6 11.922 6.421 11.172 7.172C10.421 7.922 10 8.939 10 10V38C10 39.061 10.421 40.078 11.172 40.828C11.922 41.579 12.939 42 14 42H34C35.061 42 36.078 41.579 36.828 40.828C37.579 40.078 38 39.061 38 38V16L28 6Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M28 6V16H38M32 26H16M32 34H16M20 18H16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

const MOCK_COLLECTIONS: CollectionItem[] = [
  {
    id: 'col-001',
    name: 'ecommerce_law',
    displayName: '전자상거래법 가이드',
    documentCount: 24,
    isShared: false,
    embedding: 'text-embedding-ada-002',
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-01-25T14:00:00Z',
  },
  {
    id: 'col-002',
    name: 'customer_faq',
    displayName: '고객문의 FAQ',
    documentCount: 56,
    isShared: true,
    embedding: 'text-embedding-ada-002',
    createdAt: '2025-01-12T11:00:00Z',
    updatedAt: '2025-01-26T10:00:00Z',
  },
  {
    id: 'col-003',
    name: 'hr_policy',
    displayName: 'HR 규정집',
    documentCount: 12,
    isShared: true,
    embedding: 'text-embedding-3-small',
    createdAt: '2025-01-08T09:00:00Z',
    updatedAt: '2025-01-28T08:00:00Z',
  },
  {
    id: 'col-004',
    name: 'tech_docs',
    displayName: '기술 문서',
    documentCount: 34,
    isShared: false,
    embedding: 'text-embedding-ada-002',
    createdAt: '2025-01-15T16:00:00Z',
    updatedAt: '2025-01-27T12:00:00Z',
  },
];

// ─────────────────────────────────────────────────────────────
// DocumentCollection Component (컬렉션 탭)
// ─────────────────────────────────────────────────────────────

export interface DocumentCollectionProps extends DocumentTabPluginProps {}

export const DocumentCollection: React.FC<DocumentCollectionProps> = ({ onSubToolbarChange }) => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
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
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      setCollections(MOCK_COLLECTIONS);
    } catch (error) {
      console.error('Failed to load collections:', error);
    } finally {
      setLoading(false);
    }
  }, []);

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
      // TODO: API call to create collection
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsCreateModalOpen(false);
      setNewCollectionName('');
      setNewCollectionDesc('');
      setNewCollectionSparse(false);
      setNewCollectionFullText(false);
      setNewCollectionEncrypt(false);
      await loadData();
    } catch (error) {
      console.error('Failed to create collection:', error);
    } finally {
      setCreating(false);
    }
  }, [newCollectionName, loadData]);

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
      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="w-10 h-10 border-3 border-border border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredCollections.length === 0 ? (
          <EmptyState
            icon={<CollectionEmptyIcon />}
            title={t('documents.collection.empty.title')}
            description={t('documents.collection.empty.description')}
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {filteredCollections.map(col => (
              <div key={col.id} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                  <FolderIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground truncate">{col.displayName}</h3>
                    {col.isShared && (
                      <span className="text-muted-foreground shrink-0"><SharedIcon /></span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex gap-3">
                    <span>{col.documentCount} {t('documents.collection.documents')}</span>
                    <span>{col.embedding}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
