'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { WorkflowSchedule, ScheduleStatus, CardBadge } from '@xgen/types';
import { Button, ResourceCardGrid, EmptyState } from '@xgen/ui';
import { FiFolder, FiPlay, FiPause, FiTrash2, FiRefreshCw, FiPlus, FiClock, FiCalendar, FiCheckSquare, FiAlertCircle } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import { listWorkflowSchedules, createWorkflowSchedule, deleteWorkflowSchedule, toggleWorkflowSchedule } from '../api';
import styles from '../styles/workflow-scheduler.module.scss';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type ScheduleFilterStatus = 'all' | 'active' | 'paused' | 'completed' | 'failed';

interface WorkflowSchedulerProps {
  className?: string;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const STATUS_BADGE_MAP: Record<ScheduleStatus, { text: string; variant: CardBadge['variant'] }> = {
  pending: { text: 'PENDING', variant: 'warning' },
  active: { text: 'ACTIVE', variant: 'success' },
  paused: { text: 'PAUSED', variant: 'secondary' },
  completed: { text: 'COMPLETED', variant: 'info' },
  failed: { text: 'FAILED', variant: 'error' },
  cancelled: { text: 'CANCELLED', variant: 'secondary' },
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

function formatScheduleType(type: string): string {
  const typeMap: Record<string, string> = {
    daily: '매일',
    weekly: '매주',
    monthly: '매월',
    cron: 'Cron',
    interval: '간격',
    once: '한번',
  };
  return typeMap[type] || type;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const WorkflowScheduler: React.FC<WorkflowSchedulerProps> = ({ className }) => {
  const { t } = useTranslation();
  const { user, isInitialized } = useAuth();

  // State
  const [schedules, setSchedules] = useState<WorkflowSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ScheduleFilterStatus>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Load schedules
  const fetchSchedules = useCallback(async () => {
    if (!isInitialized) return;

    try {
      setLoading(true);
      setError(null);
      const data = await listWorkflowSchedules();
      setSchedules(data);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
      setError(t('workflowScheduler.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [isInitialized, t]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Filter schedules
  const filteredSchedules = useMemo(() => {
    if (filterStatus === 'all') return schedules;
    return schedules.filter((s) => s.status === filterStatus);
  }, [schedules, filterStatus]);

  // Handlers
  const handleToggle = useCallback(
    async (schedule: WorkflowSchedule) => {
      try {
        const newEnabled = schedule.status !== 'active';
        await toggleWorkflowSchedule(schedule.sessionId, newEnabled);
        await fetchSchedules();
      } catch (err) {
        console.error('Failed to toggle schedule:', err);
      }
    },
    [fetchSchedules]
  );

  const handleDelete = useCallback(
    async (schedule: WorkflowSchedule) => {
      if (!confirm(t('workflowScheduler.confirm.delete', { name: schedule.name }))) return;

      try {
        await deleteWorkflowSchedule(schedule.sessionId);
        await fetchSchedules();
      } catch (err) {
        console.error('Failed to delete schedule:', err);
      }
    },
    [fetchSchedules, t]
  );

  const handleCreateClick = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  // Build card items
  const cardItems = useMemo(() => {
    return filteredSchedules.map((schedule) => {
      const statusBadge = STATUS_BADGE_MAP[schedule.status];
      const badges: CardBadge[] = statusBadge ? [statusBadge] : [];

      // Schedule type badge
      badges.push({
        text: formatScheduleType(schedule.scheduleType),
        variant: 'secondary',
      });

      const isActive = schedule.status === 'active';
      const isPaused = schedule.status === 'paused';
      const canToggle = isActive || isPaused;

      return {
        id: schedule.sessionId,
        data: schedule,
        title: schedule.name,
        description: schedule.description || t('workflowScheduler.card.noDescription'),
        thumbnail: {
          icon: <FiClock />,
          backgroundColor: isActive ? 'rgba(46, 177, 70, 0.1)' : 'rgba(120, 60, 237, 0.1)',
          iconColor: isActive ? '#2eb146' : '#783ced',
        },
        badges,
        metadata: [
          { icon: <FiFolder />, value: schedule.workflowName },
          { icon: <FiCheckSquare />, value: `${schedule.successfulExecutions}/${schedule.totalExecutions}` },
          ...(schedule.nextExecutionAt
            ? [{ icon: <FiCalendar />, value: formatDate(schedule.nextExecutionAt) }]
            : []),
          ...(schedule.lastExecutionAt
            ? [{ icon: <FiClock />, value: formatDate(schedule.lastExecutionAt) }]
            : []),
        ],
        primaryActions: canToggle
          ? [
              {
                id: 'toggle',
                icon: isActive ? <FiPause /> : <FiPlay />,
                label: isActive ? t('workflowScheduler.actions.pause') : t('workflowScheduler.actions.resume'),
                onClick: () => handleToggle(schedule),
              },
            ]
          : [],
        dropdownActions: [
          {
            id: 'delete',
            icon: <FiTrash2 />,
            label: t('workflowScheduler.actions.delete'),
            onClick: () => handleDelete(schedule),
            danger: true,
          },
        ],
        onClick: () => {},
      };
    });
  }, [filteredSchedules, handleToggle, handleDelete, t]);

  // Filter tabs
  const filterTabs = [
    { key: 'all', label: t('workflowScheduler.filter.all') },
    { key: 'active', label: t('workflowScheduler.filter.active') },
    { key: 'paused', label: t('workflowScheduler.filter.paused') },
    { key: 'completed', label: t('workflowScheduler.filter.completed') },
    { key: 'failed', label: t('workflowScheduler.filter.failed') },
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
                onClick={() => setFilterStatus(tab.key as ScheduleFilterStatus)}
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
            title={t('workflowScheduler.create')}
          >
            <FiPlus />
            {t('workflowScheduler.create')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchSchedules}
            disabled={loading}
            title={t('workflowScheduler.refresh')}
          >
            <FiRefreshCw className={loading ? styles.spinning : ''} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {!isInitialized ? (
          <div className={styles.loadingState}>
            <p>{t('workflowScheduler.loading')}</p>
          </div>
        ) : error ? (
          <EmptyState
            icon={<FiAlertCircle />}
            title={t('workflowScheduler.error.title')}
            description={error}
            action={{
              label: t('workflowScheduler.buttons.retry'),
              onClick: fetchSchedules,
            }}
          />
        ) : (
          <ResourceCardGrid
            items={cardItems}
            loading={loading}
            showEmptyState
            emptyStateProps={{
              icon: <FiClock />,
              title: t('workflowScheduler.empty.title'),
              description: t('workflowScheduler.empty.description'),
              action: {
                label: t('workflowScheduler.empty.action'),
                onClick: handleCreateClick,
              },
            }}
          />
        )}
      </div>

      {/* TODO: Create Schedule Modal */}
      {isCreateModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCreateModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>{t('workflowScheduler.create.title')}</h3>
            <p>{t('workflowScheduler.create.description')}</p>
            <Button variant="primary" onClick={() => setIsCreateModalOpen(false)}>
              {t('common.close')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowScheduler;
