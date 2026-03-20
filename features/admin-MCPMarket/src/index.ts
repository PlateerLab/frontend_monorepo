'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminMcpMarketPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">MCP 마켓</h2>
    <div className="text-sm text-gray-400">MCP 마켓 페이지</div>
  </div>
);

export const adminMcpMarketModule: AdminSubModule = {
  id: 'admin-MCPMarket',
  name: 'MCP 마켓',
  sidebarSection: 'mcp',
  sidebarItems: [
    { id: 'mcp-market', titleKey: 'admin.sidebar.mcp.mcpMarket.title', descriptionKey: 'admin.sidebar.mcp.mcpMarket.description' },
  ],
  routes: { 'mcp-market': AdminMcpMarketPage },
};

export default adminMcpMarketModule;