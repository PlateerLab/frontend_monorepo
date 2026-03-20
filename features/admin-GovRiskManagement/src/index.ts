'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminGovRiskManagementPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">위험 관리</h2>
    <div className="text-sm text-gray-400">위험 관리 페이지</div>
  </div>
);

export const adminGovRiskManagementModule: AdminSubModule = {
  id: 'admin-GovRiskManagement',
  name: '위험 관리',
  sidebarSection: 'governance',
  sidebarItems: [
    { id: 'gov-risk-management', titleKey: 'admin.sidebar.governance.riskManagement.title', descriptionKey: 'admin.sidebar.governance.riskManagement.description' },
  ],
  routes: { 'gov-risk-management': AdminGovRiskManagementPage },
};

export default adminGovRiskManagementModule;