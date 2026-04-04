'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '../lib/utils';
import type { ChatPanelProps } from './types';
import { ChatMessageList } from './chat-message-list';
import { ChatInput } from './chat-input';
import { ChatEmptyState } from './chat-empty-state';

/**
 * ChatPanel — the shared, reusable chat interface component.
 *
 * A flex-column container that renders:
 * 1. Empty state OR scrollable message list (flex-1)
 * 2. Input area (shrink-0)
 *
 * The caller controls layout (h-screen for full-page, flex-1 for embedded panel).
 * ChatPanel itself uses `flex flex-col overflow-hidden` and fills its parent.
 *
 * ## Variants
 * - `full`: Avatars, timestamps, rounded bubbles, attachment support, large padding
 * - `compact`: No avatars, no timestamps, tight padding, simple bubbles
 *
 * ## Usage
 * ```tsx
 * // Full-page chat
 * <div className="h-screen">
 *   <header>...</header>
 *   <ChatPanel variant="full" messages={msgs} onSend={send} ... />
 * </div>
 *
 * // Embedded in canvas bottom panel tab
 * <ChatPanel variant="compact" messages={msgs} onSend={send} />
 * ```
 */
export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSend,
  onStop,
  isExecuting = false,
  isStreaming = false,
  variant = 'full',
  placeholder,
  emptyState,
  showAttachments = false,
  onAttach,
  attachments,
  onRemoveAttachment,
  onRetry,
  className,
  sendLabel,
  stopLabel,
  retryLabel,
  errorLabel,
}) => {
  const [inputValue, setInputValue] = useState('');

  // Determine if there are user/assistant messages (exclude system)
  const hasUserMessages = useMemo(
    () => messages.some((m) => m.sender !== 'system'),
    [messages],
  );

  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text || isExecuting) return;
    setInputValue('');
    onSend(text);
  }, [inputValue, isExecuting, onSend]);

  const handleAttachFiles = useCallback(
    (files: File[]) => {
      onAttach?.(files);
    },
    [onAttach],
  );

  return (
    <div className={cn('flex flex-col flex-1 overflow-hidden', className)}>
      {/* Messages or Empty State */}
      {!hasUserMessages && emptyState ? (
        emptyState
      ) : (
        <ChatMessageList
          messages={messages}
          variant={variant}
          isExecuting={isExecuting}
          isStreaming={isStreaming}
          onRetry={onRetry}
          retryLabel={retryLabel}
          errorLabel={errorLabel}
        />
      )}

      {/* Input */}
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        onStop={onStop}
        isExecuting={isExecuting}
        variant={variant}
        placeholder={placeholder}
        showAttachments={showAttachments}
        onAttach={handleAttachFiles}
        attachments={attachments}
        onRemoveAttachment={onRemoveAttachment}
        sendLabel={sendLabel}
        stopLabel={stopLabel}
      />
    </div>
  );
};
