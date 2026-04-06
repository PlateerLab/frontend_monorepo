'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { WorkflowMgmtTabPlugin, WorkflowMgmtTabPluginProps } from '@xgen/types';
import type { AdminWorkflowMeta, AdminIOLog, AdminPerformanceData } from '@xgen/api-client';
import {
  getAdminIOLogsForWorkflow,
  getWorkflowPerformanceAdmin,
  deleteWorkflowPerformanceAdmin,
} from '@xgen/api-client';
import { DataTable, StatusBadge, FilterTabs, Button, StatCard, useToast } from '@xgen/ui';
import type { DataTableColumn, FilterTab } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiRefreshCw } from '@xgen/icons';
import './locales';

// ─────────────────────────────────────────────────────────────
// Monitoring Tab — IO 로그 + 성능 모니터링
// ─────────────────────────────────────────────────────────────

type SubTab = 'io-logs' | 'performance';

const MonitoringTab: React.FC<WorkflowMgmtTabPluginProps> = ({ selectedWorkflow, onSubToolbarChange }) => {
  const wf = selectedWorkflow as unknown as AdminWorkflowMeta;
  const { t } = useTranslation();
  const { toast } = useToast();

  const [subTab, setSubTab] = useState<SubTab>('io-logs');

  // IO Logs
  const [ioLogs, setIoLogs] = useState<AdminIOLog[]>([]);
  const [ioLoading, setIoLoading] = useState(false);

  // Performance
  const [perfData, setPerfData] = useState<AdminPerformanceData | null>(null);
  const [perfLoading, setPerfLoading] = useState(false);

  const loadIOLogs = useCallback(async () => {
    setIoLoading(true);
    try {
      const logs = await getAdminIOLogsForWorkflow(wf.user_id, wf.workflow_name, wf.workflow_id);
      setIoLogs(logs ?? []);
    } catch {
      toast.error(t('admin.workflowMgmtMonitoring.loadLogsError'));
      setIoLogs([]);
    } finally {
      setIoLoading(false);
    }
  }, [wf.user_id, wf.workflow_name, wf.workflow_id, t, toast]);

  const loadPerformance = useCallback(async () => {
    setPerfLoading(true);
    try {
      const data = await getWorkflowPerformanceAdmin(wf.user_id, wf.workflow_name, wf.workflow_id);
      setPerfData(data);
    } catch {
      setPerfData(null);
    } finally {
      setPerfLoading(false);
    }
  }, [wf.user_id, wf.workflow_name, wf.workflow_id]);

  // Load both on mount
  useEffect(() => {
    loadIOLogs();
    loadPerformance();
  }, [loadIOLogs, loadPerformance]);

  // Sub-tab change reloads relevant data
  useEffect(() => {
    if (subTab === 'io-logs') loadIOLogs();
    else loadPerformance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTab]);

  // Delete performance data
  const handleDeletePerformance = useCallback(async () => {
    const confirmed = await toast.confirm({
      title: t('admin.workflowMgmtMonitoring.deletePerformanceTitle'),
      message: t('admin.workflowMgmtMonitoring.deletePerformanceMessage'),
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await deleteWorkflowPerformanceAdmin(wf.user_id, wf.workflow_name, wf.workflow_id);
      toast.success(t('admin.workflowMgmtMonitoring.deletePerformanceSuccess'));
      setPerfData(null);
    } catch {
      toast.error(t('admin.workflowMgmtMonitoring.deletePerformanceError'));
    }
  }, [wf.user_id, wf.workflow_name, wf.workflow_id, t, toast]);

  // Sub tabs
  const subTabs: FilterTab[] = useMemo(() => [
    { key: 'io-logs', label: t('admin.workflowMgmtMonitoring.tabIOLogs') },
    { key: 'performance', label: t('admin.workflowMgmtMonitoring.tabPerformance') },
  ], [t]);

  // Push sub-toolbar
  useEffect(() => {
    onSubToolbarChange?.(
      <div className="px-6">
        <FilterTabs
          tabs={subTabs}
          activeKey={subTab}
          onChange={(key) => setSubTab(key as SubTab)}
        />
      </div>
    );
  }, [subTabs, subTab, onSubToolbarChange]);

  // IO log columns
  const ioColumns: DataTableColumn<AdminIOLog>[] = useMemo(() => [
    {
      id: 'created_at',
      header: t('admin.workflowMgmtMonitoring.columns.timestamp'),
      field: 'created_at',
      sortable: true,
      cell: (row) => <span className="text-xs">{new Date(row.created_at).toLocaleString('ko-KR')}</span>,
    },
    {
      id: 'mode',
      header: t('admin.workflowMgmtMonitoring.columns.mode'),
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
      header: t('admin.workflowMgmtMonitoring.columns.input'),
      cell: (row) => (
        <span className="text-xs max-w-[200px] truncate block" title={row.input_data ?? ''}>
          {row.input_data?.substring(0, 80)}{(row.input_data?.length ?? 0) > 80 ? '...' : ''}
        </span>
      ),
    },
    {
      id: 'output_data',
      header: t('admin.workflowMgmtMonitoring.columns.output'),
      cell: (row) => (
        <span className="text-xs max-w-[200px] truncate block" title={row.output_data ?? ''}>
          {row.output_data?.substring(0, 80)}{(row.output_data?.length ?? 0) > 80 ? '...' : ''}
        </span>
      ),
    },
    {
      id: 'interaction_id',
      header: t('admin.workflowMgmtMonitoring.columns.interactionId'),
      field: 'interaction_id',
      sortable: true,
      cell: (row) => <span className="font-mono text-xs">{row.interaction_id?.substring(0, 16)}...</span>,
    },
  ], [t]);

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* IO Logs Sub-Tab */}
      {subTab === 'io-logs' && (
        <>
          <div className="flex items-center justify-end">
            <Button variant="outline" size="sm" onClick={loadIOLogs} disabled={ioLoading}>
              <FiRefreshCw className={`h-3.5 w-3.5 ${ioLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <DataTable
            data={ioLogs}
            columns={ioColumns}
            rowKey={(row) => String(row.id)}
            loading={ioLoading}
            emptyMessage={t('admin.workflowMgmtMonitoring.noLogs')}
          />
        </>
      )}

      {/* Performance Sub-Tab */}
      {subTab === 'performance' && (
        <div className="flex flex-col gap-4">
          {perfLoading ? (
            <p className="text-sm text-muted-foreground">{t('admin.workflowMgmtMonitoring.loading')}</p>
          ) : !perfData ? (
            <p className="text-sm text-muted-foreground">{t('admin.workflowMgmtMonitoring.noPerformanceData')}</p>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  label={t('admin.workflowMgmtMonitoring.perf.totalExecutions')}
                  value={perfData.summary.total_executions}
                  variant="info"
                />
                <StatCard
                  label={t('admin.workflowMgmtMonitoring.perf.avgTime')}
                  value={`${perfData.summary.avg_processing_time_ms.toFixed(0)}ms`}
                  variant="neutral"
                />
                <StatCard
                  label={t('admin.workflowMgmtMonitoring.perf.avgCpu')}
                  value={`${perfData.summary.avg_cpu_usage_percent.toFixed(1)}%`}
                  variant="warning"
                />
                <StatCard
                  label={t('admin.workflowMgmtMonitoring.perf.avgRam')}
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
                        <th className="px-4 py-2 text-left font-medium">{t('admin.workflowMgmtMonitoring.perf.nodeName')}</th>
                        <th className="px-4 py-2 text-right font-medium">{t('admin.workflowMgmtMonitoring.perf.execCount')}</th>
                        <th className="px-4 py-2 text-right font-medium">{t('admin.workflowMgmtMonitoring.perf.avgTime')}</th>
                        <th className="px-4 py-2 text-right font-medium">{t('admin.workflowMgmtMonitoring.perf.avgCpu')}</th>
                        <th className="px-4 py-2 text-right font-medium">{t('admin.workflowMgmtMonitoring.perf.avgRam')}</th>
                        <th className="px-4 py-2 text-right font-medium">{t('admin.workflowMgmtMonitoring.perf.avgGpu')}</th>
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
                <Button variant="danger" size="sm" onClick={handleDeletePerformance}>
                  {t('admin.workflowMgmtMonitoring.deletePerformance')}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Plugin Export
// ─────────────────────────────────────────────────────────────

export const workflowMgmtMonitoringPlugin: WorkflowMgmtTabPlugin = {
  id: 'monitoring',
  name: 'WorkflowMonitoringTab',
  tabLabelKey: 'admin.workflowMgmtMonitoring.tabLabel',
  order: 2,
  component: MonitoringTab,
};

export default workflowMgmtMonitoringPlugin;
