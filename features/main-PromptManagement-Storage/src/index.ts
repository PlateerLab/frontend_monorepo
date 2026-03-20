'use client';
import React from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

const PromptStorage: React.FC<RouteComponentProps> = () => (
  <div className="flex flex-col h-full p-6">
    <h2 className="font-semibold text-lg mb-4">프롬프트 저장소</h2>
    <div className="flex-1 text-center text-gray-400 py-12">저장된 프롬프트가 없습니다</div>
  </div>
);

export const promptStorageFeature: FeatureModule = {
  id: 'main-PromptManagement-Storage',
  name: 'Prompt Storage',
  sidebarSection: 'workflow',
  sidebarItems: [
    { id: 'prompt-store', titleKey: 'workflow.promptStore.title', descriptionKey: 'workflow.promptStore.description' },
  ],
  routes: { 'prompt-storage': PromptStorage },
};

export default promptStorageFeature;