'use client';
import React, { useState } from 'react';
import type { CanvasSubModule } from '@xgen/types';

/* ══════════════════════════════════════════════
   Canvas Execution
   - 워크플로우 실행 패널, 실행 로그, EditRun 플로팅
   ══════════════════════════════════════════════ */

export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

export interface ExecutionLog {
  nodeId: string;
  nodeName: string;
  status: ExecutionStatus;
  startTime: number;
  endTime?: number;
  output?: string;
  error?: string;
}

/* ── ExecutionPanel ── */
export const ExecutionPanel: React.FC<{
  logs: ExecutionLog[];
  status: ExecutionStatus;
  onStop?: () => void;
  onClear?: () => void;
}> = ({ logs, status, onStop, onClear }) => (
  <div className="flex flex-col h-full">
    <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">실행 로그</span>
        <span className={`w-2 h-2 rounded-full ${status === 'running' ? 'bg-green-500 animate-pulse' : status === 'error' ? 'bg-red-500' : status === 'completed' ? 'bg-blue-500' : 'bg-gray-300'}`} />
      </div>
      <div className="flex gap-2">
        {status === 'running' && onStop && <button onClick={onStop} className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200">중지</button>}
        {onClear && <button onClick={onClear} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">초기화</button>}
      </div>
    </div>
    <div className="flex-1 overflow-y-auto">
      {logs.length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-8">실행 로그가 없습니다</div>
      ) : (
        logs.map((log, i) => (
          <div key={i} className="px-4 py-2 border-b border-gray-50 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'completed' ? 'bg-green-500' : log.status === 'error' ? 'bg-red-500' : log.status === 'running' ? 'bg-yellow-500' : 'bg-gray-300'}`} />
              <span className="font-medium">{log.nodeName}</span>
              {log.endTime && <span className="text-gray-400 ml-auto">{log.endTime - log.startTime}ms</span>}
            </div>
            {log.output && <pre className="text-gray-600 mt-1 whitespace-pre-wrap">{log.output}</pre>}
            {log.error && <pre className="text-red-600 mt-1 whitespace-pre-wrap">{log.error}</pre>}
          </div>
        ))
      )}
    </div>
  </div>
);

/* ── BottomExecutionLogPanel ── */
export const BottomExecutionLogPanel: React.FC<{
  logs: ExecutionLog[];
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ logs, isExpanded, onToggle }) => (
  <div className={`border-t border-gray-200 bg-white transition-all ${isExpanded ? 'h-64' : 'h-8'}`}>
    <div onClick={onToggle} className="flex items-center justify-between px-4 py-1 cursor-pointer bg-gray-50 hover:bg-gray-100 border-b">
      <span className="text-xs font-medium text-gray-600">실행 로그 ({logs.length})</span>
      <span className="text-xs text-gray-400">{isExpanded ? '▼' : '▲'}</span>
    </div>
    {isExpanded && (
      <div className="overflow-y-auto h-[calc(100%-28px)]">
        {logs.map((log, i) => (
          <div key={i} className="px-4 py-1 text-xs font-mono border-b border-gray-50">
            <span className="text-gray-500">[{new Date(log.startTime).toLocaleTimeString()}]</span>
            <span className="ml-2 font-medium">{log.nodeName}</span>
            <span className={`ml-2 ${log.status === 'error' ? 'text-red-500' : 'text-green-600'}`}>{log.status}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

/* ── EditRunFloating ── */
export const EditRunFloating: React.FC<{
  onRun: () => void;
  onEdit: () => void;
  isRunning: boolean;
}> = ({ onRun, onEdit, isRunning }) => (
  <div className="fixed bottom-6 right-6 z-40 flex gap-2">
    <button onClick={onEdit} className="px-4 py-2 bg-white border border-gray-300 rounded-full shadow-lg text-sm hover:bg-gray-50">
      편집
    </button>
    <button onClick={onRun} disabled={isRunning}
      className={`px-6 py-2 rounded-full shadow-lg text-sm text-white ${isRunning ? 'bg-yellow-500' : 'bg-green-600 hover:bg-green-700'}`}>
      {isRunning ? '실행 중...' : '▶ 실행'}
    </button>
  </div>
);

/* ── Sub Module Export ── */
export const canvasExecutionModule: CanvasSubModule = {
  id: 'canvas-execution',
  name: 'Canvas Execution',
  headerActions: [
    { id: 'run-workflow', label: '실행', position: 'right', onClick: () => {} },
    { id: 'stop-workflow', label: '중지', position: 'right', onClick: () => {} },
  ],
  bottomPanels: [
    { id: 'execution-log', label: '실행 로그', component: ExecutionPanel as React.ComponentType<any> },
  ],
};

export default canvasExecutionModule;
