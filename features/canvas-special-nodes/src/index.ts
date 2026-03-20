'use client';
import React from 'react';
import type { CanvasSubModule } from '@xgen/types';

/* ══════════════════════════════════════════════
   Canvas Special Nodes
   - AgentXgenNode, RouterNode, SchemaProviderNode
   ══════════════════════════════════════════════ */

/* ── AgentXgenNode ── */
export const AgentXgenNode: React.FC<{
  data: { label: string; agentType: string; model?: string };
  isSelected: boolean;
}> = ({ data, isSelected }) => (
  <div className={`bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg shadow-md min-w-[220px] border-2 ${isSelected ? 'border-yellow-400' : 'border-transparent'}`}>
    <div className="px-3 py-2 font-medium text-sm">🤖 {data.label}</div>
    <div className="px-3 py-2 bg-white/10 text-xs rounded-b-lg">
      <div>Agent: {data.agentType}</div>
      {data.model && <div>Model: {data.model}</div>}
    </div>
  </div>
);

/* ── RouterNode ── */
export const RouterNode: React.FC<{
  data: { label: string; conditions: Array<{ id: string; expression: string; target: string }> };
  isSelected: boolean;
}> = ({ data, isSelected }) => (
  <div className={`bg-orange-50 rounded-lg shadow-md min-w-[200px] border-2 ${isSelected ? 'border-orange-500' : 'border-orange-200'}`}>
    <div className="px-3 py-2 bg-orange-500 text-white rounded-t-lg font-medium text-sm">🔀 {data.label}</div>
    <div className="px-3 py-2 space-y-1">
      {data.conditions.map(c => (
        <div key={c.id} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-orange-400" />
          <span className="font-mono">{c.expression}</span>
          <span className="text-gray-400">→</span>
          <span>{c.target}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ── SchemaProviderNode ── */
export const SchemaProviderNode: React.FC<{
  data: { label: string; schema?: Record<string, string> };
  isSelected: boolean;
}> = ({ data, isSelected }) => (
  <div className={`bg-emerald-50 rounded-lg shadow-md min-w-[200px] border-2 ${isSelected ? 'border-emerald-500' : 'border-emerald-200'}`}>
    <div className="px-3 py-2 bg-emerald-500 text-white rounded-t-lg font-medium text-sm">📋 {data.label}</div>
    <div className="px-3 py-2">
      {data.schema ? (
        Object.entries(data.schema).map(([key, type]) => (
          <div key={key} className="flex justify-between text-xs py-0.5">
            <span className="font-medium">{key}</span>
            <span className="text-gray-400">{type}</span>
          </div>
        ))
      ) : (
        <div className="text-xs text-gray-400">스키마 미지정</div>
      )}
    </div>
  </div>
);

/* ── Sub Module Export ── */
export const canvasSpecialNodesModule: CanvasSubModule = {
  id: 'canvas-special-nodes',
  name: 'Canvas Special Nodes',
  specialNodeTypes: [
    { type: 'agent-xgen', component: AgentXgenNode },
    { type: 'router', component: RouterNode },
    { type: 'schema-provider', component: SchemaProviderNode },
  ],
};

export default canvasSpecialNodesModule;
