'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { WorkflowTesterSession, TesterRunStatus, CardBadge } from '@xgen/types';
import { Button, EmptyState } from '@xgen/ui';
import { FiPlay, FiRefreshCw, FiPlus, FiClock, FiCheckCircle, FiAlertCircle, FiUpload, FiDownload, FiFile, FiFolder } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import styles from '../styles/workflow-tester.module.scss';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface BatchSession {
  batchId: string;
  workflowId: string;
  workflowName: string;
  status: TesterRunStatus;
  totalCount: number;
  completedCount: number;
  successCount: number;
  errorCount: number;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

type TesterFilterStatus = 'all' | 'running' | 'completed' | 'error';

interface WorkflowTesterProps {
  className?: string;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const STATUS_BADGE_MAP: Record<TesterRunStatus, { text: string; variant: CardBadge['variant'] }> = {
  pending: { text: 'PENDING', variant: 'warning' },
  running: { text: 'RUNNING', variant: 'primary' },
  completed: { text: 'COMPLETED', variant: 'success' },
  cancelled: { text: 'CANCELLED', variant: 'secondary' },
  error: { text: 'ERROR', variant: 'error' },
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

  // Mock data for demonstration
  const fetchSessions = useCallback(async () => {
    if (!isInitialized) return;

    try {
      setLoading(true);
      setError(null);
      // TODO: Replace with actual API call
      // const data = await listBatchHistory();
      setSessions([]);
    } catch (err) {
      console.error('Failed to fetch batch sessions:', err);
      setError(t('workflowTester.error.loadFailed'));
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
    return sessions.filter((s) => s.status === filterStatus);
  }, [sessions, filterStatus]);

  const handleCreateClick = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  // Filter tabs
  const filterTabs = [
    { key: 'all', label: t('workflowTester.filter.all') },
    { key: 'running', label: t('workflowTester.filter.running') },
    { key: 'completed', label: t('workflowTester.filter.completed') },
    { key: 'error', label: t('workflowTester.filter.error') },
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
            title={t('workflowTester.newTest')}
          >
            <FiPlus />
            {t('workflowTester.newTest')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchSessions}
            disabled={loading}
            title={t('workflowTester.refresh')}
          >
            <FiRefreshCw className={loading ? styles.spinning : ''} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {!isInitialized ? (
          <div className={styles.loadingState}>
            <p>{t('workflowTester.loading')}</p>
          </div>
        ) : error ? (
          <EmptyState
            icon={<FiAlertCircle />}
            title={t('workflowTester.error.title')}
            description={error}
            action={{
              label: t('workflowTester.buttons.retry'),
              onClick: fetchSessions,
            }}
          />
        ) : filteredSessions.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FiPlay />
            </div>
            <h3 className={styles.emptyTitle}>{t('workflowTester.empty.title')}</h3>
            <p className={styles.emptyDescription}>{t('workflowTester.empty.description')}</p>

            <div className={styles.emptySteps}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepContent}>
                  <h4>{t('workflowTester.steps.selectWorkflow')}</h4>
                  <p>{t('workflowTester.steps.selectWorkflowDesc')}</p>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepContent}>
                  <h4>{t('workflowTester.steps.uploadFile')}</h4>
                  <p>{t('workflowTester.steps.uploadFileDesc')}</p>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepContent}>
                  <h4>{t('workflowTester.steps.runTest')}</h4>
                  <p>{t('workflowTester.steps.runTestDesc')}</p>
                </div>
              </div>
            </div>

            <Button variant="primary" onClick={handleCreateClick}>
              <FiPlus />
              {t('workflowTester.empty.action')}
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TODO: Create Test Modal */}
      {isCreateModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCreateModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{t('workflowTester.create.title')}</h3>
              <button className={styles.closeButton} onClick={() => setIsCreateModalOpen(false)}>
                ×
              </button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.uploadArea}>
                <FiUpload className={styles.uploadIcon} />
                <p>{t('workflowTester.create.uploadPrompt')}</p>
                <span className={styles.uploadHint}>{t('workflowTester.create.uploadHint')}</span>
              </div>

              <div className={styles.workflowSelect}>
                <label>{t('workflowTester.create.selectWorkflow')}</label>
                <select disabled>
                  <option value="">{t('workflowTester.create.selectPlaceholder')}</option>
                </select>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" disabled>
                <FiPlay />
                {t('workflowTester.create.start')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowTester;
