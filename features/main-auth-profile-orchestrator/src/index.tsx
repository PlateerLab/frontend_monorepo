'use client';

import React, { useState, useMemo, useCallback } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { FeatureRegistry } from '@xgen/types';
import { ContentArea, FilterTabs } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import './locales';

interface AuthProfilePageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const AuthProfilePage: React.FC<AuthProfilePageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();

  const plugins = useMemo(() => FeatureRegistry.getAuthProfileTabPlugins(), []);
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
      title={t('authProfileManagement.title')}
      description={t('authProfileManagement.description')}
      toolbar={
        <FilterTabs tabs={tabs} activeKey={activeTab} onChange={handleTabChange} />
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

export const mainAuthProfileOrchestratorFeature: MainFeatureModule = {
  id: 'main-auth-profile-orchestrator',
  name: 'Auth Profile Management',
  sidebarSection: 'agentflow',
  sidebarItems: [
    {
      id: 'auth-profile',
      titleKey: 'sidebar.agentflow.authProfile.title',
      descriptionKey: 'sidebar.agentflow.authProfile.description',
    },
  ],
  routes: {
    'auth-profile': AuthProfilePage,
  },
  requiresAuth: true,
};

export default mainAuthProfileOrchestratorFeature;
