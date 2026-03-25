'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { useTranslation } from '@xgen/i18n';
import { createApiClient } from '@xgen/api-client';

import styles from './styles/chat-current.module.scss';
import type { ChatMessage, ChatSession, InputState, SuggestedQuestion } from './types';

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const WorkflowIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2.5V17.5M2.5 10H17.5M5.833 14.167L14.167 5.833M5.833 5.833L14.167 14.167" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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

const SettingsIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.55 11.25C14.4374 11.5053 14.4018 11.7884 14.4479 12.0636C14.494 12.3388 14.6198 12.5942 14.8087 12.7987L14.8537 12.8437C15.0047 12.9946 15.1243 13.1744 15.2056 13.3727C15.2868 13.571 15.3282 13.7838 15.3275 13.9987C15.3268 14.2136 15.284 14.4262 15.2014 14.6239C15.1188 14.8215 15.998 15.0004 14.8462 15.15C14.6945 15.2997 14.5142 15.418 14.3158 15.4989C14.1175 15.5799 13.905 15.6217 13.6903 15.6217C13.4757 15.6217 13.2632 15.5799 13.0649 15.4989C12.8666 15.418 12.6862 15.2997 12.5345 15.15L12.4895 15.105C12.285 14.9161 12.0296 14.7903 11.7544 14.7442C11.4792 14.6981 11.1961 14.7337 10.9408 14.8463C10.6907 14.9533 10.4783 15.1308 10.3288 15.3578C10.1794 15.5847 10.0994 15.8512 10.0988 16.1237V16.25C10.0988 16.6809 9.92711 17.0943 9.62223 17.3991C9.31736 17.704 8.90398 17.8757 8.47306 17.8757C8.04215 17.8757 7.62877 17.704 7.32389 17.3991C7.01902 17.0943 6.84731 16.6809 6.84731 16.25V16.1825C6.84194 15.9023 6.75367 15.6296 6.59353 15.4003C6.43339 15.1711 6.20899 14.9959 5.9483 14.8975C5.69299 14.7849 5.40986 14.7493 5.13469 14.7954C4.85952 14.8415 4.60409 14.9673 4.3996 15.1562L4.3546 15.2012C4.20286 15.3509 4.02251 15.4693 3.82417 15.5502C3.62584 15.6312 3.41336 15.673 3.19867 15.673C2.98398 15.673 2.7715 15.6312 2.57316 15.5502C2.37483 15.4693 2.19448 15.3509 2.04274 15.2012C1.89309 15.0495 1.77479 14.8691 1.69384 14.6708C1.61289 14.4725 1.57107 14.26 1.57179 14.0453C1.57179 13.8306 1.61358 13.6182 1.69449 13.4198C1.77541 13.2215 1.89373 13.0412 2.04349 12.8895L2.08849 12.8445C2.27736 12.64 2.40314 12.3846 2.44925 12.1094C2.49535 11.8342 2.45973 11.5511 2.34712 11.2958C2.2401 11.0456 2.0626 10.8333 1.83567 10.6838C1.60873 10.5343 1.34213 10.4543 1.06962 10.4537H0.942619C0.511703 10.4537 0.0983266 10.282 -0.20655 9.97715C-0.511427 9.67228 -0.683136 9.2589 -0.683136 8.82798C-0.683136 8.39706 -0.511427 7.98368 -0.20655 7.67881C0.0983266 7.37394 0.511703 7.20223 0.942619 7.20223H1.01012C1.29034 7.19686 1.56302 7.10858 1.79225 6.94845C2.02149 6.78831 2.19675 6.5639 2.2951 6.30322C2.40771 6.04791 2.44333 5.76478 2.39722 5.4896C2.35111 5.21443 2.22533 4.959 2.03647 4.75451L1.99147 4.70951C1.84181 4.55777 1.72351 4.37742 1.64256 4.17909C1.56161 3.98075 1.51979 3.76827 1.52051 3.55358C1.52051 3.3389 1.5623 3.12641 1.64322 2.92808C1.72414 2.72975 1.84246 2.5494 1.99221 2.39766C2.14395 2.24801 2.3243 2.12971 2.52264 2.04876C2.72097 1.96781 2.93345 1.92598 3.14814 1.92671C3.36283 1.92671 3.57531 1.9685 3.77364 2.04941C3.97198 2.13033 4.15233 2.24865 4.30407 2.39841L4.34907 2.44341C4.55356 2.63227 4.80899 2.75806 5.08416 2.80416C5.35933 2.85027 5.64246 2.81465 5.89777 2.70204H5.9483C6.19841 2.59502 6.41075 2.41752 6.56024 2.19059C6.70972 1.96365 6.78969 1.69705 6.79027 1.42454V1.29753C6.79027 0.866614 6.96198 0.453238 7.26685 0.148361C7.57173 -0.156516 7.98511 -0.328224 8.41602 -0.328224C8.84694 -0.328224 9.26031 -0.156516 9.56519 0.148361C9.87007 0.453238 10.0418 0.866614 10.0418 1.29753V1.365C10.0424 1.63751 10.1223 1.90411 10.2718 2.13105C10.4213 2.35798 10.6337 2.53548 10.8838 2.6425C11.1391 2.75511 11.4222 2.79073 11.6974 2.74462C11.9725 2.69852 12.228 2.57273 12.4325 2.38387L12.4775 2.33887C12.6292 2.18921 12.8096 2.07091 13.0079 1.98996C13.2062 1.90902 13.4187 1.86719 13.6334 1.86792C13.8481 1.86792 14.0606 1.90971 14.2589 1.99063C14.4572 2.07154 14.6376 2.18987 14.7893 2.33962C14.939 2.49136 15.0573 2.67171 15.1382 2.87005C15.2192 3.06838 15.261 3.28086 15.2603 3.49555C15.261 3.71024 15.2192 3.92272 15.1382 4.12105C15.0573 4.31939 14.939 4.49974 14.7893 4.65148L14.7443 4.69648C14.5554 4.90097 14.4296 5.1564 14.3835 5.43157C14.3374 5.70674 14.373 5.98987 14.4856 6.24518V6.29568C14.5927 6.54579 14.7702 6.75813 14.9971 6.90761C15.224 7.0571 15.4906 7.13707 15.7631 7.13765H15.8901C16.321 7.13765 16.7344 7.30936 17.0393 7.61423C17.3442 7.91911 17.5159 8.33249 17.5159 8.76340C17.5159 9.19432 17.3442 9.60769 17.0393 9.91257C16.7344 10.2174 16.321 10.3892 15.8901 10.3892H15.8226C15.5501 10.3897 15.2835 10.4697 15.0566 10.6192C14.8296 10.7687 14.6521 10.981 14.5451 11.2312L14.55 11.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

const MOCK_SESSION: ChatSession = {
  id: 'session-001',
  interactionId: 'int-001',
  workflow: {
    id: 'wf-001',
    name: '이커머스 법률 상담',
    description: '전자상거래 관련 법률 문의에 대한 AI 상담',
  },
  messages: [
    {
      id: 'msg-001',
      sender: 'system',
      content: '이커머스 법률 상담 워크플로우가 시작되었습니다.',
      createdAt: '2025-01-28T10:00:00Z',
      status: 'sent',
    },
    {
      id: 'msg-002',
      sender: 'user',
      content: '온라인 쇼핑몰에서 소비자 환불 정책은 어떻게 되나요?',
      createdAt: '2025-01-28T10:01:00Z',
      status: 'sent',
    },
    {
      id: 'msg-003',
      sender: 'assistant',
      content: `전자상거래 등에서의 소비자보호에 관한 법률에 따르면, 소비자는 다음과 같은 환불 권리를 가집니다:

1. **청약철회권**: 물품을 받은 날로부터 7일 이내에 청약철회가 가능합니다.

2. **환불 처리 기한**: 사업자는 청약철회 통보를 받은 날로부터 3영업일 이내에 대금을 환급해야 합니다.

3. **예외 사항**:
   - 소비자의 책임으로 물품이 훼손된 경우
   - 사용으로 인해 물품의 가치가 현저히 감소한 경우
   - 복제 가능한 물품의 포장을 훼손한 경우

추가로 궁금하신 점이 있으시면 말씀해 주세요.`,
      createdAt: '2025-01-28T10:01:30Z',
      status: 'sent',
      metadata: {
        tokens: 245,
        processingTime: 1.2,
      },
    },
  ],
  createdAt: '2025-01-28T10:00:00Z',
  updatedAt: '2025-01-28T10:01:30Z',
};

const MOCK_SUGGESTIONS: SuggestedQuestion[] = [
  { id: '1', text: '해외 직구 상품도 같은 정책이 적용되나요?' },
  { id: '2', text: '환불 거부 시 대응 방법은?' },
  { id: '3', text: '배송비 부담은 누가 하나요?' },
];

// ─────────────────────────────────────────────────────────────
// Message Component
// ─────────────────────────────────────────────────────────────

interface MessageItemProps {
  message: ChatMessage;
  onRetry?: () => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, onRetry }) => {
  const { t } = useTranslation();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

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
        </div>
        {message.attachments && message.attachments.length > 0 && (
          <div className={styles.attachments}>
            {message.attachments.map(attachment => (
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
            <span>{message.errorMessage || t('chat.sendError')}</span>
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
// Chat Current Page
// ─────────────────────────────────────────────────────────────

interface ChatCurrentPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
  sessionId?: string;
  workflowId?: string;
}

const ChatCurrentPage: React.FC<ChatCurrentPageProps> = ({ onNavigate, sessionId, workflowId }) => {
  const { t } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [input, setInput] = useState<InputState>({
    content: '',
    attachments: [],
    isComposing: false,
  });
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedQuestion[]>([]);

  const loadSession = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: API 연동
      // const api = createApiClient();
      // const response = await api.get<ChatSession>(`/api/chat/sessions/${sessionId}`);
      // setSession(response.data);

      await new Promise(resolve => setTimeout(resolve, 400));
      setSession(MOCK_SESSION);
      setSuggestions(MOCK_SUGGESTIONS);
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // 메시지 영역 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages, isTyping]);

  // textarea 자동 높이 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input.content]);

  const handleSend = async () => {
    if (!input.content.trim() && input.attachments.length === 0) return;
    if (!session) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: input.content,
      createdAt: new Date().toISOString(),
      status: 'sending',
    };

    setSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, userMessage],
    } : null);

    setInput({ content: '', attachments: [], isComposing: false });
    setIsTyping(true);

    try {
      // TODO: API 연동
      // const api = createApiClient();
      // const response = await api.post('/api/chat/send', {
      //   sessionId: session.id,
      //   content: input.content,
      //   attachments: input.attachments,
      // });

      await new Promise(resolve => setTimeout(resolve, 1500));

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        content: '네, 해당 질문에 대해 답변드리겠습니다. 추가적인 정보가 필요하시면 말씀해 주세요.',
        createdAt: new Date().toISOString(),
        status: 'sent',
      };

      setSession(prev => prev ? {
        ...prev,
        messages: prev.messages.map(m =>
          m.id === userMessage.id ? { ...m, status: 'sent' as const } : m
        ).concat(assistantMessage),
      } : null);
    } catch (error) {
      setSession(prev => prev ? {
        ...prev,
        messages: prev.messages.map(m =>
          m.id === userMessage.id ? { ...m, status: 'error' as const, errorMessage: '메시지 전송에 실패했습니다.' } : m
        ),
      } : null);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !input.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setInput(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
    e.target.value = '';
  };

  const handleRemoveAttachment = (index: number) => {
    setInput(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSuggestionClick = (question: SuggestedQuestion) => {
    setInput(prev => ({ ...prev, content: question.text }));
    textareaRef.current?.focus();
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInfo}>
          <div className={styles.workflowIcon}>
            <WorkflowIcon />
          </div>
          <div className={styles.workflowDetails}>
            <h1 className={styles.workflowName}>{session.workflow.name}</h1>
            <p className={styles.workflowMeta}>
              {t('chat.interactionCount', { count: session.messages.filter(m => m.sender !== 'system').length })}
            </p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.headerButton}
            onClick={() => onNavigate?.('chat-history')}
            title={t('chat.viewHistory')}
          >
            <HistoryIcon />
          </button>
          <button
            className={styles.headerButton}
            title={t('chat.settings')}
          >
            <SettingsIcon />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className={styles.messagesArea}>
        {session.messages.map(message => (
          <MessageItem key={message.id} message={message} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {suggestions.length > 0 && !isTyping && (
        <div className={styles.suggestedQuestions}>
          {suggestions.map(question => (
            <button
              key={question.id}
              className={styles.suggestedQuestion}
              onClick={() => handleSuggestionClick(question)}
            >
              {question.text}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className={styles.inputArea}>
        {input.attachments.length > 0 && (
          <div className={styles.inputAttachments}>
            {input.attachments.map((file, index) => (
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
        <div className={`${styles.inputWrapper} ${isTyping ? styles.disabled : ''}`}>
          <div className={styles.textareaContainer}>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              value={input.content}
              onChange={(e) => setInput(prev => ({ ...prev, content: e.target.value }))}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setInput(prev => ({ ...prev, isComposing: true }))}
              onCompositionEnd={() => setInput(prev => ({ ...prev, isComposing: false }))}
              placeholder={t('chat.inputPlaceholder')}
              disabled={isTyping}
              rows={1}
            />
          </div>
          <div className={styles.inputActions}>
            <button
              className={styles.attachButton}
              onClick={handleAttach}
              disabled={isTyping}
              title={t('chat.attach')}
            >
              <PaperclipIcon />
            </button>
            <button
              className={styles.sendButton}
              onClick={handleSend}
              disabled={isTyping || (!input.content.trim() && input.attachments.length === 0)}
              title={t('chat.send')}
            >
              <SendIcon />
            </button>
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

export type { ChatMessage, ChatSession, MessageSender, MessageStatus, InputState, SuggestedQuestion } from './types';
