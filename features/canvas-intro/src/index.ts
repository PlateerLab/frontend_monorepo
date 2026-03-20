'use client';
import React from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

/* ── CanvasIntroduction ── */
const CanvasIntroduction: React.FC<RouteComponentProps> = ({ onNavigate }) => (
  <div className="flex flex-col items-center justify-center h-full p-8">
    <h1 className="text-2xl font-bold mb-4">워크플로우 캔버스</h1>
    <p className="text-gray-500 mb-6">노드 기반 워크플로우를 시각적으로 설계하세요</p>
    <button
      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      onClick={() => onNavigate?.('canvas')}
    >
      캔버스 열기
    </button>
  </div>
);

export const canvasIntroFeature: FeatureModule = {
  id: 'canvas-intro',
  name: 'Canvas Introduction',
  sidebarSection: 'workflow',
  sidebarItems: [
    { id: 'canvas', titleKey: 'workflow.canvas.title', descriptionKey: 'workflow.canvas.description' },
  ],
  routes: {
    'canvas': CanvasIntroduction,
  },
  pageRoutes: [
    {
      path: '/canvas',
      component: React.lazy(() => import('./CanvasPage').catch(() => ({ default: () => <div>Canvas Page</div> }))),
    },
  ],
  introItems: ['canvas'],
};

export { CanvasIntroduction };
export default canvasIntroFeature;
