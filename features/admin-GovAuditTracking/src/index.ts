'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminGovAuditTrackingPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">감사 추적</h2>
    <div className="text-sm text-gray-400">감사 추적 페이지</div>
  </div>
);

export const adminGovAuditTrackingModule: AdminSubModule = {
  id: 'admin-GovAuditTracking',
  name: '감사 추적',
  sidebarSection: 'governance',
  sidebarItems: [
    { id: 'gov-audit-tracking', titleKey: 'admin.sidebar.governance.auditTracking.title', descriptionKey: 'admin.sidebar.governance.auditTracking.description' },
  ],
  routes: { 'gov-audit-tracking': AdminGovAuditTrackingPage },
};

export default adminGovAuditTrackingModule;