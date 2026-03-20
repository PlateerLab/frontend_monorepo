'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminAuditLogsPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">감사 로그</h2>
    <div className="text-sm text-gray-400">감사 로그 페이지</div>
  </div>
);

export const adminAuditLogsModule: AdminSubModule = {
  id: 'admin-AuditLogs',
  name: '감사 로그',
  sidebarSection: 'security',
  sidebarItems: [
    { id: 'audit-logs', titleKey: 'admin.sidebar.security.auditLogs.title', descriptionKey: 'admin.sidebar.security.auditLogs.description' },
  ],
  routes: { 'audit-logs': AdminAuditLogsPage },
};

export default adminAuditLogsModule;