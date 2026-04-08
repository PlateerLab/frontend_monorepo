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
import type { AgentflowLog } from './types';
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
  const [logs, setLogs] = useState<AgentflowLog[]>([]);
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
          err instanceof Error ? err.message : t('admin.agentflowManagement.chatMonitoring.loadError');
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
      toast.error(t('admin.agentflowManagement.chatMonitoring.invalidUserId'));
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
    (log: AgentflowLog) => {
      if (log.test_mode) {
        return (
          <StatusBadge variant="warning">
            {t('admin.agentflowManagement.chatMonitoring.modeTest')}
          </StatusBadge>
        );
      }
      // Heuristic: if user_id is null it's likely deploy-mode
      if (log.user_id == null) {
        return (
          <StatusBadge variant="info">
            {t('admin.agentflowManagement.chatMonitoring.modeDeploy')}
          </StatusBadge>
        );
      }
      return (
        <StatusBadge variant="success">
          {t('admin.agentflowManagement.chatMonitoring.modeProduction')}
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
          title={t('admin.agentflowManagement.chatMonitoring.viewFullContent')}
        >
          {truncate(value)}
        </button>
      );
    },
    [openDetail, t],
  );

  // ── Columns ──
  const columns: DataTableColumn<AgentflowLog>[] = useMemo(
    () => [
      {
        id: 'id',
        header: t('admin.agentflowManagement.chatMonitoring.columns.id'),
        field: 'id' as keyof AgentflowLog,
        sortable: true,
        minWidth: '60px',
        cell: (row) => <span className="text-sm font-mono">{row.id}</span>,
      },
      {
        id: 'user_id',
        header: t('admin.agentflowManagement.chatMonitoring.columns.userId'),
        field: 'user_id' as keyof AgentflowLog,
        sortable: true,
        minWidth: '80px',
        cell: (row) => (
          <span className="text-sm">{row.user_id ?? '-'}</span>
        ),
      },
      {
        id: 'workflow_name',
        header: t('admin.agentflowManagement.chatMonitoring.columns.workflowName'),
        field: 'workflow_name' as keyof AgentflowLog,
        sortable: true,
        minWidth: '140px',
        cell: (row) => (
          <span className="text-sm font-medium">{truncate(row.workflow_name, 30)}</span>
        ),
      },
      {
        id: 'workflow_id',
        header: t('admin.agentflowManagement.chatMonitoring.columns.workflowId'),
        field: 'workflow_id' as keyof AgentflowLog,
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
        header: t('admin.agentflowManagement.chatMonitoring.columns.interactionId'),
        field: 'interaction_id' as keyof AgentflowLog,
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
        header: t('admin.agentflowManagement.chatMonitoring.columns.inputData'),
        minWidth: '180px',
        cell: (row) =>
          renderTruncatedCell(
            row.input_data,
            t('admin.agentflowManagement.chatMonitoring.columns.inputData'),
          ),
      },
      {
        id: 'output_data',
        header: t('admin.agentflowManagement.chatMonitoring.columns.outputData'),
        minWidth: '180px',
        cell: (row) =>
          renderTruncatedCell(
            row.output_data,
            t('admin.agentflowManagement.chatMonitoring.columns.outputData'),
          ),
      },
      {
        id: 'llm_eval_score',
        header: t('admin.agentflowManagement.chatMonitoring.columns.llmEvalScore'),
        field: 'llm_eval_score' as keyof AgentflowLog,
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
        header: t('admin.agentflowManagement.chatMonitoring.columns.userScore'),
        field: 'user_score' as keyof AgentflowLog,
        sortable: true,
        minWidth: '80px',
        cell: (row) => <span className="text-sm">{row.user_score}</span>,
      },
      {
        id: 'mode',
        header: t('admin.agentflowManagement.chatMonitoring.columns.mode'),
        minWidth: '100px',
        sortable: true,
        field: 'test_mode' as keyof AgentflowLog,
        cell: (row) => renderMode(row),
      },
      {
        id: 'created_at',
        header: t('admin.agentflowManagement.chatMonitoring.columns.createdAt'),
        field: 'created_at' as keyof AgentflowLog,
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
        title={t('admin.agentflowManagement.chatMonitoring.title')}
        description={t('admin.agentflowManagement.chatMonitoring.subtitle')}
      >
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {t('admin.agentflowManagement.chatMonitoring.errorOccurred')}
          </p>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            {t('admin.agentflowManagement.chatMonitoring.retry')}
          </Button>
        </div>
      </ContentArea>
    );
  }

  // ── Pagination info ──
  const paginationInfo = activeUserId != null
    ? `${t('admin.agentflowManagement.chatMonitoring.userId')}: ${activeUserId} · ${t('admin.agentflowManagement.chatMonitoring.totalLogsLoaded', { count: filteredLogs.length })}`
    : t('admin.agentflowManagement.chatMonitoring.totalLogsLoaded', { count: filteredLogs.length });

  return (
    <ContentArea
      title={t('admin.agentflowManagement.chatMonitoring.title')}
      description={t('admin.agentflowManagement.chatMonitoring.subtitle')}
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
            {t('admin.agentflowManagement.chatMonitoring.refresh')}
          </Button>
        </div>
      }
      toolbar={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="h-8 w-36 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={t('admin.agentflowManagement.chatMonitoring.userIdPlaceholder')}
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
              {t('admin.agentflowManagement.chatMonitoring.search')}
            </Button>
            {activeUserId != null && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<FiX className="h-3.5 w-3.5" />}
                onClick={handleUserReset}
              >
                {t('admin.agentflowManagement.chatMonitoring.reset')}
              </Button>
            )}
            <span className="text-xs text-muted-foreground ml-2">{paginationInfo}</span>
          </div>
          <SearchInput
            value={textFilter}
            onChange={setTextFilter}
            placeholder={t('admin.agentflowManagement.chatMonitoring.filterPlaceholder')}
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
            {t('admin.agentflowManagement.chatMonitoring.prev')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('admin.agentflowManagement.chatMonitoring.page', { page })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore || loading}
            onClick={handleNext}
          >
            {t('admin.agentflowManagement.chatMonitoring.next')}
          </Button>
        </div>
      }
    >
      <DataTable<AgentflowLog>
        data={filteredLogs}
        columns={columns}
        rowKey={(row) => row.id}
        loading={loading && logs.length === 0}
        loadingMessage={t('admin.agentflowManagement.chatMonitoring.loading')}
        emptyMessage={
          textFilter
            ? t('admin.agentflowManagement.chatMonitoring.noSearchResults')
            : t('admin.agentflowManagement.chatMonitoring.noLogs')
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
  adminSection: 'admin-agentflow',
  sidebarItems: [
    { id: 'admin-chat-monitoring', titleKey: 'admin.sidebar.workflow.chatMonitoring.title', descriptionKey: 'admin.sidebar.workflow.chatMonitoring.description' },
  ],
  routes: {
    'admin-chat-monitoring': AdminChatMonitoringPage,
  },
};

export default feature;
