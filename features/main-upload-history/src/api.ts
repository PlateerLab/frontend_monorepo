'use client';

import { createApiClient } from '@xgen/api-client';

// ─────────────────────────────────────────────────────────────
// API Response Types (snake_case — matches backend)
// ─────────────────────────────────────────────────────────────

export interface UploadHistoryAPIRecord {
  id: number;
  file_name: string;
  collection_name: string;
  collection_display_name?: string;
  status: string;
  total_chunks: number;
  processed_chunks: number;
  error_message?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface UploadHistoryAPIResponse {
  success: boolean;
  history: UploadHistoryAPIRecord[];
  total_count: number;
}

// ─────────────────────────────────────────────────────────────
// Frontend Types (camelCase)
// ─────────────────────────────────────────────────────────────

export type UploadHistoryStatus =
  | 'uploading'
  | 'processing'
  | 'embedding'
  | 'complete'
  | 'error';

export interface UploadHistoryRecord {
  id: number;
  fileName: string;
  collectionName: string;
  collectionDisplayName: string;
  status: UploadHistoryStatus;
  totalChunks: number;
  processedChunks: number;
  errorMessage?: string;
  uploadedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Transform
// ─────────────────────────────────────────────────────────────

function normalizeStatus(raw: string): UploadHistoryStatus {
  const s = raw.toLowerCase();
  if (s === 'complete' || s === 'completed' || s === 'done') return 'complete';
  if (s === 'error' || s === 'failed') return 'error';
  if (s === 'embedding') return 'embedding';
  if (s === 'processing') return 'processing';
  return 'uploading';
}

function transformRecord(raw: UploadHistoryAPIRecord): UploadHistoryRecord {
  return {
    id: raw.id,
    fileName: raw.file_name,
    collectionName: raw.collection_name,
    collectionDisplayName: raw.collection_display_name || raw.collection_name,
    status: normalizeStatus(raw.status),
    totalChunks: raw.total_chunks ?? 0,
    processedChunks: raw.processed_chunks ?? 0,
    errorMessage: raw.error_message,
    uploadedBy: raw.uploaded_by,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

// ─────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────

export interface ListUploadHistoryParams {
  collectionName?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface ListUploadHistoryResult {
  records: UploadHistoryRecord[];
  totalCount: number;
}

export async function listUploadHistory(
  params: ListUploadHistoryParams = {},
): Promise<ListUploadHistoryResult> {
  const api = createApiClient();
  const query = new URLSearchParams();
  if (params.collectionName) query.set('collection_name', params.collectionName);
  if (params.status) query.set('status', params.status);
  if (params.limit != null) query.set('limit', String(params.limit));
  if (params.offset != null) query.set('offset', String(params.offset));

  const qs = query.toString();
  const url = `/api/retrieval/upload-history${qs ? `?${qs}` : ''}`;
  const response = await api.get<UploadHistoryAPIResponse>(url);
  const data = response.data as any;

  const history: UploadHistoryAPIRecord[] = data.history || [];
  const totalCount: number = data.total_count ?? history.length;

  return {
    records: history.map(transformRecord),
    totalCount,
  };
}
