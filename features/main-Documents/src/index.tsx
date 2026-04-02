'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea, SearchInput, FilterTabs, Button, EmptyState } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import './locales';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type ViewMode = 'collections' | 'file-storage' | 'repositories' | 'db-connections';
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

export interface FileStorageItem {
  id: string;
  name: string;
  fileCount: number;
  totalSize: number;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RepositoryItem {
  id: string;
  repositoryName: string;
  collectionName: string;
  gitlabUrl: string;
  branch: string;
  isActive: boolean;
  lastSyncedAt: string | null;
  lastSyncStatus: 'success' | 'failed' | null;
  syncScheduleCron: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DBConnectionItem {
  id: string;
  connectionName: string;
  dbType: 'postgresql' | 'mysql' | 'mssql' | 'oracle';
  host: string;
  port: number;
  databaseName: string;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const CollectionIcon: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M28 6H14C12.939 6 11.922 6.421 11.172 7.172C10.421 7.922 10 8.939 10 10V38C10 39.061 10.421 40.078 11.172 40.828C11.922 41.579 12.939 42 14 42H34C35.061 42 36.078 41.579 36.828 40.828C37.579 40.078 38 39.061 38 38V16L28 6Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M28 6V16H38M32 26H16M32 34H16M20 18H16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FolderIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.5 15.833c0 .442-.176.866-.488 1.179a1.667 1.667 0 01-1.179.488H4.167c-.442 0-.866-.176-1.179-.488A1.667 1.667 0 012.5 15.833V4.167c0-.442.176-.866.488-1.179A1.667 1.667 0 014.167 2.5h4.166L10 5h6.333c.442 0 .866.176 1.179.488.312.313.488.737.488 1.179v9.166z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const StorageIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.667 2.5H3.333c-.92 0-1.666.746-1.666 1.667v3.333c0 .92.746 1.667 1.666 1.667h13.334c.92 0 1.666-.747 1.666-1.667V4.167c0-.92-.746-1.667-1.666-1.667zM16.667 10.833H3.333c-.92 0-1.666.747-1.666 1.667v3.333c0 .921.746 1.667 1.666 1.667h13.334c.92 0 1.666-.746 1.666-1.667V12.5c0-.92-.746-1.667-1.666-1.667z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.833 5.833h.009M5.833 14.167h.009" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const GitIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="5.833" cy="5" r="1.667" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="14.167" cy="7.5" r="1.667" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="5.833" cy="15" r="1.667" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5.833 6.667v6.666M7.34 5.59l5.16 1.32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const DatabaseIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="10" cy="4.167" rx="7.5" ry="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M17.5 10c0 1.38-3.358 2.5-7.5 2.5S2.5 11.38 2.5 10M17.5 4.167v11.666c0 1.381-3.358 2.5-7.5 2.5s-7.5-1.119-7.5-2.5V4.167" stroke="currentColor" strokeWidth="1.5"/>
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

const RefreshIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.65 6.667A5.333 5.333 0 003.013 5.333M2.35 9.333a5.333 5.333 0 0010.637 1.334M13.65 2.667v4h-4M2.35 13.333v-4h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
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

const MOCK_REPOSITORIES: RepositoryItem[] = [
  {
    id: 'repo-001',
    repositoryName: 'xgen-docs',
    collectionName: 'tech_docs',
    gitlabUrl: 'https://gitlab.example.com/team/xgen-docs',
    branch: 'main',
    isActive: true,
    lastSyncedAt: '2025-01-28T06:00:00Z',
    lastSyncStatus: 'success',
    syncScheduleCron: '0 6 * * *',
    createdAt: '2025-01-05T10:00:00Z',
    updatedAt: '2025-01-28T06:00:00Z',
  },
  {
    id: 'repo-002',
    repositoryName: 'api-reference',
    collectionName: 'api_docs',
    gitlabUrl: 'https://gitlab.example.com/team/api-reference',
    branch: 'develop',
    isActive: true,
    lastSyncedAt: '2025-01-27T18:00:00Z',
    lastSyncStatus: 'failed',
    syncScheduleCron: '0 */6 * * *',
    createdAt: '2025-01-08T11:00:00Z',
    updatedAt: '2025-01-27T18:00:00Z',
  },
  {
    id: 'repo-003',
    repositoryName: 'wiki-backup',
    collectionName: 'wiki',
    gitlabUrl: 'https://gitlab.example.com/team/wiki-backup',
    branch: 'main',
    isActive: false,
    lastSyncedAt: null,
    lastSyncStatus: null,
    syncScheduleCron: null,
    createdAt: '2025-01-20T14:00:00Z',
    updatedAt: '2025-01-20T14:00:00Z',
  },
];

const MOCK_DB_CONNECTIONS: DBConnectionItem[] = [
  {
    id: 'db-001',
    connectionName: '운영 DB',
    dbType: 'postgresql',
    host: 'prod-db.example.com',
    port: 5432,
    databaseName: 'xgen_prod',
    isShared: true,
    createdAt: '2025-01-03T10:00:00Z',
    updatedAt: '2025-01-25T14:00:00Z',
  },
  {
    id: 'db-002',
    connectionName: '개발 DB',
    dbType: 'postgresql',
    host: 'dev-db.example.com',
    port: 5432,
    databaseName: 'xgen_dev',
    isShared: false,
    createdAt: '2025-01-05T09:00:00Z',
    updatedAt: '2025-01-26T10:00:00Z',
  },
  {
    id: 'db-003',
    connectionName: '분석 DB',
    dbType: 'mysql',
    host: 'analytics.example.com',
    port: 3306,
    databaseName: 'analytics',
    isShared: true,
    createdAt: '2025-01-10T11:00:00Z',
    updatedAt: '2025-01-27T16:00:00Z',
  },
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
};

// ─────────────────────────────────────────────────────────────
// Documents Page
// ─────────────────────────────────────────────────────────────

interface DocumentsPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const DocumentsPage: React.FC<DocumentsPageProps> = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('collections');
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');

  // Data states
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [fileStorages, setFileStorages] = useState<FileStorageItem[]>([]);
  const [repositories, setRepositories] = useState<RepositoryItem[]>([]);
  const [dbConnections, setDbConnections] = useState<DBConnectionItem[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      setCollections(MOCK_COLLECTIONS);
      setFileStorages(MOCK_FILE_STORAGES);
      setRepositories(MOCK_REPOSITORIES);
      setDbConnections(MOCK_DB_CONNECTIONS);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── View Mode tabs (메인 탭: 컬렉션 / 파일 저장소 / 레포지토리 / 데이터베이스) ──
  const viewModeTabs = useMemo(() => [
    { key: 'collections', label: t('documents.tabs.collections') },
    { key: 'file-storage', label: t('documents.tabs.fileStorage') },
    { key: 'repositories', label: t('documents.tabs.repositories') },
    { key: 'db-connections', label: t('documents.tabs.dbConnections') },
  ], [t]);

  // ── Owner filter tabs (모두 / 개인 / 공유) ──
  const ownerFilterTabs = useMemo(() => [
    { key: 'all', label: t('documents.filters.all') },
    { key: 'personal', label: t('documents.filters.personal') },
    { key: 'shared', label: t('documents.filters.shared') },
  ], [t]);

  // Reset filter on tab change
  const handleViewModeChange = useCallback((key: string) => {
    setViewMode(key as ViewMode);
    setOwnerFilter('all');
    setSearch('');
  }, []);

  // Show owner filter only for collections and file-storage
  const showOwnerFilter = viewMode === 'collections' || viewMode === 'file-storage';

  // ── Filtered data ──
  const filteredCollections = useMemo(() => {
    return collections.filter(c => {
      if (search && !c.displayName.toLowerCase().includes(search.toLowerCase())) return false;
      if (ownerFilter === 'personal' && c.isShared) return false;
      if (ownerFilter === 'shared' && !c.isShared) return false;
      return true;
    });
  }, [collections, search, ownerFilter]);

  const filteredFileStorages = useMemo(() => {
    return fileStorages.filter(fs => {
      if (search && !fs.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (ownerFilter === 'personal' && fs.isShared) return false;
      if (ownerFilter === 'shared' && !fs.isShared) return false;
      return true;
    });
  }, [fileStorages, search, ownerFilter]);

  const filteredRepositories = useMemo(() => {
    if (!search) return repositories;
    return repositories.filter(r => r.repositoryName.toLowerCase().includes(search.toLowerCase()));
  }, [repositories, search]);

  const filteredDbConnections = useMemo(() => {
    if (!search) return dbConnections;
    return dbConnections.filter(db => db.connectionName.toLowerCase().includes(search.toLowerCase()));
  }, [dbConnections, search]);

  // ── Header action button (탭별로 다른 버튼) ──
  const headerAction = useMemo(() => {
    const labels: Record<ViewMode, string> = {
      'collections': t('documents.buttons.newCollection'),
      'file-storage': t('documents.buttons.newStorage'),
      'repositories': t('documents.buttons.newRepository'),
      'db-connections': t('documents.buttons.newConnection'),
    };
    return (
      <Button>
        <PlusIcon />
        {labels[viewMode]}
      </Button>
    );
  }, [viewMode, t]);

  // ── Render ──
  return (
    <ContentArea title={t('documents.title')} headerActions={headerAction}>
      <div className="p-6 max-w-[1400px] mx-auto">
        {/* 메인 탭 */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <FilterTabs
            tabs={viewModeTabs}
            activeKey={viewMode}
            onChange={handleViewModeChange}
            variant="underline"
          />
          <div className="flex items-center gap-3">
            {showOwnerFilter && (
              <FilterTabs
                tabs={ownerFilterTabs}
                activeKey={ownerFilter}
                onChange={(key) => setOwnerFilter(key as OwnerFilter)}
              />
            )}
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('documents.searchPlaceholder')}
              size="sm"
            />
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="w-10 h-10 border-3 border-border border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── 컬렉션 탭 ── */}
            {viewMode === 'collections' && (
              filteredCollections.length === 0 ? (
                <EmptyState
                  icon={<CollectionIcon />}
                  title={t('documents.collections.empty.title')}
                  description={t('documents.collections.empty.description')}
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
                          <span>{col.documentCount} {t('documents.collections.documents')}</span>
                          <span>{col.embedding}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ── 파일 저장소 탭 ── */}
            {viewMode === 'file-storage' && (
              filteredFileStorages.length === 0 ? (
                <EmptyState
                  icon={<CollectionIcon />}
                  title={t('documents.fileStorage.empty.title')}
                  description={t('documents.fileStorage.empty.description')}
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
                          <span>{fs.fileCount} {t('documents.fileStorage.files')}</span>
                          <span>{formatSize(fs.totalSize)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ── 레포지토리 탭 ── */}
            {viewMode === 'repositories' && (
              filteredRepositories.length === 0 ? (
                <EmptyState
                  icon={<CollectionIcon />}
                  title={t('documents.repositories.empty.title')}
                  description={t('documents.repositories.empty.description')}
                />
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-4">
                  {filteredRepositories.map(repo => (
                    <div key={repo.id} className="flex flex-col p-5 bg-card border border-border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0 text-orange-500">
                          <GitIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-foreground mb-1">{repo.repositoryName}</h3>
                          <span className="text-[11px] text-muted-foreground">{repo.branch} · {repo.collectionName}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${repo.isActive ? 'bg-green-500/10 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                          {repo.isActive ? t('documents.repositories.active') : t('documents.repositories.inactive')}
                        </span>
                      </div>
                      <p className="text-[12px] text-muted-foreground mb-3 truncate">{repo.gitlabUrl}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground/70 mt-auto">
                        <span>
                          {t('documents.repositories.lastSync')}: {formatDate(repo.lastSyncedAt)}
                          {repo.lastSyncStatus && (
                            <span className={`ml-1.5 ${repo.lastSyncStatus === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                              ({repo.lastSyncStatus})
                            </span>
                          )}
                        </span>
                        {repo.isActive && (
                          <button className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors">
                            <RefreshIcon />
                            <span>{t('documents.repositories.syncNow')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ── 데이터베이스 탭 ── */}
            {viewMode === 'db-connections' && (
              filteredDbConnections.length === 0 ? (
                <EmptyState
                  icon={<CollectionIcon />}
                  title={t('documents.dbConnections.empty.title')}
                  description={t('documents.dbConnections.empty.description')}
                />
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
                  {filteredDbConnections.map(db => (
                    <div key={db.id} className="flex flex-col p-5 bg-card border border-border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0 text-violet-500">
                          <DatabaseIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-foreground">{db.connectionName}</h3>
                            {db.isShared && (
                              <span className="text-muted-foreground shrink-0"><SharedIcon /></span>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{db.dbType}</span>
                        </div>
                      </div>
                      <div className="text-[12px] text-muted-foreground mb-3 font-mono truncate">
                        {db.host}:{db.port}/{db.databaseName}
                      </div>
                      <div className="text-xs text-muted-foreground/60 mt-auto">
                        {formatDate(db.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const mainDocumentsFeature: MainFeatureModule = {
  id: 'main-Documents',
  name: 'Documents',
  sidebarSection: 'workflow',
  sidebarItems: [
    {
      id: 'documents',
      titleKey: 'sidebar.workflow.documents.title',
      descriptionKey: 'sidebar.workflow.documents.description',
    },
  ],
  routes: {
    'documents': DocumentsPage,
  },
  requiresAuth: true,
};

export default mainDocumentsFeature;
