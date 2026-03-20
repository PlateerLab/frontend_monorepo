'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminPromptStorePage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">프롬프트 스토어</h2>
    <div className="text-sm text-gray-400">프롬프트 스토어 페이지</div>
  </div>
);

export const adminPromptStoreModule: AdminSubModule = {
  id: 'admin-PromptStore',
  name: '프롬프트 스토어',
  sidebarSection: 'workflow',
  sidebarItems: [
    { id: 'prompt-store', titleKey: 'admin.sidebar.workflow.promptStore.title', descriptionKey: 'admin.sidebar.workflow.promptStore.description' },
  ],
  routes: { 'prompt-store': AdminPromptStorePage },
};

export default adminPromptStoreModule;