'use client';
import React from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

const WorkflowScheduler: React.FC<RouteComponentProps> = () => (
  <div className="flex flex-col h-full p-6">
    <h2 className="font-semibold text-lg mb-4">워크플로우 스케줄러</h2>
    <div className="flex-1 text-center text-gray-400 py-12">예약된 워크플로우가 없습니다</div>
  </div>
);

export const workflowSchedulerFeature: FeatureModule = {
  id: 'main-WorkflowManagement-Scheduler',
  name: 'Workflow Scheduler',
  sidebarSection: 'workflow',
  sidebarItems: [
    { id: 'workflows', titleKey: 'workflow.management.title', descriptionKey: 'workflow.management.description' },
  ],
  routes: { 'workflow-scheduler': WorkflowScheduler },
};

export default workflowSchedulerFeature;