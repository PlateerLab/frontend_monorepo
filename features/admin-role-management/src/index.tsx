'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  AdminFeatureModule, AdminRole, AdminPermission,
  AdminSupervision, AdminUser, RouteComponentProps, PermissionGroup,
} from '@xgen/types';
import {
  ContentArea, DataTable, StatusBadge, SearchInput, Button, useToast,
} from '@xgen/ui';
import type { DataTableColumn } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import {
  getAllRoles, createRole, updateRole, deleteRole,
  getRolePermissions, updateRolePermissions,
  getAllPermissions, getAllSupervisions,
  createSupervision, deleteSupervision,
  getAllUsers, getRoleUsers, assignUserRole, removeUserRole,
} from '@xgen/api-client';

// ─────────────────────────────────────────────────────────────
// Sub-components (inline for simplicity)
// ─────────────────────────────────────────────────────────────

// ── Role Create/Edit Modal ──
const RoleFormModal: React.FC<{
  isOpen: boolean;
  role?: AdminRole | null;
  onClose: () => void;
  onSubmit: (data: { name: string; display_name: string; description: string }) => void;
}> = ({ isOpen, role, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDisplayName(role.display_name);
      setDescription(role.description ?? '');
    } else {
      setName('');
      setDisplayName('');
      setDescription('');
    }
  }, [role, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {role ? t('admin.roleManagement.editRole', '역할 수정') : t('admin.roleManagement.createRole', '역할 생성')}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.roleManagement.roleName', '역할명 (영문)')}</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. content-manager"
              disabled={!!role}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.roleManagement.displayName', '표시명')}</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. 콘텐츠 관리자"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.roleManagement.description', '설명')}</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>{t('common.cancel', '취소')}</Button>
          <Button
            onClick={() => onSubmit({ name, display_name: displayName || name, description })}
            disabled={!name.trim()}
          >
            {role ? t('common.save', '저장') : t('common.create', '생성')}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Permission Selector Modal ──
const PermissionSelectorModal: React.FC<{
  isOpen: boolean;
  role: AdminRole | null;
  allPermissions: AdminPermission[];
  definedPermissions: PermissionGroup;
  currentPermissionIds: number[];
  onClose: () => void;
  onSubmit: (permissionIds: number[]) => void;
}> = ({ isOpen, role, allPermissions, definedPermissions, currentPermissionIds, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    setSelected(new Set(currentPermissionIds));
    setSearch('');
  }, [currentPermissionIds, isOpen]);

  const grouped = useMemo(() => {
    const groups: Record<string, AdminPermission[]> = {};
    for (const p of allPermissions) {
      const group = p.resource.split('.')[0] || 'other';
      if (!groups[group]) groups[group] = [];
      groups[group].push(p);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [allPermissions]);

  const filteredGrouped = useMemo(() => {
    if (!search) return grouped;
    const q = search.toLowerCase();
    return grouped
      .map(([group, perms]) => [group, perms.filter(p =>
        `${p.resource}:${p.action}`.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q),
      )] as [string, AdminPermission[]])
      .filter(([, perms]) => perms.length > 0);
  }, [grouped, search]);

  const togglePermission = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroup = (perms: AdminPermission[]) => {
    const ids = perms.map(p => p.id);
    const allSelected = ids.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      ids.forEach(id => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

  if (!isOpen || !role) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl p-6 max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {t('admin.roleManagement.permissionsFor', '권한 설정')}: {role.display_name}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('admin.roleManagement.searchPermissions', '권한 검색...')}
          className="mb-4"
        />
        <div className="flex-1 overflow-y-auto space-y-4">
          {filteredGrouped.map(([group, perms]) => {
            const allChecked = perms.every(p => selected.has(p.id));
            const someChecked = perms.some(p => selected.has(p.id));
            return (
              <div key={group} className="border rounded-lg p-3 dark:border-gray-600">
                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                    onChange={() => toggleGroup(perms)}
                    className="rounded"
                  />
                  <span className="font-semibold text-sm uppercase">{group}</span>
                  <span className="text-xs text-gray-400">({perms.length})</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 ml-6">
                  {perms.map(p => (
                    <label key={p.id} className="flex items-center gap-2 cursor-pointer text-sm py-0.5">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => togglePermission(p.id)}
                        className="rounded"
                      />
                      <span className="font-mono text-xs">{p.resource}:{p.action}</span>
                      {p.description && (
                        <span className="text-gray-400 text-xs truncate">— {p.description}</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
          {filteredGrouped.length === 0 && (
            <p className="text-center text-gray-400 py-8">
              {allPermissions.length === 0
                ? t('admin.roleManagement.noPermissionsInDb', 'DB에 등록된 권한이 없습니다. 서버 시작 시 자동 등록됩니다.')
                : t('admin.roleManagement.noMatchingPermissions', '검색 결과가 없습니다.')
              }
            </p>
          )}
        </div>
        <div className="flex justify-between items-center mt-4 pt-4 border-t dark:border-gray-600">
          <span className="text-sm text-gray-500">{selected.size}개 선택됨</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>{t('common.cancel', '취소')}</Button>
            <Button onClick={() => onSubmit(Array.from(selected))}>
              {t('common.save', '저장')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Supervision Create Modal ──
const SupervisionModal: React.FC<{
  isOpen: boolean;
  roles: AdminRole[];
  onClose: () => void;
  onSubmit: (supervisorRoleId: number, targetRoleId: number, type: 'full' | 'monitor' | 'audit', desc: string) => void;
}> = ({ isOpen, roles, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const [supervisorId, setSupervisorId] = useState<number>(0);
  const [targetId, setTargetId] = useState<number>(0);
  const [type, setType] = useState<'full' | 'monitor' | 'audit'>('monitor');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    setSupervisorId(0);
    setTargetId(0);
    setType('monitor');
    setDesc('');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{t('admin.roleManagement.addSupervision', '감독 관계 추가')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.roleManagement.supervisorRole', '감독 역할')}</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
              value={supervisorId}
              onChange={(e) => setSupervisorId(Number(e.target.value))}
            >
              <option value={0}>{t('admin.roleManagement.selectRole', '역할 선택...')}</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.display_name} ({r.name})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.roleManagement.targetRole', '대상 역할')}</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
              value={targetId}
              onChange={(e) => setTargetId(Number(e.target.value))}
            >
              <option value={0}>{t('admin.roleManagement.selectRole', '역할 선택...')}</option>
              {roles.filter(r => r.id !== supervisorId).map(r =>
                <option key={r.id} value={r.id}>{r.display_name} ({r.name})</option>,
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.roleManagement.supervisionType', '감독 유형')}</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
              value={type}
              onChange={(e) => setType(e.target.value as 'full' | 'monitor' | 'audit')}
            >
              <option value="full">Full — 조회, 역할 변경, 비활성화, 권한 수정</option>
              <option value="monitor">Monitor — 조회, 활동 로그 열람</option>
              <option value="audit">Audit — 활동 이력 및 권한 변경 이력 열람</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.roleManagement.description', '설명')}</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>{t('common.cancel', '취소')}</Button>
          <Button
            onClick={() => onSubmit(supervisorId, targetId, type, desc)}
            disabled={!supervisorId || !targetId}
          >
            {t('common.create', '생성')}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Permission Verify Modal ──
const PermissionVerifyModal: React.FC<{
  isOpen: boolean;
  users: AdminUser[];
  onClose: () => void;
}> = ({ isOpen, users, onClose }) => {
  const { t } = useTranslation();
  const [selectedUserId, setSelectedUserId] = useState<number>(0);
  const [result, setResult] = useState<{
    user_id: number; username: string; is_superuser: boolean; roles: string[]; permissions: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setSelectedUserId(0);
    setResult(null);
  }, [isOpen]);

  const handleResolve = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      const { resolveUserPermissions } = await import('@xgen/api-client');
      const data = await resolveUserPermissions(selectedUserId);
      setResult(data);
    } catch {
      toast.error('권한 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{t('admin.roleManagement.verifyPermissions', '권한 검증')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="flex gap-2 mb-4">
          <select
            className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(Number(e.target.value))}
          >
            <option value={0}>사용자 선택...</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.email})</option>)}
          </select>
          <Button onClick={handleResolve} disabled={!selectedUserId || loading}>
            {loading ? '조회 중...' : '권한 조회'}
          </Button>
        </div>
        {result && (
          <div className="flex-1 overflow-y-auto space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">{result.username}</span>
              {result.is_superuser && <StatusBadge variant="error" dot={false}>Superuser</StatusBadge>}
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">역할:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {result.roles.length ? result.roles.map(r => (
                  <StatusBadge key={r} variant="info" dot={false}>{r}</StatusBadge>
                )) : <span className="text-sm text-gray-400">없음</span>}
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">최종 권한 ({result.permissions.length}개):</span>
              <div className="mt-1 max-h-60 overflow-y-auto">
                {result.permissions.map(p => (
                  <div key={p} className="font-mono text-xs py-0.5 text-gray-700 dark:text-gray-300">{p}</div>
                ))}
                {result.permissions.length === 0 && (
                  <span className="text-sm text-gray-400">권한 없음</span>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end mt-4 pt-4 border-t dark:border-gray-600">
          <Button variant="outline" onClick={onClose}>{t('common.close', '닫기')}</Button>
        </div>
      </div>
    </div>
  );
};

// ── Role Users Modal ──
const RoleUsersModal: React.FC<{
  isOpen: boolean;
  role: AdminRole | null;
  allUsers: AdminUser[];
  onClose: () => void;
}> = ({ isOpen, role, allUsers, onClose }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [assignedUsers, setAssignedUsers] = useState<Array<{
    id: number; username: string; email: string; full_name: string | null; is_active: boolean;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchRoleUsers = useCallback(async () => {
    if (!role) return;
    setLoading(true);
    try {
      const data = await getRoleUsers(role.id);
      setAssignedUsers(data.users ?? []);
    } catch {
      toast.error('사용자 목록 로드 실패');
    } finally {
      setLoading(false);
    }
  }, [role, toast]);

  useEffect(() => {
    if (isOpen && role) {
      fetchRoleUsers();
      setSearch('');
    }
  }, [isOpen, role, fetchRoleUsers]);

  const handleAssign = async (userId: number) => {
    if (!role) return;
    try {
      await assignUserRole(userId, role.id);
      toast.success('사용자가 역할에 할당되었습니다.');
      fetchRoleUsers();
    } catch {
      toast.error('사용자 할당 실패');
    }
  };

  const handleRemove = async (userId: number) => {
    if (!role) return;
    try {
      await removeUserRole(userId, role.id);
      toast.success('사용자가 역할에서 제거되었습니다.');
      fetchRoleUsers();
    } catch {
      toast.error('사용자 제거 실패');
    }
  };

  const assignedUserIds = useMemo(() => new Set(assignedUsers.map(u => u.id)), [assignedUsers]);

  const availableUsers = useMemo(() => {
    const base = allUsers.filter(u => !assignedUserIds.has(u.id));
    if (!search) return base;
    const q = search.toLowerCase();
    return base.filter(u =>
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.full_name ?? '').toLowerCase().includes(q),
    );
  }, [allUsers, assignedUserIds, search]);

  if (!isOpen || !role) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {t('admin.roleManagement.usersFor', '사용자 관리')}: {role.display_name}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        {/* Assigned Users */}
        <div className="space-y-3 mb-4">
          <h4 className="text-sm font-semibold">{t('admin.roleManagement.assignedUsers', '할당된 사용자')} ({assignedUsers.length})</h4>
          {loading ? (
            <p className="text-sm text-gray-400">로딩 중...</p>
          ) : assignedUsers.length === 0 ? (
            <p className="text-xs text-gray-400">이 역할에 할당된 사용자가 없습니다.</p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {assignedUsers.map(u => (
                <span key={u.id} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-md text-sm">
                  {u.username} {u.full_name ? `(${u.full_name})` : ''}
                  <button
                    className="ml-1 text-emerald-600 hover:text-red-600 font-bold"
                    onClick={() => handleRemove(u.id)}
                  >×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Available Users */}
        <div className="space-y-3 border-t dark:border-gray-600 pt-4 flex-1 min-h-0 flex flex-col">
          <h4 className="text-sm font-semibold">{t('admin.roleManagement.availableUsers', '사용 가능한 사용자')}</h4>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('admin.roleManagement.searchUsers', '사용자 검색...')}
            className="mb-2"
          />
          <div className="flex-1 overflow-y-auto space-y-1">
            {availableUsers.length === 0 ? (
              <p className="text-xs text-gray-400">
                {search ? '검색 결과가 없습니다.' : '모든 사용자가 이미 할당되어 있습니다.'}
              </p>
            ) : (
              availableUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{u.username}</span>
                    <span className="text-xs text-gray-400">{u.email}</span>
                    {u.full_name && <span className="text-xs text-gray-500">({u.full_name})</span>}
                    {!u.is_active && <StatusBadge variant="neutral" dot={false}>비활성</StatusBadge>}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleAssign(u.id)}>
                    + {t('admin.roleManagement.assign', '할당')}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end mt-4 pt-4 border-t dark:border-gray-600">
          <Button variant="outline" onClick={onClose}>{t('common.close', '닫기')}</Button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────

type TabId = 'roles' | 'supervision' | 'verify';

const AdminRoleManagementPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabId>('roles');

  // ── Roles ──
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [roleSearch, setRoleSearch] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null);

  // ── Permissions ──
  const [allPermissions, setAllPermissions] = useState<AdminPermission[]>([]);
  const [definedPermissions, setDefinedPermissions] = useState<PermissionGroup>({});
  const [permModalRole, setPermModalRole] = useState<AdminRole | null>(null);
  const [currentPermIds, setCurrentPermIds] = useState<number[]>([]);

  // ── Supervision ──
  const [supervisions, setSupervisions] = useState<AdminSupervision[]>([]);
  const [supervisionLoading, setSupervisionLoading] = useState(false);
  const [showSupervisionModal, setShowSupervisionModal] = useState(false);

  // ── Verify ──
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);

  // ── Role Users ──
  const [usersModalRole, setUsersModalRole] = useState<AdminRole | null>(null);

  // ── Fetch data ──
  const fetchRoles = useCallback(async () => {
    setRolesLoading(true);
    try {
      const data = await getAllRoles();
      setRoles(data ?? []);
    } catch {
      toast.error(t('admin.roleManagement.loadError', '역할 목록 로드 실패'));
    } finally {
      setRolesLoading(false);
    }
  }, [t, toast]);

  const fetchPermissions = useCallback(async () => {
    try {
      const data = await getAllPermissions();
      setAllPermissions(data.db_permissions ?? []);
      setDefinedPermissions(data.defined_permissions ?? {});
    } catch {
      // permissions not yet seeded is acceptable
    }
  }, []);

  const fetchSupervisions = useCallback(async () => {
    setSupervisionLoading(true);
    try {
      const data = await getAllSupervisions();
      setSupervisions(data ?? []);
    } catch {
      toast.error(t('admin.roleManagement.supervisionLoadError', '감독 관계 로드 실패'));
    } finally {
      setSupervisionLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, [fetchRoles, fetchPermissions]);

  useEffect(() => {
    if (activeTab === 'supervision') fetchSupervisions();
  }, [activeTab, fetchSupervisions]);

  // ── Role actions ──
  const handleCreateRole = useCallback(async (data: { name: string; display_name: string; description: string }) => {
    try {
      await createRole(data);
      toast.success(t('admin.roleManagement.roleCreated', '역할이 생성되었습니다.'));
      setShowRoleModal(false);
      fetchRoles();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '역할 생성 실패';
      toast.error(msg);
    }
  }, [t, toast, fetchRoles]);

  const handleUpdateRole = useCallback(async (data: { name: string; display_name: string; description: string }) => {
    if (!editingRole) return;
    try {
      await updateRole(editingRole.id, { display_name: data.display_name, description: data.description });
      toast.success(t('admin.roleManagement.roleUpdated', '역할이 수정되었습니다.'));
      setEditingRole(null);
      fetchRoles();
    } catch {
      toast.error('역할 수정 실패');
    }
  }, [editingRole, t, toast, fetchRoles]);

  const handleDeleteRole = useCallback(async (role: AdminRole) => {
    const confirmed = await toast.confirm({
      title: t('admin.roleManagement.deleteConfirm', '역할 삭제'),
      message: t('admin.roleManagement.deleteConfirmMessage', `"${role.display_name}" 역할을 삭제하시겠습니까? 관련된 모든 매핑이 함께 삭제됩니다.`),
    });
    if (!confirmed) return;
    try {
      await deleteRole(role.id);
      toast.success(t('admin.roleManagement.roleDeleted', '역할이 삭제되었습니다.'));
      fetchRoles();
    } catch {
      toast.error('역할 삭제 실패');
    }
  }, [t, toast, fetchRoles]);

  const handleOpenPermissions = useCallback(async (role: AdminRole) => {
    try {
      const data = await getRolePermissions(role.id);
      setCurrentPermIds(data.permissions.map(p => p.id));
      setPermModalRole(role);
    } catch {
      toast.error('권한 로드 실패');
    }
  }, [toast]);

  const handleSavePermissions = useCallback(async (permissionIds: number[]) => {
    if (!permModalRole) return;
    try {
      await updateRolePermissions(permModalRole.id, permissionIds);
      toast.success(t('admin.roleManagement.permissionsUpdated', '권한이 저장되었습니다.'));
      setPermModalRole(null);
      fetchRoles();
    } catch {
      toast.error('권한 저장 실패');
    }
  }, [permModalRole, t, toast, fetchRoles]);

  // ── Supervision actions ──
  const handleCreateSupervision = useCallback(async (
    supervisorRoleId: number, targetRoleId: number,
    type: 'full' | 'monitor' | 'audit', desc: string,
  ) => {
    try {
      await createSupervision(supervisorRoleId, { target_role_id: targetRoleId, supervision_type: type, description: desc });
      toast.success('감독 관계가 추가되었습니다.');
      setShowSupervisionModal(false);
      fetchSupervisions();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '감독 관계 추가 실패';
      toast.error(msg);
    }
  }, [toast, fetchSupervisions]);

  const handleDeleteSupervision = useCallback(async (sv: AdminSupervision) => {
    const confirmed = await toast.confirm({
      title: '감독 관계 삭제',
      message: `"${sv.supervisor_role_name}" → "${sv.target_role_name}" 감독 관계를 삭제하시겠습니까?`,
    });
    if (!confirmed) return;
    try {
      await deleteSupervision(sv.supervisor_role_id, sv.target_role_id);
      toast.success('감독 관계가 삭제되었습니다.');
      fetchSupervisions();
    } catch {
      toast.error('감독 관계 삭제 실패');
    }
  }, [toast, fetchSupervisions]);

  // ── Verify action ──
  const handleOpenVerify = useCallback(async () => {
    try {
      const data = await getAllUsers(1, 1000);
      setAllUsers(data.users ?? []);
      setShowVerifyModal(true);
    } catch {
      toast.error('사용자 목록 로드 실패');
    }
  }, [toast]);

  // ── Role Users action ──
  const handleOpenRoleUsers = useCallback(async (role: AdminRole) => {
    try {
      const data = await getAllUsers(1, 1000);
      setAllUsers(data.users ?? []);
      setUsersModalRole(role);
    } catch {
      toast.error('사용자 목록 로드 실패');
    }
  }, [toast]);

  // ── Filtered roles ──
  const filteredRoles = useMemo(() => {
    if (!roleSearch) return roles;
    const q = roleSearch.toLowerCase();
    return roles.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.display_name.toLowerCase().includes(q) ||
      (r.description ?? '').toLowerCase().includes(q),
    );
  }, [roles, roleSearch]);

  // ── Role columns ──
  const roleColumns: DataTableColumn<AdminRole>[] = useMemo(() => [
    {
      id: 'name',
      header: t('admin.roleManagement.roleName', '역할명'),
      field: 'name' as keyof AdminRole,
      sortable: true,
      cell: (row) => <span className="font-mono text-sm font-medium">{row.name}</span>,
    },
    {
      id: 'display_name',
      header: t('admin.roleManagement.displayName', '표시명'),
      field: 'display_name' as keyof AdminRole,
      sortable: true,
      cell: (row) => <span>{row.display_name || '-'}</span>,
    },
    {
      id: 'permission_count',
      header: t('admin.roleManagement.permissionCount', '권한 수'),
      field: 'permission_count' as keyof AdminRole,
      sortable: true,
      cell: (row) => (
        <StatusBadge variant={row.permission_count ? 'info' : 'neutral'} dot={false}>
          {row.permission_count ?? 0}
        </StatusBadge>
      ),
    },
    {
      id: 'description',
      header: t('admin.roleManagement.description', '설명'),
      field: 'description' as keyof AdminRole,
      cell: (row) => <span className="text-sm text-gray-500 truncate max-w-xs block">{row.description || '-'}</span>,
    },
    {
      id: 'actions',
      header: t('admin.roleManagement.actions', '작업'),
      cell: (row) => (
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenRoleUsers(row); }}>
            {t('admin.roleManagement.users', '사용자')}
          </Button>
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenPermissions(row); }}>
            {t('admin.roleManagement.permissions', '권한')}
          </Button>
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setEditingRole(row); }}>
            {t('common.edit', '편집')}
          </Button>
          <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteRole(row); }}>
            {t('common.delete', '삭제')}
          </Button>
        </div>
      ),
    },
  ], [t, handleOpenPermissions, handleOpenRoleUsers, handleDeleteRole]);

  // ── Supervision columns ──
  const supervisionColumns: DataTableColumn<AdminSupervision>[] = useMemo(() => [
    {
      id: 'supervisor',
      header: t('admin.roleManagement.supervisorRole', '감독 역할'),
      cell: (row) => <span className="font-medium">{row.supervisor_role_name ?? `#${row.supervisor_role_id}`}</span>,
      sortable: true,
    },
    {
      id: 'arrow',
      header: '',
      cell: () => <span className="text-gray-400">→</span>,
    },
    {
      id: 'target',
      header: t('admin.roleManagement.targetRole', '대상 역할'),
      cell: (row) => <span className="font-medium">{row.target_role_name ?? `#${row.target_role_id}`}</span>,
      sortable: true,
    },
    {
      id: 'type',
      header: t('admin.roleManagement.supervisionType', '유형'),
      cell: (row) => {
        const variant = row.supervision_type === 'full' ? 'error' : row.supervision_type === 'monitor' ? 'warning' : 'info';
        return <StatusBadge variant={variant} dot={false}>{row.supervision_type}</StatusBadge>;
      },
    },
    {
      id: 'description',
      header: t('admin.roleManagement.description', '설명'),
      cell: (row) => <span className="text-sm text-gray-500">{row.description || '-'}</span>,
    },
    {
      id: 'actions',
      header: t('admin.roleManagement.actions', '작업'),
      cell: (row) => (
        <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteSupervision(row); }}>
          {t('common.delete', '삭제')}
        </Button>
      ),
    },
  ], [t, handleDeleteSupervision]);

  // ── Tab buttons ──
  const tabs: { id: TabId; label: string }[] = [
    { id: 'roles', label: t('admin.roleManagement.rolesTab', '역할 관리') },
    { id: 'supervision', label: t('admin.roleManagement.supervisionTab', '감독 관계') },
    { id: 'verify', label: t('admin.roleManagement.verifyTab', '권한 검증') },
  ];

  return (
    <ContentArea
      title={t('admin.roleManagement.title', 'ABAC 역할/권한 관리')}
      headerActions={undefined}
      toolbar={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                onClick={() => {
                  if (tab.id === 'verify') {
                    handleOpenVerify();
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {activeTab === 'roles' && (
            <div className="flex items-center gap-2">
              <SearchInput
                value={roleSearch}
                onChange={setRoleSearch}
                placeholder={t('admin.roleManagement.searchRoles', '역할 검색...')}
                className="w-60"
              />
              <Button onClick={() => setShowRoleModal(true)}>
                {t('admin.roleManagement.createRole', '역할 생성')}
              </Button>
            </div>
          )}
          {activeTab === 'supervision' && (
            <Button onClick={() => setShowSupervisionModal(true)}>
              {t('admin.roleManagement.addSupervision', '감독 관계 추가')}
            </Button>
          )}
        </div>
      }
    >
      {activeTab === 'roles' && (
        <DataTable
          data={filteredRoles}
          columns={roleColumns}
          rowKey={(row) => row.id}
          loading={rolesLoading}
          emptyMessage={t('admin.roleManagement.noRoles', '등록된 역할이 없습니다.')}
          className="border rounded-lg"
        />
      )}

      {activeTab === 'supervision' && (
        <DataTable
          data={supervisions}
          columns={supervisionColumns}
          rowKey={(row) => row.id}
          loading={supervisionLoading}
          emptyMessage={t('admin.roleManagement.noSupervisions', '등록된 감독 관계가 없습니다.')}
          className="border rounded-lg"
        />
      )}

      {/* Modals */}
      <RoleFormModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onSubmit={handleCreateRole}
      />
      <RoleFormModal
        isOpen={!!editingRole}
        role={editingRole}
        onClose={() => setEditingRole(null)}
        onSubmit={handleUpdateRole}
      />
      <PermissionSelectorModal
        isOpen={!!permModalRole}
        role={permModalRole}
        allPermissions={allPermissions}
        definedPermissions={definedPermissions}
        currentPermissionIds={currentPermIds}
        onClose={() => setPermModalRole(null)}
        onSubmit={handleSavePermissions}
      />
      <SupervisionModal
        isOpen={showSupervisionModal}
        roles={roles}
        onClose={() => setShowSupervisionModal(false)}
        onSubmit={handleCreateSupervision}
      />
      <PermissionVerifyModal
        isOpen={showVerifyModal}
        users={allUsers}
        onClose={() => setShowVerifyModal(false)}
      />
      <RoleUsersModal
        isOpen={!!usersModalRole}
        role={usersModalRole}
        allUsers={allUsers}
        onClose={() => setUsersModalRole(null)}
      />
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Module
// ─────────────────────────────────────────────────────────────

const feature: AdminFeatureModule = {
  id: 'admin-role-management',
  name: 'AdminRoleManagementPage',
  adminSection: 'admin-user',
  sidebarItems: [
    {
      id: 'admin-role-management',
      titleKey: 'admin.sidebar.user.roleManagement.title',
      descriptionKey: 'admin.sidebar.user.roleManagement.description',
    },
  ],
  routes: {
    'admin-role-management': AdminRoleManagementPage,
  },
};

export default feature;
