'use client';
import React, { useState } from 'react';
import type { FeatureModule, DocumentTabConfig, RouteComponentProps } from '@xgen/types';

/* ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•
   Document Repository
   - ?¸ë? ?ˆí¬ì§€? ë¦¬ ?°ë™ ?? ?”ë ‰? ë¦¬ ?¸ë¦¬, ê·¸ë˜??
   ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â• */

/* ?€?€ DocumentsDirectoryTree ?€?€ */
export const DocumentsDirectoryTree: React.FC<{
  items: Array<{ id: string; name: string; type: 'file' | 'folder'; childCount?: number }>;
  selectedId?: string;
  onSelect: (id: string) => void;
}> = ({ items, selectedId, onSelect }) => (
  <div className="w-56 border-r overflow-y-auto">
    {items.map(item => (
      <div key={item.id} onClick={() => onSelect(item.id)}
        className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm ${selectedId === item.id ? 'bg-blue-50 text-blue-700' :'hover:bg-gray-50'}`}>
        <span>{item.type === 'folder' ? '?“' : '?“„'}</span>
        <span className="truncate flex-1">{item.name}</span>
        {item.childCount !== undefined && <span className="text-xs text-gray-400">{item.childCount}</span>}
      </div>
    ))}
  </div>
);

/* ?€?€ DocumentsGraph ?€?€ */
export const DocumentsGraph: React.FC<{
  nodes: Array<{ id: string; label: string; x: number; y: number }>;
  edges: Array<{ source: string; target: string }>;
}> = ({ nodes, edges }) => (
  <div className="relative w-full h-64 bg-gray-50 rounded-lg border overflow-hidden">
    <svg className="absolute inset-0 w-full h-full">
      {edges.map((e, i) => {
        const s = nodes.find(n => n.id === e.source);
        const t = nodes.find(n => n.id === e.target);
        if (!s || !t) return null;
        return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#94a3b8" strokeWidth={1} />;
      })}
    </svg>
    {nodes.map(n => (
      <div key={n.id} style={{ left: n.x - 30, top: n.y - 10 }}
        className="absolute bg-white border border-gray-300 rounded px-2 py-1 text-xs shadow-sm">
        {n.label}
      </div>
    ))}
  </div>
);

/* ?€?€ DocumentRepositoriesSection ?€?€ */
const DocumentRepositoriesSection: React.FC<RouteComponentProps> = () => (
  <div className="flex flex-col h-full">
    <div className="flex items-center justify-between px-6 py-4 border-b">
      <h2 className="font-semibold">?ˆí¬ì§€? ë¦¬</h2>
      <button className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">+ ?ˆí¬ì§€? ë¦¬ ?°ë™</button>
    </div>
    <div className="flex-1 flex items-center justify-center text-gray-400">?°ë™???ˆí¬ì§€? ë¦¬ê°€ ?†ìŠµ?ˆë‹¤</div>
  </div>
);

export const documentRepositoryFeature: FeatureModule = {
  id: 'main-DocumentManagement-Repository',
  name: 'Document Repository',
  sidebarSection: 'workflow',
  sidebarItems: [],
  routes: {},
};

export const documentRepositoryTab: DocumentTabConfig = {
  id: 'repositories',
  titleKey: 'documents.tab.repositories',
  order: 3,
  component: DocumentRepositoriesSection,
};

export { DocumentRepositoriesSection };
export default documentRepositoryFeature;