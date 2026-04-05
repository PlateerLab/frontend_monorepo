'use client';

import { createApiClient } from '@xgen/api-client';

// ─────────────────────────────────────────────────────────────
// API Response Types (snake_case — matches backend)
// ─────────────────────────────────────────────────────────────

export interface StorageAPIResponse {
  storage_id: number;
  storage_name: string;
  description?: string;
  file_count: number;
  total_size: number;
  is_shared: boolean;
  is_secured: boolean;
  share_group?: string | null;
  share_permissions?: string;
  owner_user_id?: number;
  owner_username?: string;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────
// Frontend Types (camelCase)
// ─────────────────────────────────────────────────────────────

export interface FileStorageItem {
  id: string;
  storageId: number;
  name: string;
  description: string;
  fileCount: number;
  totalSize: number;
  isShared: boolean;
  isSecured: boolean;
  ownerUserId?: number;
  ownerUsername?: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Transform
// ─────────────────────────────────────────────────────────────

function transformStorage(raw: StorageAPIResponse): FileStorageItem {
  return {
    id: String(raw.storage_id),
    storageId: raw.storage_id,
    name: raw.storage_name,
    description: raw.description || '',
    fileCount: raw.file_count ?? 0,
    totalSize: raw.total_size ?? 0,
    isShared: raw.is_shared ?? false,
    isSecured: raw.is_secured ?? false,
    ownerUserId: raw.owner_user_id,
    ownerUsername: raw.owner_username,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

// ─────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────

export async function listStorages(): Promise<FileStorageItem[]> {
  const api = createApiClient();
  const response = await api.get<StorageAPIResponse[] | { storages: StorageAPIResponse[] }>('/api/storage/storages?include_shared=true');
  const raw = Array.isArray(response.data)
    ? response.data
    : (response.data as any).storages || [];
  return raw.map(transformStorage);
}

export async function createStorage(data: {
  storage_name: string;
  description?: string;
  is_shared?: boolean;
  is_secured?: boolean;
  password_hash?: string;
}): Promise<void> {
  const api = createApiClient();
  await api.post('/api/storage/storages', data);
}

export async function deleteStorage(storageId: number): Promise<void> {
  const api = createApiClient();
  await api.delete('/api/storage/storages', { storage_id: storageId } as any);
}
