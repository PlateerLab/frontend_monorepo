'use client';

import React, { useState, useMemo, useCallback } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { FeatureRegistry } from '@xgen/types';
import { ContentArea, FilterTabs, UploadStatusProvider, UploadStatusPanel } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import './locales';

// ─────────────────────────────────────────────────────────────
// DocumentsPage — Tab Orchestrator (Registry 기반)
// ─────────────────────────────────────────────────────────────

interface DocumentsPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const DocumentsPage: React.FC<DocumentsPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const plugins = useMemo(() => {
    const all = FeatureRegistry.getDocumentTabPlugins();
    const perms = user?.is_superuser ? undefined : (user?.permissions ?? []);
    return FeatureRegistry.filterMainTabPlugins(all, 'document', perms);
  }, [user?.is_superuser, user?.permissions]);
  const [activeTab, setActiveTab] = useState(plugins[0]?.id ?? '');
  const [subToolbarContent, setSubToolbarContent] = useState<React.ReactNode>(null);
  const [toolbarExtraContent, setToolbarExtraContent] = useState<React.ReactNode>(null);

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
    setToolbarExtraContent(null);
  }, []);

  const handleSubToolbarChange = useCallback((content: React.ReactNode) => {
    setSubToolbarContent(content);
  }, []);

  const handleToolbarExtraChange = useCallback((content: React.ReactNode) => {
    setToolbarExtraContent(content);
  }, []);

  return (
    <UploadStatusProvider>
      <ContentArea
        title={t('documents.title')}
        description={t('documents.description')}
        toolbar={
          <div className="flex items-center gap-6">
            <FilterTabs
              tabs={tabs}
              activeKey={activeTab}
              onChange={handleTabChange}
            />
            {toolbarExtraContent}
          </div>
        }
        subToolbar={subToolbarContent}
        contentPadding={false}
        contentClassName="flex flex-col"
      >
        {ActiveComponent && (
          <ActiveComponent
            onNavigate={onNavigate}
            onSubToolbarChange={handleSubToolbarChange}
            onToolbarExtraChange={handleToolbarExtraChange}
          />
        )}
      </ContentArea>
      <UploadStatusPanel />
    </UploadStatusProvider>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const mainDocumentsFeature: MainFeatureModule = {
  id: 'main-document-management-orchestrator',
  name: 'Document Management',
  sidebarSection: 'knowledge',
  sidebarItems: [
    {
      id: 'documents',
      titleKey: 'sidebar.knowledge.collections.title',
      descriptionKey: 'sidebar.knowledge.collections.description',
    },
  ],
  routes: {
    documents: DocumentsPage,
  },
  requiresAuth: true,
};

export default mainDocumentsFeature;
export { DocumentsPage };
