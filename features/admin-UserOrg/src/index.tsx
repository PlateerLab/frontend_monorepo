'use client';

import React from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

// ─────────────────────────────────────────────────────────────
// Page Components
// ─────────────────────────────────────────────────────────────

const UsersPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.users.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.users.description')}</p>
      </div>
    </ContentArea>
  );
};

const UserCreatePage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.userCreate.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.userCreate.description')}</p>
      </div>
    </ContentArea>
  );
};

const GroupPermissionsPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.groupPermissions.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.groupPermissions.description')}</p>
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const adminUserOrgFeature: AdminFeatureModule = {
  id: 'admin-UserOrg',
  name: 'User & Organization Management',
  adminSection: 'admin-user',
  routes: {
    'admin-users': UsersPage,
    'admin-user-create': UserCreatePage,
    'admin-group-permissions': GroupPermissionsPage,
  },
  requiresAuth: true,
  permissions: ['admin'],
};

export default adminUserOrgFeature;
