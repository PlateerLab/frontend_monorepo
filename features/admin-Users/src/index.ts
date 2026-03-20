'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminUsersPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">사용자 관리</h2>
    <div className="text-sm text-gray-400">사용자 관리 페이지</div>
  </div>
);

export const adminUsersModule: AdminSubModule = {
  id: 'admin-Users',
  name: '사용자 관리',
  sidebarSection: 'user',
  sidebarItems: [
    { id: 'users', titleKey: 'admin.sidebar.user.users.title', descriptionKey: 'admin.sidebar.user.users.description' },
  ],
  routes: { 'users': AdminUsersPage },
};

export default adminUsersModule;