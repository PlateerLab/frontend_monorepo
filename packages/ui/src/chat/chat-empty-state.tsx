'use client';

import React from 'react';
import { cn } from '../lib/utils';
import type { ChatEmptyStateProps } from './types';
import { ChatBubbleIcon } from './chat-icons';

/**
 * Empty state shown when there are no user messages yet.
 *
 * - `full`: large centered layout with icon, title, description, suggestion buttons
 * - `compact`: simple centered placeholder text
 */
export const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({
  icon,
  title,
  description,
  suggestions,
  onSuggestionClick,
  variant,
}) => {
  if (variant === 'compact') {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <span className="text-xs text-muted-foreground/50">
          {description || title || 'Send a message to start chatting'}
        </span>
      </div>
    );
  }

  // full variant
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
      <div className="text-muted-foreground/30 [&_svg]:w-12 [&_svg]:h-12">
        {icon || <ChatBubbleIcon />}
      </div>
      {title && (
        <div className="flex flex-col gap-1">
          <h3 className="m-0 text-xl font-bold text-muted-foreground/60">{title}</h3>
          {description && (
            <p className="m-0 text-sm text-muted-foreground/50 italic">{description}</p>
          )}
        </div>
      )}
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 justify-center">
          {suggestions.map((s) => (
            <button
              key={s.key}
              className="px-4 py-2 text-sm font-medium text-primary bg-white border border-primary/30 rounded-full cursor-pointer transition-all hover:bg-primary hover:text-white hover:border-primary hover:shadow-sm"
              onClick={() => onSuggestionClick?.(s.label)}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
