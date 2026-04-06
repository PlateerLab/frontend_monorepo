'use client';

import { createApiClient } from '@xgen/api-client';

// ─────────────────────────────────────────────────────────────
// API Response Types (snake_case — matches backend)
// ─────────────────────────────────────────────────────────────

export interface StorageAPIResponse {
  id?: number;
  storage_id?: number;
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
    id: String(raw.id ?? raw.storage_id),
    storageId: raw.id ?? raw.storage_id ?? 0,
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
  password?: string;
}): Promise<void> {
  const api = createApiClient();
  const payload: Record<string, any> = {
    storage_name: data.storage_name,
    description: data.description || '',
    is_shared: data.is_shared ?? false,
    share_group: null,
    share_permissions: 'read',
    is_secured: data.is_secured ?? false,
  };
  if (data.is_secured && data.password) {
    payload.password_hash = await sha256(data.password);
  }
  await api.post('/api/storage/storages', payload);
}

export interface VerifyPasswordResponse {
  valid: boolean;
  session_token?: string;
  message?: string;
}

export async function verifyStoragePassword(
  storageId: number,
  password: string
): Promise<VerifyPasswordResponse> {
  const api = createApiClient();
  const passwordHash = await sha256(password);
  const response = await api.post<VerifyPasswordResponse>(
    `/api/storage/storages/${storageId}/verify-password`,
    { password_hash: passwordHash }
  );
  return response.data;
}

export function storeStorageSessionToken(storageId: number, token: string): void {
  const tokens = JSON.parse(sessionStorage.getItem('securedStorageTokens') || '{}');
  tokens[String(storageId)] = { token, expiresAt: Date.now() + 30 * 60 * 1000 };
  sessionStorage.setItem('securedStorageTokens', JSON.stringify(tokens));
}

export function getStorageSessionToken(storageId: number): string | null {
  const tokens = JSON.parse(sessionStorage.getItem('securedStorageTokens') || '{}');
  const entry = tokens[String(storageId)];
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    delete tokens[String(storageId)];
    sessionStorage.setItem('securedStorageTokens', JSON.stringify(tokens));
    return null;
  }
  return entry.token;
}

export async function deleteStorage(storageId: number): Promise<void> {
  const api = createApiClient();
  await api.delete('/api/storage/storages', { storage_id: storageId } as any);
}

// ─────────────────────────────────────────────────────────────
// File / Folder Types (snake_case — matches backend)
// ─────────────────────────────────────────────────────────────

export interface StorageFileAPIResponse {
  id: string;
  file_name: string;
  file_path?: string;
  file_size?: number;
  file_type?: string;
  mime_type?: string;
  folder_id?: number | null;
  storage_id?: number;
  uploaded_at?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: {
    original_file_name?: string;
    directory_full_path?: string;
    folder_id?: number | null;
    [key: string]: any;
  };
}

export interface StorageFolderAPIResponse {
  id: number;
  name: string;
  full_path: string;
  parent_folder_id: number | null;
  is_root: boolean;
  order_index: number;
  storage_id: number;
}

// ─────────────────────────────────────────────────────────────
// File / Folder Frontend Types (camelCase)
// ─────────────────────────────────────────────────────────────

export interface StorageFileItem {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  folderId: number | null;
  storageId: number;
  uploadedAt: string;
}

export interface StorageFolderItem {
  id: number;
  name: string;
  fullPath: string;
  parentFolderId: number | null;
  isRoot: boolean;
  orderIndex: number;
  storageId: number;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalPages: number;
  totalDocuments: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ─────────────────────────────────────────────────────────────
// File / Folder Transforms
// ─────────────────────────────────────────────────────────────

function transformStorageFile(raw: StorageFileAPIResponse): StorageFileItem {
  return {
    id: String(raw.id),
    fileName: raw.file_name,
    filePath: raw.file_path || '',
    fileSize: raw.file_size || 0,
    fileType: raw.file_type || '',
    mimeType: raw.mime_type || '',
    folderId: raw.folder_id ?? raw.metadata?.folder_id ?? null,
    storageId: raw.storage_id || 0,
    uploadedAt: raw.uploaded_at || raw.created_at || '',
  };
}

function transformStorageFolder(raw: StorageFolderAPIResponse): StorageFolderItem {
  return {
    id: raw.id,
    name: raw.name,
    fullPath: raw.full_path,
    parentFolderId: raw.parent_folder_id,
    isRoot: raw.is_root,
    orderIndex: raw.order_index,
    storageId: raw.storage_id,
  };
}

// ─────────────────────────────────────────────────────────────
// File / Folder API Functions
// ─────────────────────────────────────────────────────────────

function storageAuthHeaders(storageId: number): Record<string, string> {
  const token = getStorageSessionToken(storageId);
  return token ? { 'X-Storage-Session-Token': token } : {};
}

export interface StorageFilesResponse {
  files: StorageFileItem[];
  folders: StorageFolderItem[];
  pagination: PaginationInfo | null;
}

export async function listStorageFiles(
  storageId: number,
  page: number = 1,
  pageSize: number = 50,
  folderId?: number | null
): Promise<StorageFilesResponse> {
  const api = createApiClient();
  let url = `/api/storage/storages/${storageId}/files?page=${page}&page_size=${pageSize}`;
  if (folderId != null) url += `&folder_id=${folderId}`;
  const response = await api.get<any>(url, { headers: storageAuthHeaders(storageId) });
  const data = response.data;
  const rawFiles: StorageFileAPIResponse[] = data.files || data.documents || [];
  const rawFolders: StorageFolderAPIResponse[] = data.directory_info || [];
  const rawPagination = data.pagination;
  return {
    files: rawFiles.map(transformStorageFile),
    folders: rawFolders.map(transformStorageFolder),
    pagination: rawPagination ? {
      page: rawPagination.page,
      pageSize: rawPagination.page_size,
      totalPages: rawPagination.total_pages,
      totalDocuments: rawPagination.total_documents,
      hasNext: rawPagination.has_next,
      hasPrev: rawPagination.has_prev,
    } : null,
  };
}

export async function getStorageFolderTree(storageId: number): Promise<StorageFolderItem[]> {
  const api = createApiClient();
  const response = await api.get<StorageFolderAPIResponse[] | { folders: StorageFolderAPIResponse[] }>(
    `/api/storage/folder/tree/${storageId}`,
    { headers: storageAuthHeaders(storageId) }
  );
  const raw = Array.isArray(response.data)
    ? response.data
    : (response.data as any).folders || [];
  return raw.map(transformStorageFolder);
}

export async function deleteStorageFile(fileId: number, storageId?: number): Promise<void> {
  const api = createApiClient();
  await api.delete('/api/storage/file/delete', { file_id: fileId } as any, storageId != null ? {
    headers: storageAuthHeaders(storageId),
  } : undefined);
}

export async function createStorageFolder(data: {
  folder_name: string;
  storage_id: number;
  parent_folder_id?: number | null;
}): Promise<void> {
  const api = createApiClient();
  await api.post('/api/storage/folder/create', data, {
    headers: storageAuthHeaders(data.storage_id),
  });
}

export async function deleteStorageFolder(folderId: number, recursive: boolean = true, storageId?: number): Promise<void> {
  const api = createApiClient();
  await api.delete('/api/storage/folder/delete', { folder_id: folderId, recursive } as any, storageId != null ? {
    headers: storageAuthHeaders(storageId),
  } : undefined);
}

export async function uploadStorageFile(data: {
  file: File;
  storage_id: number;
  folder_id?: number | null;
  relative_path?: string | null;
}): Promise<void> {
  const api = createApiClient();
  const formData = new FormData();
  // Extract pure file name (exclude path from webkitRelativePath)
  let pureFileName = data.file.name;
  if (pureFileName.includes('/')) {
    pureFileName = pureFileName.substring(pureFileName.lastIndexOf('/') + 1);
  }
  formData.append('file', data.file, pureFileName);
  formData.append('storage_id', String(data.storage_id));
  if (data.folder_id != null) {
    formData.append('folder_id', String(data.folder_id));
  }
  if (data.relative_path) {
    formData.append('relative_path', data.relative_path);
  }
  await api.upload('/api/storage/file/upload', formData, {
    headers: storageAuthHeaders(data.storage_id),
    timeout: 300000,
  });
}

export async function uploadStorageFolder(data: {
  files: File[];
  storage_id: number;
  folder_id?: number | null;
  folder_name: string;
}): Promise<void> {
  const api = createApiClient();
  const formData = new FormData();
  data.files.forEach(file => formData.append('files', file));
  formData.append('storage_id', String(data.storage_id));
  formData.append('folder_name', data.folder_name);
  if (data.folder_id != null) {
    formData.append('folder_id', String(data.folder_id));
  }
  await api.upload('/api/storage/folder/upload', formData, {
    headers: storageAuthHeaders(data.storage_id),
    timeout: 300000,
  });
}

export async function downloadStorageFile(fileId: number, storageId?: number): Promise<Blob> {
  // Use fetch directly because ApiClient.handleResponse always calls response.json(),
  // which fails on binary blob data.
  const headers: Record<string, string> = {
    ...(storageId != null ? storageAuthHeaders(storageId) : {}),
  };
  const accessToken = typeof document !== 'undefined'
    ? document.cookie.match(/xgen_access_token=([^;]+)/)?.[1] ?? null
    : null;
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`/api/storage/file/download/${fileId}`, { headers });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Download failed: ${response.status} ${errText}`);
  }

  return response.blob();
}
