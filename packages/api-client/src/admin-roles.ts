'use client';

import { createApiClient } from './index';
import type {
  AdminRole, AdminPermission, AdminSupervision,
  AdminUserDirectPermission, PermissionGroup, ResolvedUserPermissions,
} from '@xgen/types';

function getClient() {
  return createApiClient({ service: 'core' });
}

// ──────────────────────────────────────────
// Role CRUD
// ──────────────────────────────────────────

export async function getAllRoles(): Promise<AdminRole[]> {
  const client = getClient();
  const res = await client.get<{ roles: AdminRole[] }>('/api/admin/roles');
  return res.data.roles;
}

export async function createRole(data: {
  name: string;
  display_name?: string;
  description?: string;
}): Promise<{ success: boolean; role: AdminRole }> {
  const client = getClient();
  const res = await client.post<{ success: boolean; role: AdminRole }>('/api/admin/roles', data);
  return res.data;
}

export async function updateRole(roleId: number, data: {
  name?: string;
  display_name?: string;
  description?: string;
}): Promise<{ success: boolean; role: AdminRole }> {
  const client = getClient();
  const res = await client.put<{ success: boolean; role: AdminRole }>(`/api/admin/roles/${roleId}`, data);
  return res.data;
}

export async function deleteRole(roleId: number): Promise<{ success: boolean }> {
  const client = getClient();
  const res = await client.delete<{ success: boolean }>(`/api/admin/roles/${roleId}`);
  return res.data;
}

// ──────────────────────────────────────────
// Role Permissions
// ──────────────────────────────────────────

export async function getRolePermissions(roleId: number): Promise<{
  role: AdminRole;
  permissions: AdminPermission[];
}> {
  const client = getClient();
  const res = await client.get<{ role: AdminRole; permissions: AdminPermission[] }>(
    `/api/admin/roles/${roleId}/permissions`,
  );
  return res.data;
}

export async function updateRolePermissions(roleId: number, permissionIds: number[]): Promise<{
  success: boolean;
  permissions_set: number;
}> {
  const client = getClient();
  const res = await client.put<{ success: boolean; permissions_set: number }>(
    `/api/admin/roles/${roleId}/permissions`,
    { permission_ids: permissionIds },
  );
  return res.data;
}

// ──────────────────────────────────────────
// Permissions
// ──────────────────────────────────────────

export async function getAllPermissions(): Promise<{
  db_permissions: AdminPermission[];
  defined_permissions: PermissionGroup;
}> {
  const client = getClient();
  const res = await client.get<{
    db_permissions: AdminPermission[];
    defined_permissions: PermissionGroup;
  }>('/api/admin/permissions');
  return res.data;
}

// ──────────────────────────────────────────
// Role ↔ Users
// ──────────────────────────────────────────

export async function getRoleUsers(roleId: number): Promise<{
  role: AdminRole;
  users: Array<{
    id: number;
    username: string;
    email: string;
    full_name: string | null;
    is_active: boolean;
    assigned_by: number | null;
  }>;
}> {
  const client = getClient();
  const res = await client.get<{
    role: AdminRole;
    users: Array<{
      id: number;
      username: string;
      email: string;
      full_name: string | null;
      is_active: boolean;
      assigned_by: number | null;
    }>;
  }>(`/api/admin/roles/${roleId}/users`);
  return res.data;
}

// ──────────────────────────────────────────
// User ↔ Role
// ──────────────────────────────────────────

export async function getUserRoles(userId: number): Promise<{
  user_id: number;
  roles: AdminRole[];
}> {
  const client = getClient();
  const res = await client.get<{ user_id: number; roles: AdminRole[] }>(
    `/api/admin/roles/user/${userId}`,
  );
  return res.data;
}

export async function assignUserRole(userId: number, roleId: number): Promise<{ success: boolean }> {
  const client = getClient();
  const res = await client.post<{ success: boolean }>('/api/admin/roles/user', {
    user_id: userId,
    role_id: roleId,
  });
  return res.data;
}

export async function removeUserRole(userId: number, roleId: number): Promise<{ success: boolean }> {
  const client = getClient();
  const res = await client.delete<{ success: boolean }>(`/api/admin/roles/user/${userId}/${roleId}`);
  return res.data;
}

// ──────────────────────────────────────────
// User Direct Permissions
// ──────────────────────────────────────────

export async function getUserDirectPermissions(userId: number): Promise<{
  user_id: number;
  direct_permissions: AdminUserDirectPermission[];
}> {
  const client = getClient();
  const res = await client.get<{
    user_id: number;
    direct_permissions: AdminUserDirectPermission[];
  }>(`/api/admin/permissions/user/${userId}`);
  return res.data;
}

export async function setUserDirectPermission(
  userId: number, permissionId: number, granted: boolean,
): Promise<{ success: boolean }> {
  const client = getClient();
  const res = await client.post<{ success: boolean }>('/api/admin/permissions/user', {
    user_id: userId,
    permission_id: permissionId,
    granted,
  });
  return res.data;
}

export async function removeUserDirectPermission(
  userId: number, permissionId: number,
): Promise<{ success: boolean }> {
  const client = getClient();
  const res = await client.delete<{ success: boolean }>(
    `/api/admin/permissions/user/${userId}/${permissionId}`,
  );
  return res.data;
}

// ──────────────────────────────────────────
// Resolved Permissions
// ──────────────────────────────────────────

export async function resolveUserPermissions(userId: number): Promise<ResolvedUserPermissions> {
  const client = getClient();
  const res = await client.get<ResolvedUserPermissions>(`/api/admin/permissions/resolve/${userId}`);
  return res.data;
}

// ──────────────────────────────────────────
// Supervision
// ──────────────────────────────────────────

export async function getAllSupervisions(): Promise<AdminSupervision[]> {
  const client = getClient();
  const res = await client.get<{ supervisions: AdminSupervision[] }>('/api/admin/roles/supervision');
  return res.data.supervisions;
}

export async function getRoleSupervision(roleId: number): Promise<{
  role: AdminRole;
  targets: Array<{
    id: number;
    target_role_id: number;
    target_role_name: string | null;
    supervision_type: string;
    description: string | null;
  }>;
}> {
  const client = getClient();
  const res = await client.get<{
    role: AdminRole;
    targets: Array<{
      id: number;
      target_role_id: number;
      target_role_name: string | null;
      supervision_type: string;
      description: string | null;
    }>;
  }>(`/api/admin/roles/${roleId}/supervision`);
  return res.data;
}

export async function createSupervision(supervisorRoleId: number, data: {
  target_role_id: number;
  supervision_type: 'full' | 'monitor' | 'audit';
  description?: string;
}): Promise<{ success: boolean }> {
  const client = getClient();
  const res = await client.post<{ success: boolean }>(
    `/api/admin/roles/${supervisorRoleId}/supervision`,
    data,
  );
  return res.data;
}

export async function deleteSupervision(
  supervisorRoleId: number, targetRoleId: number,
): Promise<{ success: boolean }> {
  const client = getClient();
  const res = await client.delete<{ success: boolean }>(
    `/api/admin/roles/${supervisorRoleId}/supervision/${targetRoleId}`,
  );
  return res.data;
}
