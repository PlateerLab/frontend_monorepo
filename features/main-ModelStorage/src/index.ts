'use client';
import React from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

/* ?�?� StoragePageContent ?�?� */
const StoragePageContent: React.FC<RouteComponentProps> = () => (
  <div className="flex flex-col h-full">
    <div className="flex items-center justify-between px-6 py-4 border-b">
      <h2 className="font-semibold text-lg">모델 ?�토리�?</h2>
      <div className="flex gap-2">
        <input type="text" placeholder="모델 검??.." className="px-3 py-1.5 border rounded-lg text-sm w-48" />
        <button className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">+ ?�로??/button>
      </div>
    </div>
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-medium text-sm mb-3">모델 목록</h3>
          <div className="text-center text-gray-400 py-8 text-sm">?�?�된 모델???�습?�다</div>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-medium text-sm mb-3">?�이?�셋 목록</h3>
          <div className="text-center text-gray-400 py-8 text-sm">?�?�된 ?�이?�셋???�습?�다</div>
        </div>
      </div>
    </div>
  </div>
);

export const modelStorageFeature: FeatureModule = {
  id: 'main-ModelStorage',
  name: 'Model Storage',
  sidebarSection: 'train',
  sidebarItems: [
    { id: 'model-storage', titleKey: 'model.storage.title', descriptionKey: 'model.storage.description' },
  ],
  routes: { 'model-storage': StoragePageContent },
};

export { StoragePageContent };
export default modelStorageFeature;