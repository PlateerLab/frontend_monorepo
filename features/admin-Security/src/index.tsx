'use client';

import React from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

// ─────────────────────────────────────────────────────────────
// Page Components
// ─────────────────────────────────────────────────────────────

const SecuritySettingsPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.securitySettings.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.securitySettings.description')}</p>
      </div>
    </ContentArea>
  );
};

const AuditLogsPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.auditLogs.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.auditLogs.description')}</p>
      </div>
    </ContentArea>
  );
};

const ErrorLogsPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.errorLogs.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.errorLogs.description')}</p>
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const adminSecurityFeature: AdminFeatureModule = {
  id: 'admin-Security',
  name: 'Security & Audit',
  adminSection: 'admin-security',
  routes: {
    'admin-security-settings': SecuritySettingsPage,
    'admin-audit-logs': AuditLogsPage,
    'admin-error-logs': ErrorLogsPage,
  },
  requiresAuth: true,
  permissions: ['admin'],
};

export default adminSecurityFeature;
