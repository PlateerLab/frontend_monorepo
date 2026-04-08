'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea, Button, SearchInput, FilterTabs, ResourceCardGrid, useToast } from '@xgen/ui';
import type { FilterTab, ResourceCardProps, CardBadge, CardMetaItem, CardActionButton } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiRefreshCw, FiDownload, FiCopy, FiEdit, FiTrash2 } from '@xgen/icons';

import { getAllPrompts, deletePrompt } from './api/prompt-api';
import type { Prompt } from './types';
import PromptCreateModal from './components/prompt-create-modal';
import PromptEditModal from './components/prompt-edit-modal';
import PromptExpandModal from './components/prompt-expand-modal';
import DownloadDropdown from './components/download-dropdown';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const PS = 'admin.agentflowManagement.promptStore';

type LanguageFilter = 'all' | 'ko' | 'en';
type TypeFilter = 'all' | 'user' | 'system';
type VisibilityFilter = 'all' | 'template' | 'shared' | 'private';

// ─────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────

const AdminPromptStorePage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Data
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [expandedPrompt, setExpandedPrompt] = useState<Prompt | null>(null);

  // Download dropdown
  const [downloadOpen, setDownloadOpen] = useState(false);

  // ── Load prompts ──
  const loadPrompts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllPrompts({
        language: languageFilter === 'all' ? undefined : languageFilter,
      });
      setPrompts(data.prompts ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t(`${PS}.error`);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [languageFilter, t]);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  // ── Filtered prompts ──
  const filteredPrompts = useMemo(() => {
    let result = prompts;

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((p) => p.prompt_type === typeFilter);
    }

    // Visibility filter
    if (visibilityFilter === 'template') {
      result = result.filter((p) => p.is_template);
    } else if (visibilityFilter === 'shared') {
      result = result.filter((p) => p.public_available);
    } else if (visibilityFilter === 'private') {
      result = result.filter((p) => !p.public_available);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.prompt_title.toLowerCase().includes(q) ||
          p.prompt_content.toLowerCase().includes(q) ||
          (p.username && p.username.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [prompts, typeFilter, visibilityFilter, searchQuery]);

  // ── Handlers ──
  const handleCopy = async (prompt: Prompt) => {
    try {
      await navigator.clipboard.writeText(prompt.prompt_content);
      toast.success(t(`${PS}.toast.copySuccess`));
    } catch {
      // Clipboard not available
    }
  };

  const handleDelete = async (prompt: Prompt) => {
    const confirmed = await toast.confirm({
      title: t(`${PS}.toast.deleteConfirmTitle`),
      message: t(`${PS}.toast.deleteConfirmMessage`, {
        item: prompt.prompt_title,
        type: t(`${PS}.toast.itemType`),
      }),
      variant: 'danger',
      confirmText: t(`${PS}.toast.delete`),
      cancelText: t(`${PS}.toast.cancel`),
    });
    if (!confirmed) return;

    try {
      await deletePrompt({ prompt_uid: prompt.prompt_uid });
      await loadPrompts();
    } catch {
      // Error handled by API layer
    }
  };

  // ── Filter tab configs ──
  const languageTabs: FilterTab[] = [
    { key: 'all', label: `🌐 ${t(`${PS}.languageFilter.all`)}` },
    { key: 'ko', label: `🇰🇷 ${t(`${PS}.languageFilter.ko`)}` },
    { key: 'en', label: `🇺🇸 ${t(`${PS}.languageFilter.en`)}` },
  ];

  const typeTabs: FilterTab[] = [
    { key: 'all', label: t(`${PS}.promptTypeFilter.all`) },
    { key: 'user', label: t(`${PS}.promptTypeFilter.user`) },
    { key: 'system', label: t(`${PS}.promptTypeFilter.system`) },
  ];

  const visibilityTabs: FilterTab[] = [
    { key: 'all', label: t(`${PS}.filter.all`) },
    { key: 'template', label: t(`${PS}.filter.template`) },
    { key: 'shared', label: t(`${PS}.filter.shared`) },
    { key: 'private', label: t(`${PS}.filter.private`) },
  ];

  // ── Map prompts to ResourceCard items ──
  const cardItems: ResourceCardProps<Prompt>[] = useMemo(
    () =>
      filteredPrompts.map((p) => {
        const badges: CardBadge[] = [
          { text: p.language.toUpperCase(), variant: 'info' },
          {
            text: p.prompt_type,
            variant: p.prompt_type === 'system' ? 'warning' : 'default',
          },
          ...(p.is_template
            ? [{ text: t(`${PS}.card.template`), variant: 'success' as const }]
            : []),
          {
            text: p.public_available ? t(`${PS}.card.public`) : t(`${PS}.card.private`),
            variant: p.public_available ? 'success' : 'default',
          },
        ];

        const truncatedContent =
          p.prompt_content.length > 80
            ? `${p.prompt_content.slice(0, 80)}...`
            : p.prompt_content;

        const metadata: CardMetaItem[] = [
          {
            value: p.created_at
              ? new Date(p.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                })
              : '-',
          },
          ...(p.username ? [{ value: p.username }] : []),
          { value: `${t(`${PS}.card.charCount`)}: ${p.prompt_content.length}` },
        ];

        const primaryActions: CardActionButton[] = [
          {
            id: 'copy',
            label: t(`${PS}.card.copy`),
            icon: <FiCopy className="h-3.5 w-3.5" />,
            onClick: () => handleCopy(p),
          },
          {
            id: 'edit',
            label: t(`${PS}.card.edit`),
            icon: <FiEdit className="h-3.5 w-3.5" />,
            onClick: () => setEditingPrompt(p),
          },
          {
            id: 'delete',
            label: t(`${PS}.card.delete`),
            icon: <FiTrash2 className="h-3.5 w-3.5" />,
            onClick: () => handleDelete(p),
          },
        ];

        return {
          id: String(p.id),
          data: p,
          title: p.prompt_title,
          description: truncatedContent,
          badges,
          metadata,
          primaryActions,
          onClick: () => setExpandedPrompt(p),
        };
      }),
    [filteredPrompts, t, handleCopy, handleDelete],
  );

  // ── Error state ──
  if (error && prompts.length === 0) {
    return (
      <ContentArea
        title={t(`${PS}.title`)}
        description={t(`${PS}.subtitle`)}
      >
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <h3 className="text-base font-semibold text-destructive">
            {t(`${PS}.error`)}
          </h3>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="primary" onClick={loadPrompts}>
            {t(`${PS}.refresh`)}
          </Button>
        </div>
      </ContentArea>
    );
  }

  // ── Render ──
  return (
    <ContentArea
      title={t(`${PS}.title`)}
      description={t(`${PS}.subtitle`)}
      headerActions={
        <div className="relative flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDownloadOpen((prev) => !prev)}
          >
            <FiDownload className="mr-1 h-3.5 w-3.5" />
            {t(`${PS}.download.title`)}
          </Button>
          <DownloadDropdown
            isOpen={downloadOpen}
            onToggle={() => setDownloadOpen(false)}
          />
          <Button variant="primary" size="sm" onClick={loadPrompts}>
            <FiRefreshCw className="mr-1 h-3.5 w-3.5" />
            {t(`${PS}.refresh`)}
          </Button>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-4">
            <FilterTabs
              tabs={languageTabs}
              activeKey={languageFilter}
              onChange={(key) => setLanguageFilter(key as LanguageFilter)}
              variant="underline"
            />
            <div className="h-5 w-px bg-border" />
            <FilterTabs
              tabs={typeTabs}
              activeKey={typeFilter}
              onChange={(key) => setTypeFilter(key as TypeFilter)}
              variant="underline"
            />
            <div className="h-5 w-px bg-border" />
            <FilterTabs
              tabs={visibilityTabs}
              activeKey={visibilityFilter}
              onChange={(key) => setVisibilityFilter(key as VisibilityFilter)}
              variant="underline"
            />
          </div>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t(`${PS}.searchPlaceholder`)}
            className="w-72"
          />
        </div>
      }
    >
      <ResourceCardGrid<Prompt>
        items={cardItems}
        loading={loading}
        emptyStateProps={{
          title: searchQuery
            ? t(`${PS}.noResultsSearch`)
            : prompts.length === 0
              ? t(`${PS}.noResults`)
              : t(`${PS}.noResultsFilter`),
        }}
      />
      {/* Create Modal */}
      <PromptCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={loadPrompts}
      />

      {/* Edit Modal */}
      {editingPrompt && (
        <PromptEditModal
          isOpen={!!editingPrompt}
          prompt={editingPrompt}
          onClose={() => setEditingPrompt(null)}
          onUpdated={loadPrompts}
        />
      )}

      {/* Expand Modal */}
      {expandedPrompt && (
        <PromptExpandModal
          isOpen={!!expandedPrompt}
          prompt={expandedPrompt}
          onClose={() => setExpandedPrompt(null)}
        />
      )}
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Module
// ─────────────────────────────────────────────────────────────

const feature: AdminFeatureModule = {
  id: 'admin-prompt-store',
  name: 'AdminPromptStorePage',
  adminSection: 'admin-agentflow',
  sidebarItems: [
    { id: 'admin-prompt-store', titleKey: 'admin.sidebar.workflow.promptStore.title', descriptionKey: 'admin.sidebar.workflow.promptStore.description' },
  ],
  routes: {
    'admin-prompt-store': AdminPromptStorePage,
  },
};

export default feature;
