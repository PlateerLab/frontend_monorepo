'use client';

import { createApiClient } from '@xgen/api-client';

// ─────────────────────────────────────────────────────────────
// API Response Types (snake_case — matches backend)
// ─────────────────────────────────────────────────────────────

export interface CollectionAPIResponse {
  id?: number;
  collection_name: string;
  collection_make_name?: string;
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
  collectionId: number;
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
    collectionId: raw.id ?? 0,
    name: raw.collection_name,
    displayName: raw.collection_make_name || raw.display_name || raw.collection_name,
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

export async function sha256(text: string): Promise<string> {
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

export async function updateCollection(
  collectionName: string,
  data: {
    collection_make_name?: string;
    is_shared?: boolean;
    share_group?: string | null;
    is_secured?: boolean;
    password_hash?: string | null;
  }
): Promise<void> {
  const api = createApiClient();
  await api.patch(`/api/retrieval/collections/${encodeURIComponent(collectionName)}`, data);
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
  collection_name?: string;
}): Promise<void> {
  const api = createApiClient();
  const { collection_name, ...payload } = data;
  await api.post('/api/folder/create', payload, collection_name ? {
    headers: collectionAuthHeaders(collection_name),
  } : undefined);
}

export async function deleteFolderWithDocuments(data: {
  folder_path: string;
  collection_id: number;
  collection_name: string;
}): Promise<void> {
  const api = createApiClient();
  await api.delete('/api/folder/delete-with-documents', data as any);
}

export async function moveFolder(
  folderId: number,
  targetParentFolderId: number | null,
  collectionId: number,
  ownerUserId?: number | null
): Promise<void> {
  const api = createApiClient();
  const payload: Record<string, any> = {
    folder_id: folderId,
    target_parent_folder_id: targetParentFolderId,
    collection_id: collectionId,
  };
  if (ownerUserId != null) {
    payload.owner_user_id = ownerUserId;
  }
  await api.post('/api/folder/move', payload);
}

export async function updateDocumentFolder(
  documentId: string,
  collectionName: string,
  newDirectoryFullPath: string,
  ownerUserId?: number | null
): Promise<void> {
  const api = createApiClient();
  const payload: Record<string, any> = {
    document_id: documentId,
    collection_name: collectionName,
    new_directory_full_path: newDirectoryFullPath,
  };
  if (ownerUserId != null) {
    payload.owner_user_id = ownerUserId;
  }
  await api.post('/api/folder/update/document-folder', payload, {
    headers: collectionAuthHeaders(collectionName),
  });
}

/**
 * Ensure folder structure exists for drag-and-drop uploads.
 * Creates any missing folders from the relative paths.
 * Returns updated folders list.
 */
export async function ensureFolderStructure(
  relativePaths: Map<File, string>,
  collectionId: number,
  collectionName: string,
  collectionDisplayName: string,
  baseFolderPath?: string,
): Promise<FolderItem[]> {
  // Collect unique folder paths from relativePaths
  const folderPathsSet = new Set<string>();
  for (const relPath of relativePaths.values()) {
    if (!relPath) continue;
    // relPath can be "folder1" or "folder1/subfolder2"
    // We need to create each level
    const parts = relPath.split('/').filter(Boolean);
    for (let i = 0; i < parts.length; i++) {
      folderPathsSet.add(parts.slice(0, i + 1).join('/'));
    }
  }
  if (folderPathsSet.size === 0) {
    const summary = await listDocumentsSummary(collectionName);
    return summary.folders;
  }

  // Sort by depth (shallowest first)
  const sortedPaths = Array.from(folderPathsSet).sort((a, b) => {
    return a.split('/').length - b.split('/').length;
  });

  // Fetch current folders
  let summary = await listDocumentsSummary(collectionName);
  let existingFolders = summary.folders;

  for (const relFolderPath of sortedPaths) {
    const parts = relFolderPath.split('/');
    const folderName = parts[parts.length - 1];

    // Compute the expected full path
    const fullPath = baseFolderPath
      ? `${baseFolderPath}/${relFolderPath}`
      : `/${collectionDisplayName}/${relFolderPath}`;

    // Check if folder already exists
    const existing = existingFolders.find(
      f => f.fullPath.replace(/\/+$/, '') === fullPath.replace(/\/+$/, '')
    );
    if (existing) continue;

    // Find parent folder
    let parentFolderId: number | null = null;
    let parentFolderName: string | null = null;
    if (parts.length > 1) {
      const parentRelPath = parts.slice(0, -1).join('/');
      const parentFullPath = baseFolderPath
        ? `${baseFolderPath}/${parentRelPath}`
        : `/${collectionDisplayName}/${parentRelPath}`;
      const parentFolder = existingFolders.find(
        f => f.fullPath.replace(/\/+$/, '') === parentFullPath.replace(/\/+$/, '')
      );
      if (parentFolder) {
        parentFolderId = parentFolder.id;
        parentFolderName = parentFolder.folderName;
      }
    }

    await createFolder({
      folder_name: folderName,
      parent_collection_id: collectionId,
      parent_folder_id: parentFolderId,
      parent_folder_name: parentFolderName,
      collection_name: collectionName,
    });

    // Re-fetch folders to get the new folder's ID
    summary = await listDocumentsSummary(collectionName);
    existingFolders = summary.folders;
  }

  return existingFolders;
}

function generateSessionId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface UploadProgressEvent {
  event: string;
  totalChunks?: number;
  processedChunks?: number;
  message?: string;
}

export async function uploadDocument(
  data: {
    file: File;
    collection_name: string;
    user_id?: number;
    chunk_size?: number;
    chunk_overlap?: number;
    use_ocr?: boolean;
    use_llm_metadata?: boolean;
    extract_default_metadata?: boolean;
    force_chunking?: boolean;
    folder_path?: string;
  },
  onProgress?: (event: UploadProgressEvent) => void,
): Promise<void> {
  const formData = new FormData();
  formData.append('file', data.file);
  formData.append('collection_name', data.collection_name);
  formData.append('chunk_size', String(data.chunk_size ?? 1000));
  formData.append('chunk_overlap', String(data.chunk_overlap ?? 150));
  formData.append('user_id', String(data.user_id ?? 1));
  formData.append('session', generateSessionId());
  formData.append('use_ocr', String(data.use_ocr ?? false));
  formData.append('use_llm_metadata', String(data.use_llm_metadata ?? false));
  formData.append('extract_default_metadata', String(data.extract_default_metadata ?? true));
  formData.append('force_chunking', String(data.force_chunking ?? false));
  formData.append('chunking_strategy', 'recursive');
  formData.append('generate_ontology_graph', 'true');
  const metadata: Record<string, any> = {
    original_file_name: data.file.name,
    file_size: data.file.size,
    upload_timestamp: new Date().toISOString(),
  };
  if (data.folder_path) {
    metadata.directory_full_path = data.folder_path;
  }
  formData.append('metadata', JSON.stringify(metadata));

  // SSE endpoint returns text/event-stream, not JSON.
  // Use fetch directly to avoid JSON parse errors.
  const headers: Record<string, string> = {
    ...collectionAuthHeaders(data.collection_name),
  };
  const accessToken = typeof document !== 'undefined'
    ? document.cookie.match(/xgen_access_token=([^;]+)/)?.[1] ?? null
    : null;
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch('/api/retrieval/documents/upload-sse', {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Upload failed: ${response.status} ${errText}`);
  }

  // Notify start
  onProgress?.({ event: 'uploading', totalChunks: 0, processedChunks: 0 });

  // Consume and parse the SSE stream.
  // Backend sends: "data: {JSON}\n\n" — messages separated by double newline.
  const reader = response.body?.getReader();
  if (reader) {
    const decoder = new TextDecoder();
    let buffer = '';
    let totalChunks = 0;
    let processedChunks = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Split on double-newline (SSE message boundary)
      const messages = buffer.split('\n\n');
      buffer = messages.pop() || ''; // keep incomplete message in buffer

      for (const msg of messages) {
        // Each message may have multiple lines; find the "data: " line
        for (const line of msg.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ') && !trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed.slice(5);
          if (!jsonStr.trim()) continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const eventType = parsed.event || '';

            if (eventType === 'start' || eventType === 'file_saving' || eventType === 'file_saved') {
              onProgress?.({ event: 'uploading', totalChunks, processedChunks });
            } else if (eventType === 'processing_start') {
              onProgress?.({ event: 'processing', totalChunks, processedChunks });
            } else if (eventType === 'total_chunks') {
              totalChunks = parsed.total_chunks || totalChunks;
              onProgress?.({ event: 'processing', totalChunks, processedChunks });
            } else if (eventType === 'chunk_processed') {
              processedChunks = (parsed.chunk_index ?? processedChunks) + 1;
              onProgress?.({ event: 'processing', totalChunks, processedChunks });
            } else if (eventType === 'embedding_start') {
              processedChunks = 0;
              onProgress?.({ event: 'embedding', totalChunks: parsed.total_chunks || totalChunks, processedChunks: 0 });
            } else if (eventType === 'embedding_chunk_processed') {
              processedChunks = (parsed.chunk_index ?? processedChunks) + 1;
              totalChunks = parsed.total_chunks || totalChunks;
              onProgress?.({ event: 'embedding', totalChunks, processedChunks });
            } else if (eventType === 'embedding_complete') {
              processedChunks = parsed.total_chunks || totalChunks;
              totalChunks = processedChunks;
              onProgress?.({ event: 'embedding', totalChunks, processedChunks });
            } else if (eventType === 'complete') {
              onProgress?.({ event: 'complete', totalChunks, processedChunks: totalChunks });
              return;
            } else if (eventType === 'error') {
              const errMsg = parsed.message || parsed.error || 'Upload failed';
              onProgress?.({ event: 'error', message: errMsg });
              throw new Error(errMsg);
            }
            // Ignore heartbeat, reconnecting, etc.
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    }
    // Stream ended without explicit 'complete' — treat as complete
    onProgress?.({ event: 'complete', totalChunks, processedChunks: totalChunks });
  }
}
