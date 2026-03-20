'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminGovControlPolicyPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">제어 정책</h2>
    <div className="text-sm text-gray-400">제어 정책 페이지</div>
  </div>
);

export const adminGovControlPolicyModule: AdminSubModule = {
  id: 'admin-GovControlPolicy',
  name: '제어 정책',
  sidebarSection: 'governance',
  sidebarItems: [
    { id: 'gov-control-policy', titleKey: 'admin.sidebar.governance.controlPolicy.title', descriptionKey: 'admin.sidebar.governance.controlPolicy.description' },
  ],
  routes: { 'gov-control-policy': AdminGovControlPolicyPage },
};

export default adminGovControlPolicyModule;