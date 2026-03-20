'use client';
import React, { useState, useCallback } from 'react';
import type { CanvasSubModule } from '@xgen/types';

/* ══════════════════════════════════════════════
   Canvas Side Menu
   - 사이드 메뉴 (노드 추가, 워크플로우 목록, 템플릿)
   ══════════════════════════════════════════════ */

export interface NodeDefinition {
  type: string;
  label: string;
  category: string;
  description: string;
  icon?: string;
}

/* ── AddNodePanel ── */
export const AddNodePanel: React.FC<{
  nodes: NodeDefinition[];
  onAddNode: (type: string) => void;
  searchQuery: string;
  onSearch: (query: string) => void;
}> = ({ nodes, onAddNode, searchQuery, onSearch }) => {
  const filtered = nodes.filter(n =>
    n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const categories = [...new Set(filtered.map(n => n.category))];

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <input type="text" value={searchQuery} onChange={(e) => onSearch(e.target.value)}
          placeholder="노드 검색..." className="w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="flex-1 overflow-y-auto">
        {categories.map(cat => (
          <div key={cat}>
            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase bg-gray-50">{cat}</div>
            {filtered.filter(n => n.category === cat).map(n => (
              <div key={n.type} draggable
                onDragStart={(e) => e.dataTransfer.setData('nodeType', n.type)}
                onClick={() => onAddNode(n.type)}
                className="px-4 py-2 cursor-grab hover:bg-blue-50 border-b border-gray-50">
                <div className="text-sm font-medium">{n.label}</div>
                <div className="text-xs text-gray-400">{n.description}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── WorkflowPanel ── */
export const WorkflowPanel: React.FC<{
  workflows: Array<{ id: string; name: string; updatedAt: string }>;
  onSelect: (id: string) => void;
  onNew: () => void;
}> = ({ workflows, onSelect, onNew }) => (
  <div className="flex flex-col h-full">
    <div className="flex items-center justify-between px-4 py-3 border-b">
      <span className="text-sm font-medium">워크플로우</span>
      <button onClick={onNew} className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">+ 새로 만들기</button>
    </div>
    <div className="flex-1 overflow-y-auto">
      {workflows.map(w => (
        <div key={w.id} onClick={() => onSelect(w.id)} className="px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50">
          <div className="text-sm font-medium">{w.name}</div>
          <div className="text-xs text-gray-400 mt-0.5">{w.updatedAt}</div>
        </div>
      ))}
    </div>
  </div>
);

/* ── TemplatePanel ── */
export const TemplatePanel: React.FC<{
  templates: Array<{ id: string; name: string; description: string; nodeCount: number }>;
  onUse: (id: string) => void;
  onPreview: (id: string) => void;
}> = ({ templates, onUse, onPreview }) => (
  <div className="flex flex-col h-full">
    <div className="px-4 py-3 border-b font-semibold text-sm">템플릿</div>
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {templates.map(t => (
        <div key={t.id} className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors">
          <h4 className="text-sm font-medium">{t.name}</h4>
          <p className="text-xs text-gray-400 mt-1">{t.description}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{t.nodeCount}개 노드</span>
            <div className="flex gap-2">
              <button onClick={() => onPreview(t.id)} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">미리보기</button>
              <button onClick={() => onUse(t.id)} className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">사용</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ── MiniCanvas ── */
export const MiniCanvas: React.FC<{
  nodes: Array<{ x: number; y: number; label: string }>;
  scale?: number;
}> = ({ nodes, scale = 0.3 }) => (
  <div className="relative w-full h-32 bg-gray-50 rounded border overflow-hidden">
    {nodes.map((n, i) => (
      <div key={i} style={{ left: n.x * scale, top: n.y * scale, transform: `scale(${scale})` }}
        className="absolute bg-white border border-gray-300 rounded px-1 py-0.5 text-[8px] whitespace-nowrap origin-top-left">
        {n.label}
      </div>
    ))}
  </div>
);

/* ── SideMenu Container ── */
export const SideMenu: React.FC<{
  activePanel: string | null;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ activePanel, onClose, children }) => {
  if (!activePanel) return null;
  return (
    <div className="w-72 h-full border-r border-gray-200 bg-white flex flex-col shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
        <span className="text-sm font-medium">{activePanel}</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

/* ── Sub Module Export ── */
export const canvasSideMenuModule: CanvasSubModule = {
  id: 'canvas-side-menu',
  name: 'Canvas Side Menu',
  sidePanels: [
    { id: 'add-node-panel', label: '노드 추가', component: AddNodePanel as React.ComponentType<any> },
    { id: 'workflow-panel', label: '워크플로우', component: WorkflowPanel as React.ComponentType<any> },
    { id: 'template-panel', label: '템플릿', component: TemplatePanel as React.ComponentType<any> },
  ],
};

export default canvasSideMenuModule;
