'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminMlModelControlPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">ML 모델 제어</h2>
    <div className="text-sm text-gray-400">ML 모델 제어 페이지</div>
  </div>
);

export const adminMlModelControlModule: AdminSubModule = {
  id: 'admin-MLModelControl',
  name: 'ML 모델 제어',
  sidebarSection: 'ml',
  sidebarItems: [
    { id: 'ml-model-control', titleKey: 'admin.sidebar.ml.mlModelControl.title', descriptionKey: 'admin.sidebar.ml.mlModelControl.description' },
  ],
  routes: { 'ml-model-control': AdminMlModelControlPage },
};

export default adminMlModelControlModule;