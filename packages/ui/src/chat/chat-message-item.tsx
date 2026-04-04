'use client';

import React from 'react';
import { cn } from '../lib/utils';
import type { ChatMessageItemProps } from './types';
import { UserIcon, BotIcon, FileIcon, AlertIcon } from './chat-icons';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const formatTime = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
};

// ─────────────────────────────────────────────────────────────
// ChatMessageItem
// ─────────────────────────────────────────────────────────────

/**
 * A single chat message bubble.
 *
 * - `full` variant: avatar + bubble + timestamp + attachment chips + error/retry
 * - `compact` variant: bubble only (no avatar, no timestamp), tighter padding
 */
export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  variant,
  onRetry,
  retryLabel = 'Retry',
  errorLabel,
}) => {
  const { sender, content, status, attachments, createdAt, errorMessage } = message;

  // ── System message ──────────────────────────────────────────
  if (sender === 'system') {
    if (variant === 'compact') return null; // compact doesn't show system messages
    return (
      <div className="flex justify-center py-2">
        <div className="px-4 py-1.5 bg-muted text-muted-foreground text-xs rounded-full">
          {content}
        </div>
      </div>
    );
  }

  const isUser = sender === 'user';
  const isCompact = variant === 'compact';

  // ── Compact variant ─────────────────────────────────────────
  if (isCompact) {
    return (
      <div
        className={cn(
          'max-w-[85%] py-2 px-3 rounded-[10px] break-words',
          isUser
            ? 'self-end bg-primary text-white rounded-br-sm'
            : 'self-start bg-[var(--color-gray-100,#f3f4f6)] text-[var(--color-gray-600,#4b5563)] rounded-bl-sm',
        )}
      >
        <pre className="m-0 whitespace-pre-wrap break-words text-xs leading-[18px]">
          {content}
        </pre>
        {status === 'streaming' && (
          <span className="inline-block w-[2px] h-3 ml-0.5 bg-primary animate-pulse align-text-bottom" />
        )}
      </div>
    );
  }

  // ── Full variant ────────────────────────────────────────────
  return (
    <div className={cn('flex gap-3 max-w-[85%]', isUser ? 'self-end flex-row-reverse' : 'self-start')}>
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-full shrink-0 flex items-center justify-center [&_svg]:w-4 [&_svg]:h-4',
          isUser
            ? 'bg-primary text-white'
            : 'bg-gradient-to-br from-blue-400 to-primary text-white',
        )}
      >
        {isUser ? <UserIcon /> : <BotIcon />}
      </div>

      {/* Content column */}
      <div className="flex flex-col gap-1 min-w-0">
        {/* Bubble */}
        <div
          className={cn(
            'px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words',
            isUser
              ? 'bg-primary text-white rounded-2xl rounded-br-md'
              : 'bg-white border border-border text-foreground rounded-2xl rounded-bl-md',
            status === 'error' && 'border-red-300 bg-red-50',
          )}
        >
          {content}
          {status === 'streaming' && (
            <span className="inline-block w-[2px] h-4 ml-0.5 bg-primary animate-pulse align-text-bottom" />
          )}
        </div>

        {/* Attachments */}
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs text-muted-foreground [&_svg]:w-3 [&_svg]:h-3"
              >
                <FileIcon />
                <span className="max-w-[120px] truncate">{att.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Timestamp */}
        {createdAt && (
          <span className={cn('text-[10px] text-muted-foreground/50', isUser && 'text-right')}>
            {formatTime(createdAt)}
          </span>
        )}

        {/* Error + Retry */}
        {status === 'error' && (
          <div className="flex items-center gap-1.5 text-xs text-red-500 [&_svg]:w-3.5 [&_svg]:h-3.5">
            <AlertIcon />
            <span>{errorMessage || errorLabel || 'Failed'}</span>
            {onRetry && (
              <button
                className="ml-1 px-2 py-0.5 bg-transparent border border-red-400 rounded text-red-500 text-xs cursor-pointer hover:bg-red-50 transition-colors"
                onClick={onRetry}
              >
                {retryLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
