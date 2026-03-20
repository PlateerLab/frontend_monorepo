'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminWorkflowStorePage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">워크플로우 스토어</h2>
    <div className="text-sm text-gray-400">워크플로우 스토어 페이지</div>
  </div>
);

export const adminWorkflowStoreModule: AdminSubModule = {
  id: 'admin-WorkflowStore',
  name: '워크플로우 스토어',
  sidebarSection: 'workflow',
  sidebarItems: [
    { id: 'workflow-store', titleKey: 'admin.sidebar.workflow.workflowStore.title', descriptionKey: 'admin.sidebar.workflow.workflowStore.description' },
  ],
  routes: { 'workflow-store': AdminWorkflowStorePage },
};

export default adminWorkflowStoreModule;