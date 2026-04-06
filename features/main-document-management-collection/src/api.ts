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
// Helpers
// ─────────────────────────────────────────────────────────────

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
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
  password?: string;
}): Promise<void> {
  const api = createApiClient();
  const payload: Record<string, any> = {
    collection_make_name: data.collection_make_name,
    description: data.description,
    enable_sparse_vector: data.enable_sparse_vector,
    enable_full_text: data.enable_full_text,
    is_secured: data.is_secured,
  };
  if (data.password) {
    payload.password_hash = await sha256(data.password);
  }
  await api.post('/api/retrieval/collections', payload);
}

export interface VerifyPasswordResponse {
  valid: boolean;
  session_token?: string;
  message?: string;
}

export async function verifyCollectionPassword(
  collectionName: string,
  password: string
): Promise<VerifyPasswordResponse> {
  const api = createApiClient();
  const passwordHash = await sha256(password);
  const response = await api.post<VerifyPasswordResponse>(
    `/api/retrieval/collections/${encodeURIComponent(collectionName)}/verify-password`,
    { password_hash: passwordHash }
  );
  return response.data;
}

export function storeCollectionSessionToken(collectionName: string, token: string): void {
  const tokens = JSON.parse(sessionStorage.getItem('securedCollectionTokens') || '{}');
  tokens[collectionName] = { token, expiresAt: Date.now() + 30 * 60 * 1000 };
  sessionStorage.setItem('securedCollectionTokens', JSON.stringify(tokens));
}

export function getCollectionSessionToken(collectionName: string): string | null {
  const tokens = JSON.parse(sessionStorage.getItem('securedCollectionTokens') || '{}');
  const entry = tokens[collectionName];
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    delete tokens[collectionName];
    sessionStorage.setItem('securedCollectionTokens', JSON.stringify(tokens));
    return null;
  }
  return entry.token;
}

export async function deleteCollection(collectionName: string): Promise<void> {
  const api = createApiClient();
  await api.delete('/api/retrieval/collections', { collection_name: collectionName } as any);
}

// ─────────────────────────────────────────────────────────────
// Document / Folder Types (snake_case — matches backend)
// ─────────────────────────────────────────────────────────────

export interface DocumentAPIResponse {
  document_id: string;
  file_name: string;
  file_path?: string;
  file_type: string;
  processed_at: string;
  total_chunks: number;
  is_secured?: boolean;
  metadata?: {
    folder_path?: string;
    directory_full_path?: string;
    relative_path?: string;
    original_file_name?: string;
    file_size?: number;
    [key: string]: any;
  };
  chunks?: ChunkAPIResponse[];
}

export interface ChunkAPIResponse {
  chunk_id: string;
  chunk_index: number;
  chunk_size: number;
  chunk_text?: string;
  chunk_text_preview?: string;
}

export interface FolderAPIResponse {
  id: number;
  folder_name: string;
  full_path: string;
  parent_folder_id: number | null;
  parent_folder_name: string | null;
  is_root: boolean;
  order_index: number;
  collection_id: number;
  collection_name: string;
  collection_make_name: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────
// Document / Folder Frontend Types (camelCase)
// ─────────────────────────────────────────────────────────────

export interface DocumentItem {
  documentId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  processedAt: string;
  totalChunks: number;
  isSecured: boolean;
  directoryFullPath: string;
  fileSize: number;
  metadata?: Record<string, any>;
  chunks?: ChunkItem[];
}

export interface ChunkItem {
  chunkId: string;
  chunkIndex: number;
  chunkSize: number;
  chunkText: string;
  chunkTextPreview: string;
}

export interface FolderItem {
  id: number;
  folderName: string;
  fullPath: string;
  parentFolderId: number | null;
  parentFolderName: string | null;
  isRoot: boolean;
  orderIndex: number;
  collectionId: number;
  collectionName: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Document / Folder Transforms
// ─────────────────────────────────────────────────────────────

function transformChunk(raw: ChunkAPIResponse): ChunkItem {
  return {
    chunkId: raw.chunk_id,
    chunkIndex: raw.chunk_index,
    chunkSize: raw.chunk_size,
    chunkText: raw.chunk_text || '',
    chunkTextPreview: raw.chunk_text_preview || '',
  };
}

function transformDocument(raw: DocumentAPIResponse): DocumentItem {
  return {
    documentId: raw.document_id,
    fileName: raw.file_name,
    filePath: raw.file_path || '',
    fileType: raw.file_type,
    processedAt: raw.processed_at,
    totalChunks: raw.total_chunks,
    isSecured: raw.is_secured ?? false,
    directoryFullPath: raw.metadata?.directory_full_path || raw.metadata?.folder_path || '',
    fileSize: raw.metadata?.file_size || 0,
    metadata: raw.metadata,
    chunks: raw.chunks?.map(transformChunk),
  };
}

function transformFolder(raw: FolderAPIResponse): FolderItem {
  return {
    id: raw.id,
    folderName: raw.folder_name,
    fullPath: raw.full_path,
    parentFolderId: raw.parent_folder_id,
    parentFolderName: raw.parent_folder_name,
    isRoot: raw.is_root,
    orderIndex: raw.order_index,
    collectionId: raw.collection_id,
    collectionName: raw.collection_name,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

// ─────────────────────────────────────────────────────────────
// Document / Folder API Functions
// ─────────────────────────────────────────────────────────────

function collectionAuthHeaders(collectionName: string): Record<string, string> {
  const token = getCollectionSessionToken(collectionName);
  return token ? { 'X-Collection-Session-Token': token } : {};
}

export interface DocumentsSummaryResponse {
  documents: DocumentItem[];
  folders: FolderItem[];
}

export async function listDocumentsSummary(collectionName: string): Promise<DocumentsSummaryResponse> {
  const api = createApiClient();
  const response = await api.get<any>(`/api/retrieval/collections/${encodeURIComponent(collectionName)}/documents-summary`, {
    headers: collectionAuthHeaders(collectionName),
  });
  const data = response.data;
  const rawDocs: DocumentAPIResponse[] = data.documents || [];
  const rawFolders: FolderAPIResponse[] = data.directory_info || [];
  return {
    documents: rawDocs.map(transformDocument),
    folders: rawFolders.map(transformFolder),
  };
}

export async function getDocumentDetail(collectionName: string, documentId: string): Promise<DocumentItem> {
  const api = createApiClient();
  const response = await api.get<DocumentAPIResponse>(
    `/api/retrieval/collections/${encodeURIComponent(collectionName)}/documents/${encodeURIComponent(documentId)}`,
    { headers: collectionAuthHeaders(collectionName) }
  );
  return transformDocument(response.data);
}

export async function deleteDocument(collectionName: string, documentId: string): Promise<void> {
  const api = createApiClient();
  await api.delete(`/api/retrieval/collections/${encodeURIComponent(collectionName)}/documents/${encodeURIComponent(documentId)}`, undefined, {
    headers: collectionAuthHeaders(collectionName),
  });
}

export async function createFolder(data: {
  folder_name: string;
  parent_collection_id: number;
  parent_folder_id?: number | null;
  parent_folder_name?: string | null;
}): Promise<void> {
  const api = createApiClient();
  await api.post('/api/folder/create', data);
}

export async function deleteFolderWithDocuments(data: {
  folder_path: string;
  collection_id: number;
  collection_name: string;
}): Promise<void> {
  const api = createApiClient();
  await api.delete('/api/folder/delete-with-documents', data as any);
}

export async function uploadDocument(data: {
  file: File;
  collection_name: string;
  chunk_size?: number;
  chunk_overlap?: number;
  use_ocr?: boolean;
  use_llm_metadata?: boolean;
  extract_default_metadata?: boolean;
  force_chunking?: boolean;
  folder_path?: string;
}): Promise<void> {
  const api = createApiClient();
  const formData = new FormData();
  formData.append('file', data.file);
  formData.append('collection_name', data.collection_name);
  formData.append('chunk_size', String(data.chunk_size ?? 1000));
  formData.append('chunk_overlap', String(data.chunk_overlap ?? 150));
  formData.append('use_ocr', String(data.use_ocr ?? false));
  formData.append('use_llm_metadata', String(data.use_llm_metadata ?? false));
  formData.append('extract_default_metadata', String(data.extract_default_metadata ?? true));
  formData.append('force_chunking', String(data.force_chunking ?? false));
  const metadata: Record<string, any> = {
    original_file_name: data.file.name,
    file_size: data.file.size,
    upload_timestamp: new Date().toISOString(),
  };
  if (data.folder_path) {
    metadata.directory_full_path = data.folder_path;
  }
  formData.append('metadata', JSON.stringify(metadata));
  await api.post('/api/retrieval/documents/upload-sse', formData, {
    headers: { 'Content-Type': 'multipart/form-data', ...collectionAuthHeaders(data.collection_name) },
    timeout: 300000,
  } as any);
}
