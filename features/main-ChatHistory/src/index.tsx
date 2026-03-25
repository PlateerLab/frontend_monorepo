'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea, FilterTabs, SearchInput, EmptyState } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { createApiClient } from '@xgen/api-client';

import styles from './styles/chat-history.module.scss';
import type { ChatHistoryItem, ChatHistoryFilter } from './types';

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const MessageIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.5 12.5C17.5 12.942 17.3244 13.366 17.0118 13.6785C16.6993 13.9911 16.2754 14.1667 15.8333 14.1667H5.83333L2.5 17.5V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H15.8333C16.2754 2.5 16.6993 2.67559 17.0118 2.98816C17.3244 3.30072 17.5 3.72464 17.5 4.16667V12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.5 3V7.5H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.5 15V10.5H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.715 6.75C14.3103 5.63253 13.5887 4.65931 12.6402 3.94617C11.6917 3.23303 10.5585 2.8105 9.37556 2.73116C8.19263 2.65182 7.01263 2.91935 5.97644 3.50029C4.94024 4.08124 4.09331 4.94988 3.538 6M3.285 11.25C3.68973 12.3675 4.41128 13.3407 5.35979 14.0538C6.3083 14.767 7.44153 15.1895 8.62447 15.2688C9.8074 15.3482 10.9874 15.0807 12.0236 14.4997C13.0598 13.9188 13.9067 13.0501 14.462 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PlayIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 3L13 8L4 13V3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrashIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 4H14M12.6667 4V13.3333C12.6667 14 12 14.6667 11.3333 14.6667H4.66667C4 14.6667 3.33333 14 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2 6 1.33333 6.66667 1.33333H9.33333C10 1.33333 10.6667 2 10.6667 2.66667V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const HistoryIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 4.66667V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.66667 8C2.66667 5.05448 5.05448 2.66667 8 2.66667C10.9455 2.66667 13.3333 5.05448 13.3333 8C13.3333 10.9455 10.9455 13.3333 8 13.3333C5.05448 13.3333 2.66667 10.9455 2.66667 8Z" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

const MOCK_CHATS: ChatHistoryItem[] = [
  {
    id: '1',
    interactionId: 'int-001',
    workflowId: 'wf-001',
    workflowName: '이커머스 법률 상담',
    interactionCount: 15,
    createdAt: '2025-01-28T10:30:00Z',
    updatedAt: '2025-01-28T14:25:00Z',
    isWorkflowDeleted: false,
  },
  {
    id: '2',
    interactionId: 'int-002',
    workflowId: 'wf-002',
    workflowName: '고객지원 자동응답',
    interactionCount: 8,
    createdAt: '2025-01-27T09:00:00Z',
    updatedAt: '2025-01-27T11:30:00Z',
    isWorkflowDeleted: false,
  },
  {
    id: '3',
    interactionId: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
    workflowId: 'wf-003',
    workflowName: 'HR 문서 검색',
    interactionCount: 3,
    createdAt: '2025-01-26T15:00:00Z',
    updatedAt: '2025-01-26T15:45:00Z',
    isWorkflowDeleted: false,
  },
  {
    id: '4',
    interactionId: 'int-004',
    workflowId: 'wf-deleted',
    workflowName: '삭제된 워크플로우',
    interactionCount: 5,
    createdAt: '2025-01-25T08:00:00Z',
    updatedAt: '2025-01-25T09:00:00Z',
    isWorkflowDeleted: true,
  },
];

// ─────────────────────────────────────────────────────────────
// Chat History Page
// ─────────────────────────────────────────────────────────────

interface ChatHistoryPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
  onSelectChat?: (chat: ChatHistoryItem) => void;
}

const ChatHistoryPage: React.FC<ChatHistoryPageProps> = ({ onNavigate, onSelectChat }) => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatHistoryItem[]>([]);
  const [filter, setFilter] = useState<ChatHistoryFilter>('active');
  const [search, setSearch] = useState('');

  // SHA1 해시 패턴 체크 (deploy 채팅 확인)
  const isDeployChat = (interactionId: string): boolean => {
    const sha1Pattern = /^[a-f0-9]{40}$/i;
    return sha1Pattern.test(interactionId);
  };

  const loadChats = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: API 연동
      // const api = createApiClient();
      // const response = await api.get<ChatHistoryItem[]>('/api/chat/history');
      // setChats(response.data);

      await new Promise(resolve => setTimeout(resolve, 500));
      setChats(MOCK_CHATS);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // 필터링된 채팅 목록
  const filteredChats = chats.filter(chat => {
    // 검색 필터
    if (search && !chat.workflowName.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    // 상태 필터
    const isDeploy = isDeployChat(chat.interactionId);
    switch (filter) {
      case 'active':
        return !chat.isWorkflowDeleted && !isDeploy;
      case 'deleted':
        return chat.isWorkflowDeleted;
      case 'deploy':
        return isDeploy;
      case 'all':
      default:
        return true;
    }
  });

  // 필터 탭 설정
  const filterTabs = [
    { key: 'active', label: t('chatHistory.filter.active'), count: chats.filter(c => !c.isWorkflowDeleted && !isDeployChat(c.interactionId)).length },
    { key: 'deploy', label: t('chatHistory.filter.deploy'), count: chats.filter(c => isDeployChat(c.interactionId)).length },
    { key: 'deleted', label: t('chatHistory.filter.deleted'), count: chats.filter(c => c.isWorkflowDeleted).length },
    { key: 'all', label: t('chatHistory.filter.all'), count: chats.length },
  ];

  const handleChatClick = (chat: ChatHistoryItem) => {
    onSelectChat?.(chat);
    onNavigate?.('current-chat');
  };

  const handleContinueChat = (chat: ChatHistoryItem) => {
    onSelectChat?.(chat);
    onNavigate?.('current-chat');
  };

  const handleDeleteChat = async (chat: ChatHistoryItem) => {
    // TODO: API 연동
    console.log('Delete chat:', chat.id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ContentArea
      title={t('chatHistory.title')}
      headerActions={
        <button
          onClick={loadChats}
          className={`${styles.refreshButton} ${loading ? styles.loading : ''}`}
          disabled={loading}
        >
          <RefreshIcon />
        </button>
      }
    >
      <div className={styles.container}>
        {/* Filters */}
        <div className={styles.header}>
          <FilterTabs
            tabs={filterTabs}
            activeKey={filter}
            onChange={(key) => setFilter(key as ChatHistoryFilter)}
            variant="pills"
          />
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('chatHistory.searchPlaceholder')}
            size="sm"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        ) : filteredChats.length === 0 ? (
          <EmptyState
            icon={<MessageIcon />}
            title={t('chatHistory.empty.title')}
            description={t('chatHistory.empty.description')}
            action={{
              label: t('chatHistory.empty.action'),
              onClick: () => onNavigate?.('new-chat'),
            }}
          />
        ) : (
          <div className={styles.chatList}>
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={`${styles.chatItem} ${chat.isWorkflowDeleted ? styles.deleted : ''}`}
                onClick={() => handleChatClick(chat)}
              >
                <div className={styles.chatIcon}>
                  <MessageIcon />
                </div>
                <div className={styles.chatContent}>
                  <h4 className={styles.chatTitle}>{chat.workflowName}</h4>
                  <div className={styles.chatMeta}>
                    <span>{t('chatHistory.interactions', { count: chat.interactionCount })}</span>
                    <span>•</span>
                    <span>{formatDate(chat.updatedAt)}</span>
                    {chat.isWorkflowDeleted && (
                      <span className={`${styles.badge} ${styles.deleted}`}>
                        {t('chatHistory.deleted')}
                      </span>
                    )}
                    {isDeployChat(chat.interactionId) && (
                      <span className={`${styles.badge} ${styles.deploy}`}>
                        {t('chatHistory.deploy')}
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.chatActions}>
                  <button
                    className={styles.actionButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContinueChat(chat);
                    }}
                    title={t('chatHistory.continue')}
                  >
                    <PlayIcon />
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.danger}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChat(chat);
                    }}
                    title={t('chatHistory.delete')}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const mainChatHistoryFeature: MainFeatureModule = {
  id: 'main-ChatHistory',
  name: 'Chat History',
  sidebarSection: 'chat',
  sidebarItems: [
    {
      id: 'chat-history',
      titleKey: 'sidebar.chat.history.title',
      descriptionKey: 'sidebar.chat.history.description',
    },
  ],
  routes: {
    'chat-history': ChatHistoryPage,
  },
  requiresAuth: true,
};

export default mainChatHistoryFeature;

export type { ChatHistoryItem, ChatHistoryFilter } from './types';
