'use client';

import { createApiClient } from '@xgen/api-client';

// ─────────────────────────────────────────────────────────────
// API Response Types (snake_case — matches backend)
// ─────────────────────────────────────────────────────────────

export interface DBConnectionAPIResponse {
  id: number;
  user_id: number;
  connection_name: string;
  description?: string | null;
  db_type: string;
  db_host?: string | null;
  db_port?: number | null;
  db_name: string;
  db_schema?: string | null;
  db_username?: string | null;
  db_password?: string | null;
  custom_password?: string | null;
  use_ssl?: boolean;
  ssl_mode?: string | null;
  ssl_config?: unknown;
  connection_timeout?: number;
  query_timeout?: number;
  pool_size?: number;
  max_overflow?: number;
  read_only?: boolean;
  allowed_query_types?: string | null;
  max_rows_limit?: number;
  allowed_tables?: string | null;
  denied_tables?: string | null;
  is_active?: boolean;
  is_shared?: boolean;
  share_roles?: string[] | null;
  share_permissions?: string | null;
  last_connection_status?: string | null;
  last_connected_at?: string | null;
  last_error?: string | null;
  connection_count?: number;
  options?: string | null;
  created_at?: string;
  updated_at?: string;
  username?: string;
  full_name?: string;
}

// ─────────────────────────────────────────────────────────────
// Frontend Types (camelCase)
// ─────────────────────────────────────────────────────────────

export interface DBConnectionItem {
  id: string;
  numericId: number;
  userId: number;
  connectionName: string;
  description: string;
  dbType: string;
  host: string;
  port: number;
  databaseName: string;
  dbSchema: string;
  dbUsername: string;
  useSsl: boolean;
  sslMode: string;
  connectionTimeout: number;
  queryTimeout: number;
  poolSize: number;
  maxOverflow: number;
  readOnly: boolean;
  maxRowsLimit: number;
  allowedTables: string;
  deniedTables: string;
  isActive: boolean;
  isShared: boolean;
  shareRoles: string[] | null;
  sharePermissions: string | null;
  lastConnectionStatus: string | null;
  lastConnectedAt: string | null;
  lastError: string | null;
  connectionCount: number;
  ownerUsername: string;
  ownerFullName: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Transform
// ─────────────────────────────────────────────────────────────

function transformDBConnection(raw: DBConnectionAPIResponse): DBConnectionItem {
  return {
    id: String(raw.id),
    numericId: raw.id,
    userId: raw.user_id,
    connectionName: raw.connection_name,
    description: raw.description || '',
    dbType: raw.db_type,
    host: raw.db_host || '',
    port: raw.db_port || 0,
    databaseName: raw.db_name,
    dbSchema: raw.db_schema || '',
    dbUsername: raw.db_username || '',
    useSsl: raw.use_ssl ?? false,
    sslMode: raw.ssl_mode || '',
    connectionTimeout: raw.connection_timeout ?? 30,
    queryTimeout: raw.query_timeout ?? 300,
    poolSize: raw.pool_size ?? 5,
    maxOverflow: raw.max_overflow ?? 10,
    readOnly: raw.read_only ?? true,
    maxRowsLimit: raw.max_rows_limit ?? 10000,
    allowedTables: raw.allowed_tables || '',
    deniedTables: raw.denied_tables || '',
    isActive: raw.is_active ?? true,
    isShared: raw.is_shared ?? false,
    shareRoles: raw.share_roles || [],
    sharePermissions: raw.share_permissions || null,
    lastConnectionStatus: raw.last_connection_status || null,
    lastConnectedAt: raw.last_connected_at || null,
    lastError: raw.last_error || null,
    connectionCount: raw.connection_count ?? 0,
    ownerUsername: raw.username || '',
    ownerFullName: raw.full_name || '',
    createdAt: raw.created_at || '',
    updatedAt: raw.updated_at || '',
  };
}

// ─────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────

export async function listDBConnections(): Promise<DBConnectionItem[]> {
  const api = createApiClient();
  const response = await api.get<DBConnectionAPIResponse[] | { connections: DBConnectionAPIResponse[] }>('/api/workflow/db-connection/list/detail');
  const raw = Array.isArray(response.data)
    ? response.data
    : (response.data as any).connections || [];
  return raw.map(transformDBConnection);
}

export async function createDBConnection(data: {
  connection_name: string;
  description?: string;
  db_type: string;
  db_host: string;
  db_port: number;
  db_name: string;
  db_schema?: string;
  db_username?: string;
  db_password?: string;
  custom_password?: string;
  use_ssl?: boolean;
  ssl_mode?: string;
  connection_timeout?: number;
  query_timeout?: number;
  pool_size?: number;
  max_overflow?: number;
  read_only?: boolean;
  max_rows_limit?: number;
  allowed_tables?: string;
  denied_tables?: string;
}): Promise<void> {
  const api = createApiClient();
  await api.post('/api/workflow/db-connection/create', data);
}

export async function updateDBConnection(
  connectionId: number,
  data: Record<string, unknown>,
): Promise<void> {
  const api = createApiClient();
  await api.post(`/api/workflow/db-connection/update/${connectionId}`, data);
}

export async function deleteDBConnection(connectionId: number): Promise<void> {
  const api = createApiClient();
  await api.delete(`/api/workflow/db-connection/delete/${connectionId}`);
}

export async function testDBConnection(data: {
  db_type: string;
  db_host: string;
  db_port: number;
  db_name: string;
  db_username?: string;
  db_password?: string;
  use_ssl?: boolean;
}): Promise<{ success: boolean; message?: string }> {
  const api = createApiClient();
  const response = await api.post<{ success: boolean; message?: string }>('/api/workflow/db-connection/test', data);
  return response.data;
}

export async function testSavedDBConnection(connectionId: number): Promise<{ success: boolean; message?: string }> {
  const api = createApiClient();
  const response = await api.post<{ success: boolean; message?: string }>(`/api/workflow/db-connection/test/${connectionId}`);
  return response.data;
}

export async function shareDBConnection(
  connectionId: number,
  data: { is_shared: boolean; share_roles?: string[] | null; share_permissions?: string },
): Promise<void> {
  const api = createApiClient();
  await api.post(`/api/workflow/db-connection/share/${connectionId}`, data);
}

export async function toggleDBConnectionActive(
  connectionId: number,
  isActive: boolean,
): Promise<void> {
  const api = createApiClient();
  await api.post(`/api/workflow/db-connection/update/${connectionId}`, { is_active: isActive });
}
