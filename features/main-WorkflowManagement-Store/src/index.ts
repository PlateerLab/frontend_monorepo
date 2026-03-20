'use client';
import React from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

const WorkflowStore: React.FC<RouteComponentProps> = () => (
  <div className="flex flex-col h-full p-6">
    <h2 className="font-semibold text-lg mb-4">워크플로우 스토어</h2>
    <div className="flex-1 text-center text-gray-400 py-12">스토어 데이터가 없습니다</div>
  </div>
);

export const workflowStoreFeature: FeatureModule = {
  id: 'main-WorkflowManagement-Store',
  name: 'Workflow Store',
  sidebarSection: 'workflow',
  sidebarItems: [
    { id: 'workflows', titleKey: 'workflow.management.title', descriptionKey: 'workflow.management.description' },
  ],
  routes: { 'workflow-store': WorkflowStore },
};

export default workflowStoreFeature;