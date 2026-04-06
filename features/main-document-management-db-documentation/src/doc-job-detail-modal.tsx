'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button } from '@xgen/ui';
import { FiDatabase, FiCalendar, FiClock, FiUser, FiCheckCircle, FiXCircle, FiAlertCircle } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { getDocJobLogs, type DocJob, type ExecutionLog, type DocJobStatus } from './api';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  try { return new Date(dateStr).toLocaleString('ko-KR'); } catch { return dateStr; }
}

function LogStatusIcon({ status }: { status: string }) {
  if (status === 'success' || status === 'completed')
    return <FiCheckCircle className="w-3.5 h-3.5 text-green-600" />;
  if (status === 'failed' || status === 'error')
    return <FiXCircle className="w-3.5 h-3.5 text-red-600" />;
  return <FiAlertCircle className="w-3.5 h-3.5 text-yellow-600" />;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export interface DocJobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: DocJob | null;
  onEdit: (job: DocJob) => void;
}

export const DocJobDetailModal: React.FC<DocJobDetailModalProps> = ({
  isOpen,
  onClose,
  job,
  onEdit,
}) => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && job?.id) {
      setLogsLoading(true);
      getDocJobLogs(job.id, 20)
        .then(setLogs)
        .catch(() => setLogs([]))
        .finally(() => setLogsLoading(false));
    } else {
      setLogs([]);
    }
  }, [isOpen, job?.id]);

  if (!job) return null;

  const handleEdit = () => { onClose(); onEdit(job); };

  const statusLabel = t(`documents.dbDocumentation.status.${job.status}`);
  const scheduleLabel = t(`documents.dbDocumentation.scheduleType.${job.scheduleType}`);

  const statusColors: Record<DocJobStatus, string> = {
    draft: 'bg-gray-100 text-gray-600',
    pending: 'bg-yellow-100 text-yellow-700',
    active: 'bg-blue-100 text-blue-700',
    paused: 'bg-orange-100 text-orange-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={job.jobName}
      size="lg"
      footer={
        <div className="flex justify-between w-full">
          <Button variant="outline" size="sm" onClick={handleEdit}>
            {t('documents.dbDocumentation.detail.edit')}
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            {t('documents.dbDocumentation.detail.close')}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 text-sm">

        {/* Basic Info */}
        <Section title={t('documents.dbDocumentation.detail.basicInfo')}>
          <Row label={t('documents.dbDocumentation.detail.jobName')} value={job.jobName} />
          <Row label={t('documents.dbDocumentation.detail.description')} value={job.description || '-'} />
          <Row label={t('documents.dbDocumentation.detail.status')}>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[job.status]}`}>
              {statusLabel}
            </span>
          </Row>
          {(job.fullName || job.username) && (
            <Row label={t('documents.dbDocumentation.detail.owner')}>
              <span className="inline-flex items-center gap-1"><FiUser className="w-3 h-3" />{job.fullName || job.username}</span>
            </Row>
          )}
        </Section>

        {/* DB & Query */}
        <Section title={t('documents.dbDocumentation.detail.dbSection')}>
          <Row label={t('documents.dbDocumentation.detail.connection')}>
            <span className="inline-flex items-center gap-1"><FiDatabase className="w-3 h-3" />{job.connectionName}</span>
          </Row>
          <Row label={t('documents.dbDocumentation.detail.collection')} value={job.targetCollection || '-'} />
          <Row label={t('documents.dbDocumentation.detail.query')}>
            <pre className="mt-1 px-3 py-2 bg-gray-50 rounded-md font-mono text-xs whitespace-pre-wrap break-all max-h-28 overflow-y-auto">
              {job.query || '-'}
            </pre>
          </Row>
        </Section>

        {/* Schedule */}
        <Section title={t('documents.dbDocumentation.detail.scheduleSection')}>
          <Row label={t('documents.dbDocumentation.detail.scheduleType')}>
            <span className="inline-flex items-center gap-1"><FiCalendar className="w-3 h-3" />{scheduleLabel}</span>
          </Row>
          {job.scheduleConfig?.cron_expression && (
            <Row label={t('documents.dbDocumentation.detail.cronExpression')}>
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{job.scheduleConfig.cron_expression}</code>
            </Row>
          )}
          {job.scheduleConfig?.interval_seconds && (
            <Row label={t('documents.dbDocumentation.detail.interval')} value={`${job.scheduleConfig.interval_seconds}${t('documents.dbDocumentation.detail.intervalUnit')}`} />
          )}
          {(job.scheduleConfig?.hour != null || job.scheduleConfig?.minute != null) && (
            <Row label={t('documents.dbDocumentation.detail.runTime')} value={`${String(job.scheduleConfig.hour ?? 0).padStart(2, '0')}:${String(job.scheduleConfig.minute ?? 0).padStart(2, '0')}`} />
          )}
          {job.scheduleConfig?.max_executions && (
            <Row label={t('documents.dbDocumentation.detail.maxExecutions')} value={`${job.scheduleConfig.max_executions}${t('documents.dbDocumentation.detail.maxExecutionsUnit')}`} />
          )}
        </Section>

        {/* Execution Stats */}
        <Section title={t('documents.dbDocumentation.detail.statsSection')}>
          <Row label={t('documents.dbDocumentation.detail.totalExecutions')} value={`${job.totalExecutions}${t('documents.dbDocumentation.detail.maxExecutionsUnit')}`} />
          <Row label={t('documents.dbDocumentation.detail.successfulExecutions')}>
            <span className="text-green-600">{job.successfulExecutions}{t('documents.dbDocumentation.detail.maxExecutionsUnit')}</span>
          </Row>
          <Row label={t('documents.dbDocumentation.detail.failedExecutions')}>
            <span className="text-red-600">{job.failedExecutions}{t('documents.dbDocumentation.detail.maxExecutionsUnit')}</span>
          </Row>
          {job.lastExecutionAt && (
            <Row label={t('documents.dbDocumentation.detail.lastExecution')}>
              <span className="inline-flex items-center gap-1"><FiClock className="w-3 h-3" />{formatDate(job.lastExecutionAt)}</span>
            </Row>
          )}
          {job.nextExecutionAt && (
            <Row label={t('documents.dbDocumentation.detail.nextExecution')} value={formatDate(job.nextExecutionAt)} />
          )}
        </Section>

        {/* Time */}
        <Section title={t('documents.dbDocumentation.detail.timeSection')}>
          <Row label={t('documents.dbDocumentation.detail.createdAt')} value={formatDate(job.createdAt)} />
          <Row label={t('documents.dbDocumentation.detail.updatedAt')} value={formatDate(job.updatedAt)} />
        </Section>

        {/* Execution Logs */}
        <Section title={t('documents.dbDocumentation.detail.logsSection')}>
          {logsLoading && <p className="text-xs text-muted-foreground">{t('documents.dbDocumentation.detail.logsLoading')}</p>}
          {!logsLoading && logs.length === 0 && <p className="text-xs text-muted-foreground">{t('documents.dbDocumentation.detail.noLogs')}</p>}
          {!logsLoading && logs.length > 0 && (
            <div className="space-y-1.5 mt-1">
              {logs.map(log => (
                <div key={log.id} className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 rounded-md text-xs">
                  <LogStatusIcon status={log.status} />
                  <span className="min-w-[36px] text-gray-600">
                    {(log.status === 'success' || log.status === 'completed')
                      ? t('documents.dbDocumentation.detail.logSuccess')
                      : t('documents.dbDocumentation.detail.logFailed')}
                  </span>
                  <span className="text-muted-foreground">{formatDate(log.startedAt)}</span>
                  {log.executionTimeSeconds != null && (
                    <span className="text-muted-foreground">({log.executionTimeSeconds.toFixed(1)}s)</span>
                  )}
                  {log.rowsProcessed != null && (
                    <span className="text-muted-foreground">{log.rowsProcessed}행</span>
                  )}
                  {log.errorMessage && (
                    <span className="text-red-600 flex-1 truncate">{log.errorMessage}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </Modal>
  );
};

// ── Sub-components ──

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="flex-1 text-foreground">{children || value}</span>
    </div>
  );
}

export default DocJobDetailModal;
