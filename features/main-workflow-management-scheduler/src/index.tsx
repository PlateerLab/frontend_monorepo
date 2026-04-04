'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { WorkflowSchedule, ScheduleStatus, CardBadge, WorkflowTabPlugin, WorkflowTabPluginProps } from '@xgen/types';
import { Button, ResourceCardGrid, EmptyState, FilterTabs, Modal, Input, Label, Textarea, Switch, Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@xgen/ui';
import { FiFolder, FiPlay, FiPause, FiTrash2, FiRefreshCw, FiPlus, FiClock, FiCalendar, FiCheckSquare, FiAlertCircle } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import { listWorkflowSchedules, deleteWorkflowSchedule, toggleWorkflowSchedule } from './api';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type ScheduleFilterStatus = 'all' | 'active' | 'paused' | 'completed' | 'failed';

export interface WorkflowSchedulerProps extends WorkflowTabPluginProps {
  className?: string;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const STATUS_BADGE_MAP: Record<ScheduleStatus, { textKey: string; variant: CardBadge['variant'] }> = {
  active: { textKey: 'workflows.scheduler.filter.active', variant: 'success' },
  paused: { textKey: 'workflows.scheduler.filter.paused', variant: 'secondary' },
  completed: { textKey: 'workflows.scheduler.filter.completed', variant: 'info' },
  failed: { textKey: 'workflows.scheduler.filter.failed', variant: 'error' },
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

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const WorkflowScheduler: React.FC<WorkflowSchedulerProps> = ({ className, onSubToolbarChange }) => {
  const { t } = useTranslation();
  const { user, isInitialized } = useAuth();

  // State
  const [schedules, setSchedules] = useState<WorkflowSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ScheduleFilterStatus>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newScheduleName, setNewScheduleName] = useState('');
  const [newScheduleDesc, setNewScheduleDesc] = useState('');
  const [newScheduleType, setNewScheduleType] = useState('daily');
  const [newScheduleCron, setNewScheduleCron] = useState('');
  const [newScheduleAutoStart, setNewScheduleAutoStart] = useState(true);
  const [creating, setCreating] = useState(false);

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
      setError(t('workflows.scheduler.error.loadFailed'));
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
        await toggleWorkflowSchedule(schedule.id, newEnabled);
        await fetchSchedules();
      } catch (err) {
        console.error('Failed to toggle schedule:', err);
      }
    },
    [fetchSchedules]
  );

  const handleDelete = useCallback(
    async (schedule: WorkflowSchedule) => {
      if (!confirm(t('workflows.scheduler.confirm.delete', { name: schedule.name }))) return;

      try {
        await deleteWorkflowSchedule(schedule.id);
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

  const handleCreateSubmit = useCallback(async () => {
    if (!newScheduleName.trim()) return;
    setCreating(true);
    try {
      // TODO: API call to create schedule
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsCreateModalOpen(false);
      setNewScheduleName('');
      setNewScheduleDesc('');
      setNewScheduleType('daily');
      setNewScheduleCron('');
      setNewScheduleAutoStart(true);
      await fetchSchedules();
    } catch (err) {
      console.error('Failed to create schedule:', err);
    } finally {
      setCreating(false);
    }
  }, [newScheduleName, fetchSchedules]);

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setNewScheduleName('');
    setNewScheduleDesc('');
    setNewScheduleType('daily');
    setNewScheduleCron('');
    setNewScheduleAutoStart(true);
  }, []);

  // Build card items
  const cardItems = useMemo(() => {
    return filteredSchedules.map((schedule) => {
      const statusBadge = STATUS_BADGE_MAP[schedule.status];
      const badges: CardBadge[] = statusBadge ? [{ text: t(statusBadge.textKey), variant: statusBadge.variant }] : [];

      const frequencyKey = `workflows.scheduler.frequency.${schedule.frequency}`;
      badges.push({
        text: t(frequencyKey) !== frequencyKey ? t(frequencyKey) : schedule.frequency,
        variant: 'secondary',
      });

      const isActive = schedule.status === 'active';
      const isPaused = schedule.status === 'paused';
      const canToggle = isActive || isPaused;

      return {
        id: schedule.id.toString(),
        data: schedule,
        title: schedule.name,
        description: schedule.description || t('workflows.scheduler.card.noDescription'),
        thumbnail: {
          icon: <FiClock />,
          backgroundColor: isActive ? 'rgba(46, 177, 70, 0.1)' : 'rgba(120, 60, 237, 0.1)',
          iconColor: isActive ? '#2eb146' : '#783ced',
        },
        badges,
        metadata: [
          { icon: <FiFolder />, value: schedule.workflowName },
          { icon: <FiCheckSquare />, value: `${t('workflows.scheduler.fields.runCount')}: ${schedule.runCount}` },
          ...(schedule.nextRunAt
            ? [{ icon: <FiCalendar />, value: formatDate(schedule.nextRunAt) }]
            : []),
          ...(schedule.lastRunAt
            ? [{ icon: <FiClock />, value: formatDate(schedule.lastRunAt) }]
            : []),
        ],
        primaryActions: canToggle
          ? [
              {
                id: 'toggle',
                icon: isActive ? <FiPause /> : <FiPlay />,
                label: isActive ? t('workflows.scheduler.actions.pause') : t('workflows.scheduler.actions.resume'),
                onClick: () => handleToggle(schedule),
              },
            ]
          : [],
        dropdownActions: [
          {
            id: 'delete',
            icon: <FiTrash2 />,
            label: t('workflows.scheduler.actions.delete'),
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
    { key: 'all', label: t('workflows.scheduler.filter.all') },
    { key: 'active', label: t('workflows.scheduler.filter.active') },
    { key: 'paused', label: t('workflows.scheduler.filter.paused') },
    { key: 'completed', label: t('workflows.scheduler.filter.completed') },
    { key: 'failed', label: t('workflows.scheduler.filter.failed') },
  ];

  // Push subToolbar content to orchestrator
  useEffect(() => {
    onSubToolbarChange?.(
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <FilterTabs
            tabs={filterTabs}
            activeKey={filterStatus}
            onChange={(key) => setFilterStatus(key as ScheduleFilterStatus)}
            variant="underline"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateClick}
            title={t('workflows.scheduler.create')}
          >
            <FiPlus />
            {t('workflows.scheduler.create')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchSchedules}
            disabled={loading}
            title={t('workflows.scheduler.refresh')}
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>
    );
  }, [onSubToolbarChange, filterStatus, loading, handleCreateClick, fetchSchedules, t]);

  // Cleanup subToolbar on unmount
  useEffect(() => {
    return () => { onSubToolbarChange?.(null); };
  }, [onSubToolbarChange]);

  return (
    <div className={`flex flex-col flex-1 min-h-0 p-6 ${className || ''}`}>
      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {!isInitialized ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
            <p>{t('workflows.scheduler.loading')}</p>
          </div>
        ) : error ? (
          <EmptyState
            icon={<FiAlertCircle />}
            title={t('workflows.scheduler.error.title')}
            description={error}
            action={{
              label: t('workflows.scheduler.buttons.retry'),
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
              title: t('workflows.scheduler.empty.title'),
              description: t('workflows.scheduler.empty.description'),
              action: {
                label: t('workflows.scheduler.empty.action'),
                onClick: handleCreateClick,
              },
            }}
          />
        )}
      </div>

      {/* Create Schedule Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        title={t('workflows.scheduler.createModal.title')}
        size="md"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCloseCreateModal}>
              {t('workflows.scheduler.createModal.cancel')}
            </Button>
            <Button onClick={handleCreateSubmit} disabled={creating || !newScheduleName.trim()}>
              {creating ? t('workflows.scheduler.createModal.creating') : t('workflows.scheduler.createModal.create')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('workflows.scheduler.createModal.description')}</p>

          <div className="space-y-2">
            <Label>{t('workflows.scheduler.createModal.name')}</Label>
            <Input
              value={newScheduleName}
              onChange={(e) => setNewScheduleName(e.target.value)}
              placeholder={t('workflows.scheduler.createModal.namePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('workflows.scheduler.createModal.scheduleDescription')}</Label>
            <Textarea
              value={newScheduleDesc}
              onChange={(e) => setNewScheduleDesc(e.target.value)}
              placeholder={t('workflows.scheduler.createModal.scheduleDescriptionPlaceholder')}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('workflows.scheduler.createModal.scheduleType')}</Label>
            <Select value={newScheduleType} onValueChange={setNewScheduleType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">{t('workflows.scheduler.frequency.once')}</SelectItem>
                <SelectItem value="hourly">{t('workflows.scheduler.frequency.hourly')}</SelectItem>
                <SelectItem value="daily">{t('workflows.scheduler.frequency.daily')}</SelectItem>
                <SelectItem value="weekly">{t('workflows.scheduler.frequency.weekly')}</SelectItem>
                <SelectItem value="monthly">{t('workflows.scheduler.frequency.monthly')}</SelectItem>
                <SelectItem value="cron">{t('workflows.scheduler.frequency.cron')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {newScheduleType === 'cron' && (
            <div className="space-y-2">
              <Label>{t('workflows.scheduler.createModal.cronExpression')}</Label>
              <Input
                value={newScheduleCron}
                onChange={(e) => setNewScheduleCron(e.target.value)}
                placeholder={t('workflows.scheduler.createModal.cronExpressionPlaceholder')}
              />
              <p className="text-xs text-muted-foreground">{t('workflows.scheduler.createModal.cronHint')}</p>
            </div>
          )}

          <div className="flex items-center justify-between py-2">
            <div>
              <Label>{t('workflows.scheduler.createModal.autoStart')}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t('workflows.scheduler.createModal.autoStartDesc')}</p>
            </div>
            <Switch checked={newScheduleAutoStart} onCheckedChange={setNewScheduleAutoStart} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkflowScheduler;

export const workflowSchedulerPlugin: WorkflowTabPlugin = {
  id: 'scheduler',
  name: 'Workflow Scheduler',
  tabLabelKey: 'workflows.tabs.scheduler',
  order: 3,
  component: WorkflowScheduler,
};
