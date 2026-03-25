'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { RouteComponentProps, MainFeatureModule, ChatMessage, ChatMessageSender, CurrentChatData } from '@xgen/types';
import { ContentArea } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { createApiClient } from '@xgen/api-client';

import styles from './styles/chat-current.module.scss';
import type {
  ChatCurrentPageProps,
  StoredChatData,
  IOLog,
  IOLogsResponse,
  WorkflowExecutionRequest,
  SSEEventData,
  NodeStatusEvent,
  ToolEvent,
} from './types';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY_CURRENT_CHAT = 'xgen_current_chat';
const API_STREAMING_ENDPOINT = '/api/workflow/execute/based_id/stream';

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const WorkflowIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="12" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="2" y="12" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="12" y="12" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 5H12M15 8V12M8 15H12M5 8V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const UserIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 15.75V14.25C15 13.4544 14.6839 12.6913 14.1213 12.1287C13.5587 11.5661 12.7956 11.25 12 11.25H6C5.20435 11.25 4.44129 11.5661 3.87868 12.1287C3.31607 12.6913 3 13.4544 3 14.25V15.75M12 5.25C12 6.90685 10.6569 8.25 9 8.25C7.34315 8.25 6 6.90685 6 5.25C6 3.59315 7.34315 2.25 9 2.25C10.6569 2.25 12 3.59315 12 5.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BotIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 1.5V3M6 6.75H6.0075M12 6.75H12.0075M5.25 10.5C5.25 10.5 6.375 12 9 12C11.625 12 12.75 10.5 12.75 10.5M13.5 13.5H4.5C3.67157 13.5 3 12.8284 3 12V6C3 5.17157 3.67157 4.5 4.5 4.5H13.5C14.3284 4.5 15 5.17157 15 6V12C15 12.8284 14.3284 13.5 13.5 13.5ZM6.75 16.5H11.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SendIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.333 1.667L9.167 10.833M18.333 1.667L12.5 18.333L9.167 10.833M18.333 1.667L1.667 7.5L9.167 10.833" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PaperclipIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.158 9.342L9.575 16.925C8.66352 17.8365 7.43328 18.3469 6.15 18.3469C4.86672 18.3469 3.63648 17.8365 2.725 16.925C1.81352 16.0135 1.30313 14.7833 1.30313 13.5C1.30313 12.2167 1.81352 10.9865 2.725 10.075L10.308 2.492C10.9178 1.88216 11.7443 1.54004 12.604 1.54004C13.4637 1.54004 14.2902 1.88216 14.9 2.492C15.5098 3.10184 15.852 3.92826 15.852 4.788C15.852 5.64774 15.5098 6.47416 14.9 7.084L7.317 14.667C7.01208 14.9719 6.59887 15.143 6.169 15.143C5.73913 15.143 5.32592 14.9719 5.021 14.667C4.71608 14.3621 4.54502 13.9489 4.54502 13.519C4.54502 13.0891 4.71608 12.6759 5.021 12.371L12.017 5.375" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FileIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.167 1.167H3.5C3.19058 1.167 2.89383 1.28992 2.67504 1.50871C2.45625 1.7275 2.333 2.02425 2.333 2.333V11.667C2.333 11.976 2.45625 12.273 2.67504 12.492C2.89383 12.711 3.19058 12.833 3.5 12.833H10.5C10.809 12.833 11.106 12.711 11.325 12.492C11.544 12.273 11.667 11.976 11.667 11.667V4.667L8.167 1.167Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.167 1.167V4.667H11.667" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const HistoryIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 4.5V9L12 10.5M16.5 9C16.5 13.1421 13.1421 16.5 9 16.5C4.85786 16.5 1.5 13.1421 1.5 9C1.5 4.85786 4.85786 1.5 9 1.5C13.1421 1.5 16.5 4.85786 16.5 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AlertIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 4.667V7M7 9.333H7.006M12.833 7C12.833 10.222 10.222 12.833 7 12.833C3.778 12.833 1.167 10.222 1.167 7C1.167 3.778 3.778 1.167 7 1.167C10.222 1.167 12.833 3.778 12.833 7Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const StopIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="12" height="12" rx="2" fill="currentColor"/>
  </svg>
);

const NewChatIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────

/** 현재 채팅 데이터 불러오기 */
const loadCurrentChatData = (): StoredChatData | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CURRENT_CHAT);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/** 현재 채팅 데이터 삭제 */
const clearCurrentChatData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY_CURRENT_CHAT);
  } catch (error) {
    console.error('Failed to clear current chat data:', error);
  }
};

/** 고유 메시지 ID 생성 */
const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
};

/** 시간 포맷팅 */
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
};

// ─────────────────────────────────────────────────────────────
// Message Component
// ─────────────────────────────────────────────────────────────

interface MessageItemProps {
  message: ChatMessage;
  onRetry?: () => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, onRetry }) => {
  const { t } = useTranslation();

  if (message.sender === 'system') {
    return (
      <div className={`${styles.messageGroup} ${styles.system}`}>
        <div className={styles.messageContent}>
          <div className={`${styles.messageBubble} ${styles.system}`}>
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.messageGroup} ${styles[message.sender]}`}>
      <div className={`${styles.avatar} ${styles[message.sender]}`}>
        {message.sender === 'user' ? <UserIcon /> : <BotIcon />}
      </div>
      <div className={styles.messageContent}>
        <div
          className={`${styles.messageBubble} ${styles[message.sender]} ${
            message.status === 'error' ? styles.error : ''
          } ${message.status === 'streaming' ? styles.streaming : ''}`}
        >
          {message.content}
          {message.status === 'streaming' && <span className={styles.cursor}>▊</span>}
        </div>
        {message.attachments && message.attachments.length > 0 && (
          <div className={styles.attachments}>
            {message.attachments.map((attachment) => (
              <div key={attachment.id} className={styles.attachment}>
                <FileIcon />
                <span>{attachment.name}</span>
              </div>
            ))}
          </div>
        )}
        <span className={styles.messageTime}>{formatTime(message.createdAt)}</span>
        {message.status === 'error' && (
          <div className={styles.messageError}>
            <AlertIcon />
            <span>{message.metadata?.error || t('chat.sendError')}</span>
            {onRetry && (
              <button className={styles.retryButton} onClick={onRetry}>
                {t('chat.retry')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Typing Indicator
// ─────────────────────────────────────────────────────────────

const TypingIndicator: React.FC = () => (
  <div className={`${styles.messageGroup} ${styles.assistant}`}>
    <div className={`${styles.avatar} ${styles.assistant}`}>
      <BotIcon />
    </div>
    <div className={styles.typingIndicator}>
      <span className={styles.typingDot} />
      <span className={styles.typingDot} />
      <span className={styles.typingDot} />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Chat Current Page Component
// ─────────────────────────────────────────────────────────────

const ChatCurrentPage: React.FC<RouteComponentProps & ChatCurrentPageProps> = ({
  onNavigate,
  onChatEnd,
}) => {
  const { t } = useTranslation();
  const api = createApiClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ─────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatData, setChatData] = useState<StoredChatData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isComposing, setIsComposing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────
  // Initialize: Load chat data and history
  // ─────────────────────────────────────────────────────────────

  const loadChatHistory = useCallback(async (data: StoredChatData) => {
    try {
      // Load IO logs for this interaction
      const result = await api.get<IOLogsResponse>(
        `/api/workflow/io-logs?interaction_id=${data.interactionId}&limit=50`
      );

      const logs = result?.data?.logs || [];

      // Convert IO logs to messages
      const loadedMessages: ChatMessage[] = [];

      // Add system message for session start
      loadedMessages.push({
        id: generateMessageId(),
        sender: 'system' as ChatMessageSender,
        content: t('chat.sessionStarted', { workflowName: data.workflowName }),
        createdAt: data.startedAt,
        status: 'sent',
      });

      // Convert logs to messages
      logs.forEach((log: IOLog) => {
        // User message
        if (log.input_data) {
          loadedMessages.push({
            id: `io_${log.io_id}_input`,
            sender: 'user' as ChatMessageSender,
            content: log.input_data,
            createdAt: log.created_at,
            status: 'sent',
          });
        }

        // Assistant message
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
      // Still show the session but without history
      setMessages([
        {
          id: generateMessageId(),
          sender: 'system',
          content: t('chat.sessionStarted', { workflowName: data.workflowName }),
          createdAt: data.startedAt,
          status: 'sent',
        },
      ]);
    }
  }, [api, t]);

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

  // ─────────────────────────────────────────────────────────────
  // Auto-scroll to bottom
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isExecuting]);

  // ─────────────────────────────────────────────────────────────
  // Auto-resize textarea
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputContent]);

  // ─────────────────────────────────────────────────────────────
  // Workflow Execution (Streaming)
  // ─────────────────────────────────────────────────────────────

  const executeWorkflowStream = useCallback(
    async (message: string) => {
      if (!chatData) return;

      setIsExecuting(true);
      setIsStreaming(true);

      // Create user message
      const userMessageId = generateMessageId();
      const userMessage: ChatMessage = {
        id: userMessageId,
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

      // Create streaming assistant message placeholder
      const assistantMessageId = generateMessageId();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        sender: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        status: 'streaming',
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setStreamingMessageId(assistantMessageId);
      setAttachments([]);

      // Prepare request
      const requestBody: WorkflowExecutionRequest = {
        workflow_id: chatData.workflowId,
        workflow_name: chatData.workflowName,
        input_data: message,
        interaction_id: chatData.interactionId,
        user_id: chatData.userId,
      };

      // Create abort controller
      abortControllerRef.current = new AbortController();

      try {
        const response = await api.post(API_STREAMING_ENDPOINT, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          signal: abortControllerRef.current.signal,
          responseType: 'stream',
        });

        // Handle streaming response
        const reader = (response.data as ReadableStream).getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let accumulatedContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Parse SSE events
          const blocks = buffer.split('\n\n');
          buffer = blocks.pop() || '';

          for (const block of blocks) {
            const lines = block.split('\n');
            let eventType = 'message';
            let data: string | null = null;

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                eventType = line.substring(7).trim();
              } else if (line.startsWith('data: ')) {
                data = line.substring(6).trim();
              }
            }

            if (data) {
              try {
                const parsedData: SSEEventData = JSON.parse(data);

                if (parsedData.type === 'data' && parsedData.content) {
                  accumulatedContent += parsedData.content;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: accumulatedContent }
                        : msg
                    )
                  );
                } else if (parsedData.type === 'summary' && parsedData.data?.outputs) {
                  // Non-streaming response
                  const output = parsedData.data.outputs[0];
                  accumulatedContent = typeof output === 'string' ? output : JSON.stringify(output);
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: accumulatedContent }
                        : msg
                    )
                  );
                } else if (parsedData.type === 'error') {
                  throw new Error(parsedData.error || 'Unknown error');
                }
              } catch (parseError) {
                console.error('Failed to parse SSE data:', parseError);
              }
            }
          }
        }

        // Mark message as sent
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, status: 'sent' as const }
              : msg
          )
        );
      } catch (err: unknown) {
        if ((err as Error).name === 'AbortError') {
          // User cancelled
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: msg.content || t('chat.cancelled'),
                    status: 'sent' as const,
                  }
                : msg
            )
          );
        } else {
          console.error('Workflow execution failed:', err);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    status: 'error' as const,
                    content: t('chat.error.executionFailed'),
                    metadata: { error: (err as Error).message },
                  }
                : msg
            )
          );
        }
      } finally {
        setIsExecuting(false);
        setIsStreaming(false);
        setStreamingMessageId(null);
        abortControllerRef.current = null;
      }
    },
    [chatData, attachments, api, t]
  );

  // ─────────────────────────────────────────────────────────────
  // Event Handlers
  // ─────────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    if (!inputContent.trim() || isExecuting) return;

    const message = inputContent.trim();
    setInputContent('');
    executeWorkflowStream(message);
  }, [inputContent, isExecuting, executeWorkflowStream]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const handleAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNewChat = useCallback(() => {
    clearCurrentChatData();
    onNavigate?.('new-chat');
  }, [onNavigate]);

  const handleViewHistory = useCallback(() => {
    onNavigate?.('chat-history');
  }, [onNavigate]);

  const handleRetry = useCallback(
    (messageId: string) => {
      const message = messages.find((m) => m.id === messageId);
      if (message && message.sender === 'user') {
        // Remove the failed response and retry
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        executeWorkflowStream(message.content);
      }
    },
    [messages, executeWorkflowStream]
  );

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <ContentArea title={t('chat.currentChat')}>
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>{t('common.loading')}</p>
          </div>
        </div>
      </ContentArea>
    );
  }

  if (error || !chatData) {
    return (
      <ContentArea title={t('chat.currentChat')}>
        <div className={styles.container}>
          <div className={styles.errorState}>
            <AlertIcon />
            <p>{error || t('chat.error.noSession')}</p>
            <button onClick={() => onNavigate?.('new-chat')}>
              {t('chat.startNewChat')}
            </button>
          </div>
        </div>
      </ContentArea>
    );
  }

  return (
    <ContentArea title={t('chat.currentChat')}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerInfo}>
            <div className={styles.workflowIcon}>
              <WorkflowIcon />
            </div>
            <div className={styles.workflowDetails}>
              <h1 className={styles.workflowName}>{chatData.workflowName}</h1>
              <p className={styles.workflowMeta}>
                {t('chat.interactionCount', {
                  count: messages.filter((m) => m.sender !== 'system').length,
                })}
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.headerButton}
              onClick={handleNewChat}
              title={t('chat.newChat')}
            >
              <NewChatIcon />
            </button>
            <button
              className={styles.headerButton}
              onClick={handleViewHistory}
              title={t('chat.viewHistory')}
            >
              <HistoryIcon />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className={styles.messagesArea}>
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              onRetry={
                message.status === 'error'
                  ? () => handleRetry(message.id)
                  : undefined
              }
            />
          ))}
          {isExecuting && !isStreaming && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={styles.inputArea}>
          {attachments.length > 0 && (
            <div className={styles.inputAttachments}>
              {attachments.map((file, index) => (
                <div key={index} className={styles.inputAttachment}>
                  <FileIcon />
                  <span>{file.name}</span>
                  <button
                    className={styles.removeAttachment}
                    onClick={() => handleRemoveAttachment(index)}
                  >
                    <CloseIcon />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className={`${styles.inputWrapper} ${isExecuting ? styles.disabled : ''}`}>
            <div className={styles.textareaContainer}>
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                onKeyDown={handleKeyDown}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                placeholder={t('chat.inputPlaceholder')}
                disabled={isExecuting}
                rows={1}
              />
            </div>
            <div className={styles.inputActions}>
              <button
                className={styles.attachButton}
                onClick={handleAttach}
                disabled={isExecuting}
                title={t('chat.attach')}
              >
                <PaperclipIcon />
              </button>
              {isExecuting ? (
                <button
                  className={`${styles.sendButton} ${styles.stop}`}
                  onClick={handleStop}
                  title={t('chat.stop')}
                >
                  <StopIcon />
                </button>
              ) : (
                <button
                  className={styles.sendButton}
                  onClick={handleSend}
                  disabled={!inputContent.trim()}
                  title={t('chat.send')}
                >
                  <SendIcon />
                </button>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </ContentArea>
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
