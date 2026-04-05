'use client';

import { createApiClient } from '@xgen/api-client';

// ─────────────────────────────────────────────────────────────
// API Response Types (snake_case — matches backend)
// ─────────────────────────────────────────────────────────────

export interface RepositoryAPIResponse {
  id: number;
  user_id: number;
  collection_name: string;
  repository_name: string;
  gitlab_url: string;
  repository_path: string;
  branch: string;
  enable_annotation: boolean;
  enable_api_extraction: boolean;
  sync_schedule_cron: string | null;
  last_synced_at: string | null;
  last_sync_status: string | null;
  last_sync_error: string | null;
  is_active: boolean;
  next_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────
// Frontend Types (camelCase)
// ─────────────────────────────────────────────────────────────

export interface RepositoryItem {
  id: string;
  numericId: number;
  userId: number;
  repositoryName: string;
  collectionName: string;
  gitlabUrl: string;
  repositoryPath: string;
  branch: string;
  enableAnnotation: boolean;
  enableApiExtraction: boolean;
  isActive: boolean;
  lastSyncedAt: string | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
  syncScheduleCron: string | null;
  nextSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Transform
// ─────────────────────────────────────────────────────────────

function transformRepository(raw: RepositoryAPIResponse): RepositoryItem {
  return {
    id: String(raw.id),
    numericId: raw.id,
    userId: raw.user_id,
    repositoryName: raw.repository_name,
    collectionName: raw.collection_name,
    gitlabUrl: raw.gitlab_url,
    repositoryPath: raw.repository_path,
    branch: raw.branch,
    enableAnnotation: raw.enable_annotation,
    enableApiExtraction: raw.enable_api_extraction,
    isActive: raw.is_active,
    lastSyncedAt: raw.last_synced_at,
    lastSyncStatus: raw.last_sync_status,
    lastSyncError: raw.last_sync_error,
    syncScheduleCron: raw.sync_schedule_cron,
    nextSyncAt: raw.next_sync_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

// ─────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────

export async function listRepositories(): Promise<RepositoryItem[]> {
  const api = createApiClient();
  const response = await api.get<RepositoryAPIResponse[]>('/api/repository/repositories');
  const raw = Array.isArray(response.data) ? response.data : [];
  return raw.map(transformRepository);
}

export async function createRepository(data: {
  user_id: number | string;
  collection_name: string;
  repository_name: string;
  gitlab_url: string;
  gitlab_token: string;
  repository_path: string;
  branch?: string;
  sync_schedule_cron?: string;
  enable_annotation?: boolean;
  enable_api_extraction?: boolean;
  is_active?: boolean;
}): Promise<void> {
  const api = createApiClient();
  await api.post('/api/repository/repositories', data);
}

export async function deleteRepository(repositoryId: number): Promise<void> {
  const api = createApiClient();
  await api.delete(`/api/repository/repositories/${repositoryId}`);
}

export async function syncRepository(repositoryId: number): Promise<void> {
  const api = createApiClient();
  await api.post(`/api/repository/repositories/${repositoryId}/sync`);
}
