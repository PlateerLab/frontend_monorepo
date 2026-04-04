'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea, Button, SearchInput, StatusBadge, Modal } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
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

const LEVEL_CONFIG: Record<ErrorLogEntry['level'], { color: string; badgeStatus: 'error' | 'warning' }> = {
  error: { color: 'text-orange-600', badgeStatus: 'warning' },
  critical: { color: 'text-red-600', badgeStatus: 'error' },
  fatal: { color: 'text-red-800', badgeStatus: 'error' },
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
    { msg: 'Failed to parse workflow JSON', trace: 'SyntaxError: Unexpected token } in JSON at position 1205\n    at JSON.parse (<anonymous>)\n    at WorkflowParser.parse (parser.ts:67:20)' },
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

  useEffect(() => {
    (async () => {
      try {
        const data = await getSystemErrorLogs();
        if (data.errors && data.errors.length > 0) {
          setErrors(data.errors.map(e => ({
            id: e.id,
            timestamp: e.timestamp,
            level: e.level === 'warning' ? 'error' as const : e.level as ErrorLogEntry['level'],
            service: e.service,
            message: e.message,
            stackTrace: e.stackTrace,
            requestId: e.requestId,
            userId: null,
            endpoint: e.endpoint,
            count: 1,
            firstSeen: e.timestamp,
            lastSeen: e.timestamp,
            resolved: e.resolved,
          })));
        } else {
          setErrors(generateErrors());
        }
      } catch {
        setErrors(generateErrors());
      }
      setLoading(false);
    })();
  }, []);

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

  const toggleResolved = (id: string) => {
    setErrors(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, resolved: !e.resolved } : e);
      const target = updated.find(e => e.id === id);
      if (target) resolveErrorLog(id, target.resolved).catch(() => {});
      return updated;
    });
  };

  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {t('admin.pages.errorLogs.title', 'Error Logs')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('admin.pages.errorLogs.description', 'Application error tracking and resolution')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: t('admin.errors.unresolvedErrors', 'Unresolved Errors'), value: stats.total, color: 'text-blue-600' },
            { label: t('admin.errors.error', 'Error'), value: stats.error, color: 'text-orange-600' },
            { label: t('admin.errors.critical', 'Critical'), value: stats.critical, color: 'text-red-600' },
            { label: t('admin.errors.fatal', 'Fatal'), value: stats.fatal, color: 'text-red-800' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{loading ? '—' : s.value}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-72">
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(0); }} placeholder={t('admin.errors.searchPlaceholder', 'Search by message, service, endpoint...')} />
          </div>

          <div className="flex gap-2">
            {(['all', 'error', 'critical', 'fatal'] as const).map(lvl => (
              <button
                key={lvl}
                onClick={() => { setLevelFilter(lvl); setPage(0); }}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  levelFilter === lvl
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                }`}
              >
                {lvl === 'all' ? t('common.all', 'All') : lvl.charAt(0).toUpperCase() + lvl.slice(1)}
              </button>
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

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">{t('admin.errors.level', 'Level')}</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">{t('admin.errors.service', 'Service')}</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">{t('admin.errors.message', 'Message')}</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">{t('admin.errors.occurrences', 'Count')}</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">{t('admin.errors.lastSeen', 'Last Seen')}</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">{t('common.status', 'Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paged.map(e => (
                  <tr
                    key={e.id}
                    onClick={() => setSelectedError(e)}
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <StatusBadge status={LEVEL_CONFIG[e.level].badgeStatus}>
                        {e.level}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{e.service}</td>
                    <td className="px-4 py-3 text-foreground max-w-md truncate">{e.message}</td>
                    <td className="px-4 py-3 text-muted-foreground text-center">{e.count}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(e.lastSeen).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={e.resolved ? 'success' : 'warning'}>
                        {e.resolved ? t('admin.errors.resolved', 'Resolved') : t('admin.errors.open', 'Open')}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      {t('common.noResults', 'No results found')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {`${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
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
            <div className="flex flex-col gap-4 p-4">
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
      </div>
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
