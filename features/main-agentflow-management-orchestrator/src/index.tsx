'use client';

import React, { useState, useMemo, useCallback } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { FeatureRegistry } from '@xgen/types';
import { ContentArea, FilterTabs } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import './locales';

// ─────────────────────────────────────────────────────────────
// AgentflowsPage — Tab Orchestrator (Registry 기반)
// ─────────────────────────────────────────────────────────────

interface AgentflowsPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const AgentflowsPage: React.FC<AgentflowsPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const plugins = useMemo(() => {
    const all = FeatureRegistry.getAgentflowTabPlugins();
    const perms = user?.is_superuser ? undefined : (user?.permissions ?? []);
    return FeatureRegistry.filterMainTabPlugins(all, 'agentflow', perms);
  }, [user?.is_superuser, user?.permissions]);
  const [activeTab, setActiveTab] = useState(plugins[0]?.id ?? '');
  const [subToolbarContent, setSubToolbarContent] = useState<React.ReactNode>(null);

  const tabs = useMemo(
    () => plugins.map((p) => ({ key: p.id, label: t(p.tabLabelKey) })),
    [plugins, t],
  );

  const ActiveComponent = useMemo(
    () => plugins.find((p) => p.id === activeTab)?.component,
    [plugins, activeTab],
  );

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
    setSubToolbarContent(null);
  }, []);

  const handleSubToolbarChange = useCallback((content: React.ReactNode) => {
    setSubToolbarContent(content);
  }, []);

  return (
    <ContentArea
      title={t('agentflows.title')}
      description={t('agentflows.description')}
      toolbar={
        <FilterTabs
          tabs={tabs}
          activeKey={activeTab}
          onChange={handleTabChange}
        />
      }
      subToolbar={subToolbarContent}
      contentPadding={false}
      contentClassName="flex flex-col"
    >
      {ActiveComponent && (
        <ActiveComponent
          onNavigate={onNavigate}
          onSubToolbarChange={handleSubToolbarChange}
        />
      )}
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const mainAgentflowsFeature: MainFeatureModule = {
  id: 'main-agentflow-management-orchestrator',
  name: 'Agentflow Management',
  sidebarSection: 'agentflow',
  sidebarItems: [
    {
      id: 'agentflows',
      titleKey: 'sidebar.agentflow.agentflows.title',
      descriptionKey: 'sidebar.agentflow.agentflows.description',
    },
  ],
  routes: {
    agentflows: AgentflowsPage,
  },
  requiresAuth: true,
};

export default mainAgentflowsFeature;
export { AgentflowsPage };
