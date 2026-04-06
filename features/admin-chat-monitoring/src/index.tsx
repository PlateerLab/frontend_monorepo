'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import {
  ContentArea,
  DataTable,
  Button,
  StatusBadge,
  SearchInput,
  useToast,
} from '@xgen/ui';
import type { DataTableColumn } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiRefreshCw, FiSearch, FiX } from '@xgen/icons';
import type { WorkflowLog } from './types';
import { getChatLogs } from './api/chat-log-api';
import { ChatLogDetailModal } from './components/chat-log-detail-modal';
import { DownloadDropdown } from './components/download-dropdown';

const PAGE_SIZE = 50;
const TRUNCATE_LENGTH = 80;

function truncate(text: string | null, len: number = TRUNCATE_LENGTH): string {
  if (!text) return '';
  return text.length > len ? `${text.slice(0, len)}...` : text;
}

const AdminChatMonitoringPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // ── Data state ──
  const [logs, setLogs] = useState<WorkflowLog[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // ── Filter / search state ──
  const [userIdInput, setUserIdInput] = useState('');
  const [activeUserId, setActiveUserId] = useState<number | null>(null);
  const [textFilter, setTextFilter] = useState('');

  // ── Detail modal state ──
  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    title: string;
    content: string;
  }>({ open: false, title: '', content: '' });

  // ── Fetch helper ──
  const fetchLogs = useCallback(
    async (pageNum: number, userId: number | null, append: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getChatLogs(pageNum, PAGE_SIZE, userId);
        const newLogs = res.io_logs ?? [];
        if (append) {
          setLogs((prev) => [...prev, ...newLogs]);
        } else {
          setLogs(newLogs);
        }
        setHasMore(newLogs.length >= PAGE_SIZE);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : t('admin.workflowManagement.chatMonitoring.loadError');
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [t, toast],
  );

  // ── Initial load ──
  useEffect(() => {
    fetchLogs(1, null, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Pagination ──
  const handlePrev = useCallback(() => {
    if (page <= 1) return;
    const newPage = page - 1;
    setPage(newPage);
    fetchLogs(newPage, activeUserId, false);
  }, [page, activeUserId, fetchLogs]);

  const handleNext = useCallback(() => {
    if (!hasMore) return;
    const newPage = page + 1;
    setPage(newPage);
    fetchLogs(newPage, activeUserId, false);
  }, [page, hasMore, activeUserId, fetchLogs]);

  // ── User ID search ──
  const handleUserSearch = useCallback(() => {
    const trimmed = userIdInput.trim();
    if (trimmed === '') {
      setActiveUserId(null);
      setPage(1);
      fetchLogs(1, null, false);
      return;
    }
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed) || !Number.isInteger(parsed)) {
      toast.error(t('admin.workflowManagement.chatMonitoring.invalidUserId'));
      return;
    }
    setActiveUserId(parsed);
    setPage(1);
    fetchLogs(1, parsed, false);
  }, [userIdInput, fetchLogs, toast, t]);

  const handleUserReset = useCallback(() => {
    setUserIdInput('');
    setActiveUserId(null);
    setPage(1);
    fetchLogs(1, null, false);
  }, [fetchLogs]);

  // ── Refresh ──
  const handleRefresh = useCallback(() => {
    setPage(1);
    fetchLogs(1, activeUserId, false);
  }, [activeUserId, fetchLogs]);

  // ── Client-side text filter ──
  const filteredLogs = useMemo(() => {
    if (!textFilter.trim()) return logs;
    const q = textFilter.toLowerCase();
    return logs.filter(
      (log) =>
        log.workflow_id.toLowerCase().includes(q) ||
        log.workflow_name.toLowerCase().includes(q) ||
        log.interaction_id.toLowerCase().includes(q) ||
        String(log.user_id ?? '').includes(q) ||
        (log.username ?? '').toLowerCase().includes(q),
    );
  }, [logs, textFilter]);

  // ── Detail modal helpers ──
  const openDetail = useCallback(
    (title: string, content: string) => {
      setDetailModal({ open: true, title, content });
    },
    [],
  );
  const closeDetail = useCallback(() => {
    setDetailModal({ open: false, title: '', content: '' });
  }, []);

  // ── Mode badge ──
  const renderMode = useCallback(
    (log: WorkflowLog) => {
      if (log.test_mode) {
        return (
          <StatusBadge variant="warning">
            {t('admin.workflowManagement.chatMonitoring.modeTest')}
          </StatusBadge>
        );
      }
      // Heuristic: if user_id is null it's likely deploy-mode
      if (log.user_id == null) {
        return (
          <StatusBadge variant="info">
            {t('admin.workflowManagement.chatMonitoring.modeDeploy')}
          </StatusBadge>
        );
      }
      return (
        <StatusBadge variant="success">
          {t('admin.workflowManagement.chatMonitoring.modeProduction')}
        </StatusBadge>
      );
    },
    [t],
  );

  // ── Clickable truncated cell ──
  const renderTruncatedCell = useCallback(
    (value: string | null, header: string) => {
      if (!value) return <span className="text-muted-foreground">-</span>;
      if (value.length <= TRUNCATE_LENGTH) {
        return <span className="text-sm">{value}</span>;
      }
      return (
        <button
          type="button"
          className="cursor-pointer text-left text-sm text-primary hover:underline"
          onClick={() => openDetail(header, value)}
          title={t('admin.workflowManagement.chatMonitoring.viewFullContent')}
        >
          {truncate(value)}
        </button>
      );
    },
    [openDetail, t],
  );

  // ── Columns ──
  const columns: DataTableColumn<WorkflowLog>[] = useMemo(
    () => [
      {
        id: 'id',
        header: t('admin.workflowManagement.chatMonitoring.columns.id'),
        field: 'id' as keyof WorkflowLog,
        sortable: true,
        minWidth: '60px',
        cell: (row) => <span className="text-sm font-mono">{row.id}</span>,
      },
      {
        id: 'user_id',
        header: t('admin.workflowManagement.chatMonitoring.columns.userId'),
        field: 'user_id' as keyof WorkflowLog,
        sortable: true,
        minWidth: '80px',
        cell: (row) => (
          <span className="text-sm">{row.user_id ?? '-'}</span>
        ),
      },
      {
        id: 'workflow_name',
        header: t('admin.workflowManagement.chatMonitoring.columns.workflowName'),
        field: 'workflow_name' as keyof WorkflowLog,
        sortable: true,
        minWidth: '140px',
        cell: (row) => (
          <span className="text-sm font-medium">{truncate(row.workflow_name, 30)}</span>
        ),
      },
      {
        id: 'workflow_id',
        header: t('admin.workflowManagement.chatMonitoring.columns.workflowId'),
        field: 'workflow_id' as keyof WorkflowLog,
        sortable: true,
        minWidth: '140px',
        cell: (row) => (
          <span className="text-sm font-mono text-muted-foreground">
            {truncate(row.workflow_id, 24)}
          </span>
        ),
      },
      {
        id: 'interaction_id',
        header: t('admin.workflowManagement.chatMonitoring.columns.interactionId'),
        field: 'interaction_id' as keyof WorkflowLog,
        sortable: true,
        minWidth: '140px',
        cell: (row) => (
          <span className="text-sm font-mono text-muted-foreground">
            {truncate(row.interaction_id, 24)}
          </span>
        ),
      },
      {
        id: 'input_data',
        header: t('admin.workflowManagement.chatMonitoring.columns.inputData'),
        minWidth: '180px',
        cell: (row) =>
          renderTruncatedCell(
            row.input_data,
            t('admin.workflowManagement.chatMonitoring.columns.inputData'),
          ),
      },
      {
        id: 'output_data',
        header: t('admin.workflowManagement.chatMonitoring.columns.outputData'),
        minWidth: '180px',
        cell: (row) =>
          renderTruncatedCell(
            row.output_data,
            t('admin.workflowManagement.chatMonitoring.columns.outputData'),
          ),
      },
      {
        id: 'llm_eval_score',
        header: t('admin.workflowManagement.chatMonitoring.columns.llmEvalScore'),
        field: 'llm_eval_score' as keyof WorkflowLog,
        sortable: true,
        minWidth: '90px',
        cell: (row) => (
          <span className="text-sm">
            {row.llm_eval_score != null ? row.llm_eval_score : '-'}
          </span>
        ),
      },
      {
        id: 'user_score',
        header: t('admin.workflowManagement.chatMonitoring.columns.userScore'),
        field: 'user_score' as keyof WorkflowLog,
        sortable: true,
        minWidth: '80px',
        cell: (row) => <span className="text-sm">{row.user_score}</span>,
      },
      {
        id: 'mode',
        header: t('admin.workflowManagement.chatMonitoring.columns.mode'),
        minWidth: '100px',
        sortable: true,
        field: 'test_mode' as keyof WorkflowLog,
        cell: (row) => renderMode(row),
      },
      {
        id: 'created_at',
        header: t('admin.workflowManagement.chatMonitoring.columns.createdAt'),
        field: 'created_at' as keyof WorkflowLog,
        sortable: true,
        minWidth: '150px',
        cell: (row) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {new Date(row.created_at).toLocaleString()}
          </span>
        ),
      },
    ],
    [t, renderTruncatedCell, renderMode],
  );

  // ── Error state ──
  if (error && logs.length === 0) {
    return (
      <ContentArea
        title={t('admin.workflowManagement.chatMonitoring.title')}
        description={t('admin.workflowManagement.chatMonitoring.subtitle')}
      >
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {t('admin.workflowManagement.chatMonitoring.errorOccurred')}
          </p>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            {t('admin.workflowManagement.chatMonitoring.retry')}
          </Button>
        </div>
      </ContentArea>
    );
  }

  // ── Pagination info ──
  const paginationInfo = activeUserId != null
    ? `${t('admin.workflowManagement.chatMonitoring.userId')}: ${activeUserId} · ${t('admin.workflowManagement.chatMonitoring.totalLogsLoaded')}: ${filteredLogs.length}`
    : `${t('admin.workflowManagement.chatMonitoring.totalLogsLoaded')}: ${filteredLogs.length}`;

  return (
    <ContentArea
      title={t('admin.workflowManagement.chatMonitoring.title')}
      description={t('admin.workflowManagement.chatMonitoring.subtitle')}
      headerActions={
        <div className="flex items-center gap-2">
          <DownloadDropdown />
          <Button
            variant="outline"
            size="sm"
            leftIcon={<FiRefreshCw className="h-4 w-4" />}
            onClick={handleRefresh}
            loading={loading}
          >
            {t('admin.workflowManagement.chatMonitoring.refresh')}
          </Button>
        </div>
      }
      toolbar={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="h-8 w-36 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={t('admin.workflowManagement.chatMonitoring.userIdPlaceholder')}
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUserSearch();
              }}
            />
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FiSearch className="h-3.5 w-3.5" />}
              onClick={handleUserSearch}
            >
              {t('admin.workflowManagement.chatMonitoring.search')}
            </Button>
            {activeUserId != null && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<FiX className="h-3.5 w-3.5" />}
                onClick={handleUserReset}
              >
                {t('admin.workflowManagement.chatMonitoring.reset')}
              </Button>
            )}
            <span className="text-xs text-muted-foreground ml-2">{paginationInfo}</span>
          </div>
          <SearchInput
            value={textFilter}
            onChange={setTextFilter}
            placeholder={t('admin.workflowManagement.chatMonitoring.filterPlaceholder')}
            size="sm"
            className="w-72"
          />
        </div>
      }
      footer={
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={handlePrev}
          >
            {t('admin.workflowManagement.chatMonitoring.prev')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('admin.workflowManagement.chatMonitoring.page')} {page}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore || loading}
            onClick={handleNext}
          >
            {t('admin.workflowManagement.chatMonitoring.next')}
          </Button>
        </div>
      }
    >
      <DataTable<WorkflowLog>
        data={filteredLogs}
        columns={columns}
        rowKey={(row) => row.id}
        loading={loading && logs.length === 0}
        loadingMessage={t('admin.workflowManagement.chatMonitoring.loading')}
        emptyMessage={
          textFilter
            ? t('admin.workflowManagement.chatMonitoring.noSearchResults')
            : t('admin.workflowManagement.chatMonitoring.noLogs')
        }
      />

      {/* ── Detail Modal ── */}
      <ChatLogDetailModal
        isOpen={detailModal.open}
        onClose={closeDetail}
        title={detailModal.title}
        content={detailModal.content}
      />
    </ContentArea>
  );
};

const feature: AdminFeatureModule = {
  id: 'admin-chat-monitoring',
  name: 'AdminChatMonitoringPage',
  adminSection: 'admin-workflow',
  routes: {
    'admin-chat-monitoring': AdminChatMonitoringPage,
  },
};

export default feature;
