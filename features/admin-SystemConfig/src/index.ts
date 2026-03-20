'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminSystemConfigPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">시스템 구성</h2>
    <div className="text-sm text-gray-400">시스템 구성 페이지</div>
  </div>
);

export const adminSystemConfigModule: AdminSubModule = {
  id: 'admin-SystemConfig',
  name: '시스템 구성',
  sidebarSection: 'settings',
  sidebarItems: [
    { id: 'system-config', titleKey: 'admin.sidebar.setting.systemConfig.title', descriptionKey: 'admin.sidebar.setting.systemConfig.description' },
  ],
  routes: { 'system-config': AdminSystemConfigPage },
};

export default adminSystemConfigModule;