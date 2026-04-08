'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import {
  ContentArea, Button, StatusBadge, SearchInput, FilterTabs, ResourceCardGrid, Modal, useToast,
} from '@xgen/ui';
import type { FilterTab, ResourceCardProps, CardBadge, CardMetaItem, CardActionButton, CardDropdownItem } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiRefreshCw, FiUpload, FiSettings, FiTrash2, FiCheck, FiX } from '@xgen/icons';

import type { Agentflow, FilterMode } from './types';
import { listAgentflowStore, deleteAgentflowFromStore, updateAgentflowDeploy } from './api/agentflow-store-api';
import {
  getAgentflowState,
  formatCompactDate,
  isAgentflowDeployed,
  isAgentflowDeployPending,
} from './components/agentflow-card';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const NS = 'admin.agentflowManagement.agentflowStore';

// ─────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────

const AdminAgentflowStorePage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [agentflows, setAgentflows] = useState<Agentflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [selectedAgentflow, setSelectedAgentflow] = useState<Agentflow | null>(null);

  // ── Fetch ──
  const fetchAgentflows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAgentflowStore();
      setAgentflows(res.workflows ?? []);
    } catch {
      setError(t(`${NS}.loadError`));
      toast.error(t(`${NS}.loadError`));
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchAgentflows();
  }, [fetchAgentflows]);

  // ── Filter & Search ──
  const filteredAgentflows = useMemo(() => {
    let list = agentflows;

    if (filter !== 'all') {
      list = list.filter((w) => getAgentflowState(w) === filter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (w) =>
          w.workflow_name?.toLowerCase().includes(q) ||
          w.workflow_upload_name?.toLowerCase().includes(q) ||
          w.description?.toLowerCase().includes(q) ||
          w.username?.toLowerCase().includes(q) ||
          w.tags?.some((tag) => tag.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [agentflows, filter, search]);

  // ── Filter tabs ──
  const filterTabs: FilterTab[] = useMemo(() => {
    const activeCount = agentflows.filter((w) => getAgentflowState(w) === 'active').length;
    const inactiveCount = agentflows.filter((w) => getAgentflowState(w) === 'inactive').length;
    return [
      { key: 'all', label: t(`${NS}.filter.all`), count: agentflows.length },
      { key: 'active', label: t(`${NS}.filter.active`), count: activeCount },
      { key: 'inactive', label: t(`${NS}.filter.inactive`), count: inactiveCount },
    ];
  }, [agentflows, t]);

  // ── Delete ──
  const handleDelete = useCallback(
    async (w: Agentflow) => {
      const confirmed = await toast.confirm({
        title: t(`${NS}.toast.deleteConfirmTitle`),
        message: t(`${NS}.toast.deleteConfirmMessage`, { name: w.workflow_upload_name }),
        variant: 'danger',
        confirmText: t(`${NS}.card.delete`),
        cancelText: t(`${NS}.toast.cancel`),
      });
      if (!confirmed) return;
      try {
        await deleteAgentflowFromStore(w.workflow_id, w.current_version, w.is_template);
        toast.success(t(`${NS}.toast.deleteConfirmTitle`));
        fetchAgentflows();
      } catch {
        toast.error(t(`${NS}.error`));
      }
    },
    [fetchAgentflows, t, toast],
  );

  // ── Deploy Approve ──
  const handleApprove = useCallback(
    async (w: Agentflow) => {
      try {
        await updateAgentflowDeploy(w.workflow_id, {
          enable_deploy: true,
          inquire_deploy: false,
          is_accepted: Boolean(w.is_accepted),
          is_shared: Boolean(w.is_shared),
          share_roles: w.share_roles || [],
          user_id: w.user_id,
        });
        toast.success(t(`${NS}.toast.approveSuccess`));
        fetchAgentflows();
      } catch {
        toast.error(t(`${NS}.toast.approveError`));
      }
    },
    [fetchAgentflows, t, toast],
  );

  // ── Deploy Reject ──
  const handleReject = useCallback(
    async (w: Agentflow) => {
      try {
        await updateAgentflowDeploy(w.workflow_id, {
          enable_deploy: false,
          inquire_deploy: false,
          is_accepted: Boolean(w.is_accepted),
          is_shared: Boolean(w.is_shared),
          share_roles: w.share_roles || [],
          user_id: w.user_id,
        });
        toast.success(t(`${NS}.toast.rejectSuccess`));
        fetchAgentflows();
      } catch {
        toast.error(t(`${NS}.toast.rejectError`));
      }
    },
    [fetchAgentflows, t, toast],
  );

  // ── Upload (placeholder) ──
  const handleUpload = useCallback(() => {
    toast.info(t(`${NS}.uploadComingSoon`));
  }, [toast]);

  // ── Map agentflows to ResourceCard items ──
  const cardItems: ResourceCardProps<Agentflow>[] = useMemo(
    () =>
      filteredAgentflows.map((w) => {
        const state = getAgentflowState(w);
        const deployed = isAgentflowDeployed(w);
        const deployPending = isAgentflowDeployPending(w);
        const isPrivate = !w.is_shared;
        const ownerName = w.username || w.full_name || t(`${NS}.card.unknownOwner`);

        const badges: CardBadge[] = [
          {
            text: state === 'active' ? t(`${NS}.filter.active`) : t(`${NS}.filter.inactive`),
            variant: state === 'active' ? 'success' : 'error',
          },
          ...(isPrivate ? [{ text: t(`${NS}.card.private`), variant: 'default' as const }] : []),
          {
            text: deployed ? t(`${NS}.card.deployed`) : t(`${NS}.card.notDeployed`),
            variant: deployed ? 'success' : 'default',
          },
        ];

        const metadata: CardMetaItem[] = [
          { value: ownerName },
          { value: formatCompactDate(w.updated_at || w.created_at) },
          { value: `${t(`${NS}.card.nodes`)}: ${w.node_count}` },
        ];

        const primaryActions: CardActionButton[] = [
          {
            id: 'settings',
            label: t(`${NS}.card.settings`),
            icon: <FiSettings className="h-3.5 w-3.5" />,
            onClick: () => setSelectedAgentflow(w),
          },
          {
            id: 'delete',
            label: t(`${NS}.card.delete`),
            icon: <FiTrash2 className="h-3.5 w-3.5" />,
            onClick: () => handleDelete(w),
          },
        ];

        const dropdownActions: CardDropdownItem[] = deployPending
          ? [
              {
                id: 'approve',
                label: t(`${NS}.card.approve`),
                icon: <FiCheck className="h-4 w-4" />,
                onClick: () => handleApprove(w),
              },
              {
                id: 'reject',
                label: t(`${NS}.card.reject`),
                icon: <FiX className="h-4 w-4" />,
                danger: true,
                onClick: () => handleReject(w),
              },
            ]
          : [];

        return {
          id: String(w.id),
          data: w,
          title: w.workflow_upload_name,
          badges,
          metadata,
          primaryActions,
          dropdownActions,
          onClick: () => setSelectedAgentflow(w),
        };
      }),
    [filteredAgentflows, t, handleDelete, handleApprove, handleReject],
  );

  // ── Error state ──
  if (error && agentflows.length === 0) {
    return (
      <ContentArea
        title={t(`${NS}.title`)}
        description={t(`${NS}.subtitle`)}
      >
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <h3 className="text-base font-semibold text-destructive">
            {t(`${NS}.error`)}
          </h3>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="primary" onClick={fetchAgentflows}>
            <FiRefreshCw className="mr-1.5 h-4 w-4" />
            {t(`${NS}.refresh`)}
          </Button>
        </div>
      </ContentArea>
    );
  }

  return (
    <ContentArea
      title={t(`${NS}.title`)}
      description={t(`${NS}.subtitle`)}
      headerActions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAgentflows}>
            <FiRefreshCw className="mr-1.5 h-3.5 w-3.5" />
            {t(`${NS}.refresh`)}
          </Button>
          <Button variant="primary" size="sm" onClick={handleUpload}>
            <FiUpload className="mr-1.5 h-3.5 w-3.5" />
            {t(`${NS}.upload`)}
          </Button>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <FilterTabs
            tabs={filterTabs}
            activeKey={filter}
            onChange={(key) => setFilter(key as FilterMode)}
            variant="underline"
          />
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t(`${NS}.searchPlaceholder`)}
            debounceDelay={200}
            className="w-72"
          />
        </div>
      }
    >
      <ResourceCardGrid<Agentflow>
        items={cardItems}
        loading={loading}
        emptyStateProps={{
          title: search.trim()
            ? t(`${NS}.noResultsSearch`)
            : filter !== 'all'
              ? t(`${NS}.noResultsFilter`)
              : t(`${NS}.noResults`),
        }}
      />
      {/* Detail Modal (simple info view) */}
      {selectedAgentflow && (
        <Modal
          isOpen={!!selectedAgentflow}
          onClose={() => setSelectedAgentflow(null)}
          title={selectedAgentflow.workflow_upload_name}
          size="md"
        >
          <div className="flex flex-col gap-4">
            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                variant={
                  getAgentflowState(selectedAgentflow) === 'active'
                    ? 'success'
                    : 'error'
                }
              >
                {getAgentflowState(selectedAgentflow) === 'active'
                  ? t(`${NS}.filter.active`)
                  : t(`${NS}.filter.inactive`)}
              </StatusBadge>
              <StatusBadge
                variant={isAgentflowDeployed(selectedAgentflow) ? 'success' : 'neutral'}
              >
                {isAgentflowDeployed(selectedAgentflow)
                  ? t(`${NS}.card.deployed`)
                  : t(`${NS}.card.notDeployed`)}
              </StatusBadge>
            </div>

            {/* Info rows */}
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="font-medium text-muted-foreground">{t(`${NS}.detail.id`)}</dt>
              <dd className="font-mono text-foreground">{selectedAgentflow.workflow_id}</dd>

              <dt className="font-medium text-muted-foreground">{t(`${NS}.detail.owner`)}</dt>
              <dd className="text-foreground">
                {selectedAgentflow.username || selectedAgentflow.full_name || t(`${NS}.card.unknownOwner`)}
              </dd>

              <dt className="font-medium text-muted-foreground">
                {t(`${NS}.card.nodes`)}
              </dt>
              <dd className="text-foreground">{selectedAgentflow.node_count}</dd>

              <dt className="font-medium text-muted-foreground">{t(`${NS}.detail.version`)}</dt>
              <dd className="text-foreground">
                {selectedAgentflow.current_version} / {selectedAgentflow.latest_version}
              </dd>

              <dt className="font-medium text-muted-foreground">{t(`${NS}.detail.updated`)}</dt>
              <dd className="text-foreground">
                {formatCompactDate(selectedAgentflow.updated_at || selectedAgentflow.created_at)}
              </dd>

              {selectedAgentflow.description && (
                <>
                  <dt className="font-medium text-muted-foreground">{t(`${NS}.detail.description`)}</dt>
                  <dd className="text-foreground">{selectedAgentflow.description}</dd>
                </>
              )}

              {selectedAgentflow.tags && selectedAgentflow.tags.length > 0 && (
                <>
                  <dt className="font-medium text-muted-foreground">{t(`${NS}.detail.tags`)}</dt>
                  <dd className="flex flex-wrap gap-1">
                    {selectedAgentflow.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </dd>
                </>
              )}
            </dl>
          </div>
        </Modal>
      )}
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Module
// ─────────────────────────────────────────────────────────────

const feature: AdminFeatureModule = {
  id: 'admin-agentflow-store',
  name: 'AdminAgentflowStorePage',
  adminSection: 'admin-agentflow',
  sidebarItems: [
    { id: 'admin-agentflow-store', titleKey: 'admin.sidebar.agentflow.agentflowStore.title', descriptionKey: 'admin.sidebar.agentflow.agentflowStore.description' },
  ],
  routes: {
    'admin-agentflow-store': AdminAgentflowStorePage,
  },
};

export default feature;
