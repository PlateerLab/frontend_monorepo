'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminAgentTracesPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">에이전트 트레이싱</h2>
    <div className="text-sm text-gray-400">에이전트 트레이싱 페이지</div>
  </div>
);

export const adminAgentTracesModule: AdminSubModule = {
  id: 'admin-AgentTraces',
  name: '에이전트 트레이싱',
  sidebarSection: 'workflow',
  sidebarItems: [
    { id: 'agent-traces', titleKey: 'admin.sidebar.workflow.agentTraces.title', descriptionKey: 'admin.sidebar.workflow.agentTraces.description' },
  ],
  routes: { 'agent-traces': AdminAgentTracesPage },
};

export default adminAgentTracesModule;