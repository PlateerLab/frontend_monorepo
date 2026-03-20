'use client';
import React from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

/* ?Ä?Ä WorkflowIntroduction ?Ä?Ä */
const WorkflowIntroduction: React.FC<RouteComponentProps> = ({ onNavigate }) => (
  <div className="flex flex-col items-center justify-center h-full p-8">
    <h1 className="text-2xl font-bold mb-4">?åÌÅ¨?åÎ°ú??/h1>
    <p className="text-gray-500 mb-6">AI ?åÌÅ¨?åÎ°ú?∞Î? Í¥ÄÎ¶¨ÌïòÍ≥??§Ìñâ?òÏÑ∏??/p>
    <div className="flex gap-4">
      <button onClick={() => onNavigate?.('workflows')} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        ?åÌÅ¨?åÎ°ú??Î™©Î°ù
      </button>
      <button onClick={() => onNavigate?.('canvas')} className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
        ??Ï∫îÎ≤Ñ??
      </button>
    </div>
  </div>
);

export const workflowIntroFeature: FeatureModule = {
  id: 'main-WorkflowIntroduction',
  name: 'Workflow Introduction',
  sidebarSection: 'workflow',
  sidebarItems: [
    { id: 'workflow-intro', titleKey: 'workflow.intro.title', descriptionKey: 'workflow.intro.description' },
  ],
  routes: { 'workflow-intro': WorkflowIntroduction },
  introItems: ['workflow-intro'],
};

export { WorkflowIntroduction };
export default workflowIntroFeature;