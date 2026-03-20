'use client';
import React, { useState } from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

/* ?Ä?Ä Model Hub ?Ä?Ä */
export const ModelDetailPanel: React.FC<{
  model?: { name: string; version: string; framework: string; size: string; description: string };
  onClose: () => void;
}> = ({ model, onClose }) => {
  if (!model) return null;
  return (
    <div className="w-80 border-l border-gray-200 bg-white p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4"><h3 className="font-semibold">{model.name}</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-600">√ó</button></div>
      <div className="space-y-3 text-sm">
        <div><span className="text-gray-500">Î≤ÑÏ†Ñ:</span> <span>{model.version}</span></div>
        <div><span className="text-gray-500">?ÑÎ†à?ÑÏõå??</span> <span>{model.framework}</span></div>
        <div><span className="text-gray-500">?¨Í∏∞:</span> <span>{model.size}</span></div>
        <div><span className="text-gray-500">?§Î™Ö:</span> <p className="mt-1 text-gray-600">{model.description}</p></div>
      </div>
      <div className="flex gap-2 mt-6">
        <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Î∞∞Ìè¨</button>
        <button className="flex-1 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">?§Ïö¥Î°úÎìú</button>
      </div>
    </div>
  );
};

const MlModelHubView: React.FC<RouteComponentProps> = () => {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-lg">Î™®Îç∏ ?àÎ∏å</h2>
          <input type="text" placeholder="Î™®Îç∏ Í≤Ä??.." className="px-3 py-1.5 border rounded-lg text-sm w-64" />
        </div>
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="text-center text-gray-400 col-span-full py-12">?±Î°ù??Î™®Îç∏???ÜÏäµ?àÎã§</div>
        </div>
      </div>
      {selectedModel && <ModelDetailPanel model={undefined} onClose={() => setSelectedModel(null)} />}
    </div>
  );
};

export const modelHubFeature: FeatureModule = {
  id: 'main-ModelHub',
  name: 'Model Hub',
  sidebarSection: 'mlModel',
  sidebarItems: [
    { id: 'model-hub', titleKey: 'ml.hub.title', descriptionKey: 'ml.hub.description' },
  ],
  routes: { 'model-hub': MlModelHubView },
};

export { MlModelHubView };
export default modelHubFeature;