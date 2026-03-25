'use client';

import { createApiClient } from '@xgen/api-client';
import type { WorkflowDetail, WorkflowStoreItem, WorkflowSchedule } from '@xgen/types';

// ─────────────────────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────────────────────

interface WorkflowDetailAPIResponse {
  id: number;
  workflow_name: string;
  workflow_id: string;
  username: string;
  full_name?: string;
  user_id: number;
  node_count: number;
  edge_count: number;
  updated_at: string;
  created_at: string;
  has_startnode: boolean;
  has_endnode: boolean;
  is_completed: boolean;
  is_shared: boolean;
  share_group: string | null;
  share_permissions: string;
  metadata: Record<string, unknown>;
  error?: string;
  inquire_deploy?: boolean;
  is_accepted?: boolean;
  is_deployed?: boolean;
}

interface WorkflowStoreAPIResponse {
  id: number;
  workflow_id: string;
  workflow_upload_name: string;
  workflow_name: string;
  description?: string;
  username?: string;
  user_id: number;
  node_count: number;
  edge_count: number;
  is_template: boolean;
  is_completed: boolean;
  current_version: number;
  latest_version: number;
  tags?: string[];
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
  has_startnode: boolean;
  has_endnode: boolean;
  rating_count?: number;
  rating_sum?: number;
}

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
// Transform Functions
// ─────────────────────────────────────────────────────────────

function transformWorkflowDetail(response: WorkflowDetailAPIResponse): WorkflowDetail {
  // 상태 결정
  let status: WorkflowDetail['status'] = 'active';
  if (response.is_accepted === false) {
    status = 'unactive';
  } else if (!response.has_startnode || !response.has_endnode || response.node_count < 3) {
    status = 'draft';
  }

  return {
    keyValue: response.id,
    id: response.workflow_id,
    name: response.workflow_name,
    author: response.username || response.full_name || 'Unknown',
    userId: response.user_id,
    nodeCount: response.node_count,
    status,
    lastModified: response.updated_at,
    createdAt: response.created_at,
    error: response.error,
    isShared: response.is_shared,
    shareGroup: response.share_group,
    sharePermissions: response.share_permissions as WorkflowDetail['sharePermissions'],
    inquireDeploy: response.inquire_deploy,
    isAccepted: response.is_accepted,
    isDeployed: response.is_deployed,
  };
}

function transformWorkflowStoreItem(response: WorkflowStoreAPIResponse): WorkflowStoreItem {
  return {
    id: response.id,
    workflowId: response.workflow_id,
    uploadName: response.workflow_upload_name,
    workflowName: response.workflow_name,
    description: response.description,
    username: response.username,
    userId: response.user_id,
    nodeCount: response.node_count,
    edgeCount: response.edge_count,
    isTemplate: response.is_template,
    isCompleted: response.is_completed,
    currentVersion: response.current_version,
    latestVersion: response.latest_version,
    tags: response.tags,
    createdAt: response.created_at,
    updatedAt: response.updated_at,
    metadata: response.metadata,
    hasStartNode: response.has_startnode,
    hasEndNode: response.has_endnode,
    ratingCount: response.rating_count,
    ratingSum: response.rating_sum,
  };
}

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
// Workflow Storage API
// ─────────────────────────────────────────────────────────────

/**
 * 워크플로우 상세 목록을 가져옵니다
 */
export async function listWorkflowsDetail(): Promise<WorkflowDetail[]> {
  const api = createApiClient();
  const response = await api.get<{ workflows: WorkflowDetailAPIResponse[] }>('/api/workflow/list/detail');
  return (response.workflows || []).map(transformWorkflowDetail);
}

/**
 * 특정 워크플로우를 로드합니다
 */
export async function loadWorkflow(workflowId: string, userId?: number): Promise<unknown> {
  const api = createApiClient();
  const query = userId ? `?user_id=${userId}` : '';
  return api.get(`/api/workflow/load/${encodeURIComponent(workflowId)}${query}`);
}

/**
 * 워크플로우를 저장합니다
 */
export async function saveWorkflow(
  workflowName: string,
  workflowContent: unknown,
  workflowId?: string,
  userId?: number
): Promise<{ success: boolean; workflow_id: string }> {
  const api = createApiClient();
  return api.post('/api/workflow/save', {
    workflow_name: workflowName,
    workflow_id: workflowId,
    content: workflowContent,
    user_id: userId,
  });
}

/**
 * 워크플로우를 복제합니다
 */
export async function duplicateWorkflow(workflowId: string, userId?: number): Promise<{ success: boolean }> {
  const api = createApiClient();
  const query = userId ? `?user_id=${userId}` : '';
  return api.get(`/api/workflow/duplicate/${encodeURIComponent(workflowId)}${query}`);
}

/**
 * 워크플로우를 삭제합니다
 */
export async function deleteWorkflow(workflowId: string): Promise<{ success: boolean }> {
  const api = createApiClient();
  return api.delete(`/api/workflow/delete/${encodeURIComponent(workflowId)}`);
}

/**
 * 워크플로우 설정을 업데이트합니다
 */
export async function updateWorkflow(
  workflowId: string,
  updateData: {
    is_shared?: boolean;
    share_group?: string | null;
    share_permissions?: string;
    enable_deploy?: boolean;
  }
): Promise<{ success: boolean }> {
  const api = createApiClient();
  return api.post(`/api/workflow/update/${encodeURIComponent(workflowId)}`, updateData);
}

/**
 * 워크플로우 IO 로그를 가져옵니다
 */
export async function getWorkflowIOLogs(
  workflowName: string,
  workflowId: string,
  interactionId?: string
): Promise<{ in_out_logs: unknown[] }> {
  const api = createApiClient();
  return api.post('/api/workflow/iologs', {
    workflow_name: workflowName,
    workflow_id: workflowId,
    interaction_id: interactionId || 'default',
  });
}

// ─────────────────────────────────────────────────────────────
// Workflow Store API
// ─────────────────────────────────────────────────────────────

/**
 * 워크플로우 스토어 목록을 가져옵니다
 */
export async function listWorkflowStore(): Promise<WorkflowStoreItem[]> {
  const api = createApiClient();
  const response = await api.get<{ workflows: WorkflowStoreAPIResponse[] }>('/api/workflow/store/list');
  return (response.workflows || []).map(transformWorkflowStoreItem);
}

/**
 * 워크플로우 스토어에서 템플릿을 다운로드합니다
 */
export async function downloadWorkflowTemplate(workflowId: string, userId: number): Promise<{ success: boolean }> {
  const api = createApiClient();
  return api.post('/api/workflow/store/download', {
    workflow_id: workflowId,
    user_id: userId,
  });
}

/**
 * 워크플로우를 스토어에 업로드합니다
 */
export async function uploadWorkflowToStore(
  workflowId: string,
  uploadName: string,
  description?: string,
  isTemplate?: boolean
): Promise<{ success: boolean }> {
  const api = createApiClient();
  return api.post('/api/workflow/store/upload', {
    workflow_id: workflowId,
    upload_name: uploadName,
    description,
    is_template: isTemplate ?? true,
  });
}

// ─────────────────────────────────────────────────────────────
// Workflow Schedule API
// ─────────────────────────────────────────────────────────────

/**
 * 워크플로우 스케줄 목록을 가져옵니다
 */
export async function listWorkflowSchedules(): Promise<WorkflowSchedule[]> {
  const api = createApiClient();
  const response = await api.get<{ schedules: WorkflowScheduleAPIResponse[] }>('/api/workflow/schedule/list');
  return (response.schedules || []).map(transformWorkflowSchedule);
}

/**
 * 워크플로우 스케줄을 생성합니다
 */
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
  return api.post('/api/workflow/schedule/create', {
    workflow_id: workflowId,
    schedule_name: name,
    frequency,
    description: options?.description,
    cron_expression: options?.cronExpression,
  });
}

/**
 * 워크플로우 스케줄을 삭제합니다
 */
export async function deleteWorkflowSchedule(scheduleId: number): Promise<{ success: boolean }> {
  const api = createApiClient();
  return api.delete(`/api/workflow/schedule/${scheduleId}`);
}

/**
 * 워크플로우 스케줄을 일시정지/재개합니다
 */
export async function toggleWorkflowSchedule(
  scheduleId: number,
  paused: boolean
): Promise<{ success: boolean }> {
  const api = createApiClient();
  return api.post(`/api/workflow/schedule/${scheduleId}/toggle`, { paused });
}
