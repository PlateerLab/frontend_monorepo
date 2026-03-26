'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { CardBadge, WorkflowTabPlugin, WorkflowTabPluginProps } from '@xgen/types';
import { Button, EmptyState } from '@xgen/ui';
import { FiPlay, FiRefreshCw, FiPlus, FiClock, FiCheckCircle, FiAlertCircle, FiUpload } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import { listBatchHistory, cancelBatch, deleteBatch } from './api';
import type { BatchSession } from './api';
import styles from './styles/workflow-tester.module.scss';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type TesterFilterStatus = 'all' | 'running' | 'completed' | 'error';

export interface WorkflowTesterProps extends WorkflowTabPluginProps {
  className?: string;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const STATUS_BADGE_MAP: Record<string, { text: string; variant: CardBadge['variant'] }> = {
  idle: { text: 'IDLE', variant: 'secondary' },
  running: { text: 'RUNNING', variant: 'primary' },
  success: { text: 'SUCCESS', variant: 'success' },
  failed: { text: 'FAILED', variant: 'error' },
};

function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatProgress(completed: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((completed / total) * 100)}%`;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const WorkflowTester: React.FC<WorkflowTesterProps> = ({ className }) => {
  const { t } = useTranslation();
  const { isInitialized } = useAuth();

  // State
  const [sessions, setSessions] = useState<BatchSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<TesterFilterStatus>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Load batch history
  const fetchSessions = useCallback(async () => {
    if (!isInitialized) return;

    try {
      setLoading(true);
      setError(null);
      const data = await listBatchHistory();
      setSessions(data);
    } catch (err) {
      console.error('Failed to fetch batch sessions:', err);
      setError(t('workflows.tester.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [isInitialized, t]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    if (filterStatus === 'all') return sessions;
    if (filterStatus === 'running') return sessions.filter((s) => s.status === 'running');
    if (filterStatus === 'completed') return sessions.filter((s) => s.status === 'success');
    if (filterStatus === 'error') return sessions.filter((s) => s.status === 'failed');
    return sessions;
  }, [sessions, filterStatus]);

  const handleCreateClick = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const handleCancelBatch = useCallback(
    async (batchId: string) => {
      try {
        await cancelBatch(batchId);
        await fetchSessions();
      } catch (err) {
        console.error('Failed to cancel batch:', err);
      }
    },
    [fetchSessions]
  );

  const handleDeleteBatch = useCallback(
    async (batchId: string) => {
      try {
        await deleteBatch(batchId);
        await fetchSessions();
      } catch (err) {
        console.error('Failed to delete batch:', err);
      }
    },
    [fetchSessions]
  );

  // Filter tabs
  const filterTabs = [
    { key: 'all', label: t('workflows.tester.filter.all') },
    { key: 'running', label: t('workflows.tester.filter.running') },
    { key: 'completed', label: t('workflows.tester.filter.completed') },
    { key: 'error', label: t('workflows.tester.filter.error') },
  ];

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.filterTabs}>
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                className={`${styles.filterTab} ${filterStatus === tab.key ? styles.active : ''}`}
                onClick={() => setFilterStatus(tab.key as TesterFilterStatus)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.headerRight}>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateClick}
            title={t('workflows.tester.newTest')}
          >
            <FiPlus />
            {t('workflows.tester.newTest')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchSessions}
            disabled={loading}
            title={t('workflows.tester.refresh')}
          >
            <FiRefreshCw className={loading ? styles.spinning : ''} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {!isInitialized ? (
          <div className={styles.loadingState}>
            <p>{t('workflows.tester.loading')}</p>
          </div>
        ) : error ? (
          <EmptyState
            icon={<FiAlertCircle />}
            title={t('workflows.tester.error.title')}
            description={error}
            action={{
              label: t('workflows.tester.buttons.retry'),
              onClick: fetchSessions,
            }}
          />
        ) : filteredSessions.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FiPlay />
            </div>
            <h3 className={styles.emptyTitle}>{t('workflows.tester.empty.title')}</h3>
            <p className={styles.emptyDescription}>{t('workflows.tester.empty.description')}</p>

            <div className={styles.emptySteps}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepContent}>
                  <h4>{t('workflows.tester.steps.selectWorkflow')}</h4>
                  <p>{t('workflows.tester.steps.selectWorkflowDesc')}</p>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepContent}>
                  <h4>{t('workflows.tester.steps.uploadFile')}</h4>
                  <p>{t('workflows.tester.steps.uploadFileDesc')}</p>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepContent}>
                  <h4>{t('workflows.tester.steps.runTest')}</h4>
                  <p>{t('workflows.tester.steps.runTestDesc')}</p>
                </div>
              </div>
            </div>

            <Button variant="primary" onClick={handleCreateClick}>
              <FiPlus />
              {t('workflows.tester.empty.action')}
            </Button>
          </div>
        ) : (
          <div className={styles.sessionList}>
            {filteredSessions.map((session) => (
              <div key={session.batchId} className={styles.sessionCard}>
                <div className={styles.sessionHeader}>
                  <div className={styles.sessionInfo}>
                    <h4 className={styles.sessionWorkflow}>{session.workflowName}</h4>
                    <span className={`${styles.sessionStatus} ${styles[session.status]}`}>
                      {STATUS_BADGE_MAP[session.status]?.text || session.status}
                    </span>
                  </div>
                  <span className={styles.sessionDate}>{formatDate(session.createdAt)}</span>
                </div>

                <div className={styles.sessionProgress}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${session.progress}%` }}
                    />
                  </div>
                  <span className={styles.progressText}>
                    {session.completedCount}/{session.totalCount} ({formatProgress(session.completedCount, session.totalCount)})
                  </span>
                </div>

                <div className={styles.sessionStats}>
                  <div className={styles.stat}>
                    <FiCheckCircle className={styles.statIconSuccess} />
                    <span>{session.successCount}</span>
                  </div>
                  <div className={styles.stat}>
                    <FiAlertCircle className={styles.statIconError} />
                    <span>{session.errorCount}</span>
                  </div>
                  {session.status === 'running' && (
                    <Button variant="outline" size="sm" onClick={() => handleCancelBatch(session.batchId)}>
                      {t('workflows.tester.actions.cancel')}
                    </Button>
                  )}
                  {(session.status === 'success' || session.status === 'failed') && (
                    <Button variant="outline" size="sm" onClick={() => handleDeleteBatch(session.batchId)}>
                      {t('workflows.tester.actions.delete')}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Test Modal */}
      {isCreateModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCreateModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{t('workflows.tester.create.title')}</h3>
              <button className={styles.closeButton} onClick={() => setIsCreateModalOpen(false)}>
                ×
              </button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.uploadArea}>
                <FiUpload className={styles.uploadIcon} />
                <p>{t('workflows.tester.create.uploadPrompt')}</p>
                <span className={styles.uploadHint}>{t('workflows.tester.create.uploadHint')}</span>
              </div>

              <div className={styles.workflowSelect}>
                <label>{t('workflows.tester.create.selectWorkflow')}</label>
                <select disabled>
                  <option value="">{t('workflows.tester.create.selectPlaceholder')}</option>
                </select>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" disabled>
                <FiPlay />
                {t('workflows.tester.create.start')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowTester;

export const workflowTesterPlugin: WorkflowTabPlugin = {
  id: 'tester',
  name: 'Workflow Tester',
  tabLabelKey: 'workflows.tabs.tester',
  order: 4,
  component: WorkflowTester,
};
