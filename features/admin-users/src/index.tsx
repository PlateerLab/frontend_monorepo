'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { AdminFeatureModule, AdminUser, RouteComponentProps } from '@xgen/types';
import {
  ContentArea, DataTable, StatusBadge, SearchInput, Button, useToast,
} from '@xgen/ui';
import type { DataTableColumn } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import {
  getAllUsers, deleteAdminUser, editUser,
} from '@xgen/api-client';
import { UserEditModal } from './UserEditModal';

// ─────────────────────────────────────────────────────────────
// AdminUsersPage
// ─────────────────────────────────────────────────────────────

const AdminUsersPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 100;

  // Edit modal
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // ── Fetch ──
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllUsers(page, pageSize);
      setUsers(res.users ?? []);
      const total = res.pagination?.total_returned ?? 0;
      setTotalPages(Math.max(1, Math.ceil(total / pageSize)));
    } catch {
      toast.error(t('admin.userManagement.userList.loadError'));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, t, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Search filter ──
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.full_name?.toLowerCase().includes(q),
    );
  }, [users, search]);

  // ── Delete ──
  const handleDelete = useCallback(
    async (user: AdminUser) => {
      const confirmed = await toast.confirm({
        title: t('admin.userManagement.userList.deleteTitle'),
        description: t('admin.userManagement.userList.deleteMessage', {
          username: user.username,
          email: user.email,
        }),
        variant: 'danger',
      });
      if (!confirmed) return;

      try {
        await deleteAdminUser({ id: user.id, username: user.username, email: user.email });
        toast.success(t('admin.userManagement.userList.deleteSuccess'));
        fetchUsers();
      } catch {
        toast.error(t('admin.userManagement.userList.deleteError'));
      }
    },
    [fetchUsers, t, toast],
  );

  // ── Edit save ──
  const handleEditSave = useCallback(
    async (data: Partial<AdminUser>) => {
      if (!editingUser) return;
      try {
        await editUser({ ...data, id: editingUser.id });
        toast.success(t('admin.userManagement.userList.updateSuccess'));
        setEditingUser(null);
        fetchUsers();
      } catch {
        toast.error(t('admin.userManagement.userList.updateError'));
      }
    },
    [editingUser, fetchUsers, t, toast],
  );

  // ── Columns ──
  const columns: DataTableColumn<AdminUser>[] = useMemo(
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
        id: 'groups',
        header: t('admin.userManagement.userList.tableHeaders.organization'),
        cell: (row) => (
          <div className="flex flex-wrap gap-1">
            {row.groups?.map((g) => (
              <span key={g} className="rounded bg-accent px-1.5 py-0.5 text-xs">
                {g}
              </span>
            ))}
          </div>
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
        id: 'last_login',
        header: t('admin.userManagement.userList.tableHeaders.lastLogin'),
        field: 'last_login',
        sortable: true,
        cell: (row) =>
          row.last_login ? (
            <span className="text-xs">{new Date(row.last_login).toLocaleString('ko-KR')}</span>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          ),
      },
      {
        id: 'last_login_ip',
        header: t('admin.userManagement.userList.tableHeaders.lastLoginIp'),
        field: 'last_login_ip',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-xs">{row.last_login_ip || '-'}</span>
        ),
      },
      {
        id: 'created_at',
        header: t('admin.userManagement.userList.tableHeaders.createdAt'),
        field: 'created_at',
        sortable: true,
        cell: (row) =>
          row.created_at ? (
            <span className="text-xs">{new Date(row.created_at).toLocaleDateString('ko-KR')}</span>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          ),
      },
      {
        id: 'actions',
        header: t('admin.userManagement.userList.tableHeaders.actions'),
        cell: (row) => (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setEditingUser(row);
              }}
            >
              {t('admin.userManagement.userList.edit')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row);
              }}
            >
              {t('admin.userManagement.userList.delete')}
            </Button>
          </div>
        ),
      },
    ],
    [t, handleDelete],
  );

  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {t('admin.pages.users.title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('admin.userManagement.userList.statsLoadTotal')} {filteredUsers.length}{t('admin.userManagement.userList.unitPeople')}
            </p>
          </div>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('admin.userManagement.userList.searchPlaceholder')}
            className="w-72"
          />
        </div>

        {/* Table */}
        <DataTable
          data={filteredUsers}
          columns={columns}
          rowKey={(row) => row.id}
          loading={loading}
          emptyMessage={t('admin.userManagement.userList.noUsers')}
          onRowClick={(row) => setEditingUser(row)}
          className="border rounded-lg"
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              {t('admin.userManagement.userList.previous')}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t('admin.userManagement.userList.statsPage')} {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('admin.userManagement.userList.next')}
            </Button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <UserEditModal
        user={editingUser}
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSave={handleEditSave}
      />
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Module
// ─────────────────────────────────────────────────────────────

const feature: AdminFeatureModule = {
  id: 'admin-users',
  name: 'AdminUsersPage',
  adminSection: 'admin-user',
  routes: {
    'admin-users': AdminUsersPage,
  },
};

export default feature;
