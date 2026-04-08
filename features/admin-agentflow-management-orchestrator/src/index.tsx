'use client';

import React, { useState, useMemo, useCallback } from 'react';
import type { AdminFeatureModule, RouteComponentProps, AgentflowMgmtTabPluginProps } from '@xgen/types';
import { FeatureRegistry } from '@xgen/types';
import type { AdminAgentflowMeta } from '@xgen/api-client';
import { ContentArea, FilterTabs, Button } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiArrowLeft } from '@xgen/icons';
import './locales';

// ─────────────────────────────────────────────────────────────
// AgentflowManagementOrchestrator
// — 에이전트플로우 미선택 시: view 플러그인(리스트)
// — 에이전트플로우 선택 시: 탭 플러그인(실행기/모니터링/테스트/로그)
// ─────────────────────────────────────────────────────────────

const AgentflowManagementOrchestrator: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();

  const [selectedAgentflow, setSelectedAgentflow] = useState<AdminAgentflowMeta | null>(null);
  const [activeTab, setActiveTab] = useState('');
  const [subToolbarContent, setSubToolbarContent] = useState<React.ReactNode>(null);

  const plugins = useMemo(() => FeatureRegistry.getAgentflowMgmtTabPlugins(), []);

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

  const handleSelectAgentflow = useCallback((wf: AdminAgentflowMeta) => {
    setSelectedAgentflow(wf);
    setActiveTab(tabPlugins[0]?.id || '');
    setSubToolbarContent(null);
  }, [tabPlugins]);

  const handleBack = useCallback(() => {
    setSelectedAgentflow(null);
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
  if (!selectedAgentflow) {
    const ViewComponent = viewPlugin?.component;
    return (
      <ContentArea
        title={t('admin.agentflowMgmt.title')}
        description={t('admin.agentflowMgmt.description')}
        contentPadding={false}
        contentClassName="flex flex-col"
      >
        {ViewComponent && (
          <ViewComponent
            selectedAgentflow={{} as Record<string, unknown>}
            onSelectAgentflow={handleSelectAgentflow}
            onSubToolbarChange={handleSubToolbarChange}
          />
        )}
      </ContentArea>
    );
  }

  // ── Agentflow selected: show tabs ──
  return (
    <ContentArea
      title={selectedAgentflow.workflow_name}
      description={`${selectedAgentflow.username ?? ''} · ${new Date(selectedAgentflow.updated_at).toLocaleString('ko-KR')}`}
      headerActions={
        <Button variant="outline" size="sm" onClick={handleBack}>
          <FiArrowLeft className="w-4 h-4 mr-1" />
          {t('admin.agentflowMgmt.back')}
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
          selectedAgentflow={selectedAgentflow as unknown as Record<string, unknown>}
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
  id: 'admin-agentflow-management-orchestrator',
  name: 'AgentflowManagementOrchestrator',
  adminSection: 'admin-agentflow',
  sidebarItems: [
    { id: 'admin-agentflow-management', titleKey: 'admin.sidebar.agentflow.agentflowManagement.title', descriptionKey: 'admin.sidebar.agentflow.agentflowManagement.description' },
  ],
  routes: {
    'admin-agentflow-management': AgentflowManagementOrchestrator,
  },
};

export default feature;
