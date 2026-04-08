'use client';

import { createApiClient } from '@xgen/api-client';
import type { AgentflowStoreItem } from '@xgen/types';

// ─────────────────────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────────────────────

interface AgentflowStoreAPIResponse {
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

// ─────────────────────────────────────────────────────────────
// Transform
// ─────────────────────────────────────────────────────────────

function transformAgentflowStoreItem(response: AgentflowStoreAPIResponse): AgentflowStoreItem {
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

// ─────────────────────────────────────────────────────────────
// Agentflow Store API
// ─────────────────────────────────────────────────────────────

export async function listAgentflowStore(): Promise<AgentflowStoreItem[]> {
  const api = createApiClient();
  const response = await api.get<{ workflows: AgentflowStoreAPIResponse[] }>('/api/workflow/store/list');
  return (response.data.workflows || []).map(transformAgentflowStoreItem);
}

export async function downloadAgentflowTemplate(
  workflowId: string,
  userId: number,
  version?: number
): Promise<{ success: boolean }> {
  const api = createApiClient();
  const response = await api.post<{ success: boolean }>('/api/workflow/store/download', {
    workflow_id: workflowId,
    user_id: userId,
    ...(version !== undefined && { version }),
  });
  return response.data;
}

export async function uploadAgentflowToStore(
  workflowId: string,
  uploadName: string,
  description?: string,
  isTemplate?: boolean
): Promise<{ success: boolean }> {
  const api = createApiClient();
  const response = await api.post<{ success: boolean }>('/api/workflow/store/upload', {
    workflow_id: workflowId,
    upload_name: uploadName,
    description,
    is_template: isTemplate ?? true,
  });
  return response.data;
}
