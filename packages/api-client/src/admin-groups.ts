'use client';

import { createApiClient } from './index';
import type { AdminGroup, AdminUser } from '@xgen/types';

function getClient() {
  return createApiClient({ service: 'core' });
}

/**
 * 모든 그룹 목록 (상세 정보 포함)
 */
export async function getAllGroups(): Promise<AdminGroup[]> {
  const client = getClient();
  const res = await client.get<{ groups: AdminGroup[] }>(
    '/api/admin/group/all-groups',
  );
  return res.data.groups;
}

/**
 * 모든 그룹명 목록 (간단)
 */
export async function getAllGroupsList(): Promise<string[]> {
  const client = getClient();
  const res = await client.get<{ groups: string[] }>(
    '/api/admin/group/all-groups/list',
  );
  return res.data.groups;
}

/**
 * 새 그룹 생성
 */
export async function createGroup(groupData: {
  group_name: string;
  available?: boolean;
  available_sections?: string[];
}): Promise<unknown> {
  const client = getClient();
  return client.post('/api/admin/group/create', groupData);
}

/**
 * 특정 그룹의 사용자 목록
 */
export async function getGroupUsers(
  groupName: string,
): Promise<AdminUser[]> {
  const client = getClient();
  const res = await client.get<{ users: AdminUser[] }>(
    `/api/admin/group/group-users?group_name=${encodeURIComponent(groupName)}`,
  );
  return res.data.users;
}

/**
 * 그룹 권한 업데이트
 */
export async function updateGroupPermissions(updateData: {
  group_name: string;
  available: boolean;
  available_sections: string[];
}): Promise<unknown> {
  const client = getClient();
  return client.post('/api/admin/group/update', updateData);
}

/**
 * 그룹 삭제
 */
export async function deleteGroup(
  groupName: string,
): Promise<unknown> {
  const client = getClient();
  return client.delete(
    `/api/admin/group/group?group_name=${encodeURIComponent(groupName)}`,
  );
}
