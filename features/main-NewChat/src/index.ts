'use client';
import React, { useState, useRef, useCallback } from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

/* ?€?€ ChatInput ?€?€ */
export const ChatInput: React.FC<{
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}> = ({ onSend, disabled, placeholder = 'ë©”ì‹œì§€ë¥??…ë ¥?˜ì„¸??..' }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput('');
  }, [input, disabled, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  return (
    <div className="flex items-end gap-2 p-4 border-t border-gray-200">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        ?„ì†¡
      </button>
    </div>
  );
};

/* ?€?€ ChatArea ?€?€ */
export const ChatArea: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col h-full overflow-hidden">{children}</div>
);

/* ?€?€ ChatHeader ?€?€ */
export const ChatHeader: React.FC<{
  title?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
}> = ({ title = '??ì±„íŒ…', onBack, actions }) => (
  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
    <div className="flex items-center gap-2">
      {onBack && <button onClick={onBack} className="text-gray-500 hover:text-gray-700">??/button>}
      <h2 className="font-semibold text-lg">{title}</h2>
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

/* ?€?€ MessageList ?€?€ */
export const MessageList: React.FC<{
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}> = ({ messages }) => (
  <div className="flex-1 overflow-y-auto p-4 space-y-4">
    {messages.map((msg, i) => (
      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
          {msg.content}
        </div>
      </div>
    ))}
  </div>
);

/* ?€?€ SuggestionChips ?€?€ */
export const SuggestionChips: React.FC<{
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}> = ({ suggestions, onSelect }) => (
  <div className="flex flex-wrap gap-2 px-4 py-2">
    {suggestions.map((s, i) => (
      <button key={i} onClick={() => onSelect(s)} className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-100 transition-colors">
        {s}
      </button>
    ))}
  </div>
);

/* ?€?€ NewChatInterface (Main Component) ?€?€ */
const NewChatInterface: React.FC<RouteComponentProps> = ({ onChatStarted }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  const handleSend = useCallback((content: string) => {
    setMessages(prev => [...prev, { role: 'user', content }]);
    onChatStarted?.();
    // TODO: Integrate with LLM API via @xgen/api-client
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: '?‘ë‹µ??ì²˜ë¦¬ì¤‘ìž…?ˆë‹¤...' }]);
    }, 500);
  }, [onChatStarted]);

  return (
    <ChatArea>
      <ChatHeader title="??ì±„íŒ…" />
      <MessageList messages={messages} />
      <SuggestionChips suggestions={['?Œí¬?Œë¡œ???ì„±', 'ë¬¸ì„œ ?”ì•½', '?°ì´??ë¶„ì„']} onSelect={handleSend} />
      <ChatInput onSend={handleSend} />
    </ChatArea>
  );
};

/* ?€?€ Feature Module Export ?€?€ */
export const newChatFeature: FeatureModule = {
  id: 'main-NewChat',
  name: 'New Chat',
  sidebarSection: 'chat',
  sidebarItems: [
    { id: 'new-chat', titleKey: 'chat.newChat.title', descriptionKey: 'chat.newChat.description' },
  ],
  routes: {
    'new-chat': NewChatInterface,
  },
  alwaysVisibleItems: ['new-chat'],
};

export { NewChatInterface };
export default newChatFeature;