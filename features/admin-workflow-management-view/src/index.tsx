'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { WorkflowMgmtTabPlugin, WorkflowMgmtTabPluginProps, CardBadge, ResourceCardProps } from '@xgen/types';
import type { AdminWorkflowMeta } from '@xgen/api-client';
import {
  ResourceCardGrid, SearchInput, FilterTabs, Button, useToast,
} from '@xgen/ui';
import type { FilterTab } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiBox, FiSettings, FiTrash2 } from '@xgen/icons';
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
// Props (view plugin receives extra onSelectWorkflow callback)
// ─────────────────────────────────────────────────────────────

interface ViewProps extends WorkflowMgmtTabPluginProps {
  onSelectWorkflow?: (wf: AdminWorkflowMeta) => void;
}

// ─────────────────────────────────────────────────────────────
// WorkflowListView
// ─────────────────────────────────────────────────────────────

const WorkflowListView: React.FC<ViewProps> = ({ onSelectWorkflow, onSubToolbarChange }) => {
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

  // Push toolbar to orchestrator
  useEffect(() => {
    onSubToolbarChange?.(
      <div className="flex items-center justify-between w-full px-6">
        <FilterTabs
          tabs={filterTabs}
          activeKey={filter}
          onChange={(key) => setFilter(key as StatusFilter)}
          variant="underline"
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('admin.workflowManagement.workflowControl.searchPlaceholder')}
          className="w-72"
        />
      </div>
    );
  }, [filterTabs, filter, search, t, onSubToolbarChange]);

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
      message: t('admin.workflowManagement.workflowControl.deleteMessage', { name: w.workflow_name }),
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

  // ── Card items ──
  const cardItems: ResourceCardProps<AdminWorkflowMeta>[] = useMemo(() => {
    return filteredWorkflows.map((w) => {
      const status = deriveStatus(w);
      const deploy = deriveDeployLabel(w, t);

      const badges: CardBadge[] = [
        {
          text: status === 'active'
            ? t('admin.workflowManagement.workflowControl.statusActive')
            : t('admin.workflowManagement.workflowControl.statusInactive'),
          variant: status === 'active' ? 'success' : 'error',
        },
        {
          text: w.is_shared
            ? t('admin.workflowManagement.workflowControl.shared')
            : t('admin.workflowManagement.workflowControl.personal'),
          variant: w.is_shared ? 'primary' : 'secondary',
        },
        {
          text: deploy.label,
          variant: deploy.variant === 'neutral' ? 'default' : deploy.variant,
        },
      ];

      return {
        id: String(w.workflow_id ?? w.id),
        data: w,
        title: w.workflow_name,
        thumbnail: {
          icon: <FiBox />,
          backgroundColor: 'rgba(120, 60, 237, 0.1)',
          iconColor: '#783ced',
        },
        badges,
        metadata: [
          { value: w.username || 'Unknown' },
          {
            value: w.updated_at
              ? new Date(w.updated_at).toLocaleDateString('ko-KR')
              : '-',
          },
          {
            value: t('admin.workflowManagement.workflowControl.nodeCount', {
              count: w.node_count ?? 0,
            }),
          },
        ],
        primaryActions: [
          {
            id: 'settings',
            icon: <FiSettings />,
            label: t('admin.workflowManagement.workflowControl.settings'),
            onClick: () => setEditingWorkflow(w),
          },
          {
            id: 'delete',
            icon: <FiTrash2 />,
            label: t('admin.workflowManagement.workflowControl.delete'),
            onClick: () => handleDelete(w),
          },
        ],
        dropdownActions: w.inquire_deploy
          ? [
              {
                id: 'approve',
                label: t('admin.workflowManagement.workflowControl.approve'),
                onClick: () => handleDeployApprove(w),
              },
              {
                id: 'reject',
                label: t('admin.workflowManagement.workflowControl.reject'),
                onClick: () => handleDeployReject(w),
                danger: true,
              },
            ]
          : [],
        onClick: () => onSelectWorkflow?.(w),
      };
    });
  }, [filteredWorkflows, t, handleDelete, handleDeployApprove, handleDeployReject, onSelectWorkflow]);

  return (
    <div className="p-6">
      <ResourceCardGrid
        items={cardItems}
        loading={loading}
        showEmptyState
        emptyStateProps={{
          title: search
            ? t('admin.workflowManagement.workflowControl.noSearchResults', { query: search })
            : t('admin.workflowManagement.workflowControl.noWorkflows'),
        }}
      />

      {/* Settings Modal */}
      {editingWorkflow && (
        <WorkflowEditModal
          workflow={editingWorkflow}
          isOpen
          onClose={() => setEditingWorkflow(null)}
          onUpdated={fetchWorkflows}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Plugin Export
// ─────────────────────────────────────────────────────────────

export const workflowMgmtViewPlugin: WorkflowMgmtTabPlugin = {
  id: 'view',
  name: 'WorkflowListView',
  tabLabelKey: 'admin.workflowMgmt.title',
  order: 0,
  component: WorkflowListView as React.ComponentType<WorkflowMgmtTabPluginProps>,
};

export default workflowMgmtViewPlugin;
