'use client';

import React, { useState, useMemo, useCallback } from 'react';
import type { AdminFeatureModule, RouteComponentProps, WorkflowMgmtTabPluginProps } from '@xgen/types';
import { FeatureRegistry } from '@xgen/types';
import type { AdminWorkflowMeta } from '@xgen/api-client';
import { ContentArea, FilterTabs, Button } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiArrowLeft } from '@xgen/icons';
import './locales';

// ─────────────────────────────────────────────────────────────
// WorkflowManagementOrchestrator
// — 워크플로우 미선택 시: view 플러그인(리스트)
// — 워크플로우 선택 시: 탭 플러그인(실행기/모니터링/테스트/로그)
// ─────────────────────────────────────────────────────────────

const WorkflowManagementOrchestrator: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();

  const [selectedWorkflow, setSelectedWorkflow] = useState<AdminWorkflowMeta | null>(null);
  const [activeTab, setActiveTab] = useState('');
  const [subToolbarContent, setSubToolbarContent] = useState<React.ReactNode>(null);

  const plugins = useMemo(() => FeatureRegistry.getWorkflowMgmtTabPlugins(), []);

  // View plugin (list) is the one with id='view'
  const viewPlugin = useMemo(() => plugins.find((p) => p.id === 'view'), [plugins]);
  const tabPlugins = useMemo(() => plugins.filter((p) => p.id !== 'view'), [plugins]);

  // Initialize active tab to first tab plugin
  const effectiveTab = activeTab || tabPlugins[0]?.id || '';

  const tabs = useMemo(
    () => tabPlugins.map((p) => ({ key: p.id, label: t(p.tabLabelKey) })),
    [tabPlugins, t],
  );

  const ActiveTabComponent = useMemo(
    () => tabPlugins.find((p) => p.id === effectiveTab)?.component,
    [tabPlugins, effectiveTab],
  );

  const handleSelectWorkflow = useCallback((wf: AdminWorkflowMeta) => {
    setSelectedWorkflow(wf);
    setActiveTab(tabPlugins[0]?.id || '');
    setSubToolbarContent(null);
  }, [tabPlugins]);

  const handleBack = useCallback(() => {
    setSelectedWorkflow(null);
    setActiveTab('');
    setSubToolbarContent(null);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
    setSubToolbarContent(null);
  }, []);

  const handleSubToolbarChange = useCallback((content: React.ReactNode) => {
    setSubToolbarContent(content);
  }, []);

  // ── No workflow selected: show list view ──
  if (!selectedWorkflow) {
    const ViewComponent = viewPlugin?.component;
    return (
      <ContentArea
        title={t('admin.workflowMgmt.title')}
        description={t('admin.workflowMgmt.description')}
        contentPadding={false}
        contentClassName="flex flex-col"
      >
        {ViewComponent && (
          <ViewComponent
            selectedWorkflow={{} as Record<string, unknown>}
            onSelectWorkflow={handleSelectWorkflow}
            onSubToolbarChange={handleSubToolbarChange}
          />
        )}
      </ContentArea>
    );
  }

  // ── Workflow selected: show tabs ──
  return (
    <ContentArea
      title={selectedWorkflow.workflow_name}
      description={`${selectedWorkflow.username ?? ''} · ${new Date(selectedWorkflow.updated_at).toLocaleString('ko-KR')}`}
      headerActions={
        <Button variant="outline" size="sm" onClick={handleBack}>
          <FiArrowLeft className="w-4 h-4 mr-1" />
          {t('admin.workflowMgmt.back')}
        </Button>
      }
      toolbar={
        <FilterTabs
          tabs={tabs}
          activeKey={effectiveTab}
          onChange={handleTabChange}
        />
      }
      subToolbar={subToolbarContent}
      contentPadding={false}
      contentClassName="flex flex-col"
    >
      {ActiveTabComponent && (
        <ActiveTabComponent
          selectedWorkflow={selectedWorkflow as unknown as Record<string, unknown>}
          onSubToolbarChange={handleSubToolbarChange}
        />
      )}
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

const feature: AdminFeatureModule = {
  id: 'admin-workflow-management-orchestrator',
  name: 'WorkflowManagementOrchestrator',
  adminSection: 'admin-workflow',
  sidebarItems: [
    { id: 'admin-workflow-management', titleKey: 'admin.sidebar.workflow.workflowManagement.title', descriptionKey: 'admin.sidebar.workflow.workflowManagement.description' },
  ],
  routes: {
    'admin-workflow-management': WorkflowManagementOrchestrator,
  },
};

export default feature;
