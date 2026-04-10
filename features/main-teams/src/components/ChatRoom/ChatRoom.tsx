'use client';

import React from 'react';
import { useTranslation } from '@xgen/i18n';
import type { TeamsRoom, TeamsMessage, TeamsAgent, TeamsNodeStatus } from '../../types';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import styles from './ChatRoom.module.scss';

interface ChatRoomProps {
  room: TeamsRoom | null;
  messages: TeamsMessage[];
  isExecuting: boolean;
  nodeStatuses: Map<string, TeamsNodeStatus[]>;
  onSendMessage: (content: string, mentionedAgentIds?: string[]) => void;
  onStopExecution: () => void;
  onRetryMessage: (messageId: string) => void;
  onViewLog: (executionId: string) => void;
}

const getRoomColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#6264A7', '#E74856', '#0078D4', '#00B294', '#FF8C00'];
  return colors[Math.abs(hash) % colors.length];
};

export const ChatRoom: React.FC<ChatRoomProps> = ({
  room,
  messages,
  isExecuting,
  nodeStatuses,
  onSendMessage,
  onStopExecution,
  onRetryMessage,
  onViewLog,
}) => {
  const { t } = useTranslation();

  // 방이 선택되지 않은 상태
  if (!room) {
    return (
      <div className={styles.chatRoom}>
        <div className={styles.emptyState}>
          <svg viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="8" y="12" width="40" height="32" rx="6" />
            <path d="M8 22L28 34L48 22" />
          </svg>
          <h4>{t('teams.chat.emptyTitle')}</h4>
          <p>{t('teams.chat.emptyDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatRoom}>
      {/* Header */}
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderLeft}>
          <div
            className={styles.chatHeaderAvatar}
            style={{ background: getRoomColor(room.name) }}
          >
            {room.name.charAt(0).toUpperCase()}
          </div>
          <h3>{room.name}</h3>
        </div>
        <div className={styles.chatTabs}>
          <button className={`${styles.chatTab} ${styles.chatTabActive}`}>
            {t('teams.chat.tabs.chat')}
          </button>
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        nodeStatuses={nodeStatuses}
        onRetry={onRetryMessage}
        onViewLog={onViewLog}
      />

      {/* Input */}
      <ChatInput
        agents={room.agents}
        isExecuting={isExecuting}
        onSend={onSendMessage}
        onStop={onStopExecution}
      />
    </div>
  );
};
