'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { RouteComponentProps } from '@xgen/types';
import {
  ContentArea,
  FilterTabs,
  StatusBadge,
  EmptyState,
  Button,
  SearchInput,
} from '@xgen/ui';
import type { StatusBadgeVariant } from '@xgen/ui';
import { FiRefreshCw, FiChevronDown, FiChevronRight, FiFileText, FiAlertCircle } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import {
  listUploadHistory,
  listCollections,
  type UploadHistoryRecord,
  type UploadHistoryStatus,
  type CollectionOption,
} from '../api';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;
const STATUS_FILTERS = ['all', 'completed', 'failed', 'processing', 'pending', 'cancelled'] as const;

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function statusToBadgeVariant(status: UploadHistoryStatus): StatusBadgeVariant {
  switch (status) {
    case 'completed': return 'success';
    case 'failed': return 'error';
    case 'processing': return 'info';
    case 'pending': return 'neutral';
    case 'cancelled': return 'warning';
    default: return 'neutral';
  }
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatElapsed(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return '-';
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

const boolLabel = (v: boolean) => v ? 'ON' : 'OFF';

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
  const [collectionFilter, setCollectionFilter] = useState('');
  const [collections, setCollections] = useState<CollectionOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // ── Fetch ──
  const fetchData = useCallback(async () => {
    try {
      const result = await listUploadHistory({
        collectionName: collectionFilter || undefined,
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
  }, [statusFilter, collectionFilter, page]);

  const fetchCollections = useCallback(async () => {
    try {
      const list = await listCollections();
      setCollections(list);
    } catch {
      // ignore
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Re-fetch on filter/page changes
  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // ── Filtered by search (client-side) ──
  const filteredRecords = React.useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase();
    return records.filter(
      (r) =>
        r.fileName.toLowerCase().includes(q) ||
        r.collectionDisplayName.toLowerCase().includes(q),
    );
  }, [records, searchQuery]);

  // ── Tabs ──
  const tabs = React.useMemo(
    () =>
      STATUS_FILTERS.map((key) => ({
        key,
        label: t(`uploadHistory.filters.${key}`),
      })),
    [t],
  );

  // ── Handlers ──
  const handleTabChange = useCallback((key: string) => {
    setStatusFilter(key);
    setPage(0);
    setExpandedId(null);
  }, []);

  const handleCollectionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setCollectionFilter(e.target.value);
    setPage(0);
    setExpandedId(null);
  }, []);

  const toggleExpand = useCallback((id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const showingFrom = totalCount === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingTo = Math.min((page + 1) * PAGE_SIZE, totalCount);

  // ── Toolbar ──
  const toolbar = (
    <div className="flex items-center gap-3">
      <FilterTabs tabs={tabs} activeKey={statusFilter} onChange={handleTabChange} />
      <select
        className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground"
        value={collectionFilter}
        onChange={handleCollectionChange}
      >
        <option value="">{t('uploadHistory.collectionFilter.all')}</option>
        {collections.map((c) => (
          <option key={c.collectionName} value={c.collectionName}>
            {c.displayName}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-2 ml-auto">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('uploadHistory.searchPlaceholder')}
        />
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
      {loading && filteredRecords.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </div>
      ) : filteredRecords.length === 0 ? (
        <EmptyState
          title={t('uploadHistory.empty.title')}
          description={t('uploadHistory.empty.description')}
        />
      ) : (
        <div className="rounded-lg border border-[var(--color-line-50)] overflow-visible">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="w-8 px-2 py-3" />
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {t('uploadHistory.table.fileName')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {t('uploadHistory.table.collection')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {t('uploadHistory.table.status')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {t('uploadHistory.table.source')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {t('uploadHistory.table.size')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {t('uploadHistory.table.chunks')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {t('uploadHistory.table.elapsed')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {t('uploadHistory.table.date')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <React.Fragment key={record.id}>
                  {/* Data Row */}
                  <tr
                    className="border-b border-border hover:bg-muted/20 cursor-pointer transition-colors"
                    onClick={() => toggleExpand(record.id)}
                  >
                    <td className="px-2 py-3 text-muted-foreground">
                      {expandedId === record.id
                        ? <FiChevronDown className="h-4 w-4" />
                        : <FiChevronRight className="h-4 w-4" />}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FiFileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate max-w-[280px]" title={record.fileName}>
                          {record.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="truncate max-w-[150px]" title={record.collectionDisplayName}>
                        {record.collectionDisplayName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={statusToBadgeVariant(record.status)}>
                        {t(`uploadHistory.status.${record.status}`)}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t(`uploadHistory.source.${record.uploadSource}`) || record.uploadSource}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatFileSize(record.fileSize)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-medium">
                      {record.totalChunks || '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatElapsed(record.elapsedSeconds)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateTime(record.createdAt)}
                    </td>
                  </tr>

                  {/* Expanded Detail Row */}
                  {expandedId === record.id && (
                    <tr className="bg-muted/10">
                      <td colSpan={9}>
                        <div className="p-4 mx-4 my-2 rounded-lg border border-border bg-background">
                          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                            <DetailItem label={t('uploadHistory.detail.fileType')} value={record.fileType || '-'} />
                            <DetailItem label={t('uploadHistory.detail.sessionId')} value={record.sessionId || '-'} />
                            <DetailItem label={t('uploadHistory.detail.chunkSize')} value={String(record.chunkSize)} />
                            <DetailItem label={t('uploadHistory.detail.chunkOverlap')} value={String(record.chunkOverlap)} />
                            <DetailItem label={t('uploadHistory.detail.chunkingStrategy')} value={record.chunkingStrategy || '-'} />
                            <DetailItem label={t('uploadHistory.detail.totalChunks')} value={`${record.totalChunks} / ${record.processedChunks}`} />
                            <DetailItem label="OCR" value={boolLabel(record.useOcr)} />
                            <DetailItem label="LLM Metadata" value={boolLabel(record.useLlmMetadata)} />
                            <DetailItem label={t('uploadHistory.detail.defaultMeta')} value={boolLabel(record.extractDefaultMetadata)} />
                            <DetailItem label={t('uploadHistory.detail.forceChunking')} value={boolLabel(record.forceChunking)} />
                            <DetailItem label="Sparse Vector" value={boolLabel(record.enableSparseVector)} />
                            <DetailItem label="Full Text" value={boolLabel(record.enableFullText)} />
                            <DetailItem label={t('uploadHistory.detail.ontologyGraph')} value={boolLabel(record.generateOntologyGraph)} />
                            <DetailItem label="MinIO" value={`${record.minioUploadSuccess ? '✓' : '✗'} ${record.minioPath || ''}`} />
                            <DetailItem label={t('uploadHistory.detail.retries')} value={String(record.totalRetries)} />
                            <DetailItem label={t('uploadHistory.detail.startedAt')} value={formatDateTime(record.startedAt)} />
                            <DetailItem label={t('uploadHistory.detail.completedAt')} value={formatDateTime(record.completedAt)} />
                            {record.directoryPath && (
                              <DetailItem label={t('uploadHistory.detail.directory')} value={record.directoryPath} />
                            )}
                          </div>
                          {record.errorMessage && (
                            <div className="mt-3 p-3 rounded-md bg-red-50 border border-red-200">
                              <div className="flex items-center gap-1 text-sm font-medium text-red-700 mb-1">
                                <FiAlertCircle className="h-3.5 w-3.5" />
                                {record.errorType || 'Error'}
                              </div>
                              <div className="text-sm text-red-600">{record.errorMessage}</div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      {totalCount > 0 && (
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

// ─────────────────────────────────────────────────────────────
// Detail Item Sub-component
// ─────────────────────────────────────────────────────────────

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <span className="font-medium text-muted-foreground min-w-[120px]">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

export default UploadHistoryPage;
