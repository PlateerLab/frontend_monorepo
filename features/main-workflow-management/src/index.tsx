'use client';

import React, { useState, useMemo } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { FeatureRegistry } from '@xgen/types';
import { ContentArea, FilterTabs } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import './locales';

import styles from './styles/workflows.module.scss';

// ─────────────────────────────────────────────────────────────
// WorkflowsPage — Tab Orchestrator (Registry 기반)
// ─────────────────────────────────────────────────────────────

interface WorkflowsPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const WorkflowsPage: React.FC<WorkflowsPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();

  const plugins = useMemo(() => FeatureRegistry.getWorkflowTabPlugins(), []);
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
      title={t('workflows.title')}
      description={t('workflows.description')}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <FilterTabs
            tabs={tabs}
            activeKey={activeTab}
            onChange={(key: string) => setActiveTab(key)}
          />
        </div>

        <div className={styles.content}>
          {ActiveComponent && <ActiveComponent onNavigate={onNavigate} />}
        </div>
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const mainWorkflowsFeature: MainFeatureModule = {
  id: 'main-workflow-management',
  name: 'Workflow Management',
  sidebarSection: 'workflow',
  sidebarItems: [
    {
      id: 'workflows',
      titleKey: 'sidebar.workflow.workflows.title',
      descriptionKey: 'sidebar.workflow.workflows.description',
    },
  ],
  routes: {
    workflows: WorkflowsPage,
  },
};

export default mainWorkflowsFeature;
export { WorkflowsPage };
