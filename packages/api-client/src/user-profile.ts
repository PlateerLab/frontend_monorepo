/**
 * User Profile API
 * 마이페이지 — 사용자 본인의 프로필 조회/수정/비밀번호 변경
 */

import { createApiClient } from './index';
import { hashPassword } from './auth';

// ============================================================================
// Types
// ============================================================================

export interface UserProfileDetail {
  id: number;
  username: string;
  email: string;
  full_name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_superuser: boolean;
  roles: string[];
  permissions: string[];
  last_login: string | null;
  preferences: Record<string, unknown> | null;
  /** @deprecated Use is_superuser instead */
  is_admin?: boolean;
  /** @deprecated Use roles instead */
  user_type?: string;
  /** @deprecated Use permissions-based checks */
  available_user_sections?: string[] | null;
  /** @deprecated Use permissions-based checks */
  available_admin_sections?: string[] | null;
}

export interface UpdateUserProfileData {
  full_name?: string;
  preferences?: Record<string, unknown>;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * 현재 로그인한 사용자의 상세 프로필 조회
 * GET /api/admin/user
 */
export async function fetchUserProfile(): Promise<UserProfileDetail> {
  const api = createApiClient();
  const response = await api.get<{ user: UserProfileDetail }>('/api/admin/user');
  return response.data.user;
}

/**
 * 사용자 프로필 정보 수정 (full_name, preferences)
 * PUT /api/admin/user
 */
export async function updateUserProfile(data: UpdateUserProfileData): Promise<UserProfileDetail> {
  const api = createApiClient();
  const response = await api.put<{ user: UserProfileDetail }>('/api/admin/user', data);
  return response.data.user;
}

/**
 * 비밀번호 변경
 * PUT /api/admin/user/password
 * 비밀번호는 SHA-256 해시하여 전송
 */
export async function updateUserPassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string }> {
  const hashedCurrent = await hashPassword(currentPassword);
  const hashedNew = await hashPassword(newPassword);

  const api = createApiClient();
  const response = await api.put<{ message: string }>('/api/admin/user/password', {
    current_password: hashedCurrent,
    new_password: hashedNew,
  });
  return response.data;
}
