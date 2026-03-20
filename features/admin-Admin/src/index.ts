'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminDashboardPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">관리자 대시보드</h2>
    <div className="text-sm text-gray-400">관리자 대시보드 페이지</div>
  </div>
);

export const adminAdminModule: AdminSubModule = {
  id: 'admin-Admin',
  name: 'Admin',
  sidebarSection: 'dashboard',
  sidebarItems: [
    { id: 'admin-admin', titleKey: 'admin.dashboard.title', descriptionKey: 'admin.dashboard.description' },
  ],
  routes: { 'admin-admin': AdminDashboardPage },
};

export default adminAdminModule;