'use client';

import React from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

// ─────────────────────────────────────────────────────────────
// Page Components
// ─────────────────────────────────────────────────────────────

const SystemMonitorPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.systemMonitor.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.systemMonitor.description')}</p>
      </div>
    </ContentArea>
  );
};

const SystemHealthPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.systemHealth.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.systemHealth.description')}</p>
      </div>
    </ContentArea>
  );
};

const BackendLogsPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.backendLogs.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.backendLogs.description')}</p>
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const adminSystemFeature: AdminFeatureModule = {
  id: 'admin-System',
  name: 'System Status',
  adminSection: 'admin-system',
  routes: {
    'admin-system-monitor': SystemMonitorPage,
    'admin-system-health': SystemHealthPage,
    'admin-backend-logs': BackendLogsPage,
  },
  requiresAuth: true,
  permissions: ['admin'],
};

export default adminSystemFeature;
