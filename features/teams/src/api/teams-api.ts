/**
 * XGEN Teams – API Client
 *
 * 백엔드 /api/teams/* 엔드포인트를 호출하는 함수들.
 * 기존 api-client 패턴 (createApiClient + cookie 토큰)을 따름.
 */

import { createApiClient } from '@xgen/api-client';
import type {
  TeamsRoom,
  TeamsMessage,
  TeamsAgent,
  TeamsMember,
  TeamsNodeStatus,
  ExecutionLog,
  RoutingResult,
  XgenUser,
} from '../types';

// ─────────────────────────────────────────────────────────────
// Live execution log store
// ─────────────────────────────────────────────────────────────
// executeAgentStream이 SSE 스트림 동안 onLog/onNodeStatus를 받아 여기에 쌓고,
// fetchExecutionLog가 우선적으로 이 store에서 조회한다.
const liveExecutionLogs = new Map<string, ExecutionLog>();

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
  const res = await getClient().get<{ success: boolean; data: any[] }>(
    '/api/teams/rooms/list'
  );
  if (!res.data?.data) return [];
  return mapRooms(res.data.data);
}

export async function fetchRoom(roomId: string): Promise<TeamsRoom | null> {
  const res = await getClient().get<{ success: boolean; data: any }>(
    `/api/teams/rooms/${roomId}`
  );
  if (!res.data?.data) return null;
  return mapRoom(res.data.data);
}

export async function createRoom(
  name: string,
  description?: string,
  routerMode: string = 'hybrid',
  llmModel?: string
): Promise<TeamsRoom> {
  const res = await getClient().post<{ success: boolean; data: any }>(
    '/api/teams/rooms/create',
    { name, description, router_mode: routerMode, llm_model: llmModel ?? null }
  );
  return mapRoom(res.data.data);
}

export async function updateRoom(
  roomId: string,
  updates: {
    name?: string;
    description?: string;
    router_mode?: string;
    llm_model?: string;
  }
): Promise<TeamsRoom> {
  const res = await getClient().put<{ success: boolean; data: any }>(
    `/api/teams/rooms/${roomId}`,
    updates
  );
  return mapRoom(res.data.data);
}

// ─────────────────────────────────────────────────────────────
// LLM Models API
// ─────────────────────────────────────────────────────────────

export interface TeamsLLMModel {
  id: string;
  name: string;
  provider: string;
  provider_display_name: string;
  description: string;
  is_default: boolean;
}

export interface AvailableLLMsResponse {
  models: TeamsLLMModel[];
  default_model_id: string;
}

export async function fetchAvailableLLMs(): Promise<AvailableLLMsResponse> {
  try {
    const res = await getClient().get<{
      success: boolean;
      data: AvailableLLMsResponse;
    }>('/api/teams/llm/available');
    return (
      res.data?.data ?? {
        models: [],
        default_model_id: 'claude-haiku-4-5-20251001',
      }
    );
  } catch {
    return { models: [], default_model_id: 'claude-haiku-4-5-20251001' };
  }
}

export async function deleteRoom(roomId: string): Promise<void> {
  await getClient().delete(`/api/teams/rooms/${roomId}`);
}

// ─────────────────────────────────────────────────────────────
// Member API
// ─────────────────────────────────────────────────────────────

export async function fetchMembers(roomId: string): Promise<TeamsMember[]> {
  const res = await getClient().get<{ success: boolean; data: any[] }>(
    `/api/teams/rooms/${roomId}/members`
  );
  return (res.data?.data ?? []).map(mapMember);
}

export async function addMember(
  roomId: string,
  userId: number,
  _username: string,
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
// Xgen User API (검색/초대용)
// ─────────────────────────────────────────────────────────────

/**
 * xgen postgres의 전체 사용자 목록을 가져온다.
 * 현재는 admin 엔드포인트를 재활용 — 추후 일반 사용자용 /api/users/search?q=로 교체 예정.
 */
export async function fetchAllUsers(): Promise<XgenUser[]> {
  try {
    const res = await getClient().get<{ users: any[] }>(
      '/api/admin/user/all-users',
      { params: { page: 1, page_size: 1000 } }
    );
    const users = res.data?.users ?? [];
    return users.map(mapXgenUser);
  } catch {
    return [];
  }
}

function mapXgenUser(u: any): XgenUser {
  return {
    id: Number(u.id),
    username: u.username || u.user_name || `user_${u.id}`,
    email: u.email ?? undefined,
    fullName: u.full_name || u.name || undefined,
  };
}

// ─────────────────────────────────────────────────────────────
// Agent API
// ─────────────────────────────────────────────────────────────

export async function fetchAgents(roomId: string): Promise<TeamsAgent[]> {
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
  roomId: string;
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
  const { agentId, agentName, message, roomId, executionId, liveExecutionId, signal, onData, onNodeStatus, onLog, onEnd, onError } =
    options;

  // 라이브 로그 store 초기화
  if (liveExecutionId) {
    liveExecutionLogs.set(liveExecutionId, {
      id: liveExecutionId,
      roomId: roomId,
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

  const recordNodeStatus = (nodeId: string, status: string, nodeName?: string) => {
    if (!liveExecutionId) return;
    const entry = liveExecutionLogs.get(liveExecutionId);
    if (!entry) return;
    const idx = entry.nodeExecutions.findIndex((n) => n.nodeId === nodeId);
    const now = new Date().toISOString();
    const mapped = mapNodeStatus(status);
    const isTerminal = mapped === 'completed' || mapped === 'error';
    if (idx >= 0) {
      entry.nodeExecutions[idx] = {
        ...entry.nodeExecutions[idx],
        nodeName: nodeName || entry.nodeExecutions[idx].nodeName,
        status: mapped,
        completedAt: isTerminal ? now : entry.nodeExecutions[idx].completedAt,
      };
    } else {
      entry.nodeExecutions.push({
        nodeId,
        nodeName: nodeName || nodeId,
        status: mapped,
        startedAt: now,
        completedAt: isTerminal ? now : undefined,
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

  const token = getAccessToken();

  // xgen-teams backend로 실행 요청 (teams backend가 workflow 프록시 + DB 영속화)
  const response = await fetch(`/api/teams/execute/${encodeURIComponent(agentId)}/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      message,
      room_id: roomId,
      agent_name: agentName || agentId,
      execution_id: executionId || liveExecutionId,
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

        let parsed: any;
        try {
          parsed = JSON.parse(data);
        } catch {
          console.warn('[teams-api] SSE JSON parse failed:', data.substring(0, 200));
          continue;
        }

        if (eventType === 'log') {
          recordLog(parsed);
          onLog?.(parsed);
          if (parsed?.level === 'ERROR' || parsed?.level === 'error') {
            const detail = parsed.message || parsed.detail || 'Execution error';
            finalizeLog('error');
            onError?.(detail);
            return;
          }
          continue;
        }

        if (eventType === 'node_status') {
          recordNodeStatus(parsed.node_id, parsed.status, parsed.node_name);
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
    return JSON.parse(JSON.stringify(live));
  }

  try {
    const res = await getClient().get<{ success: boolean; data: any }>(
      `/api/teams/execution-logs/${executionId}`
    );
    if (!res.data?.data) return null;
    return mapExecutionLog(res.data.data);
  } catch {
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
  try {
    const res = await getClient().get<{ workflows: any[] }>(
      '/api/agentflow/list/detail'
    );
    const workflows = res.data?.workflows ?? [];

    // workflow_id 기준 dedupe
    const byId = new Map<string, any>();
    workflows.forEach((wf: any, i: number) => {
      const key = wf.workflow_id || wf.id || `__idx_${i}`;
      byId.set(key, wf);
    });

    return Array.from(byId.entries()).map(([key, wf], i) => ({
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
  } catch {
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
  const executionId = m.execution_id || m.metadata?.execution_id;
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
    metadata: executionId ? { executionId } : undefined,
    createdAt: m.created_at,
    status: m.status || 'sent',
  };
}

function parseJsonField(value: unknown): any[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapNodeStatus(raw: string): TeamsNodeStatus['status'] {
  if (raw === 'completed' || raw === 'success') return 'completed';
  if (raw === 'error' || raw === 'failed') return 'error';
  return 'running';
}

/**
 * xgen-workflow SSE는 하나의 노드에 대해 `started` / `completed` 이벤트를
 * 각각 배열 아이템으로 저장한다. 동일 node_id 를 하나로 병합하여
 * 최종 상태와 타임스탬프를 결정한다.
 */
function mergeNodeExecutions(raw: any[]): TeamsNodeStatus[] {
  const byId = new Map<string, TeamsNodeStatus>();
  for (const n of raw) {
    const nodeId = n.nodeId || n.node_id || 'unknown';
    const rawStatus = (n.status || '').toString();
    const timestamp = n.timestamp || n.startedAt || n.started_at || n.completedAt || n.completed_at;
    const existing = byId.get(nodeId);
    const isTerminal = rawStatus === 'completed' || rawStatus === 'success'
      || rawStatus === 'error' || rawStatus === 'failed';

    if (!existing) {
      byId.set(nodeId, {
        nodeId,
        nodeName: n.nodeName || n.node_name || nodeId,
        status: mapNodeStatus(rawStatus),
        startedAt: !isTerminal ? timestamp : undefined,
        completedAt: isTerminal ? timestamp : undefined,
      });
      continue;
    }

    // 기존 엔트리 업데이트: terminal 이벤트가 오면 최종 상태/완료시간 반영
    if (isTerminal) {
      existing.status = mapNodeStatus(rawStatus);
      existing.completedAt = timestamp;
    } else if (!existing.startedAt) {
      existing.startedAt = timestamp;
    }
  }
  return Array.from(byId.values());
}

function mapExecutionLog(l: any): ExecutionLog {
  const started = l.started_at ? new Date(l.started_at).getTime() : 0;
  const completed = l.completed_at ? new Date(l.completed_at).getTime() : 0;
  const computedDuration =
    started && completed ? completed - started : undefined;

  return {
    id: l.id,
    roomId: l.room_id,
    messageId: l.message_id,
    agentId: l.agent_id,
    agentName: l.agent_name,
    startedAt: l.started_at,
    completedAt: l.completed_at,
    duration: l.duration_ms ?? computedDuration,
    status: l.status,
    tokenUsage: l.token_input || l.token_output
      ? {
          input: l.token_input || 0,
          output: l.token_output || 0,
          total: (l.token_input || 0) + (l.token_output || 0),
        }
      : undefined,
    nodeExecutions: mergeNodeExecutions(parseJsonField(l.node_executions)),
    rawLogs: parseJsonField(l.raw_logs),
  };
}
