'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminErrorLogsPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">에러 로그</h2>
    <div className="text-sm text-gray-400">에러 로그 페이지</div>
  </div>
);

export const adminErrorLogsModule: AdminSubModule = {
  id: 'admin-ErrorLogs',
  name: '에러 로그',
  sidebarSection: 'security',
  sidebarItems: [
    { id: 'error-logs', titleKey: 'admin.sidebar.security.errorLogs.title', descriptionKey: 'admin.sidebar.security.errorLogs.description' },
  ],
  routes: { 'error-logs': AdminErrorLogsPage },
};

export default adminErrorLogsModule;