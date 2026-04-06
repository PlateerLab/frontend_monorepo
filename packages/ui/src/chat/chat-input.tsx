'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '../lib/utils';
import type { ChatInputProps } from './types';
import { SendIcon, PaperclipIcon, StopIcon, CloseSmallIcon, FileIcon } from './chat-icons';

/**
 * Chat input area: auto-resize textarea + attachment preview + action buttons.
 *
 * - `full`: rounded-xl container, larger padding, paperclip + send/stop buttons
 * - `compact`: tight border-t bar, small textarea, send button only
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onStop,
  isExecuting,
  variant,
  placeholder = 'Type a message...',
  showAttachments,
  onAttach,
  attachments,
  onRemoveAttachment,
  sendLabel,
  stopLabel,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isComposing, setIsComposing] = useState(false);

  const isCompact = variant === 'compact';

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxH = isCompact ? 60 : 200;
    el.style.height = `${Math.min(el.scrollHeight, maxH)}px`;
  }, [value, isCompact]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
        e.preventDefault();
        if (value.trim() && !isExecuting) onSend();
      }
    },
    [value, isExecuting, isComposing, onSend],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // noop — this is just the trigger; parent handles via onAttach
      e.target.value = '';
    },
    [],
  );

  // ── Compact variant ─────────────────────────────────────────
  if (isCompact) {
    return (
      <div className="flex items-end gap-1.5 py-2 px-3 border-t border-[var(--color-line-50,#e5e7eb)] bg-[var(--color-bg-50,#fafafa)] shrink-0">
        <textarea
          ref={textareaRef}
          className="flex-1 py-1.5 px-2.5 border border-[var(--color-line-50,#e5e7eb)] rounded-lg text-xs leading-[18px] text-[var(--color-gray-600,#4b5563)] bg-white resize-none min-h-[30px] max-h-[60px] overflow-hidden outline-none transition-[border-color] duration-150 focus:border-primary focus:shadow-[0_0_0_2px_rgba(37,99,235,0.1)] placeholder:text-[var(--color-gray-400,#9ca3af)] disabled:opacity-50"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder={placeholder}
          disabled={isExecuting}
          rows={1}
        />
        {isExecuting && onStop ? (
          <button
            className="flex items-center justify-center w-[30px] h-[30px] border-none rounded-lg bg-red-500 text-white cursor-pointer shrink-0 transition-[background] duration-150 hover:bg-red-600 [&_svg]:w-3.5 [&_svg]:h-3.5"
            onClick={onStop}
            title={stopLabel || 'Stop'}
            type="button"
          >
            <StopIcon />
          </button>
        ) : (
          <button
            className="flex items-center justify-center w-[30px] h-[30px] border-none rounded-lg bg-primary text-white cursor-pointer shrink-0 transition-[background] duration-150 hover:enabled:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed [&_svg]:w-3.5 [&_svg]:h-3.5"
            onClick={onSend}
            disabled={isExecuting || !value.trim()}
            title={sendLabel || 'Send'}
            type="button"
          >
            <SendIcon />
          </button>
        )}
      </div>
    );
  }

  // ── Full variant ────────────────────────────────────────────
  return (
    <div className="shrink-0 px-6 py-4 bg-white border-t border-[var(--color-line-50)]">
      {/* Pending attachments */}
      {attachments && attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pb-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-muted border border-border rounded text-xs text-muted-foreground [&_svg]:w-3.5 [&_svg]:h-3.5"
            >
              <FileIcon />
              <span className="max-w-[140px] truncate">{file.name}</span>
              {onRemoveAttachment && (
                <button
                  className="flex items-center justify-center w-4 h-4 p-0 bg-transparent border-none rounded-full cursor-pointer text-muted-foreground/60 transition-colors hover:text-red-500 [&_svg]:w-3 [&_svg]:h-3"
                  onClick={() => onRemoveAttachment(index)}
                >
                  <CloseSmallIcon />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div
        className={cn(
          'flex items-end gap-3 bg-muted/50 border border-[var(--color-line-50)] rounded-xl px-3 py-2 transition-colors focus-within:border-primary focus-within:bg-white',
          isExecuting && 'opacity-50',
        )}
      >
        <textarea
          ref={textareaRef}
          className="flex-1 min-h-[24px] max-h-[150px] py-1 border-none bg-transparent text-sm leading-relaxed text-foreground resize-none overflow-y-auto placeholder:text-muted-foreground/50 focus:outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder={placeholder}
          disabled={isExecuting}
          rows={1}
        />
        <div className="flex items-center gap-1.5 shrink-0">
          {showAttachments && (
            <button
              className="flex items-center justify-center w-8 h-8 p-0 bg-transparent border-none rounded-lg cursor-pointer text-muted-foreground/50 transition-colors hover:text-primary [&_svg]:w-5 [&_svg]:h-5"
              onClick={() => fileInputRef.current?.click()}
              disabled={isExecuting}
              title="Attach"
              type="button"
            >
              <PaperclipIcon />
            </button>
          )}
          {isExecuting && onStop ? (
            <button
              className="flex items-center justify-center w-9 h-9 p-0 bg-red-500 border-none rounded-lg cursor-pointer text-white transition-all hover:bg-red-600 [&_svg]:w-4.5 [&_svg]:h-4.5"
              onClick={onStop}
              title={stopLabel || 'Stop'}
              type="button"
            >
              <StopIcon />
            </button>
          ) : (
            <button
              className="flex items-center justify-center w-9 h-9 p-0 bg-primary border-none rounded-lg cursor-pointer text-white transition-all hover:bg-primary/90 disabled:bg-muted-foreground/20 disabled:cursor-not-allowed [&_svg]:w-5 [&_svg]:h-5"
              onClick={onSend}
              disabled={!value.trim()}
              title={sendLabel || 'Send'}
              type="button"
            >
              <SendIcon />
            </button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      {showAttachments && (
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0 && onAttach) {
              onAttach(files);
            }
            e.target.value = '';
          }}
          style={{ display: 'none' }}
        />
      )}
    </div>
  );
};
