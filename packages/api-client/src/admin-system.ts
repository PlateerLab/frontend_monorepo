'use client';

import { createApiClient } from './index';
import { getBackendUrl } from '@xgen/config';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface SystemData {
  cpu: CPUInfo;
  memory: MemoryInfo;
  gpu: GPUInfo[] | null;
  network: NetworkInfo[];
  disk: DiskInfo[];
  uptime: number;
}

export interface CPUInfo {
  usage_percent: number;
  core_count: number;
  frequency_current: number;
  frequency_max: number;
  load_average: number[];
}

export interface MemoryInfo {
  total: number;
  available: number;
  percent: number;
  used: number;
  free: number;
}

export interface GPUInfo {
  name: string;
  memory_total: number;
  memory_used: number;
  utilization: number;
  temperature: number;
}

export interface NetworkInfo {
  interface: string;
  is_up: boolean;
  bytes_sent: number;
  bytes_recv: number;
  packets_sent: number;
  packets_recv: number;
}

export interface DiskInfo {
  device: string;
  mountpoint: string;
  fstype: string;
  total: number;
  used: number;
  free: number;
  percent: number;
}

export interface ServiceInfo {
  id: string;
  name: string;
  health: boolean;
  version?: string;
  versionDescription?: string;
  commitHash?: string;
  commitDate?: string;
  containerName?: string;
  containerDescription?: string;
  versionCompatible?: boolean;
  versionCompatibilityReason?: string;
}

export interface BackendLog {
  user_id: number | null;
  log_id: string;
  log_level: string;
  message: string;
  function_name: string | null;
  api_endpoint: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface BackendLogsResponse {
  logs: BackendLog[];
  total: number;
  page: number;
  page_size: number;
}

// ─────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatUptime(bootTime: number): string {
  const now = Date.now() / 1000;
  const uptime = now - bootTime;
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);

  let result = '';
  if (days > 0) result += `${days}d `;
  if (hours > 0) result += `${hours}h `;
  result += `${minutes}m`;
  return result;
}

export type ResourceStatus = 'low' | 'medium' | 'high' | 'critical';

export function getCPUStatus(usage: number): ResourceStatus {
  if (usage < 30) return 'low';
  if (usage < 60) return 'medium';
  if (usage < 80) return 'high';
  return 'critical';
}

export function getMemoryStatus(usage: number): ResourceStatus {
  if (usage < 50) return 'low';
  if (usage < 70) return 'medium';
  if (usage < 85) return 'high';
  return 'critical';
}

export function getDiskStatus(usage: number): ResourceStatus {
  if (usage < 60) return 'low';
  if (usage < 80) return 'medium';
  if (usage < 90) return 'high';
  return 'critical';
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
    async put<T>(endpoint: string, body?: unknown, config?: Parameters<typeof raw.put>[2]): Promise<T> {
      const res = await raw.put<T>(endpoint, body, config);
      return res.data;
    },
  };
}

/** 시스템 모니터링 정보 (CPU, Memory, GPU, Network, Disk, Uptime) */
export async function getSystemStatus(): Promise<SystemData> {
  const client = getClient();
  return client.get<SystemData>('/api/admin/system/status');
}

/** 컨테이너별 서비스 상태 (health, version, commit 정보) */
export async function getServerStatus(): Promise<Record<string, ServiceInfo>> {
  const client = getClient();
  return client.get<Record<string, ServiceInfo>>('/api/server-status');
}

/**
 * SSE 기반 실시간 시스템 모니터링 스트리밍
 * @returns cleanup 함수 (연결 종료)
 */
export function streamSystemStatus(
  onData: (data: SystemData) => void,
  onError?: (error: string) => void,
): () => void {
  const controller = new AbortController();
  const baseUrl = getBackendUrl('core');

  const url = `${baseUrl}/api/admin/system/status/stream`;

  fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
    credentials: 'include',
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      if (!response.body) {
        throw new Error('ReadableStream not supported');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonData = line.slice(6).trim();
              if (!jsonData || !jsonData.startsWith('{') || !jsonData.endsWith('}')) continue;

              try {
                const data = JSON.parse(jsonData) as SystemData;
                if ((data as unknown as { error?: string }).error) {
                  onError?.((data as unknown as { error: string }).error);
                } else {
                  onData(data);
                }
              } catch {
                // JSON parse error, skip this line
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    })
    .catch((error: Error) => {
      if (error.name !== 'AbortError') {
        onError?.(`Connection failed: ${error.message}`);
      }
    });

  return () => {
    controller.abort();
  };
}

/** 백엔드 로그 조회 (페이지네이션) */
export async function getBackendLogs(
  page: number = 1,
  pageSize: number = 250,
): Promise<BackendLogsResponse> {
  const client = getClient();
  const raw = await client.get<{
    logs: BackendLog[];
    pagination?: { page: number; page_size: number; offset: number; total_returned: number };
  }>('/api/admin/base/backend/logs', {
    params: { page: String(page), page_size: String(pageSize) },
  });
  return {
    logs: raw.logs ?? [],
    total: raw.pagination?.total_returned ?? raw.logs?.length ?? 0,
    page: raw.pagination?.page ?? page,
    page_size: raw.pagination?.page_size ?? pageSize,
  };
}

// ─────────────────────────────────────────────────────────────
// Security Settings API
// ─────────────────────────────────────────────────────────────

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  category: 'authentication' | 'authorization' | 'data' | 'network' | 'compliance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  lastModified: string;
}

export interface IPRule {
  id: string;
  address: string;
  type: 'allow' | 'block';
  description: string;
  createdAt: string;
}

export interface TokenPolicy {
  id: string;
  name: string;
  maxLifetime: number;
  refreshEnabled: boolean;
  rotationInterval: number;
}

/** 보안 정책 목록 조회 */
export async function getSecurityPolicies(): Promise<SecurityPolicy[]> {
  const client = getClient();
  return client.get<SecurityPolicy[]>('/api/admin/security/policies');
}

/** IP 규칙 목록 조회 */
export async function getIPRules(): Promise<IPRule[]> {
  const client = getClient();
  return client.get<IPRule[]>('/api/admin/security/ip-rules');
}

/** 토큰 정책 목록 조회 */
export async function getTokenPolicies(): Promise<TokenPolicy[]> {
  const client = getClient();
  return client.get<TokenPolicy[]>('/api/admin/security/token-policies');
}

/** 보안 정책 활성/비활성 토글 */
export async function toggleSecurityPolicy(
  id: string,
  enabled: boolean,
): Promise<SecurityPolicy> {
  const client = getClient();
  return client.put<SecurityPolicy>(`/api/admin/security/policies/${encodeURIComponent(id)}`, {
    body: { enabled },
  });
}

// ─────────────────────────────────────────────────────────────
// System Audit Logs API
// ─────────────────────────────────────────────────────────────

export type AuditEventCategory = 'auth' | 'data' | 'config' | 'workflow' | 'admin' | 'system';
export type AuditEventStatus = 'success' | 'failure' | 'warning' | 'info';

export interface AuditEvent {
  id: string;
  timestamp: string;
  category: AuditEventCategory;
  status: AuditEventStatus;
  action: string;
  userName: string;
  userEmail: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  details: string;
}

export interface AuditEventsResponse {
  events: AuditEvent[];
  total: number;
}

/** 시스템 감사 로그 조회 */
export async function getSystemAuditLogs(params?: {
  category?: AuditEventCategory;
  status?: AuditEventStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<AuditEventsResponse> {
  const client = getClient();
  const queryParams: Record<string, string> = {};
  if (params?.category) queryParams.category = params.category;
  if (params?.status) queryParams.status = params.status;
  if (params?.search) queryParams.search = params.search;
  if (params?.page) queryParams.page = String(params.page);
  if (params?.pageSize) queryParams.page_size = String(params.pageSize);
  return client.get<AuditEventsResponse>('/api/admin/audit-logs', { params: queryParams });
}

// ─────────────────────────────────────────────────────────────
// System Error Logs API
// ─────────────────────────────────────────────────────────────

export type ErrorLevel = 'error' | 'critical' | 'warning';

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  level: ErrorLevel;
  message: string;
  service: string;
  endpoint: string;
  stackTrace: string;
  requestId: string;
  statusCode: number;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ErrorLogsResponse {
  errors: ErrorLogEntry[];
  total: number;
}

/** 시스템 에러 로그 조회 */
export async function getSystemErrorLogs(params?: {
  level?: ErrorLevel;
  search?: string;
  resolved?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<ErrorLogsResponse> {
  const client = getClient();
  const queryParams: Record<string, string> = {};
  if (params?.level) queryParams.level = params.level;
  if (params?.search) queryParams.search = params.search;
  if (params?.resolved !== undefined) queryParams.resolved = String(params.resolved);
  if (params?.page) queryParams.page = String(params.page);
  if (params?.pageSize) queryParams.page_size = String(params.pageSize);
  return client.get<ErrorLogsResponse>('/api/admin/error-logs', { params: queryParams });
}

/** 에러 로그 resolve/unresolve 토글 */
export async function resolveErrorLog(id: string, resolved: boolean): Promise<ErrorLogEntry> {
  const client = getClient();
  return client.put<ErrorLogEntry>(`/api/admin/error-logs/${encodeURIComponent(id)}/resolve`, {
    body: { resolved },
  });
}
