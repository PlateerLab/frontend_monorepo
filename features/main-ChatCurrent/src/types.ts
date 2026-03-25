/**
 * @xgen/main-chat-current 타입 정의
 */

/**
 * 채팅 메시지 발신자 타입
 */
export type MessageSender = 'user' | 'assistant' | 'system';

/**
 * 메시지 상태
 */
export type MessageStatus = 'sending' | 'sent' | 'error' | 'streaming';

/**
 * 첨부 파일 타입
 */
export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  previewUrl?: string;
}

/**
 * 채팅 메시지
 */
export interface ChatMessage {
  /** 메시지 ID */
  id: string;

  /** 발신자 */
  sender: MessageSender;

  /** 메시지 내용 */
  content: string;

  /** HTML 포맷팅된 내용 (마크다운 렌더링용) */
  htmlContent?: string;

  /** 첨부파일 */
  attachments?: MessageAttachment[];

  /** 생성 시간 */
  createdAt: string;

  /** 상태 */
  status: MessageStatus;

  /** 에러 메시지 */
  errorMessage?: string;

  /** 메타데이터 */
  metadata?: {
    tokens?: number;
    model?: string;
    processingTime?: number;
    sources?: string[];
  };
}

/**
 * 채팅 세션
 */
export interface ChatSession {
  /** 세션 ID */
  id: string;

  /** 상호작용 ID */
  interactionId: string;

  /** 워크플로우 정보 */
  workflow: {
    id: string;
    name: string;
    description?: string;
  };

  /** 메시지 목록 */
  messages: ChatMessage[];

  /** 생성 시간 */
  createdAt: string;

  /** 마지막 업데이트 시간 */
  updatedAt: string;

  /** 스트리밍 중인지 여부 */
  isStreaming?: boolean;
}

/**
 * 입력 상태
 */
export interface InputState {
  content: string;
  attachments: File[];
  isComposing: boolean;
}

/**
 * 추천 질문
 */
export interface SuggestedQuestion {
  id: string;
  text: string;
}
