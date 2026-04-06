'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { AdminFeatureModule, AdminUser, RouteComponentProps } from '@xgen/types';
import {
  ContentArea, DataTable, StatusBadge, SearchInput, Button, useToast,
} from '@xgen/ui';
import type { DataTableColumn } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import {
  getStandbyUsers, approveUser, deleteAdminUser,
} from '@xgen/api-client';

// ─────────────────────────────────────────────────────────────
// AdminUserCreatePage (Standby User Approval)
// ─────────────────────────────────────────────────────────────

const AdminUserCreatePage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchStandby = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStandbyUsers();
      setUsers(data ?? []);
    } catch {
      toast.error(t('admin.userManagement.userCreate.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchStandby();
  }, [fetchStandby]);

  // Search filter
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q),
    );
  }, [users, search]);

  // Approve
  const handleApprove = useCallback(
    async (user: AdminUser) => {
      const confirmed = await toast.confirm({
        title: t('admin.userManagement.userCreate.approveTitle'),
        description: t('admin.userManagement.userCreate.approveMessage', {
          username: user.username,
          email: user.email,
        }),
      });
      if (!confirmed) return;

      try {
        await approveUser({ id: user.id, username: user.username, email: user.email });
        toast.success(t('admin.userManagement.userCreate.approveSuccess'));
        fetchStandby();
      } catch {
        toast.error(t('admin.userManagement.userCreate.approveError'));
      }
    },
    [fetchStandby, t, toast],
  );

  // Reject (delete)
  const handleReject = useCallback(
    async (user: AdminUser) => {
      const confirmed = await toast.confirm({
        title: t('admin.userManagement.userCreate.rejectTitle'),
        description: t('admin.userManagement.userCreate.rejectMessage', {
          username: user.username,
          email: user.email,
        }),
        variant: 'danger',
      });
      if (!confirmed) return;

      try {
        await deleteAdminUser({ id: user.id, username: user.username, email: user.email });
        toast.success(t('admin.userManagement.userCreate.rejectSuccess'));
        fetchStandby();
      } catch {
        toast.error(t('admin.userManagement.userCreate.rejectError'));
      }
    },
    [fetchStandby, t, toast],
  );

  // Columns
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
        cell: () => (
          <StatusBadge variant="warning">
            {t('admin.userManagement.userCreate.statusWaiting')}
          </StatusBadge>
        ),
      },
      {
        id: 'created_at',
        header: t('admin.userManagement.userList.tableHeaders.createdAt'),
        field: 'created_at',
        sortable: true,
        cell: (row) =>
          row.created_at ? (
            <span className="text-xs">{new Date(row.created_at).toLocaleString('ko-KR')}</span>
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
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleApprove(row);
              }}
            >
              {t('admin.userManagement.userCreate.approve')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleReject(row);
              }}
            >
              {t('admin.userManagement.userCreate.reject')}
            </Button>
          </div>
        ),
      },
    ],
    [t, handleApprove, handleReject],
  );

  return (
    <ContentArea
      title={t('admin.pages.userCreate.title')}
      description={t('admin.pages.userCreate.description')}
      toolbar={
        <div className="flex items-center justify-between w-full">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('admin.userManagement.userList.searchPlaceholder')}
            className="w-72"
          />
          <StatusBadge variant="warning">
            {t('admin.userManagement.userCreate.totalPending', {
              count: String(filteredUsers.length),
            })}
          </StatusBadge>
        </div>
      }
    >
        {/* Table */}
        <DataTable
          data={filteredUsers}
          columns={columns}
          rowKey={(row) => row.id}
          loading={loading}
          emptyMessage={t('admin.userManagement.userCreate.noPendingUsers')}
          className="border rounded-lg"
        />
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Module
// ─────────────────────────────────────────────────────────────

const feature: AdminFeatureModule = {
  id: 'admin-user-create',
  name: 'AdminUserCreatePage',
  adminSection: 'admin-user',
  routes: {
    'admin-user-create': AdminUserCreatePage,
  },
};

export default feature;
