/**
 * @xgen/main-chat-current 타입 정의
 *
 * 현재 진행 중인 채팅 인터페이스를 위한 타입 정의
 */

// Re-export shared types from @xgen/types
export type {
  ChatMessage,
  ChatMessageSender,
  ChatMessageStatus,
  ChatAttachment,
  ChatAgentflow,
  ChatSession,
  CurrentChatData,
  ChatInputState,
  ChatUIState,
  ChatExecutionState,
  SuggestedQuestion,
  StreamMessageChunk,
  SendMessageRequest,
} from '@xgen/types';

// ─────────────────────────────────────────────────────────────
// Local Types
// ─────────────────────────────────────────────────────────────

/**
 * SSE 이벤트 타입
 */
export type SSEEventType = 'message' | 'log' | 'node_status' | 'tool' | 'error' | 'end';

/**
 * SSE 이벤트 데이터
 */
export interface SSEEventData {
  type: 'data' | 'summary' | 'error';
  content?: string;
  data?: {
    outputs?: string[];
    io_id?: number;
    [key: string]: unknown;
  };
  error?: string;
}

/**
 * 노드 상태 이벤트
 */
export interface NodeStatusEvent {
  node_id: string;
  status: 'running' | 'completed' | 'error';
  message?: string;
}

/**
 * 툴 이벤트
 */
export interface ToolEvent {
  type: 'tool_call' | 'tool_result' | 'tool_error';
  tool_name: string;
  input?: unknown;
  output?: unknown;
  error?: string;
}

/**
 * 에이전트플로우 실행 요청
 */
export interface AgentflowExecutionRequest {
  workflow_id: string;
  workflow_name?: string;
  input_data: string;
  interaction_id: string;
  user_id?: number;
  selected_collections?: string[];
  selected_files?: FileInfo[];
  additional_params?: Record<string, unknown>;
}

/**
 * 파일 정보
 */
export interface FileInfo {
  name: string;
  size: number;
  type: string;
  url?: string;
  chunks?: number;
}

/**
 * 채팅 페이지 Props
 */
export interface ChatCurrentPageProps {
  onNavigate?: (sectionId: string) => void;
  onChatEnd?: () => void;
}

/**
 * 메시지 아이템 Props
 */
export interface MessageItemProps {
  message: import('@xgen/types').ChatMessage;
  onRetry?: () => void;
  onViewSource?: (source: unknown) => void;
}

/**
 * 로컬 스토리지에 저장된 현재 채팅 데이터
 */
export interface StoredChatData {
  workflowId: string;
  workflowName: string;
  interactionId: string;
  userId?: number;
  startedAt: string;
}

/**
 * IOLog 응답
 */
export interface IOLog {
  io_id: number;
  interaction_id: string;
  workflow_id: string;
  input_data: string;
  output_data: string;
  created_at: string;
  user_id?: number;
  metadata?: Record<string, unknown>;
}

/**
 * IOLogs 목록 응답
 */
export interface IOLogsResponse {
  logs: IOLog[];
  total_count: number;
}
