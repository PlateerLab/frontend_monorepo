'use client';

import React, { useState, useMemo, useCallback } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { FeatureRegistry } from '@xgen/types';
import { ContentArea, FilterTabs } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import './locales';

// ─────────────────────────────────────────────────────────────
// ToolsPage — Tab Orchestrator (Registry 기반)
// ─────────────────────────────────────────────────────────────

interface ToolsPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const ToolsPage: React.FC<ToolsPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();

  const plugins = useMemo(() => FeatureRegistry.getToolTabPlugins(), []);
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
      title={t('toolStorage.title')}
      description={t('toolStorage.description')}
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

export const mainToolStorageFeature: MainFeatureModule = {
  id: 'main-tool-management-orchestrator',
  name: 'Tool Management',
  sidebarSection: 'agentflow',
  sidebarItems: [
    {
      id: 'tool-storage',
      titleKey: 'sidebar.agentflow.tools.title',
      descriptionKey: 'sidebar.agentflow.tools.description',
    },
  ],
  routes: {
    'tool-storage': ToolsPage,
  },
  requiresAuth: true,
};

export default mainToolStorageFeature;
