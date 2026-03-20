'use client';
import React, { useState } from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

/* ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•
   Tool Storage
   - ToolStorage, ToolStore, ToolStoreDetailModal, ToolStoreUploadModal
   ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â• */

export const ToolCard: React.FC<{
  id: string; name: string; description: string; category: string;
  onSelect: (id: string) => void;
}> = ({ id, name, description, category, onSelect }) => (
  <div onClick={() => onSelect(id)} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer transition-all">
    <div className="flex items-start justify-between">
      <h3 className="font-medium text-sm">{name}</h3>
      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">{category}</span>
    </div>
    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{description}</p>
  </div>
);

export const ToolStoreDetailModal: React.FC<{
  isOpen: boolean; onClose: () => void;
  tool?: { name: string; description: string; version: string; author: string };
}> = ({ isOpen, onClose, tool }) => {
  if (!isOpen || !tool) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-xl w-[500px] p-6">
        <h2 className="text-lg font-bold mb-2">{tool.name}</h2>
        <p className="text-sm text-gray-500 mb-4">{tool.description}</p>
        <div className="text-xs text-gray-400 space-y-1">
          <div>ë²„ì „: {tool.version}</div>
          <div>?‘ì„±?? {tool.author}</div>
        </div>
        <div className="flex justify-end mt-6 gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">?«ê¸°</button>
          <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">?¤ì¹˜</button>
        </div>
      </div>
    </div>
  );
};

export const ToolStoreUploadModal: React.FC<{
  isOpen: boolean; onClose: () => void;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-xl w-[500px]">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">?„êµ¬ ?…ë¡œ??/h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">Ã—</button>
        </div>
        <div className="p-4 space-y-4">
          <div><label className="block text-sm font-medium mb-1">?„êµ¬ ?´ë¦„</label><input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">JSON ?•ì˜</label><textarea rows={6} className="w-full px-3 py-2 border rounded-lg text-sm font-mono resize-none" /></div>
        </div>
        <div className="flex justify-end p-4 border-t gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">ì·¨ì†Œ</button>
          <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">?…ë¡œ??/button>
        </div>
      </div>
    </div>
  );
};

const ToolStorage: React.FC<RouteComponentProps> = () => (
  <div className="flex flex-col h-full">
    <div className="flex items-center justify-between px-6 py-4 border-b">
      <h2 className="font-semibold text-lg">?„êµ¬ ?¤í† ë¦¬ì?</h2>
      <div className="flex gap-2">
        <input type="text" placeholder="?„êµ¬ ê²€??.." className="px-3 py-1.5 border rounded-lg text-sm w-48" />
        <button className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">+ ?…ë¡œ??/button>
      </div>
    </div>
    <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="text-center text-gray-400 col-span-full py-12">?±ë¡???„êµ¬ê°€ ?†ìŠµ?ˆë‹¤</div>
    </div>
  </div>
);

export const toolStorageFeature: FeatureModule = {
  id: 'main-ExecutionTools',
  name: 'Tool Storage',
  sidebarSection: 'workflow',
  sidebarItems: [
    { id: 'tool-storage', titleKey: 'workflow.toolStorage.title', descriptionKey: 'workflow.toolStorage.description' },
  ],
  routes: { 'tool-storage': ToolStorage },
};

export { ToolStorage };
export default toolStorageFeature;