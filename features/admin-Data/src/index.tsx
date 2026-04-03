'use client';

import React from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

// ─────────────────────────────────────────────────────────────
// Page Components
// ─────────────────────────────────────────────────────────────

const DatabasePage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.database.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.database.description')}</p>
      </div>
    </ContentArea>
  );
};

const DataScraperPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.dataScraper.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.dataScraper.description')}</p>
      </div>
    </ContentArea>
  );
};

const StoragePage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.storage.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.storage.description')}</p>
      </div>
    </ContentArea>
  );
};

const BackupPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.backup.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.backup.description')}</p>
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const adminDataFeature: AdminFeatureModule = {
  id: 'admin-Data',
  name: 'Data Management',
  adminSection: 'admin-data',
  routes: {
    'admin-database': DatabasePage,
    'admin-data-scraper': DataScraperPage,
    'admin-storage': StoragePage,
    'admin-backup': BackupPage,
  },
  requiresAuth: true,
  permissions: ['admin'],
};

export default adminDataFeature;
