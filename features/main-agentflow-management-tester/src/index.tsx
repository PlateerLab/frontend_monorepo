'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { CardBadge, AgentflowTabPlugin, AgentflowTabPluginProps } from '@xgen/types';
import { Button, EmptyState, FilterTabs } from '@xgen/ui';
import { FiPlay, FiRefreshCw, FiPlus, FiClock, FiCheckCircle, FiAlertCircle, FiUpload } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import { listBatchHistory, cancelBatch, deleteBatch } from './api';
import type { BatchSession } from './api';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type TesterFilterStatus = 'all' | 'running' | 'completed' | 'error';

export interface AgentflowTesterProps extends AgentflowTabPluginProps {
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

export const AgentflowTester: React.FC<AgentflowTesterProps> = ({ className, onSubToolbarChange }) => {
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
      setError(t('agentflows.tester.error.loadFailed'));
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
    { key: 'all', label: t('agentflows.tester.filter.all') },
    { key: 'running', label: t('agentflows.tester.filter.running') },
    { key: 'completed', label: t('agentflows.tester.filter.completed') },
    { key: 'error', label: t('agentflows.tester.filter.error') },
  ];

  // Push subToolbar content to orchestrator
  useEffect(() => {
    onSubToolbarChange?.(
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <FilterTabs
            tabs={filterTabs}
            activeKey={filterStatus}
            onChange={(key) => setFilterStatus(key as TesterFilterStatus)}
            variant="underline"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateClick}
            title={t('agentflows.tester.newTest')}
          >
            <FiPlus />
            {t('agentflows.tester.newTest')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchSessions}
            disabled={loading}
            title={t('agentflows.tester.refresh')}
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>
    );
  }, [onSubToolbarChange, filterStatus, loading, handleCreateClick, fetchSessions, t]);

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
            <p>{t('agentflows.tester.loading')}</p>
          </div>
        ) : error ? (
          <EmptyState
            icon={<FiAlertCircle />}
            title={t('agentflows.tester.error.title')}
            description={error}
            action={{
              label: t('agentflows.tester.buttons.retry'),
              onClick: fetchSessions,
            }}
          />
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 [&_svg]:w-8 [&_svg]:h-8 [&_svg]:text-primary">
              <FiPlay />
            </div>
            <h3 className="m-0 mb-2 text-lg font-semibold text-foreground">{t('agentflows.tester.empty.title')}</h3>
            <p className="m-0 mb-8 text-sm text-muted-foreground max-w-[400px]">{t('agentflows.tester.empty.description')}</p>

            <div className="flex flex-col gap-4 mb-8 max-w-[400px] w-full">
              <div className="flex items-start gap-4 text-left">
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold shrink-0">1</div>
                <div className="flex-1 [&_h4]:m-0 [&_h4]:mb-1 [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:text-foreground [&_p]:m-0 [&_p]:text-[13px] [&_p]:text-muted-foreground">
                  <h4>{t('agentflows.tester.steps.selectAgentflow')}</h4>
                  <p>{t('agentflows.tester.steps.selectAgentflowDesc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 text-left">
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold shrink-0">2</div>
                <div className="flex-1 [&_h4]:m-0 [&_h4]:mb-1 [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:text-foreground [&_p]:m-0 [&_p]:text-[13px] [&_p]:text-muted-foreground">
                  <h4>{t('agentflows.tester.steps.uploadFile')}</h4>
                  <p>{t('agentflows.tester.steps.uploadFileDesc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 text-left">
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold shrink-0">3</div>
                <div className="flex-1 [&_h4]:m-0 [&_h4]:mb-1 [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:text-foreground [&_p]:m-0 [&_p]:text-[13px] [&_p]:text-muted-foreground">
                  <h4>{t('agentflows.tester.steps.runTest')}</h4>
                  <p>{t('agentflows.tester.steps.runTestDesc')}</p>
                </div>
              </div>
            </div>

            <Button variant="primary" onClick={handleCreateClick}>
              <FiPlus />
              {t('agentflows.tester.empty.action')}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredSessions.map((session) => (
              <div key={session.batchId} className="bg-white border border-border rounded-xl p-6 transition-all duration-150 hover:border-primary hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h4 className="m-0 text-[15px] font-semibold text-foreground">{session.workflowName}</h4>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                      session.status === 'running' ? 'bg-primary/10 text-primary' :
                      session.status === 'success' ? 'bg-green-500/10 text-green-500' :
                      session.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {STATUS_BADGE_MAP[session.status]?.text || session.status}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(session.createdAt)}</span>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 h-2 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-primary rounded transition-[width] duration-300 ease-out"
                      style={{ width: `${session.progress}%` }}
                    />
                  </div>
                  <span className="text-[13px] font-medium text-muted-foreground min-w-[80px] text-right">
                    {session.completedCount}/{session.totalCount} ({formatProgress(session.completedCount, session.totalCount)})
                  </span>
                </div>

                <div className="flex gap-6">
                  <div className="flex items-center gap-1 text-[13px] text-muted-foreground">
                    <FiCheckCircle className="text-green-500" />
                    <span>{session.successCount}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[13px] text-muted-foreground">
                    <FiAlertCircle className="text-red-500" />
                    <span>{session.errorCount}</span>
                  </div>
                  {session.status === 'running' && (
                    <Button variant="outline" size="sm" onClick={() => handleCancelBatch(session.batchId)}>
                      {t('agentflows.tester.actions.cancel')}
                    </Button>
                  )}
                  {(session.status === 'success' || session.status === 'failed') && (
                    <Button variant="outline" size="sm" onClick={() => handleDeleteBatch(session.batchId)}>
                      {t('agentflows.tester.actions.delete')}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={() => setIsCreateModalOpen(false)}>
          <div className="bg-white rounded-xl max-w-[600px] w-[90%] max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border [&_h3]:m-0 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground">
              <h3>{t('agentflows.tester.create.title')}</h3>
              <button className="w-8 h-8 border-none bg-transparent text-2xl text-muted-foreground cursor-pointer rounded transition-all duration-150 hover:bg-muted hover:text-foreground" onClick={() => setIsCreateModalOpen(false)}>
                ×
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer transition-all duration-150 hover:border-primary hover:bg-primary/[0.02] [&_p]:mt-4 [&_p]:mb-2 [&_p]:text-[15px] [&_p]:font-medium [&_p]:text-foreground">
                <FiUpload className="w-12 h-12 text-primary" />
                <p>{t('agentflows.tester.create.uploadPrompt')}</p>
                <span className="text-[13px] text-muted-foreground">{t('agentflows.tester.create.uploadHint')}</span>
              </div>

              <div className="mt-6 [&_label]:block [&_label]:mb-2 [&_label]:text-sm [&_label]:font-medium [&_label]:text-foreground [&_select]:w-full [&_select]:py-2.5 [&_select]:px-3 [&_select]:border [&_select]:border-border [&_select]:rounded-lg [&_select]:text-sm [&_select]:text-foreground [&_select]:bg-white [&_select]:cursor-pointer [&_select:focus]:outline-none [&_select:focus]:border-primary [&_select:disabled]:bg-muted [&_select:disabled]:cursor-not-allowed">
                <label>{t('agentflows.tester.create.selectAgentflow')}</label>
                <select disabled>
                  <option value="">{t('agentflows.tester.create.selectPlaceholder')}</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end p-6 border-t border-border">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" disabled>
                <FiPlay />
                {t('agentflows.tester.create.start')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentflowTester;

export const agentflowTesterPlugin: AgentflowTabPlugin = {
  id: 'tester',
  name: 'Agentflow Tester',
  tabLabelKey: 'agentflows.tabs.tester',
  order: 4,
  component: AgentflowTester,
};
