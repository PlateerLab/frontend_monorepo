'use client';
import React from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

/* ?€?€ MetricsPageContent (Train Monitor) ?€?€ */
const MetricsPageContent: React.FC<RouteComponentProps> = () => (
  <div className="flex flex-col h-full">
    <div className="px-6 py-4 border-b"><h2 className="font-semibold text-lg">?™ìŠµ ëª¨ë‹ˆ?°ë§</h2></div>
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4"><h3 className="text-sm font-medium mb-3">Loss</h3><div className="h-48 bg-gray-50 rounded flex items-center justify-center text-gray-400 text-sm">Loss ì°¨íŠ¸ ?ì—­</div></div>
        <div className="border rounded-lg p-4"><h3 className="text-sm font-medium mb-3">Learning Rate</h3><div className="h-48 bg-gray-50 rounded flex items-center justify-center text-gray-400 text-sm">LR ì°¨íŠ¸ ?ì—­</div></div>
        <div className="border rounded-lg p-4"><h3 className="text-sm font-medium mb-3">GPU ?¬ìš©ë¥?/h3><div className="h-48 bg-gray-50 rounded flex items-center justify-center text-gray-400 text-sm">GPU ì°¨íŠ¸ ?ì—­</div></div>
        <div className="border rounded-lg p-4"><h3 className="text-sm font-medium mb-3">ë©”ëª¨ë¦??¬ìš©??/h3><div className="h-48 bg-gray-50 rounded flex items-center justify-center text-gray-400 text-sm">ë©”ëª¨ë¦?ì°¨íŠ¸ ?ì—­</div></div>
      </div>
      <div className="mt-6 border rounded-lg p-4">
        <h3 className="text-sm font-medium mb-3">?™ìŠµ ?‘ì—… ëª©ë¡</h3>
        <div className="text-center text-gray-400 py-8">ì§„í–‰ ì¤‘ì¸ ?™ìŠµ???†ìŠµ?ˆë‹¤</div>
      </div>
    </div>
  </div>
);

export const trainMonitorFeature: FeatureModule = {
  id: 'main-TrainMonitor',
  name: 'Train Monitor',
  sidebarSection: 'train',
  sidebarItems: [
    { id: 'train-monitor', titleKey: 'model.trainMonitor.title', descriptionKey: 'model.trainMonitor.description' },
  ],
  routes: { 'train-monitor': MetricsPageContent },
};

export { MetricsPageContent };
export default trainMonitorFeature;