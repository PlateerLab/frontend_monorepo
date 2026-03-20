'use client';
import React, { useState } from 'react';
import type { FeatureModule, DocumentTabConfig, RouteComponentProps } from '@xgen/types';

/* ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•
   Document Collection
   - DocumentCollectionsSection, DocumentHeader, DocumentDetailSection
   ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â• */

/* ?€?€ DocumentHeader ?€?€ */
export const DocumentHeader: React.FC<{
  tabs: Array<{ id: string; label: string }>;
  activeTab: string;
  onTabChange: (id: string) => void;
}> = ({ tabs, activeTab, onTabChange }) => (
  <div className="flex items-center gap-1 px-4 py-2 border-b bg-gray-50">
    {tabs.map(tab => (
      <button key={tab.id} onClick={() => onTabChange(tab.id)}
        className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${activeTab === tab.id ? 'bg-white border border-b-white border-gray-200 font-medium -mb-px' : 'text-gray-500 hover:text-gray-700'}`}>
        {tab.label}
      </button>
    ))}
  </div>
);

/* ?€?€ DocumentDirectory ?€?€ */
export const DocumentDirectory: React.FC<{
  items: Array<{ id: string; name: string; type: 'folder' | 'file'; children?: Array<{ id: string; name: string; type: string }> }>;
  selectedId?: string;
  onSelect: (id: string) => void;
}> = ({ items, selectedId, onSelect }) => (
  <div className="w-60 border-r border-gray-200 overflow-y-auto">
    {items.map(item => (
      <div key={item.id}>
        <div onClick={() => onSelect(item.id)}
          className={`flex items-center gap-2 px-4 py-2 cursor-pointer text-sm ${selectedId === item.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}>
          <span>{item.type === 'folder' ? '?“' : '?“„'}</span>
          <span className="truncate">{item.name}</span>
        </div>
      </div>
    ))}
  </div>
);

/* ?€?€ CollectionCard ?€?€ */
export const CollectionCard: React.FC<{
  id: string; name: string; documentCount: number; updatedAt: string;
  onSelect: (id: string) => void;
}> = ({ id, name, documentCount, updatedAt, onSelect }) => (
  <div onClick={() => onSelect(id)} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer transition-all">
    <h3 className="font-medium text-sm">{name}</h3>
    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
      <span>?“„ {documentCount}ê°?ë¬¸ì„œ</span>
      <span>{updatedAt}</span>
    </div>
  </div>
);

/* ?€?€ DocumentCollections ?€?€ */
const DocumentCollections: React.FC<RouteComponentProps> = () => {
  const [search, setSearch] = useState('');
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h2 className="font-semibold text-lg">ë¬¸ì„œ ì»¬ë ‰??/h2>
        <div className="flex items-center gap-3">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="ì»¬ë ‰??ê²€??.." className="px-3 py-1.5 border rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">+ ??ì»¬ë ‰??/button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="text-center text-gray-400 col-span-full py-12">ì»¬ë ‰?˜ì´ ?†ìŠµ?ˆë‹¤</div>
      </div>
    </div>
  );
};

export const documentCollectionFeature: FeatureModule = {
  id: 'main-DocumentManagement-Collections',
  name: 'Document Collection',
  sidebarSection: 'workflow',
  sidebarItems: [
    { id: 'documents', titleKey: 'workflow.documents.title', descriptionKey: 'workflow.documents.description' },
  ],
  routes: { 'documents': DocumentCollections },
};

export const documentCollectionTab: DocumentTabConfig = {
  id: 'collections',
  titleKey: 'documents.tab.collections',
  order: 1,
  component: DocumentCollections,
};

export { DocumentCollections };
export default documentCollectionFeature;