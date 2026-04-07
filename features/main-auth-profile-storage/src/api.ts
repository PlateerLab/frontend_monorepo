'use client';

import { createApiClient } from '@xgen/api-client';
import type {
  AuthProfile,
  AuthProfileType,
  AuthProfileStatus,
  AuthProfileTestResult,
  AuthProfileStoreItem,
} from '@xgen/types';

// ─────────────────────────────────────────────────────────────
// Exported Types (used by form component)
// ─────────────────────────────────────────────────────────────

export interface ExtractionRule {
  name: string;
  source: 'body' | 'header' | 'cookie' | 'fixed';
  key_path: string;
  value: string | null;
}

export interface InjectionRule {
  source_field: string;
  target: 'header' | 'cookie' | 'query' | 'body';
  key: string;
  value_template: string;
  required?: boolean;
}

export interface LoginConfig {
  url: string;
  method: string;
  headers: Record<string, string>;
  payload: Record<string, unknown>;
  timeout: number;
}

export interface AuthProfileCreatePayload {
  service_id: string;
  name: string;
  description?: string | null;
  auth_type: string;
  login_config: LoginConfig;
  extraction_rules: ExtractionRule[];
  injection_rules: InjectionRule[];
  ttl: number;
}

export interface AuthProfileDetailRaw {
  service_id: string;
  name: string;
  description?: string;
  auth_type: string;
  status: string;
  login_config?: LoginConfig;
  extraction_rules?: ExtractionRule[] | string;
  injection_rules?: InjectionRule[] | string;
  ttl?: number;
  metadata?: Record<string, unknown>;
}

export interface FullTestResult extends AuthProfileTestResult {
  extractedContext?: Record<string, unknown>;
  responseHeaders?: Record<string, string>;
  responseBody?: unknown;
  extractionRules?: ExtractionRule[];
}

export function parseRules<T>(raw: T[] | string | undefined): T[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// ─────────────────────────────────────────────────────────────
// API Response Types (snake_case from backend)
// ─────────────────────────────────────────────────────────────

interface AuthProfileAPIResponse {
  service_id: string;
  name: string;
  description?: string;
  auth_type: string;
  status: string;
  payload?: string;
  user_id?: number;
  username?: string;
  created_at: string;
  updated_at: string;
  last_tested_at?: string;
  last_test_result?: {
    success: boolean;
    message?: string;
    response_time?: number;
    status_code?: number;
    error?: string;
  };
  login_config?: {
    url: string;
    method: string;
    headers: Record<string, string>;
    payload: Record<string, unknown>;
    timeout: number;
  };
  extraction_rules?: ExtractionRule[] | string;
  injection_rules?: InjectionRule[] | string;
  ttl?: number;
  metadata?: Record<string, unknown>;
}

interface TestResultAPIResponse {
  success: boolean;
  message?: string;
  response_time?: number;
  status_code?: number;
  error?: string;
}

interface AuthProfileStoreAPIResponse {
  template_id: string;
  service_id: string;
  name: string;
  description?: string;
  auth_type: string;
  tags?: string[];
  user_id?: number;
  username?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────
// Transform Functions
// ─────────────────────────────────────────────────────────────

function transformAuthType(authType: string): AuthProfileType {
  const lowerType = authType?.toLowerCase();
  if (lowerType === 'bearer') return 'bearer';
  if (lowerType === 'api_key') return 'api_key';
  if (lowerType === 'oauth2') return 'oauth2';
  if (lowerType === 'basic') return 'basic';
  return 'custom';
}

function transformStatus(status: string): AuthProfileStatus {
  return status?.toLowerCase() === 'active' ? 'active' : 'inactive';
}

function transformAuthProfile(raw: AuthProfileAPIResponse): AuthProfile {
  return {
    serviceId: raw.service_id,
    name: raw.name,
    description: raw.description,
    authType: transformAuthType(raw.auth_type),
    status: transformStatus(raw.status),
    payload: raw.payload,
    userId: raw.user_id,
    username: raw.username,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    lastTestedAt: raw.last_tested_at,
    lastTestResult: raw.last_test_result
      ? {
          success: raw.last_test_result.success,
          message: raw.last_test_result.message,
          responseTime: raw.last_test_result.response_time,
          statusCode: raw.last_test_result.status_code,
          error: raw.last_test_result.error,
        }
      : undefined,
    metadata: raw.metadata,
  };
}

function transformTestResult(raw: TestResultAPIResponse): AuthProfileTestResult {
  return {
    success: raw.success,
    message: raw.message,
    responseTime: raw.response_time,
    statusCode: raw.status_code,
    error: raw.error,
  };
}

// ─────────────────────────────────────────────────────────────
// Auth Profile Storage APIs
// ─────────────────────────────────────────────────────────────

const API_BASE = '/api/session-station/v1';

/** 인증 프로필 목록 조회 */
export async function listAuthProfiles(): Promise<AuthProfile[]> {
  const api = createApiClient();
  const response = await api.get<AuthProfileAPIResponse[]>(`${API_BASE}/auth-profiles`);
  return (response.data || []).map(transformAuthProfile);
}

/** 인증 프로필 상세 조회 */
export async function getAuthProfile(serviceId: string): Promise<AuthProfile> {
  const api = createApiClient();
  const response = await api.get<AuthProfileAPIResponse>(`${API_BASE}/auth-profiles/${encodeURIComponent(serviceId)}`);
  return transformAuthProfile(response.data);
}

/** 인증 프로필 생성 */
export async function createAuthProfile(
  data: Omit<AuthProfile, 'serviceId' | 'createdAt' | 'updatedAt'>
): Promise<AuthProfile> {
  const api = createApiClient();
  const requestBody = {
    name: data.name,
    description: data.description,
    auth_type: data.authType,
    status: data.status,
    payload: data.payload,
    metadata: data.metadata,
  };
  const response = await api.post<AuthProfileAPIResponse>(`${API_BASE}/auth-profiles`, requestBody);
  return transformAuthProfile(response.data);
}

/** 인증 프로필 수정 */
export async function updateAuthProfile(
  serviceId: string,
  data: Partial<Omit<AuthProfile, 'serviceId' | 'createdAt' | 'updatedAt'>>
): Promise<AuthProfile> {
  const api = createApiClient();
  const requestBody: Record<string, unknown> = {};
  if (data.name !== undefined) requestBody.name = data.name;
  if (data.description !== undefined) requestBody.description = data.description;
  if (data.authType !== undefined) requestBody.auth_type = data.authType;
  if (data.status !== undefined) requestBody.status = data.status;
  if (data.payload !== undefined) requestBody.payload = data.payload;
  if (data.metadata !== undefined) requestBody.metadata = data.metadata;

  const response = await api.put<AuthProfileAPIResponse>(
    `${API_BASE}/auth-profiles/${encodeURIComponent(serviceId)}`,
    requestBody
  );
  return transformAuthProfile(response.data);
}

/** 인증 프로필 삭제 */
export async function deleteAuthProfile(serviceId: string): Promise<boolean> {
  const api = createApiClient();
  await api.delete(`${API_BASE}/auth-profiles/${encodeURIComponent(serviceId)}`);
  return true;
}

/** 인증 프로필 테스트 (연결 확인) */
export async function testAuthProfile(serviceId: string): Promise<AuthProfileTestResult> {
  const api = createApiClient();
  const response = await api.post<TestResultAPIResponse>(
    `${API_BASE}/auth-profiles/${encodeURIComponent(serviceId)}/test`
  );
  return transformTestResult(response.data);
}

/** 인증 프로필 테스트 (전체 결과 포함) */
export async function testAuthProfileFull(serviceId: string): Promise<FullTestResult> {
  const api = createApiClient();
  const response = await api.post<TestResultAPIResponse & {
    extracted_context?: Record<string, unknown>;
    response_headers?: Record<string, string>;
    response_body?: unknown;
    extraction_rules?: ExtractionRule[];
  }>(
    `${API_BASE}/auth-profiles/${encodeURIComponent(serviceId)}/test`
  );
  const raw = response.data;
  return {
    success: raw.success,
    message: raw.message,
    responseTime: raw.response_time,
    statusCode: raw.status_code,
    error: raw.error,
    extractedContext: raw.extracted_context,
    responseHeaders: raw.response_headers,
    responseBody: raw.response_body,
    extractionRules: raw.extraction_rules,
  };
}

/** 인증 프로필 상태 토글 */
export async function toggleAuthProfileStatus(
  serviceId: string,
  currentStatus: AuthProfileStatus
): Promise<AuthProfile> {
  const newStatus: AuthProfileStatus = currentStatus === 'active' ? 'inactive' : 'active';
  return updateAuthProfile(serviceId, { status: newStatus });
}

/** 스토어(라이브러리)에 업로드 */
export async function uploadToAuthProfileStore(params: {
  serviceId: string;
  name: string;
  description?: string;
  tags: string[];
}): Promise<AuthProfileStoreItem> {
  const api = createApiClient();
  const requestBody = {
    service_id: params.serviceId,
    name: params.name,
    description: params.description,
    tags: params.tags,
  };
  const response = await api.post<AuthProfileStoreAPIResponse>(`${API_BASE}/auth-profile-store/upload`, requestBody);
  const raw = response.data;

  return {
    templateId: raw.template_id,
    serviceId: raw.service_id,
    name: raw.name,
    description: raw.description,
    authType: transformAuthType(raw.auth_type),
    tags: raw.tags || [],
    userId: raw.user_id,
    username: raw.username,
    createdAt: raw.created_at,
    metadata: raw.metadata,
  };
}

// ─────────────────────────────────────────────────────────────
// Full CRUD APIs (used by auth profile form)
// ─────────────────────────────────────────────────────────────

/** 인증 프로필 상세 조회 (편집용 - raw 형태 반환) */
export async function getAuthProfileDetail(serviceId: string): Promise<AuthProfileDetailRaw> {
  const api = createApiClient();
  const response = await api.get<AuthProfileAPIResponse>(
    `${API_BASE}/auth-profiles/${encodeURIComponent(serviceId)}`
  );
  const raw = response.data;
  return {
    service_id: raw.service_id,
    name: raw.name,
    description: raw.description,
    auth_type: raw.auth_type,
    status: raw.status,
    login_config: raw.login_config,
    extraction_rules: raw.extraction_rules,
    injection_rules: raw.injection_rules,
    ttl: raw.ttl,
    metadata: raw.metadata,
  };
}

/** 인증 프로필 생성 (전체 필드) */
export async function createAuthProfileFull(data: AuthProfileCreatePayload): Promise<void> {
  const api = createApiClient();
  await api.post(`${API_BASE}/auth-profiles`, data);
}

/** 인증 프로필 수정 (전체 필드) */
export async function updateAuthProfileFull(
  serviceId: string,
  data: AuthProfileCreatePayload,
): Promise<void> {
  const api = createApiClient();
  await api.put(`${API_BASE}/auth-profiles/${encodeURIComponent(serviceId)}`, data);
}
