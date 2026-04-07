// Chat History Types
// 이 타입들은 @xgen/types에서 re-export 됩니다.

export type {
  ChatHistoryItem,
  ChatHistoryFilter,
  CurrentChatData,
  ListInteractionsResponse,
  WorkflowDetailResponse,
} from '@xgen/types';

// ─────────────────────────────────────────────────────────────
// API 응답을 ChatHistoryItem으로 변환하는 유틸리티 타입
// ─────────────────────────────────────────────────────────────

export interface ExecutionMeta {
  id: string;
  interaction_id: string;
  workflow_id: string;
  workflow_name: string;
  interaction_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WorkflowDetail {
  user_id?: number;
  workflow_id: string;
  workflow_name: string;
  node_count: number;
  edge_count: number;
  has_startnode: boolean;
  has_endnode: boolean;
  is_completed: boolean;
  is_shared: boolean;
  metadata?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────
// 컴포넌트 Props
// ─────────────────────────────────────────────────────────────

export interface ChatHistoryPageProps {
  onNavigate?: (sectionId: string) => void;
  onSelectChat?: (chat: {
    workflowId: string;
    workflowName: string;
    interactionId: string;
    userId?: number;
  }) => void;
}
