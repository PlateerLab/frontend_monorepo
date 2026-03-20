'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminSystemSettingsPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">시스템 설정</h2>
    <div className="text-sm text-gray-400">시스템 설정 페이지</div>
  </div>
);

export const adminSystemSettingsModule: AdminSubModule = {
  id: 'admin-SystemSettings',
  name: '시스템 설정',
  sidebarSection: 'settings',
  sidebarItems: [
    { id: 'system-settings', titleKey: 'admin.sidebar.setting.systemSettings.title', descriptionKey: 'admin.sidebar.setting.systemSettings.description' },
  ],
  routes: { 'system-settings': AdminSystemSettingsPage },
};

export default adminSystemSettingsModule;