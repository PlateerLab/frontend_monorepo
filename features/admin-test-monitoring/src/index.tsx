'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea, Button, StatCard, useToast } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import {
  FiActivity, FiFileText, FiPlay, FiCheckCircle, FiClock, FiRefreshCw,
} from '@xgen/icons';

import {
  getBatchSessions,
  getBatchResults,
  getActiveSessionsForUsers,
  cancelBatch,
  deleteBatch,
} from './api/batch-api';
import type { SessionWithResults, ActiveSession, BatchSession } from './types';
import ActiveBatchBanner from './components/active-batch-banner';
import SessionCard from './components/session-card';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const TM = 'admin.workflowManagement.testMonitoring';

function formatRelativeDate(
  dateString: string,
  t: (key: string, params?: Record<string, unknown>) => string,
): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return t(`${TM}.timeJustNow`);
  if (minutes < 60) return t(`${TM}.timeMinutes`, { count: minutes });
  if (hours < 24) return t(`${TM}.timeHours`, { count: hours });
  return t(`${TM}.timeDays`, { count: days });
}

// ─────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────

const AdminTestMonitoringPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const [sessions, setSessions] = useState<SessionWithResults[]>([]);
  const [isHealthy, setIsHealthy] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);

  // ── Health check ──
  const checkHealth = useCallback(async () => {
    try {
      await getBatchSessions(1, 1);
      setIsHealthy(true);
    } catch {
      setIsHealthy(false);
    }
  }, []);

  // ── Load active session (polling) ──
  const loadActiveSession = useCallback(async () => {
    try {
      const data = await getBatchSessions(1, 1);
      const accessibleUserIds: number[] = data.accessible_user_ids || [];
      const dbRunningSessions = (data.sessions || []).filter(
        (s: BatchSession) => s.status === 'running',
      );

      // Try Redis first
      if (accessibleUserIds.length > 0) {
        try {
          const activeData = await getActiveSessionsForUsers(accessibleUserIds);
          const activeSessions = activeData.active_sessions || [];
          if (activeSessions.length > 0) {
            const s = activeSessions[0];
            setActiveSession({
              is_running: true,
              batch_id: s.batch_id,
              workflow_name: s.workflow_name,
              completed_count: s.completed_count,
              total_count: s.total_count,
              progress: s.progress,
            });
            return;
          }
        } catch {
          // Fallback to DB
        }
      }

      // Fallback to DB running sessions
      if (dbRunningSessions.length > 0) {
        const s = dbRunningSessions[0];
        setActiveSession({
          is_running: true,
          batch_id: s.batch_id,
          workflow_name: s.workflow_name,
          completed_count: s.completed_count,
          total_count: s.total_count,
          progress: s.progress,
        });
      } else {
        setActiveSession({
          is_running: false,
          batch_id: null,
          workflow_name: null,
          completed_count: 0,
          total_count: 0,
          progress: 0,
        });
      }
    } catch {
      // Silently fail
    }
  }, []);

  // ── Load sessions ──
  const loadSessions = useCallback(async () => {
    try {
      setIsLoadingSessions(true);
      const data = await getBatchSessions(1, 50);
      const dbSessions: SessionWithResults[] = (data.sessions || []).map(
        (s: BatchSession) => ({
          ...s,
          results: undefined,
          resultsLoading: false,
          resultsExpanded: false,
        }),
      );

      // Merge Redis active sessions
      const accessibleUserIds: number[] = data.accessible_user_ids || [];
      let runningSessions: SessionWithResults[] = [];

      if (accessibleUserIds.length > 0) {
        try {
          const activeData = await getActiveSessionsForUsers(accessibleUserIds);
          runningSessions = (activeData.active_sessions || []).map(
            (s: BatchSession) => ({
              ...s,
              id: 0,
              config_data: '{}',
              completed_at: null,
              error_message: null,
              results: undefined,
              resultsLoading: false,
              resultsExpanded: false,
            }),
          );
        } catch {
          // Silently fail
        }
      }

      // Deduplicate: running sessions first, then DB sessions
      const dbBatchIds = new Set(dbSessions.map((s) => s.batch_id));
      const uniqueRunning = runningSessions.filter((s) => !dbBatchIds.has(s.batch_id));
      setSessions([...uniqueRunning, ...dbSessions]);
      setLastUpdated(new Date());
    } catch {
      toast.error(t(`${TM}.loadError`) || 'Failed to load sessions');
    } finally {
      setIsLoadingSessions(false);
    }
  }, [t, toast]);

  // ── Effects ──
  useEffect(() => {
    if (!isAuthenticated) return;
    checkHealth();
    const interval = setInterval(checkHealth, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, checkHealth]);

  useEffect(() => {
    if (isHealthy && isAuthenticated) {
      loadSessions();
      loadActiveSession();
    }
  }, [isHealthy, isAuthenticated, loadSessions, loadActiveSession]);

  useEffect(() => {
    if (isHealthy && isAuthenticated) {
      const interval = setInterval(loadActiveSession, 5_000);
      return () => clearInterval(interval);
    }
  }, [isHealthy, isAuthenticated, loadActiveSession]);

  // ── Toggle results ──
  const handleToggleResults = useCallback(
    async (batchId: string) => {
      const session = sessions.find((s) => s.batch_id === batchId);
      if (!session) return;

      if (session.resultsExpanded) {
        setSessions((prev) =>
          prev.map((s) =>
            s.batch_id === batchId ? { ...s, resultsExpanded: false } : s,
          ),
        );
        return;
      }

      if (!session.results) {
        setSessions((prev) =>
          prev.map((s) =>
            s.batch_id === batchId ? { ...s, resultsLoading: true } : s,
          ),
        );
        try {
          const data = await getBatchResults(batchId);
          setSessions((prev) =>
            prev.map((s) =>
              s.batch_id === batchId
                ? { ...s, results: data.results || [], resultsLoading: false, resultsExpanded: true }
                : s,
            ),
          );
        } catch {
          toast.error(t(`${TM}.noResults`));
          setSessions((prev) =>
            prev.map((s) =>
              s.batch_id === batchId ? { ...s, resultsLoading: false } : s,
            ),
          );
        }
      } else {
        setSessions((prev) =>
          prev.map((s) =>
            s.batch_id === batchId ? { ...s, resultsExpanded: true } : s,
          ),
        );
      }
    },
    [sessions, t, toast],
  );

  // ── Cancel batch ──
  const handleCancel = useCallback(
    async (batchId: string) => {
      const confirmed = await toast.confirm({
        title: t(`${TM}.cancel`),
        message: t(`${TM}.cancelConfirm`),
        variant: 'warning',
      });
      if (!confirmed) return;

      const loadingId = toast.loading(t(`${TM}.cancelling`));
      try {
        await cancelBatch(batchId);
        toast.dismiss(loadingId);
        toast.success(t(`${TM}.cancelled`));
        await loadSessions();
      } catch {
        toast.dismiss(loadingId);
        toast.error(t(`${TM}.cancelled`));
      }
    },
    [t, toast, loadSessions],
  );

  // ── Delete batch ──
  const handleDelete = useCallback(
    async (batchId: string) => {
      const confirmed = await toast.confirm({
        title: t(`${TM}.deleteBatchTitle`),
        message: t(`${TM}.deleteBatchMessage`),
        variant: 'danger',
      });
      if (!confirmed) return;

      try {
        await deleteBatch(batchId);
        toast.success(t(`${TM}.deleteBatchSuccess`));
        await loadSessions();
      } catch {
        toast.error(t(`${TM}.deleteBatchError`));
      }
    },
    [t, toast, loadSessions],
  );

  // ── Render ──
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-border pb-4">
          <div className="flex items-center gap-3">
            <FiActivity className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">{t(`${TM}.title`)}</h1>
              <p className="text-sm text-muted-foreground">{t(`${TM}.subtitle`)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1">
              <span
                className={`h-2 w-2 rounded-full ${isHealthy ? 'bg-success shadow-[0_0_8px_rgba(46,177,70,0.5)]' : 'bg-destructive shadow-[0_0_8px_rgba(224,49,49,0.5)]'}`}
              />
              <span className="text-xs font-medium text-muted-foreground">
                {isHealthy ? t(`${TM}.apiConnected`) : t(`${TM}.apiDisconnected`)}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!isHealthy}
              loading={isLoadingSessions}
              onClick={loadSessions}
            >
              <FiRefreshCw className="mr-1 h-4 w-4" />
              {t(`${TM}.refreshSessions`)}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<FiFileText className="h-6 w-6" />}
            label={t(`${TM}.totalSessions`)}
            value={sessions.length}
            variant="info"
          />
          <StatCard
            icon={<FiPlay className="h-6 w-6" />}
            label={t(`${TM}.running`)}
            value={activeSession?.is_running ? 1 : 0}
            variant={activeSession?.is_running ? 'success' : 'neutral'}
          />
          <StatCard
            icon={<FiCheckCircle className="h-6 w-6" />}
            label={t(`${TM}.completed`)}
            value={sessions.filter((s) => s.status === 'completed').length}
            variant="success"
          />
          <StatCard
            icon={<FiClock className="h-6 w-6" />}
            label={t(`${TM}.lastUpdate`)}
            value={lastUpdated ? formatRelativeDate(lastUpdated.toISOString(), t) : '-'}
            variant="neutral"
          />
        </div>

        {/* Active batch banner */}
        {activeSession?.is_running && (
          <ActiveBatchBanner
            session={activeSession}
            runningLabel={t(`${TM}.batchRunning`)}
          />
        )}

        {/* Sessions list */}
        <div className="min-h-[400px] rounded-lg border border-border bg-card p-4">
          {isLoadingSessions && sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FiRefreshCw className="mb-3 h-10 w-10 animate-spin" />
              <p className="text-sm">{t(`${TM}.loadingSessions`)}</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FiFileText className="mb-3 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-base font-semibold text-foreground/70">
                {t(`${TM}.noSessions`)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t(`${TM}.noSessionsDescription`)}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {sessions.map((session) => (
                <SessionCard
                  key={session.batch_id}
                  session={session}
                  t={t}
                  formatDate={(d) => formatRelativeDate(d, t)}
                  onToggleResults={handleToggleResults}
                  onCancel={handleCancel}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Module
// ─────────────────────────────────────────────────────────────

const feature: AdminFeatureModule = {
  id: 'admin-test-monitoring',
  name: 'AdminTestMonitoringPage',
  adminSection: 'admin-workflow',
  routes: {
    'admin-test-monitoring': AdminTestMonitoringPage,
  },
};

export default feature;
