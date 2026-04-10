'use client';

import React from 'react';
import { useTranslation } from '@xgen/i18n';
import type { ExecutionLog } from '../../types';
import styles from './LogViewerModal.module.scss';

interface LogViewerModalProps {
  log: ExecutionLog | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}

const formatDuration = (ms?: number): string => {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

export const LogViewerModal: React.FC<LogViewerModalProps> = ({
  log,
  loading,
  error,
  onClose,
}) => {
  const { t } = useTranslation();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>{t('teams.logViewer.title')}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4L12 12M12 4L4 12" />
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          {loading && (
            <div className={styles.loading}>{t('teams.loading')}</div>
          )}

          {error && (
            <div className={styles.error}>{error}</div>
          )}

          {!loading && !error && log && (
            <>
              {/* Summary */}
              <div className={styles.summary}>
                <div className={styles.summaryItem}>
                  <p className={styles.summaryLabel}>{t('teams.logViewer.agent')}</p>
                  <p className={styles.summaryValue}>{log.agentName}</p>
                </div>
                <div className={styles.summaryItem}>
                  <p className={styles.summaryLabel}>{t('teams.logViewer.status')}</p>
                  <p className={styles.summaryValue}>
                    <span
                      className={`${styles.badge} ${
                        log.status === 'running'
                          ? styles.badgeRunning
                          : log.status === 'completed'
                          ? styles.badgeCompleted
                          : styles.badgeError
                      }`}
                    >
                      <span className={styles.badgeDot} />
                      {t(`teams.logViewer.${log.status}`)}
                    </span>
                  </p>
                </div>
                <div className={styles.summaryItem}>
                  <p className={styles.summaryLabel}>{t('teams.logViewer.duration')}</p>
                  <p className={styles.summaryValue}>{formatDuration(log.duration)}</p>
                </div>
                {log.tokenUsage && (
                  <div className={styles.summaryItem}>
                    <p className={styles.summaryLabel}>{t('teams.logViewer.tokens')}</p>
                    <p className={styles.summaryValue}>
                      {log.tokenUsage.total.toLocaleString()}
                      <span style={{ fontSize: 11, color: '#7a7f89', fontWeight: 400, marginLeft: 4 }}>
                        (in: {log.tokenUsage.input.toLocaleString()} / out: {log.tokenUsage.output.toLocaleString()})
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Timeline */}
              {log.nodeExecutions.length > 0 && (
                <div className={styles.timelineSection}>
                  <p className={styles.sectionTitle}>{t('teams.logViewer.timeline')}</p>
                  <div className={styles.timeline}>
                    {log.nodeExecutions.map((node) => (
                      <div
                        key={node.nodeId}
                        className={`${styles.timelineItem} ${
                          node.status === 'completed'
                            ? styles.timelineItemCompleted
                            : node.status === 'running'
                            ? styles.timelineItemRunning
                            : styles.timelineItemError
                        }`}
                      >
                        <p className={styles.timelineName}>{node.nodeName}</p>
                        <p className={styles.timelineStatus}>{node.status}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Logs */}
              {log.rawLogs.length > 0 && (
                <div className={styles.rawLogsSection}>
                  <p className={styles.sectionTitle}>{t('teams.logViewer.rawLogs')}</p>
                  <pre className={styles.rawLogs}>
                    {log.rawLogs.map((entry, i) =>
                      typeof entry === 'string' ? entry : JSON.stringify(entry, null, 2)
                    ).join('\n')}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
