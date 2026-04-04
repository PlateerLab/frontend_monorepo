'use client';

import React from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

const AdminBackupPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea
      title={t('admin.pages.backup.title', 'Backup & Restore')}
      description={t('admin.pages.backup.description', 'Database backup and restoration')}
    >
      <div className="flex items-center justify-center h-64 rounded-xl border border-dashed border-border bg-muted/30">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl">💾</div>
          <p className="text-sm font-medium text-muted-foreground">
            {t('common.comingSoon', 'Coming Soon')}
          </p>
          <p className="text-xs text-muted-foreground max-w-sm">
            {t('admin.pages.backup.comingSoonDescription', 'Backup and restore features are under development.')}
          </p>
        </div>
      </div>
    </ContentArea>
  );
};

const feature: AdminFeatureModule = {
  id: 'admin-backup',
  name: 'AdminBackupPage',
  adminSection: 'admin-data',
  routes: {
    'admin-backup': AdminBackupPage,
  },
};

export default feature;
