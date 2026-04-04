'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { RouteComponentProps, MainFeatureModule, ChatMessage, ChatMessageSender } from '@xgen/types';
import { ChatPanel, ChatEmptyState, ChatBubbleIcon } from '@xgen/ui';
import type { ChatPanelMessage } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import './locales';
import { getWorkflowIOLogs, executeWorkflowStream as executeWorkflowStreamApi } from '@xgen/api-client';

import type {
  ChatCurrentPageProps,
  StoredChatData,
  IOLog,
} from './types';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY_CURRENT_CHAT = 'xgen_current_chat';

// ─────────────────────────────────────────────────────────────
// Page-level Icons (header, workflow info — NOT shared)
// ─────────────────────────────────────────────────────────────

const WorkflowIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="12" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="2" y="12" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="12" y="12" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 5H12M15 8V12M8 15H12M5 8V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const HistoryIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 4.5V9L12 10.5M16.5 9C16.5 13.1421 13.1421 16.5 9 16.5C4.85786 16.5 1.5 13.1421 1.5 9C1.5 4.85786 4.85786 1.5 9 1.5C13.1421 1.5 16.5 4.85786 16.5 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const NewChatIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SettingsIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M11.667 7C11.667 6.728 11.646 6.461 11.605 6.2L13.019 5.078L11.852 3.047L10.171 3.655C9.748 3.307 9.27 3.028 8.75 2.833L8.417 1H6.083L5.75 2.833C5.23 3.028 4.752 3.307 4.329 3.655L2.648 3.047L1.481 5.078L2.895 6.2C2.854 6.461 2.833 6.728 2.833 7C2.833 7.272 2.854 7.539 2.895 7.8L1.481 8.922L2.648 10.953L4.329 10.345C4.752 10.693 5.23 10.972 5.75 11.167L6.083 13H8.417L8.75 11.167C9.27 10.972 9.748 10.693 10.171 10.345L11.852 10.953L13.019 8.922L11.605 7.8C11.646 7.539 11.667 7.272 11.667 7Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronIcon: React.FC<{ expanded?: boolean }> = ({ expanded }) => (
  <svg
    width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
  >
    <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────

const loadCurrentChatData = (): StoredChatData | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CURRENT_CHAT);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const clearCurrentChatData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY_CURRENT_CHAT);
  } catch (error) {
    console.error('Failed to clear current chat data:', error);
  }
};

const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
};

// ─────────────────────────────────────────────────────────────
// Workflow Info Panel (collapsible) — page-specific
// ─────────────────────────────────────────────────────────────

interface WorkflowInfoPanelProps {
  workflowName: string;
  interactionId: string;
}

const WorkflowInfoPanel: React.FC<WorkflowInfoPanelProps> = ({ workflowName, interactionId }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border-b border-border bg-muted/30 shrink-0">
      <button
        className="flex items-center justify-between w-full px-6 py-2 text-left bg-transparent border-none cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-medium">{workflowName}</span>
          <span className="text-muted-foreground/50">·</span>
          <span className="text-muted-foreground/50">1 agents</span>
        </div>
        <ChevronIcon expanded={expanded} />
      </button>
      {expanded && (
        <div className="px-6 pb-2.5">
          <div className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-border/50">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-medium text-foreground">Agent Xgen</span>
              <span className="text-[10px] text-muted-foreground/50 font-mono truncate">{interactionId}</span>
            </div>
            <div className="flex items-center justify-center w-6 h-6 text-muted-foreground/40 cursor-pointer hover:text-muted-foreground transition-colors [&_svg]:w-3.5 [&_svg]:h-3.5">
              <SettingsIcon />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Chat Current Page — page-level orchestrator
// ─────────────────────────────────────────────────────────────

const ChatCurrentPage: React.FC<RouteComponentProps & ChatCurrentPageProps> = ({
  onNavigate,
  onChatEnd,
}) => {
  const { t } = useTranslation();
  const abortControllerRef = useRef<AbortController | null>(null);

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatData, setChatData] = useState<StoredChatData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Convert ChatMessage[] → ChatPanelMessage[]
  const panelMessages: ChatPanelMessage[] = useMemo(
    () =>
      messages.map((m) => ({
        id: m.id,
        sender: m.sender,
        content: m.content,
        createdAt: m.createdAt,
        status: m.status,
        attachments: m.attachments?.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          size: a.size,
        })),
        errorMessage: m.errorMessage,
      })),
    [messages],
  );

  // ── Initialize ────────────────────────────────────────────

  const loadChatHistory = useCallback(async (data: StoredChatData) => {
    try {
      const result = await getWorkflowIOLogs(
        data.workflowName,
        data.workflowId,
        data.interactionId,
      );

      const logs = result?.logs || [];
      const loadedMessages: ChatMessage[] = [];

      loadedMessages.push({
        id: generateMessageId(),
        sender: 'system' as ChatMessageSender,
        content: t('chat.sessionStarted', { workflowName: data.workflowName }),
        createdAt: data.startedAt,
        status: 'sent',
      });

      logs.forEach((log: IOLog) => {
        if (log.input_data) {
          loadedMessages.push({
            id: `io_${log.io_id}_input`,
            sender: 'user' as ChatMessageSender,
            content: log.input_data,
            createdAt: log.created_at,
            status: 'sent',
          });
        }
        if (log.output_data) {
          loadedMessages.push({
            id: `io_${log.io_id}_output`,
            sender: 'assistant' as ChatMessageSender,
            content: log.output_data,
            createdAt: log.created_at,
            status: 'sent',
            metadata: log.metadata as ChatMessage['metadata'],
          });
        }
      });

      setMessages(loadedMessages);
    } catch (err) {
      console.error('Failed to load chat history:', err);
      setMessages([{
        id: generateMessageId(),
        sender: 'system',
        content: t('chat.sessionStarted', { workflowName: data.workflowName }),
        createdAt: data.startedAt,
        status: 'sent',
      }]);
    }
  }, [t]);

  useEffect(() => {
    const data = loadCurrentChatData();
    if (!data) {
      setError(t('chat.error.noSession'));
      setLoading(false);
      return;
    }
    setChatData(data);
    loadChatHistory(data).finally(() => setLoading(false));
  }, [loadChatHistory, t]);

  // ── Workflow Execution (Streaming) ────────────────────────

  const executeWorkflow = useCallback(
    async (message: string) => {
      if (!chatData) return;

      setIsExecuting(true);
      setIsStreaming(true);

      const userMessage: ChatMessage = {
        id: generateMessageId(),
        sender: 'user',
        content: message,
        createdAt: new Date().toISOString(),
        status: 'sent',
        attachments: attachments.map((file, index) => ({
          id: `attach_${index}`,
          name: file.name,
          type: file.type,
          size: file.size,
        })),
      };

      const assistantMessageId = generateMessageId();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        sender: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        status: 'streaming',
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setAttachments([]);

      abortControllerRef.current = new AbortController();
      let accumulatedContent = '';

      try {
        await executeWorkflowStreamApi({
          workflowName: chatData.workflowName,
          workflowId: chatData.workflowId,
          inputData: message,
          interactionId: chatData.interactionId,
          user_id: chatData.userId,
          signal: abortControllerRef.current.signal,
          onData: (content) => {
            const text = typeof content === 'string' ? content : JSON.stringify(content);
            accumulatedContent += text;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId ? { ...msg, content: accumulatedContent } : msg
              )
            );
          },
          onEnd: () => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId ? { ...msg, status: 'sent' as const } : msg
              )
            );
          },
          onError: (err) => {
            console.error('Workflow execution failed:', err);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, status: 'error' as const, content: t('chat.error.executionFailed'), errorMessage: (err as Error).message }
                  : msg
              )
            );
          },
        });

        if (abortControllerRef.current?.signal.aborted) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content || t('chat.cancelled'), status: 'sent' as const }
                : msg
            )
          );
        }
      } catch (err: unknown) {
        console.error('Workflow execution failed:', err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, status: 'error' as const, content: t('chat.error.executionFailed'), errorMessage: (err as Error).message }
              : msg
          )
        );
      } finally {
        setIsExecuting(false);
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [chatData, attachments, t],
  );

  // ── Event Handlers ────────────────────────────────────────

  const handleSend = useCallback(
    (text: string) => { executeWorkflow(text); },
    [executeWorkflow],
  );

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleRetry = useCallback(
    (messageId: string) => {
      const msg = messages.find((m) => m.id === messageId);
      if (msg && msg.sender === 'user') {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        executeWorkflow(msg.content);
      }
    },
    [messages, executeWorkflow],
  );

  const handleNewChat = useCallback(() => {
    clearCurrentChatData();
    onNavigate?.('new-chat');
  }, [onNavigate]);

  const handleViewHistory = useCallback(() => {
    onNavigate?.('chat-history');
  }, [onNavigate]);

  // ── Render: Loading ───────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-[#f8f9fa]">
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground/60">
          <div className="w-8 h-8 border-[3px] border-border border-t-primary rounded-full animate-spin" />
          <p className="m-0 text-sm">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // ── Render: Error / No session ────────────────────────────

  if (error || !chatData) {
    return (
      <div className="flex flex-col h-screen bg-[#f8f9fa]">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
          <div className="text-muted-foreground/30 [&_svg]:w-12 [&_svg]:h-12">
            <ChatBubbleIcon />
          </div>
          <p className="m-0 text-base text-muted-foreground">{error || t('chat.error.noSession')}</p>
          <button
            className="px-6 py-2.5 text-sm font-medium text-white bg-primary border-none rounded-lg cursor-pointer transition-colors hover:bg-primary/90"
            onClick={() => onNavigate?.('new-chat')}
          >
            {t('chat.startNewChat')}
          </button>
        </div>
      </div>
    );
  }

  // ── Empty state for ChatPanel ─────────────────────────────

  const emptyChatState = (
    <ChatEmptyState
      variant="full"
      icon={<ChatBubbleIcon />}
      title={t('chat.emptyState.title')}
      description={`"${chatData.workflowName}" ${t('chat.emptyState.ready')}`}
      suggestions={[
        { key: 'hello', label: t('chat.suggestions.hello') },
        { key: 'help', label: t('chat.suggestions.help') },
        { key: 'features', label: t('chat.suggestions.features') },
      ]}
      onSuggestionClick={(label) => !isExecuting && executeWorkflow(label)}
    />
  );

  // ── Render: Main Chat Interface ───────────────────────────

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f8f9fa]">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center shrink-0 text-white [&_svg]:w-5 [&_svg]:h-5">
            <WorkflowIcon />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-foreground m-0 leading-tight">{chatData.workflowName}</h1>
            <p className="text-xs text-muted-foreground/60 m-0">
              {messages.filter((m) => m.sender !== 'system').length > 0
                ? `${messages.filter((m) => m.sender !== 'system').length} ${t('chat.interactionCount')}`
                : t('chat.newChat')
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground bg-white border border-border rounded-lg cursor-pointer transition-all hover:border-primary hover:text-primary hover:bg-primary/5 [&_svg]:w-4 [&_svg]:h-4"
            onClick={handleNewChat}
            title={t('chat.newChat')}
          >
            <NewChatIcon />
            <span className="hidden sm:inline">{t('chat.newChat')}</span>
          </button>
          <button
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground bg-white border border-border rounded-lg cursor-pointer transition-all hover:border-primary hover:text-primary hover:bg-primary/5 [&_svg]:w-4 [&_svg]:h-4"
            onClick={handleViewHistory}
            title={t('chat.viewHistory')}
          >
            <HistoryIcon />
            <span className="hidden sm:inline">{t('chat.viewHistory')}</span>
          </button>
        </div>
      </header>

      {/* ── Workflow Info Panel ── */}
      <WorkflowInfoPanel
        workflowName={chatData.workflowName}
        interactionId={chatData.interactionId}
      />

      {/* ── Shared ChatPanel ── */}
      <ChatPanel
        messages={panelMessages}
        onSend={handleSend}
        onStop={handleStop}
        isExecuting={isExecuting}
        isStreaming={isStreaming}
        variant="full"
        placeholder={t('chat.inputPlaceholder')}
        emptyState={emptyChatState}
        showAttachments
        onAttach={(files) => setAttachments((prev) => [...prev, ...files])}
        attachments={attachments}
        onRemoveAttachment={(index) => setAttachments((prev) => prev.filter((_, i) => i !== index))}
        onRetry={handleRetry}
        sendLabel={t('chat.send')}
        stopLabel={t('chat.stop')}
        retryLabel={t('chat.retry')}
        errorLabel={t('chat.sendError')}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const mainChatCurrentFeature: MainFeatureModule = {
  id: 'main-ChatCurrent',
  name: 'Current Chat',
  sidebarSection: 'chat',
  sidebarItems: [
    {
      id: 'current-chat',
      titleKey: 'sidebar.chat.current.title',
      descriptionKey: 'sidebar.chat.current.description',
    },
  ],
  routes: {
    'current-chat': ChatCurrentPage,
  },
  requiresAuth: true,
};

export default mainChatCurrentFeature;
export type { ChatMessage } from '@xgen/types';
