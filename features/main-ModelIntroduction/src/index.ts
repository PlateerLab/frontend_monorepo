'use client';
import React from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

const ModelIntroduction: React.FC<RouteComponentProps> = ({ onNavigate }) => (
  <div className="flex flex-col items-center justify-center h-full p-8">
    <h1 className="text-2xl font-bold mb-4">ëª¨ë¸ ?™ìŠµ</h1>
    <p className="text-gray-500 mb-6">LLM ëª¨ë¸???™ìŠµ, ?‰ê?, ê´€ë¦¬í•˜?¸ìš”</p>
    <div className="flex gap-4">
      <button onClick={() => onNavigate?.('train')} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">?™ìŠµ ?œì‘</button>
      <button onClick={() => onNavigate?.('model-storage')} className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">ëª¨ë¸ ?¤í† ë¦¬ì?</button>
    </div>
  </div>
);

export const modelIntroFeature: FeatureModule = {
  id: 'main-ModelIntroduction',
  name: 'Model Introduction',
  sidebarSection: 'train',
  sidebarItems: [
    { id: 'model-intro', titleKey: 'model.intro.title', descriptionKey: 'model.intro.description' },
  ],
  routes: { 'model-intro': ModelIntroduction },
  introItems: ['model-intro'],
};

export { ModelIntroduction };
export default modelIntroFeature;