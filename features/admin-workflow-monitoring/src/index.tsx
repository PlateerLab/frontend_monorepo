'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import type { AdminWorkflowMeta, AdminIOLog, AdminPerformanceData } from '@xgen/api-client';
import {
  ContentArea, DataTable, StatusBadge, SearchInput, FilterTabs, Button, StatCard, useToast,
} from '@xgen/ui';
import type { DataTableColumn, FilterTab } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import {
  getAllWorkflowMetaAdmin,
  getAdminIOLogsForWorkflow,
  getWorkflowPerformanceAdmin,
  deleteWorkflowPerformanceAdmin,
} from '@xgen/api-client';

// ─────────────────────────────────────────────────────────────
// Sub-tab type
// ─────────────────────────────────────────────────────────────
type MonitorTab = 'io-logs' | 'performance';

// ─────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────

const AdminWorkflowMonitoringPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Workflow list
  const [workflows, setWorkflows] = useState<AdminWorkflowMeta[]>([]);
  const [wfLoading, setWfLoading] = useState(true);
  const [wfSearch, setWfSearch] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<AdminWorkflowMeta | null>(null);

  // Monitor tabs
  const [activeTab, setActiveTab] = useState<MonitorTab>('io-logs');

  // IO Logs
  const [ioLogs, setIoLogs] = useState<AdminIOLog[]>([]);
  const [ioLoading, setIoLoading] = useState(false);

  // Performance
  const [perfData, setPerfData] = useState<AdminPerformanceData | null>(null);
  const [perfLoading, setPerfLoading] = useState(false);

  // ── Fetch workflow list ──
  const fetchWorkflows = useCallback(async () => {
    setWfLoading(true);
    try {
      const res = await getAllWorkflowMetaAdmin(1, 1000);
      setWorkflows(res.workflows ?? []);
    } catch {
      toast.error(t('admin.workflowManagement.monitoring.loadWorkflowError'));
    } finally {
      setWfLoading(false);
    }
  }, [t, toast]);

  useEffect(() => { fetchWorkflows(); }, [fetchWorkflows]);

  // Filtered workflow list
  const filteredWorkflows = useMemo(() => {
    if (!wfSearch.trim()) return workflows;
    const q = wfSearch.toLowerCase();
    return workflows.filter(
      (w) =>
        w.workflow_name?.toLowerCase().includes(q) ||
        w.username?.toLowerCase().includes(q),
    );
  }, [workflows, wfSearch]);

  // ── Load data when workflow selected or tab changes ──
  const loadIOLogs = useCallback(async (wf: AdminWorkflowMeta) => {
    setIoLoading(true);
    try {
      const logs = await getAdminIOLogsForWorkflow(wf.user_id, wf.workflow_name, wf.workflow_id);
      setIoLogs(logs);
    } catch {
      toast.error(t('admin.workflowManagement.monitoring.loadLogsError'));
      setIoLogs([]);
    } finally {
      setIoLoading(false);
    }
  }, [t, toast]);

  const loadPerformance = useCallback(async (wf: AdminWorkflowMeta) => {
    setPerfLoading(true);
    try {
      const data = await getWorkflowPerformanceAdmin(wf.user_id, wf.workflow_name, wf.workflow_id);
      setPerfData(data);
    } catch {
      setPerfData(null);
    } finally {
      setPerfLoading(false);
    }
  }, []);

  const selectWorkflow = useCallback((wf: AdminWorkflowMeta) => {
    setSelectedWorkflow(wf);
    setActiveTab('io-logs');
    loadIOLogs(wf);
    loadPerformance(wf);
  }, [loadIOLogs, loadPerformance]);

  useEffect(() => {
    if (selectedWorkflow && activeTab === 'io-logs') {
      loadIOLogs(selectedWorkflow);
    } else if (selectedWorkflow && activeTab === 'performance') {
      loadPerformance(selectedWorkflow);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── Delete performance data ──
  const handleDeletePerformance = useCallback(async () => {
    if (!selectedWorkflow) return;
    const confirmed = await toast.confirm({
      title: t('admin.workflowManagement.monitoring.deletePerformanceTitle'),
      message: t('admin.workflowManagement.monitoring.deletePerformanceMessage'),
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await deleteWorkflowPerformanceAdmin(
        selectedWorkflow.user_id,
        selectedWorkflow.workflow_name,
        selectedWorkflow.workflow_id,
      );
      toast.success(t('admin.workflowManagement.monitoring.deletePerformanceSuccess'));
      setPerfData(null);
    } catch {
      toast.error(t('admin.workflowManagement.monitoring.deletePerformanceError'));
    }
  }, [selectedWorkflow, t, toast]);

  // ── Monitor tabs config ──
  const monitorTabs: FilterTab[] = useMemo(() => [
    { key: 'io-logs', label: t('admin.workflowManagement.monitoring.tabIOLogs') },
    { key: 'performance', label: t('admin.workflowManagement.monitoring.tabPerformance') },
  ], [t]);

  // ── IO log columns ──
  const ioColumns: DataTableColumn<AdminIOLog>[] = useMemo(() => [
    {
      id: 'created_at',
      header: t('admin.workflowManagement.monitoring.columns.timestamp'),
      field: 'created_at',
      sortable: true,
      cell: (row) => <span className="text-xs">{new Date(row.created_at).toLocaleString('ko-KR')}</span>,
    },
    {
      id: 'mode',
      header: t('admin.workflowManagement.monitoring.columns.mode'),
      field: 'mode',
      sortable: true,
      cell: (row) => (
        <StatusBadge variant={row.mode === 'deploy' ? 'success' : 'neutral'}>
          {row.mode || 'default'}
        </StatusBadge>
      ),
    },
    {
      id: 'input_data',
      header: t('admin.workflowManagement.monitoring.columns.input'),
      cell: (row) => (
        <span className="text-xs max-w-[200px] truncate block" title={row.input_data}>
          {row.input_data?.substring(0, 80)}{(row.input_data?.length ?? 0) > 80 ? '...' : ''}
        </span>
      ),
    },
    {
      id: 'output_data',
      header: t('admin.workflowManagement.monitoring.columns.output'),
      cell: (row) => (
        <span className="text-xs max-w-[200px] truncate block" title={row.output_data}>
          {row.output_data?.substring(0, 80)}{(row.output_data?.length ?? 0) > 80 ? '...' : ''}
        </span>
      ),
    },
    {
      id: 'interaction_id',
      header: t('admin.workflowManagement.monitoring.columns.interactionId'),
      field: 'interaction_id',
      sortable: true,
      cell: (row) => <span className="font-mono text-xs">{row.interaction_id?.substring(0, 12)}...</span>,
    },
  ], [t]);

  // ── Back to list ──
  const handleBack = () => {
    setSelectedWorkflow(null);
    setIoLogs([]);
    setPerfData(null);
  };

  // ─────────────────────────────────────────────────────────────
  // Render: Workflow selector (no workflow selected)
  // ─────────────────────────────────────────────────────────────
  if (!selectedWorkflow) {
    return (
      <ContentArea
        title={t('admin.pages.workflowMonitoring.title')}
        description={t('admin.workflowManagement.monitoring.selectWorkflowHint')}
        headerActions={
          <SearchInput
            value={wfSearch}
            onChange={setWfSearch}
            placeholder={t('admin.workflowManagement.monitoring.searchPlaceholder')}
            className="w-72"
          />
        }
      >
        {/* Workflow list */}
          {wfLoading ? (
            <p className="text-sm text-muted-foreground">{t('admin.workflowManagement.monitoring.loading')}</p>
          ) : filteredWorkflows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('admin.workflowManagement.monitoring.noWorkflows')}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredWorkflows.map((wf) => (
                <button
                  key={wf.id}
                  type="button"
                  className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-4 text-left hover:border-primary/50 hover:bg-accent/50 transition-colors"
                  onClick={() => selectWorkflow(wf)}
                >
                  <span className="font-medium text-sm text-foreground truncate">
                    {wf.workflow_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {wf.username} &middot; {new Date(wf.updated_at).toLocaleString('ko-KR')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t('admin.workflowManagement.monitoring.nodes')}: {wf.node_count}
                  </span>
                </button>
              ))}
            </div>
          )}
      </ContentArea>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Render: Monitoring view (workflow selected)
  // ─────────────────────────────────────────────────────────────
  return (
    <ContentArea
      title={selectedWorkflow.workflow_name}
      description={`${selectedWorkflow.username} \u00b7 ${new Date(selectedWorkflow.updated_at).toLocaleString('ko-KR')}`}
      headerActions={
        <Button variant="outline" size="sm" onClick={handleBack}>
          {t('admin.workflowManagement.monitoring.back')}
        </Button>
      }
    >
      {/* Tabs */}
        <FilterTabs
          tabs={monitorTabs}
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as MonitorTab)}
        />

        {/* IO Logs Tab */}
        {activeTab === 'io-logs' && (
          <DataTable
            data={ioLogs}
            columns={ioColumns}
            rowKey={(row) => row.id}
            loading={ioLoading}
            emptyMessage={t('admin.workflowManagement.monitoring.noLogs')}
            className="border rounded-lg"
          />
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="flex flex-col gap-4">
            {perfLoading ? (
              <p className="text-sm text-muted-foreground">{t('admin.workflowManagement.monitoring.loading')}</p>
            ) : !perfData ? (
              <p className="text-sm text-muted-foreground">{t('admin.workflowManagement.monitoring.noPerformanceData')}</p>
            ) : (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard
                    label={t('admin.workflowManagement.monitoring.perf.totalExecutions')}
                    value={perfData.summary.total_executions}
                    variant="info"
                  />
                  <StatCard
                    label={t('admin.workflowManagement.monitoring.perf.avgTime')}
                    value={`${perfData.summary.avg_processing_time_ms.toFixed(0)}ms`}
                    variant="neutral"
                  />
                  <StatCard
                    label={t('admin.workflowManagement.monitoring.perf.avgCpu')}
                    value={`${perfData.summary.avg_cpu_usage_percent.toFixed(1)}%`}
                    variant="warning"
                  />
                  <StatCard
                    label={t('admin.workflowManagement.monitoring.perf.avgRam')}
                    value={`${perfData.summary.avg_ram_usage_mb.toFixed(1)}MB`}
                    variant="success"
                  />
                </div>

                {/* Node performance table */}
                {perfData.nodes.length > 0 && (
                  <div className="rounded-lg border border-border overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="px-4 py-2 text-left font-medium">{t('admin.workflowManagement.monitoring.perf.nodeName')}</th>
                          <th className="px-4 py-2 text-right font-medium">{t('admin.workflowManagement.monitoring.perf.execCount')}</th>
                          <th className="px-4 py-2 text-right font-medium">{t('admin.workflowManagement.monitoring.perf.avgTime')}</th>
                          <th className="px-4 py-2 text-right font-medium">{t('admin.workflowManagement.monitoring.perf.avgCpu')}</th>
                          <th className="px-4 py-2 text-right font-medium">{t('admin.workflowManagement.monitoring.perf.avgRam')}</th>
                          <th className="px-4 py-2 text-right font-medium">{t('admin.workflowManagement.monitoring.perf.avgGpu')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {perfData.nodes.map((node) => (
                          <tr key={node.node_name} className="border-b border-border last:border-0">
                            <td className="px-4 py-2 font-medium">{node.node_name}</td>
                            <td className="px-4 py-2 text-right font-mono text-xs">{node.execution_count}</td>
                            <td className="px-4 py-2 text-right font-mono text-xs">{node.avg_processing_time_ms.toFixed(0)}ms</td>
                            <td className="px-4 py-2 text-right font-mono text-xs">{node.avg_cpu_usage_percent.toFixed(1)}%</td>
                            <td className="px-4 py-2 text-right font-mono text-xs">{node.avg_ram_usage_mb.toFixed(1)}MB</td>
                            <td className="px-4 py-2 text-right font-mono text-xs">{node.avg_gpu_usage_percent.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Delete performance data */}
                <div className="flex justify-end">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDeletePerformance}
                  >
                    {t('admin.workflowManagement.monitoring.deletePerformance')}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Module
// ─────────────────────────────────────────────────────────────

const feature: AdminFeatureModule = {
  id: 'admin-workflow-monitoring',
  name: 'AdminWorkflowMonitoringPage',
  adminSection: 'admin-workflow',
  routes: {
    'admin-workflow-monitoring': AdminWorkflowMonitoringPage,
  },
};

export default feature;
