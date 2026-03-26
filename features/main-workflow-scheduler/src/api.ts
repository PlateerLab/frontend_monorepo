'use client';

import { createApiClient } from '@xgen/api-client';
import type { WorkflowSchedule } from '@xgen/types';

// ─────────────────────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────────────────────

interface WorkflowScheduleAPIResponse {
  id: number;
  workflow_id: string;
  workflow_name: string;
  schedule_name: string;
  description?: string;
  status: string;
  frequency: string;
  cron_expression?: string;
  next_run_at?: string;
  last_run_at?: string;
  last_run_status?: string;
  run_count: number;
  created_at: string;
  updated_at: string;
  user_id?: number;
  username?: string;
}

// ─────────────────────────────────────────────────────────────
// Transform
// ─────────────────────────────────────────────────────────────

function transformWorkflowSchedule(response: WorkflowScheduleAPIResponse): WorkflowSchedule {
  return {
    id: response.id,
    workflowId: response.workflow_id,
    workflowName: response.workflow_name,
    name: response.schedule_name,
    description: response.description,
    status: response.status as WorkflowSchedule['status'],
    frequency: response.frequency as WorkflowSchedule['frequency'],
    cronExpression: response.cron_expression,
    nextRunAt: response.next_run_at,
    lastRunAt: response.last_run_at,
    lastRunStatus: response.last_run_status as WorkflowSchedule['lastRunStatus'],
    runCount: response.run_count,
    createdAt: response.created_at,
    updatedAt: response.updated_at,
    userId: response.user_id,
    username: response.username,
  };
}

// ─────────────────────────────────────────────────────────────
// Workflow Schedule API
// ─────────────────────────────────────────────────────────────

export async function listWorkflowSchedules(): Promise<WorkflowSchedule[]> {
  const api = createApiClient();
  const response = await api.get<{ schedules: WorkflowScheduleAPIResponse[] }>('/api/workflow/schedule/list');
  return (response.data.schedules || []).map(transformWorkflowSchedule);
}

export async function createWorkflowSchedule(
  workflowId: string,
  name: string,
  frequency: string,
  options?: {
    description?: string;
    cronExpression?: string;
  }
): Promise<{ success: boolean; schedule_id: number }> {
  const api = createApiClient();
  const response = await api.post<{ success: boolean; schedule_id: number }>('/api/workflow/schedule/create', {
    workflow_id: workflowId,
    schedule_name: name,
    frequency,
    description: options?.description,
    cron_expression: options?.cronExpression,
  });
  return response.data;
}

export async function deleteWorkflowSchedule(scheduleId: number): Promise<{ success: boolean }> {
  const api = createApiClient();
  const response = await api.delete<{ success: boolean }>(`/api/workflow/schedule/${scheduleId}`);
  return response.data;
}

export async function toggleWorkflowSchedule(
  scheduleId: number,
  paused: boolean
): Promise<{ success: boolean }> {
  const api = createApiClient();
  const response = await api.post<{ success: boolean }>(`/api/workflow/schedule/${scheduleId}/toggle`, { paused });
  return response.data;
}
