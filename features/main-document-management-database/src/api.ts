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
  use_ssl?: boolean;
  read_only?: boolean;
  is_active?: boolean;
  is_shared?: boolean;
  share_group?: string | null;
  share_permissions?: string | null;
  last_connection_status?: string | null;
  last_connected_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ─────────────────────────────────────────────────────────────
// Frontend Types (camelCase)
// ─────────────────────────────────────────────────────────────

export interface DBConnectionItem {
  id: string;
  numericId: number;
  connectionName: string;
  description: string;
  dbType: string;
  host: string;
  port: number;
  databaseName: string;
  dbSchema: string;
  dbUsername: string;
  useSsl: boolean;
  readOnly: boolean;
  isActive: boolean;
  isShared: boolean;
  shareGroup: string | null;
  sharePermissions: string | null;
  lastConnectionStatus: string | null;
  lastConnectedAt: string | null;
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
    connectionName: raw.connection_name,
    description: raw.description || '',
    dbType: raw.db_type,
    host: raw.db_host || '',
    port: raw.db_port || 0,
    databaseName: raw.db_name,
    dbSchema: raw.db_schema || '',
    dbUsername: raw.db_username || '',
    useSsl: raw.use_ssl ?? false,
    readOnly: raw.read_only ?? true,
    isActive: raw.is_active ?? true,
    isShared: raw.is_shared ?? false,
    shareGroup: raw.share_group || null,
    sharePermissions: raw.share_permissions || null,
    lastConnectionStatus: raw.last_connection_status || null,
    lastConnectedAt: raw.last_connected_at || null,
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
  db_type: string;
  db_host: string;
  db_port: number;
  db_name: string;
  db_username?: string;
  db_password?: string;
  custom_password?: string;
  description?: string;
  use_ssl?: boolean;
  read_only?: boolean;
}): Promise<void> {
  const api = createApiClient();
  await api.post('/api/workflow/db-connection/create', data);
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
