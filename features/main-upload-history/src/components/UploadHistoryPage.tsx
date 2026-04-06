'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { RouteComponentProps } from '@xgen/types';
import {
  ContentArea,
  FilterTabs,
  DataTable,
  StatusBadge,
  EmptyState,
  Button,
  SearchInput,
  ToggleSwitch,
} from '@xgen/ui';
import type { DataTableColumn, StatusBadgeVariant } from '@xgen/ui';
import { FiRefreshCw, FiClock, FiFileText, FiChevronDown, FiChevronUp } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import {
  listUploadHistory,
  type UploadHistoryRecord,
  type UploadHistoryStatus,
} from '../api';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;
const AUTO_REFRESH_INTERVAL = 5000;

const STATUS_FILTERS = ['all', 'uploading', 'processing', 'embedding', 'complete', 'error'] as const;

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function statusToBadgeVariant(status: UploadHistoryStatus): StatusBadgeVariant {
  switch (status) {
    case 'complete': return 'success';
    case 'error': return 'error';
    case 'embedding': return 'info';
    case 'processing': return 'warning';
    case 'uploading': return 'info';
    default: return 'neutral';
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}

function progressPercent(record: UploadHistoryRecord): number {
  if (record.status === 'complete') return 100;
  if (record.totalChunks === 0) return 0;
  return Math.round((record.processedChunks / record.totalChunks) * 100);
}

// ─────────────────────────────────────────────────────────────
// UploadHistoryPage
// ─────────────────────────────────────────────────────────────

export interface UploadHistoryPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

export const UploadHistoryPage: React.FC<UploadHistoryPageProps> = () => {
  const { t } = useTranslation();

  // State
  const [records, setRecords] = useState<UploadHistoryRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch ──
  const fetchData = useCallback(async () => {
    try {
      const result = await listUploadHistory({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setRecords(result.records);
      setTotalCount(result.totalCount);
    } catch (err) {
      console.error('Failed to fetch upload history:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  // Initial load + filter/page changes
  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      refreshTimerRef.current = setInterval(fetchData, AUTO_REFRESH_INTERVAL);
    }
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [autoRefresh, fetchData]);

  // ── Filtered by search (client-side) ──
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase();
    return records.filter(
      (r) =>
        r.fileName.toLowerCase().includes(q) ||
        r.collectionDisplayName.toLowerCase().includes(q),
    );
  }, [records, searchQuery]);

  // ── Tabs ──
  const tabs = useMemo(
    () =>
      STATUS_FILTERS.map((key) => ({
        key,
        label: t(`uploadHistory.filters.${key}`),
      })),
    [t],
  );

  // ── Row expand toggle ──
  const toggleExpand = useCallback((id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ── Pagination ──
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const showingFrom = totalCount === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingTo = Math.min((page + 1) * PAGE_SIZE, totalCount);

  const handleTabChange = useCallback((key: string) => {
    setStatusFilter(key);
    setPage(0);
    setExpandedRows(new Set());
  }, []);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // ── Columns ──
  const columns: DataTableColumn<UploadHistoryRecord>[] = useMemo(
    () => [
      {
        id: 'expand',
        header: '',
        cell: (row) => (
          <button
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(row.id);
            }}
          >
            {expandedRows.has(row.id) ? (
              <FiChevronUp className="h-4 w-4" />
            ) : (
              <FiChevronDown className="h-4 w-4" />
            )}
          </button>
        ),
        minWidth: '40px',
        cellClassName: 'w-10',
      },
      {
        id: 'fileName',
        header: t('uploadHistory.table.fileName'),
        field: 'fileName' as keyof UploadHistoryRecord,
        sortable: true,
        cell: (row) => (
          <div className="flex items-center gap-2">
            <FiFileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate max-w-[200px]" title={row.fileName}>
              {row.fileName}
            </span>
          </div>
        ),
        minWidth: '200px',
      },
      {
        id: 'collection',
        header: t('uploadHistory.table.collection'),
        field: 'collectionDisplayName' as keyof UploadHistoryRecord,
        sortable: true,
        cell: (row) => (
          <span className="text-sm text-muted-foreground">{row.collectionDisplayName}</span>
        ),
        minWidth: '150px',
      },
      {
        id: 'status',
        header: t('uploadHistory.table.status'),
        field: 'status' as keyof UploadHistoryRecord,
        sortable: true,
        cell: (row) => (
          <StatusBadge variant={statusToBadgeVariant(row.status)}>
            {t(`uploadHistory.status.${row.status}`)}
          </StatusBadge>
        ),
        minWidth: '120px',
      },
      {
        id: 'progress',
        header: t('uploadHistory.table.progress'),
        cell: (row) => {
          const pct = progressPercent(row);
          return (
            <div className="flex items-center gap-2 min-w-[120px]">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    row.status === 'error'
                      ? 'bg-error'
                      : row.status === 'complete'
                        ? 'bg-success'
                        : 'bg-info'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
            </div>
          );
        },
        minWidth: '160px',
      },
      {
        id: 'createdAt',
        header: t('uploadHistory.table.createdAt'),
        field: 'createdAt' as keyof UploadHistoryRecord,
        sortable: true,
        cell: (row) => (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <FiClock className="h-3.5 w-3.5" />
            {formatDate(row.createdAt)}
          </div>
        ),
        minWidth: '160px',
      },
    ],
    [t, expandedRows, toggleExpand],
  );

  // ── Toolbar ──
  const toolbar = (
    <div className="flex items-center gap-3">
      <FilterTabs tabs={tabs} activeKey={statusFilter} onChange={handleTabChange} />
      <div className="flex items-center gap-2 ml-auto">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('uploadHistory.searchPlaceholder')}
        />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ToggleSwitch
            checked={autoRefresh}
            onChange={setAutoRefresh}
          />
          <span>{t('uploadHistory.autoRefresh')}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefresh}>
          <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );

  return (
    <ContentArea
      title={t('uploadHistory.title')}
      description={t('uploadHistory.description')}
      toolbar={toolbar}
      contentPadding={true}
      contentClassName="flex flex-col gap-4"
    >
      {/* Data Table */}
      <DataTable
        data={filteredRecords}
        columns={columns}
        rowKey={(row) => row.id}
        loading={loading}
        emptyMessage=""
        onRowClick={(row) => toggleExpand(row.id)}
        rowClassName={(row) =>
          expandedRows.has(row.id) ? 'bg-muted/30' : ''
        }
      />

      {/* Expanded Row Details */}
      {filteredRecords.length > 0 && expandedRows.size > 0 && (
        <div className="space-y-2">
          {filteredRecords
            .filter((r) => expandedRows.has(r.id))
            .map((row) => (
              <div
                key={`detail-${row.id}`}
                className="rounded-lg border border-border bg-muted/20 p-4 text-sm"
              >
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  <div>
                    <span className="font-medium text-muted-foreground">
                      {t('uploadHistory.table.fileName')}:
                    </span>{' '}
                    {row.fileName}
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      {t('uploadHistory.table.collection')}:
                    </span>{' '}
                    {row.collectionDisplayName}
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      {t('uploadHistory.table.progress')}:
                    </span>{' '}
                    {row.processedChunks} / {row.totalChunks} chunks
                  </div>
                  {row.uploadedBy && (
                    <div>
                      <span className="font-medium text-muted-foreground">
                        {t('uploadHistory.table.uploadedBy')}:
                      </span>{' '}
                      {row.uploadedBy}
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-muted-foreground">
                      {t('uploadHistory.table.updatedAt')}:
                    </span>{' '}
                    {formatDate(row.updatedAt)}
                  </div>
                  {row.errorMessage && (
                    <div className="col-span-2">
                      <span className="font-medium text-error">
                        {t('uploadHistory.table.errorMessage')}:
                      </span>{' '}
                      <span className="text-error">{row.errorMessage}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredRecords.length === 0 && (
        <EmptyState
          title={t('uploadHistory.empty.title')}
          description={t('uploadHistory.empty.description')}
        />
      )}

      {/* Pagination */}
      {totalCount > PAGE_SIZE && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">
            {t('uploadHistory.pagination.showing', {
              from: showingFrom,
              to: showingTo,
              total: totalCount,
            })}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              {t('uploadHistory.pagination.prev')}
            </Button>
            <span className="text-sm text-muted-foreground">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              {t('uploadHistory.pagination.next')}
            </Button>
          </div>
        </div>
      )}
    </ContentArea>
  );
};

export default UploadHistoryPage;
