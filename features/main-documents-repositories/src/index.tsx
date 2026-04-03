'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { DocumentTabPlugin, DocumentTabPluginProps } from '@xgen/types';
import { SearchInput, Button, EmptyState } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface RepositoryItem {
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

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const CollectionIcon: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M28 6H14C12.939 6 11.922 6.421 11.172 7.172C10.421 7.922 10 8.939 10 10V38C10 39.061 10.421 40.078 11.172 40.828C11.922 41.579 12.939 42 14 42H34C35.061 42 36.078 41.579 36.828 40.828C37.579 40.078 38 39.061 38 38V16L28 6Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M28 6V16H38M32 26H16M32 34H16M20 18H16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
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
// Helpers
// ─────────────────────────────────────────────────────────────

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
};

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// DocumentRepositories Component
// ─────────────────────────────────────────────────────────────

const DocumentRepositories: React.FC<DocumentTabPluginProps> = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [repositories, setRepositories] = useState<RepositoryItem[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      setRepositories(MOCK_REPOSITORIES);
    } catch (error) {
      console.error('Failed to load repositories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredRepositories = useMemo(() => {
    if (!search) return repositories;
    return repositories.filter(r => r.repositoryName.toLowerCase().includes(search.toLowerCase()));
  }, [repositories, search]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <Button>
          <PlusIcon />
          {t('documents.buttons.newRepository')}
        </Button>
        <div className="flex items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('documents.searchPlaceholder')}
            size="sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-10 h-10 border-3 border-border border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredRepositories.length === 0 ? (
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
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Plugin Export
// ─────────────────────────────────────────────────────────────

export default DocumentRepositories;

export const documentsRepositoriesPlugin: DocumentTabPlugin = {
  id: 'repositories',
  name: 'Document Repositories',
  tabLabelKey: 'documents.tabs.repositories',
  order: 3,
  component: DocumentRepositories,
};
