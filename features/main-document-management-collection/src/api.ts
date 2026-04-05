'use client';

import { createApiClient } from '@xgen/api-client';

// ─────────────────────────────────────────────────────────────
// API Response Types (snake_case — matches backend)
// ─────────────────────────────────────────────────────────────

export interface CollectionAPIResponse {
  collection_name: string;
  display_name?: string;
  description?: string;
  document_count: number;
  is_shared: boolean;
  is_secured: boolean;
  embedding_model?: string;
  owner_user_id?: number;
  owner_username?: string;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────
// Frontend Types (camelCase)
// ─────────────────────────────────────────────────────────────

export interface CollectionItem {
  id: string;
  name: string;
  displayName: string;
  description: string;
  documentCount: number;
  isShared: boolean;
  isSecured: boolean;
  embedding: string;
  ownerUserId?: number;
  ownerUsername?: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Transform
// ─────────────────────────────────────────────────────────────

function transformCollection(raw: CollectionAPIResponse): CollectionItem {
  return {
    id: raw.collection_name,
    name: raw.collection_name,
    displayName: raw.display_name || raw.collection_name,
    description: raw.description || '',
    documentCount: raw.document_count ?? 0,
    isShared: raw.is_shared ?? false,
    isSecured: raw.is_secured ?? false,
    embedding: raw.embedding_model || '',
    ownerUserId: raw.owner_user_id,
    ownerUsername: raw.owner_username,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

// ─────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────

export async function listCollections(): Promise<CollectionItem[]> {
  const api = createApiClient();
  const response = await api.get<CollectionAPIResponse[] | { collections: CollectionAPIResponse[] }>('/api/retrieval/collections');
  const raw = Array.isArray(response.data)
    ? response.data
    : (response.data as any).collections || [];
  return raw.map(transformCollection);
}

export async function createCollection(data: {
  collection_make_name: string;
  description?: string;
  enable_sparse_vector?: boolean;
  enable_full_text?: boolean;
  is_secured?: boolean;
  password_hash?: string;
}): Promise<void> {
  const api = createApiClient();
  await api.post('/api/retrieval/collections', data);
}

export async function deleteCollection(collectionName: string): Promise<void> {
  const api = createApiClient();
  await api.delete('/api/retrieval/collections', { collection_name: collectionName } as any);
}
