'use client';
import React, { useState, useCallback } from 'react';
import type { CanvasSubModule } from '@xgen/types';

/* ══════════════════════════════════════════════
   Canvas Header
   - 캔버스 상단 헤더 바, 워크플로우 이름, 저장, 디테일 패널
   - NodeDetailModal, NodeModal
   ══════════════════════════════════════════════ */

/* ── CanvasHeader ── */
export const CanvasHeader: React.FC<{
  workflowName: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onBack: () => void;
  isSaving: boolean;
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
}> = ({ workflowName, onNameChange, onSave, onBack, isSaving, leftActions, rightActions }) => (
  <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shadow-sm z-10">
    <div className="flex items-center gap-3">
      <button onClick={onBack} className="text-gray-500 hover:text-gray-700">← 뒤로</button>
      <input type="text" value={workflowName} onChange={(e) => onNameChange(e.target.value)}
        className="font-semibold text-lg bg-transparent border-none focus:outline-none focus:border-b-2 focus:border-blue-500" />
      {leftActions}
    </div>
    <div className="flex items-center gap-2">
      {rightActions}
      <button onClick={onSave} disabled={isSaving}
        className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
        {isSaving ? '저장 중...' : '저장'}
      </button>
    </div>
  </div>
);

/* ── DetailPanel ── */
export const DetailPanel: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="w-80 h-full border-l border-gray-200 bg-white flex flex-col shadow-lg">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold text-sm">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    </div>
  );
};

/* ── NodeDetailModal ── */
export const NodeDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  nodeId: string;
  nodeType: string;
  parameters: Record<string, unknown>;
  onUpdate: (params: Record<string, unknown>) => void;
}> = ({ isOpen, onClose, nodeId, nodeType, parameters, onUpdate }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-xl w-[640px] max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold">노드 상세 설정</h3>
            <p className="text-xs text-gray-400 mt-0.5">{nodeType} · {nodeId}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
          {Object.entries(parameters).map(([key, val]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{key}</label>
              <input type="text" value={String(val ?? '')}
                onChange={(e) => onUpdate({ ...parameters, [key]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
        </div>
        <div className="flex justify-end p-4 border-t gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">취소</button>
          <button onClick={onClose} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">저장</button>
        </div>
      </div>
    </div>
  );
};

/* ── NodeModal ── */
export const NodeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAddNode: (type: string) => void;
  nodeTypes: Array<{ type: string; label: string; category: string }>;
}> = ({ isOpen, onClose, onAddNode, nodeTypes }) => {
  const [search, setSearch] = useState('');
  const filtered = nodeTypes.filter(n => n.label.toLowerCase().includes(search.toLowerCase()));

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-xl w-[480px] max-h-[70vh] overflow-hidden">
        <div className="p-4 border-b">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="노드 검색..." autoFocus className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="overflow-y-auto max-h-[50vh]">
          {filtered.map(n => (
            <div key={n.type} onClick={() => { onAddNode(n.type); onClose(); }}
              className="px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-50">
              <div className="text-sm font-medium">{n.label}</div>
              <div className="text-xs text-gray-400">{n.category}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Sub Module Export ── */
export const canvasHeaderModule: CanvasSubModule = {
  id: 'canvas-header',
  name: 'Canvas Header',
  headerActions: [
    { id: 'save-workflow', label: '저장', position: 'right', onClick: () => {} },
    { id: 'detail-panel', label: '상세', position: 'right', onClick: () => {} },
  ],
};

export default canvasHeaderModule;
