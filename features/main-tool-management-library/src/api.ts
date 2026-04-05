'use client';

import { createApiClient } from '@xgen/api-client';

// ─────────────────────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────────────────────

export interface StoreToolAPIResponse {
  id: number;
  created_at: string;
  updated_at: string;
  user_id: number;
  function_upload_id: string;
  function_data: {
    function_name: string;
    function_id: string;
    description: string;
    api_header: unknown;
    api_body: { properties?: Record<string, unknown> };
    static_body?: unknown;
    api_url: string;
    api_method: string;
    body_type?: string;
    api_timeout: number;
    response_filter: boolean;
    response_filter_path: string;
    response_filter_field: string;
    status: string;
  };
  metadata?: {
    description?: string;
    tags?: string[];
    original_function_id?: string;
  };
  rating_count: number;
  rating_sum: number;
  username: string;
  full_name: string;
}

// ─────────────────────────────────────────────────────────────
// Frontend Types
// ─────────────────────────────────────────────────────────────

export interface StoreTool {
  keyValue: number;
  id: string;
  uploadId: string;
  name: string;
  description: string;
  apiMethod: string;
  author: string;
  userId: number;
  createdAt: string;
  ratingCount: number;
  ratingAvg: number;
  tags: string[];
  parameterCount: number;
}

// ─────────────────────────────────────────────────────────────
// Transform
// ─────────────────────────────────────────────────────────────

function transformStoreTool(response: StoreToolAPIResponse): StoreTool {
  const parameterCount =
    response.function_data.api_body?.properties
      ? Object.keys(response.function_data.api_body.properties).length
      : 0;

  return {
    keyValue: response.id,
    id: response.function_data.function_id,
    uploadId: response.function_upload_id,
    name: response.function_data.function_name,
    description: response.function_data.description,
    apiMethod: response.function_data.api_method,
    author: response.full_name || response.username || 'Unknown',
    userId: response.user_id,
    createdAt: response.created_at,
    ratingCount: response.rating_count || 0,
    ratingAvg: response.rating_count > 0 ? response.rating_sum / response.rating_count : 0,
    tags: response.metadata?.tags || [],
    parameterCount,
  };
}

// ─────────────────────────────────────────────────────────────
// Tool Store API
// ─────────────────────────────────────────────────────────────

export async function listStoreToolsDetail(): Promise<StoreTool[]> {
  const api = createApiClient();
  const response = await api.get<{ tools: StoreToolAPIResponse[] }>('/api/tools/store/list/detail');
  return (response.data.tools || []).map(transformStoreTool);
}

export async function downloadStoreToolToStorage(storeToolId: number, functionUploadId: string): Promise<unknown> {
  const api = createApiClient();
  const params = new URLSearchParams({ function_upload_id: functionUploadId });
  const response = await api.post(`/api/tools/store/download/${encodeURIComponent(storeToolId)}?${params}`);
  return response.data;
}

export async function deleteStoreToolUpload(functionUploadId: string): Promise<{ success: boolean }> {
  const api = createApiClient();
  const response = await api.delete<{ success: boolean }>(`/api/tools/store/delete/${encodeURIComponent(functionUploadId)}`);
  return response.data;
}

export async function rateStoreTool(
  storeToolId: number,
  userId: number,
  functionUploadId: string,
  rating: number,
): Promise<unknown> {
  const api = createApiClient();
  const params = new URLSearchParams({
    user_id: userId.toString(),
    function_upload_id: functionUploadId,
    rating: rating.toString(),
  });
  const response = await api.post(`/api/tools/store/rating/${encodeURIComponent(storeToolId)}?${params}`);
  return response.data;
}
