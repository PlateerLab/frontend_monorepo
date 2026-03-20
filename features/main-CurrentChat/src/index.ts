'use client';
import React, { useState, useCallback } from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

/* ?Ä?Ä ChatAgentDisplay ?Ä?Ä */
export const ChatAgentDisplay: React.FC<{
  agentName?: string;
  toolCalls?: Array<{ name: string; status: 'running' | 'done' | 'error' }>;
}> = ({ agentName, toolCalls = [] }) => (
  <div className="px-4 py-2 bg-purple-50 border-b border-purple-100">
    {agentName && <span className="text-sm text-purple-700 font-medium">?§ñ {agentName}</span>}
    {toolCalls.length > 0 && (
      <div className="flex gap-2 mt-1">
        {toolCalls.map((t, i) => (
          <span key={i} className={`text-xs px-2 py-0.5 rounded ${t.status === 'running' ? 'bg-yellow-100 text-yellow-800' : t.status === 'done' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {t.name}
          </span>
        ))}
      </div>
    )}
  </div>
);

/* ?Ä?Ä CollectionDisplay ?Ä?Ä */
export const CollectionDisplay: React.FC<{
  collections: Array<{ id: string; name: string }>;
  selectedId?: string;
  onSelect: (id: string) => void;
}> = ({ collections, selectedId, onSelect }) => (
  <div className="flex gap-2 px-4 py-2 overflow-x-auto border-b border-gray-100">
    {collections.map(c => (
      <button key={c.id} onClick={() => onSelect(c.id)} className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${selectedId === c.id ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
        {c.name}
      </button>
    ))}
  </div>
);

/* ?Ä?Ä FileDisplay ?Ä?Ä */
export const FileDisplay: React.FC<{
  files: Array<{ name: string; size: number; type: string }>;
  onRemove?: (index: number) => void;
}> = ({ files, onRemove }) => (
  <div className="flex flex-wrap gap-2 px-4 py-2">
    {files.map((f, i) => (
      <div key={i} className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg text-sm">
        <span>{f.name}</span>
        {onRemove && <button onClick={() => onRemove(i)} className="text-gray-400 hover:text-red-500">√ó</button>}
      </div>
    ))}
  </div>
);

/* ?Ä?Ä ExecutionStatusBar ?Ä?Ä */
export const ExecutionStatusBar: React.FC<{
  status: 'idle' | 'running' | 'completed' | 'error';
  workflowName?: string;
}> = ({ status, workflowName }) => {
  const colors = { idle: 'bg-gray-100 text-gray-600', running: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', error: 'bg-red-100 text-red-700' };
  return (
    <div className={`px-4 py-2 text-sm ${colors[status]}`}>
      {workflowName && <span className="font-medium">{workflowName}: </span>}
      <span>{status === 'running' ? '?§Ìñâ Ï§?..' : status === 'completed' ? '?ÑÎ£å' : status === 'error' ? '?§Î•ò' : '?ÄÍ∏?}</span>
    </div>
  );
};

/* ?Ä?Ä CurrentChatInterface (Main Component) ?Ä?Ä */
const CurrentChatInterface: React.FC<RouteComponentProps> = () => {
  const [messages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-4 py-3 border-b border-gray-200">
        <h2 className="font-semibold">?ÑÏû¨ Ï±ÑÌåÖ</h2>
      </div>
      <ChatAgentDisplay agentName="XGEN Agent" toolCalls={[]} />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">ÏßÑÌñâ Ï§ëÏù∏ Ï±ÑÌåÖ???ÜÏäµ?àÎã§</div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>{msg.content}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/* ?Ä?Ä Feature Module Export ?Ä?Ä */
export const currentChatFeature: FeatureModule = {
  id: 'main-CurrentChat',
  name: 'Current Chat',
  sidebarSection: 'chat',
  sidebarItems: [
    { id: 'current-chat', titleKey: 'chat.currentChat.title', descriptionKey: 'chat.currentChat.description' },
  ],
  routes: {
    'current-chat': CurrentChatInterface,
  },
};

export { CurrentChatInterface };
export default currentChatFeature;