'use client';
import React from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

const MlModelIntroduction: React.FC<RouteComponentProps> = ({ onNavigate }) => (
  <div className="flex flex-col items-center justify-center h-full p-8">
    <h1 className="text-2xl font-bold mb-4">ML 모델</h1>
    <p className="text-gray-500 mb-6">ML 모델 ?�로?? 관�? 추론???�행?�세??/p>
    <div className="flex gap-4">
      <button onClick={() => onNavigate?.('model-upload')} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">모델 ?�로??/button>
      <button onClick={() => onNavigate?.('model-hub')} className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">모델 ?�브</button>
    </div>
  </div>
);

export const mlModelIntroFeature: FeatureModule = {
  id: 'main-MLModelIntroduction',
  name: 'ML Model Introduction',
  sidebarSection: 'mlModel',
  sidebarItems: [
    { id: 'ml-model-intro', titleKey: 'ml.intro.title', descriptionKey: 'ml.intro.description' },
  ],
  routes: { 'ml-model-intro': MlModelIntroduction },
  introItems: ['ml-model-intro'],
};

export { MlModelIntroduction };
export default mlModelIntroFeature;