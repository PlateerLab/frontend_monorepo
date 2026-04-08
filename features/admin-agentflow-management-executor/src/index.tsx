'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { AgentflowMgmtTabPlugin, AgentflowMgmtTabPluginProps } from '@xgen/types';
import type { AdminAgentflowMeta, AdminIOLog } from '@xgen/api-client';
import { getAdminIOLogsForAgentflow } from '@xgen/api-client';
import { DataTable, Button, useToast } from '@xgen/ui';
import type { DataTableColumn } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiRefreshCw } from '@xgen/icons';
import './locales';

// ─────────────────────────────────────────────────────────────
// Executor Tab — 실행기 (IO 로그 조회)
// ─────────────────────────────────────────────────────────────

const TRUNCATE_LEN = 120;

function truncate(text: string | null | undefined, len = TRUNCATE_LEN): string {
  if (!text) return '-';
  return text.length > len ? `${text.slice(0, len)}...` : text;
}

const ExecutorTab: React.FC<AgentflowMgmtTabPluginProps> = ({ selectedAgentflow }) => {
  const wf = selectedAgentflow as unknown as AdminAgentflowMeta;
  const { t } = useTranslation();
  const { toast } = useToast();

  const [logs, setLogs] = useState<AdminIOLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminIOLogsForAgentflow(wf.user_id, wf.workflow_name, wf.workflow_id);
      setLogs(data ?? []);
    } catch {
      toast.error(t('admin.agentflowMgmtExecutor.loadError'));
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [wf.user_id, wf.workflow_name, wf.workflow_id, t, toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const columns: DataTableColumn<AdminIOLog>[] = useMemo(() => [
    {
      id: 'created_at',
      header: t('admin.agentflowMgmtExecutor.columns.time'),
      field: 'created_at',
      sortable: true,
      minWidth: '160px',
      cell: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(row.created_at).toLocaleString('ko-KR')}
        </span>
      ),
    },
    {
      id: 'mode',
      header: t('admin.agentflowMgmtExecutor.columns.mode'),
      field: 'mode',
      sortable: true,
      minWidth: '90px',
      cell: (row) => (
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          row.mode === 'deploy'
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
        }`}>
          {row.mode || 'default'}
        </span>
      ),
    },
    {
      id: 'input_data',
      header: t('admin.agentflowMgmtExecutor.columns.input'),
      minWidth: '240px',
      cell: (row) => (
        <span className="text-sm max-w-[280px] truncate block" title={row.input_data ?? ''}>
          {truncate(row.input_data)}
        </span>
      ),
    },
    {
      id: 'output_data',
      header: t('admin.agentflowMgmtExecutor.columns.output'),
      minWidth: '240px',
      cell: (row) => (
        <span className="text-sm max-w-[280px] truncate block" title={row.output_data ?? ''}>
          {truncate(row.output_data)}
        </span>
      ),
    },
    {
      id: 'interaction_id',
      header: t('admin.agentflowMgmtExecutor.columns.interactionId'),
      field: 'interaction_id',
      sortable: true,
      minWidth: '140px',
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.interaction_id ? truncate(row.interaction_id, 20) : '-'}
        </span>
      ),
    },
  ], [t]);

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{t('admin.agentflowMgmtExecutor.logCount', { count: logs.length })}</span>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
          <FiRefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Table */}
      <DataTable
        data={logs}
        columns={columns}
        rowKey={(row) => String(row.id)}
        loading={loading}
        emptyMessage={t('admin.agentflowMgmtExecutor.noLogs')}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Plugin Export
// ─────────────────────────────────────────────────────────────

export const agentflowMgmtExecutorPlugin: AgentflowMgmtTabPlugin = {
  id: 'executor',
  name: 'AgentflowExecutorTab',
  tabLabelKey: 'admin.agentflowMgmtExecutor.tabLabel',
  order: 1,
  component: ExecutorTab,
};

export default agentflowMgmtExecutorPlugin;
