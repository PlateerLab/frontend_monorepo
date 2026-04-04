'use client';

import React, { useRef, useEffect } from 'react';
import { cn } from '../lib/utils';
import type { ChatMessageListProps } from './types';
import { ChatMessageItem } from './chat-message-item';
import { ChatTypingIndicator } from './chat-typing-indicator';

/**
 * Scrollable message list with auto-scroll.
 *
 * Renders all messages + optional typing indicator.
 * Takes `flex-1 min-h-0` to fill available space in a flex-col parent.
 */
export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  variant,
  isExecuting,
  isStreaming,
  onRetry,
  retryLabel,
  errorLabel,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages or execution state changes
  useEffect(() => {
    if (variant === 'compact' && scrollRef.current) {
      // For compact, direct scroll (instant)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    } else {
      // For full, smooth scroll via sentinel
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExecuting, variant]);

  const isCompact = variant === 'compact';

  return (
    <div
      ref={scrollRef}
      className={cn(
        'flex-1 overflow-y-auto min-h-0 flex flex-col',
        isCompact
          ? 'py-3 px-4 gap-2 text-xs'
          : 'px-6 py-5 gap-4',
      )}
    >
      {messages.map((message) => (
        <ChatMessageItem
          key={message.id}
          message={message}
          variant={variant}
          onRetry={
            message.status === 'error' && onRetry
              ? () => onRetry(message.id)
              : undefined
          }
          retryLabel={retryLabel}
          errorLabel={errorLabel}
        />
      ))}
      {isExecuting && !isStreaming && <ChatTypingIndicator variant={variant} />}
      <div ref={bottomRef} />
    </div>
  );
};
