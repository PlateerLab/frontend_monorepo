'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminTestMonitoringPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">테스트 모니터링</h2>
    <div className="text-sm text-gray-400">테스트 모니터링 페이지</div>
  </div>
);

export const adminTestMonitoringModule: AdminSubModule = {
  id: 'admin-TestMonitoring',
  name: '테스트 모니터링',
  sidebarSection: 'workflow',
  sidebarItems: [
    { id: 'test-monitoring', titleKey: 'admin.sidebar.workflow.testMonitoring.title', descriptionKey: 'admin.sidebar.workflow.testMonitoring.description' },
  ],
  routes: { 'test-monitoring': AdminTestMonitoringPage },
};

export default adminTestMonitoringModule;