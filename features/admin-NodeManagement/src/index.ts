'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminNodeManagementPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">노드 관리</h2>
    <div className="text-sm text-gray-400">노드 관리 페이지</div>
  </div>
);

export const adminNodeManagementModule: AdminSubModule = {
  id: 'admin-NodeManagement',
  name: '노드 관리',
  sidebarSection: 'workflow',
  sidebarItems: [
    { id: 'node-management', titleKey: 'admin.sidebar.workflow.nodeManagement.title', descriptionKey: 'admin.sidebar.workflow.nodeManagement.description' },
  ],
  routes: { 'node-management': AdminNodeManagementPage },
};

export default adminNodeManagementModule;