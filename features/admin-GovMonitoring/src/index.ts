'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminGovMonitoringPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">거버넌스 모니터링</h2>
    <div className="text-sm text-gray-400">거버넌스 모니터링 페이지</div>
  </div>
);

export const adminGovMonitoringModule: AdminSubModule = {
  id: 'admin-GovMonitoring',
  name: '거버넌스 모니터링',
  sidebarSection: 'governance',
  sidebarItems: [
    { id: 'gov-monitoring', titleKey: 'admin.sidebar.governance.monitoring.title', descriptionKey: 'admin.sidebar.governance.monitoring.description' },
  ],
  routes: { 'gov-monitoring': AdminGovMonitoringPage },
};

export default adminGovMonitoringModule;