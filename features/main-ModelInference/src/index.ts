'use client';
import React from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

/* ?�?� ML Inference ?�?� */
const MlModelInferenceView: React.FC<RouteComponentProps> = () => (
  <div className="flex flex-col h-full">
    <div className="px-6 py-4 border-b"><h2 className="font-semibold text-lg">모델 추론</h2></div>
    <div className="flex-1 flex">
      <div className="w-72 border-r p-4 space-y-4 overflow-y-auto">
        <div><label className="block text-sm font-medium mb-1">모델 ?�택</label><select className="w-full px-3 py-1.5 border rounded text-sm"><option>모델???�택?�세??/option></select></div>
        <div><label className="block text-sm font-medium mb-1">버전</label><select className="w-full px-3 py-1.5 border rounded text-sm"><option>latest</option></select></div>
        <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">추론 ?�작</button>
      </div>
      <div className="flex-1 p-6">
        <div className="grid grid-cols-2 gap-6 h-full">
          <div className="border rounded-lg p-4 flex flex-col">
            <h3 className="font-medium text-sm mb-2">?�력</h3>
            <textarea className="flex-1 w-full border rounded-lg p-3 text-sm font-mono resize-none" placeholder="추론 ?�력 ?�이??.." />
          </div>
          <div className="border rounded-lg p-4 flex flex-col">
            <h3 className="font-medium text-sm mb-2">출력</h3>
            <div className="flex-1 bg-gray-50 rounded-lg p-3 text-sm font-mono overflow-auto text-gray-400">추론 결과가 ?�기???�시?�니??/div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const modelInferenceFeature: FeatureModule = {
  id: 'main-ModelInference',
  name: 'Model Inference',
  sidebarSection: 'mlModel',
  sidebarItems: [
    { id: 'model-inference', titleKey: 'ml.inference.title', descriptionKey: 'ml.inference.description' },
  ],
  routes: { 'model-inference': MlModelInferenceView },
  pageRoutes: [{ path: '/ml-inference', component: MlModelInferenceView }],
};

export { MlModelInferenceView };
export default modelInferenceFeature;