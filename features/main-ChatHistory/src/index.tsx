'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { RouteComponentProps, MainFeatureModule, ChatHistoryItem, ChatHistoryFilter } from '@xgen/types';
import { ContentArea, FilterTabs, SearchInput, EmptyState } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import './locales';
import { listInteractions, listWorkflowsDetail, deleteWorkflowIOLogs } from '@xgen/api-client';
import type { WorkflowListItem } from '@xgen/api-client';

import type { ChatHistoryPageProps, ExecutionMeta } from './types';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY_CURRENT_CHAT = 'xgen_current_chat';
const SHA1_PATTERN = /^[a-f0-9]{40}$/i;

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

// ─────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────

/** Deploy 채팅 여부 확인 (SHA1 해시 패턴) */
const isDeployChat = (interactionId: string): boolean => {
  return SHA1_PATTERN.test(interactionId);
};

/** 현재 채팅 데이터 저장 */
const saveCurrentChatData = (data: {
  workflowId: string;
  workflowName: string;
  interactionId: string;
  userId?: number;
  startedAt?: string;
}): boolean => {
  try {
    const chatData = {
      workflowId: data.workflowId,
      workflowName: data.workflowName,
      interactionId: data.interactionId,
      userId: data.userId,
      startedAt: data.startedAt || new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY_CURRENT_CHAT, JSON.stringify(chatData));
    return true;
  } catch (error) {
    console.error('Failed to save current chat data:', error);
    return false;
  }
};

// ─────────────────────────────────────────────────────────────
// Chat History Page Component
// ─────────────────────────────────────────────────────────────

const ChatHistoryPage: React.FC<RouteComponentProps & ChatHistoryPageProps> = ({
  onNavigate,
  onSelectChat,
}) => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatHistoryItem[]>([]);
  const [filter, setFilter] = useState<ChatHistoryFilter>('active');
  const [search, setSearch] = useState('');

  // ─────────────────────────────────────────────────────────────
  // API 호출
  // ─────────────────────────────────────────────────────────────

  const loadChatHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 채팅 기록과 워크플로우 목록을 병렬로 가져오기
      const [chatList, workflows] = await Promise.all([
        listInteractions({ limit: 1000 }),
        listWorkflowsDetail(),
      ]);

      // 각 채팅 기록에 대해 해당 워크플로우가 존재하는지 확인
      const enrichedChatList: ChatHistoryItem[] = chatList.map((chat: ExecutionMeta) => {
        // default_mode인 경우는 항상 사용 가능
        if (chat.workflow_name === 'default_mode') {
          return {
            id: chat.id,
            interactionId: chat.interaction_id,
            workflowId: chat.workflow_id,
            workflowName: chat.workflow_name,
            interactionCount: chat.interaction_count,
            metadata: chat.metadata,
            createdAt: chat.created_at,
            updatedAt: chat.updated_at,
            isWorkflowDeleted: false,
            userId: undefined,
          };
        }

        // 해당 워크플로우 찾기
        const matchingWorkflow = workflows.find(
          (workflow: WorkflowListItem) => workflow.workflow_id === chat.workflow_id
        );

        return {
          id: chat.id,
          interactionId: chat.interaction_id,
          workflowId: chat.workflow_id,
          workflowName: chat.workflow_name,
          interactionCount: chat.interaction_count,
          metadata: chat.metadata,
          createdAt: chat.created_at,
          updatedAt: chat.updated_at,
          isWorkflowDeleted: !matchingWorkflow,
          userId: matchingWorkflow?.user_id,
        };
      });

      setChats(enrichedChatList);
    } catch (err) {
      console.error('Failed to load chat history:', err);
      setError(t('chatHistory.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  // ─────────────────────────────────────────────────────────────
  // 필터링
  // ─────────────────────────────────────────────────────────────

  const filteredChats = chats.filter((chat) => {
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

  // 카운트 계산
  const counts = {
    all: chats.length,
    active: chats.filter((c) => !c.isWorkflowDeleted && !isDeployChat(c.interactionId)).length,
    deleted: chats.filter((c) => c.isWorkflowDeleted).length,
    deploy: chats.filter((c) => isDeployChat(c.interactionId)).length,
  };

  const filterTabs = [
    { key: 'active', label: t('chatHistory.filter.active'), count: counts.active },
    { key: 'deploy', label: t('chatHistory.filter.deploy'), count: counts.deploy },
    { key: 'deleted', label: t('chatHistory.filter.deleted'), count: counts.deleted },
    { key: 'all', label: t('chatHistory.filter.all'), count: counts.all },
  ];

  // ─────────────────────────────────────────────────────────────
  // Event Handlers
  // ─────────────────────────────────────────────────────────────

  const handleContinueChat = async (chat: ChatHistoryItem) => {
    // 삭제된 워크플로우는 계속 불가
    if (chat.isWorkflowDeleted) {
      alert(t('chatHistory.error.workflowDeleted'));
      return;
    }

    // 현재 채팅 데이터 저장
    const saved = saveCurrentChatData({
      workflowId: chat.workflowId,
      workflowName: chat.workflowName,
      interactionId: chat.interactionId,
      userId: chat.userId,
      startedAt: chat.createdAt,
    });

    if (!saved) {
      alert(t('chatHistory.error.saveFailed'));
      return;
    }

    // 콜백 호출
    onSelectChat?.({
      workflowId: chat.workflowId,
      workflowName: chat.workflowName,
      interactionId: chat.interactionId,
      userId: chat.userId,
    });

    // 현재 채팅 페이지로 이동
    onNavigate?.('current-chat');
  };

  const handleDeleteChat = async (chat: ChatHistoryItem) => {
    const confirmed = window.confirm(
      t('chatHistory.deleteConfirm', { name: chat.workflowName })
    );

    if (!confirmed) return;

    try {
      await deleteWorkflowIOLogs(
        chat.workflowName,
        chat.workflowId,
        chat.interactionId,
      );

      // 목록에서 제거
      setChats((prev) => prev.filter((c) => c.id !== chat.id));
    } catch (err) {
      console.error('Failed to delete chat:', err);
      alert(t('chatHistory.error.deleteFailed'));
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Date Formatting
  // ─────────────────────────────────────────────────────────────

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return t('chatHistory.yesterday');
    } else if (diffDays < 7) {
      return t('chatHistory.daysAgo', { days: diffDays });
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <ContentArea
      title={t('chatHistory.title')}
      headerActions={
        <button
          onClick={loadChatHistory}
          className={`inline-flex items-center justify-center w-9 h-9 bg-transparent border border-border rounded-lg text-muted-foreground cursor-pointer transition-all hover:bg-muted hover:text-foreground [&_svg]:w-[18px] [&_svg]:h-[18px] ${loading ? 'animate-spin' : ''}`}
          disabled={loading}
          aria-label={t('common.refresh')}
        >
          <RefreshIcon />
        </button>
      }
      toolbar={
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <FilterTabs
            tabs={filterTabs}
            activeKey={filter}
            onChange={(key) => setFilter(key as ChatHistoryFilter)}
            variant="underline"
          />
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('chatHistory.searchPlaceholder')}
            size="sm"
          />
        </div>
      }
    >
        {/* Error State */}
        {error && (
          <div className="flex items-center justify-between px-6 py-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 [&_span]:text-sm [&_button]:bg-transparent [&_button]:border-none [&_button]:text-red-500 [&_button]:text-sm [&_button]:font-medium [&_button]:cursor-pointer [&_button]:underline">
            <span>{error}</span>
            <button onClick={loadChatHistory}>{t('common.retry')}</button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 gap-4">
            <div className="w-10 h-10 border-3 border-border border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground m-0">{t('common.loading')}</p>
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
          <div className="flex flex-col gap-2">
            {filteredChats.map((chat) => (
              <article
                key={chat.id}
                className={`group flex items-center gap-4 px-6 py-4 bg-white border border-border rounded-lg cursor-pointer transition-all hover:border-primary hover:shadow-sm ${chat.isWorkflowDeleted ? 'opacity-60 hover:opacity-80' : ''}`}
              >
                <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-lg text-primary shrink-0 [&_svg]:w-5 [&_svg]:h-5">
                  <MessageIcon />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-foreground m-0 overflow-hidden text-ellipsis whitespace-nowrap">{chat.workflowName}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                    <span>
                      {t('chatHistory.interactions', { count: chat.interactionCount })}
                    </span>
                    <span className="text-border">•</span>
                    <span>{formatDate(chat.updatedAt)}</span>

                    {chat.isWorkflowDeleted && (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/10 text-red-500">
                        {t('chatHistory.deleted')}
                      </span>
                    )}
                    {isDeployChat(chat.interactionId) && (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                        {t('chatHistory.deploy')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    className="flex items-center justify-center gap-1 px-4 py-1 min-w-8 h-8 bg-primary border border-primary text-white rounded text-sm cursor-pointer transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed [&_span]:font-medium [&_svg]:w-4 [&_svg]:h-4 [&_svg]:shrink-0"
                    onClick={() => handleContinueChat(chat)}
                    disabled={chat.isWorkflowDeleted}
                    title={t('chatHistory.continue')}
                  >
                    <PlayIcon />
                    <span>{t('chatHistory.continue')}</span>
                  </button>
                  <button
                    className="flex items-center justify-center gap-1 px-2 py-1 min-w-8 h-8 bg-transparent border border-border text-muted-foreground rounded text-sm cursor-pointer transition-all hover:bg-red-500/10 hover:border-red-500 hover:text-red-500 [&_svg]:w-4 [&_svg]:h-4 [&_svg]:shrink-0"
                    onClick={() => handleDeleteChat(chat)}
                    title={t('chatHistory.delete')}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
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
export type { ChatHistoryItem, ChatHistoryFilter } from '@xgen/types';
