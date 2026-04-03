'use client';

import React from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

// ─────────────────────────────────────────────────────────────
// Page Components
// ─────────────────────────────────────────────────────────────

const MLModelControlPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.mlModelControl.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.mlModelControl.description')}</p>
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const adminMLOpsFeature: AdminFeatureModule = {
  id: 'admin-MLOps',
  name: 'MLOps',
  adminSection: 'admin-ml',
  routes: {
    'admin-ml-model-control': MLModelControlPage,
  },
  requiresAuth: true,
  permissions: ['admin'],
};

export default adminMLOpsFeature;
