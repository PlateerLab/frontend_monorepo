'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import {
  ContentArea, Button, StatusBadge, SearchInput, FilterTabs, Modal, useToast,
} from '@xgen/ui';
import type { FilterTab } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiRefreshCw, FiUpload } from '@xgen/icons';

import type { Workflow, FilterMode } from './types';
import { listWorkflowStore, deleteWorkflowFromStore, updateWorkflowDeploy } from './api/workflow-store-api';
import {
  WorkflowCard,
  getWorkflowState,
  formatCompactDate,
  isWorkflowDeployed,
} from './components/workflow-card';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const NS = 'admin.workflowManagement.workflowStore';

// ─────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────

const AdminWorkflowStorePage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  // ── Fetch ──
  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listWorkflowStore();
      setWorkflows(res.workflows ?? []);
    } catch {
      setError(t(`${NS}.loadError`));
      toast.error(t(`${NS}.loadError`));
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  // ── Filter & Search ──
  const filteredWorkflows = useMemo(() => {
    let list = workflows;

    if (filter !== 'all') {
      list = list.filter((w) => getWorkflowState(w) === filter);
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
  }, [workflows, filter, search]);

  // ── Filter tabs ──
  const filterTabs: FilterTab[] = useMemo(() => {
    const activeCount = workflows.filter((w) => getWorkflowState(w) === 'active').length;
    const inactiveCount = workflows.filter((w) => getWorkflowState(w) === 'inactive').length;
    return [
      { key: 'all', label: t(`${NS}.filter.all`), count: workflows.length },
      { key: 'active', label: t(`${NS}.filter.active`), count: activeCount },
      { key: 'inactive', label: t(`${NS}.filter.inactive`), count: inactiveCount },
    ];
  }, [workflows, t]);

  // ── Delete ──
  const handleDelete = useCallback(
    async (w: Workflow) => {
      const confirmed = await toast.confirm({
        title: t(`${NS}.toast.deleteConfirmTitle`),
        message: t(`${NS}.toast.deleteConfirmMessage`, { name: w.workflow_upload_name }),
        variant: 'danger',
        confirmText: t(`${NS}.card.delete`),
        cancelText: t(`${NS}.toast.cancel`),
      });
      if (!confirmed) return;
      try {
        await deleteWorkflowFromStore(w.workflow_id, w.current_version, w.is_template);
        toast.success(t(`${NS}.toast.deleteConfirmTitle`));
        fetchWorkflows();
      } catch {
        toast.error(t(`${NS}.error`));
      }
    },
    [fetchWorkflows, t, toast],
  );

  // ── Deploy Approve ──
  const handleApprove = useCallback(
    async (w: Workflow) => {
      try {
        await updateWorkflowDeploy(w.workflow_id, {
          enable_deploy: true,
          inquire_deploy: false,
          is_accepted: Boolean(w.is_accepted),
          is_shared: Boolean(w.is_shared),
          share_group: w.share_group || null,
          user_id: w.user_id,
        });
        toast.success(t(`${NS}.toast.approveSuccess`));
        fetchWorkflows();
      } catch {
        toast.error(t(`${NS}.toast.approveError`));
      }
    },
    [fetchWorkflows, t, toast],
  );

  // ── Deploy Reject ──
  const handleReject = useCallback(
    async (w: Workflow) => {
      try {
        await updateWorkflowDeploy(w.workflow_id, {
          enable_deploy: false,
          inquire_deploy: false,
          is_accepted: Boolean(w.is_accepted),
          is_shared: Boolean(w.is_shared),
          share_group: w.share_group || null,
          user_id: w.user_id,
        });
        toast.success(t(`${NS}.toast.rejectSuccess`));
        fetchWorkflows();
      } catch {
        toast.error(t(`${NS}.toast.rejectError`));
      }
    },
    [fetchWorkflows, t, toast],
  );

  // ── Upload (placeholder) ──
  const handleUpload = useCallback(() => {
    toast.info(t(`${NS}.uploadComingSoon`));
  }, [toast]);

  // ── Error state ──
  if (error && workflows.length === 0) {
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
          <Button variant="primary" onClick={fetchWorkflows}>
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
          <Button variant="outline" size="sm" onClick={fetchWorkflows}>
            <FiRefreshCw className="mr-1.5 h-3.5 w-3.5" />
            {t(`${NS}.refresh`)}
          </Button>
          <Button variant="primary" size="sm" onClick={handleUpload}>
            <FiUpload className="mr-1.5 h-3.5 w-3.5" />
            {t(`${NS}.upload`)}
          </Button>
        </div>
      }
    >
      {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterTabs
            tabs={filterTabs}
            activeKey={filter}
            onChange={(key) => setFilter(key as FilterMode)}
          />
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t(`${NS}.searchPlaceholder`)}
            debounceDelay={200}
            className="w-72"
          />
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">{t(`${NS}.loading`)}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredWorkflows.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {search.trim()
                ? t(`${NS}.noResultsSearch`)
                : filter !== 'all'
                  ? t(`${NS}.noResultsFilter`)
                  : t(`${NS}.noResults`)}
            </p>
          </div>
        )}

        {/* Card grid */}
        {!loading && filteredWorkflows.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredWorkflows.map((w) => (
              <WorkflowCard
                key={w.id}
                workflow={w}
                onClick={() => setSelectedWorkflow(w)}
                onSettings={() => setSelectedWorkflow(w)}
                onDelete={() => handleDelete(w)}
                onApprove={() => handleApprove(w)}
                onReject={() => handleReject(w)}
              />
            ))}
          </div>
        )}
      {/* Detail Modal (simple info view) */}
      {selectedWorkflow && (
        <Modal
          isOpen={!!selectedWorkflow}
          onClose={() => setSelectedWorkflow(null)}
          title={selectedWorkflow.workflow_upload_name}
          size="md"
        >
          <div className="flex flex-col gap-4">
            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                variant={
                  getWorkflowState(selectedWorkflow) === 'active'
                    ? 'success'
                    : 'error'
                }
              >
                {getWorkflowState(selectedWorkflow) === 'active'
                  ? t(`${NS}.filter.active`)
                  : t(`${NS}.filter.inactive`)}
              </StatusBadge>
              <StatusBadge
                variant={isWorkflowDeployed(selectedWorkflow) ? 'success' : 'neutral'}
              >
                {isWorkflowDeployed(selectedWorkflow)
                  ? t(`${NS}.card.deployed`)
                  : t(`${NS}.card.notDeployed`)}
              </StatusBadge>
            </div>

            {/* Info rows */}
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="font-medium text-muted-foreground">{t(`${NS}.detail.id`)}</dt>
              <dd className="font-mono text-foreground">{selectedWorkflow.workflow_id}</dd>

              <dt className="font-medium text-muted-foreground">{t(`${NS}.detail.owner`)}</dt>
              <dd className="text-foreground">
                {selectedWorkflow.username || selectedWorkflow.full_name || t(`${NS}.card.unknownOwner`)}
              </dd>

              <dt className="font-medium text-muted-foreground">
                {t(`${NS}.card.nodes`)}
              </dt>
              <dd className="text-foreground">{selectedWorkflow.node_count}</dd>

              <dt className="font-medium text-muted-foreground">{t(`${NS}.detail.version`)}</dt>
              <dd className="text-foreground">
                {selectedWorkflow.current_version} / {selectedWorkflow.latest_version}
              </dd>

              <dt className="font-medium text-muted-foreground">{t(`${NS}.detail.updated`)}</dt>
              <dd className="text-foreground">
                {formatCompactDate(selectedWorkflow.updated_at || selectedWorkflow.created_at)}
              </dd>

              {selectedWorkflow.description && (
                <>
                  <dt className="font-medium text-muted-foreground">{t(`${NS}.detail.description`)}</dt>
                  <dd className="text-foreground">{selectedWorkflow.description}</dd>
                </>
              )}

              {selectedWorkflow.tags && selectedWorkflow.tags.length > 0 && (
                <>
                  <dt className="font-medium text-muted-foreground">{t(`${NS}.detail.tags`)}</dt>
                  <dd className="flex flex-wrap gap-1">
                    {selectedWorkflow.tags.map((tag) => (
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
  id: 'admin-workflow-store',
  name: 'AdminWorkflowStorePage',
  adminSection: 'admin-workflow',
  routes: {
    'admin-workflow-store': AdminWorkflowStorePage,
  },
};

export default feature;
