'use client';

import React from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

const AdminErrorLogsPage: React.FC<RouteComponentProps> = () => {
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

const feature: AdminFeatureModule = {
  id: 'admin-error-logs',
  name: 'AdminErrorLogsPage',
  adminSection: 'admin-security',
  routes: {
    'admin-error-logs': AdminErrorLogsPage,
  },
};

export default feature;
