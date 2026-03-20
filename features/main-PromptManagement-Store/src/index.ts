'use client';
import React from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

const PromptStore: React.FC<RouteComponentProps> = () => (
  <div className="flex flex-col h-full p-6">
    <h2 className="font-semibold text-lg mb-4">프롬프트 스토어</h2>
    <div className="flex-1 text-center text-gray-400 py-12">스토어 데이터가 없습니다</div>
  </div>
);

export const promptStoreFeature: FeatureModule = {
  id: 'main-PromptManagement-Store',
  name: 'Prompt Store',
  sidebarSection: 'workflow',
  sidebarItems: [
    { id: 'prompt-store', titleKey: 'workflow.promptStore.title', descriptionKey: 'workflow.promptStore.description' },
  ],
  routes: { 'prompt-store-browse': PromptStore },
};

export default promptStoreFeature;