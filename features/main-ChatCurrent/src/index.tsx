'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { RouteComponentProps, MainFeatureModule, ChatMessage, ChatMessageSender } from '@xgen/types';
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

const QUICK_SUGGESTIONS = [
  { key: 'hello', labelKey: 'chat.suggestions.hello' },
  { key: 'help', labelKey: 'chat.suggestions.help' },
  { key: 'features', labelKey: 'chat.suggestions.features' },
];

// ─────────────────────────────────────────────────────────────
// Icons
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

const ChatBubbleIcon: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M42 23C42.005 25.57 41.431 28.107 40.32 30.42C39.0062 33.1755 36.9728 35.4986 34.4233 37.158C31.8737 38.8174 28.9058 39.7478 25.86 39.84C23.29 39.845 20.753 39.271 18.44 38.16L6 42L9.84 29.56C8.72904 27.247 8.15497 24.71 8.16 22.14C8.25221 19.0942 9.18261 16.1263 10.842 13.5767C12.5014 11.0272 14.8245 8.99384 17.58 7.68C19.893 6.56904 22.43 5.99497 25 6H26C30.077 6.224 33.924 7.935 36.844 10.756C39.764 13.577 41.476 17.424 41.7 21.5V23H42Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
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
      <div className="flex justify-center py-2">
        <div className="px-4 py-1.5 bg-muted text-muted-foreground text-xs rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  const isUser = message.sender === 'user';

  return (
    <div className={`flex gap-3 max-w-[85%] ${isUser ? 'self-end flex-row-reverse' : 'self-start'}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center [&_svg]:w-4 [&_svg]:h-4 ${isUser ? 'bg-primary text-white' : 'bg-gradient-to-br from-blue-400 to-primary text-white'}`}>
        {isUser ? <UserIcon /> : <BotIcon />}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 min-w-0">
        <div
          className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? 'bg-primary text-white rounded-2xl rounded-br-md'
              : 'bg-white border border-border text-foreground rounded-2xl rounded-bl-md'
          } ${message.status === 'error' ? 'border-red-300 bg-red-50' : ''}`}
        >
          {message.content}
          {message.status === 'streaming' && (
            <span className="inline-block w-[2px] h-4 ml-0.5 bg-primary animate-pulse align-text-bottom" />
          )}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {message.attachments.map((attachment) => (
              <div key={attachment.id} className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs text-muted-foreground [&_svg]:w-3 [&_svg]:h-3">
                <FileIcon />
                <span className="max-w-[120px] truncate">{attachment.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className={`text-[10px] text-muted-foreground/50 ${isUser ? 'text-right' : ''}`}>
          {formatTime(message.createdAt)}
        </span>

        {/* Error */}
        {message.status === 'error' && (
          <div className="flex items-center gap-1.5 text-xs text-red-500 [&_svg]:w-3.5 [&_svg]:h-3.5">
            <AlertIcon />
            <span>{message.errorMessage || t('chat.sendError')}</span>
            {onRetry && (
              <button
                className="ml-1 px-2 py-0.5 bg-transparent border border-red-400 rounded text-red-500 text-xs cursor-pointer hover:bg-red-50 transition-colors"
                onClick={onRetry}
              >
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

// ─────────────────────────────────────────────────────────────
// Empty State (Start your first conversation!)
// ─────────────────────────────────────────────────────────────

interface ChatEmptyStateProps {
  workflowName: string;
  onSuggestionClick: (message: string) => void;
}

const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({ workflowName, onSuggestionClick }) => {
  const { t } = useTranslation();

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
      <div className="text-muted-foreground/30 [&_svg]:w-12 [&_svg]:h-12">
        <ChatBubbleIcon />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="m-0 text-xl font-bold text-muted-foreground/60">
          {t('chat.emptyState.title')}
        </h3>
        <p className="m-0 text-sm text-muted-foreground/50 italic">
          &ldquo;{workflowName}&rdquo; {t('chat.emptyState.ready')}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 mt-2 justify-center">
        {QUICK_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.key}
            className="px-4 py-2 text-sm font-medium text-primary bg-white border border-primary/30 rounded-full cursor-pointer transition-all hover:bg-primary hover:text-white hover:border-primary hover:shadow-sm"
            onClick={() => onSuggestionClick(t(suggestion.labelKey))}
          >
            {t(suggestion.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Workflow Info Panel (collapsible)
// ─────────────────────────────────────────────────────────────

interface WorkflowInfoPanelProps {
  workflowName: string;
  interactionId: string;
}

const WorkflowInfoPanel: React.FC<WorkflowInfoPanelProps> = ({ workflowName, interactionId }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border-b border-border bg-muted/30 shrink-0">
      {/* Toggle Bar */}
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

      {/* Expanded Content */}
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
// Chat Current Page Component
// ─────────────────────────────────────────────────────────────

const ChatCurrentPage: React.FC<RouteComponentProps & ChatCurrentPageProps> = ({
  onNavigate,
  onChatEnd,
}) => {
  const { t } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // State
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

  // Derived: has user messages (exclude system messages)
  const hasUserMessages = useMemo(
    () => messages.some((m) => m.sender !== 'system'),
    [messages]
  );

  // ─────────────────────────────────────────────────────────────
  // Initialize
  // ─────────────────────────────────────────────────────────────

  const loadChatHistory = useCallback(async (data: StoredChatData) => {
    try {
      const result = await getWorkflowIOLogs(
        data.workflowName,
        data.workflowId,
        data.interactionId,
      );

      const logs = result?.logs || [];
      const loadedMessages: ChatMessage[] = [];

      // System message
      loadedMessages.push({
        id: generateMessageId(),
        sender: 'system' as ChatMessageSender,
        content: t('chat.sessionStarted', { workflowName: data.workflowName }),
        createdAt: data.startedAt,
        status: 'sent',
      });

      // Convert IO logs
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

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isExecuting]);

  // Auto-resize textarea
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
                msg.id === assistantMessageId
                  ? { ...msg, content: accumulatedContent }
                  : msg
              )
            );
          },
          onEnd: () => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, status: 'sent' as const }
                  : msg
              )
            );
          },
          onError: (err) => {
            console.error('Workflow execution failed:', err);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      status: 'error' as const,
                      content: t('chat.error.executionFailed'),
                      errorMessage: (err as Error).message,
                    }
                  : msg
              )
            );
          },
        });

        if (abortControllerRef.current?.signal.aborted) {
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
        }
      } catch (err: unknown) {
        console.error('Workflow execution failed:', err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  status: 'error' as const,
                  content: t('chat.error.executionFailed'),
                  errorMessage: (err as Error).message,
                }
              : msg
          )
        );
      } finally {
        setIsExecuting(false);
        setIsStreaming(false);
        setStreamingMessageId(null);
        abortControllerRef.current = null;
      }
    },
    [chatData, attachments, t]
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
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        executeWorkflowStream(message.content);
      }
    },
    [messages, executeWorkflowStream]
  );

  const handleSuggestionClick = useCallback(
    (message: string) => {
      if (isExecuting) return;
      executeWorkflowStream(message);
    },
    [isExecuting, executeWorkflowStream]
  );

  // ─────────────────────────────────────────────────────────────
  // Render: Loading
  // ─────────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────
  // Render: Error / No session
  // ─────────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────
  // Render: Main Chat Interface
  // ─────────────────────────────────────────────────────────────

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

      {/* ── Messages Area ── */}
      {!hasUserMessages ? (
        <ChatEmptyState
          workflowName={chatData.workflowName}
          onSuggestionClick={handleSuggestionClick}
        />
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 flex flex-col gap-4">
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
      )}

      {/* ── Input Area ── */}
      <div className="shrink-0 px-6 py-4 bg-white border-t border-border">
        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pb-2">
            {attachments.map((file, index) => (
              <div key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-muted border border-border rounded text-xs text-muted-foreground [&_svg]:w-3.5 [&_svg]:h-3.5">
                <FileIcon />
                <span className="max-w-[140px] truncate">{file.name}</span>
                <button
                  className="flex items-center justify-center w-4 h-4 p-0 bg-transparent border-none rounded-full cursor-pointer text-muted-foreground/60 transition-colors hover:text-red-500 [&_svg]:w-3 [&_svg]:h-3"
                  onClick={() => handleRemoveAttachment(index)}
                >
                  <CloseIcon />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Row */}
        <div className={`flex items-end gap-3 bg-muted/50 border border-border rounded-xl px-3 py-2 transition-colors focus-within:border-primary focus-within:bg-white ${isExecuting ? 'opacity-50' : ''}`}>
          <textarea
            ref={textareaRef}
            className="flex-1 min-h-[24px] max-h-[150px] py-1 border-none bg-transparent text-sm leading-relaxed text-foreground resize-none overflow-y-auto placeholder:text-muted-foreground/50 focus:outline-none"
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder={t('chat.inputPlaceholder')}
            disabled={isExecuting}
            rows={1}
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              className="flex items-center justify-center w-8 h-8 p-0 bg-transparent border-none rounded-lg cursor-pointer text-muted-foreground/50 transition-colors hover:text-primary [&_svg]:w-5 [&_svg]:h-5"
              onClick={handleAttach}
              disabled={isExecuting}
              title={t('chat.attach')}
            >
              <PaperclipIcon />
            </button>
            {isExecuting ? (
              <button
                className="flex items-center justify-center w-9 h-9 p-0 bg-red-500 border-none rounded-lg cursor-pointer text-white transition-all hover:bg-red-600 [&_svg]:w-4.5 [&_svg]:h-4.5"
                onClick={handleStop}
                title={t('chat.stop')}
              >
                <StopIcon />
              </button>
            ) : (
              <button
                className="flex items-center justify-center w-9 h-9 p-0 bg-primary border-none rounded-lg cursor-pointer text-white transition-all hover:bg-primary/90 disabled:bg-muted-foreground/20 disabled:cursor-not-allowed [&_svg]:w-5 [&_svg]:h-5"
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
