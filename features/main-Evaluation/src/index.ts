'use client';
import React, { useState } from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

/* ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•
   Model Eval
   - EvalPageContent, EvaluationTable, JobDetailModal, TaskSelector
   ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â• */

export const TaskSelector: React.FC<{
  tasks: Array<{ id: string; name: string }>;
  selectedId?: string;
  onSelect: (id: string) => void;
}> = ({ tasks, selectedId, onSelect }) => (
  <div className="flex gap-2 flex-wrap">
    {tasks.map(t => (
      <button key={t.id} onClick={() => onSelect(t.id)}
        className={`px-3 py-1 text-sm rounded-full ${selectedId === t.id ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
        {t.name}
      </button>
    ))}
  </div>
);

export const EvaluationTable: React.FC<{
  evaluations: Array<{ id: string; model: string; task: string; score: number; status: string; date: string }>;
  onViewDetail: (id: string) => void;
}> = ({ evaluations, onViewDetail }) => (
  <table className="w-full text-sm">
    <thead><tr className="border-b text-left text-gray-500"><th className="pb-2 font-medium">ëª¨ë¸</th><th className="pb-2 font-medium">?‘ì—…</th><th className="pb-2 font-medium">?ìˆ˜</th><th className="pb-2 font-medium">?íƒœ</th><th className="pb-2 font-medium">? ì§œ</th><th className="pb-2 font-medium">?ì„¸</th></tr></thead>
    <tbody>
      {evaluations.length === 0 ? (
        <tr><td colSpan={6} className="text-center text-gray-400 py-12">?‰ê? ê²°ê³¼ê°€ ?†ìŠµ?ˆë‹¤</td></tr>
      ) : (
        evaluations.map(e => (
          <tr key={e.id} className="border-b hover:bg-gray-50">
            <td className="py-2">{e.model}</td><td>{e.task}</td><td className="font-medium">{e.score.toFixed(2)}</td>
            <td><span className={`text-xs px-2 py-0.5 rounded-full ${e.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{e.status}</span></td>
            <td className="text-gray-400">{e.date}</td>
            <td><button onClick={() => onViewDetail(e.id)} className="text-blue-600 text-xs hover:underline">ë³´ê¸°</button></td>
          </tr>
        ))
      )}
    </tbody>
  </table>
);

export const JobDetailModal: React.FC<{ isOpen: boolean; onClose: () => void; jobId: string }> = ({ isOpen, onClose, jobId }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-xl w-[600px] max-h-[70vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b"><h3 className="font-semibold">?‰ê? ?ì„¸</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-600">Ã—</button></div>
        <div className="p-4"><p className="text-sm text-gray-500">Job ID: {jobId}</p></div>
      </div>
    </div>
  );
};

const EvalPageContent: React.FC<RouteComponentProps> = () => (
  <div className="flex flex-col h-full">
    <div className="flex items-center justify-between px-6 py-4 border-b">
      <h2 className="font-semibold text-lg">ëª¨ë¸ ?‰ê?</h2>
      <button className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">+ ???‰ê?</button>
    </div>
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-4">
        <TaskSelector tasks={[{ id: 'qa', name: 'QA' }, { id: 'summarization', name: '?”ì•½' }, { id: 'classification', name: 'ë¶„ë¥˜' }]} onSelect={() => {}} />
      </div>
      <EvaluationTable evaluations={[]} onViewDetail={() => {}} />
    </div>
  </div>
);

export const evalFeature: FeatureModule = {
  id: 'main-Evaluation',
  name: 'Evaluation',
  sidebarSection: 'train',
  sidebarItems: [
    { id: 'eval', titleKey: 'model.eval.title', descriptionKey: 'model.eval.description' },
  ],
  routes: { 'eval': EvalPageContent },
};

export { EvalPageContent };
export default evalFeature;