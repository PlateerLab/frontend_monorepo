/**
 * XGEN Teams – TypeScript 타입 정의
 *
 * 백엔드 snake_case 필드는 API 클라이언트 mapper에서 camelCase로 변환됨.
 * 프론트엔드에서는 항상 camelCase 사용.
 */

// ─────────────────────────────────────────────────────────────
// Room
// ─────────────────────────────────────────────────────────────

/** 라우터 설정 (방 단위) */
export interface RouterConfig {
  /** routing 모드: hybrid(@mention + LLM), manual(사용자 선택), auto(LLM only) */
  mode: 'hybrid' | 'manual' | 'auto';
  /** LLM 라우팅에 사용할 모델 */
  llmModel: string;
  /** LLM confidence threshold (0~1) */
  confidenceThreshold: number;
  /** confidence 미달 시 동작 */
  fallbackAction: 'ask_user' | 'broadcast' | 'skip';
}

/** 팀즈 채팅방 */
export interface TeamsRoom {
  id: string;
  name: string;
  description?: string;
  agents: TeamsAgent[];
  members: TeamsMember[];
  routerConfig: RouterConfig;
  createdAt: string;
  createdBy: string;
  lastMessageAt?: string;
  unreadCount: number;
}

// ─────────────────────────────────────────────────────────────
// Member & Agent
// ─────────────────────────────────────────────────────────────

/** 방 멤버 (사용자) */
export interface TeamsMember {
  userId: number;
  username: string;
  role: 'owner' | 'admin' | 'member';
  isOnline: boolean;
  joinedAt: string;
}

/** AI 에이전트 (워크플로우 기반) */
export interface TeamsAgent {
  id: string;
  name: string;
  description: string;
  status: 'online' | 'offline' | 'busy';
  color: string;
  stats: {
    totalExecutions: number;
    avgResponseTime: number;
  };
}

// ─────────────────────────────────────────────────────────────
// Xgen User (검색/초대용)
// ─────────────────────────────────────────────────────────────

/** xgen postgres users 테이블에서 가져온 사용자 */
export interface XgenUser {
  id: number;
  username: string;
  email?: string;
  fullName?: string;
}

// ─────────────────────────────────────────────────────────────
// Message
// ─────────────────────────────────────────────────────────────

/** 메시지 발신자 */
export interface TeamsSender {
  type: 'user' | 'agent' | 'system';
  id: string;
  name: string;
  color?: string;
}

/** 메시지 메타데이터 (실행 추적) */
export interface TeamsMessageMetadata {
  executionId?: string;
}

/** 채팅 메시지 */
export interface TeamsMessage {
  id: string;
  roomId: string;
  sender: TeamsSender;
  content: string;
  type: 'user' | 'agent' | 'system';
  metadata?: TeamsMessageMetadata;
  createdAt: string;
  status: 'sending' | 'sent' | 'streaming' | 'error';
}

// ─────────────────────────────────────────────────────────────
// Routing
// ─────────────────────────────────────────────────────────────

/** 라우팅 대상 에이전트 */
export interface RoutingTarget {
  agentId: string;
  agentName: string;
  confidence: number;
  reason: string;
}

/** 라우팅 결과 */
export interface RoutingResult {
  method: 'mention' | 'llm' | 'single' | 'manual' | 'none';
  targets: RoutingTarget[];
  rawResponse?: string;
}

// ─────────────────────────────────────────────────────────────
// Execution
// ─────────────────────────────────────────────────────────────

/** 노드 실행 상태 */
export interface TeamsNodeStatus {
  nodeId: string;
  nodeName: string;
  status: 'running' | 'completed' | 'error';
  startedAt?: string;
  completedAt?: string;
}

/** 실행 로그 */
export interface ExecutionLog {
  id: string;
  roomId: string;
  messageId: string;
  agentId: string;
  agentName: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  status: 'running' | 'completed' | 'error';
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
  };
  nodeExecutions: TeamsNodeStatus[];
  rawLogs: unknown[];
}

// ─────────────────────────────────────────────────────────────
// Sidebar / UI
// ─────────────────────────────────────────────────────────────

export type TeamsSidebarFilter = 'all' | 'active' | 'archived';

/** 에이전트 색상 팔레트 */
export const AGENT_COLORS = [
  '#6264A7', '#E74856', '#0078D4', '#00B294', '#FF8C00',
  '#8764B8', '#008272', '#C239B3', '#486860', '#DA3B01',
] as const;
