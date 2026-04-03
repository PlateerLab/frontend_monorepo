'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { AdminUser } from '@xgen/types';
import { Modal, SearchInput, Button, Checkbox } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { getAllUsers } from '@xgen/api-client';

interface GroupAddMemberModalProps {
  isOpen: boolean;
  groupName: string;
  currentMembers: AdminUser[];
  onClose: () => void;
  onSubmit: (userIds: { id: number; group_name: string }[]) => Promise<void>;
}

export const GroupAddMemberModal: React.FC<GroupAddMemberModalProps> = ({
  isOpen,
  groupName,
  currentMembers,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load all users when opened
  useEffect(() => {
    if (!isOpen) return;
    setSelectedIds(new Set());
    setSearch('');
    (async () => {
      setLoading(true);
      try {
        const res = await getAllUsers(1, 1000);
        setAllUsers(res.users ?? []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen]);

  const memberIds = useMemo(
    () => new Set(currentMembers.map((u) => u.id)),
    [currentMembers],
  );

  // Available users (not already members)
  const availableUsers = useMemo(() => {
    const nonMembers = allUsers.filter((u) => !memberIds.has(u.id));
    if (!search.trim()) return nonMembers;
    const q = search.toLowerCase();
    return nonMembers.filter(
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q),
    );
  }, [allUsers, memberIds, search]);

  const toggleUser = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return;
    setSaving(true);
    try {
      const items = Array.from(selectedIds).map((id) => ({
        id,
        group_name: groupName,
      }));
      await onSubmit(items);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('admin.userManagement.groupPermissions.addMemberModal.title', {
        groupName,
      })}
      size="md"
      footer={
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('admin.userManagement.groupPermissions.addMemberModal.close')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving || selectedIds.size === 0}>
            {saving
              ? t('admin.userManagement.groupPermissions.addMemberModal.adding')
              : `${t('admin.userManagement.groupPermissions.addMemberModal.add')} (${selectedIds.size})`}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('admin.userManagement.groupPermissions.addMemberModal.searchPlaceholder')}
        />

        <div className="max-h-[320px] overflow-y-auto border rounded-md divide-y divide-border">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Loading...
            </div>
          ) : availableUsers.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              {t('admin.userManagement.groupPermissions.addMemberModal.noUsersAvailable')}
            </div>
          ) : (
            availableUsers.map((user) => (
              <label
                key={user.id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-accent cursor-pointer"
              >
                <Checkbox
                  checked={selectedIds.has(user.id)}
                  onCheckedChange={() => toggleUser(user.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{user.username}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </div>
              </label>
            ))
          )}
        </div>

        {selectedIds.size > 0 && (
          <p className="text-xs text-muted-foreground">
            {t('admin.userManagement.groupPermissions.addMemberModal.selectedCount', {
              count: String(selectedIds.size),
            })}
          </p>
        )}
      </div>
    </Modal>
  );
};
