/**
 * XGEN Teams – API Client
 *
 * 백엔드 /api/teams/* 엔드포인트를 호출하는 함수들.
 * 기존 api-client 패턴 (createApiClient + cookie 토큰)을 따름.
 *
 * Mock 모드: NEXT_PUBLIC_TEAMS_MOCK=true 환경변수로 활성화
 * 백엔드 없이 UI를 확인할 수 있음.
 */

import { createApiClient } from '@xgen/api-client';
import type {
  TeamsRoom,
  TeamsMessage,
  TeamsAgent,
  TeamsMember,
  ExecutionLog,
  RoutingResult,
} from '../types';
import {
  MOCK_ROOMS,
  MOCK_AGENTS,
  MOCK_MEMBERS,
  MOCK_MESSAGES,
  MOCK_EXECUTION_LOGS,
  mockRouteMessage,
} from './mock-data';

// ─────────────────────────────────────────────────────────────
// Mock Mode
// ─────────────────────────────────────────────────────────────

const IS_MOCK = process.env.NEXT_PUBLIC_TEAMS_MOCK === 'true';
// Room/Message는 mock, Agent 조회/실행은 실제 xgen API 사용
const USE_REAL_AGENTS = process.env.NEXT_PUBLIC_TEAMS_REAL_AGENTS !== 'false';

// Mock용 in-memory store (방/메시지 CRUD가 세션 동안 유지됨)
const mockStore = {
  rooms: [...MOCK_ROOMS],
  messages: Object.fromEntries(
    Object.entries(MOCK_MESSAGES).map(([k, v]) => [k, [...v]])
  ) as Record<string, TeamsMessage[]>,
};

// 실시간 SSE 실행 로그 누적 store
// executeAgentStream이 SSE 스트림 동안 onLog/onNodeStatus를 받아 여기에 쌓고,
// fetchExecutionLog가 우선적으로 이 store에서 조회한다 (mock/teams 백엔드 의존 X).
const liveExecutionLogs = new Map<string, ExecutionLog>();

function delay(ms: number = 300): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─────────────────────────────────────────────────────────────
// Client
// ─────────────────────────────────────────────────────────────

function getClient() {
  return createApiClient({ service: 'core' });
}

function getAccessToken(): string | null {
  if (typeof document === 'undefined') return null;
  return document.cookie.match(/xgen_access_token=([^;]+)/)?.[1] ?? null;
}

// ─────────────────────────────────────────────────────────────
// Room API
// ─────────────────────────────────────────────────────────────

export async function fetchRooms(): Promise<TeamsRoom[]> {
  if (IS_MOCK) {
    await delay();
    return mockStore.rooms;
  }
  const res = await getClient().get<{ success: boolean; data: any[] }>(
    '/api/teams/rooms/list'
  );
  if (!res.data?.data) return [];
  return mapRooms(res.data.data);
}

export async function fetchRoom(roomId: string): Promise<TeamsRoom | null> {
  if (IS_MOCK) {
    await delay();
    return mockStore.rooms.find((r) => r.id === roomId) ?? null;
  }
  const res = await getClient().get<{ success: boolean; data: any }>(
    `/api/teams/rooms/${roomId}`
  );
  if (!res.data?.data) return null;
  return mapRoom(res.data.data);
}

export async function createRoom(
  name: string,
  description?: string,
  routerMode: string = 'hybrid'
): Promise<TeamsRoom> {
  if (IS_MOCK) {
    await delay();
    const newRoom: TeamsRoom = {
      id: `room_${Date.now()}`,
      name,
      description,
      agents: [],
      members: [MOCK_MEMBERS[0]],
      routerConfig: {
        mode: routerMode as any,
        llmModel: 'claude-haiku-4-5-20251001',
        confidenceThreshold: 0.7,
        fallbackAction: 'ask_user',
      },
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
      unreadCount: 0,
    };
    mockStore.rooms.unshift(newRoom);
    mockStore.messages[newRoom.id] = [];
    return newRoom;
  }
  const res = await getClient().post<{ success: boolean; data: any }>(
    '/api/teams/rooms/create',
    { name, description, router_mode: routerMode }
  );
  return mapRoom(res.data.data);
}

export async function updateRoom(
  roomId: string,
  updates: { name?: string; description?: string; router_mode?: string }
): Promise<TeamsRoom> {
  const res = await getClient().put<{ success: boolean; data: any }>(
    `/api/teams/rooms/${roomId}`,
    updates
  );
  return mapRoom(res.data.data);
}

export async function deleteRoom(roomId: string): Promise<void> {
  if (IS_MOCK) {
    await delay();
    mockStore.rooms = mockStore.rooms.filter((r) => r.id !== roomId);
    delete mockStore.messages[roomId];
    return;
  }
  await getClient().delete(`/api/teams/rooms/${roomId}`);
}

// ─────────────────────────────────────────────────────────────
// Member API
// ─────────────────────────────────────────────────────────────

export async function fetchMembers(roomId: string): Promise<TeamsMember[]> {
  if (IS_MOCK) {
    await delay(100);
    const room = mockStore.rooms.find((r) => r.id === roomId);
    return room?.members ?? [];
  }
  const res = await getClient().get<{ success: boolean; data: any[] }>(
    `/api/teams/rooms/${roomId}/members`
  );
  return (res.data?.data ?? []).map(mapMember);
}

export async function addMember(
  roomId: string,
  userId: number,
  role: string = 'member'
): Promise<void> {
  await getClient().post(`/api/teams/rooms/${roomId}/members`, {
    user_id: userId,
    role,
  });
}

export async function removeMember(
  roomId: string,
  userId: number
): Promise<void> {
  await getClient().delete(`/api/teams/rooms/${roomId}/members/${userId}`);
}

// ─────────────────────────────────────────────────────────────
// Agent API
// ─────────────────────────────────────────────────────────────

export async function fetchAgents(roomId: string): Promise<TeamsAgent[]> {
  if (IS_MOCK) {
    await delay(100);
    const room = mockStore.rooms.find((r) => r.id === roomId);
    return room?.agents ?? [];
  }
  const res = await getClient().get<{ success: boolean; data: any[] }>(
    `/api/teams/rooms/${roomId}/agents`
  );
  return (res.data?.data ?? []).map(mapAgent);
}

export async function addAgent(
  roomId: string,
  agentId: string,
  name: string,
  description: string = '',
  color: string = '#6264A7'
): Promise<void> {
  if (IS_MOCK) {
    await delay(200);
    // mockStore와 동기화 — 라우팅이 mockStore.rooms.agents를 보기 때문에 필수
    const room = mockStore.rooms.find((r) => r.id === roomId);
    if (room && !room.agents.some((a) => a.id === agentId)) {
      room.agents = [
        ...room.agents,
        {
          id: agentId,
          name,
          description,
          status: 'online',
          color,
          stats: { totalExecutions: 0, avgResponseTime: 0 },
        },
      ];
    }
    return;
  }
  await getClient().post(`/api/teams/rooms/${roomId}/agents`, {
    agent_id: agentId,
    name,
    description,
    color,
  });
}

export async function removeAgent(
  roomId: string,
  agentId: string
): Promise<void> {
  if (IS_MOCK) {
    await delay(200);
    const room = mockStore.rooms.find((r) => r.id === roomId);
    if (room) {
      room.agents = room.agents.filter((a) => a.id !== agentId);
    }
    return;
  }
  await getClient().delete(`/api/teams/rooms/${roomId}/agents/${agentId}`);
}

// ─────────────────────────────────────────────────────────────
// Message API
// ─────────────────────────────────────────────────────────────

export async function fetchMessages(
  roomId: string,
  limit: number = 50,
  before?: string
): Promise<TeamsMessage[]> {
  if (IS_MOCK) {
    await delay(200);
    return mockStore.messages[roomId] ?? [];
  }
  const params: Record<string, string | number> = { limit };
  if (before) params.before = before;

  const res = await getClient().get<{ success: boolean; data: any[] }>(
    `/api/teams/rooms/${roomId}/messages`,
    { params }
  );
  return (res.data?.data ?? []).map(mapMessage);
}

export async function sendMessage(
  roomId: string,
  content: string,
  mentionedAgentIds?: string[]
): Promise<{ message: TeamsMessage; routing: RoutingResult }> {
  if (IS_MOCK) {
    await delay(200);
    const room = mockStore.rooms.find((r) => r.id === roomId);
    const msg: TeamsMessage = {
      id: `msg_${Date.now()}`,
      roomId,
      sender: { type: 'user', id: '1', name: 'admin' },
      content,
      type: 'user',
      createdAt: new Date().toISOString(),
      status: 'sent',
    };
    if (!mockStore.messages[roomId]) mockStore.messages[roomId] = [];
    mockStore.messages[roomId].push(msg);
    const routing = mockRouteMessage(content, room?.agents ?? []);
    return { message: msg, routing };
  }
  const res = await getClient().post<{
    success: boolean;
    data: { message: any; routing: any };
  }>(`/api/teams/rooms/${roomId}/messages`, {
    content,
    mentioned_agent_ids: mentionedAgentIds,
  });

  const rawRouting = res.data.data.routing;
  return {
    message: mapMessage(res.data.data.message),
    routing: {
      method: rawRouting.reason?.includes('mention') ? 'mention'
        : rawRouting.reason?.includes('Single') ? 'single'
        : rawRouting.reason?.includes('LLM') ? 'llm'
        : 'none',
      targets: (rawRouting.agents ?? []).map((a: any) => ({
        agentId: a.agent_id,
        agentName: a.agent_name,
        confidence: a.confidence ?? 1.0,
        reason: rawRouting.reason ?? '',
      })),
    } as RoutingResult,
  };
}

// ─────────────────────────────────────────────────────────────
// Execution Streaming (SSE)
// ─────────────────────────────────────────────────────────────

export interface ExecuteAgentStreamOptions {
  agentId: string;
  agentName?: string;
  message: string;
  executionId?: string;
  /**
   * 라이브 로그 누적 키. 호출자가 메시지 ID 등을 넘기면, 이 함수가 SSE 동안
   * 받은 log/node_status 이벤트를 liveExecutionLogs[liveExecutionId]에 쌓는다.
   * 이후 fetchExecutionLog(liveExecutionId)로 조회 가능.
   */
  liveExecutionId?: string;
  signal?: AbortSignal;
  onData?: (content: string) => void;
  onNodeStatus?: (nodeId: string, status: string) => void;
  onLog?: (log: any) => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export async function executeAgentStream(
  options: ExecuteAgentStreamOptions
): Promise<void> {
  const { agentId, agentName, message, executionId, liveExecutionId, signal, onData, onNodeStatus, onLog, onEnd, onError } =
    options;

  // 라이브 로그 store 초기화
  if (liveExecutionId) {
    liveExecutionLogs.set(liveExecutionId, {
      id: liveExecutionId,
      roomId: '',
      messageId: liveExecutionId,
      agentId,
      agentName: agentName || agentId,
      startedAt: new Date().toISOString(),
      status: 'running',
      nodeExecutions: [],
      rawLogs: [],
    });
  }

  const recordLog = (log: any) => {
    if (!liveExecutionId) return;
    const entry = liveExecutionLogs.get(liveExecutionId);
    if (!entry) return;
    entry.rawLogs.push({
      timestamp: log?.timestamp || new Date().toISOString(),
      level: (log?.level || 'info').toLowerCase(),
      message: log?.message || (typeof log === 'string' ? log : JSON.stringify(log)),
    });
  };

  const recordNodeStatus = (nodeId: string, status: string) => {
    if (!liveExecutionId) return;
    const entry = liveExecutionLogs.get(liveExecutionId);
    if (!entry) return;
    const idx = entry.nodeExecutions.findIndex((n) => n.nodeId === nodeId);
    const now = new Date().toISOString();
    if (idx >= 0) {
      entry.nodeExecutions[idx] = {
        ...entry.nodeExecutions[idx],
        status: status as any,
        completedAt: status === 'completed' || status === 'failed' ? now : entry.nodeExecutions[idx].completedAt,
      };
    } else {
      entry.nodeExecutions.push({
        nodeId,
        nodeName: nodeId,
        status: status as any,
        startedAt: now,
      });
    }
  };

  const finalizeLog = (status: 'completed' | 'error') => {
    if (!liveExecutionId) return;
    const entry = liveExecutionLogs.get(liveExecutionId);
    if (!entry) return;
    entry.status = status;
    entry.completedAt = new Date().toISOString();
    entry.duration = new Date(entry.completedAt).getTime() - new Date(entry.startedAt).getTime();
  };

  if (IS_MOCK && !USE_REAL_AGENTS) {
    // Mock: 타이핑 효과로 응답 시뮬레이션
    const mockResponses: Record<string, string> = {
      agent_001: '문서를 검색하여 관련 내용을 찾았습니다.\n\n검색된 문서 3건을 기반으로 답변드리겠습니다.\n\n요청하신 내용에 대한 분석 결과, 해당 기능은 현재 설계 문서의 섹션 3.2에 명시되어 있으며, API 엔드포인트와 데이터 모델이 정의되어 있습니다.',
      agent_002: '코드를 분석했습니다.\n\n전반적으로 코드 품질이 양호합니다. 몇 가지 개선 사항을 제안드립니다:\n\n1. 타입 안정성 향상을 위해 `any` 타입 사용을 줄이세요\n2. 에러 핸들링 패턴을 통일하세요\n3. 매직 넘버를 상수로 추출하세요',
      agent_003: '데이터 분석을 완료했습니다.\n\n주요 지표:\n- 전체 데이터 건수: 15,234건\n- 평균값: 72.3\n- 표준편차: 12.8\n- 이상치: 23건 (0.15%)\n\n전반적으로 데이터 품질이 양호하며, 이상치는 추가 검토가 필요합니다.',
      agent_004: '번역을 완료했습니다.\n\n원문의 의미를 최대한 보존하면서 자연스러운 표현으로 번역했습니다. 전문 용어는 업계 표준 번역을 적용했습니다.',
      agent_005: '보고서를 생성했습니다.\n\n## 보고서 요약\n\n주요 항목별 분석 결과를 정리했습니다. 상세 내용은 첨부된 보고서를 참고해주세요.',
    };
    const responseText = mockResponses[agentId] ?? '요청을 처리했습니다. 결과를 확인해주세요.';

    // 노드 실행 시뮬레이션
    const nodes = ['Input Parser', 'Processor', 'Output Generator'];
    for (let i = 0; i < nodes.length; i++) {
      await delay(400);
      if (signal?.aborted) { onEnd?.(); return; }
      onNodeStatus?.(nodes[i], 'running');
      await delay(600);
      if (signal?.aborted) { onEnd?.(); return; }
      onNodeStatus?.(nodes[i], 'completed');
    }

    // 타이핑 효과
    let accumulated = '';
    const words = responseText.split(' ');
    for (const word of words) {
      await delay(50);
      if (signal?.aborted) { onEnd?.(); return; }
      accumulated += (accumulated ? ' ' : '') + word;
      onData?.(accumulated);
    }

    onEnd?.();
    return;
  }

  const token = getAccessToken();

  // 실제 xgen agentflow 실행 엔드포인트 사용
  // agentId = workflow_id, agentName은 별도로 조회 필요
  const response = await fetch('/api/agentflow/execute/based-id/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      workflow_id: agentId,
      workflow_name: agentName || agentId,
      input_data: message,
    }),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Execution failed: ${response.status} ${errText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';
  let accumulatedContent = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() ?? '';

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

        if (!data || data === '[DONE]') continue;

        // JSON.parse만 좁게 try (구조적 파싱 에러만 무시)
        let parsed: any;
        try {
          parsed = JSON.parse(data);
        } catch {
          // malformed JSON 라인은 skip (로그만)
          console.warn('[teams-api] SSE JSON parse failed:', data.substring(0, 200));
          continue;
        }

        if (eventType === 'log') {
          recordLog(parsed);
          onLog?.(parsed);
          // log 이벤트도 ERROR level이면 에러로 간주
          if (parsed?.level === 'ERROR' || parsed?.level === 'error') {
            const detail = parsed.message || parsed.detail || 'Execution error';
            finalizeLog('error');
            onError?.(detail);
            return;
          }
          continue;
        }

        if (eventType === 'node_status') {
          recordNodeStatus(parsed.node_id, parsed.status);
          onNodeStatus?.(parsed.node_id, parsed.status);
          continue;
        }

        const type = parsed.type;
        if (type === 'data') {
          accumulatedContent += parsed.content ?? '';
          onData?.(accumulatedContent);
        } else if (type === 'summary') {
          const output = parsed.data?.outputs?.[0];
          if (output) {
            accumulatedContent += typeof output === 'string' ? output : JSON.stringify(output);
            onData?.(accumulatedContent);
          }
        } else if (type === 'end') {
          finalizeLog('completed');
          onEnd?.();
          return;
        } else if (type === 'error') {
          // 에러는 throw 대신 onError 직접 호출 후 종료 (control flow를 단순화)
          const detail = parsed.detail || parsed.message || 'Execution error';
          finalizeLog('error');
          onError?.(detail);
          return;
        }
      }
    }

    finalizeLog('completed');
    onEnd?.();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      finalizeLog('completed');
      onEnd?.();
    } else {
      finalizeLog('error');
      onError?.(err.message || 'Execution failed');
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Execution Log API
// ─────────────────────────────────────────────────────────────

export async function fetchExecutionLog(
  executionId: string
): Promise<ExecutionLog | null> {
  // 1순위: SSE 동안 누적된 라이브 로그
  const live = liveExecutionLogs.get(executionId);
  if (live) {
    // 깊은 복사로 반환 (이후 SSE가 더 push해도 viewer가 흔들리지 않게)
    return JSON.parse(JSON.stringify(live));
  }

  if (IS_MOCK) {
    await delay(300);
    return MOCK_EXECUTION_LOGS[executionId] ?? null;
  }
  try {
    const res = await getClient().get<{ success: boolean; data: any }>(
      `/api/teams/execution-logs/${executionId}`
    );
    if (!res.data?.data) return null;
    return mapExecutionLog(res.data.data);
  } catch {
    // teams 백엔드가 없으면 mock 폴백
    if (IS_MOCK) return MOCK_EXECUTION_LOGS[executionId] ?? null;
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Routing API (standalone)
// ─────────────────────────────────────────────────────────────

export async function routeMessage(
  message: string,
  agents: { id: string; name: string; description: string }[]
): Promise<RoutingResult> {
  const res = await getClient().post<RoutingResult>('/api/teams/route', {
    message,
    agents: agents.map((a) => ({
      agent_id: a.id,
      name: a.name,
      description: a.description,
    })),
  });
  return res.data;
}

// ─────────────────────────────────────────────────────────────
// Available Workflows (from agentflow API)
// ─────────────────────────────────────────────────────────────

export async function fetchAvailableWorkflows(): Promise<TeamsAgent[]> {
  if (IS_MOCK && !USE_REAL_AGENTS) {
    await delay(200);
    return MOCK_AGENTS;
  }
  try {
    const res = await getClient().get<{ workflows: any[] }>(
      '/api/agentflow/list/detail'
    );
    const workflows = res.data?.workflows ?? [];

    // 디버깅: xgen이 내려주는 원본 구조 한 번 확인
    if (typeof window !== 'undefined') {
      console.debug('[teams] raw workflows from xgen:', workflows);
    }

    // workflow_id 기준 dedupe — 같은 id가 여러 번 오는 경우(버전 row 등) 마지막 것만 유지
    const byId = new Map<string, any>();
    workflows.forEach((wf: any, i: number) => {
      const key = wf.workflow_id || wf.id || `__idx_${i}`;
      byId.set(key, wf);
    });

    const mapped = Array.from(byId.entries()).map(([key, wf], i) => ({
      id: key,
      name: wf.workflow_name || wf.name || 'Unnamed',
      description: wf.description || '',
      status: 'online' as const,
      color: AGENT_COLORS[i % AGENT_COLORS.length],
      stats: {
        totalExecutions: 0,
        avgResponseTime: 0,
      },
    }));

    // 실제 워크플로우가 없으면 mock 폴백
    if (mapped.length === 0 && IS_MOCK) return MOCK_AGENTS;
    return mapped;
  } catch {
    // 실제 API 실패 시 mock 데이터 폴백
    if (IS_MOCK) return MOCK_AGENTS;
    return [];
  }
}

const AGENT_COLORS = [
  '#6264A7', '#E74856', '#0078D4', '#00B294', '#FF8C00',
  '#8764B8', '#008272', '#C239B3', '#486860', '#DA3B01',
];

// ─────────────────────────────────────────────────────────────
// Mappers (backend snake_case → frontend camelCase)
// ─────────────────────────────────────────────────────────────

function mapRoom(r: any): TeamsRoom {
  return {
    id: r.id,
    name: r.name,
    description: r.description || undefined,
    agents: [],
    members: [],
    routerConfig: {
      mode: r.router_mode || 'hybrid',
      llmModel: r.llm_model || 'claude-haiku-4-5-20251001',
      confidenceThreshold: r.confidence_threshold ?? 0.7,
      fallbackAction: r.fallback_action || 'ask_user',
    },
    createdAt: r.created_at,
    createdBy: r.created_by,
    lastMessageAt: r.last_message_at || undefined,
    unreadCount: r.unread_count ?? 0,
  };
}

function mapRooms(data: any[]): TeamsRoom[] {
  return data.map(mapRoom);
}

function mapMember(m: any): TeamsMember {
  return {
    userId: m.user_id,
    username: m.username || `User-${m.user_id}`,
    role: m.role || 'member',
    isOnline: m.is_online ?? false,
    joinedAt: m.joined_at,
  };
}

function mapAgent(a: any): TeamsAgent {
  return {
    id: a.agent_id || a.id,
    name: a.name,
    description: a.description || '',
    status: a.status || 'online',
    color: a.color || '#6264A7',
    stats: {
      totalExecutions: 0,
      avgResponseTime: 0,
    },
  };
}

function mapMessage(m: any): TeamsMessage {
  return {
    id: m.id,
    roomId: m.room_id,
    sender: {
      type: m.sender_type,
      id: m.sender_id,
      name: m.sender_name,
      color: m.sender_color,
    },
    content: m.content,
    type: m.sender_type,
    metadata: m.metadata ? {
      executionId: m.execution_id || m.metadata?.execution_id,
    } : undefined,
    createdAt: m.created_at,
    status: m.status || 'sent',
  };
}

function mapExecutionLog(l: any): ExecutionLog {
  return {
    id: l.id,
    roomId: l.room_id,
    messageId: l.message_id,
    agentId: l.agent_id,
    agentName: l.agent_name,
    startedAt: l.started_at,
    completedAt: l.completed_at,
    duration: l.duration_ms,
    status: l.status,
    tokenUsage: l.token_input || l.token_output
      ? {
          input: l.token_input || 0,
          output: l.token_output || 0,
          total: (l.token_input || 0) + (l.token_output || 0),
        }
      : undefined,
    nodeExecutions: l.node_executions || [],
    rawLogs: l.raw_logs || [],
  };
}
