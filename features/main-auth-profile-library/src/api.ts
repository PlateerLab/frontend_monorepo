'use client';

import { createApiClient } from '@xgen/api-client';
import type {
  AuthProfile,
  AuthProfileStoreItem,
  AuthProfileType,
} from '@xgen/types';

// ─────────────────────────────────────────────────────────────
// API Response Types (snake_case from backend)
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// Auth Profile Library (Store) APIs
// ─────────────────────────────────────────────────────────────

const API_BASE = '/api/session-station/v1';

/** 라이브러리(스토어) 목록 조회 */
export async function listAuthProfileStore(): Promise<AuthProfileStoreItem[]> {
  const api = createApiClient();
  const response = await api.get<{ profiles: AuthProfileStoreAPIResponse[] }>(
    `${API_BASE}/auth-profile-store/list`
  );
  return (response.data?.profiles || []).map(transformStoreItem);
}

/** 라이브러리에서 다운로드 (내 보관함으로) */
export async function downloadFromAuthProfileStore(templateId: string): Promise<AuthProfile> {
  const api = createApiClient();
  const response = await api.post<AuthProfileAPIResponse>(
    `${API_BASE}/auth-profile-store/download/${encodeURIComponent(templateId)}`
  );
  const raw = response.data;
  return {
    serviceId: raw.service_id,
    name: raw.name,
    description: raw.description,
    authType: transformAuthType(raw.auth_type),
    status: raw.status?.toLowerCase() === 'active' ? 'active' : 'inactive',
    payload: raw.payload,
    userId: raw.user_id,
    username: raw.username,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    lastTestedAt: raw.last_tested_at,
    metadata: raw.metadata,
  };
}

/** 라이브러리에서 삭제 */
export async function deleteFromAuthProfileStore(templateId: string): Promise<boolean> {
  const api = createApiClient();
  await api.delete(`${API_BASE}/auth-profile-store/${encodeURIComponent(templateId)}`);
  return true;
}

// ─────────────────────────────────────────────────────────────
// Upload to Library (from my storage)
// ─────────────────────────────────────────────────────────────

export interface MyStorageProfile {
  serviceId: string;
  name: string;
  description?: string;
  authType: string;
}

/** 내 보관함 프로필 목록 (업로드 모달용) */
export async function listMyStorageProfiles(): Promise<MyStorageProfile[]> {
  const api = createApiClient();
  const response = await api.get<{ auth_profiles: AuthProfileAPIResponse[] }>(
    `${API_BASE}/auth-profiles`,
  );
  return (response.data?.auth_profiles || []).map((raw) => ({
    serviceId: raw.service_id,
    name: raw.name,
    description: raw.description,
    authType: raw.auth_type,
  }));
}

/** 보관함 프로필을 라이브러리에 업로드 */
export async function uploadToAuthProfileStore(params: {
  serviceId: string;
  name: string;
  description?: string;
  tags: string[];
}): Promise<AuthProfileStoreItem> {
  const api = createApiClient();
  const response = await api.post<AuthProfileStoreAPIResponse>(
    `${API_BASE}/auth-profile-store/upload`,
    {
      service_id: params.serviceId,
      name: params.name,
      description: params.description ?? '',
      tags: params.tags,
    },
  );
  return transformStoreItem(response.data);
}
