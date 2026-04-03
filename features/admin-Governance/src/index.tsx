'use client';

import React from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

// ─────────────────────────────────────────────────────────────
// Page Components
// ─────────────────────────────────────────────────────────────

const GovernanceWorkflowApprovalPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.govWorkflowApproval.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.govWorkflowApproval.description')}</p>
      </div>
    </ContentArea>
  );
};

const GovernanceRiskManagementPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.govRiskManagement.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.govRiskManagement.description')}</p>
      </div>
    </ContentArea>
  );
};

const GovernanceMonitoringPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.govMonitoring.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.govMonitoring.description')}</p>
      </div>
    </ContentArea>
  );
};

const GovernanceControlPolicyPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.govControlPolicy.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.govControlPolicy.description')}</p>
      </div>
    </ContentArea>
  );
};

const GovernanceOperationHistoryPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.govOperationHistory.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.govOperationHistory.description')}</p>
      </div>
    </ContentArea>
  );
};

const GovernanceAuditTrackingPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.govAuditTracking.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.govAuditTracking.description')}</p>
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const adminGovernanceFeature: AdminFeatureModule = {
  id: 'admin-Governance',
  name: 'AI Governance',
  adminSection: 'admin-governance',
  routes: {
    'admin-gov-workflow-approval': GovernanceWorkflowApprovalPage,
    'admin-gov-risk-management': GovernanceRiskManagementPage,
    'admin-gov-monitoring': GovernanceMonitoringPage,
    'admin-gov-control-policy': GovernanceControlPolicyPage,
    'admin-gov-operation-history': GovernanceOperationHistoryPage,
    'admin-gov-audit-tracking': GovernanceAuditTrackingPage,
  },
  requiresAuth: true,
  permissions: ['admin'],
};

export default adminGovernanceFeature;
