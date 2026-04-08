'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { AgentflowMgmtTabPlugin, AgentflowMgmtTabPluginProps, CardBadge, ResourceCardProps } from '@xgen/types';
import type { AdminAgentflowMeta } from '@xgen/api-client';
import {
  ResourceCardGrid, SearchInput, FilterTabs, Button, useToast,
} from '@xgen/ui';
import type { FilterTab } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiBox, FiSettings, FiTrash2 } from '@xgen/icons';
import {
  getAllAgentflowMetaAdmin, deleteAgentflowAdmin, updateAgentflowAdmin,
} from '@xgen/api-client';
import { AgentflowEditModal } from './AgentflowEditModal';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'active' | 'inactive';

function deriveStatus(w: AdminAgentflowMeta): 'active' | 'inactive' {
  if (!w.has_startnode || !w.has_endnode || (w.node_count ?? 0) < 3 || w.is_accepted === false) {
    return 'inactive';
  }
  return 'active';
}

function deriveDeployLabel(
  w: AdminAgentflowMeta,
  t: (k: string) => string,
): { label: string; variant: 'warning' | 'success' | 'neutral' | 'error' } {
  if (w.inquire_deploy) return { label: t('admin.agentflowManagement.agentflowControl.deployPending'), variant: 'warning' };
  if (w.is_deployed) return { label: t('admin.agentflowManagement.agentflowControl.deployed'), variant: 'success' };
  return { label: t('admin.agentflowManagement.agentflowControl.notDeployed'), variant: 'neutral' };
}

// ─────────────────────────────────────────────────────────────
// Props (view plugin receives extra onSelectAgentflow callback)
// ─────────────────────────────────────────────────────────────

interface ViewProps extends AgentflowMgmtTabPluginProps {
  onSelectAgentflow?: (wf: AdminAgentflowMeta) => void;
}

// ─────────────────────────────────────────────────────────────
// AgentflowListView
// ─────────────────────────────────────────────────────────────

const AgentflowListView: React.FC<ViewProps> = ({ onSelectAgentflow, onSubToolbarChange }) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [workflows, setAgentflows] = useState<AdminAgentflowMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [editingAgentflow, setEditingAgentflow] = useState<AdminAgentflowMeta | null>(null);

  // ── Fetch ──
  const fetchAgentflows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllAgentflowMetaAdmin(1, 1000);
      setAgentflows(res.workflows ?? []);
    } catch {
      toast.error(t('admin.agentflowManagement.agentflowControl.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => { fetchAgentflows(); }, [fetchAgentflows]);

  // ── Filter & Search ──
  const filteredAgentflows = useMemo(() => {
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
      { key: 'all', label: t('admin.agentflowManagement.agentflowControl.filterAll'), count: workflows.length },
      { key: 'active', label: t('admin.agentflowManagement.agentflowControl.statusActive'), count: activeCount },
      { key: 'inactive', label: t('admin.agentflowManagement.agentflowControl.statusInactive'), count: inactiveCount },
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
          placeholder={t('admin.agentflowManagement.agentflowControl.searchPlaceholder')}
          className="w-72"
        />
      </div>
    );
  }, [filterTabs, filter, search, t, onSubToolbarChange]);

  // ── Deploy Approve / Reject ──
  const handleDeployApprove = useCallback(async (w: AdminAgentflowMeta) => {
    try {
      await updateAgentflowAdmin(w.workflow_id, {
        enable_deploy: true,
        inquire_deploy: false,
        is_accepted: Boolean(w.is_accepted),
        is_shared: Boolean(w.is_shared),
        share_roles: w.share_roles || [],
        user_id: w.user_id,
      });
      toast.success(t('admin.agentflowManagement.agentflowControl.deployApproveSuccess', { name: w.workflow_name }));
      fetchAgentflows();
    } catch {
      toast.error(t('admin.agentflowManagement.agentflowControl.deployApproveError', { name: w.workflow_name }));
    }
  }, [fetchAgentflows, t, toast]);

  const handleDeployReject = useCallback(async (w: AdminAgentflowMeta) => {
    try {
      await updateAgentflowAdmin(w.workflow_id, {
        enable_deploy: false,
        inquire_deploy: false,
        is_accepted: Boolean(w.is_accepted),
        is_shared: Boolean(w.is_shared),
        share_roles: w.share_roles || [],
        user_id: w.user_id,
      });
      toast.success(t('admin.agentflowManagement.agentflowControl.deployRejectSuccess', { name: w.workflow_name }));
      fetchAgentflows();
    } catch {
      toast.error(t('admin.agentflowManagement.agentflowControl.deployRejectError', { name: w.workflow_name }));
    }
  }, [fetchAgentflows, t, toast]);

  // ── Delete ──
  const handleDelete = useCallback(async (w: AdminAgentflowMeta) => {
    const confirmed = await toast.confirm({
      title: t('admin.agentflowManagement.agentflowControl.deleteTitle'),
      message: t('admin.agentflowManagement.agentflowControl.deleteMessage', { name: w.workflow_name }),
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await deleteAgentflowAdmin(w.workflow_id, w.user_id);
      toast.success(t('admin.agentflowManagement.agentflowControl.deleteSuccess'));
      fetchAgentflows();
    } catch {
      toast.error(t('admin.agentflowManagement.agentflowControl.deleteError'));
    }
  }, [fetchAgentflows, t, toast]);

  // ── Card items ──
  const cardItems: ResourceCardProps<AdminAgentflowMeta>[] = useMemo(() => {
    return filteredAgentflows.map((w) => {
      const status = deriveStatus(w);
      const deploy = deriveDeployLabel(w, t);

      const badges: CardBadge[] = [
        {
          text: status === 'active'
            ? t('admin.agentflowManagement.agentflowControl.statusActive')
            : t('admin.agentflowManagement.agentflowControl.statusInactive'),
          variant: status === 'active' ? 'success' : 'error',
        },
        {
          text: w.is_shared
            ? t('admin.agentflowManagement.agentflowControl.shared')
            : t('admin.agentflowManagement.agentflowControl.personal'),
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
            value: t('admin.agentflowManagement.agentflowControl.nodeCount', {
              count: w.node_count ?? 0,
            }),
          },
        ],
        primaryActions: [
          {
            id: 'settings',
            icon: <FiSettings />,
            label: t('admin.agentflowManagement.agentflowControl.settings'),
            onClick: () => setEditingAgentflow(w),
          },
          {
            id: 'delete',
            icon: <FiTrash2 />,
            label: t('admin.agentflowManagement.agentflowControl.delete'),
            onClick: () => handleDelete(w),
          },
        ],
        dropdownActions: w.inquire_deploy
          ? [
              {
                id: 'approve',
                label: t('admin.agentflowManagement.agentflowControl.approve'),
                onClick: () => handleDeployApprove(w),
              },
              {
                id: 'reject',
                label: t('admin.agentflowManagement.agentflowControl.reject'),
                onClick: () => handleDeployReject(w),
                danger: true,
              },
            ]
          : [],
        onClick: () => onSelectAgentflow?.(w),
      };
    });
  }, [filteredAgentflows, t, handleDelete, handleDeployApprove, handleDeployReject, onSelectAgentflow]);

  return (
    <div className="p-6">
      <ResourceCardGrid
        items={cardItems}
        loading={loading}
        showEmptyState
        emptyStateProps={{
          title: search
            ? t('admin.agentflowManagement.agentflowControl.noSearchResults', { query: search })
            : t('admin.agentflowManagement.agentflowControl.noAgentflows'),
        }}
      />

      {/* Settings Modal */}
      {editingAgentflow && (
        <AgentflowEditModal
          workflow={editingAgentflow}
          isOpen
          onClose={() => setEditingAgentflow(null)}
          onUpdated={fetchAgentflows}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Plugin Export
// ─────────────────────────────────────────────────────────────

export const agentflowMgmtViewPlugin: AgentflowMgmtTabPlugin = {
  id: 'view',
  name: 'AgentflowListView',
  tabLabelKey: 'admin.agentflowMgmt.title',
  order: 0,
  component: AgentflowListView as React.ComponentType<AgentflowMgmtTabPluginProps>,
};

export default agentflowMgmtViewPlugin;
