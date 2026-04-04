'use client';

import { createApiClient } from './index';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface TableInfo {
  name: string;
  row_count: number;
}

export interface QueryResult {
  success: boolean;
  data: Record<string, unknown>[];
  row_count: number;
  error?: string;
}

export interface DatabaseInfo {
  connected: boolean;
  db_type?: string;
  version?: string;
  table_count?: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  default_value?: string;
  primary_key: boolean;
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

/** DB 연결 상태 확인 */
export async function getDatabaseInfo(): Promise<DatabaseInfo> {
  const client = getClient();
  return client.get<DatabaseInfo>('/api/admin/database/info');
}

/** 테이블 목록 조회 */
export async function getTableList(): Promise<string[]> {
  const client = getClient();
  return client.get<string[]>('/api/admin/database/tables');
}

/** 테이블 구조(컬럼 정보) 조회 */
export async function getTableStructure(tableName: string): Promise<ColumnInfo[]> {
  const client = getClient();
  return client.get<ColumnInfo[]>(`/api/admin/database/tables/${encodeURIComponent(tableName)}/structure`);
}

/** 테이블 샘플 데이터 조회 */
export async function getTableSampleData(
  tableName: string,
  limit: number = 100,
): Promise<QueryResult> {
  const client = getClient();
  return client.get<QueryResult>(`/api/admin/database/tables/${encodeURIComponent(tableName)}/sample`, {
    params: { limit: String(limit) },
  });
}

/** 테이블 행 수 조회 */
export async function getTableRowCount(tableName: string): Promise<number> {
  const client = getClient();
  const result = await client.get<{ count: number }>(`/api/admin/database/tables/${encodeURIComponent(tableName)}/count`);
  return result.count;
}

/** SQL 쿼리 실행 (SELECT only) */
export async function executeQuery(
  query: string,
  params?: unknown[],
): Promise<QueryResult> {
  const client = getClient();
  return client.post<QueryResult>('/api/admin/database/query', {
    body: { query, params },
  });
}

/** 모든 테이블 정보 일괄 조회 (이름 + 행 수) */
export async function getAllTablesInfo(): Promise<TableInfo[]> {
  const tables = await getTableList();
  const results = await Promise.all(
    tables.map(async (name) => {
      try {
        const count = await getTableRowCount(name);
        return { name, row_count: count };
      } catch {
        return { name, row_count: 0 };
      }
    }),
  );
  return results;
}
