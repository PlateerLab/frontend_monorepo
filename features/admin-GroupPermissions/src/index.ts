'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminGroupPermissionsPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">그룹 및 권한</h2>
    <div className="text-sm text-gray-400">그룹 및 권한 페이지</div>
  </div>
);

export const adminGroupPermissionsModule: AdminSubModule = {
  id: 'admin-GroupPermissions',
  name: '그룹 및 권한',
  sidebarSection: 'user',
  sidebarItems: [
    { id: 'group-permissions', titleKey: 'admin.sidebar.user.groupPermissions.title', descriptionKey: 'admin.sidebar.user.groupPermissions.description' },
  ],
  routes: { 'group-permissions': AdminGroupPermissionsPage },
};

export default adminGroupPermissionsModule;