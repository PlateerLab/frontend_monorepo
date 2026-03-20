'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminUserCreatePage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">사용자 등록</h2>
    <div className="text-sm text-gray-400">사용자 등록 페이지</div>
  </div>
);

export const adminUserCreateModule: AdminSubModule = {
  id: 'admin-UserCreate',
  name: '사용자 등록',
  sidebarSection: 'user',
  sidebarItems: [
    { id: 'user-create', titleKey: 'admin.sidebar.user.userCreate.title', descriptionKey: 'admin.sidebar.user.userCreate.description' },
  ],
  routes: { 'user-create': AdminUserCreatePage },
};

export default adminUserCreateModule;