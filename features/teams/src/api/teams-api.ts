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
  ExecutionLog,
  RoutingResult,
} from '../types';

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
  routerMode: string = 'hybrid'
): Promise<TeamsRoom> {
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
  message: string;
  executionId?: string;
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
  const { agentId, message, executionId, signal, onData, onNodeStatus, onLog, onEnd, onError } =
    options;

  const token = getAccessToken();

  const response = await fetch(`/api/teams/execute/${agentId}/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, execution_id: executionId }),
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

        try {
          const parsed = JSON.parse(data);

          if (eventType === 'log') {
            onLog?.(parsed);
          } else if (eventType === 'node_status') {
            onNodeStatus?.(parsed.node_id, parsed.status);
          } else {
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
              onEnd?.();
              return;
            } else if (type === 'error') {
              throw new Error(parsed.detail || 'Execution error');
            }
          }
        } catch (parseErr) {
          if (parseErr instanceof Error && parseErr.message.includes('Execution')) {
            throw parseErr;
          }
        }
      }
    }

    onEnd?.();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      onEnd?.();
    } else {
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
  const res = await getClient().get<{ success: boolean; data: any }>(
    `/api/teams/execution-logs/${executionId}`
  );
  if (!res.data?.data) return null;
  return mapExecutionLog(res.data.data);
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
    return workflows.map((wf: any, i: number) => ({
      id: wf.workflow_id || wf.id || String(i),
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
