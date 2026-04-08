'use client';

import React from 'react';
import type { AgentflowMgmtTabPlugin, AgentflowMgmtTabPluginProps } from '@xgen/types';
import { useTranslation } from '@xgen/i18n';
import { FiPlay } from '@xgen/icons';
import './locales';

// ─────────────────────────────────────────────────────────────
// Test Tab — 테스트 (Placeholder)
// ─────────────────────────────────────────────────────────────

const TestTab: React.FC<AgentflowMgmtTabPluginProps> = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <FiPlay className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <h3 className="text-lg font-medium text-foreground">
          {t('admin.agentflowMgmtTest.title')}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('admin.agentflowMgmtTest.description')}
        </p>
      </div>
      <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 p-6 max-w-lg w-full">
        <p className="text-xs text-muted-foreground">
          {t('admin.agentflowMgmtTest.planned')}
        </p>
        <ul className="mt-3 space-y-2 text-left text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            {t('admin.agentflowMgmtTest.feature1')}
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            {t('admin.agentflowMgmtTest.feature2')}
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            {t('admin.agentflowMgmtTest.feature3')}
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            {t('admin.agentflowMgmtTest.feature4')}
          </li>
        </ul>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Plugin Export
// ─────────────────────────────────────────────────────────────

export const agentflowMgmtTestPlugin: AgentflowMgmtTabPlugin = {
  id: 'test',
  name: 'AgentflowTestTab',
  tabLabelKey: 'admin.agentflowMgmtTest.tabLabel',
  order: 3,
  component: TestTab,
};

export default agentflowMgmtTestPlugin;
