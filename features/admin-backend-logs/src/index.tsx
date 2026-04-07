'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea, DataTable, Button, SearchInput } from '@xgen/ui';
import type { DataTableColumn } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { getBackendLogs } from '@xgen/api-client';
import { FiRefreshCw, FiChevronLeft, FiChevronRight } from '@xgen/icons';
import type { BackendLog, LogLevel, SortField, SortDirection } from './types';
import { LogDetailModal } from './components/log-detail-modal';
import './locales';

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

  /* ── DataTable columns ── */
  const columns: DataTableColumn<BackendLog>[] = useMemo(() => [
    {
      id: 'log_level',
      header: t('admin.backendLogs.level'),
      field: 'log_level',
      sortable: true,
      sortFn: (a, b) => {
        const diff = (LOG_LEVEL_PRIORITY[a.log_level] ?? 9) - (LOG_LEVEL_PRIORITY[b.log_level] ?? 9);
        return diff;
      },
      cell: (row) => (
        <span className={`text-xs px-2 py-0.5 rounded-full ${LOG_LEVEL_COLORS[row.log_level] ?? LOG_LEVEL_COLORS.debug}`}>
          {row.log_level}
        </span>
      ),
    },
    {
      id: 'message',
      header: t('admin.backendLogs.message'),
      cell: (row) => <span className="text-foreground max-w-md truncate block">{row.message}</span>,
    },
    {
      id: 'function_name',
      header: t('admin.backendLogs.function'),
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground truncate max-w-36 block">
          {row.function_name ?? '-'}
        </span>
      ),
    },
    {
      id: 'api_endpoint',
      header: t('admin.backendLogs.endpoint'),
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground truncate max-w-40 block">
          {row.api_endpoint ?? '-'}
        </span>
      ),
    },
    {
      id: 'created_at',
      header: t('admin.backendLogs.time'),
      field: 'created_at',
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(row.created_at).toLocaleString()}
        </span>
      ),
    },
  ], [t]);

  return (
    <ContentArea
      title={t('admin.backendLogs.title')}
      description={t('admin.backendLogs.description')}
      headerActions={
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      }
      toolbar={
        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('admin.backendLogs.searchPlaceholder')}
            className="w-72"
          />
          <div className="flex gap-1.5">
            <FilterBtn active={levelFilter === 'all'} onClick={() => setLevelFilter('all')}>
              {t('common.all', 'All')}
            </FilterBtn>
            {ALL_LEVELS.map((level) => (
              <FilterBtn key={level} active={levelFilter === level} onClick={() => setLevelFilter(level)}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </FilterBtn>
            ))}
          </div>
        </div>
      }
    >
      {/* Table */}
      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(row) => row.log_id}
        loading={loading}
        emptyMessage={t('admin.backendLogs.noLogs')}
        onRowClick={(row) => setSelectedLog(row)}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-muted-foreground">
          {t('admin.backendLogs.totalLogs', { count: total })} • {t('admin.backendLogs.pageInfo', { page, total: totalPages || 1 })}
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
  sidebarItems: [
    { id: 'admin-backend-logs', titleKey: 'admin.sidebar.system.backendLogs.title', descriptionKey: 'admin.sidebar.system.backendLogs.description' },
  ],
  routes: {
    'admin-backend-logs': AdminBackendLogsPage,
  },
};

export default feature;
