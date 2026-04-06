'use client';

import { createApiClient } from './index';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface TableInfo {
  name: string;
  row_count?: number;
}

export interface QueryResult {
  success: boolean;
  data: Record<string, unknown>[];
  row_count: number;
  error?: string;
}

export interface DatabaseInfo {
  database_type: string;
  connection_status: string;
  version?: string;
  table_count: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  default_value?: string;
  primary_key: boolean;
}

// ─────────────────────────────────────────────────────────────
// Raw API response types
// ─────────────────────────────────────────────────────────────

interface DatabaseInfoResponse {
  success: boolean;
  database_info: DatabaseInfo;
}

interface TableListResponse {
  tables: Array<string | { table_name?: string; name?: string; row_count?: number }>;
}

// ─────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────

function getClient() {
  const raw = createApiClient();
  return {
    async get<T>(endpoint: string, config?: Parameters<typeof raw.get>[1]): Promise<T> {
      const res = await raw.get<T>(endpoint, config);
      return res.data;
    },
    async post<T>(endpoint: string, body?: unknown, config?: Parameters<typeof raw.post>[2]): Promise<T> {
      const res = await raw.post<T>(endpoint, body, config);
      return res.data;
    },
  };
}

/** DB 정보 조회 */
export async function getDatabaseInfo(): Promise<DatabaseInfoResponse> {
  const client = getClient();
  return client.get<DatabaseInfoResponse>('/api/admin/database/database/info');
}

/** DB 연결 상태 확인 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const res = await getDatabaseInfo();
    return res.database_info?.connection_status === 'connected';
  } catch {
    return false;
  }
}

/** 테이블 목록 조회 */
export async function getTableList(): Promise<TableInfo[]> {
  const client = getClient();
  const res = await client.get<TableListResponse>('/api/admin/database/tables');
  return (res.tables ?? []).map((table) => {
    if (typeof table === 'string') {
      return { name: table };
    }
    return {
      name: table.table_name || table.name || '',
      row_count: table.row_count,
    };
  });
}

/** 테이블 구조(컬럼 정보) 조회 */
export async function getTableStructure(tableName: string): Promise<ColumnInfo[]> {
  const client = getClient();
  return client.get<ColumnInfo[]>(`/api/admin/database/table/${encodeURIComponent(tableName)}/structure`);
}

/** 테이블 샘플 데이터 조회 */
export async function getTableSampleData(
  tableName: string,
  limit: number = 100,
): Promise<QueryResult> {
  const validLimit = Math.min(Math.max(limit, 1), 1000);
  const client = getClient();
  return client.get<QueryResult>(
    `/api/admin/database/table/${encodeURIComponent(tableName)}/sample?limit=${validLimit}`,
  );
}

/** 테이블 행 수 조회 */
export async function getTableRowCount(tableName: string): Promise<number> {
  const client = getClient();
  const result = await client.get<{ row_count: number }>(`/api/admin/database/table/${encodeURIComponent(tableName)}/count`);
  return result.row_count ?? 0;
}

/** SQL 쿼리 실행 (SELECT only) */
export async function executeQuery(
  query: string,
  params?: unknown[] | null,
): Promise<QueryResult> {
  const client = getClient();
  return client.post<QueryResult>('/api/admin/database/query', {
    query,
    params: params ?? null,
  });
}

/** 모든 테이블 정보 일괄 조회 (이름 + 행 수) */
export async function getAllTablesInfo(): Promise<TableInfo[]> {
  return getTableList();
}
