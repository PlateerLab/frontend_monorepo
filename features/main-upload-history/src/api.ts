'use client';

import { createApiClient } from '@xgen/api-client';

// ─────────────────────────────────────────────────────────────
// API Response Types (snake_case — matches backend)
// ─────────────────────────────────────────────────────────────

export interface UploadHistoryAPIRecord {
  id: number;
  user_id: number;
  collection_name: string;
  collection_make_name: string;
  file_name: string;
  file_size: number;
  file_type: string;
  status: string;
  error_message: string | null;
  error_type: string | null;
  upload_source: string;
  session_id: string | null;
  minio_object_name: string | null;
  minio_path: string | null;
  minio_upload_success: boolean;
  chunk_size: number;
  chunk_overlap: number;
  use_ocr: boolean;
  use_llm_metadata: boolean;
  extract_default_metadata: boolean;
  force_chunking: boolean;
  chunking_strategy: string;
  enable_sparse_vector: boolean;
  enable_full_text: boolean;
  generate_ontology_graph: boolean;
  total_chunks: number;
  processed_chunks: number;
  total_retries: number;
  started_at: string | null;
  completed_at: string | null;
  elapsed_seconds: number | null;
  directory_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface UploadHistoryAPIResponse {
  success: boolean;
  history: UploadHistoryAPIRecord[];
  total_count: number;
}

// ─────────────────────────────────────────────────────────────
// Frontend Types (uses backend values directly)
// ─────────────────────────────────────────────────────────────

export type UploadHistoryStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface UploadHistoryRecord {
  id: number;
  userId: number;
  collectionName: string;
  collectionDisplayName: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  status: UploadHistoryStatus;
  errorMessage: string | null;
  errorType: string | null;
  uploadSource: string;
  sessionId: string | null;
  minioObjectName: string | null;
  minioPath: string | null;
  minioUploadSuccess: boolean;
  chunkSize: number;
  chunkOverlap: number;
  useOcr: boolean;
  useLlmMetadata: boolean;
  extractDefaultMetadata: boolean;
  forceChunking: boolean;
  chunkingStrategy: string;
  enableSparseVector: boolean;
  enableFullText: boolean;
  generateOntologyGraph: boolean;
  totalChunks: number;
  processedChunks: number;
  totalRetries: number;
  startedAt: string | null;
  completedAt: string | null;
  elapsedSeconds: number | null;
  directoryPath: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Transform
// ─────────────────────────────────────────────────────────────

function normalizeStatus(raw: string): UploadHistoryStatus {
  const s = raw.toLowerCase();
  if (s === 'completed' || s === 'complete' || s === 'done') return 'completed';
  if (s === 'failed' || s === 'error') return 'failed';
  if (s === 'cancelled') return 'cancelled';
  if (s === 'processing' || s === 'embedding') return 'processing';
  return 'pending';
}

function transformRecord(raw: UploadHistoryAPIRecord): UploadHistoryRecord {
  return {
    id: raw.id,
    userId: raw.user_id,
    collectionName: raw.collection_name,
    collectionDisplayName: raw.collection_make_name || raw.collection_name,
    fileName: raw.file_name,
    fileSize: raw.file_size ?? 0,
    fileType: raw.file_type || '',
    status: normalizeStatus(raw.status),
    errorMessage: raw.error_message,
    errorType: raw.error_type,
    uploadSource: raw.upload_source || 'collection',
    sessionId: raw.session_id,
    minioObjectName: raw.minio_object_name,
    minioPath: raw.minio_path,
    minioUploadSuccess: raw.minio_upload_success ?? false,
    chunkSize: raw.chunk_size ?? 0,
    chunkOverlap: raw.chunk_overlap ?? 0,
    useOcr: raw.use_ocr ?? false,
    useLlmMetadata: raw.use_llm_metadata ?? false,
    extractDefaultMetadata: raw.extract_default_metadata ?? false,
    forceChunking: raw.force_chunking ?? false,
    chunkingStrategy: raw.chunking_strategy || '',
    enableSparseVector: raw.enable_sparse_vector ?? false,
    enableFullText: raw.enable_full_text ?? false,
    generateOntologyGraph: raw.generate_ontology_graph ?? false,
    totalChunks: raw.total_chunks ?? 0,
    processedChunks: raw.processed_chunks ?? 0,
    totalRetries: raw.total_retries ?? 0,
    startedAt: raw.started_at,
    completedAt: raw.completed_at,
    elapsedSeconds: raw.elapsed_seconds,
    directoryPath: raw.directory_path,
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

// ─────────────────────────────────────────────────────────────
// Collections API
// ─────────────────────────────────────────────────────────────

export interface CollectionOption {
  collectionName: string;
  displayName: string;
}

export async function listCollections(): Promise<CollectionOption[]> {
  const api = createApiClient();
  const response = await api.get<any>('/api/retrieval/collections');
  const raw = Array.isArray(response.data)
    ? response.data
    : (response.data as any).collections || [];
  return raw.map((c: any) => ({
    collectionName: c.collection_name,
    displayName: c.collection_make_name || c.collection_name,
  }));
}
