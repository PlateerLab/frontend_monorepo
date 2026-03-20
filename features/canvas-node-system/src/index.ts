'use client';
import React, { useState, useCallback } from 'react';
import type { CanvasSubModule } from '@xgen/types';

/* ══════════════════════════════════════════════
   Canvas Node System
   - 노드 렌더링, 파라미터, 포트, 컨텍스트 메뉴
   ══════════════════════════════════════════════ */

/* ── NodeHeader ── */
export const NodeHeader: React.FC<{
  label: string;
  type: string;
  isSelected: boolean;
  onDelete?: () => void;
}> = ({ label, type, isSelected, onDelete }) => (
  <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
    <div>
      <span className="font-medium text-sm">{label}</span>
      <span className="text-xs opacity-60 ml-2">{type}</span>
    </div>
    {onDelete && <button onClick={onDelete} className="text-xs opacity-60 hover:opacity-100">×</button>}
  </div>
);

/* ── NodePorts ── */
export const NodePorts: React.FC<{
  inputs: Array<{ id: string; label: string; connected: boolean }>;
  outputs: Array<{ id: string; label: string; connected: boolean }>;
}> = ({ inputs, outputs }) => (
  <div className="flex justify-between px-2 py-1">
    <div className="space-y-1">
      {inputs.map(p => (
        <div key={p.id} className="flex items-center gap-1 text-xs">
          <span className={`w-2 h-2 rounded-full ${p.connected ? 'bg-blue-500' : 'bg-gray-300'}`} />
          <span>{p.label}</span>
        </div>
      ))}
    </div>
    <div className="space-y-1">
      {outputs.map(p => (
        <div key={p.id} className="flex items-center gap-1 text-xs">
          <span>{p.label}</span>
          <span className={`w-2 h-2 rounded-full ${p.connected ? 'bg-green-500' : 'bg-gray-300'}`} />
        </div>
      ))}
    </div>
  </div>
);

/* ── NodeParameters ── */
export const NodeParameters: React.FC<{
  parameters: Array<{ key: string; type: string; value: unknown; onChange: (val: unknown) => void }>;
}> = ({ parameters }) => (
  <div className="px-3 py-2 space-y-2 border-t border-gray-100">
    {parameters.map(p => (
      <div key={p.key} className="flex items-center justify-between text-xs">
        <label className="text-gray-600">{p.key}</label>
        {p.type === 'boolean' ? (
          <input type="checkbox" checked={!!p.value} onChange={(e) => p.onChange(e.target.checked)} />
        ) : p.type === 'select' ? (
          <select value={String(p.value)} onChange={(e) => p.onChange(e.target.value)} className="border rounded px-1 py-0.5">
            <option>default</option>
          </select>
        ) : (
          <input type="text" value={String(p.value ?? '')} onChange={(e) => p.onChange(e.target.value)} className="border rounded px-1 py-0.5 w-24" />
        )}
      </div>
    ))}
  </div>
);

/* ── NodeContextMenu ── */
export const NodeContextMenu: React.FC<{
  nodeId: string;
  x: number; y: number;
  onClose: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onCopyId: () => void;
}> = ({ nodeId, x, y, onClose, onDuplicate, onDelete, onCopyId }) => (
  <div className="fixed z-50" style={{ left: x, top: y }}>
    <div className="bg-white border rounded-lg shadow-lg py-1 min-w-[140px]" onMouseLeave={onClose}>
      <button onClick={onCopyId} className="w-full text-left px-4 py-1.5 text-sm hover:bg-gray-100">ID 복사</button>
      <button onClick={onDuplicate} className="w-full text-left px-4 py-1.5 text-sm hover:bg-gray-100">복제</button>
      <hr className="my-1" />
      <button onClick={onDelete} className="w-full text-left px-4 py-1.5 text-sm text-red-600 hover:bg-red-50">삭제</button>
    </div>
  </div>
);

/* ── CanvasNode Component ── */
export const CanvasNodeComponent: React.FC<{
  id: string;
  label: string;
  type: string;
  isSelected: boolean;
  inputs?: Array<{ id: string; label: string; connected: boolean }>;
  outputs?: Array<{ id: string; label: string; connected: boolean }>;
}> = ({ id, label, type, isSelected, inputs = [], outputs = [] }) => (
  <div className={`bg-white rounded-lg shadow-md border-2 min-w-[200px] ${isSelected ? 'border-blue-500' : 'border-gray-200'}`}>
    <NodeHeader label={label} type={type} isSelected={isSelected} />
    <NodePorts inputs={inputs} outputs={outputs} />
  </div>
);

/* ── Sub Module Export ── */
export const canvasNodeSystemModule: CanvasSubModule = {
  id: 'canvas-node-system',
  name: 'Canvas Node System',
  specialNodeTypes: [],
};

export default canvasNodeSystemModule;
