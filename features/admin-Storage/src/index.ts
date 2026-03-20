'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminStoragePage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">스토리지</h2>
    <div className="text-sm text-gray-400">스토리지 페이지</div>
  </div>
);

export const adminStorageModule: AdminSubModule = {
  id: 'admin-Storage',
  name: '스토리지',
  sidebarSection: 'data',
  sidebarItems: [
    { id: 'storage', titleKey: 'admin.sidebar.data.storage.title', descriptionKey: 'admin.sidebar.data.storage.description' },
  ],
  routes: { 'storage': AdminStoragePage },
};

export default adminStorageModule;