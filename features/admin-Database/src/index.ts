'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminDatabasePage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">데이터베이스</h2>
    <div className="text-sm text-gray-400">데이터베이스 페이지</div>
  </div>
);

export const adminDatabaseModule: AdminSubModule = {
  id: 'admin-Database',
  name: '데이터베이스',
  sidebarSection: 'data',
  sidebarItems: [
    { id: 'database', titleKey: 'admin.sidebar.data.database.title', descriptionKey: 'admin.sidebar.data.database.description' },
  ],
  routes: { 'database': AdminDatabasePage },
};

export default adminDatabaseModule;