'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea, Button, SearchInput, Modal, StatCard } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import {
  getOperationLogs,
  getOperationStats,
  type OperationLog,
  type OperationStats,
  type ActivityType,
  type OperationResult,
} from '@xgen/api-client';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ACTIVITY_TYPE_CONFIG: Record<ActivityType, { label: string; color: string; bg: string }> = {
  workflow_change:   { label: '워크플로우 변경',     color: '#305eeb', bg: 'rgba(48,94,235,0.08)' },
  model_change:      { label: '모델 변경',          color: '#ea580c', bg: 'rgba(234,88,12,0.08)' },
  policy_change:     { label: '정책 변경',          color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
  deploy_approval:   { label: '배포 승인',          color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
  deploy_rejection:  { label: '배포 거부',          color: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
  deploy_request:    { label: '배포 요청',          color: '#0284c7', bg: 'rgba(2,132,199,0.08)' },
  permission_change: { label: '권한 변경',          color: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
  monitoring_record: { label: '모니터링 기록',       color: '#0284c7', bg: 'rgba(2,132,199,0.08)' },
  data_change:       { label: '데이터 변경',         color: '#ca8a04', bg: 'rgba(202,138,4,0.08)' },
};

const RESULT_CONFIG: Record<OperationResult, { label: string; color: string; bg: string }> = {
  success: { label: '성공', color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
  failure: { label: '실패', color: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
  pending: { label: '보류', color: '#ca8a04', bg: 'rgba(202,138,4,0.08)' },
};

const DETAIL_KEY_LABELS: Record<string, string> = {
  action: '작업',
  action_type: '작업 유형',
  actionType: '작업 유형',
  actor: '수행자',
  actor_name: '수행자',
  actorName: '수행자',
  approver: '처리자',
  approver_name: '처리자',
  approverName: '처리자',
  reason: '사유',
  comment: '코멘트',
  message: '메시지',
  policy_name: '정책',
  policyName: '정책',
  model_name: '모델',
  modelName: '모델',
  model_version: '모델 버전',
  modelVersion: '모델 버전',
  deployment_id: '배포 ID',
  deploymentId: '배포 ID',
  deploy_target: '배포 대상',
  deployTarget: '배포 대상',
  changed_fields: '변경 필드',
  changedFields: '변경 필드',
  before: '변경 전',
  after: '변경 후',
  status: '상태',
  approval_status: '승인 상태',
  approvalStatus: '승인 상태',
};

const INTERNAL_DETAIL_KEYS = new Set([
  'workflow_id', 'workflowId', 'target_id', 'targetId', 'id', 'trace_id', 'traceId',
]);

const PAGE_SIZE = 20;

/* ------------------------------------------------------------------ */
/*  Utilities                                                          */
/* ------------------------------------------------------------------ */

const normalizeDetailValue = (value: unknown): string => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'string') return value.trim() || '-';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    const compact = value.map((item: unknown) => normalizeDetailValue(item)).filter((v: string) => v !== '-');
    return compact.length > 0 ? compact.join(', ') : '-';
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

interface DetailEntry {
  key: string;
  label: string;
  value: string;
}

const buildDetailEntries = (details: Record<string, unknown> | null): DetailEntry[] => {
  if (!details) return [];
  return Object.entries(details)
    .filter(([key, value]) => !INTERNAL_DETAIL_KEYS.has(key) && value !== null && value !== undefined)
    .map(([key, value]) => ({
      key,
      label: DETAIL_KEY_LABELS[key] || key,
      value: normalizeDetailValue(value),
    }))
    .filter((entry: DetailEntry) => entry.value !== '-');
};

const getActivityStyle = (type: string) =>
  ACTIVITY_TYPE_CONFIG[type as ActivityType] || { label: type, color: '#6b7280', bg: 'rgba(107,114,128,0.08)' };

const getActivityLabel = (record: OperationLog, fallbackLabel: string): string => {
  const explicitLabel = record.activityTypeLabel?.trim();
  if (record.activityType === 'deploy_approval') return '배포 승인';
  if (record.activityType === 'deploy_rejection') return '배포 거부';
  if (record.activityType === 'deploy_request') return '배포 요청';
  return explicitLabel || fallbackLabel;
};

const getResultStyle = (result: string) =>
  RESULT_CONFIG[result as OperationResult] || { label: result, color: '#6b7280', bg: 'rgba(107,114,128,0.08)' };

const getRecordDetailPreview = (record: OperationLog): string => {
  const detailText = record.activityDetail?.trim();
  const detailEntries = buildDetailEntries(record.details).slice(0, 2);
  const detailSummary = detailEntries.length > 0
    ? detailEntries.map((entry: DetailEntry) => `${entry.label}: ${entry.value}`).join(' / ')
    : '';
  if (detailText && detailSummary) return `${detailText} / ${detailSummary}`;
  if (detailText) return detailText;
  if (detailSummary) return detailSummary;
  return record.targetName || record.workflowName || '-';
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const AdminGovOperationHistoryPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();

  /* ── State ── */
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [stats, setStats] = useState<OperationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'all'>('all');
  const [resultFilter, setResultFilter] = useState<OperationResult | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState<OperationLog | null>(null);

  /* ── Data loading ── */

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: {
        type?: ActivityType;
        result?: OperationResult;
        search?: string;
        start_date?: string;
        end_date?: string;
        limit?: number;
        offset?: number;
      } = {
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      };
      if (typeFilter !== 'all') params.type = typeFilter;
      if (resultFilter !== 'all') params.result = resultFilter;
      if (search.trim()) params.search = search.trim();
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const statsParams: { start_date?: string; end_date?: string } = {};
      if (startDate) statsParams.start_date = startDate;
      if (endDate) statsParams.end_date = endDate;

      const [logsData, statsData] = await Promise.all([
        getOperationLogs(params),
        getOperationStats(statsParams),
      ]);

      setLogs(logsData);
      setTotalCount(logsData.length < PAGE_SIZE && page === 0 ? logsData.length : (page + 1) * PAGE_SIZE + (logsData.length === PAGE_SIZE ? 1 : 0));
      setStats(statsData);
    } catch {
      setLogs([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, resultFilter, search, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Handlers ── */

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  const handleTypeFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setTypeFilter(e.target.value as ActivityType | 'all');
    setPage(0);
  }, []);

  const handleResultFilterChange = useCallback((result: OperationResult | 'all') => {
    setResultFilter(result);
    setPage(0);
  }, []);

  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
    setPage(0);
  }, []);

  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
    setPage(0);
  }, []);

  const handleRowClick = useCallback((record: OperationLog) => {
    setSelectedRecord(record);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedRecord(null);
  }, []);

  const handlePrevPage = useCallback(() => {
    setPage((p: number) => p - 1);
  }, []);

  const handleNextPage = useCallback(() => {
    setPage((p: number) => p + 1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setTypeFilter('all');
    setResultFilter('all');
    setStartDate('');
    setEndDate('');
    setPage(0);
  }, []);

  /* ── Modal detail data ── */

  const selectedActivityStyle = useMemo(
    () => (selectedRecord ? getActivityStyle(selectedRecord.activityType) : null),
    [selectedRecord],
  );

  const selectedActivityLabel = useMemo(
    () => (selectedRecord && selectedActivityStyle ? getActivityLabel(selectedRecord, selectedActivityStyle.label) : ''),
    [selectedRecord, selectedActivityStyle],
  );

  const selectedDetailEntries = useMemo(
    () => (selectedRecord ? buildDetailEntries(selectedRecord.details) : []),
    [selectedRecord],
  );

  /* ── Derived ── */

  const hasMorePages = logs.length === PAGE_SIZE;

  const statCards = useMemo(() => [
    { label: t('admin.gov.totalOps', '전체 운영'), value: stats?.total ?? 0, variant: 'info' as const },
    { label: t('common.success', '성공'), value: stats?.success ?? 0, variant: 'success' as const },
    { label: t('common.failure', '실패'), value: stats?.failure ?? 0, variant: 'error' as const },
    { label: t('common.pending', '보류'), value: stats?.pending ?? 0, variant: 'warning' as const },
  ], [stats, t]);

  /* ── Render ── */

  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {t('admin.pages.govOperationHistory.title', '운영 이력')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('admin.pages.govOperationHistory.description', 'AI 거버넌스 운영 로그 및 활동 추적')}
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-4 gap-4">
          {statCards.map((s) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              variant={s.variant}
              loading={loading}
            />
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-72">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder={t('admin.gov.searchOps', '활동 내용, 워크플로우, 수행자 검색...')}
            />
          </div>

          <select
            value={typeFilter}
            onChange={handleTypeFilterChange}
            className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">{t('admin.gov.allTypes', '전체 유형')}</option>
            {Object.entries(ACTIVITY_TYPE_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>

          <input
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="text-xs text-muted-foreground">~</span>
          <input
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />

          <button
            onClick={handleClearFilters}
            className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
          >
            {t('admin.gov.clearFilters', '필터 초기화')}
          </button>

          <div className="flex gap-2 ml-auto">
            {(['all', 'success', 'failure', 'pending'] as const).map((r) => (
              <button
                key={r}
                onClick={() => handleResultFilterChange(r)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  resultFilter === r
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                }`}
              >
                {r === 'all' ? t('common.all', '전체') : RESULT_CONFIG[r].label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    {t('admin.governance.common.time', '시간')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    {t('admin.governance.operationHistory.activityType', '활동 유형')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    {t('admin.governance.operationHistory.detail', '상세')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    {t('admin.governance.common.workflow', '워크플로우')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    {t('admin.governance.auditTracking.performer', '수행자')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    {t('admin.governance.operationHistory.result', '결과')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    {t('common.actions', '상세보기')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      {t('common.noResults', '결과가 없습니다')}
                    </td>
                  </tr>
                ) : (
                  logs.map((record: OperationLog) => {
                    const actStyle = getActivityStyle(record.activityType);
                    const resStyle = getResultStyle(record.result);
                    const activityLabel = getActivityLabel(record, actStyle.label);
                    const detailPreview = getRecordDetailPreview(record);
                    return (
                      <tr
                        key={record.id}
                        className="border-b border-border last:border-b-0 hover:bg-muted/20 cursor-pointer transition-colors"
                        onClick={() => handleRowClick(record)}
                      >
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap font-mono">
                          {record.timestamp}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-block px-2 py-0.5 text-xs rounded-md font-medium"
                            style={{ color: actStyle.color, backgroundColor: actStyle.bg }}
                          >
                            {activityLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-foreground max-w-[240px] truncate" title={detailPreview}>
                          {detailPreview}
                        </td>
                        <td className="px-4 py-3 text-xs text-foreground">
                          {record.workflowName || '-'}
                        </td>
                        <td className="px-4 py-3 text-xs text-foreground">
                          {record.performerName || record.creatorName || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-block px-2 py-0.5 text-xs rounded-md font-medium"
                            style={{ color: resStyle.color, backgroundColor: resStyle.bg }}
                          >
                            {record.resultLabel || resStyle.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            className="text-xs text-primary hover:underline"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleRowClick(record);
                            }}
                          >
                            {t('common.viewDetail', '상세')}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {(page > 0 || hasMorePages) && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t('admin.gov.pageInfo', `${page * PAGE_SIZE + 1} - ${page * PAGE_SIZE + logs.length}`)}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={handlePrevPage}>
                {t('common.previous', '이전')}
              </Button>
              <Button variant="outline" size="sm" disabled={!hasMorePages} onClick={handleNextPage}>
                {t('common.next', '다음')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Modal
        isOpen={selectedRecord !== null}
        onClose={handleCloseModal}
        title={t('admin.governance.operationHistory.detailTitle', '운영 이력 상세')}
        size="lg"
      >
        {selectedRecord && (
          <div className="flex flex-col gap-5">
            {/* Basic info grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {t('admin.governance.common.time', '시간')}
                </p>
                <p className="text-sm text-foreground">{selectedRecord.timestamp}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {t('admin.governance.operationHistory.activityType', '활동 유형')}
                </p>
                <span
                  className="inline-block px-2 py-0.5 text-xs rounded-md font-medium"
                  style={{
                    color: selectedActivityStyle?.color || '#6b7280',
                    backgroundColor: selectedActivityStyle?.bg || 'rgba(107,114,128,0.08)',
                  }}
                >
                  {selectedActivityLabel}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {t('admin.governance.operationHistory.target', '대상')}
                </p>
                <p className="text-sm text-foreground">
                  {selectedRecord.targetName || selectedRecord.workflowName || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {t('admin.governance.operationHistory.result', '결과')}
                </p>
                <span
                  className="inline-block px-2 py-0.5 text-xs rounded-md font-medium"
                  style={{
                    color: getResultStyle(selectedRecord.result).color,
                    backgroundColor: getResultStyle(selectedRecord.result).bg,
                  }}
                >
                  {selectedRecord.resultLabel || getResultStyle(selectedRecord.result).label}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {t('admin.governance.auditTracking.performer', '수행자')}
                </p>
                <p className="text-sm text-foreground">
                  {selectedRecord.performerName || selectedRecord.creatorName || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {t('admin.governance.common.department', '부서')}
                </p>
                <p className="text-sm text-foreground">
                  {selectedRecord.performerDepartment || selectedRecord.creatorDepartment || '-'}
                </p>
              </div>
              {selectedRecord.handlerName && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">처리자</p>
                  <p className="text-sm text-foreground">
                    {selectedRecord.handlerName}
                    {selectedRecord.handlerDepartment ? ` (${selectedRecord.handlerDepartment})` : ''}
                  </p>
                </div>
              )}
              {selectedRecord.approvalStatus && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">승인 상태</p>
                  <p className="text-sm text-foreground">
                    {selectedRecord.approvalStatus}
                    {selectedRecord.approverName ? ` - ${selectedRecord.approverName}` : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Activity detail */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {t('admin.governance.operationHistory.detail', '상세')}
              </p>
              <p className="text-sm text-foreground">
                {selectedRecord.activityDetail || '-'}
              </p>
            </div>

            {/* Parsed detail entries */}
            {selectedDetailEntries.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">변경 항목</p>
                <div className="rounded-lg border border-border bg-muted/20 divide-y divide-border">
                  {selectedDetailEntries.map((entry: DetailEntry) => (
                    <div key={entry.key} className="flex justify-between px-3 py-2 text-xs">
                      <span className="text-muted-foreground">{entry.label}</span>
                      <span className="text-foreground font-medium">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw details JSON */}
            {selectedRecord.details && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">원본 상세 로그</p>
                <pre className="rounded-lg border border-border bg-muted/30 p-3 text-xs font-mono whitespace-pre-wrap break-words max-h-[200px] overflow-auto text-foreground">
                  {JSON.stringify(selectedRecord.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </ContentArea>
  );
};

/* ------------------------------------------------------------------ */
/*  Feature Module                                                     */
/* ------------------------------------------------------------------ */

const feature: AdminFeatureModule = {
  id: 'admin-gov-operation-history',
  name: 'AdminGovOperationHistoryPage',
  adminSection: 'admin-governance',
  routes: {
    'admin-gov-operation-history': AdminGovOperationHistoryPage,
  },
};

export default feature;
