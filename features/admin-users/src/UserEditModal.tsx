'use client';

import React, { useState, useEffect } from 'react';
import type { AdminUser, AdminUserType } from '@xgen/types';
import { AVAILABLE_USER_SECTIONS } from '@xgen/types';
import {
  Modal, Button, Input, Label,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Switch, Tabs, TabsList, TabsTrigger, TabsContent,
} from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import {
  updateUserAvailableAdminSections,
  updateUserAvailableUserSections,
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

  // Section access
  const [adminSections, setAdminSections] = useState<string[]>([]);
  const [userSections, setUserSections] = useState<string[]>([]);
  const [sectionSaving, setSectionSaving] = useState(false);

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setUsername(user.username);
      setFullName(user.full_name || '');
      setUserType(user.user_type);
      setIsActive(user.is_active);
      setAdminSections(user.available_admin_sections || []);
      setUserSections(user.available_user_sections || []);
      setShowPassword(false);
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [user]);

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: Partial<AdminUser> = {
        email,
        username,
        full_name: fullName || null,
        user_type: userType,
        is_admin: userType !== 'standard',
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

  const handleSaveAdminSections = async () => {
    setSectionSaving(true);
    try {
      await updateUserAvailableAdminSections({
        id: user.id,
        available_admin_sections: adminSections,
      });
    } finally {
      setSectionSaving(false);
    }
  };

  const handleSaveUserSections = async () => {
    setSectionSaving(true);
    try {
      await updateUserAvailableUserSections({
        id: user.id,
        available_user_sections: userSections,
      });
    } finally {
      setSectionSaving(false);
    }
  };

  const toggleSection = (
    list: string[],
    setter: (v: string[]) => void,
    section: string,
  ) => {
    setter(
      list.includes(section)
        ? list.filter((s) => s !== section)
        : [...list, section],
    );
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
          <TabsTrigger value="sections">섹션 권한</TabsTrigger>
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

        {/* ─── Section Access Tab ─── */}
        <TabsContent value="sections" className="space-y-6">
          {/* Admin sections */}
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold">
                {t('admin.userManagement.userEditModal.adminSectionAccess.title')}
              </h4>
              <p className="text-xs text-muted-foreground">
                {t('admin.userManagement.userEditModal.adminSectionAccess.description')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {['admin-user', 'admin-workflow', 'admin-setting', 'admin-system', 'admin-data', 'admin-security', 'admin-mcp', 'admin-ml', 'admin-governance'].map(
                (section) => (
                  <Button
                    key={section}
                    variant={adminSections.includes(section) ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => toggleSection(adminSections, setAdminSections, section)}
                  >
                    {section}
                  </Button>
                ),
              )}
            </div>
            <Button
              size="sm"
              onClick={handleSaveAdminSections}
              disabled={sectionSaving}
            >
              {sectionSaving
                ? t('admin.userManagement.userEditModal.adminSectionAccess.saving')
                : t('admin.userManagement.userEditModal.adminSectionAccess.saveButton')}
            </Button>
          </div>

          {/* User sections */}
          <div className="space-y-3 border-t border-border pt-4">
            <div>
              <h4 className="text-sm font-semibold">
                {t('admin.userManagement.userEditModal.userSectionAccess.title')}
              </h4>
              <p className="text-xs text-muted-foreground">
                {t('admin.userManagement.userEditModal.userSectionAccess.description')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_USER_SECTIONS.map((section) => (
                <Button
                  key={section}
                  variant={userSections.includes(section) ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => toggleSection(userSections, setUserSections, section)}
                >
                  {section}
                </Button>
              ))}
            </div>
            <Button
              size="sm"
              onClick={handleSaveUserSections}
              disabled={sectionSaving}
            >
              {sectionSaving
                ? t('admin.userManagement.userEditModal.userSectionAccess.saving')
                : t('admin.userManagement.userEditModal.userSectionAccess.saveButton')}
            </Button>
          </div>
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
          <div className="border-t border-border pt-3 mt-3">
            <span className="text-sm text-muted-foreground">Groups:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {user.groups?.map((g) => (
                <span key={g} className="rounded bg-accent px-2 py-0.5 text-xs">{g}</span>
              )) ?? <span className="text-xs text-muted-foreground">None</span>}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Modal>
  );
};
