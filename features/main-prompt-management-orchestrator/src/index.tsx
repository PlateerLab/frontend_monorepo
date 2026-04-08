'use client';

import React, { useState, useMemo, useCallback } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { FeatureRegistry } from '@xgen/types';
import { ContentArea, FilterTabs } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import './locales';

// ─────────────────────────────────────────────────────────────
// PromptsPage — Tab Orchestrator (Registry 기반)
// ─────────────────────────────────────────────────────────────

interface PromptsPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const PromptsPage: React.FC<PromptsPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();

  const plugins = useMemo(() => FeatureRegistry.getPromptTabPlugins(), []);
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
      title={t('promptManagement.title')}
      description={t('promptManagement.description')}
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

export const mainPromptManagementFeature: MainFeatureModule = {
  id: 'main-prompt-management-orchestrator',
  name: 'Prompt Management',
  sidebarSection: 'agentflow',
  sidebarItems: [
    {
      id: 'prompt-storage',
      titleKey: 'sidebar.agentflow.prompts.title',
      descriptionKey: 'sidebar.agentflow.prompts.description',
    },
  ],
  routes: {
    'prompt-storage': PromptsPage,
  },
  requiresAuth: true,
};

export default mainPromptManagementFeature;
