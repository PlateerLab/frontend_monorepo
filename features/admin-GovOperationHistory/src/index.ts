'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminGovOperationHistoryPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">운영 이력</h2>
    <div className="text-sm text-gray-400">운영 이력 페이지</div>
  </div>
);

export const adminGovOperationHistoryModule: AdminSubModule = {
  id: 'admin-GovOperationHistory',
  name: '운영 이력',
  sidebarSection: 'governance',
  sidebarItems: [
    { id: 'gov-operation-history', titleKey: 'admin.sidebar.governance.operationHistory.title', descriptionKey: 'admin.sidebar.governance.operationHistory.description' },
  ],
  routes: { 'gov-operation-history': AdminGovOperationHistoryPage },
};

export default adminGovOperationHistoryModule;