'use client';

import React from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

// ─────────────────────────────────────────────────────────────
// Page Components
// ─────────────────────────────────────────────────────────────

const WorkflowManagementPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.workflowManagement.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.workflowManagement.description')}</p>
      </div>
    </ContentArea>
  );
};

const WorkflowMonitoringPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.workflowMonitoring.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.workflowMonitoring.description')}</p>
      </div>
    </ContentArea>
  );
};

const TestMonitoringPage: React.FC<RouteComponentProps> = () => {
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

const AgentTracesPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.agentTraces.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.agentTraces.description')}</p>
      </div>
    </ContentArea>
  );
};

const NodeManagementPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.nodeManagement.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.nodeManagement.description')}</p>
      </div>
    </ContentArea>
  );
};

const ChatMonitoringPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.chatMonitoring.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.chatMonitoring.description')}</p>
      </div>
    </ContentArea>
  );
};

const UserTokenDashboardPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.userTokenDashboard.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.userTokenDashboard.description')}</p>
      </div>
    </ContentArea>
  );
};

const WorkflowStorePage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.workflowStore.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.workflowStore.description')}</p>
      </div>
    </ContentArea>
  );
};

const PromptStorePage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.promptStore.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.promptStore.description')}</p>
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const adminWorkflowResourceFeature: AdminFeatureModule = {
  id: 'admin-WorkflowResource',
  name: 'Workflow Resource Management',
  adminSection: 'admin-workflow',
  routes: {
    'admin-workflow-management': WorkflowManagementPage,
    'admin-workflow-monitoring': WorkflowMonitoringPage,
    'admin-test-monitoring': TestMonitoringPage,
    'admin-agent-traces': AgentTracesPage,
    'admin-node-management': NodeManagementPage,
    'admin-chat-monitoring': ChatMonitoringPage,
    'admin-user-token-dashboard': UserTokenDashboardPage,
    'admin-workflow-store': WorkflowStorePage,
    'admin-prompt-store': PromptStorePage,
  },
  requiresAuth: true,
  permissions: ['admin'],
};

export default adminWorkflowResourceFeature;
