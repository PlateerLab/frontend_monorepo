'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '@xgen/i18n';
import type { TeamsMessage, TeamsNodeStatus } from '../../types';
import styles from './ChatRoom.module.scss';

interface MessageListProps {
  messages: TeamsMessage[];
  nodeStatuses: Map<string, TeamsNodeStatus[]>;
  onRetry?: (messageId: string) => void;
  onViewLog?: (executionId: string) => void;
}

const formatTime = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  nodeStatuses,
  onRetry,
  onViewLog,
}) => {
  const { t } = useTranslation();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  if (messages.length === 0) {
    return (
      <div className={styles.emptyState}>
        <svg viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="8" y="12" width="40" height="32" rx="6" />
          <path d="M8 22L28 34L48 22" />
        </svg>
        <h4>{t('teams.chat.emptyTitle')}</h4>
        <p>{t('teams.chat.emptyDesc')}</p>
      </div>
    );
  }

  return (
    <div className={styles.messageArea} ref={containerRef}>
      {messages.map((msg) => {
        const isUser = msg.type === 'user';
        const isSystem = msg.type === 'system';
        const isStreaming = msg.status === 'streaming';
        const isError = msg.status === 'error';
        const nodes = nodeStatuses.get(msg.id);

        const groupClass = isUser
          ? styles.messageGroupUser
          : isSystem
          ? styles.messageGroupSystem
          : styles.messageGroupAgent;

        const bubbleClass = [
          styles.messageBubble,
          isUser ? styles.messageBubbleUser : isSystem ? styles.messageBubbleSystem : styles.messageBubbleAgent,
          isError ? styles.messageBubbleError : '',
          isStreaming ? styles.messageBubbleStreaming : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <div key={msg.id} className={`${styles.messageGroup} ${groupClass}`}>
            {/* Avatar (agent/user only) */}
            {!isSystem && (
              <div
                className={styles.messageAvatar}
                style={{ background: msg.sender.color || (isUser ? '#305eeb' : '#6264A7') }}
              >
                {msg.sender.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className={styles.messageContent}>
              {/* Sender name (agent only) */}
              {!isUser && !isSystem && (
                <span className={styles.messageSender}>{msg.sender.name}</span>
              )}

              {/* Bubble */}
              <div className={bubbleClass}>
                {msg.content || (isStreaming ? '' : '...')}
              </div>

              {/* Node statuses */}
              {nodes && nodes.length > 0 && (
                <div className={styles.nodeStatuses}>
                  {nodes.map((n) => (
                    <span
                      key={n.nodeId}
                      className={`${styles.nodeStatus} ${
                        n.status === 'running'
                          ? styles.nodeStatusRunning
                          : n.status === 'completed'
                          ? styles.nodeStatusCompleted
                          : styles.nodeStatusError
                      }`}
                    >
                      <span className={styles.nodeStatusDot} />
                      {n.nodeName}
                    </span>
                  ))}
                </div>
              )}

              {/* Time */}
              {!isSystem && (
                <span className={styles.messageTime}>{formatTime(msg.createdAt)}</span>
              )}

              {/* Actions */}
              {(isError || msg.metadata?.executionId) && (
                <div className={styles.messageActions}>
                  {isError && isUser && onRetry && (
                    <button
                      className={styles.messageActionBtn}
                      onClick={() => onRetry(msg.id)}
                    >
                      {t('teams.chat.retry')}
                    </button>
                  )}
                  {msg.metadata?.executionId && onViewLog && (
                    <button
                      className={styles.messageActionBtn}
                      onClick={() => onViewLog(msg.metadata!.executionId!)}
                    >
                      {t('teams.chat.viewLog')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};
