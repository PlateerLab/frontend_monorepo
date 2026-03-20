'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminUserTokenDashboardPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">사용자 토큰 대시보드</h2>
    <div className="text-sm text-gray-400">사용자 토큰 대시보드 페이지</div>
  </div>
);

export const adminUserTokenDashboardModule: AdminSubModule = {
  id: 'admin-UserTokenDashboard',
  name: '사용자 토큰 대시보드',
  sidebarSection: 'workflow',
  sidebarItems: [
    { id: 'user-token-dashboard', titleKey: 'admin.sidebar.workflow.userTokenDashboard.title', descriptionKey: 'admin.sidebar.workflow.userTokenDashboard.description' },
  ],
  routes: { 'user-token-dashboard': AdminUserTokenDashboardPage },
};

export default adminUserTokenDashboardModule;