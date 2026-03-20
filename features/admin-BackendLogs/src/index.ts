'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminBackendLogsPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">백엔드 로그</h2>
    <div className="text-sm text-gray-400">백엔드 로그 페이지</div>
  </div>
);

export const adminBackendLogsModule: AdminSubModule = {
  id: 'admin-BackendLogs',
  name: '백엔드 로그',
  sidebarSection: 'system',
  sidebarItems: [
    { id: 'backend-logs', titleKey: 'admin.sidebar.system.backendLogs.title', descriptionKey: 'admin.sidebar.system.backendLogs.description' },
  ],
  routes: { 'backend-logs': AdminBackendLogsPage },
};

export default adminBackendLogsModule;