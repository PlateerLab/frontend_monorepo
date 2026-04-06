'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, useToast } from '@xgen/ui';
import { FiFileText, FiDatabase, FiCalendar, FiClock, FiPlay, FiPause, FiRefreshCw, FiXCircle, FiTrash2, FiZap, FiEdit, FiPlus } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import {
  listDocJobs,
  startDocJob,
  pauseDocJob,
  resumeDocJob,
  cancelDocJob,
  deleteDocJob,
  executeDocJobNow,
  type DocJob,
  type DocJobStatus,
} from './api';
import { DocJobEditor, type DocJobEditorProps } from './doc-job-editor';
import { DocJobDetailModal } from './doc-job-detail-modal';
import './locales';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ConnectionOption {
  id: number;
  connectionName: string;
  dbType: string;
  host: string;
  port: number;
  databaseName: string;
  isActive: boolean;
}

export interface DbDocumentationProps {
  connections: ConnectionOption[];
  preselectedConnectionId?: number;
  onPreselectedHandled?: () => void;
}

// ─────────────────────────────────────────────────────────────
// Status helpers
// ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<DocJobStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-700',
  active: 'bg-blue-100 text-blue-700',
  paused: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

function getAvailableActions(status: DocJobStatus): string[] {
  switch (status) {
    case 'draft':
    case 'failed':
    case 'cancelled':
    case 'completed':
      return ['start', 'executeNow', 'delete'];
    case 'pending':
    case 'active':
      return ['pause', 'cancel', 'executeNow'];
    case 'paused':
      return ['resume', 'cancel', 'executeNow'];
    default:
      return ['delete'];
  }
}

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  try { return new Date(dateStr).toLocaleDateString('ko-KR'); } catch { return dateStr; }
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const DbDocumentation: React.FC<DbDocumentationProps> = ({
  connections,
  preselectedConnectionId,
  onPreselectedHandled,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // ── View state ──
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [jobs, setJobs] = useState<DocJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // ── Editor state ──
  const [editJob, setEditJob] = useState<DocJob | null>(null);
  const [editorPreselectedId, setEditorPreselectedId] = useState<number | undefined>();

  // ── Detail modal state ──
  const [detailJob, setDetailJob] = useState<DocJob | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // ── Load jobs ──
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listDocJobs();
      setJobs(data);
    } catch (err: any) {
      setError(err.message || t('documents.dbDocumentation.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // ── Handle preselected connection (from "문서화" button) ──
  useEffect(() => {
    if (preselectedConnectionId) {
      setEditorPreselectedId(preselectedConnectionId);
      setEditJob(null);
      setView('editor');
      onPreselectedHandled?.();
    }
  }, [preselectedConnectionId, onPreselectedHandled]);

  // ── Action handler ──
  const handleAction = useCallback(async (
    jobId: number,
    action: () => Promise<void>,
    successMsg: string,
  ) => {
    if (actionLoading) return;
    setActionLoading(jobId);
    try {
      await action();
      toast.success(successMsg);
      await fetchJobs();
    } catch (err: any) {
      toast.error(err.message || t('documents.dbDocumentation.actions.error'));
    } finally {
      setActionLoading(null);
    }
  }, [actionLoading, fetchJobs, toast, t]);

  const handleDelete = useCallback(async (job: DocJob) => {
    if (!job.id) return;
    try {
      await deleteDocJob(job.id);
      toast.success(t('documents.dbDocumentation.actions.deleteSuccess'));
      await fetchJobs();
    } catch (err: any) {
      toast.error(err.message || t('documents.dbDocumentation.actions.deleteFailed'));
    }
  }, [fetchJobs, toast, t]);

  // ── Navigation ──
  const handleCreateNew = useCallback((connectionId?: number) => {
    setEditJob(null);
    setEditorPreselectedId(connectionId);
    setView('editor');
  }, []);

  const handleEditJob = useCallback((job: DocJob) => {
    setEditJob(job);
    setEditorPreselectedId(undefined);
    setView('editor');
  }, []);

  const handleEditorBack = useCallback(() => {
    setView('list');
    setEditJob(null);
    setEditorPreselectedId(undefined);
  }, []);

  const handleEditorSaved = useCallback(() => {
    setView('list');
    setEditJob(null);
    setEditorPreselectedId(undefined);
    fetchJobs();
  }, [fetchJobs]);

  const handleViewDetail = useCallback((job: DocJob) => {
    setDetailJob(job);
    setShowDetail(true);
  }, []);

  // ── If showing editor ──
  if (view === 'editor') {
    return (
      <DocJobEditor
        connections={connections}
        editJob={editJob}
        preselectedConnectionId={editorPreselectedId}
        onBack={handleEditorBack}
        onSaved={handleEditorSaved}
      />
    );
  }

  // ── List View ──
  const isEmptyState = !loading && !error && jobs.length === 0;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      {!isEmptyState && (
        <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--color-line-50)]">
          <div />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchJobs} disabled={loading}>
              <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="toolbar" onClick={() => handleCreateNew()}>
              <FiPlus className="w-4 h-4" />
              {t('documents.dbDocumentation.createNew')}
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            {t('documents.dbDocumentation.loading')}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm text-red-600">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchJobs}>{t('documents.dbDocumentation.retry')}</Button>
          </div>
        )}

        {/* Empty */}
        {isEmptyState && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <FiFileText className="w-12 h-12 text-muted-foreground/50" />
            <h3 className="text-sm font-medium text-foreground">{t('documents.dbDocumentation.emptyTitle')}</h3>
            <p className="text-xs text-muted-foreground max-w-md">{t('documents.dbDocumentation.emptyDescription')}</p>
            <Button size="sm" onClick={() => handleCreateNew()} className="mt-2">
              {t('documents.dbDocumentation.createNew')}
            </Button>
          </div>
        )}

        {/* Job Cards */}
        {!loading && !error && jobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {jobs.map(job => {
              const actions = getAvailableActions(job.status);
              const isJobLoading = actionLoading === job.id;

              return (
                <div
                  key={job.id}
                  className="group border border-[var(--color-line-50)] rounded-xl p-4 hover:shadow-sm transition-shadow cursor-pointer flex flex-col gap-3"
                  onClick={() => handleViewDetail(job)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter') handleViewDetail(job); }}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium text-foreground truncate flex-1">{job.jobName}</h3>
                    <span className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_COLORS[job.status]}`}>
                      {t(`documents.dbDocumentation.status.${job.status}`)}
                    </span>
                  </div>

                  {/* Description */}
                  {job.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{job.description}</p>
                  )}

                  {/* Metadata */}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <FiDatabase className="w-3 h-3 shrink-0" />
                      <span className="truncate">{job.connectionName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FiCalendar className="w-3 h-3 shrink-0" />
                      <span>{t(`documents.dbDocumentation.scheduleType.${job.scheduleType}`)}</span>
                    </div>
                    {job.targetCollection && (
                      <div className="flex items-center gap-1.5">
                        <FiFileText className="w-3 h-3 shrink-0" />
                        <span className="truncate">{job.targetCollection}</span>
                      </div>
                    )}
                    {job.updatedAt && (
                      <div className="flex items-center gap-1.5">
                        <FiClock className="w-3 h-3 shrink-0" />
                        <span>{formatDate(job.updatedAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Query Preview */}
                  {job.query && (
                    <div className="px-2 py-1.5 bg-gray-50 rounded text-[11px] font-mono text-muted-foreground truncate">
                      {job.query.length > 80 ? job.query.slice(0, 80) + '...' : job.query}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-[var(--color-line-50)]" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-muted-foreground">
                        {t('documents.dbDocumentation.card.total')} <span className="font-medium text-foreground">{job.totalExecutions}</span>
                      </span>
                      <span className="text-green-600">
                        {t('documents.dbDocumentation.card.success')} <span className="font-medium">{job.successfulExecutions}</span>
                      </span>
                      <span className="text-red-600">
                        {t('documents.dbDocumentation.card.failed')} <span className="font-medium">{job.failedExecutions}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <ActionButton
                        icon={<FiEdit className="w-3.5 h-3.5" />}
                        title={t('documents.dbDocumentation.actions.edit')}
                        onClick={() => handleEditJob(job)}
                      />
                      {actions.includes('start') && (
                        <ActionButton
                          icon={<FiPlay className="w-3.5 h-3.5" />}
                          title={t('documents.dbDocumentation.actions.start')}
                          disabled={isJobLoading}
                          onClick={() => handleAction(job.id!, () => startDocJob(job.id!), t('documents.dbDocumentation.actions.startSuccess'))}
                        />
                      )}
                      {actions.includes('pause') && (
                        <ActionButton
                          icon={<FiPause className="w-3.5 h-3.5" />}
                          title={t('documents.dbDocumentation.actions.pause')}
                          disabled={isJobLoading}
                          onClick={() => handleAction(job.id!, () => pauseDocJob(job.id!), t('documents.dbDocumentation.actions.pauseSuccess'))}
                        />
                      )}
                      {actions.includes('resume') && (
                        <ActionButton
                          icon={<FiRefreshCw className="w-3.5 h-3.5" />}
                          title={t('documents.dbDocumentation.actions.resume')}
                          disabled={isJobLoading}
                          onClick={() => handleAction(job.id!, () => resumeDocJob(job.id!), t('documents.dbDocumentation.actions.resumeSuccess'))}
                        />
                      )}
                      {actions.includes('cancel') && (
                        <ActionButton
                          icon={<FiXCircle className="w-3.5 h-3.5" />}
                          title={t('documents.dbDocumentation.actions.cancel')}
                          disabled={isJobLoading}
                          onClick={() => handleAction(job.id!, () => cancelDocJob(job.id!), t('documents.dbDocumentation.actions.cancelSuccess'))}
                        />
                      )}
                      {actions.includes('executeNow') && (
                        <ActionButton
                          icon={<FiZap className="w-3.5 h-3.5" />}
                          title={t('documents.dbDocumentation.actions.executeNow')}
                          disabled={isJobLoading}
                          onClick={() => handleAction(job.id!, () => executeDocJobNow(job.id!), t('documents.dbDocumentation.actions.executeSuccess'))}
                        />
                      )}
                      {actions.includes('delete') && (
                        <ActionButton
                          icon={<FiTrash2 className="w-3.5 h-3.5" />}
                          title={t('documents.dbDocumentation.actions.delete')}
                          danger
                          disabled={isJobLoading}
                          onClick={() => handleDelete(job)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <DocJobDetailModal
        isOpen={showDetail}
        onClose={() => { setShowDetail(false); setDetailJob(null); }}
        job={detailJob}
        onEdit={handleEditJob}
      />
    </div>
  );
};

// ── ActionButton sub-component ──
function ActionButton({
  icon,
  title,
  danger,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`p-1.5 rounded-md transition-colors disabled:opacity-50 ${
        danger
          ? 'text-red-500 hover:bg-red-50'
          : 'text-muted-foreground hover:bg-gray-100 hover:text-foreground'
      }`}
    >
      {icon}
    </button>
  );
}

export default DbDocumentation;
