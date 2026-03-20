'use client';
import React from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

const WorkflowStorage: React.FC<RouteComponentProps> = () => (
  <div className="flex flex-col h-full p-6">
    <h2 className="font-semibold text-lg mb-4">워크플로우 저장소</h2>
    <div className="flex-1 text-center text-gray-400 py-12">저장된 워크플로우가 없습니다</div>
  </div>
);

export const workflowStorageFeature: FeatureModule = {
  id: 'main-WorkflowManagement-Storage',
  name: 'Workflow Storage',
  sidebarSection: 'workflow',
  sidebarItems: [
    { id: 'workflows', titleKey: 'workflow.management.title', descriptionKey: 'workflow.management.description' },
  ],
  routes: { 'workflow-storage': WorkflowStorage },
};

export default workflowStorageFeature;