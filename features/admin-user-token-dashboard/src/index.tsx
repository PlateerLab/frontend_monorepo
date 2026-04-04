'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import {
  ContentArea,
  DataTable,
  Button,
  SearchInput,
  StatCard,
  useToast,
} from '@xgen/ui';
import type { DataTableColumn } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiRefreshCw } from '@xgen/icons';
import { getUserTokenUsage } from './api/token-api';
import type { UserTokenUsage, TokenUsageResponse } from './types';
import TokenUsageBar from './components/token-usage-bar';
import WorkflowDetailModal from './components/workflow-detail-modal';

const i18nPrefix = 'admin.workflowManagement.userTokenDashboard';

const PAGE_SIZE = 20;

// ─────────────────────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatNumber(n: number): string {
  return n.toLocaleString('ko-KR');
}

// ─────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────

const AdminUserTokenDashboardPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // ── Data state ──
  const [data, setData] = useState<TokenUsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Pagination ──
  const [page, setPage] = useState(1);

  // ── Search ──
  const [search, setSearch] = useState('');

  // ── Date range ──
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');

  // ── Workflow detail modal ──
  const [modalUser, setModalUser] = useState<UserTokenUsage | null>(null);

  // ── Fetch data ──
  const fetchData = useCallback(
    async (p: number, sDate?: string, eDate?: string) => {
      setLoading(true);
      setError(null);
      try {
        const params: {
          page: number;
          page_size: number;
          start_date?: string;
          end_date?: string;
        } = { page: p, page_size: PAGE_SIZE };
        if (sDate) params.start_date = sDate;
        if (eDate) params.end_date = eDate;

        const res = await getUserTokenUsage(params);
        setData(res);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t(`${i18nPrefix}.loadError`);
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [t, toast],
  );

  useEffect(() => {
    fetchData(page, appliedStartDate, appliedEndDate);
  }, [fetchData, page, appliedStartDate, appliedEndDate]);

  // ── Apply / Reset date filters ──
  const handleApplyDateFilter = () => {
    setPage(1);
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
  };

  const handleResetDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setAppliedStartDate('');
    setAppliedEndDate('');
    setPage(1);
  };

  // ── Refresh ──
  const handleRefresh = () => {
    fetchData(page, appliedStartDate, appliedEndDate);
  };

  // ── Client-side filtering ──
  const filteredUsers = useMemo(() => {
    if (!data?.users) return [];
    if (!search.trim()) return data.users;

    const q = search.trim().toLowerCase();
    return data.users.filter((u) => {
      if (u.username?.toLowerCase().includes(q)) return true;
      if (String(u.user_id).includes(q)) return true;
      if (u.most_used_workflow?.toLowerCase().includes(q)) return true;
      if (u.workflow_usage) {
        return Object.keys(u.workflow_usage).some((name) =>
          name.toLowerCase().includes(q),
        );
      }
      return false;
    });
  }, [data, search]);

  // ── Summary stats ──
  const stats = useMemo(() => {
    const users = filteredUsers;
    const totalTokens = users.reduce((s, u) => s + u.total_tokens, 0);
    const totalInteractions = users.reduce(
      (s, u) => s + u.total_interactions,
      0,
    );
    const avgTokens =
      totalInteractions > 0 ? Math.round(totalTokens / totalInteractions) : 0;
    return {
      totalTokens,
      totalInteractions,
      avgTokens,
      activeUsers: users.length,
    };
  }, [filteredUsers]);

  // ── Max tokens for bar chart scaling ──
  const maxTokens = useMemo(() => {
    if (filteredUsers.length === 0) return 0;
    return Math.max(...filteredUsers.map((u) => u.total_tokens));
  }, [filteredUsers]);

  // ── Pagination info ──
  const pagination = data?.pagination;
  const totalPages = pagination?.total_pages ?? 1;

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [page, totalPages]);

  // ── Table columns ──
  const columns: DataTableColumn<UserTokenUsage>[] = useMemo(
    () => [
      {
        id: 'user',
        header: t(`${i18nPrefix}.columns.user`),
        field: 'username' as keyof UserTokenUsage,
        sortable: true,
        minWidth: '140px',
        cell: (row: UserTokenUsage) => (
          <div>
            <span className="font-medium text-foreground">
              {row.username ?? `User #${row.user_id}`}
            </span>
            <span className="ml-2 text-xs text-muted-foreground">
              #{row.user_id}
            </span>
          </div>
        ),
      },
      {
        id: 'total_interactions',
        header: t(`${i18nPrefix}.columns.totalInteractions`),
        field: 'total_interactions' as keyof UserTokenUsage,
        sortable: true,
        minWidth: '100px',
        cell: (row: UserTokenUsage) => (
          <span className="text-foreground">
            {formatNumber(row.total_interactions)}
          </span>
        ),
      },
      {
        id: 'total_tokens',
        header: t(`${i18nPrefix}.columns.totalTokens`),
        field: 'total_tokens' as keyof UserTokenUsage,
        sortable: true,
        minWidth: '120px',
        cell: (row: UserTokenUsage) => (
          <span className="font-medium text-foreground">
            {formatNumber(row.total_tokens)}
          </span>
        ),
      },
      {
        id: 'total_input_tokens',
        header: t(`${i18nPrefix}.columns.inputTokens`),
        field: 'total_input_tokens' as keyof UserTokenUsage,
        sortable: true,
        minWidth: '110px',
        cell: (row: UserTokenUsage) => (
          <span className="text-blue-500">
            {formatNumber(row.total_input_tokens)}
          </span>
        ),
      },
      {
        id: 'total_output_tokens',
        header: t(`${i18nPrefix}.columns.outputTokens`),
        field: 'total_output_tokens' as keyof UserTokenUsage,
        sortable: true,
        minWidth: '110px',
        cell: (row: UserTokenUsage) => (
          <span className="text-green-500">
            {formatNumber(row.total_output_tokens)}
          </span>
        ),
      },
      {
        id: 'token_distribution',
        header: t(`${i18nPrefix}.columns.tokenDistribution`),
        minWidth: '180px',
        sortable: false,
        cell: (row: UserTokenUsage) => (
          <TokenUsageBar
            inputTokens={row.total_input_tokens}
            outputTokens={row.total_output_tokens}
            maxTokens={maxTokens}
          />
        ),
      },
      {
        id: 'most_used_workflow',
        header: t(`${i18nPrefix}.columns.mainWorkflow`),
        field: 'most_used_workflow' as keyof UserTokenUsage,
        sortable: true,
        minWidth: '160px',
        cell: (row: UserTokenUsage) => (
          <div className="flex items-center gap-1">
            <span className="truncate text-foreground">
              {row.most_used_workflow ?? '-'}
            </span>
            {row.workflow_usage &&
              Object.keys(row.workflow_usage).length > 0 && (
                <button
                  type="button"
                  className="shrink-0 rounded px-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title={t(`${i18nPrefix}.viewWorkflowDetails`)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalUser(row);
                  }}
                >
                  ...
                </button>
              )}
          </div>
        ),
      },
      {
        id: 'last_interaction',
        header: t(`${i18nPrefix}.columns.lastActivity`),
        field: 'last_interaction' as keyof UserTokenUsage,
        sortable: true,
        minWidth: '160px',
        cell: (row: UserTokenUsage) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.last_interaction)}
          </span>
        ),
      },
    ],
    [t, maxTokens],
  );

  // ── Error state ──
  if (error && !data) {
    return (
      <ContentArea
        title={t(`${i18nPrefix}.title`)}
        description={t(`${i18nPrefix}.subtitle`)}
      >
        <div className="flex flex-col items-center justify-center gap-4 p-16">
          <p className="text-sm text-destructive">
            {t(`${i18nPrefix}.errorOccurred`)}: {error}
          </p>
          <Button variant="outline" onClick={handleRefresh}>
            {t(`${i18nPrefix}.retry`)}
          </Button>
        </div>
      </ContentArea>
    );
  }

  return (
    <ContentArea
      title={t(`${i18nPrefix}.title`)}
      description={t(`${i18nPrefix}.subtitle`)}
      headerActions={
        <Button
          variant="outline"
          size="sm"
          leftIcon={<FiRefreshCw className="h-4 w-4" />}
          onClick={handleRefresh}
          loading={loading}
        >
          {t(`${i18nPrefix}.refresh`)}
        </Button>
      }
    >
      {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t(`${i18nPrefix}.stats.totalTokenUsage`)}
            value={formatNumber(stats.totalTokens)}
            variant="info"
          />
          <StatCard
            label={t(`${i18nPrefix}.stats.totalInteractions`)}
            value={formatNumber(stats.totalInteractions)}
            variant="success"
          />
          <StatCard
            label={t(`${i18nPrefix}.stats.avgTokensPerInteraction`)}
            value={formatNumber(stats.avgTokens)}
            variant="warning"
          />
          <StatCard
            label={t(`${i18nPrefix}.stats.activeUsers`)}
            value={formatNumber(stats.activeUsers)}
            variant="neutral"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-full max-w-sm">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t(`${i18nPrefix}.searchPlaceholder`)}
              debounceDelay={300}
            />
          </div>

          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">
                {t(`${i18nPrefix}.startDate`)}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">
                {t(`${i18nPrefix}.endDate`)}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button variant="primary" size="sm" onClick={handleApplyDateFilter}>
              {t(`${i18nPrefix}.apply`)}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleResetDateFilter}>
              {t(`${i18nPrefix}.reset`)}
            </Button>
          </div>
        </div>

        {/* Search result count */}
        {search.trim() && (
          <p className="text-sm text-muted-foreground">
            {t(`${i18nPrefix}.searchCount`, {
              count: filteredUsers.length,
            })}
          </p>
        )}

        {/* Data Table */}
        <DataTable<UserTokenUsage>
          data={filteredUsers}
          columns={columns}
          rowKey={(row) => row.user_id}
          loading={loading}
          loadingMessage={t(`${i18nPrefix}.loading`)}
          emptyMessage={
            search.trim()
              ? t(`${i18nPrefix}.noSearchResults`)
              : t(`${i18nPrefix}.noTokenData`)
          }
        />

        {/* Pagination */}
        {pagination && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t(`${i18nPrefix}.pageInfo`, {
                page: pagination.page,
                totalPages: pagination.total_pages,
                totalUsers: pagination.total_users,
              })}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t(`${i18nPrefix}.prev`)}
              </Button>
              {pageNumbers.map((n) => (
                <Button
                  key={n}
                  variant={n === page ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setPage(n)}
                >
                  {n}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                {t(`${i18nPrefix}.next`)}
              </Button>
            </div>
          </div>
        )}
      {/* Workflow Detail Modal */}
      {modalUser && modalUser.workflow_usage && (
        <WorkflowDetailModal
          isOpen={!!modalUser}
          onClose={() => setModalUser(null)}
          username={modalUser.username ?? `User #${modalUser.user_id}`}
          workflowUsage={modalUser.workflow_usage}
        />
      )}
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Module Export
// ─────────────────────────────────────────────────────────────

const feature: AdminFeatureModule = {
  id: 'admin-user-token-dashboard',
  name: 'AdminUserTokenDashboardPage',
  adminSection: 'admin-workflow',
  routes: {
    'admin-user-token-dashboard': AdminUserTokenDashboardPage,
  },
};

export default feature;
