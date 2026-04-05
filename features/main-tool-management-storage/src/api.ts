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
  apiTimeout: number;
  apiHeader: unknown;
  apiBody: unknown;
  staticBody?: unknown;
  bodyType?: string;
  isQueryString?: boolean;
  responseFilter: boolean;
  responseFilterPath: string;
  responseFilterField: string;
  htmlParser?: boolean;
  authProfileId?: string | null;
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

export interface ToolSaveData {
  function_name: string;
  function_id: string;
  description: string;
  api_url: string;
  api_method: string;
  api_timeout: number;
  body_type: string;
  is_query_string: boolean;
  response_filter: boolean;
  html_parser: boolean;
  response_filter_path: string;
  response_filter_field: string;
  api_header: Record<string, string>;
  api_body: unknown;
  static_body: Record<string, string>;
  metadata: Record<string, unknown>;
  auth_profile_id?: string | null;
  status: string;
}

export interface ApiTestRequest {
  api_url: string;
  api_method: string;
  api_headers?: Record<string, string>;
  api_body?: unknown;
  static_body?: Record<string, string>;
  body_type?: string;
  is_query_string?: boolean;
  html_parser?: boolean;
  api_timeout?: number;
  auth_profile_id?: string | null;
}

export interface ApiTestResult {
  success: boolean;
  data?: {
    status: number;
    statusText: string;
    contentType: string;
    headers: Record<string, string>;
    response: unknown;
  };
  error?: string;
}

export interface ToolTestResult {
  success: boolean;
  tool_status: string;
  function_id: string;
  function_name: string;
  data?: unknown;
  error?: string;
}

export interface DiscoveredEndpoint {
  url: string;
  method: string;
  source: string;
  type: 'api' | 'data' | 'page';
  full_url: string;
  query_params?: Record<string, string>;
}

export interface DiscoveryResult {
  base_url: string;
  page_title: string;
  page_url: string;
  endpoints: DiscoveredEndpoint[];
  scripts_analyzed: number;
  total_found: number;
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
    apiTimeout: response.api_timeout,
    apiHeader: response.api_header,
    apiBody: response.api_body,
    staticBody: response.static_body,
    bodyType: response.body_type,
    isQueryString: response.is_query_string,
    responseFilter: response.response_filter,
    responseFilterPath: response.response_filter_path,
    responseFilterField: response.response_filter_field,
    htmlParser: response.html_parser,
    authProfileId: response.auth_profile_id,
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

export async function saveTool(functionName: string, content: ToolSaveData): Promise<unknown> {
  const api = createApiClient();
  const response = await api.post('/api/tools/storage/save', {
    function_name: functionName,
    content,
  });
  return response.data;
}

export async function updateTool(toolId: number, functionId: string, updateData: ToolSaveData): Promise<unknown> {
  const api = createApiClient();
  const params = new URLSearchParams({ tool_id: toolId.toString() });
  const response = await api.post(`/api/tools/storage/update/${encodeURIComponent(functionId)}?${params}`, updateData);
  return response.data;
}

export async function deleteTool(functionId: string): Promise<{ success: boolean }> {
  const api = createApiClient();
  const response = await api.delete<{ success: boolean }>(`/api/tools/storage/delete/${encodeURIComponent(functionId)}`);
  return response.data;
}

export async function testTool(toolId: number, functionId: string): Promise<ToolTestResult> {
  const api = createApiClient();
  const params = new URLSearchParams({ tool_id: toolId.toString(), function_id: functionId });
  const response = await api.post<ToolTestResult>(`/api/tools/storage/tool-test?${params}`);
  return response.data;
}

export async function testApiEndpoint(request: ApiTestRequest): Promise<ApiTestResult> {
  const api = createApiClient();
  const response = await api.post<ApiTestResult>('/api/tools/storage/api-test', {
    api_url: request.api_url,
    api_method: request.api_method || 'GET',
    api_headers: request.api_headers || {},
    api_body: request.api_body || {},
    static_body: request.static_body || {},
    body_type: request.body_type || 'application/json',
    is_query_string: request.is_query_string || false,
    html_parser: request.html_parser || false,
    api_timeout: request.api_timeout || 30,
    ...(request.auth_profile_id ? { auth_profile_id: request.auth_profile_id } : {}),
  });
  return response.data;
}

export async function discoverApis(url: string): Promise<DiscoveryResult> {
  const api = createApiClient();
  const response = await api.post<DiscoveryResult>('/api/tools/storage/discover-apis', { url });
  return response.data;
}
