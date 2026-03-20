'use client';
import React, { useState, useCallback, createContext, useContext } from 'react';
import type { CanvasSubModule } from '@xgen/types';

/* ══════════════════════════════════════════════
   Canvas Core Context
   - 캔버스 전체 상태 관리
   - CanvasSubModule 플러그인을 소비하는 핵심 엔진
   ══════════════════════════════════════════════ */

export interface CanvasNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface CanvasCoreContextType {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selectedNodeId: string | null;
  workflowId: string | null;
  workflowName: string;
  isExecuting: boolean;
  addNode: (node: CanvasNode) => void;
  removeNode: (id: string) => void;
  updateNode: (id: string, data: Partial<CanvasNode>) => void;
  addEdge: (edge: CanvasEdge) => void;
  removeEdge: (id: string) => void;
  selectNode: (id: string | null) => void;
  setWorkflow: (id: string, name: string) => void;
  clearCanvas: () => void;
}

const CanvasCoreContext = createContext<CanvasCoreContextType | undefined>(undefined);

export const CanvasCoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState('Untitled');
  const [isExecuting] = useState(false);

  const addNode = useCallback((node: CanvasNode) => setNodes(prev => [...prev, node]), []);
  const removeNode = useCallback((id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.source !== id && e.target !== id));
    setSelectedNodeId(prev => prev === id ? null : prev);
  }, []);
  const updateNode = useCallback((id: string, data: Partial<CanvasNode>) => setNodes(prev => prev.map(n => n.id === id ? { ...n, ...data } : n)), []);
  const addEdge = useCallback((edge: CanvasEdge) => setEdges(prev => [...prev, edge]), []);
  const removeEdge = useCallback((id: string) => setEdges(prev => prev.filter(e => e.id !== id)), []);
  const selectNode = useCallback((id: string | null) => setSelectedNodeId(id), []);
  const setWorkflow = useCallback((id: string, name: string) => { setWorkflowId(id); setWorkflowName(name); }, []);
  const clearCanvas = useCallback(() => { setNodes([]); setEdges([]); setSelectedNodeId(null); }, []);

  return (
    <CanvasCoreContext.Provider value={{ nodes, edges, selectedNodeId, workflowId, workflowName, isExecuting, addNode, removeNode, updateNode, addEdge, removeEdge, selectNode, setWorkflow, clearCanvas }}>
      {children}
    </CanvasCoreContext.Provider>
  );
};

export const useCanvasCore = (): CanvasCoreContextType => {
  const ctx = useContext(CanvasCoreContext);
  if (!ctx) throw new Error('useCanvasCore must be used within CanvasCoreProvider');
  return ctx;
};

/* ── Canvas Empty State ── */
export const CanvasEmptyState: React.FC<{ onAddNode?: () => void }> = ({ onAddNode }) => (
  <div className="flex flex-col items-center justify-center h-full text-gray-400">
    <p className="text-lg mb-2">빈 캔버스</p>
    <p className="text-sm mb-4">노드를 추가하여 워크플로우를 시작하세요</p>
    {onAddNode && (
      <button onClick={onAddNode} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
        + 노드 추가
      </button>
    )}
  </div>
);

/* ── Canvas Context Menu ── */
export const CanvasContextMenu: React.FC<{
  x: number; y: number;
  onClose: () => void;
  items: Array<{ label: string; onClick: () => void; danger?: boolean }>;
}> = ({ x, y, onClose, items }) => (
  <div className="fixed z-50" style={{ left: x, top: y }} onClick={(e) => e.stopPropagation()}>
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]" onMouseLeave={onClose}>
      {items.map((item, i) => (
        <button key={i} onClick={() => { item.onClick(); onClose(); }}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${item.danger ? 'text-red-600' : ''}`}>
          {item.label}
        </button>
      ))}
    </div>
  </div>
);

/* ── Canvas Viewport ── */
export const CanvasViewport: React.FC<{
  subModules?: CanvasSubModule[];
  children?: React.ReactNode;
}> = ({ subModules = [], children }) => (
  <div className="relative flex-1 h-full bg-gray-50 overflow-hidden">
    {/* ReactFlow integration point */}
    <div className="absolute inset-0 bg-[radial-gradient(circle,#ddd_1px,transparent_1px)] bg-[size:20px_20px]" />
    {children}
    {/* Render overlay components from sub-modules */}
    {subModules.flatMap(sm => sm.overlayComponents?.map((C, i) => <C key={`${sm.id}-overlay-${i}`} />) ?? [])}
  </div>
);

/* ── CanvasSubModule registration (this is the core - no CanvasSubModule itself) ── */
export const canvasCoreModule: CanvasSubModule = {
  id: 'canvas-core',
  name: 'Canvas Core Engine',
  headerActions: [],
  sidePanels: [],
  bottomPanels: [],
  specialNodeTypes: [],
  overlayComponents: [],
};

export default canvasCoreModule;
