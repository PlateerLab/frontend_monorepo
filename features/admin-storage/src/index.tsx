'use client';

import React from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

const AdminStoragePage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {t('admin.pages.storage.title', 'Storage Management')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('admin.pages.storage.description', 'Manage file and object storage')}
          </p>
        </div>
        <div className="flex items-center justify-center h-64 rounded-xl border border-dashed border-border bg-muted/30">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl">📦</div>
            <p className="text-sm font-medium text-muted-foreground">
              {t('common.comingSoon', 'Coming Soon')}
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              {t('admin.pages.storage.comingSoonDescription', 'Storage management features are under development.')}
            </p>
          </div>
        </div>
      </div>
    </ContentArea>
  );
};

const feature: AdminFeatureModule = {
  id: 'admin-storage',
  name: 'AdminStoragePage',
  adminSection: 'admin-data',
  routes: {
    'admin-storage': AdminStoragePage,
  },
};

export default feature;
