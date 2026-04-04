'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea, DataTable, StatusBadge, Button, useToast } from '@xgen/ui';
import type { DataTableColumn } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiRefreshCw } from '@xgen/icons';

import { getTraceList } from './api/trace-api';
import type { AgentTrace } from './types';
import TraceDetailModal from './components/trace-detail-modal';

// ─────────────────────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;
const AT = 'admin.workflowManagement.agentTraces';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function formatDuration(ms: number | null): string {
  if (ms == null) return '-';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function statusVariant(status: string): 'success' | 'info' | 'error' {
  if (status === 'completed') return 'success';
  if (status === 'running') return 'info';
  return 'error';
}

// ─────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────

const AdminAgentTracesPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [traces, setTraces] = useState<AgentTrace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Detail modal
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);

  const loadTraces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTraceList({
        page,
        page_size: PAGE_SIZE,
        status: statusFilter || undefined,
      });
      setTraces(data.traces);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t(`${AT}.loadError`);
      setError(message);
      toast.error(t(`${AT}.loadError`));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, t, toast]);

  useEffect(() => {
    loadTraces();
  }, [loadTraces]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  // ── Columns ──
  const columns: DataTableColumn<AgentTrace>[] = useMemo(
    () => [
      {
        id: 'created_at',
        header: t(`${AT}.columns.time`),
        field: 'created_at',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-xs text-muted-foreground">
            {formatDate(row.created_at)}
          </span>
        ),
        minWidth: '160px',
      },
      {
        id: 'workflow_name',
        header: t(`${AT}.columns.workflow`),
        field: 'workflow_name',
        sortable: true,
        cell: (row) => (
          <span className="max-w-[160px] truncate text-sm" title={row.workflow_name}>
            {row.workflow_name}
          </span>
        ),
      },
      {
        id: 'status',
        header: t(`${AT}.columns.status`),
        field: 'status',
        sortable: true,
        cell: (row) => (
          <StatusBadge variant={statusVariant(row.status)}>
            {row.status}
          </StatusBadge>
        ),
      },
      {
        id: 'duration_ms',
        header: t(`${AT}.columns.duration`),
        field: 'duration_ms',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-xs text-muted-foreground">
            {formatDuration(row.duration_ms)}
          </span>
        ),
      },
      {
        id: 'total_llm_calls',
        header: t(`${AT}.columns.llm`),
        field: 'total_llm_calls',
        sortable: true,
        cell: (row) => (
          <span className="text-center text-xs">{row.total_llm_calls}</span>
        ),
      },
      {
        id: 'total_tool_calls',
        header: t(`${AT}.columns.tool`),
        field: 'total_tool_calls',
        sortable: true,
        cell: (row) => (
          <span className="text-center text-xs">{row.total_tool_calls}</span>
        ),
      },
      {
        id: 'total_spans',
        header: t(`${AT}.columns.spans`),
        field: 'total_spans',
        sortable: true,
        cell: (row) => (
          <span className="text-center text-xs">{row.total_spans}</span>
        ),
      },
    ],
    [t],
  );

  // ── Error state ──
  if (error && traces.length === 0) {
    return (
      <ContentArea
        title={t(`${AT}.title`)}
        description={t(`${AT}.subtitle`)}
      >
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <h3 className="text-base font-semibold text-destructive">
            {t(`${AT}.errorOccurred`)}
          </h3>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="primary" onClick={loadTraces}>
            {t(`${AT}.retry`)}
          </Button>
        </div>
      </ContentArea>
    );
  }

  // ── Render ──
  return (
    <ContentArea
      title={t(`${AT}.title`)}
      description={t(`${AT}.subtitle`)}
    >
      {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3">
          {/* Filter */}
          <select
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={statusFilter}
            onChange={handleStatusChange}
          >
            <option value="">{t(`${AT}.allStatus`)}</option>
            <option value="completed">{t(`${AT}.filterStatus.completed`)}</option>
            <option value="running">{t(`${AT}.filterStatus.running`)}</option>
            <option value="error">{t(`${AT}.filterStatus.error`)}</option>
          </select>

          {/* Stats */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{t(`${AT}.totalCount`, { count: total })}</span>
            <span>|</span>
            <span>{t(`${AT}.pageInfo`, { page, totalPages: totalPages || 1 })}</span>
          </div>

          {/* Pagination + refresh */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              {t(`${AT}.prev`)}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t(`${AT}.next`)}
            </Button>
            <Button variant="primary" size="sm" onClick={loadTraces}>
              <FiRefreshCw className="mr-1 h-3.5 w-3.5" />
              {t(`${AT}.refresh`)}
            </Button>
          </div>
        </div>

        {/* Table */}
        <DataTable
          data={traces}
          columns={columns}
          rowKey={(row) => row.id}
          loading={loading}
          loadingMessage={t(`${AT}.loading`)}
          emptyMessage={t(`${AT}.noData`)}
          onRowClick={(row) => setSelectedTraceId(row.trace_id)}
          className="border rounded-lg"
        />

      {/* Detail Modal */}
      {selectedTraceId && (
        <TraceDetailModal
          traceId={selectedTraceId}
          onClose={() => setSelectedTraceId(null)}
        />
      )}
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Module
// ─────────────────────────────────────────────────────────────

const feature: AdminFeatureModule = {
  id: 'admin-agent-traces',
  name: 'AdminAgentTracesPage',
  adminSection: 'admin-workflow',
  routes: {
    'admin-agent-traces': AdminAgentTracesPage,
  },
};

export default feature;
