'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { DocumentTabPlugin, DocumentTabPluginProps, CardBadge } from '@xgen/types';
import { Button, SearchInput, Modal, Input, Label, Switch, ResourceCardGrid } from '@xgen/ui';
import { FiGitBranch, FiRefreshCw, FiFolder, FiClock, FiTrash2 } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { listRepositories, createRepository, deleteRepository, syncRepository, type RepositoryItem } from './api';
import './locales';

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const PlusIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch { return dateStr; }
}

// ─────────────────────────────────────────────────────────────
// DocumentRepository Component
// ─────────────────────────────────────────────────────────────

export interface DocumentRepositoryProps extends DocumentTabPluginProps {}

export const DocumentRepository: React.FC<DocumentRepositoryProps> = ({ onSubToolbarChange }) => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [repositories, setRepositories] = useState<RepositoryItem[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRepoCollection, setNewRepoCollection] = useState('');
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [newRepoToken, setNewRepoToken] = useState('');
  const [newRepoBranch, setNewRepoBranch] = useState('main');
  const [newRepoCron, setNewRepoCron] = useState('');
  const [newRepoAnnotation, setNewRepoAnnotation] = useState(false);
  const [newRepoApiExtract, setNewRepoApiExtract] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listRepositories();
      setRepositories(data);
    } catch (err) {
      console.error('Failed to load repositories:', err);
      setError(t('documents.repository.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateRepository = useCallback(async () => {
    if (!newRepoCollection.trim() || !newRepoUrl.trim()) return;
    setCreating(true);
    try {
      await createRepository({
        user_id: 1,
        collection_name: newRepoCollection.trim(),
        repository_name: newRepoName.trim() || undefined as any,
        gitlab_url: newRepoUrl.trim(),
        gitlab_token: newRepoToken.trim(),
        repository_path: '/',
        branch: newRepoBranch.trim() || 'main',
        sync_schedule_cron: newRepoCron.trim() || undefined,
        enable_annotation: newRepoAnnotation,
        enable_api_extraction: newRepoApiExtract,
      });
      setIsCreateModalOpen(false);
      setNewRepoCollection('');
      setNewRepoName('');
      setNewRepoUrl('');
      setNewRepoToken('');
      setNewRepoBranch('main');
      setNewRepoCron('');
      setNewRepoAnnotation(false);
      setNewRepoApiExtract(false);
      await loadData();
    } catch (err) {
      console.error('Failed to create repository:', err);
    } finally {
      setCreating(false);
    }
  }, [newRepoCollection, newRepoName, newRepoUrl, newRepoToken, newRepoBranch, newRepoCron, newRepoAnnotation, newRepoApiExtract, loadData]);

  const handleDeleteRepository = useCallback(async (repo: RepositoryItem) => {
    try {
      await deleteRepository(repo.numericId);
      await loadData();
    } catch (err) {
      console.error('Failed to delete repository:', err);
    }
  }, [loadData]);

  const handleSyncRepository = useCallback(async (repo: RepositoryItem) => {
    try {
      await syncRepository(repo.numericId);
      await loadData();
    } catch (err) {
      console.error('Failed to sync repository:', err);
    }
  }, [loadData]);

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setNewRepoCollection('');
    setNewRepoName('');
    setNewRepoUrl('');
    setNewRepoToken('');
    setNewRepoBranch('main');
    setNewRepoCron('');
    setNewRepoAnnotation(false);
    setNewRepoApiExtract(false);
  }, []);

  const filteredRepositories = useMemo(() => {
    if (!search) return repositories;
    return repositories.filter(r => r.repositoryName.toLowerCase().includes(search.toLowerCase()));
  }, [repositories, search]);

  // ── Card Items ──
  const cardItems = useMemo(() => {
    return filteredRepositories.map((repo) => {
      const badges: CardBadge[] = [];
      badges.push({
        text: repo.isActive ? t('documents.repository.active') : t('documents.repository.inactive'),
        variant: repo.isActive ? 'success' : 'secondary',
      });
      badges.push({
        text: repo.branch,
        variant: 'outline' as any,
      });

      const syncStatusText = repo.lastSyncStatus
        ? `${t('documents.repository.lastSync')}: ${repo.lastSyncStatus}`
        : t('documents.repository.lastSync') + ': -';

      return {
        id: repo.id,
        data: repo,
        title: repo.repositoryName,
        description: repo.gitlabUrl,
        thumbnail: {
          icon: <FiGitBranch />,
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          iconColor: '#f97316',
        },
        badges,
        metadata: [
          { icon: <FiFolder />, value: repo.collectionName },
          { icon: <FiClock />, value: formatDate(repo.lastSyncedAt) },
          { value: syncStatusText },
        ],
        primaryActions: repo.isActive ? [
          {
            id: 'sync',
            icon: <FiRefreshCw />,
            label: t('documents.repository.syncNow'),
            onClick: () => handleSyncRepository(repo),
          },
        ] : [],
        dropdownActions: [
          {
            id: 'delete',
            icon: <FiTrash2 />,
            label: t('common.delete'),
            danger: true,
            onClick: () => handleDeleteRepository(repo),
          },
        ],
        onClick: () => {},
      };
    });
  }, [filteredRepositories, handleDeleteRepository, handleSyncRepository, t]);

  // Push subToolbar content to orchestrator
  useEffect(() => {
    onSubToolbarChange?.(
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div />
        <div className="flex items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('documents.repository.searchPlaceholder')}
            size="sm"
          />
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <PlusIcon />
            {t('documents.repository.buttons.newRepository')}
          </Button>
        </div>
      </div>
    );
  }, [onSubToolbarChange, search, t]);

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
            icon: <FiGitBranch />,
            title: error || t('documents.repository.empty.title'),
            description: error ? undefined : t('documents.repository.empty.description'),
            action: error
              ? { label: t('common.retry'), onClick: loadData }
              : { label: t('documents.repository.buttons.newRepository'), onClick: () => setIsCreateModalOpen(true) },
          }}
        />
      </div>

      {/* Create Repository Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        title={t('documents.repository.createModal.title')}
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCloseCreateModal}>
              {t('documents.repository.createModal.cancel')}
            </Button>
            <Button onClick={handleCreateRepository} disabled={creating || !newRepoCollection.trim() || !newRepoUrl.trim()}>
              {creating ? t('documents.repository.createModal.creating') : t('documents.repository.createModal.create')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('documents.repository.createModal.collectionName')}</Label>
            <Input
              value={newRepoCollection}
              onChange={(e) => setNewRepoCollection(e.target.value)}
              placeholder={t('documents.repository.createModal.collectionNamePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('documents.repository.createModal.repoName')}</Label>
            <Input
              value={newRepoName}
              onChange={(e) => setNewRepoName(e.target.value)}
              placeholder={t('documents.repository.createModal.repoNamePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('documents.repository.createModal.gitlabUrl')}</Label>
            <Input
              value={newRepoUrl}
              onChange={(e) => setNewRepoUrl(e.target.value)}
              placeholder={t('documents.repository.createModal.gitlabUrlPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('documents.repository.createModal.accessToken')}</Label>
            <Input
              type="password"
              value={newRepoToken}
              onChange={(e) => setNewRepoToken(e.target.value)}
              placeholder={t('documents.repository.createModal.accessTokenPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('documents.repository.createModal.branch')}</Label>
            <Input
              value={newRepoBranch}
              onChange={(e) => setNewRepoBranch(e.target.value)}
              placeholder="main"
            />
          </div>

          <div className="space-y-2">
            <Label>{t('documents.repository.createModal.cronSchedule')}</Label>
            <Input
              value={newRepoCron}
              onChange={(e) => setNewRepoCron(e.target.value)}
              placeholder={t('documents.repository.createModal.cronPlaceholder')}
            />
            <p className="text-xs text-muted-foreground">{t('documents.repository.createModal.cronHint')}</p>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label>{t('documents.repository.createModal.annotation')}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t('documents.repository.createModal.annotationDesc')}</p>
            </div>
            <Switch checked={newRepoAnnotation} onCheckedChange={setNewRepoAnnotation} />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label>{t('documents.repository.createModal.apiExtract')}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t('documents.repository.createModal.apiExtractDesc')}</p>
            </div>
            <Switch checked={newRepoApiExtract} onCheckedChange={setNewRepoApiExtract} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentRepository;

export const documentRepositoryPlugin: DocumentTabPlugin = {
  id: 'repository',
  name: 'Document Repository',
  tabLabelKey: 'documents.tabs.repository',
  order: 3,
  component: DocumentRepository,
};
