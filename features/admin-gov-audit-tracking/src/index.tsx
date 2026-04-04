'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea, Button, SearchInput, StatusBadge, Modal, StatCard } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import {
  getTrackedWorkflows,
  getAuditLogs,
  getAuditTrackingStats,
  getWorkflowAuditTimeline,
} from '@xgen/api-client';
import type {
  TrackedWorkflow,
  AuditLogEntry,
  AuditStats,
  TimelineEntry,
  AuditAction,
} from '@xgen/api-client';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const AUDIT_ACTION_COLORS: Record<AuditAction, { color: string; bg: string }> = {
  governance_full_approval: { color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
  governance_review:        { color: '#305eeb', bg: 'rgba(48,94,235,0.08)' },
  workflow_modified:        { color: '#ea580c', bg: 'rgba(234,88,12,0.08)' },
  approval_revoked:         { color: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
  deploy_status_change:     { color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
  system_approval_change:   { color: '#0284c7', bg: 'rgba(2,132,199,0.08)' },
};

const GOVERNANCE_ACTIONS: AuditAction[] = [
  'governance_full_approval',
  'governance_review',
  'approval_revoked',
  'system_approval_change',
];

type DetailTabId = 'usage' | 'governance' | 'changes';

const PAGE_SIZE = 20;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const formatTimestamp = (ts: string): string => {
  if (!ts) return '-';
  return ts.replace('T', ' ').substring(0, 19);
};

const getActionStyle = (action: string): { color: string; backgroundColor: string } => {
  const config = AUDIT_ACTION_COLORS[action as AuditAction];
  return config
    ? { color: config.color, backgroundColor: config.bg }
    : { color: '#64748b', backgroundColor: 'rgba(100,116,139,0.08)' };
};

/* ------------------------------------------------------------------ */
/*  Sub-component: Usage Log Tab                                       */
/* ------------------------------------------------------------------ */

const UsageLogTab: React.FC<{ workflowId: string }> = ({ workflowId }: { workflowId: string }) => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [detailLog, setDetailLog] = useState<AuditLogEntry | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs({ workflow_id: workflowId, limit: 500 });
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const pagedLogs = useMemo(
    () => logs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [logs, page],
  );

  const handlePrev = useCallback(() => setPage((p: number) => Math.max(0, p - 1)), []);
  const handleNext = useCallback(() => setPage((p: number) => Math.min(totalPages - 1, p + 1)), [totalPages]);
  const handleCloseDetail = useCallback(() => setDetailLog(null), []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {t('admin.governance.auditTracking.usageLogCount', { count: logs.length })}
        </span>
        <Button variant="outline" size="sm" onClick={loadLogs}>
          {t('admin.governance.common.refresh', 'Refresh')}
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">{t('common.action', 'Action')}</th>
              <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">{t('common.target', 'Target')}</th>
              <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">{t('common.description', 'Description')}</th>
              <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">{t('admin.gov.performer', 'Performer')}</th>
              <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">{t('admin.gov.ip', 'IP')}</th>
              <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">{t('common.time', 'Time')}</th>
              <th className="py-2.5 px-4 text-right font-medium text-muted-foreground" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">{t('admin.governance.common.loading', 'Loading...')}</td></tr>
            ) : pagedLogs.length === 0 ? (
              <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">{t('admin.governance.auditTracking.noExecutionLogs', 'No usage logs found')}</td></tr>
            ) : pagedLogs.map((log: AuditLogEntry) => (
              <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="py-2.5 px-4">
                  <span className="inline-block px-2 py-0.5 text-xs rounded-full font-medium" style={getActionStyle(log.action)}>
                    {log.action}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-foreground font-medium">{log.targetName}</td>
                <td className="py-2.5 px-4 text-muted-foreground text-xs max-w-[240px] truncate">{log.description}</td>
                <td className="py-2.5 px-4 text-muted-foreground">{log.performerName}</td>
                <td className="py-2.5 px-4 font-mono text-xs text-muted-foreground">{log.ipAddress}</td>
                <td className="py-2.5 px-4 text-xs text-muted-foreground">{formatTimestamp(log.createdAt)}</td>
                <td className="py-2.5 px-4 text-right">
                  {log.details && (
                    <button
                      onClick={() => setDetailLog(log)}
                      className="text-xs text-primary hover:underline"
                    >
                      {t('common.details', 'Details')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {`${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, logs.length)} of ${logs.length}`}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={handlePrev}>
              {t('common.previous', 'Previous')}
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={handleNext}>
              {t('common.next', 'Next')}
            </Button>
          </div>
        </div>
      )}

      <Modal isOpen={!!detailLog} onClose={handleCloseDetail} title={t('admin.gov.auditDetail', 'Audit Log Detail')}>
        {detailLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">{t('common.action', 'Action')}</p>
                <p className="text-foreground">
                  <span className="inline-block px-2 py-0.5 text-xs rounded-full font-medium" style={getActionStyle(detailLog.action)}>
                    {detailLog.action}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('common.target', 'Target')}</p>
                <p className="text-foreground">{detailLog.targetName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('admin.gov.performer', 'Performer')}</p>
                <p className="text-foreground">{detailLog.performerName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('admin.gov.ip', 'IP Address')}</p>
                <p className="font-mono text-foreground">{detailLog.ipAddress}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">{t('common.description', 'Description')}</p>
              <p className="text-sm text-foreground">{detailLog.description}</p>
            </div>
            {detailLog.details && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t('common.details', 'Details')}</p>
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs font-mono">
                  {Object.entries(detailLog.details).map(([k, v]: [string, unknown]) => (
                    <div key={k} className="flex justify-between py-0.5">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="text-foreground">{Array.isArray(v) ? v.join(', ') : String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">{formatTimestamp(detailLog.createdAt)}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Sub-component: Governance Log Tab                                  */
/* ------------------------------------------------------------------ */

const GovernanceLogTab: React.FC<{ workflowId: string }> = ({ workflowId }: { workflowId: string }) => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await getAuditLogs({ workflow_id: workflowId, limit: 500 });
      const data = Array.isArray(raw) ? raw : [];
      setLogs(data.filter((l: AuditLogEntry) => GOVERNANCE_ACTIONS.includes(l.action)));
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const getActionLabel = useCallback((action: AuditAction): string => {
    const map: Record<string, string> = {
      governance_full_approval: t('admin.governance.auditTracking.actionFullApproval', 'Full Approval'),
      governance_review: t('admin.governance.auditTracking.actionReview', 'Review'),
      approval_revoked: t('admin.governance.auditTracking.actionRevoked', 'Revoked'),
      system_approval_change: t('admin.governance.auditTracking.actionSystemApproval', 'System Approval'),
      workflow_modified: t('admin.governance.auditTracking.actionModified', 'Modified'),
      deploy_status_change: t('admin.governance.auditTracking.actionDeployChange', 'Deploy Change'),
    };
    return map[action] || action;
  }, [t]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {t('admin.governance.auditTracking.governanceLogCount', { count: logs.length })}
        </span>
        <Button variant="outline" size="sm" onClick={loadLogs}>
          {t('admin.governance.common.refresh', 'Refresh')}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          {t('admin.governance.auditTracking.noTimelineData', 'No governance log entries found')}
        </div>
      ) : (
        <div className="relative pl-8">
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
          {logs.map((entry: AuditLogEntry, idx: number) => {
            const actionStyle = getActionStyle(entry.action);
            return (
              <div key={entry.id} className="relative mb-6">
                <div
                  className="absolute -left-5 w-3 h-3 rounded-full border-2"
                  style={{
                    backgroundColor: idx === 0 ? actionStyle.color : 'var(--card)',
                    borderColor: actionStyle.color,
                  }}
                />
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span
                      className="inline-block px-2 py-0.5 text-xs rounded-full font-medium"
                      style={actionStyle}
                    >
                      {getActionLabel(entry.action)}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatTimestamp(entry.createdAt)}</span>
                  </div>
                  <p className="text-sm text-foreground mt-2">{entry.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{t('admin.governance.auditTracking.performer', 'Performer')}: {entry.performerName}</span>
                    <span>IP: {entry.ipAddress}</span>
                  </div>
                  {entry.details && (
                    <div className="mt-2 p-2 rounded-lg bg-muted/30 text-xs font-mono flex flex-wrap gap-x-4 gap-y-1">
                      {Object.entries(entry.details)
                        .filter(([, v]: [string, unknown]) => v !== null && v !== undefined)
                        .map(([k, v]: [string, unknown]) => (
                          <span key={k}>
                            <strong className="text-muted-foreground">{k}:</strong>{' '}
                            <span className="text-foreground">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Sub-component: Change Log Tab (Timeline)                           */
/* ------------------------------------------------------------------ */

const ChangeLogTab: React.FC<{ workflowId: string }> = ({ workflowId }: { workflowId: string }) => {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTimeline = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWorkflowAuditTimeline(workflowId);
      setEntries(Array.isArray(data) ? data : []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {t('admin.governance.auditTracking.changeLogCount', { count: entries.length })}
        </span>
        <Button variant="outline" size="sm" onClick={loadTimeline}>
          {t('admin.governance.common.refresh', 'Refresh')}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          {t('admin.governance.auditTracking.noChangeLogs', 'No change log entries found')}
        </div>
      ) : (
        <div className="relative pl-8">
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
          {entries.map((entry: TimelineEntry, idx: number) => {
            const actionStyle = getActionStyle(entry.action);
            return (
              <div key={entry.id} className="relative mb-6">
                <div
                  className="absolute -left-5 w-3 h-3 rounded-full border-2"
                  style={{
                    backgroundColor: idx === 0 ? actionStyle.color : 'var(--card)',
                    borderColor: actionStyle.color,
                  }}
                />
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span
                      className="inline-block px-2 py-0.5 text-xs rounded-full font-medium"
                      style={actionStyle}
                    >
                      {entry.action}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatTimestamp(entry.createdAt)}</span>
                  </div>
                  <p className="text-sm text-foreground mt-2">{entry.description}</p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <span>{t('admin.governance.auditTracking.performer', 'Performer')}: {entry.performerName}</span>
                  </div>
                  {entry.details && Object.keys(entry.details).length > 0 && (
                    <div className="mt-2 p-2 rounded-lg bg-muted/30 text-xs font-mono flex flex-wrap gap-x-4 gap-y-1">
                      {Object.entries(entry.details)
                        .filter(([, v]: [string, unknown]) => v !== null && v !== undefined)
                        .map(([k, v]: [string, unknown]) => (
                          <span key={k}>
                            <strong className="text-muted-foreground">{k}:</strong>{' '}
                            <span className="text-foreground">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Sub-component: Workflow Detail (Level 2)                           */
/* ------------------------------------------------------------------ */

interface SelectedWorkflow {
  id: string;
  name: string;
  workflow: TrackedWorkflow;
}

const WorkflowDetailView: React.FC<{
  selected: SelectedWorkflow;
  onBack: () => void;
}> = ({ selected, onBack }: { selected: SelectedWorkflow; onBack: () => void }) => {
  const { t } = useTranslation();
  const [detailTab, setDetailTab] = useState<DetailTabId>('usage');

  const wf = selected.workflow;

  const handleBack = useCallback(() => onBack(), [onBack]);
  const handleTabUsage = useCallback(() => setDetailTab('usage'), []);
  const handleTabGovernance = useCallback(() => setDetailTab('governance'), []);
  const handleTabChanges = useCallback(() => setDetailTab('changes'), []);

  const detailTabs: { id: DetailTabId; label: string }[] = useMemo(() => [
    { id: 'usage', label: t('admin.governance.auditTracking.tabUsageLogs', 'Usage Logs') },
    { id: 'governance', label: t('admin.governance.auditTracking.tabGovernanceLogs', 'Governance Logs') },
    { id: 'changes', label: t('admin.governance.auditTracking.tabChangeLogs', 'Change Logs') },
  ], [t]);

  return (
    <div className="flex flex-col gap-6">
      {/* Back button + header */}
      <div>
        <button
          onClick={handleBack}
          className="text-sm text-primary hover:underline mb-2 inline-flex items-center gap-1"
        >
          &larr; {t('admin.governance.auditTracking.backToList', 'Back to list')}
        </button>
        <h2 className="text-lg font-bold text-foreground">{wf.workflowName}</h2>
      </div>

      {/* Workflow info cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{t('admin.governance.auditTracking.owner', 'Owner')}</p>
          <p className="text-sm font-medium text-foreground mt-1">
            {wf.ownerName || '-'}
            {wf.ownerDepartment && (
              <span className="text-muted-foreground ml-1">({wf.ownerDepartment})</span>
            )}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{t('admin.governance.auditTracking.deployStatus', 'Deploy Status')}</p>
          <p className="mt-1">
            <StatusBadge variant={wf.isDeployed ? 'success' : 'neutral'}>
              {wf.isDeployed
                ? t('admin.governance.auditTracking.deployed', 'Deployed')
                : t('admin.governance.auditTracking.notDeployed', 'Not Deployed')}
            </StatusBadge>
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{t('admin.governance.auditTracking.governanceStatus', 'Governance')}</p>
          <p className="mt-1">
            <StatusBadge variant={wf.isGovernanceAccepted ? 'success' : 'warning'}>
              {wf.isGovernanceAccepted
                ? t('admin.governance.auditTracking.accepted', 'Accepted')
                : t('admin.governance.auditTracking.pending', 'Pending')}
            </StatusBadge>
          </p>
        </div>
        {wf.governanceReviewedBy && (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{t('admin.governance.auditTracking.governanceReviewer', 'Reviewer')}</p>
            <p className="text-sm font-medium text-foreground mt-1">{wf.governanceReviewedBy}</p>
          </div>
        )}
        {wf.lastAuditDate && (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{t('admin.governance.auditTracking.lastUpdated', 'Last Audit')}</p>
            <p className="text-sm font-medium text-foreground mt-1">{formatTimestamp(wf.lastAuditDate)}</p>
          </div>
        )}
        {wf.auditCount !== undefined && (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{t('admin.gov.auditEntries', 'Audit Entries')}</p>
            <p className="text-sm font-medium text-foreground mt-1">{wf.auditCount}</p>
          </div>
        )}
      </div>

      {/* Detail sub-tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {detailTabs.map((tb: { id: DetailTabId; label: string }) => (
          <button
            key={tb.id}
            onClick={
              tb.id === 'usage' ? handleTabUsage :
              tb.id === 'governance' ? handleTabGovernance :
              handleTabChanges
            }
            className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${
              detailTab === tb.id
                ? 'bg-primary text-primary-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {detailTab === 'usage' && <UsageLogTab workflowId={selected.id} />}
      {detailTab === 'governance' && <GovernanceLogTab workflowId={selected.id} />}
      {detailTab === 'changes' && <ChangeLogTab workflowId={selected.id} />}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Component (Level 1 - Workflow List)                           */
/* ------------------------------------------------------------------ */

const AdminGovAuditTrackingPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const [workflows, setWorkflows] = useState<TrackedWorkflow[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<SelectedWorkflow | null>(null);

  /* -- Data loading -- */

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [wfData, statsData] = await Promise.all([
        getTrackedWorkflows(),
        getAuditTrackingStats(),
      ]);
      setWorkflows(Array.isArray(wfData) ? wfData : []);
      setStats(statsData && typeof statsData === 'object' ? statsData : null);
    } catch {
      setWorkflows([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* -- Filtering -- */

  const filteredWorkflows = useMemo(() => {
    if (!search.trim()) return workflows;
    const q = search.toLowerCase();
    return workflows.filter((wf: TrackedWorkflow) =>
      wf.workflowName.toLowerCase().includes(q) ||
      wf.ownerName.toLowerCase().includes(q) ||
      (wf.ownerDepartment && wf.ownerDepartment.toLowerCase().includes(q)),
    );
  }, [workflows, search]);

  /* -- Navigation -- */

  const handleSelectWorkflow = useCallback((wf: TrackedWorkflow) => {
    setSelectedWorkflow({ id: wf.workflowId, name: wf.workflowName, workflow: wf });
  }, []);

  const handleBack = useCallback(() => {
    setSelectedWorkflow(null);
  }, []);

  const handleSearchChange = useCallback((v: string) => setSearch(v), []);

  /* -- Render -- */

  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {t('admin.pages.govAuditTracking.title', 'Audit Tracking')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('admin.pages.govAuditTracking.description', 'Comprehensive audit trail and workflow tracking for AI governance')}
          </p>
        </div>

        {selectedWorkflow ? (
          <WorkflowDetailView selected={selectedWorkflow} onBack={handleBack} />
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
              <StatCard
                label={t('admin.governance.auditTracking.totalLogs', 'Total Logs')}
                value={loading ? '—' : (stats?.totalLogs ?? 0)}
                variant="info"
                loading={loading}
              />
              <StatCard
                label={t('admin.governance.auditTracking.trackedWorkflowCount', 'Tracked Workflows')}
                value={loading ? '—' : (stats?.trackedWorkflows ?? 0)}
                variant="success"
                loading={loading}
              />
              <StatCard
                label={t('admin.governance.auditTracking.fullApprovalCount', 'Full Approvals')}
                value={loading ? '—' : (stats?.actionCounts?.governance_full_approval ?? 0)}
                accentColor="#7c3aed"
                loading={loading}
              />
              <StatCard
                label={t('admin.governance.auditTracking.revokedCount', 'Revoked')}
                value={loading ? '—' : (stats?.actionCounts?.approval_revoked ?? 0)}
                variant="error"
                loading={loading}
              />
            </div>

            {/* Search toolbar */}
            <div className="flex items-center gap-3">
              <div className="w-80">
                <SearchInput
                  value={search}
                  onChange={handleSearchChange}
                  placeholder={t('admin.governance.auditTracking.trackedSearchPlaceholder', 'Search workflows...')}
                />
              </div>
              <Button variant="outline" size="sm" onClick={loadData} className="ml-auto">
                {t('admin.governance.common.refresh', 'Refresh')}
              </Button>
            </div>

            {/* Workflow table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">
                      {t('admin.governance.auditTracking.workflowName', 'Workflow Name')}
                    </th>
                    <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">
                      {t('admin.governance.auditTracking.owner', 'Owner')}
                    </th>
                    <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">
                      {t('admin.governance.auditTracking.department', 'Department')}
                    </th>
                    <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">
                      {t('admin.governance.auditTracking.deployStatus', 'Deploy')}
                    </th>
                    <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">
                      {t('admin.governance.auditTracking.governanceStatus', 'Governance')}
                    </th>
                    <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">
                      {t('admin.governance.auditTracking.lastUpdated', 'Last Audit')}
                    </th>
                    <th className="py-2.5 px-4 text-left font-medium text-muted-foreground">
                      {t('admin.gov.auditEntries', 'Audits')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-muted-foreground">
                        {t('admin.governance.common.loading', 'Loading...')}
                      </td>
                    </tr>
                  ) : filteredWorkflows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-muted-foreground">
                        {t('admin.governance.auditTracking.noTrackedWorkflows', 'No tracked workflows found')}
                      </td>
                    </tr>
                  ) : (
                    filteredWorkflows.map((wf: TrackedWorkflow) => (
                      <tr
                        key={wf.workflowId}
                        className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer"
                        onClick={() => handleSelectWorkflow(wf)}
                      >
                        <td className="py-2.5 px-4 font-semibold text-foreground">{wf.workflowName}</td>
                        <td className="py-2.5 px-4 text-muted-foreground">{wf.ownerName || '-'}</td>
                        <td className="py-2.5 px-4 text-muted-foreground">{wf.ownerDepartment || '-'}</td>
                        <td className="py-2.5 px-4">
                          <StatusBadge variant={wf.isDeployed ? 'success' : 'neutral'}>
                            {wf.isDeployed
                              ? t('admin.governance.auditTracking.deployed', 'Deployed')
                              : t('admin.governance.auditTracking.notDeployed', 'Not Deployed')}
                          </StatusBadge>
                        </td>
                        <td className="py-2.5 px-4">
                          <StatusBadge variant={wf.isGovernanceAccepted ? 'success' : 'warning'}>
                            {wf.isGovernanceAccepted
                              ? t('admin.governance.auditTracking.accepted', 'Accepted')
                              : t('admin.governance.auditTracking.pending', 'Pending')}
                          </StatusBadge>
                        </td>
                        <td className="py-2.5 px-4 text-xs text-muted-foreground">
                          {formatTimestamp(wf.lastAuditDate || wf.updatedAt)}
                        </td>
                        <td className="py-2.5 px-4 text-muted-foreground">{wf.auditCount ?? '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </ContentArea>
  );
};

/* ------------------------------------------------------------------ */
/*  Feature Module Export                                               */
/* ------------------------------------------------------------------ */

const feature: AdminFeatureModule = {
  id: 'admin-gov-audit-tracking',
  name: 'AdminGovAuditTrackingPage',
  adminSection: 'admin-governance',
  routes: {
    'admin-gov-audit-tracking': AdminGovAuditTrackingPage,
  },
};

export default feature;
