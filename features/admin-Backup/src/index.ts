'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminBackupPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">백업</h2>
    <div className="text-sm text-gray-400">백업 페이지</div>
  </div>
);

export const adminBackupModule: AdminSubModule = {
  id: 'admin-Backup',
  name: '백업',
  sidebarSection: 'data',
  sidebarItems: [
    { id: 'backup', titleKey: 'admin.sidebar.data.backup.title', descriptionKey: 'admin.sidebar.data.backup.description' },
  ],
  routes: { 'backup': AdminBackupPage },
};

export default adminBackupModule;