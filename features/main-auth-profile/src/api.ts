'use client';

import { createApiClient } from '@xgen/api-client';
import type {
  AuthProfile,
  AuthProfileStoreItem,
  AuthProfileType,
  AuthProfileStatus,
  AuthProfileTestResult,
} from '@xgen/types';

// ─────────────────────────────────────────────────────────────
// API Response Types
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
  metadata?: Record<string, unknown>;
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

interface TestResultAPIResponse {
  success: boolean;
  message?: string;
  response_time?: number;
  status_code?: number;
  error?: string;
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

function transformStoreItem(raw: AuthProfileStoreAPIResponse): AuthProfileStoreItem {
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
// Auth Profile APIs (Storage)
// ─────────────────────────────────────────────────────────────

const API_BASE = '/api/session-station/v1';

/** 인증 프로필 목록 조회 */
export async function listAuthProfiles(): Promise<AuthProfile[]> {
  const api = createApiClient();
  const data = await api.get<AuthProfileAPIResponse[]>(`${API_BASE}/auth-profiles`);
  return (data || []).map(transformAuthProfile);
}

/** 인증 프로필 상세 조회 */
export async function getAuthProfile(serviceId: string): Promise<AuthProfile> {
  const api = createApiClient();
  const data = await api.get<AuthProfileAPIResponse>(`${API_BASE}/auth-profiles/${serviceId}`);
  return transformAuthProfile(data);
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
  return transformAuthProfile(response);
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
    `${API_BASE}/auth-profiles/${serviceId}`,
    requestBody
  );
  return transformAuthProfile(response);
}

/** 인증 프로필 삭제 */
export async function deleteAuthProfile(serviceId: string): Promise<boolean> {
  const api = createApiClient();
  await api.delete(`${API_BASE}/auth-profiles/${serviceId}`);
  return true;
}

/** 인증 프로필 테스트 (연결 확인) */
export async function testAuthProfile(serviceId: string): Promise<AuthProfileTestResult> {
  const api = createApiClient();
  const data = await api.post<TestResultAPIResponse>(`${API_BASE}/auth-profiles/${serviceId}/test`);
  return transformTestResult(data);
}

/** 인증 프로필 상태 토글 */
export async function toggleAuthProfileStatus(
  serviceId: string,
  currentStatus: AuthProfileStatus
): Promise<AuthProfile> {
  const newStatus: AuthProfileStatus = currentStatus === 'active' ? 'inactive' : 'active';
  return updateAuthProfile(serviceId, { status: newStatus });
}

// ─────────────────────────────────────────────────────────────
// Auth Profile Store APIs
// ─────────────────────────────────────────────────────────────

/** 스토어 목록 조회 */
export async function listAuthProfileStore(): Promise<AuthProfileStoreItem[]> {
  const api = createApiClient();
  const data = await api.get<{ profiles: AuthProfileStoreAPIResponse[] }>(
    `${API_BASE}/auth-profile-store/list`
  );
  return (data?.profiles || []).map(transformStoreItem);
}

/** 스토어에 업로드 */
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
  const response = await api.post<AuthProfileStoreAPIResponse>(
    `${API_BASE}/auth-profile-store/upload`,
    requestBody
  );
  return transformStoreItem(response);
}

/** 스토어에서 다운로드 (내 Storage로) */
export async function downloadFromAuthProfileStore(templateId: string): Promise<AuthProfile> {
  const api = createApiClient();
  const response = await api.post<AuthProfileAPIResponse>(
    `${API_BASE}/auth-profile-store/download/${templateId}`
  );
  return transformAuthProfile(response);
}

/** 스토어에서 삭제 */
export async function deleteFromAuthProfileStore(templateId: string): Promise<boolean> {
  const api = createApiClient();
  await api.delete(`${API_BASE}/auth-profile-store/${templateId}`);
  return true;
}
