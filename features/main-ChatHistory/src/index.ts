'use client';
import React, { useState, useCallback } from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

/* ?Ä?Ä ChatHistoryItem ?Ä?Ä */
export const ChatHistoryItem: React.FC<{
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
}> = ({ id, title, lastMessage, timestamp, onSelect, onDelete }) => (
  <div onClick={() => onSelect(id)} className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
    <div className="flex-1 min-w-0">
      <h3 className="font-medium text-sm truncate">{title}</h3>
      <p className="text-xs text-gray-500 truncate mt-1">{lastMessage}</p>
    </div>
    <div className="flex items-center gap-2 ml-4">
      <span className="text-xs text-gray-400 whitespace-nowrap">{timestamp}</span>
      {onDelete && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(id); }} className="text-gray-400 hover:text-red-500 text-sm">√ó</button>
      )}
    </div>
  </div>
);

/* ?Ä?Ä HistoryModal ?Ä?Ä */
export const HistoryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
}> = ({ isOpen, onClose, chatId }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-xl w-[600px] max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Ï±ÑÌåÖ ?ÅÏÑ∏</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">√ó</button>
        </div>
        <div className="p-4 overflow-y-auto">
          <p className="text-gray-500">Chat ID: {chatId}</p>
        </div>
      </div>
    </div>
  );
};

/* ?Ä?Ä ChatHistory (Main Component) ?Ä?Ä */
const ChatHistory: React.FC<RouteComponentProps> = () => {
  const [search, setSearch] = useState('');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  const handleSelect = useCallback((id: string) => setSelectedChat(id), []);
  const handleClose = useCallback(() => setSelectedChat(null), []);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="font-semibold text-lg mb-2">Ï±ÑÌåÖ Í∏∞Î°ù</h2>
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Ï±ÑÌåÖ Í≤Ä??.."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="text-center text-gray-400 py-12">Ï±ÑÌåÖ Í∏∞Î°ù???ÜÏäµ?àÎã§</div>
      </div>
      <HistoryModal isOpen={!!selectedChat} onClose={handleClose} chatId={selectedChat || ''} />
    </div>
  );
};

/* ?Ä?Ä Feature Module Export ?Ä?Ä */
export const chatHistoryFeature: FeatureModule = {
  id: 'main-ChatHistory',
  name: 'Chat History',
  sidebarSection: 'chat',
  sidebarItems: [
    { id: 'chat-history', titleKey: 'chat.history.title', descriptionKey: 'chat.history.description' },
  ],
  routes: {
    'chat-history': ChatHistory,
  },
};

export { ChatHistory };
export default chatHistoryFeature;