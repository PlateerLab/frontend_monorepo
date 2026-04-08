'use client';

import { createApiClient } from './index';
import { hashPassword } from './auth';
import type { AdminUser, AdminUsersResponse } from '@xgen/types';

function getClient() {
  return createApiClient({ service: 'core' });
}

/**
 * 모든 사용자 목록 (페이지네이션)
 */
export async function getAllUsers(
  page = 1,
  pageSize = 100,
): Promise<AdminUsersResponse> {
  const client = getClient();
  const res = await client.get<AdminUsersResponse>(
    `/api/admin/user/all-users?page=${page}&page_size=${pageSize}`,
  );
  return res.data;
}

/**
 * 대기 중인 사용자 목록
 */
export async function getStandbyUsers(): Promise<AdminUser[]> {
  const client = getClient();
  const res = await client.get<{ users: AdminUser[] }>(
    '/api/admin/user/standby-users',
  );
  return res.data.users;
}

/**
 * 대기 사용자 승인
 */
export async function approveUser(userData: {
  id: number;
  username: string;
  email: string;
}): Promise<unknown> {
  const client = getClient();
  return client.post('/api/admin/user/approve-user', userData);
}

/**
 * 사용자 삭제
 */
export async function deleteUser(userData: {
  id: number;
  username: string;
  email: string;
}): Promise<unknown> {
  const client = getClient();
  return client.delete('/api/admin/user/user-account', userData);
}

/**
 * 사용자 편집
 * password_hash가 있으면 해시 처리 후 전송
 */
export async function editUser(
  userData: Partial<AdminUser> & { id: number },
): Promise<unknown> {
  const client = getClient();
  const payload = { ...userData };

  if (payload.password_hash) {
    payload.password_hash = await hashPassword(payload.password_hash);
  }

  return client.put('/api/admin/user/edit-user', payload);
}
