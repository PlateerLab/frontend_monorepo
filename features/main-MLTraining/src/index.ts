'use client';
import React from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

/* ?€?€ ML Train ?€?€ */
const MLTrainPage: React.FC<RouteComponentProps> = () => (
  <div className="flex flex-col h-full">
    <div className="flex items-center justify-between px-6 py-4 border-b">
      <h2 className="font-semibold text-lg">ML ëª¨ë¸ ?™ìŠµ</h2>
      <button className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">+ ???™ìŠµ</button>
    </div>
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="border rounded-lg p-4">
        <h3 className="font-medium text-sm mb-3">?¬ìš©???¤í¬ë¦½íŠ¸</h3>
        <div className="flex gap-4">
          <button className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">ì¹´íƒˆë¡œê·¸</button>
          <button className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">?Œí¬ë²¤ì¹˜</button>
        </div>
      </div>
      <div className="border rounded-lg p-4">
        <h3 className="font-medium text-sm mb-3">?™ìŠµ ?‘ì—… ëª©ë¡</h3>
        <div className="text-center text-gray-400 py-8">?™ìŠµ ?‘ì—…???†ìŠµ?ˆë‹¤</div>
      </div>
    </div>
  </div>
);

export const mlTrainFeature: FeatureModule = {
  id: 'main-MLTraining',
  name: 'ML Model Train',
  sidebarSection: 'mlModel',
  sidebarItems: [
    { id: 'ml-train', titleKey: 'ml.train.title', descriptionKey: 'ml.train.description' },
  ],
  routes: { 'ml-train': MLTrainPage },
};

export { MLTrainPage };
export default mlTrainFeature;