'use client';

import React from 'react';
import { cn } from '../lib/utils';
import type { ChatTypingIndicatorProps } from './types';
import { BotIcon } from './chat-icons';

/**
 * Animated typing indicator (3 bouncing dots).
 *
 * - `full`: wrapped with bot avatar, large padding
 * - `compact`: dots only in a small bubble
 */
export const ChatTypingIndicator: React.FC<ChatTypingIndicatorProps> = ({ variant }) => {
  if (variant === 'compact') {
    return (
      <div className="self-start max-w-[85%] py-2 px-3 rounded-[10px] rounded-bl-sm bg-[var(--color-gray-100,#f3f4f6)]">
        <div className="flex gap-1 py-0.5 [&_span]:w-1.5 [&_span]:h-1.5 [&_span]:rounded-full [&_span]:bg-gray-400 [&_span]:animate-bounce">
          <span className="[animation-delay:0s]" />
          <span className="[animation-delay:0.2s]" />
          <span className="[animation-delay:0.4s]" />
        </div>
      </div>
    );
  }

  // full variant
  return (
    <div className="flex gap-3 max-w-[85%] self-start">
      <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-gradient-to-br from-blue-400 to-primary text-white [&_svg]:w-4 [&_svg]:h-4">
        <BotIcon />
      </div>
      <div className="flex items-center gap-1.5 px-4 py-3 bg-white border border-border rounded-2xl rounded-bl-md">
        <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0s]" />
        <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.2s]" />
        <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.4s]" />
      </div>
    </div>
  );
};
