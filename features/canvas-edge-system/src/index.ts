'use client';
import React from 'react';
import type { CanvasSubModule } from '@xgen/types';

/* ══════════════════════════════════════════════
   Canvas Edge System
   - 엣지 렌더링, 연결선 스타일, 애니메이션
   ══════════════════════════════════════════════ */

/* ── Edge Types ── */
export type EdgeStyle = 'default' | 'animated' | 'dashed' | 'success' | 'error';

export interface EdgeConfig {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  style: EdgeStyle;
  label?: string;
  animated?: boolean;
}

/* ── Edge Renderer ── */
export const EdgeRenderer: React.FC<{
  config: EdgeConfig;
  isSelected: boolean;
  onClick?: () => void;
}> = ({ config, isSelected, onClick }) => {
  const baseColor = {
    default: '#94a3b8', animated: '#3b82f6', dashed: '#6b7280',
    success: '#22c55e', error: '#ef4444',
  }[config.style];

  return (
    <g onClick={onClick} className="cursor-pointer">
      <line x1={0} y1={0} x2={100} y2={100}
        stroke={isSelected ? '#2563eb' : baseColor} strokeWidth={isSelected ? 3 : 2}
        strokeDasharray={config.style === 'dashed' ? '5,5' : undefined}
      />
      {config.label && (
        <text x={50} y={50} textAnchor="middle" className="text-xs fill-gray-500">{config.label}</text>
      )}
    </g>
  );
};

/* ── Edge Label ── */
export const EdgeLabel: React.FC<{
  label: string;
  onDelete?: () => void;
}> = ({ label, onDelete }) => (
  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded text-xs shadow-sm">
    <span>{label}</span>
    {onDelete && <button onClick={onDelete} className="text-gray-400 hover:text-red-500">×</button>}
  </div>
);

/* ── Connection Validator ── */
export const validateConnection = (source: string, target: string, existingEdges: EdgeConfig[]): boolean => {
  if (source === target) return false;
  return !existingEdges.some(e => e.source === source && e.target === target);
};

/* ── Sub Module Export ── */
export const canvasEdgeSystemModule: CanvasSubModule = {
  id: 'canvas-edge-system',
  name: 'Canvas Edge System',
};

export default canvasEdgeSystemModule;
