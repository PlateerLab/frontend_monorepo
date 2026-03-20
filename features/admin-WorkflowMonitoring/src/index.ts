'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminWorkflowMonitoringPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">워크플로우 모니터링</h2>
    <div className="text-sm text-gray-400">워크플로우 모니터링 페이지</div>
  </div>
);

export const adminWorkflowMonitoringModule: AdminSubModule = {
  id: 'admin-WorkflowMonitoring',
  name: '워크플로우 모니터링',
  sidebarSection: 'workflow',
  sidebarItems: [
    { id: 'workflow-monitoring', titleKey: 'admin.sidebar.workflow.workflowMonitoring.title', descriptionKey: 'admin.sidebar.workflow.workflowMonitoring.description' },
  ],
  routes: { 'workflow-monitoring': AdminWorkflowMonitoringPage },
};

export default adminWorkflowMonitoringModule;