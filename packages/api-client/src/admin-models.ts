'use client';

import { createApiClient } from './index';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface GPUListItem {
  id: number;
  name: string;
  memory_total: number;
  memory_used: number;
  memory_free: number;
  utilization: number;
  temperature: number;
}

export interface GPUListResponse {
  gpus: GPUListItem[];
  multi_gpu: boolean;
  count: number;
}

export type ModelBackend = 'llamacpp' | 'vllm' | 'sglang' | 'cpu';

export interface LoadModelRequest {
  model_path: string;
  backend: ModelBackend;
  gpu_layers?: number;
  gpu_ids?: number[];
  context_length?: number;
  tensor_parallel?: number;
  use_vulkan?: boolean;
  pooling_type?: string;
  additional_args?: Record<string, unknown>;
}

export interface ModelInfo {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface ModelListResponse {
  data: ModelInfo[];
  object: string;
}

export interface ModelHealthStatus {
  llm: {
    loaded: boolean;
    model?: string;
    backend?: string;
  };
  embedding: {
    loaded: boolean;
    model?: string;
  };
}

export interface LoadingStatusResponse {
  llm: {
    loading: boolean;
    progress?: number;
    model?: string;
  };
  embedding: {
    loading: boolean;
    progress?: number;
    model?: string;
  };
}

export interface DefaultModelConfig {
  context_length: number;
  gpu_layers: number;
  tensor_parallel: number;
}

// ─────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────

function getClient() {
  const raw = createApiClient();
  return {
    async get<T>(endpoint: string, config?: Parameters<typeof raw.get>[1]): Promise<T> {
      const res = await raw.get<T>(endpoint, config);
      return res.data;
    },
    async post<T>(endpoint: string, body?: unknown, config?: Parameters<typeof raw.post>[2]): Promise<T> {
      const res = await raw.post<T>(endpoint, body, config);
      return res.data;
    },
    async delete<T>(endpoint: string, body?: unknown, config?: Parameters<typeof raw.delete>[2]): Promise<T> {
      const res = await raw.delete<T>(endpoint, body, config);
      return res.data;
    },
  };
}

function getMlClient() {
  const raw = createApiClient({ service: 'ml' });
  return {
    async get<T>(endpoint: string, config?: Parameters<typeof raw.get>[1]): Promise<T> {
      const res = await raw.get<T>(endpoint, config);
      return res.data;
    },
  };
}

/** GPU 목록 조회 */
export async function listGPUs(): Promise<GPUListResponse> {
  const client = getClient();
  return client.get<GPUListResponse>('/api/admin/models/gpus');
}

/** 모델 로딩 */
export async function loadModel(request: LoadModelRequest): Promise<{ status: string; message: string }> {
  const client = getClient();
  return client.post<{ status: string; message: string }>('/api/admin/models/load', {
    body: request,
  });
}

/** 모델 언로딩 */
export async function unloadModel(modelId: string): Promise<{ status: string }> {
  const client = getClient();
  return client.post<{ status: string }>(`/api/admin/models/${encodeURIComponent(modelId)}/unload`);
}

/** 모든 모델 언로딩 */
export async function unloadAllModels(): Promise<{ status: string }> {
  const client = getClient();
  return client.post<{ status: string }>('/api/admin/models/unload-all');
}

/** 로딩된 모델 목록 (OpenAI 호환) */
export async function listModels(): Promise<ModelListResponse> {
  const client = getMlClient();
  return client.get<ModelListResponse>('/v1/models');
}

/** 모델 헬스 상태 (LLM + Embedding) */
export async function checkModelHealth(): Promise<ModelHealthStatus> {
  const client = getClient();
  return client.get<ModelHealthStatus>('/api/admin/models/health');
}

/** 모델 로딩 진행 상태 */
export async function getLoadingStatus(): Promise<LoadingStatusResponse> {
  const client = getClient();
  return client.get<LoadingStatusResponse>('/api/admin/models/loading-status');
}

/** 기본 모델 설정값 */
export async function getDefaultModelConfig(): Promise<DefaultModelConfig> {
  const client = getClient();
  return client.get<DefaultModelConfig>('/api/admin/models/default-config');
}
