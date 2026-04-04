'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import type { AdminWorkflowMeta } from '@xgen/api-client';
import {
  ContentArea, DataTable, StatusBadge, SearchInput, FilterTabs, Button, useToast,
} from '@xgen/ui';
import type { DataTableColumn, FilterTab } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import {
  getAllWorkflowMetaAdmin, deleteWorkflowAdmin, updateWorkflowAdmin,
} from '@xgen/api-client';
import { WorkflowEditModal } from './WorkflowEditModal';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'active' | 'inactive';

function deriveStatus(w: AdminWorkflowMeta): 'active' | 'inactive' {
  if (!w.has_startnode || !w.has_endnode || (w.node_count ?? 0) < 3 || w.is_accepted === false) {
    return 'inactive';
  }
  return 'active';
}

function deriveDeployLabel(
  w: AdminWorkflowMeta,
  t: (k: string) => string,
): { label: string; variant: 'warning' | 'success' | 'neutral' | 'error' } {
  if (w.inquire_deploy) return { label: t('admin.workflowManagement.workflowControl.deployPending'), variant: 'warning' };
  if (w.is_deployed) return { label: t('admin.workflowManagement.workflowControl.deployed'), variant: 'success' };
  return { label: t('admin.workflowManagement.workflowControl.notDeployed'), variant: 'neutral' };
}

// ─────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────

const AdminWorkflowManagementPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [workflows, setWorkflows] = useState<AdminWorkflowMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [editingWorkflow, setEditingWorkflow] = useState<AdminWorkflowMeta | null>(null);

  // ── Fetch ──
  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllWorkflowMetaAdmin(1, 1000);
      setWorkflows(res.workflows ?? []);
    } catch {
      toast.error(t('admin.workflowManagement.workflowControl.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => { fetchWorkflows(); }, [fetchWorkflows]);

  // ── Filter & Search ──
  const filteredWorkflows = useMemo(() => {
    let list = workflows;
    if (filter !== 'all') {
      list = list.filter((w) => deriveStatus(w) === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (w) =>
          w.workflow_name?.toLowerCase().includes(q) ||
          w.username?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [workflows, filter, search]);

  // ── Filter tabs ──
  const filterTabs: FilterTab[] = useMemo(() => {
    const activeCount = workflows.filter((w) => deriveStatus(w) === 'active').length;
    const inactiveCount = workflows.filter((w) => deriveStatus(w) === 'inactive').length;
    return [
      { key: 'all', label: t('admin.workflowManagement.workflowControl.filterAll'), count: workflows.length },
      { key: 'active', label: t('admin.workflowManagement.workflowControl.statusActive'), count: activeCount },
      { key: 'inactive', label: t('admin.workflowManagement.workflowControl.statusInactive'), count: inactiveCount },
    ];
  }, [workflows, t]);

  // ── Deploy Approve / Reject ──
  const handleDeployApprove = useCallback(async (w: AdminWorkflowMeta) => {
    try {
      await updateWorkflowAdmin(w.workflow_id, {
        enable_deploy: true,
        inquire_deploy: false,
        is_accepted: Boolean(w.is_accepted),
        is_shared: Boolean(w.is_shared),
        share_group: w.share_group || null,
        user_id: w.user_id,
      });
      toast.success(t('admin.workflowManagement.workflowControl.deployApproveSuccess', { name: w.workflow_name }));
      fetchWorkflows();
    } catch {
      toast.error(t('admin.workflowManagement.workflowControl.deployApproveError', { name: w.workflow_name }));
    }
  }, [fetchWorkflows, t, toast]);

  const handleDeployReject = useCallback(async (w: AdminWorkflowMeta) => {
    try {
      await updateWorkflowAdmin(w.workflow_id, {
        enable_deploy: false,
        inquire_deploy: false,
        is_accepted: Boolean(w.is_accepted),
        is_shared: Boolean(w.is_shared),
        share_group: w.share_group || null,
        user_id: w.user_id,
      });
      toast.success(t('admin.workflowManagement.workflowControl.deployRejectSuccess', { name: w.workflow_name }));
      fetchWorkflows();
    } catch {
      toast.error(t('admin.workflowManagement.workflowControl.deployRejectError', { name: w.workflow_name }));
    }
  }, [fetchWorkflows, t, toast]);

  // ── Delete ──
  const handleDelete = useCallback(async (w: AdminWorkflowMeta) => {
    const confirmed = await toast.confirm({
      title: t('admin.workflowManagement.workflowControl.deleteTitle'),
      description: t('admin.workflowManagement.workflowControl.deleteMessage', { name: w.workflow_name }),
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await deleteWorkflowAdmin(w.workflow_id, w.user_id);
      toast.success(t('admin.workflowManagement.workflowControl.deleteSuccess'));
      fetchWorkflows();
    } catch {
      toast.error(t('admin.workflowManagement.workflowControl.deleteError'));
    }
  }, [fetchWorkflows, t, toast]);

  // ── Columns ──
  const columns: DataTableColumn<AdminWorkflowMeta>[] = useMemo(() => [
    {
      id: 'workflow_name',
      header: t('admin.workflowManagement.workflowControl.tableHeaders.name'),
      field: 'workflow_name',
      sortable: true,
      cell: (row) => <span className="font-medium">{row.workflow_name}</span>,
    },
    {
      id: 'username',
      header: t('admin.workflowManagement.workflowControl.tableHeaders.author'),
      field: 'username',
      sortable: true,
      cell: (row) => <span className="text-sm">{row.username || 'Unknown'}</span>,
    },
    {
      id: 'status',
      header: t('admin.workflowManagement.workflowControl.tableHeaders.status'),
      sortable: true,
      cell: (row) => {
        const s = deriveStatus(row);
        return (
          <StatusBadge variant={s === 'active' ? 'success' : 'error'}>
            {s === 'active'
              ? t('admin.workflowManagement.workflowControl.statusActive')
              : t('admin.workflowManagement.workflowControl.statusInactive')}
          </StatusBadge>
        );
      },
    },
    {
      id: 'sharing',
      header: t('admin.workflowManagement.workflowControl.tableHeaders.sharing'),
      sortable: true,
      cell: (row) => (
        <StatusBadge variant={row.is_shared ? 'info' : 'neutral'}>
          {row.is_shared
            ? t('admin.workflowManagement.workflowControl.shared')
            : t('admin.workflowManagement.workflowControl.personal')}
        </StatusBadge>
      ),
    },
    {
      id: 'deploy',
      header: t('admin.workflowManagement.workflowControl.tableHeaders.deploy'),
      sortable: true,
      cell: (row) => {
        const d = deriveDeployLabel(row, t);
        return <StatusBadge variant={d.variant}>{d.label}</StatusBadge>;
      },
    },
    {
      id: 'node_count',
      header: t('admin.workflowManagement.workflowControl.tableHeaders.nodes'),
      field: 'node_count',
      sortable: true,
      cell: (row) => <span className="font-mono text-xs">{row.node_count}</span>,
      minWidth: '80px',
    },
    {
      id: 'updated_at',
      header: t('admin.workflowManagement.workflowControl.tableHeaders.lastModified'),
      field: 'updated_at',
      sortable: true,
      cell: (row) =>
        row.updated_at ? (
          <span className="text-xs">{new Date(row.updated_at).toLocaleDateString('ko-KR')}</span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        ),
    },
    {
      id: 'actions',
      header: t('admin.workflowManagement.workflowControl.tableHeaders.actions'),
      cell: (row) => (
        <div className="flex gap-1 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setEditingWorkflow(row); }}
          >
            {t('admin.workflowManagement.workflowControl.settings')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
          >
            {t('admin.workflowManagement.workflowControl.delete')}
          </Button>
          {row.inquire_deploy && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
                onClick={(e) => { e.stopPropagation(); handleDeployApprove(row); }}
              >
                {t('admin.workflowManagement.workflowControl.approve')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleDeployReject(row); }}
              >
                {t('admin.workflowManagement.workflowControl.reject')}
              </Button>
            </>
          )}
        </div>
      ),
    },
  ], [t, handleDelete, handleDeployApprove, handleDeployReject]);

  return (
    <ContentArea
      title={t('admin.pages.workflowManagement.title')}
      description={`${t('admin.workflowManagement.workflowControl.total')} ${filteredWorkflows.length}${t('admin.workflowManagement.workflowControl.unit')}`}
      headerActions={
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('admin.workflowManagement.workflowControl.searchPlaceholder')}
          className="w-72"
        />
      }
    >
      {/* Filter tabs */}
        <FilterTabs
          tabs={filterTabs}
          activeKey={filter}
          onChange={(key) => setFilter(key as StatusFilter)}
        />

        {/* Table */}
        <DataTable
          data={filteredWorkflows}
          columns={columns}
          rowKey={(row) => row.id}
          loading={loading}
          emptyMessage={
            search
              ? t('admin.workflowManagement.workflowControl.noSearchResults', { query: search })
              : t('admin.workflowManagement.workflowControl.noWorkflows')
          }
          onRowClick={(row) => setEditingWorkflow(row)}
          className="border rounded-lg"
        />
      {/* Edit Modal */}
      {editingWorkflow && (
        <WorkflowEditModal
          workflow={editingWorkflow}
          isOpen={!!editingWorkflow}
          onClose={() => setEditingWorkflow(null)}
          onUpdated={fetchWorkflows}
        />
      )}
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Module
// ─────────────────────────────────────────────────────────────

const feature: AdminFeatureModule = {
  id: 'admin-workflow-management',
  name: 'AdminWorkflowManagementPage',
  adminSection: 'admin-workflow',
  routes: {
    'admin-workflow-management': AdminWorkflowManagementPage,
  },
};

export default feature;
