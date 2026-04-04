'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea, Button } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { getBackendLogs } from '@xgen/api-client';
import { FiRefreshCw, FiChevronLeft, FiChevronRight } from '@xgen/icons';
import type { BackendLog, LogLevel, SortField, SortDirection } from './types';
import { LogDetailModal } from './components/log-detail-modal';

const LOG_LEVEL_PRIORITY: Record<string, number> = { error: 0, warning: 1, info: 2, debug: 3 };
const LOG_LEVEL_COLORS: Record<string, string> = {
  error: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  debug: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};
const ALL_LEVELS: LogLevel[] = ['error', 'warning', 'info', 'debug'];
const PAGE_SIZE = 250;

const AdminBackendLogsPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<BackendLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [selectedLog, setSelectedLog] = useState<BackendLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getBackendLogs(page, PAGE_SIZE);
      setLogs(result.logs ?? []);
      setTotal(result.total ?? 0);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = useMemo(() => {
    let items = logs;

    if (levelFilter !== 'all') {
      items = items.filter((l) => l.log_level === levelFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (l) =>
          l.log_id.toLowerCase().includes(q) ||
          l.message.toLowerCase().includes(q) ||
          l.function_name?.toLowerCase().includes(q) ||
          l.api_endpoint?.toLowerCase().includes(q) ||
          String(l.user_id).includes(q),
      );
    }

    items = [...items].sort((a, b) => {
      if (sortField === 'log_level') {
        const diff = (LOG_LEVEL_PRIORITY[a.log_level] ?? 9) - (LOG_LEVEL_PRIORITY[b.log_level] ?? 9);
        return sortDir === 'asc' ? diff : -diff;
      }
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === 'asc' ? diff : -diff;
    });

    return items;
  }, [logs, levelFilter, search, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <ContentArea
      title={t('admin.pages.backendLogs.title', 'Backend Logs')}
      description={t('admin.pages.backendLogs.description', 'View and filter backend application logs')}
      headerActions={
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          disabled={loading}
          leftIcon={<FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
        >
          {t('common.refresh', 'Refresh')}
        </Button>
      }
    >
      {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.pages.backendLogs.searchPlaceholder', 'Search logs...')}
            className="px-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-72"
          />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLevelFilter('all')}
              className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                levelFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
              }`}
            >
              All
            </button>
            {ALL_LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => setLevelFilter(level)}
                className={`px-2.5 py-1 text-xs rounded-md border transition-colors capitalize ${
                  levelFilter === level ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30">
                <th
                  className="text-left p-3 font-semibold text-xs text-muted-foreground tracking-wide cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort('log_level')}
                >
                  Level {sortField === 'log_level' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-left p-3 font-semibold text-xs text-muted-foreground tracking-wide">Message</th>
                <th className="text-left p-3 font-semibold text-xs text-muted-foreground tracking-wide">Function</th>
                <th className="text-left p-3 font-semibold text-xs text-muted-foreground tracking-wide">Endpoint</th>
                <th
                  className="text-left p-3 font-semibold text-xs text-muted-foreground tracking-wide cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort('created_at')}
                >
                  Time {sortField === 'created_at' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    {t('admin.pages.backendLogs.noLogs', 'No logs found')}
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr
                    key={log.log_id}
                    onClick={() => setSelectedLog(log)}
                    className="border-t border-border hover:bg-muted/30 cursor-pointer"
                  >
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${LOG_LEVEL_COLORS[log.log_level] ?? LOG_LEVEL_COLORS.debug}`}>
                        {log.log_level}
                      </span>
                    </td>
                    <td className="p-3 max-w-md truncate text-foreground">{log.message}</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground truncate max-w-36">
                      {log.function_name ?? '-'}
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground truncate max-w-40">
                      {log.api_endpoint ?? '-'}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {total} logs total • Page {page} of {totalPages || 1}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <FiChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <FiChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Detail Modal */}
        {selectedLog && (
          <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
        )}
    </ContentArea>
  );
};

const feature: AdminFeatureModule = {
  id: 'admin-backend-logs',
  name: 'AdminBackendLogsPage',
  adminSection: 'admin-system',
  routes: {
    'admin-backend-logs': AdminBackendLogsPage,
  },
};

export default feature;
