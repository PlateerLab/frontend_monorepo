'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminSystemMonitoringPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">시스템 모니터링</h2>
    <div className="text-sm text-gray-400">시스템 모니터링 페이지</div>
  </div>
);

export const adminSystemMonitorModule: AdminSubModule = {
  id: 'admin-SystemMonitor',
  name: '시스템 모니터링',
  sidebarSection: 'system',
  sidebarItems: [
    { id: 'system-monitor', titleKey: 'admin.sidebar.system.systemMonitor.title', descriptionKey: 'admin.sidebar.system.systemMonitor.description' },
  ],
  routes: { 'system-monitor': AdminSystemMonitoringPage },
};

export default adminSystemMonitorModule;