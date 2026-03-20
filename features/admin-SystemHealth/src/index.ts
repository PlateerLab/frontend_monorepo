'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminSystemHealthPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">시스템 상태</h2>
    <div className="text-sm text-gray-400">시스템 상태 페이지</div>
  </div>
);

export const adminSystemHealthModule: AdminSubModule = {
  id: 'admin-SystemHealth',
  name: '시스템 상태',
  sidebarSection: 'system',
  sidebarItems: [
    { id: 'system-health', titleKey: 'admin.sidebar.system.systemHealth.title', descriptionKey: 'admin.sidebar.system.systemHealth.description' },
  ],
  routes: { 'system-health': AdminSystemHealthPage },
};

export default adminSystemHealthModule;