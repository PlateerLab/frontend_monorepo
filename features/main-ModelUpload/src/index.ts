'use client';
import React from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

const MlModelUploadView: React.FC<RouteComponentProps> = () => (
  <div className="flex flex-col h-full">
    <div className="px-6 py-4 border-b"><h2 className="font-semibold text-lg">모델 ?�로??/h2></div>
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors">
        <p className="text-gray-400 mb-2">모델 ?�일???�래그하거나 ?�릭?�여 ?�로??/p>
        <p className="text-xs text-gray-300">지???�식: .pt, .pth, .onnx, .safetensors, .bin</p>
        <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">?�일 ?�택</button>
      </div>
      <div className="space-y-4">
        <div><label className="block text-sm font-medium mb-1">모델 ?�름</label><input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
        <div><label className="block text-sm font-medium mb-1">버전</label><input type="text" defaultValue="1.0.0" className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
        <div><label className="block text-sm font-medium mb-1">?�명</label><textarea rows={3} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" /></div>
      </div>
    </div>
  </div>
);

export const modelUploadFeature: FeatureModule = {
  id: 'main-ModelUpload',
  name: 'Model Upload',
  sidebarSection: 'mlModel',
  sidebarItems: [
    { id: 'model-upload', titleKey: 'ml.upload.title', descriptionKey: 'ml.upload.description' },
  ],
  routes: { 'model-upload': MlModelUploadView },
};

export { MlModelUploadView };
export default modelUploadFeature;