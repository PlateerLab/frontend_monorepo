'use client';
import React, { useState, useCallback } from 'react';
import type { CanvasSubModule } from '@xgen/types';

/* ══════════════════════════════════════════════
   Canvas History
   - 워크플로우 편집 히스토리 (undo/redo)
   - HistoryPanel 사이드 패널
   ══════════════════════════════════════════════ */

export interface HistoryEntry {
  id: string;
  timestamp: number;
  action: string;
  description: string;
  snapshot?: unknown;
}

/* ── HistoryPanel ── */
export const HistoryPanel: React.FC<{
  entries: HistoryEntry[];
  currentIndex: number;
  onRestore: (index: number) => void;
}> = ({ entries, currentIndex, onRestore }) => (
  <div className="flex flex-col h-full">
    <div className="px-4 py-3 border-b font-semibold text-sm">편집 히스토리</div>
    <div className="flex-1 overflow-y-auto">
      {entries.length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-8">히스토리가 없습니다</div>
      ) : (
        entries.map((entry, i) => (
          <div key={entry.id}
            onClick={() => onRestore(i)}
            className={`px-4 py-2 cursor-pointer border-b border-gray-50 text-sm ${i === currentIndex ? 'bg-blue-50 text-blue-700 font-medium' : i > currentIndex ? 'text-gray-400' : 'hover:bg-gray-50'}`}>
            <div>{entry.description}</div>
            <div className="text-xs text-gray-400 mt-0.5">{new Date(entry.timestamp).toLocaleTimeString()}</div>
          </div>
        ))
      )}
    </div>
  </div>
);

/* ── useCanvasHistory Hook ── */
export const useCanvasHistory = () => {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const pushEntry = useCallback((action: string, description: string, snapshot?: unknown) => {
    const entry: HistoryEntry = { id: crypto.randomUUID(), timestamp: Date.now(), action, description, snapshot };
    setEntries(prev => {
      const next = [...prev.slice(0, currentIndex + 1), entry];
      return next;
    });
    setCurrentIndex(prev => prev + 1);
  }, [currentIndex]);

  const undo = useCallback(() => { if (currentIndex > 0) setCurrentIndex(prev => prev - 1); }, [currentIndex]);
  const redo = useCallback(() => { if (currentIndex < entries.length - 1) setCurrentIndex(prev => prev + 1); }, [currentIndex, entries.length]);
  const restore = useCallback((index: number) => { if (index >= 0 && index < entries.length) setCurrentIndex(index); }, [entries.length]);

  return { entries, currentIndex, pushEntry, undo, redo, restore, canUndo: currentIndex > 0, canRedo: currentIndex < entries.length - 1 };
};

/* ── Sub Module Export ── */
export const canvasHistoryModule: CanvasSubModule = {
  id: 'canvas-history',
  name: 'Canvas History',
  headerActions: [
    { id: 'undo', label: '실행 취소', position: 'left', onClick: () => {} },
    { id: 'redo', label: '다시 실행', position: 'left', onClick: () => {} },
  ],
  sidePanels: [
    { id: 'history-panel', label: '히스토리', component: HistoryPanel as React.ComponentType<any> },
  ],
};

export default canvasHistoryModule;
