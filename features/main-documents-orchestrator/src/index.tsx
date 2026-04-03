'use client';

import React, { useState, useMemo } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { FeatureRegistry } from '@xgen/types';
import { ContentArea, FilterTabs } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import './locales';

// ─────────────────────────────────────────────────────────────
// DocumentsPage — Tab Orchestrator (Registry 기반)
// ─────────────────────────────────────────────────────────────

interface DocumentsPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const DocumentsPage: React.FC<DocumentsPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();

  const plugins = useMemo(() => FeatureRegistry.getDocumentTabPlugins(), []);
  const [activeTab, setActiveTab] = useState(plugins[0]?.id ?? '');

  const tabs = useMemo(
    () => plugins.map((p) => ({ key: p.id, label: t(p.tabLabelKey) })),
    [plugins, t],
  );

  const ActiveComponent = useMemo(
    () => plugins.find((p) => p.id === activeTab)?.component,
    [plugins, activeTab],
  );

  return (
    <ContentArea
      title={t('documents.title')}
      description={t('documents.description')}
    >
      <div className="flex flex-col h-full gap-6">
        <div className="flex items-center mb-4">
          <FilterTabs
            tabs={tabs}
            activeKey={activeTab}
            onChange={(key: string) => setActiveTab(key)}
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {ActiveComponent && <ActiveComponent onNavigate={onNavigate} />}
        </div>
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const mainDocumentsFeature: MainFeatureModule = {
  id: 'main-documents-orchestrator',
  name: 'Document Management',
  sidebarSection: 'knowledge',
  sidebarItems: [
    {
      id: 'documents',
      titleKey: 'sidebar.knowledge.collections.title',
    },
  ],
  routes: {
    documents: DocumentsPage,
  },
  requiresAuth: true,
};

export default mainDocumentsFeature;
export { DocumentsPage };
