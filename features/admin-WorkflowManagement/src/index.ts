'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminWorkflowManagementPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">况农敲肺快 包府</h2>
    <div className="text-sm text-gray-400">况农敲肺快 包府 其捞瘤</div>
  </div>
);

export const adminWorkflowManagementModule: AdminSubModule = {
  id: 'admin-WorkflowManagement',
  name: '况农敲肺快 包府',
  sidebarSection: 'workflow',
  sidebarItems: [
    { id: 'workflow-management', titleKey: 'admin.sidebar.workflow.workflowManagement.title', descriptionKey: 'admin.sidebar.workflow.workflowManagement.description' },
  ],
  routes: { 'workflow-management': AdminWorkflowManagementPage },
};

export default adminWorkflowManagementModule;