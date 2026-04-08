'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea, DataTable, Button, SearchInput, StatCard, StatusBadge, Modal } from '@xgen/ui';
import type { DataTableColumn } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiRefreshCw } from '@xgen/icons';
import { getSystemErrorLogs, resolveErrorLog } from '@xgen/api-client';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ErrorLogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'critical' | 'fatal';
  service: string;
  message: string;
  stackTrace: string;
  requestId: string;
  userId: string | null;
  endpoint: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  resolved: boolean;
}

type LevelFilter = ErrorLogEntry['level'] | 'all';

const LEVEL_CONFIG: Record<ErrorLogEntry['level'], { badgeStatus: 'error' | 'warning' }> = {
  error: { badgeStatus: 'warning' },
  critical: { badgeStatus: 'error' },
  fatal: { badgeStatus: 'error' },
};

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */
function generateErrors(): ErrorLogEntry[] {
  const services = ['api-gateway', 'auth-service', 'workflow-engine', 'ml-pipeline', 'storage-service', 'mcp-proxy'];
  const errors = [
    { msg: 'Connection refused to database', trace: 'Error: ECONNREFUSED\n    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1141:16)\n    at Protocol._enqueue (protocol.js:144:48)' },
    { msg: 'JWT token expired during refresh', trace: 'TokenExpiredError: jwt expired\n    at Object.module.exports [as verify] (index.js:33:17)\n    at AuthMiddleware.verify (auth.ts:45:12)' },
    { msg: 'Out of memory in model inference', trace: 'RuntimeError: CUDA out of memory\n    at torch.cuda.mem_alloc (memory.py:234)\n    at InferenceEngine.run (engine.py:89:5)' },
    { msg: 'Failed to parse workflow JSON', trace: 'SyntaxError: Unexpected token } in JSON at position 1205\n    at JSON.parse (<anonymous>)\n    at AgentflowParser.parse (parser.ts:67:20)' },
    { msg: 'S3 bucket access denied', trace: 'AccessDenied: Access Denied\n    at Request.extractError (s3.js:700:35)\n    at StorageClient.upload (storage.ts:122:8)' },
    { msg: 'MCP session handshake timeout', trace: 'TimeoutError: MCP handshake timeout after 30000ms\n    at MCPClient.connect (client.ts:56:11)\n    at SessionManager.create (manager.ts:89:5)' },
    { msg: 'Rate limit exceeded for user', trace: 'RateLimitError: Too many requests\n    at RateLimiter.check (limiter.ts:34:15)\n    at APIGateway.handle (gateway.ts:78:12)' },
    { msg: 'Deadlock detected in transaction', trace: 'DeadlockError: Deadlock found\n    at Query.run (query.ts:201:18)\n    at TransactionManager.commit (tx.ts:56:9)' },
  ];
  const levels: ErrorLogEntry['level'][] = ['error', 'error', 'error', 'critical', 'critical', 'fatal'];
  const endpoints = ['/api/auth/refresh', '/api/workflow/run', '/api/models/infer', '/api/storage/upload', '/api/mcp/connect', '/api/admin/config'];

  return Array.from({ length: 50 }, (_, i) => {
    const err = errors[i % errors.length];
    const age = i * 3600000;
    return {
      id: `err-${String(i + 1).padStart(4, '0')}`,
      timestamp: new Date(Date.now() - age).toISOString(),
      level: levels[i % levels.length],
      service: services[i % services.length],
      message: err.msg,
      stackTrace: err.trace,
      requestId: `req-${Math.random().toString(36).slice(2, 10)}`,
      userId: i % 3 === 0 ? `user-${(i % 5) + 1}` : null,
      endpoint: endpoints[i % endpoints.length],
      count: Math.floor(Math.random() * 50) + 1,
      firstSeen: new Date(Date.now() - age - 86400000 * (i % 7)).toISOString(),
      lastSeen: new Date(Date.now() - age).toISOString(),
      resolved: i > 30,
    };
  });
}

const PAGE_SIZE = 20;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
const AdminErrorLogsPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const [errors, setErrors] = useState<ErrorLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [showResolved, setShowResolved] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedError, setSelectedError] = useState<ErrorLogEntry | null>(null);

  const fetchErrors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSystemErrorLogs();
      if (data.errors && data.errors.length > 0) {
        setErrors(data.errors.map((e: Record<string, unknown>) => ({
          id: e.id as string,
          timestamp: e.timestamp as string,
          level: (e.level === 'warning' ? 'error' : e.level) as ErrorLogEntry['level'],
          service: e.service as string,
          message: e.message as string,
          stackTrace: (e.stackTrace as string) ?? '',
          requestId: (e.requestId as string) ?? '',
          userId: (e.userId as string) ?? null,
          endpoint: (e.endpoint as string) ?? '',
          count: (e.count as number) ?? 1,
          firstSeen: (e.firstSeen as string) ?? (e.timestamp as string),
          lastSeen: (e.lastSeen as string) ?? (e.timestamp as string),
          resolved: (e.resolved as boolean) ?? false,
        })));
      } else {
        setErrors(generateErrors());
      }
    } catch {
      setErrors(generateErrors());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchErrors();
  }, [fetchErrors]);

  const filtered = useMemo(() => {
    return errors.filter(e => {
      if (levelFilter !== 'all' && e.level !== levelFilter) return false;
      if (!showResolved && e.resolved) return false;
      if (search) {
        const q = search.toLowerCase();
        return e.message.toLowerCase().includes(q) ||
               e.service.toLowerCase().includes(q) ||
               e.endpoint.toLowerCase().includes(q) ||
               e.requestId.includes(q);
      }
      return true;
    });
  }, [errors, search, levelFilter, showResolved]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const stats = useMemo(() => ({
    total: errors.filter(e => !e.resolved).length,
    error: errors.filter(e => e.level === 'error' && !e.resolved).length,
    critical: errors.filter(e => e.level === 'critical' && !e.resolved).length,
    fatal: errors.filter(e => e.level === 'fatal' && !e.resolved).length,
  }), [errors]);

  const toggleResolved = useCallback((id: string) => {
    setErrors(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, resolved: !e.resolved } : e);
      const target = updated.find(e => e.id === id);
      if (target) resolveErrorLog(id, target.resolved).catch(() => {});
      return updated;
    });
  }, []);

  /* ── DataTable columns ── */
  const columns: DataTableColumn<ErrorLogEntry>[] = useMemo(() => [
    {
      id: 'level',
      header: t('admin.errors.level', 'Level'),
      field: 'level',
      cell: (row) => (
        <StatusBadge status={LEVEL_CONFIG[row.level].badgeStatus}>
          {row.level}
        </StatusBadge>
      ),
    },
    {
      id: 'service',
      header: t('admin.errors.service', 'Service'),
      field: 'service',
      sortable: true,
      cell: (row) => <span className="font-mono text-xs text-foreground">{row.service}</span>,
    },
    {
      id: 'message',
      header: t('admin.errors.message', 'Message'),
      field: 'message',
      cell: (row) => <span className="text-foreground max-w-md truncate block">{row.message}</span>,
    },
    {
      id: 'count',
      header: t('admin.errors.occurrences', 'Count'),
      field: 'count',
      sortable: true,
      cell: (row) => <span className="text-muted-foreground text-center block">{row.count}</span>,
    },
    {
      id: 'lastSeen',
      header: t('admin.errors.lastSeen', 'Last Seen'),
      field: 'lastSeen',
      sortable: true,
      cell: (row) => (
        <span className="text-muted-foreground text-xs whitespace-nowrap">
          {new Date(row.lastSeen).toLocaleString()}
        </span>
      ),
    },
    {
      id: 'status',
      header: t('common.status', 'Status'),
      cell: (row) => (
        <StatusBadge status={row.resolved ? 'success' : 'warning'}>
          {row.resolved ? t('admin.errors.resolved', 'Resolved') : t('admin.errors.open', 'Open')}
        </StatusBadge>
      ),
    },
  ], [t]);

  /* ── Filter button ── */
  const FilterBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-card text-muted-foreground border-border hover:border-primary/50'
      }`}
    >
      {children}
    </button>
  );

  return (
    <ContentArea
      title={t('admin.pages.errorLogs.title', 'Error Logs')}
      description={t('admin.pages.errorLogs.description', 'Application error tracking and resolution')}
      headerActions={
        <Button variant="outline" size="sm" onClick={fetchErrors} disabled={loading}>
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      }
      toolbar={
        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(0); }}
            placeholder={t('admin.errors.searchPlaceholder', 'Search by message, service, endpoint...')}
            className="w-72"
          />
          <div className="flex gap-1.5">
            {(['all', 'error', 'critical', 'fatal'] as const).map(lvl => (
              <FilterBtn key={lvl} active={levelFilter === lvl} onClick={() => { setLevelFilter(lvl); setPage(0); }}>
                {lvl === 'all' ? t('common.all', 'All') : lvl.charAt(0).toUpperCase() + lvl.slice(1)}
              </FilterBtn>
            ))}
          </div>
          <label className="flex items-center gap-2 ml-auto cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={() => { setShowResolved(v => !v); setPage(0); }}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm text-muted-foreground">{t('admin.errors.showResolved', 'Show Resolved')}</span>
          </label>
        </div>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label={t('admin.errors.unresolvedErrors', 'Unresolved Errors')} value={stats.total} variant="info" loading={loading} />
        <StatCard label={t('admin.errors.error', 'Error')} value={stats.error} variant="warning" loading={loading} />
        <StatCard label={t('admin.errors.critical', 'Critical')} value={stats.critical} variant="error" loading={loading} />
        <StatCard label={t('admin.errors.fatal', 'Fatal')} value={stats.fatal} variant="critical" loading={loading} />
      </div>

      {/* Table */}
      <DataTable
        data={paged}
        columns={columns}
        rowKey={(row) => row.id}
        loading={loading}
        emptyMessage={t('common.noResults', 'No results found')}
        onRowClick={(row) => setSelectedError(row)}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground">
            {`${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, filtered.length)} / ${filtered.length}`}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              {t('common.previous', 'Previous')}
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              {t('common.next', 'Next')}
            </Button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedError && (
        <Modal isOpen onClose={() => setSelectedError(null)} title={`Error: ${selectedError.message}`}>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Error ID', value: selectedError.id },
                { label: 'Level', value: selectedError.level.toUpperCase() },
                { label: 'Service', value: selectedError.service },
                { label: 'Endpoint', value: selectedError.endpoint },
                { label: 'Request ID', value: selectedError.requestId },
                { label: 'User ID', value: selectedError.userId || '—' },
                { label: 'Occurrences', value: String(selectedError.count) },
                { label: 'Status', value: selectedError.resolved ? 'Resolved' : 'Open' },
                { label: 'First Seen', value: new Date(selectedError.firstSeen).toLocaleString() },
                { label: 'Last Seen', value: new Date(selectedError.lastSeen).toLocaleString() },
              ].map(row => (
                <div key={row.label}>
                  <p className="text-xs text-muted-foreground">{row.label}</p>
                  <p className="text-sm text-foreground font-mono mt-0.5">{row.value}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">{t('admin.errors.stackTrace', 'Stack Trace')}</p>
              <pre className="rounded-lg border border-border bg-muted/30 p-3 text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap">
                {selectedError.stackTrace}
              </pre>
            </div>

            <div className="flex justify-between pt-2">
              <Button
                variant={selectedError.resolved ? 'outline' : 'default'}
                size="sm"
                onClick={() => {
                  toggleResolved(selectedError.id);
                  setSelectedError({ ...selectedError, resolved: !selectedError.resolved });
                }}
              >
                {selectedError.resolved ? t('admin.errors.reopenError', 'Reopen') : t('admin.errors.markResolved', 'Mark Resolved')}
              </Button>
              <Button variant="outline" onClick={() => setSelectedError(null)}>
                {t('common.close', 'Close')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </ContentArea>
  );
};

const feature: AdminFeatureModule = {
  id: 'admin-error-logs',
  name: 'AdminErrorLogsPage',
  adminSection: 'admin-security',
  routes: {
    'admin-error-logs': AdminErrorLogsPage,
  },
};

export default feature;
