'use client';
import React, { useState } from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

/* ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•
   Model Train
   - TrainPageContent, BasicCategory, DataCategory, ModelCategory, TrainerCategory
   ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â• */

export const TrainCategorySection: React.FC<{
  title: string; description: string; children: React.ReactNode;
}> = ({ title, description, children }) => (
  <div className="border border-gray-200 rounded-lg p-4">
    <h3 className="font-semibold text-sm mb-1">{title}</h3>
    <p className="text-xs text-gray-400 mb-4">{description}</p>
    {children}
  </div>
);

export const BasicCategory: React.FC = () => (
  <TrainCategorySection title="ê¸°ë³¸ ?¤ì •" description="?™ìŠµ ê¸°ë³¸ ?Œë¼ë¯¸í„°ë¥??¤ì •?©ë‹ˆ??>
    <div className="space-y-3">
      <div><label className="block text-xs text-gray-600 mb-1">?™ìŠµ ?´ë¦„</label><input type="text" className="w-full px-3 py-1.5 border rounded text-sm" /></div>
      <div><label className="block text-xs text-gray-600 mb-1">?í¬????/label><input type="number" defaultValue={3} className="w-full px-3 py-1.5 border rounded text-sm" /></div>
      <div><label className="block text-xs text-gray-600 mb-1">ë°°ì¹˜ ?¬ê¸°</label><input type="number" defaultValue={8} className="w-full px-3 py-1.5 border rounded text-sm" /></div>
      <div><label className="block text-xs text-gray-600 mb-1">?™ìŠµë¥?/label><input type="number" defaultValue={0.0001} step={0.0001} className="w-full px-3 py-1.5 border rounded text-sm" /></div>
    </div>
  </TrainCategorySection>
);

export const DataCategory: React.FC = () => (
  <TrainCategorySection title="?°ì´???¤ì •" description="?™ìŠµ ?°ì´?°ë? êµ¬ì„±?©ë‹ˆ??>
    <div className="space-y-3">
      <div><label className="block text-xs text-gray-600 mb-1">?™ìŠµ ?°ì´??/label><button className="w-full px-3 py-2 border border-dashed rounded text-sm text-gray-400 hover:border-blue-400 hover:text-blue-600">+ ?°ì´??? íƒ</button></div>
      <div><label className="block text-xs text-gray-600 mb-1">ê²€ì¦??°ì´??/label><button className="w-full px-3 py-2 border border-dashed rounded text-sm text-gray-400 hover:border-blue-400 hover:text-blue-600">+ ?°ì´??? íƒ</button></div>
    </div>
  </TrainCategorySection>
);

export const ModelCategory: React.FC = () => (
  <TrainCategorySection title="ëª¨ë¸ ?¤ì •" description="?™ìŠµ??ê¸°ë°˜ ëª¨ë¸??? íƒ?©ë‹ˆ??>
    <div className="space-y-3">
      <div><label className="block text-xs text-gray-600 mb-1">ê¸°ë°˜ ëª¨ë¸</label><select className="w-full px-3 py-1.5 border rounded text-sm"><option>? íƒ?˜ì„¸??/option></select></div>
      <div><label className="block text-xs text-gray-600 mb-1">?™ìŠµ ë°©ë²•</label><select className="w-full px-3 py-1.5 border rounded text-sm"><option>LoRA</option><option>Full Fine-tuning</option><option>QLoRA</option></select></div>
    </div>
  </TrainCategorySection>
);

const TrainPageContent: React.FC<RouteComponentProps> = () => (
  <div className="flex flex-col h-full">
    <div className="flex items-center justify-between px-6 py-4 border-b">
      <h2 className="font-semibold text-lg">ëª¨ë¸ ?™ìŠµ</h2>
      <button className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">?™ìŠµ ?œì‘</button>
    </div>
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <BasicCategory /><DataCategory /><ModelCategory />
    </div>
  </div>
);

export const trainFeature: FeatureModule = {
  id: 'main-Training',
  name: 'Train',
  sidebarSection: 'train',
  sidebarItems: [
    { id: 'train', titleKey: 'model.train.title', descriptionKey: 'model.train.description' },
  ],
  routes: { 'train': TrainPageContent },
};

export { TrainPageContent };
export default trainFeature;