'use client';

import React from 'react';
import type { WorkflowMgmtTabPlugin, WorkflowMgmtTabPluginProps } from '@xgen/types';
import { useTranslation } from '@xgen/i18n';
import { FiFileText } from '@xgen/icons';
import './locales';

// ─────────────────────────────────────────────────────────────
// Log Tab — 로그 (Placeholder)
// ─────────────────────────────────────────────────────────────

const LogTab: React.FC<WorkflowMgmtTabPluginProps> = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <FiFileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <h3 className="text-lg font-medium text-foreground">
          {t('admin.workflowMgmtLog.title')}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('admin.workflowMgmtLog.description')}
        </p>
      </div>
      <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 p-6 max-w-lg w-full">
        <p className="text-xs text-muted-foreground">
          {t('admin.workflowMgmtLog.planned')}
        </p>
        <ul className="mt-3 space-y-2 text-left text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            {t('admin.workflowMgmtLog.feature1')}
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            {t('admin.workflowMgmtLog.feature2')}
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            {t('admin.workflowMgmtLog.feature3')}
          </li>
        </ul>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Plugin Export
// ─────────────────────────────────────────────────────────────

export const workflowMgmtLogPlugin: WorkflowMgmtTabPlugin = {
  id: 'log',
  name: 'WorkflowLogTab',
  tabLabelKey: 'admin.workflowMgmtLog.tabLabel',
  order: 4,
  component: LogTab,
};

export default workflowMgmtLogPlugin;
