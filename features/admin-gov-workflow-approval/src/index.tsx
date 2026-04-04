'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea, Button, SearchInput, StatusBadge, Modal, StatCard } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import {
  getApprovalRequests,
  getWorkflowApprovalDetail,
  reviewGovernanceWorkflow,
  type ApprovalRequest,
  type WorkflowDetail,
  type NodeSummary,
} from '@xgen/api-client';

/* ------------------------------------------------------------------ */
/*  Types & helpers                                                    */
/* ------------------------------------------------------------------ */
type GovernanceStatus = 'pending' | 'approved' | 'rejected';
type SortField = 'workflowName' | 'ownerName' | 'updatedAt' | 'governanceStatus';
type SortDir = 'asc' | 'desc';

const STATUS_CONFIG: Record<GovernanceStatus, { badgeStatus: 'warning' | 'success' | 'error' }> = {
  pending: { badgeStatus: 'warning' },
  approved: { badgeStatus: 'success' },
  rejected: { badgeStatus: 'error' },
};

function deriveGovernanceStatus(r: ApprovalRequest): GovernanceStatus {
  if (r.is_governance_accepted) return 'approved';
  if (r.governance_reviewed_by && !r.is_governance_accepted) return 'rejected';
  return 'pending';
}

function deriveDetailStatus(d: WorkflowDetail): GovernanceStatus {
  if (d.is_governance_accepted) return 'approved';
  if (d.governance_reviewed_by && !d.is_governance_accepted) return 'rejected';
  return 'pending';
}

function fmtDate(s: string | undefined): string {
  if (!s) return '-';
  try {
    return new Date(s).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return s;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
const AdminGovWorkflowApprovalPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();

  const [records, setRecords] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | GovernanceStatus>('all');
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<WorkflowDetail | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeSummary | null>(null);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<ApprovalRequest | null>(null);
  const [reviewAccept, setReviewAccept] = useState(true);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  /* ── Data loading ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getApprovalRequests();
      setRecords(data ?? []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Summary stats ── */
  const summary = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    records.forEach((r: ApprovalRequest) => {
      const s = deriveGovernanceStatus(r);
      if (s === 'pending') pending++;
      else if (s === 'approved') approved++;
      else rejected++;
    });
    return { total: records.length, pending, approved, rejected };
  }, [records]);

  /* ── Filtered & sorted list ── */
  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r: ApprovalRequest) =>
        r.workflow_name.toLowerCase().includes(q) ||
        r.requester.toLowerCase().includes(q) ||
        (r.requester_department ?? '').toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter((r: ApprovalRequest) => deriveGovernanceStatus(r) === statusFilter);
    }
    list.sort((a: ApprovalRequest, b: ApprovalRequest) => {
      let cmp = 0;
      if (sortField === 'workflowName') cmp = a.workflow_name.localeCompare(b.workflow_name);
      else if (sortField === 'ownerName') cmp = a.requester.localeCompare(b.requester);
      else if (sortField === 'updatedAt') cmp = (a.requested_at ?? '').localeCompare(b.requested_at ?? '');
      else if (sortField === 'governanceStatus') {
        const order: Record<GovernanceStatus, number> = { pending: 0, rejected: 1, approved: 2 };
        cmp = order[deriveGovernanceStatus(a)] - order[deriveGovernanceStatus(b)];
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [records, search, statusFilter, sortField, sortDir]);

  /* ── Sort handler ── */
  const handleSort = useCallback((field: SortField) => {
    setSortField((prev: SortField) => {
      if (prev === field) {
        setSortDir((d: SortDir) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return field;
    });
  }, []);

  /* ── Detail modal ── */
  const openDetail = useCallback(async (wf: ApprovalRequest) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setSelectedNode(null);
    try {
      const res = await getWorkflowApprovalDetail(wf.workflow_id);
      setDetail(res);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setSelectedNode(null);
  }, []);

  /* ── Review modal ── */
  const openReview = useCallback((wf: ApprovalRequest, accept: boolean) => {
    setReviewTarget(wf);
    setReviewAccept(accept);
    setReviewComment('');
    setReviewOpen(true);
  }, []);

  const submitReview = useCallback(async () => {
    if (!reviewTarget) return;
    setReviewSubmitting(true);
    try {
      await reviewGovernanceWorkflow(reviewTarget.workflow_id, reviewAccept, reviewComment);
      setReviewOpen(false);
      setDetailOpen(false);
      await loadData();
    } catch {
      // error handled silently
    } finally {
      setReviewSubmitting(false);
    }
  }, [reviewTarget, reviewAccept, reviewComment, loadData]);

  /* ── Sort icon helper ── */
  const renderSortIcon = useCallback((field: SortField) => {
    if (sortField !== field) return null;
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }, [sortField, sortDir]);

  return (
    <ContentArea
      title={t('admin.governance.workflowApproval.title')}
      description={t('admin.governance.workflowApproval.description')}
    >
      {/* Summary cards — clickable as filters */}
        <div className="grid grid-cols-4 gap-4">
          {([
            { key: 'all' as const, variant: 'info' as const, label: t('admin.governance.common.allStatus'), value: summary.total },
            { key: 'pending' as const, variant: 'warning' as const, label: t('admin.governance.workflowApproval.pending'), value: summary.pending },
            { key: 'approved' as const, variant: 'success' as const, label: t('admin.governance.workflowApproval.approved'), value: summary.approved },
            { key: 'rejected' as const, variant: 'error' as const, label: t('admin.governance.workflowApproval.rejected'), value: summary.rejected },
          ] as const).map((c) => (
            <StatCard
              key={c.key}
              label={c.label}
              value={c.value}
              variant={c.variant}
              selected={statusFilter === c.key}
              onClick={() => setStatusFilter(c.key)}
              loading={loading}
            />
          ))}
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-3">
          <div className="w-72">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('admin.governance.workflowApproval.searchPlaceholder')}
            />
          </div>
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
                <tr className="bg-muted/30 text-left">
                  <th
                    className="px-4 py-3 font-semibold text-xs text-muted-foreground tracking-wide cursor-pointer select-none"
                    onClick={() => handleSort('workflowName')}
                  >
                    {t('admin.governance.common.workflow')} {renderSortIcon('workflowName')}
                  </th>
                  <th
                    className="px-4 py-3 font-semibold text-xs text-muted-foreground tracking-wide cursor-pointer select-none"
                    onClick={() => handleSort('ownerName')}
                  >
                    {t('admin.governance.common.creator')} {renderSortIcon('ownerName')}
                  </th>
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground tracking-wide">
                    {t('admin.governance.common.department')}
                  </th>
                  <th
                    className="px-4 py-3 font-semibold text-xs text-muted-foreground tracking-wide cursor-pointer select-none"
                    onClick={() => handleSort('governanceStatus')}
                  >
                    {t('admin.governance.workflowApproval.governanceStatus')} {renderSortIcon('governanceStatus')}
                  </th>
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground tracking-wide">
                    {t('admin.governance.workflowApproval.reviewer')}
                  </th>
                  <th
                    className="px-4 py-3 font-semibold text-xs text-muted-foreground tracking-wide cursor-pointer select-none"
                    onClick={() => handleSort('updatedAt')}
                  >
                    {t('admin.governance.common.lastModified')} {renderSortIcon('updatedAt')}
                  </th>
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground tracking-wide w-32">
                    {t('admin.governance.common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      {t('admin.governance.common.noData')}
                    </td>
                  </tr>
                ) : (
                  filtered.map((r: ApprovalRequest) => {
                    const govStatus = deriveGovernanceStatus(r);
                    const cfg = STATUS_CONFIG[govStatus];
                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-muted/40 transition-colors cursor-pointer"
                        onClick={() => openDetail(r)}
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-foreground">{r.workflow_name}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{r.requester || '-'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.requester_department || '-'}</td>
                        <td className="px-4 py-3">
                          <StatusBadge variant={cfg.badgeStatus}>
                            {t(`admin.governance.workflowApproval.${govStatus}`)}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{r.governance_reviewed_by || '-'}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{fmtDate(r.requested_at)}</td>
                        <td className="px-4 py-3">
                          <div
                            className="flex gap-1"
                            role="toolbar"
                            tabIndex={-1}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}
                          >
                            <Button size="sm" variant="outline" onClick={() => openDetail(r)}>
                              {t('admin.governance.workflowApproval.viewDetail')}
                            </Button>
                            {govStatus === 'pending' && (
                              <>
                                <Button size="sm" onClick={() => openReview(r, true)}>
                                  {t('admin.governance.workflowApproval.approve')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-500"
                                  onClick={() => openReview(r, false)}
                                >
                                  {t('admin.governance.workflowApproval.reject')}
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail modal */}
        {detailOpen && (
          <Modal
            isOpen
            onClose={closeDetail}
            title={t('admin.governance.workflowApproval.detailTitle')}
          >
            <div className="flex flex-col gap-4 p-4" style={{ maxWidth: 920 }}>
              {detailLoading ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  {t('admin.governance.workflowApproval.loading')}
                </div>
              ) : detail ? (
                <>
                  {/* Basic info grid */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    {([
                      { label: t('admin.governance.common.workflow'), value: detail.workflow_name },
                      {
                        label: t('admin.governance.common.creator'),
                        value: `${detail.owner_name}${detail.owner_department ? ` (${detail.owner_department})` : ''}`,
                      },
                      { label: t('admin.governance.workflowApproval.version'), value: `v${detail.current_version ?? 1}` },
                      {
                        label: t('admin.governance.workflowApproval.nodeEdgeInfo'),
                        value: `${detail.node_count ?? 0} nodes / ${detail.edge_count ?? 0} edges`,
                      },
                    ] as const).map((item) => (
                      <div key={item.label} className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                        <span className="text-sm text-foreground">{item.value}</span>
                      </div>
                    ))}

                    {/* Governance status badge */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">
                        {t('admin.governance.workflowApproval.governanceStatus')}
                      </span>
                      <span className="text-sm">
                        {(() => {
                          const s = deriveDetailStatus(detail);
                          return (
                            <StatusBadge variant={STATUS_CONFIG[s].badgeStatus}>
                              {t(`admin.governance.workflowApproval.${s}`)}
                            </StatusBadge>
                          );
                        })()}
                      </span>
                    </div>

                    {detail.governance_reviewed_by && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">
                          {t('admin.governance.workflowApproval.reviewer')}
                        </span>
                        <span className="text-sm text-foreground">{detail.governance_reviewed_by}</span>
                      </div>
                    )}
                  </div>

                  {/* Review comment */}
                  {detail.governance_review_comment && (
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-foreground mb-1">
                        {t('admin.governance.workflowApproval.reviewComment')}
                      </h4>
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border">
                        {detail.governance_review_comment}
                      </p>
                    </div>
                  )}

                  {/* Canvas placeholder */}
                  {/* TODO: WorkflowStoreMiniCanvas is not yet available in monorepo. Add canvas view here when ported. */}

                  {/* Selected node detail panel */}
                  {selectedNode && (
                    <div className="mt-2 bg-muted/30 rounded-xl p-4 border border-border">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-medium text-foreground">
                          {t('admin.governance.workflowApproval.nodeDetail')} — {selectedNode.nodeName}
                        </h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedNode(null)}
                        >
                          ×
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Function ID</span>
                          <span className="text-sm font-mono text-foreground">{selectedNode.functionId}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">
                            {t('admin.governance.workflowApproval.category')}
                          </span>
                          <span className="text-sm text-foreground">{selectedNode.category || '-'}</span>
                        </div>
                      </div>

                      {/* Parameters */}
                      {Object.keys(selectedNode.parameters ?? {}).length > 0 && (
                        <div className="mt-3">
                          <span className="text-xs text-muted-foreground block mb-2">
                            {t('admin.governance.workflowApproval.parameters')} ({Object.keys(selectedNode.parameters).length})
                          </span>
                          <div className="flex flex-col gap-1.5">
                            {Object.entries(selectedNode.parameters).map(([key, val]: [string, unknown]) => (
                              <div
                                key={key}
                                className="px-3 py-2 bg-card rounded-md border border-border text-sm"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-foreground">{key}</span>
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground break-all">
                                  {typeof val === 'string' ? val : JSON.stringify(val)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Inputs */}
                      {(selectedNode.inputs?.length ?? 0) > 0 && (
                        <div className="mt-3">
                          <span className="text-xs text-muted-foreground block mb-2">
                            {t('admin.governance.workflowApproval.inputs')} ({selectedNode.inputs.length})
                          </span>
                          <div className="flex flex-col gap-1.5">
                            {selectedNode.inputs.map((inp: string, idx: number) => (
                              <div
                                key={idx}
                                className="px-3 py-2 bg-card rounded-md border border-blue-100 text-sm text-foreground"
                              >
                                {inp}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Node summary table */}
                  {(detail.node_summaries?.length ?? 0) > 0 && (
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-foreground mb-2">
                        {t('admin.governance.workflowApproval.nodeSummary')}
                      </h4>
                      <div className="rounded-lg border border-border overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-muted/30 text-left">
                              <th className="px-3 py-2 font-semibold text-xs text-muted-foreground tracking-wide">
                                {t('admin.governance.workflowApproval.nodeName')}
                              </th>
                              <th className="px-3 py-2 font-semibold text-xs text-muted-foreground tracking-wide">Function ID</th>
                              <th className="px-3 py-2 font-semibold text-xs text-muted-foreground tracking-wide">
                                {t('admin.governance.workflowApproval.category')}
                              </th>
                              <th className="px-3 py-2 font-semibold text-xs text-muted-foreground tracking-wide">
                                {t('admin.governance.workflowApproval.paramCount')}
                              </th>
                              <th className="px-3 py-2 font-semibold text-xs text-muted-foreground tracking-wide">
                                {t('admin.governance.workflowApproval.ioInfo')}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {detail.node_summaries!.map((n: NodeSummary) => (
                              <tr
                                key={n.nodeId}
                                className={`cursor-pointer transition-colors ${
                                  selectedNode?.nodeId === n.nodeId
                                    ? 'bg-primary/5'
                                    : 'hover:bg-muted/40'
                                }`}
                                onClick={() => setSelectedNode(n)}
                              >
                                <td className="px-3 py-2 font-medium text-foreground">{n.nodeName}</td>
                                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{n.functionId}</td>
                                <td className="px-3 py-2 text-muted-foreground">{n.category || '-'}</td>
                                <td className="px-3 py-2 text-muted-foreground">
                                  {Object.keys(n.parameters ?? {}).length}
                                </td>
                                <td className="px-3 py-2 text-muted-foreground">
                                  {n.inputs?.length ?? 0} in / {n.outputs?.length ?? 0} out
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Footer actions */}
                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
                    <Button variant="outline" onClick={closeDetail}>
                      {t('admin.governance.common.cancel')}
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-500"
                      onClick={() => {
                        const rec = records.find((r: ApprovalRequest) => r.workflow_id === detail.workflow_id);
                        if (rec) openReview(rec, false);
                      }}
                    >
                      {t('admin.governance.workflowApproval.reject')}
                    </Button>
                    {!detail.is_governance_accepted && (
                      <Button
                        onClick={() => {
                          const rec = records.find((r: ApprovalRequest) => r.workflow_id === detail.workflow_id);
                          if (rec) openReview(rec, true);
                        }}
                      >
                        {t('admin.governance.workflowApproval.approve')}
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  {t('admin.governance.workflowApproval.loadFailed')}
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Review (approve/reject) modal */}
        {reviewOpen && reviewTarget && (
          <Modal
            isOpen
            onClose={() => setReviewOpen(false)}
            title={
              reviewAccept
                ? t('admin.governance.workflowApproval.approveTitle')
                : t('admin.governance.workflowApproval.rejectTitle')
            }
          >
            <div className="flex flex-col gap-4 p-4" style={{ maxWidth: 480 }}>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">{t('admin.governance.common.workflow')}</span>
                  <span className="text-sm text-foreground">{reviewTarget.workflow_name}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">{t('admin.governance.common.creator')}</span>
                  <span className="text-sm text-foreground">{reviewTarget.requester}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-2">
                  {t('admin.governance.workflowApproval.commentLabel')}
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReviewComment(e.target.value)}
                  placeholder={
                    reviewAccept
                      ? t('admin.governance.workflowApproval.approveCommentPlaceholder')
                      : t('admin.governance.workflowApproval.rejectCommentPlaceholder')
                  }
                  rows={4}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" onClick={() => setReviewOpen(false)}>
                  {t('admin.governance.common.cancel')}
                </Button>
                <Button
                  className={reviewAccept ? '' : 'bg-red-600 hover:bg-red-700'}
                  disabled={reviewSubmitting}
                  onClick={submitReview}
                >
                  {reviewSubmitting
                    ? t('admin.governance.workflowApproval.submitting')
                    : reviewAccept
                      ? t('admin.governance.workflowApproval.approve')
                      : t('admin.governance.workflowApproval.reject')
                  }
                </Button>
              </div>
            </div>
          </Modal>
      )}
    </ContentArea>
  );
};

/* ------------------------------------------------------------------ */
/*  Feature module export                                              */
/* ------------------------------------------------------------------ */
const feature: AdminFeatureModule = {
  id: 'admin-gov-workflow-approval',
  name: 'AdminGovWorkflowApprovalPage',
  adminSection: 'admin-governance',
  routes: {
    'admin-gov-workflow-approval': AdminGovWorkflowApprovalPage,
  },
};

export default feature;
