'use client';

import React from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

const AdminTestMonitoringPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.testMonitoring.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.testMonitoring.description')}</p>
      </div>
    </ContentArea>
  );
};

const feature: AdminFeatureModule = {
  id: 'admin-test-monitoring',
  name: 'AdminTestMonitoringPage',
  adminSection: 'admin-workflow',
  routes: {
    'admin-test-monitoring': AdminTestMonitoringPage,
  },
};

export default feature;
