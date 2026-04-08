'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { AdminUser, AdminUserType, AdminPermission } from '@xgen/types';
import {
  Modal, Button, Input, Label,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Switch, Tabs, TabsList, TabsTrigger, TabsContent,
} from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import {
  getAllPermissions,
  getUserDirectPermissions,
  setUserDirectPermission,
  removeUserDirectPermission,
  resolveUserPermissions,
} from '@xgen/api-client';

// ─────────────────────────────────────────────────────────────

interface UserEditModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: Partial<AdminUser>) => Promise<void>;
}

function validatePassword(pw: string): boolean {
  if (pw.length < 8) return false;
  let categories = 0;
  if (/[A-Z]/.test(pw)) categories++;
  if (/[a-z]/.test(pw)) categories++;
  if (/[0-9]/.test(pw)) categories++;
  if (/[^A-Za-z0-9]/.test(pw)) categories++;
  return categories >= 2;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState<AdminUserType>('standard');
  const [isActive, setIsActive] = useState(true);

  // Password
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ABAC Direct Permission assignment
  const [allPermissions, setAllPermissions] = useState<AdminPermission[]>([]);
  const [directPerms, setDirectPerms] = useState<Array<{
    id: number; permission_id: number; resource: string; action: string; granted: boolean;
  }>>([]);
  const [permsLoading, setPermsLoading] = useState(false);
  const [resolvedPerms, setResolvedPerms] = useState<Record<string, string[]> | null>(null);
  const [resolving, setResolving] = useState(false);
  const [permSearch, setPermSearch] = useState('');

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setUsername(user.username);
      setFullName(user.full_name || '');
      setUserType(user.user_type ?? (user.is_superuser ? 'superuser' : 'standard'));
      setIsActive(user.is_active);
      setShowPassword(false);
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [user]);

  // Load permissions when modal opens
  useEffect(() => {
    if (!isOpen || !user) return;
    const loadPerms = async () => {
      setPermsLoading(true);
      try {
        const [allPermsRes, directRes] = await Promise.all([
          getAllPermissions(),
          getUserDirectPermissions(user.id),
        ]);
        setAllPermissions(allPermsRes.db_permissions ?? []);
        setDirectPerms(directRes.direct_permissions ?? []);
      } catch (err) {
        console.error('Failed to load permissions:', err);
      } finally {
        setPermsLoading(false);
      }
    };
    loadPerms();
    setResolvedPerms(null);
    setPermSearch('');
  }, [isOpen, user]);

  // Separate granted / denied direct permissions
  const grantedPerms = useMemo(() => directPerms.filter(p => p.granted), [directPerms]);
  const deniedPerms = useMemo(() => directPerms.filter(p => !p.granted), [directPerms]);

  // Permissions not yet directly assigned (available to add)
  const directPermIds = useMemo(() => new Set(directPerms.map(p => p.permission_id)), [directPerms]);
  const availablePermsGrouped = useMemo(() => {
    const available = allPermissions.filter(p => !directPermIds.has(p.id));
    const filtered = permSearch
      ? available.filter(p =>
          `${p.resource}:${p.action}`.toLowerCase().includes(permSearch.toLowerCase()) ||
          (p.description ?? '').toLowerCase().includes(permSearch.toLowerCase()),
        )
      : available;
    const groups: Record<string, AdminPermission[]> = {};
    for (const p of filtered) {
      const group = p.resource.split('.')[0] || 'other';
      if (!groups[group]) groups[group] = [];
      groups[group].push(p);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [allPermissions, directPermIds, permSearch]);

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: Partial<AdminUser> = {
        email,
        username,
        full_name: fullName || null,
        user_type: userType,
        is_superuser: userType === 'superuser',
        is_active: isActive,
      };

      if (showPassword && newPassword) {
        if (newPassword !== confirmPassword) return;
        if (!validatePassword(newPassword)) return;
        data.password_hash = newPassword;
      }

      await onSave(data);
    } finally {
      setSaving(false);
    }
  };

  const refreshDirectPerms = async () => {
    if (!user) return;
    try {
      const res = await getUserDirectPermissions(user.id);
      setDirectPerms(res.direct_permissions ?? []);
    } catch (err) {
      console.error('Failed to refresh permissions:', err);
    }
  };

  const handleGrantPermission = async (permissionId: number) => {
    if (!user) return;
    try {
      await setUserDirectPermission(user.id, permissionId, true);
      await refreshDirectPerms();
    } catch (err) {
      console.error('Failed to grant permission:', err);
    }
  };

  const handleDenyPermission = async (permissionId: number) => {
    if (!user) return;
    try {
      await setUserDirectPermission(user.id, permissionId, false);
      await refreshDirectPerms();
    } catch (err) {
      console.error('Failed to deny permission:', err);
    }
  };

  const handleRemoveDirectPerm = async (permissionId: number) => {
    if (!user) return;
    try {
      await removeUserDirectPermission(user.id, permissionId);
      await refreshDirectPerms();
    } catch (err) {
      console.error('Failed to remove permission:', err);
    }
  };

  const handleResolvePermissions = async () => {
    setResolving(true);
    try {
      const result = await resolveUserPermissions(user.id);
      // permissions는 "resource:action" 문자열 배열 → 리소스별 그룹핑
      const grouped = (result.permissions ?? []).reduce<Record<string, string[]>>((acc, perm) => {
        const idx = perm.indexOf(':');
        const resource = idx > 0 ? perm.slice(0, idx) : perm;
        const action = idx > 0 ? perm.slice(idx + 1) : '*';
        if (!acc[resource]) acc[resource] = [];
        acc[resource].push(action);
        return acc;
      }, {});
      setResolvedPerms(grouped);
    } catch (err) {
      console.error('Failed to resolve permissions:', err);
    } finally {
      setResolving(false);
    }
  };

  const passwordValid = !showPassword || !newPassword || validatePassword(newPassword);
  const passwordMatch = !showPassword || !newPassword || newPassword === confirmPassword;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('admin.userManagement.userEditModal.title')}
      size="lg"
      footer={
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('admin.userManagement.userEditModal.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || (showPassword && (!passwordValid || !passwordMatch))}
          >
            {saving
              ? t('admin.userManagement.userEditModal.saving')
              : t('admin.userManagement.userEditModal.save')}
          </Button>
        </div>
      }
    >
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="basic">기본 정보</TabsTrigger>
          <TabsTrigger value="roles">권한 (ABAC)</TabsTrigger>
          <TabsTrigger value="info">상세 정보</TabsTrigger>
        </TabsList>

        {/* ─── Basic Info Tab ─── */}
        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('admin.userManagement.userEditModal.email')}</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('admin.userManagement.userEditModal.username')}</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('admin.userManagement.userEditModal.fullName')}</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('admin.userManagement.userEditModal.userType')}</Label>
              <Select value={userType} onValueChange={(v) => setUserType(v as AdminUserType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">
                    {t('admin.userManagement.userEditModal.userTypeStandard')}
                  </SelectItem>
                  <SelectItem value="admin">
                    {t('admin.userManagement.userEditModal.userTypeAdmin')}
                  </SelectItem>
                  <SelectItem value="superuser">
                    {t('admin.userManagement.userEditModal.userTypeSuperuser')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>
              {isActive
                ? t('admin.userManagement.userList.status.active')
                : t('admin.userManagement.userList.status.inactive')}
            </Label>
          </div>

          {/* Password */}
          <div className="border-t border-border pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowPassword(!showPassword);
                setNewPassword('');
                setConfirmPassword('');
              }}
            >
              {showPassword
                ? t('admin.userManagement.userEditModal.cancelPasswordChange')
                : t('admin.userManagement.userEditModal.changePassword')}
            </Button>

            {showPassword && (
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('admin.userManagement.userEditModal.newPassword')}</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('admin.userManagement.userEditModal.newPasswordPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.userManagement.userEditModal.confirmPassword')}</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('admin.userManagement.userEditModal.confirmPasswordPlaceholder')}
                  />
                </div>
                <div className="col-span-2 text-xs text-muted-foreground space-y-0.5">
                  <p className={newPassword.length >= 8 ? 'text-emerald-600' : ''}>
                    · {t('admin.userManagement.userEditModal.passwordRequirements.minLength')}
                  </p>
                  <p>{t('admin.userManagement.userEditModal.passwordRequirements.twoCategoriesCombination')}:</p>
                  <p className="ml-3">
                    {t('admin.userManagement.userEditModal.passwordRequirements.uppercase')},{' '}
                    {t('admin.userManagement.userEditModal.passwordRequirements.lowercase')},{' '}
                    {t('admin.userManagement.userEditModal.passwordRequirements.number')},{' '}
                    {t('admin.userManagement.userEditModal.passwordRequirements.specialChar')}
                  </p>
                  {newPassword && !passwordValid && (
                    <p className="text-destructive">비밀번호 요구사항을 충족하지 않습니다.</p>
                  )}
                  {newPassword && confirmPassword && !passwordMatch && (
                    <p className="text-destructive">비밀번호가 일치하지 않습니다.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─── ABAC Permissions Tab ─── */}
        <TabsContent value="roles" className="space-y-6">
          {permsLoading ? (
            <p className="text-sm text-muted-foreground">권한 로딩 중...</p>
          ) : (
            <>
              {/* Granted Permissions */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">부여된 권한 ({grantedPerms.length})</h4>
                {grantedPerms.length === 0 ? (
                  <p className="text-xs text-muted-foreground">직접 부여된 권한이 없습니다.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {grantedPerms.map((p) => (
                      <span key={p.id} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-md text-xs font-mono">
                        {p.resource}:{p.action}
                        <button
                          className="ml-1 text-emerald-600 hover:text-red-600 font-bold"
                          onClick={() => handleRemoveDirectPerm(p.permission_id)}
                        >×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Denied Permissions */}
              <div className="space-y-3 border-t border-border pt-4">
                <h4 className="text-sm font-semibold">거부된 권한 ({deniedPerms.length})</h4>
                {deniedPerms.length === 0 ? (
                  <p className="text-xs text-muted-foreground">직접 거부된 권한이 없습니다.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {deniedPerms.map((p) => (
                      <span key={p.id} className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md text-xs font-mono">
                        {p.resource}:{p.action}
                        <button
                          className="ml-1 text-red-600 hover:text-gray-600 font-bold"
                          onClick={() => handleRemoveDirectPerm(p.permission_id)}
                        >×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Permissions to Add */}
              <div className="space-y-3 border-t border-border pt-4">
                <h4 className="text-sm font-semibold">권한 추가</h4>
                <Input
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                  placeholder="권한 검색... (예: workflow:create)"
                  className="text-sm"
                />
                <div className="max-h-48 overflow-y-auto space-y-3">
                  {availablePermsGrouped.map(([group, perms]) => (
                    <div key={group}>
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">{group}</p>
                      <div className="grid grid-cols-1 gap-1 ml-2">
                        {perms.map(p => (
                          <div key={p.id} className="flex items-center justify-between py-0.5">
                            <span className="font-mono text-xs">{p.resource}:{p.action}</span>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" onClick={() => handleGrantPermission(p.id)}>
                                + 부여
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => handleDenyPermission(p.id)}>
                                − 거부
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {availablePermsGrouped.length === 0 && !permSearch && (
                    <p className="text-xs text-muted-foreground">모든 권한이 이미 설정되어 있습니다.</p>
                  )}
                  {availablePermsGrouped.length === 0 && permSearch && (
                    <p className="text-xs text-muted-foreground">검색 결과가 없습니다.</p>
                  )}
                </div>
              </div>

              {/* Resolved Permissions Preview */}
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center gap-3">
                  <h4 className="text-sm font-semibold">최종 권한 확인</h4>
                  <Button size="sm" variant="outline" onClick={handleResolvePermissions} disabled={resolving}>
                    {resolving ? '확인 중...' : '권한 조회'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  역할 기반 권한 + 직접 부여 − 직접 거부 = 최종 권한
                </p>
                {resolvedPerms && (
                  <div className="rounded border border-border p-3 space-y-2 max-h-48 overflow-y-auto">
                    {Object.entries(resolvedPerms).map(([resource, actions]) => (
                      <div key={resource} className="flex items-start gap-2 text-xs">
                        <span className="font-mono font-semibold text-primary min-w-[140px]">{resource}</span>
                        <div className="flex flex-wrap gap-1">
                          {actions.map((action) => (
                            <span key={action} className="rounded bg-accent px-1.5 py-0.5">{action}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                    {Object.keys(resolvedPerms).length === 0 && (
                      <p className="text-muted-foreground">이 사용자에게 부여된 권한이 없습니다.</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </TabsContent>

        {/* ─── Info Tab ─── */}
        <TabsContent value="info" className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{t('admin.userManagement.userEditModal.userId')}:</span>
              <span className="ml-2 font-mono">{user.id}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('admin.userManagement.userEditModal.createdAt')}:</span>
              <span className="ml-2">{user.created_at ? new Date(user.created_at).toLocaleString('ko-KR') : '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('admin.userManagement.userEditModal.updatedAt')}:</span>
              <span className="ml-2">{user.updated_at ? new Date(user.updated_at).toLocaleString('ko-KR') : '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('admin.userManagement.userEditModal.lastLogin')}:</span>
              <span className="ml-2">{user.last_login ? new Date(user.last_login).toLocaleString('ko-KR') : '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t('admin.userManagement.userEditModal.lastLoginIp')}:</span>
              <span className="ml-2">{user.last_login_ip || '-'}</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Modal>
  );
};
