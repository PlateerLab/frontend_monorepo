'use client';
import React, { useState, useCallback } from 'react';
import type { CanvasSubModule } from '@xgen/types';

/* ══════════════════════════════════════════════
   Canvas Auto Workflow
   - AI 기반 자동 워크플로우 생성
   - AutoWorkflowSidebar, PredictedNodes
   ══════════════════════════════════════════════ */

/* ── AutoWorkflowSidebar ── */
export const AutoWorkflowSidebar: React.FC<{
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
}> = ({ onGenerate, isGenerating }) => {
  const [prompt, setPrompt] = useState('');

  const handleGenerate = useCallback(() => {
    if (prompt.trim() && !isGenerating) onGenerate(prompt.trim());
  }, [prompt, isGenerating, onGenerate]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b font-semibold text-sm">자동 워크플로우 생성</div>
      <div className="p-4 flex-1 flex flex-col gap-4">
        <p className="text-sm text-gray-500">원하는 워크플로우를 자연어로 설명하세요</p>
        <textarea
          value={prompt} onChange={(e) => setPrompt(e.target.value)}
          placeholder="예: 사용자 입력을 받아서 GPT-4로 처리하고 결과를 반환하는 워크플로우"
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">
          {isGenerating ? '생성 중...' : '워크플로우 생성'}
        </button>
      </div>
    </div>
  );
};

/* ── PredictedNodes Popup ── */
export const PredictedNodesPopup: React.FC<{
  predictions: Array<{ type: string; label: string; confidence: number }>;
  onAccept: (type: string) => void;
  onDismiss: () => void;
}> = ({ predictions, onAccept, onDismiss }) => {
  if (predictions.length === 0) return null;
  return (
    <div className="absolute right-4 top-16 z-40 bg-white border border-purple-200 rounded-lg shadow-lg p-4 w-64">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-purple-700">추천 노드</span>
        <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 text-sm">×</button>
      </div>
      <div className="space-y-2">
        {predictions.map((p, i) => (
          <button key={i} onClick={() => onAccept(p.type)}
            className="w-full text-left px-3 py-2 rounded-lg border border-gray-100 hover:border-purple-300 hover:bg-purple-50 transition-colors">
            <div className="text-sm font-medium">{p.label}</div>
            <div className="text-xs text-gray-400">{(p.confidence * 100).toFixed(0)}% 확률</div>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ── Sub Module Export ── */
export const canvasAutoWorkflowModule: CanvasSubModule = {
  id: 'canvas-auto-workflow',
  name: 'Auto Workflow Generation',
  headerActions: [
    { id: 'auto-generate', label: 'AI 자동 생성', position: 'right', onClick: () => {} },
  ],
  sidePanels: [
    { id: 'auto-workflow-panel', label: '자동 생성', component: AutoWorkflowSidebar as React.ComponentType<any> },
  ],
};

export default canvasAutoWorkflowModule;
