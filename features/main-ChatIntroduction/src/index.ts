'use client';
import React from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

/* ?Ä?Ä ChatIntroduction ?Ä?Ä */
const ChatIntroduction: React.FC<RouteComponentProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <h1 className="text-2xl font-bold mb-4">XGEN Chat</h1>
      <p className="text-gray-500 mb-6">AI Ï±ÑÌåÖ???úÏûë?òÏÑ∏??/p>
      <div className="flex gap-4">
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => onNavigate?.('new-chat')}
        >
          ??Ï±ÑÌåÖ ?úÏûë
        </button>
        <button
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          onClick={() => onNavigate?.('chat-history')}
        >
          Ï±ÑÌåÖ Í∏∞Î°ù
        </button>
      </div>
    </div>
  );
};

/* ?Ä?Ä Feature Module Export ?Ä?Ä */
export const chatIntroFeature: FeatureModule = {
  id: 'main-ChatIntroduction',
  name: 'Chat Introduction',
  sidebarSection: 'chat',
  sidebarItems: [
    { id: 'chat-intro', titleKey: 'chat.intro.title', descriptionKey: 'chat.intro.description' },
  ],
  routes: {
    'chat-intro': ChatIntroduction,
  },
  introItems: ['chat-intro'],
};

export { ChatIntroduction };
export default chatIntroFeature;