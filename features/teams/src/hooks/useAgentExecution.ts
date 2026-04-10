'use client';

import { useState, useCallback } from 'react';
import type { ExecutionLog } from '../types';
import * as teamsApi from '../api/teams-api';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface UseAgentExecutionReturn {
  executionLog: ExecutionLog | null;
  logLoading: boolean;
  logError: string | null;
  showLogViewer: boolean;
  openLog: (executionId: string) => Promise<void>;
  closeLog: () => void;
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

export function useAgentExecution(): UseAgentExecutionReturn {
  const [executionLog, setExecutionLog] = useState<ExecutionLog | null>(null);
  const [logLoading, setLogLoading] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const [showLogViewer, setShowLogViewer] = useState(false);

  const openLog = useCallback(async (executionId: string) => {
    setLogLoading(true);
    setLogError(null);
    setShowLogViewer(true);

    try {
      const log = await teamsApi.fetchExecutionLog(executionId);
      setExecutionLog(log);
    } catch (err: any) {
      setLogError(err.message || 'Failed to load execution log');
    } finally {
      setLogLoading(false);
    }
  }, []);

  const closeLog = useCallback(() => {
    setShowLogViewer(false);
    setExecutionLog(null);
    setLogError(null);
  }, []);

  return {
    executionLog,
    logLoading,
    logError,
    showLogViewer,
    openLog,
    closeLog,
  };
}
