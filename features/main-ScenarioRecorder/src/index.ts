'use client';
import React, { useState } from 'react';
import type { FeatureModule } from '@xgen/types';

/* ?Ä?Ä Action Item ?Ä?Ä */
interface RecordedAction { id: number; type: string; selector: string; value?: string }
const ActionItem: React.FC<{ action: RecordedAction; onDelete: () => void }> = ({ action, onDelete }) => (
  <div className="flex items-center gap-3 px-3 py-2 border rounded-lg text-sm group">
    <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{action.type}</span>
    <span className="flex-1 truncate font-mono text-xs text-gray-500">{action.selector}</span>
    {action.value && <span className="text-xs text-blue-500 truncate max-w-[120px]">{action.value}</span>}
    <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs">??/button>
  </div>
);

/* ?Ä?Ä Scenario Recorder ?Ä?Ä */
const ScenarioRecorderPage: React.FC = () => {
  const [mode, setMode] = useState<'manual' | 'agent'>('manual');
  const [recording, setRecording] = useState(false);
  const [actions, setActions] = useState<RecordedAction[]>([]);
  const [scenarios, setScenarios] = useState<{ id: number; name: string; count: number }[]>([]);

  const deleteAction = (id: number) => setActions((p) => p.filter((a) => a.id !== id));

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* left: scenario list */}
      <aside className="w-64 border-r bg-white dark:bg-gray-800 overflow-y-auto flex flex-col">
        <div className="p-3 border-b flex items-center justify-between">
          <h3 className="font-semibold text-sm">?úÎÇòÎ¶¨Ïò§ Î™©Î°ù</h3>
          <button className="text-xs text-blue-500 hover:underline">+ ???úÎÇòÎ¶¨Ïò§</button>
        </div>
        <div className="flex-1 p-2 space-y-1">
          {scenarios.length === 0 && <p className="text-xs text-gray-400 text-center py-8">?Ä?•Îêú ?úÎÇòÎ¶¨Ïò§ ?ÜÏùå</p>}
          {scenarios.map((s) => (
            <div key={s.id} className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm cursor-pointer">
              <p className="font-medium truncate">{s.name}</p>
              <p className="text-xs text-gray-400">{s.count}Í∞??°ÏÖò</p>
            </div>
          ))}
        </div>
        <div className="p-3 border-t space-y-1">
          <button className="w-full text-xs px-3 py-1.5 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">?ì§ ?¥Î≥¥?¥Í∏∞</button>
          <button className="w-full text-xs px-3 py-1.5 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">?ì• Í∞Ä?∏Ïò§Í∏?(Excel)</button>
        </div>
      </aside>

      {/* center: action list + controls */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* mode toggle */}
        <div className="px-4 py-2 border-b flex items-center gap-4">
          <div className="flex rounded-lg border overflow-hidden text-sm">
            <button onClick={() => setMode('manual')} className={`px-3 py-1.5 ${mode === 'manual' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>Manual</button>
            <button onClick={() => setMode('agent')} className={`px-3 py-1.5 ${mode === 'agent' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>Agent</button>
          </div>
          <div className="flex-1" />
          {/* controls */}
          <div className="flex items-center gap-2">
            {!recording ? (
              <button onClick={() => setRecording(true)} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600">???πÌôî ?úÏûë</button>
            ) : (
              <button onClick={() => setRecording(false)} className="px-3 py-1.5 bg-gray-500 text-white rounded-lg text-xs font-medium hover:bg-gray-600">??Ï§ëÏ?</button>
            )}
            <button className="px-3 py-1.5 border rounded-lg text-xs hover:bg-gray-100 dark:hover:bg-gray-700">?íæ ?Ä??/button>
            <button className="px-3 py-1.5 border rounded-lg text-xs hover:bg-gray-100 dark:hover:bg-gray-700">???§Ìñâ</button>
          </div>
        </div>

        {/* action list */}
        <div className="flex-1 overflow-y-auto p-4">
          {recording && <div className="mb-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400 flex items-center gap-2"><span className="animate-pulse">?î¥</span> ?πÌôî Ï§?..</div>}
          {mode === 'manual' ? (
            <div className="space-y-2">
              {actions.length === 0 && !recording && (
                <div className="text-center text-gray-400 text-sm py-12">
                  <p className="text-3xl mb-3">?é¨</p>
                  <p>?πÌôîÎ•??úÏûë?òÍ±∞???òÎèô?ºÎ°ú ?°ÏÖò??Ï∂îÍ??òÏÑ∏??/p>
                </div>
              )}
              {actions.map((a) => <ActionItem key={a.id} action={a} onDelete={() => deleteAction(a.id)} />)}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
              <p className="text-3xl mb-3">?§ñ</p>
              <p>Agent Î™®Îìú: AIÍ∞Ä ?úÎÇòÎ¶¨Ïò§Î•??ùÏÑ±?©Îãà??/p>
              <p className="text-xs mt-1">?åÌÅ¨?åÎ°ú?∞Î? ?†ÌÉù?òÏó¨ ?úÏûë?òÏÑ∏??/p>
            </div>
          )}
        </div>

        {/* execution logs */}
        <div className="h-32 border-t bg-gray-50 dark:bg-gray-850 p-3 overflow-y-auto">
          <p className="text-xs font-medium text-gray-500 mb-1">?§Ìñâ Î°úÍ∑∏</p>
          <p className="text-xs text-gray-400">Î°úÍ∑∏Í∞Ä ?ÜÏäµ?àÎã§</p>
        </div>
      </main>
    </div>
  );
};

export const scenarioRecorderModule: FeatureModule = {
  id: 'main-ScenarioRecorder',
  name: '?úÎÇòÎ¶¨Ïò§ ?àÏΩî??,
  sidebarSection: 'workflow',
  sidebarItems: [
    { id: 'scenario-recorder', titleKey: 'sidebar.workflow.scenarioRecorder.title', descriptionKey: 'sidebar.workflow.scenarioRecorder.description' },
  ],
  pageRoutes: { '/scenario-recorder': ScenarioRecorderPage },
};

export default scenarioRecorderModule;