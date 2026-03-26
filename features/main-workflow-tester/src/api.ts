'use client';

import { createApiClient } from '@xgen/api-client';

// ─────────────────────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────────────────────

interface BatchSessionAPIResponse {
  batch_id: string;
  workflow_id: string;
  workflow_name: string;
  status: string;
  total_count: number;
  completed_count: number;
  success_count: number;
  error_count: number;
  progress: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────
// Batch Session Type
// ─────────────────────────────────────────────────────────────

export interface BatchSession {
  batchId: string;
  workflowId: string;
  workflowName: string;
  status: string;
  totalCount: number;
  completedCount: number;
  successCount: number;
  errorCount: number;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// Transform
// ─────────────────────────────────────────────────────────────

function transformBatchSession(response: BatchSessionAPIResponse): BatchSession {
  return {
    batchId: response.batch_id,
    workflowId: response.workflow_id,
    workflowName: response.workflow_name,
    status: response.status,
    totalCount: response.total_count,
    completedCount: response.completed_count,
    successCount: response.success_count,
    errorCount: response.error_count,
    progress: response.progress,
    startedAt: response.started_at,
    completedAt: response.completed_at,
    createdAt: response.created_at,
  };
}

// ─────────────────────────────────────────────────────────────
// Batch Tester API
// ─────────────────────────────────────────────────────────────

export async function listBatchHistory(): Promise<BatchSession[]> {
  const api = createApiClient();
  const response = await api.get<{ batches: BatchSessionAPIResponse[] }>('/api/workflow/execute/batch/history');
  return (response.data.batches || []).map(transformBatchSession);
}

export async function getActiveBatch(): Promise<BatchSession | null> {
  const api = createApiClient();
  const response = await api.get<{ batch: BatchSessionAPIResponse | null }>('/api/workflow/execute/batch/active');
  return response.data.batch ? transformBatchSession(response.data.batch) : null;
}

export async function getBatchStatus(batchId: string): Promise<BatchSession> {
  const api = createApiClient();
  const response = await api.get<BatchSessionAPIResponse>(`/api/workflow/execute/batch/status/${encodeURIComponent(batchId)}`);
  return transformBatchSession(response.data);
}

export async function getBatchResults(batchId: string): Promise<unknown[]> {
  const api = createApiClient();
  const response = await api.get<{ results: unknown[] }>(`/api/workflow/execute/batch/results/${encodeURIComponent(batchId)}`);
  return response.data.results || [];
}

export async function cancelBatch(batchId: string): Promise<{ success: boolean }> {
  const api = createApiClient();
  const response = await api.post<{ success: boolean }>(`/api/workflow/execute/batch/cancel/${encodeURIComponent(batchId)}`, {});
  return response.data;
}

export async function deleteBatch(batchId: string): Promise<{ success: boolean }> {
  const api = createApiClient();
  const response = await api.delete<{ success: boolean }>(`/api/workflow/execute/batch/delete/${encodeURIComponent(batchId)}`);
  return response.data;
}
