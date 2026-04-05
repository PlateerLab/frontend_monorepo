'use client';

import { createApiClient } from '@xgen/api-client';

// ─────────────────────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────────────────────

export interface ToolDetailAPIResponse {
  id: number;
  created_at: string;
  updated_at: string;
  function_name: string;
  function_id: string;
  description: string;
  api_url: string;
  api_method: string;
  api_timeout: number;
  api_header: unknown;
  api_body: unknown;
  static_body?: unknown;
  body_type?: string;
  is_query_string?: boolean;
  response_filter: boolean;
  response_filter_path: string;
  response_filter_field: string;
  html_parser?: boolean;
  auth_profile_id?: string | null;
  metadata: Record<string, unknown>;
  status: string;
  is_deployed?: boolean;
  inquire_deploy?: boolean;
  user_id: number;
  username: string;
  full_name: string;
  is_shared: boolean;
  share_group: string | null;
  share_permissions: string;
}

// ─────────────────────────────────────────────────────────────
// Frontend Types
// ─────────────────────────────────────────────────────────────

export interface ToolDetail {
  keyValue: number;
  id: string;
  name: string;
  description: string;
  apiUrl: string;
  apiMethod: string;
  status: 'active' | 'inactive' | 'draft' | 'archived';
  author: string;
  userId: number;
  createdAt: string;
  lastModified: string;
  isShared: boolean;
  shareGroup: string | null;
  sharePermissions: string;
  isDeployed?: boolean;
  inquireDeploy?: boolean;
  metadata: Record<string, unknown>;
  parameterCount: number;
}

// ─────────────────────────────────────────────────────────────
// Transform
// ─────────────────────────────────────────────────────────────

function transformToolDetail(response: ToolDetailAPIResponse): ToolDetail {
  const parameterCount =
    response.api_body && typeof response.api_body === 'object' && 'properties' in (response.api_body as Record<string, unknown>)
      ? Object.keys((response.api_body as Record<string, unknown>).properties as Record<string, unknown>).length
      : 0;

  return {
    keyValue: response.id,
    id: response.function_id,
    name: response.function_name,
    description: response.description,
    apiUrl: response.api_url,
    apiMethod: response.api_method,
    status: (response.status as ToolDetail['status']) || 'active',
    author: response.full_name || response.username || 'Unknown',
    userId: response.user_id,
    createdAt: response.created_at,
    lastModified: response.updated_at,
    isShared: response.is_shared,
    shareGroup: response.share_group,
    sharePermissions: response.share_permissions,
    isDeployed: response.is_deployed,
    inquireDeploy: response.inquire_deploy,
    metadata: response.metadata || {},
    parameterCount,
  };
}

// ─────────────────────────────────────────────────────────────
// Tool Storage API
// ─────────────────────────────────────────────────────────────

export async function listToolsDetail(): Promise<ToolDetail[]> {
  const api = createApiClient();
  const response = await api.get<{ tools: ToolDetailAPIResponse[] }>('/api/tools/storage/list/detail');
  return (response.data.tools || []).map(transformToolDetail);
}

export async function deleteTool(functionId: string): Promise<{ success: boolean }> {
  const api = createApiClient();
  const response = await api.delete<{ success: boolean }>(`/api/tools/storage/delete/${encodeURIComponent(functionId)}`);
  return response.data;
}

export async function testTool(toolId: number, functionId: string): Promise<unknown> {
  const api = createApiClient();
  const params = new URLSearchParams({ tool_id: toolId.toString(), function_id: functionId });
  const response = await api.post(`/api/tools/storage/tool-test?${params}`);
  return response.data;
}
