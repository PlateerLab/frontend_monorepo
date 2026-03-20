'use client';
import React from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

const WorkflowTester: React.FC<RouteComponentProps> = () => (
  <div className="flex flex-col h-full p-6">
    <h2 className="font-semibold text-lg mb-4">워크플로우 테스터</h2>
    <div className="flex-1 text-center text-gray-400 py-12">테스트 기록이 없습니다</div>
  </div>
);

export const workflowTesterFeature: FeatureModule = {
  id: 'main-WorkflowManagement-Tester',
  name: 'Workflow Tester',
  sidebarSection: 'workflow',
  sidebarItems: [
    { id: 'workflows', titleKey: 'workflow.management.title', descriptionKey: 'workflow.management.description' },
  ],
  routes: { 'workflow-tester': WorkflowTester },
};

export default workflowTesterFeature;