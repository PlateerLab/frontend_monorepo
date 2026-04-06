'use client';

import { createApiClient } from '@xgen/api-client';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type DocScheduleType = 'once' | 'interval' | 'daily' | 'weekly' | 'cron';
export type DocJobStatus = 'draft' | 'pending' | 'active' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface ScheduleConfig {
  hour?: number;
  minute?: number;
  interval_seconds?: number;
  cron_expression?: string;
  weekdays?: number[];
  start_time?: string;
  end_time?: string;
  max_executions?: number;
}

export interface DocJob {
  id?: number;
  userId?: number;
  connectionId: number;
  connectionName: string;
  jobName: string;
  description?: string;
  query: string;
  targetCollection: string;
  scheduleType: DocScheduleType;
  scheduleConfig: ScheduleConfig;
  status: DocJobStatus;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  lastExecutionAt?: string;
  nextExecutionAt?: string;
  createdAt?: string;
  updatedAt?: string;
  username?: string;
  fullName?: string;
}

export interface ExecutionLog {
  id: number;
  jobId: number;
  status: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  rowsProcessed?: number;
  documentsCreated?: number;
  executionTimeSeconds?: number;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  error?: string;
}

// ─────────────────────────────────────────────────────────────
// API Response → Frontend Transform
// ─────────────────────────────────────────────────────────────

interface DocJobAPIResponse {
  id?: number;
  user_id?: number;
  connection_id: number;
  connection_name: string;
  job_name: string;
  description?: string;
  query: string;
  target_collection: string;
  schedule_type: string;
  schedule_config: ScheduleConfig | string;
  status: string;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  last_execution_at?: string;
  next_execution_at?: string;
  created_at?: string;
  updated_at?: string;
  username?: string;
  full_name?: string;
}

interface ExecutionLogAPIResponse {
  id: number;
  job_id: number;
  status: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  rows_processed?: number;
  documents_created?: number;
  execution_time_seconds?: number;
}

function transformDocJob(raw: DocJobAPIResponse): DocJob {
  const cfg = typeof raw.schedule_config === 'string'
    ? JSON.parse(raw.schedule_config)
    : raw.schedule_config || {};
  return {
    id: raw.id,
    userId: raw.user_id,
    connectionId: raw.connection_id,
    connectionName: raw.connection_name,
    jobName: raw.job_name,
    description: raw.description,
    query: raw.query,
    targetCollection: raw.target_collection,
    scheduleType: raw.schedule_type as DocScheduleType,
    scheduleConfig: cfg,
    status: raw.status as DocJobStatus,
    totalExecutions: raw.total_executions ?? 0,
    successfulExecutions: raw.successful_executions ?? 0,
    failedExecutions: raw.failed_executions ?? 0,
    lastExecutionAt: raw.last_execution_at,
    nextExecutionAt: raw.next_execution_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    username: raw.username,
    fullName: raw.full_name,
  };
}

function transformLog(raw: ExecutionLogAPIResponse): ExecutionLog {
  return {
    id: raw.id,
    jobId: raw.job_id,
    status: raw.status,
    startedAt: raw.started_at,
    completedAt: raw.completed_at,
    errorMessage: raw.error_message,
    rowsProcessed: raw.rows_processed,
    documentsCreated: raw.documents_created,
    executionTimeSeconds: raw.execution_time_seconds,
  };
}

// ─────────────────────────────────────────────────────────────
// Query Execution (Preview)
// ─────────────────────────────────────────────────────────────

export async function executeDocQuery(
  connectionId: number,
  query: string,
  maxRows = 100,
): Promise<QueryResult> {
  const api = createApiClient();
  const response = await api.post<{
    success: boolean;
    columns?: string[];
    rows?: Record<string, unknown>[];
    row_count?: number;
    error?: string;
  }>('/api/workflow/db-connection/doc/query/execute', {
    connection_id: connectionId,
    query,
    max_rows: maxRows,
  });
  const d = response.data;
  if (d.success) {
    return {
      columns: d.columns || [],
      rows: d.rows || [],
      rowCount: d.row_count ?? d.rows?.length ?? 0,
    };
  }
  return { columns: [], rows: [], rowCount: 0, error: d.error || 'Query failed' };
}

// ─────────────────────────────────────────────────────────────
// Job CRUD
// ─────────────────────────────────────────────────────────────

export async function listDocJobs(): Promise<DocJob[]> {
  const api = createApiClient();
  const response = await api.get<{ jobs: DocJobAPIResponse[] } | DocJobAPIResponse[]>(
    '/api/workflow/db-connection/doc/jobs',
  );
  const raw = Array.isArray(response.data)
    ? response.data
    : (response.data as any).jobs || [];
  return raw.map(transformDocJob);
}

export async function getDocJob(jobId: number): Promise<DocJob> {
  const api = createApiClient();
  const response = await api.get<{ job: DocJobAPIResponse }>(
    `/api/workflow/db-connection/doc/jobs/${jobId}`,
  );
  return transformDocJob((response.data as any).job || response.data);
}

export async function createDocJob(data: Record<string, unknown>): Promise<DocJob> {
  const api = createApiClient();
  const response = await api.post<{ job: DocJobAPIResponse }>(
    '/api/workflow/db-connection/doc/jobs',
    data,
  );
  return transformDocJob((response.data as any).job || response.data);
}

export async function updateDocJob(jobId: number, data: Record<string, unknown>): Promise<DocJob> {
  const api = createApiClient();
  const response = await api.post<{ job: DocJobAPIResponse }>(
    `/api/workflow/db-connection/doc/jobs/${jobId}`,
    data,
  );
  return transformDocJob((response.data as any).job || response.data);
}

export async function deleteDocJob(jobId: number): Promise<void> {
  const api = createApiClient();
  await api.delete(`/api/workflow/db-connection/doc/jobs/${jobId}`);
}

// ─────────────────────────────────────────────────────────────
// Schedule Control
// ─────────────────────────────────────────────────────────────

export async function startDocJob(jobId: number): Promise<void> {
  const api = createApiClient();
  await api.post(`/api/workflow/db-connection/doc/jobs/${jobId}/start`);
}

export async function pauseDocJob(jobId: number): Promise<void> {
  const api = createApiClient();
  await api.post(`/api/workflow/db-connection/doc/jobs/${jobId}/pause`);
}

export async function resumeDocJob(jobId: number): Promise<void> {
  const api = createApiClient();
  await api.post(`/api/workflow/db-connection/doc/jobs/${jobId}/resume`);
}

export async function cancelDocJob(jobId: number): Promise<void> {
  const api = createApiClient();
  await api.post(`/api/workflow/db-connection/doc/jobs/${jobId}/cancel`);
}

export async function executeDocJobNow(jobId: number): Promise<void> {
  const api = createApiClient();
  await api.post(`/api/workflow/db-connection/doc/jobs/${jobId}/execute`);
}

// ─────────────────────────────────────────────────────────────
// Execution Logs
// ─────────────────────────────────────────────────────────────

export async function getDocJobLogs(jobId: number, limit = 50): Promise<ExecutionLog[]> {
  const api = createApiClient();
  const response = await api.get<{ logs: ExecutionLogAPIResponse[] } | ExecutionLogAPIResponse[]>(
    `/api/workflow/db-connection/doc/jobs/${jobId}/logs?limit=${limit}`,
  );
  const raw = Array.isArray(response.data)
    ? response.data
    : (response.data as any).logs || [];
  return raw.map(transformLog);
}
