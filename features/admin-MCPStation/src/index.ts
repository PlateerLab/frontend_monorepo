'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminMcpStationPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">MCP 스테이션</h2>
    <div className="text-sm text-gray-400">MCP 스테이션 페이지</div>
  </div>
);

export const adminMcpStationModule: AdminSubModule = {
  id: 'admin-MCPStation',
  name: 'MCP 스테이션',
  sidebarSection: 'mcp',
  sidebarItems: [
    { id: 'mcp-station', titleKey: 'admin.sidebar.mcp.mcpStation.title', descriptionKey: 'admin.sidebar.mcp.mcpStation.description' },
  ],
  routes: { 'mcp-station': AdminMcpStationPage },
};

export default adminMcpStationModule;