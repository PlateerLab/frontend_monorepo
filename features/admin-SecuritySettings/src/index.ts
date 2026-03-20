'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminSecuritySettingsPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">보안 설정</h2>
    <div className="text-sm text-gray-400">보안 설정 페이지</div>
  </div>
);

export const adminSecuritySettingsModule: AdminSubModule = {
  id: 'admin-SecuritySettings',
  name: '보안 설정',
  sidebarSection: 'security',
  sidebarItems: [
    { id: 'security-settings', titleKey: 'admin.sidebar.security.securitySettings.title', descriptionKey: 'admin.sidebar.security.securitySettings.description' },
  ],
  routes: { 'security-settings': AdminSecuritySettingsPage },
};

export default adminSecuritySettingsModule;