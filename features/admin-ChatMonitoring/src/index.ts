'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminChatMonitoringPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">채팅 모니터링</h2>
    <div className="text-sm text-gray-400">채팅 모니터링 페이지</div>
  </div>
);

export const adminChatMonitoringModule: AdminSubModule = {
  id: 'admin-ChatMonitoring',
  name: '채팅 모니터링',
  sidebarSection: 'workflow',
  sidebarItems: [
    { id: 'chat-monitoring', titleKey: 'admin.sidebar.workflow.chatMonitoring.title', descriptionKey: 'admin.sidebar.workflow.chatMonitoring.description' },
  ],
  routes: { 'chat-monitoring': AdminChatMonitoringPage },
};

export default adminChatMonitoringModule;