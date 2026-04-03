'use client';

import React from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

// ─────────────────────────────────────────────────────────────
// Page Components
// ─────────────────────────────────────────────────────────────

const MCPMarketPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.mcpMarket.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.mcpMarket.description')}</p>
      </div>
    </ContentArea>
  );
};

const MCPStationPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.pages.mcpStation.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.pages.mcpStation.description')}</p>
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const adminMCPFeature: AdminFeatureModule = {
  id: 'admin-MCP',
  name: 'MCP Management',
  adminSection: 'admin-mcp',
  routes: {
    'admin-mcp-market': MCPMarketPage,
    'admin-mcp-station': MCPStationPage,
  },
  requiresAuth: true,
  permissions: ['admin'],
};

export default adminMCPFeature;
