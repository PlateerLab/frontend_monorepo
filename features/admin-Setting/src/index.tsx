'use client';

import React from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

// ─────────────────────────────────────────────────────────────
// Page Components
// ─────────────────────────────────────────────────────────────

const SystemSettingsPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.systemSettings.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.systemSettings.description')}</p>
      </div>
    </ContentArea>
  );
};

const SystemConfigPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.systemConfig.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.systemConfig.description')}</p>
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const adminSettingFeature: AdminFeatureModule = {
  id: 'admin-Setting',
  name: 'Environment Settings',
  adminSection: 'admin-setting',
  routes: {
    'admin-system-settings': SystemSettingsPage,
    'admin-system-config': SystemConfigPage,
  },
  requiresAuth: true,
  permissions: ['admin'],
};

export default adminSettingFeature;
