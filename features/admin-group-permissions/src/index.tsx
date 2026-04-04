'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { AdminFeatureModule, AdminGroup, AdminUser, RouteComponentProps } from '@xgen/types';
import {
  ContentArea, DataTable, StatusBadge, SearchInput, Button, useToast,
} from '@xgen/ui';
import type { DataTableColumn } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import {
  getAllGroups, createGroup, updateGroupPermissions, deleteGroup,
  getGroupUsers, addUserGroup, removeUserGroup,
} from '@xgen/api-client';
import { GroupCreateModal } from './GroupCreateModal';
import { GroupPermissionModal } from './GroupPermissionModal';
import { GroupAddMemberModal } from './GroupAddMemberModal';

// ─────────────────────────────────────────────────────────────
// AdminGroupPermissionsPage
// ─────────────────────────────────────────────────────────────

const AdminGroupPermissionsPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // ── Groups state ──
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [groupLoading, setGroupLoading] = useState(true);
  const [groupSearch, setGroupSearch] = useState('');

  // ── Users state (for selected group) ──
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groupUsers, setGroupUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // ── Modals ──
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AdminGroup | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);

  // ── Fetch groups ──
  const fetchGroups = useCallback(async () => {
    setGroupLoading(true);
    try {
      const data = await getAllGroups();
      setGroups(data ?? []);
    } catch {
      toast.error(t('admin.userManagement.groupPermissions.loadError'));
    } finally {
      setGroupLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // ── Fetch group users ──
  const fetchGroupUsers = useCallback(
    async (groupName: string) => {
      setUsersLoading(true);
      try {
        const data = await getGroupUsers(groupName);
        setGroupUsers(data ?? []);
      } catch {
        toast.error(t('admin.userManagement.groupPermissions.loadUsersError'));
      } finally {
        setUsersLoading(false);
      }
    },
    [t, toast],
  );

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupUsers(selectedGroup);
    } else {
      setGroupUsers([]);
    }
  }, [selectedGroup, fetchGroupUsers]);

  // ── Filtered ──
  const filteredGroups = useMemo(() => {
    if (!groupSearch.trim()) return groups;
    const q = groupSearch.toLowerCase();
    return groups.filter((g) => g.group_name.toLowerCase().includes(q));
  }, [groups, groupSearch]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return groupUsers;
    const q = userSearch.toLowerCase();
    return groupUsers.filter(
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q),
    );
  }, [groupUsers, userSearch]);

  // ── Handlers ──
  const handleCreateGroup = useCallback(
    async (data: { group_name: string; available: boolean; available_sections: string[] }) => {
      try {
        await createGroup(data);
        toast.success(t('admin.userManagement.groupPermissions.createSuccess'));
        setShowCreateModal(false);
        fetchGroups();
      } catch {
        toast.error(t('admin.userManagement.groupPermissions.createError'));
      }
    },
    [fetchGroups, t, toast],
  );

  const handleUpdatePermissions = useCallback(
    async (data: { group_name: string; available: boolean; available_sections: string[] }) => {
      try {
        await updateGroupPermissions(data);
        toast.success(t('admin.userManagement.groupPermissions.updateSuccess'));
        setEditingGroup(null);
        fetchGroups();
      } catch {
        toast.error(t('admin.userManagement.groupPermissions.updateError'));
      }
    },
    [fetchGroups, t, toast],
  );

  const handleDeleteGroup = useCallback(
    async (group: AdminGroup) => {
      const confirmed = await toast.confirm({
        title: t('admin.userManagement.groupPermissions.deleteTitle'),
        description: t('admin.userManagement.groupPermissions.deleteMessage', {
          groupName: group.group_name,
        }),
        variant: 'danger',
      });
      if (!confirmed) return;

      try {
        await deleteGroup(group.group_name);
        toast.success(t('admin.userManagement.groupPermissions.deleteSuccess'));
        if (selectedGroup === group.group_name) setSelectedGroup(null);
        fetchGroups();
      } catch {
        toast.error(t('admin.userManagement.groupPermissions.deleteError'));
      }
    },
    [fetchGroups, selectedGroup, t, toast],
  );

  const handleAddMembers = useCallback(
    async (items: { id: number; group_name: string }[]) => {
      try {
        await Promise.all(items.map((item) => addUserGroup(item)));
        toast.success(t('admin.userManagement.groupPermissions.addMemberModal.addSuccess', {
          count: String(items.length),
        }));
        setShowAddMember(false);
        if (selectedGroup) fetchGroupUsers(selectedGroup);
      } catch {
        toast.error(t('admin.userManagement.groupPermissions.addMemberModal.addError'));
      }
    },
    [selectedGroup, fetchGroupUsers, t, toast],
  );

  const handleRemoveMember = useCallback(
    async (user: AdminUser) => {
      if (!selectedGroup) return;
      const confirmed = await toast.confirm({
        title: t('admin.userManagement.groupPermissions.removeUserConfirmTitle'),
        description: t('admin.userManagement.groupPermissions.removeUserConfirmMessage', {
          username: user.username,
          groupName: selectedGroup,
        }),
        variant: 'danger',
      });
      if (!confirmed) return;

      try {
        await removeUserGroup({ id: user.id, group_name: selectedGroup });
        toast.success(t('admin.userManagement.groupPermissions.removeUserSuccess'));
        fetchGroupUsers(selectedGroup);
      } catch {
        toast.error(t('admin.userManagement.groupPermissions.removeUserError'));
      }
    },
    [selectedGroup, fetchGroupUsers, t, toast],
  );

  // ── Group columns ──
  const groupColumns: DataTableColumn<AdminGroup>[] = useMemo(
    () => [
      {
        id: 'group_name',
        header: t('admin.userManagement.groupPermissions.tableHeaders.groupName'),
        field: 'group_name',
        sortable: true,
        cell: (row) => <span className="font-medium">{row.group_name}</span>,
      },
      {
        id: 'available',
        header: t('admin.userManagement.groupPermissions.tableHeaders.status'),
        field: 'available',
        sortable: true,
        cell: (row) => (
          <StatusBadge variant={row.available ? 'success' : 'error'}>
            {row.available
              ? t('admin.userManagement.groupPermissions.status.active')
              : t('admin.userManagement.groupPermissions.status.inactive')}
          </StatusBadge>
        ),
      },
      {
        id: 'sections',
        header: t('admin.userManagement.groupPermissions.tableHeaders.sections'),
        cell: (row) => (
          <div className="flex flex-wrap gap-1">
            {row.available_sections?.slice(0, 4).map((s) => (
              <span key={s} className="rounded bg-accent px-1.5 py-0.5 text-xs">
                {s}
              </span>
            ))}
            {(row.available_sections?.length ?? 0) > 4 && (
              <span className="text-xs text-muted-foreground">
                +{(row.available_sections?.length ?? 0) - 4}
              </span>
            )}
          </div>
        ),
      },
      {
        id: 'actions',
        header: t('admin.userManagement.userList.tableHeaders.actions'),
        cell: (row) => (
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setEditingGroup(row);
              }}
            >
              {t('admin.userManagement.groupPermissions.editPermissions')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteGroup(row);
              }}
            >
              {t('admin.userManagement.groupPermissions.delete')}
            </Button>
          </div>
        ),
      },
    ],
    [t, handleDeleteGroup],
  );

  // ── User columns ──
  const userColumns: DataTableColumn<AdminUser>[] = useMemo(
    () => [
      {
        id: 'id',
        header: t('admin.userManagement.userList.tableHeaders.id'),
        field: 'id',
        sortable: true,
        cell: (row) => <span className="font-mono text-xs">{row.id}</span>,
        minWidth: '60px',
      },
      {
        id: 'username',
        header: t('admin.userManagement.userList.tableHeaders.username'),
        field: 'username',
        sortable: true,
        cell: (row) => <span className="font-medium">{row.username}</span>,
      },
      {
        id: 'email',
        header: t('admin.userManagement.userList.tableHeaders.email'),
        field: 'email',
        sortable: true,
        cell: (row) => row.email,
      },
      {
        id: 'status',
        header: t('admin.userManagement.userList.tableHeaders.status'),
        field: 'is_active',
        sortable: true,
        cell: (row) => (
          <StatusBadge variant={row.is_active ? 'success' : 'error'}>
            {row.is_active
              ? t('admin.userManagement.userList.status.active')
              : t('admin.userManagement.userList.status.inactive')}
          </StatusBadge>
        ),
      },
      {
        id: 'user_type',
        header: t('admin.userManagement.userList.tableHeaders.roleType'),
        field: 'user_type',
        sortable: true,
        cell: (row) => {
          const variant =
            row.user_type === 'superuser'
              ? 'error'
              : row.user_type === 'admin'
                ? 'warning'
                : 'neutral';
          return <StatusBadge variant={variant} dot={false}>{row.user_type}</StatusBadge>;
        },
      },
      {
        id: 'actions',
        header: t('admin.userManagement.userList.tableHeaders.actions'),
        cell: (row) => (
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveMember(row);
            }}
          >
            {t('admin.userManagement.groupPermissions.removeFromGroup')}
          </Button>
        ),
      },
    ],
    [t, handleRemoveMember],
  );

  return (
    <ContentArea
      title={t('admin.pages.groupPermissions.title')}
    >
      {!selectedGroup ? (
          /* ─── Groups List View ─── */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <SearchInput
                value={groupSearch}
                onChange={setGroupSearch}
                placeholder={t('admin.userManagement.groupPermissions.groupNamePlaceholder')}
                className="w-72"
              />
              <Button onClick={() => setShowCreateModal(true)}>
                {t('admin.userManagement.groupPermissions.createGroup')}
              </Button>
            </div>

            <DataTable
              data={filteredGroups}
              columns={groupColumns}
              rowKey={(row) => row.group_name}
              loading={groupLoading}
              emptyMessage={t('admin.userManagement.groupPermissions.noGroups')}
              onRowClick={(row) => setSelectedGroup(row.group_name)}
              className="border rounded-lg"
            />
          </div>
        ) : (
          /* ─── Members View (drill-down) ─── */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedGroup(null);
                    setUserSearch('');
                  }}
                >
                  ← {t('admin.userManagement.groupPermissions.backToGroups')}
                </Button>
                <h2 className="text-lg font-semibold text-foreground">
                  {t('admin.userManagement.groupPermissions.membersTab', {
                    groupName: selectedGroup,
                  })}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setShowAddMember(true)}>
                  {t('admin.userManagement.groupPermissions.addMember')}
                </Button>
              </div>
            </div>

            <SearchInput
              value={userSearch}
              onChange={setUserSearch}
              placeholder={t('admin.userManagement.userList.searchPlaceholder')}
              className="w-72"
            />

            <DataTable
              data={filteredUsers}
              columns={userColumns}
              rowKey={(row) => row.id}
              loading={usersLoading}
              emptyMessage={t('admin.userManagement.groupPermissions.noUsersInGroup')}
              className="border rounded-lg"
            />
          </div>
        )}
      {/* Modals */}
      <GroupCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateGroup}
      />
      <GroupPermissionModal
        group={editingGroup}
        isOpen={!!editingGroup}
        onClose={() => setEditingGroup(null)}
        onSubmit={handleUpdatePermissions}
      />
      <GroupAddMemberModal
        isOpen={showAddMember}
        groupName={selectedGroup ?? ''}
        currentMembers={groupUsers}
        onClose={() => setShowAddMember(false)}
        onSubmit={handleAddMembers}
      />
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Module
// ─────────────────────────────────────────────────────────────

const feature: AdminFeatureModule = {
  id: 'admin-group-permissions',
  name: 'AdminGroupPermissionsPage',
  adminSection: 'admin-user',
  routes: {
    'admin-group-permissions': AdminGroupPermissionsPage,
  },
};

export default feature;
