'use client';

import { createApiClient } from '@xgen/api-client';
import type { WorkflowDetail } from '@xgen/types';

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

// ─────────────────────────────────────────────────────────────
// Transform
// ─────────────────────────────────────────────────────────────

function transformWorkflowDetail(response: WorkflowDetailAPIResponse): WorkflowDetail {
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

// ─────────────────────────────────────────────────────────────
// Workflow Storage API
// ─────────────────────────────────────────────────────────────

export async function listWorkflowsDetail(): Promise<WorkflowDetail[]> {
  const api = createApiClient();
  const response = await api.get<{ workflows: WorkflowDetailAPIResponse[] }>('/api/workflow/list/detail');
  return (response.data.workflows || []).map(transformWorkflowDetail);
}

export async function loadWorkflow(workflowId: string, userId?: number): Promise<unknown> {
  const api = createApiClient();
  const query = userId ? `?user_id=${userId}` : '';
  const response = await api.get(`/api/workflow/load/${encodeURIComponent(workflowId)}${query}`);
  return response.data;
}

export async function saveWorkflow(
  workflowName: string,
  workflowContent: unknown,
  workflowId?: string,
  userId?: number
): Promise<{ success: boolean; workflow_id: string }> {
  const api = createApiClient();
  const response = await api.post<{ success: boolean; workflow_id: string }>('/api/workflow/save', {
    workflow_name: workflowName,
    workflow_id: workflowId,
    content: workflowContent,
    user_id: userId,
  });
  return response.data;
}

export async function duplicateWorkflow(workflowId: string, userId?: number): Promise<{ success: boolean }> {
  const api = createApiClient();
  const query = userId ? `?user_id=${userId}` : '';
  const response = await api.get<{ success: boolean }>(`/api/workflow/duplicate/${encodeURIComponent(workflowId)}${query}`);
  return response.data;
}

export async function deleteWorkflow(workflowId: string): Promise<{ success: boolean }> {
  const api = createApiClient();
  const response = await api.delete<{ success: boolean }>(`/api/workflow/delete/${encodeURIComponent(workflowId)}`);
  return response.data;
}

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
  const response = await api.post<{ success: boolean }>(`/api/workflow/update/${encodeURIComponent(workflowId)}`, updateData);
  return response.data;
}

export async function getWorkflowIOLogs(
  workflowName: string,
  workflowId: string,
  interactionId?: string
): Promise<{ in_out_logs: unknown[] }> {
  const api = createApiClient();
  const response = await api.post<{ in_out_logs: unknown[] }>('/api/workflow/iologs', {
    workflow_name: workflowName,
    workflow_id: workflowId,
    interaction_id: interactionId || 'default',
  });
  return response.data;
}
