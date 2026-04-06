'use client';

import React, { useState, useMemo, useCallback } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { FeatureRegistry } from '@xgen/types';
import { ContentArea, FilterTabs } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

// ─────────────────────────────────────────────────────────────
// GovMonitoringPage — Tab Orchestrator (Registry 기반)
// ─────────────────────────────────────────────────────────────

const GovMonitoringPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();

  const plugins = useMemo(() => FeatureRegistry.getGovMonitoringTabPlugins(), []);
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
      title={t('admin.pages.govMonitoring.title', 'Governance Monitoring')}
      description={t('admin.pages.govMonitoring.description', 'Inspection monitoring and overdue tracking')}
      toolbar={
        <FilterTabs
          tabs={tabs}
          activeKey={activeTab}
          onChange={handleTabChange}
          variant="underline"
        />
      }
      subToolbar={subToolbarContent}
      contentPadding={false}
      contentClassName="flex flex-col"
    >
      {ActiveComponent && (
        <ActiveComponent
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
  id: 'admin-gov-monitoring-orchestrator',
  name: 'GovMonitoringOrchestrator',
  adminSection: 'admin-governance',
  routes: {
    'admin-gov-monitoring': GovMonitoringPage,
  },
};

export default feature;
export { GovMonitoringPage };
