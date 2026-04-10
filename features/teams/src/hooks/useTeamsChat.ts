'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { TeamsMessage, TeamsAgent, RoutingResult, TeamsNodeStatus } from '../types';
import * as teamsApi from '../api/teams-api';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface UseTeamsChatReturn {
  messages: TeamsMessage[];
  isExecuting: boolean;
  streamingAgentIds: string[];
  nodeStatuses: Map<string, TeamsNodeStatus[]>;
  sendMessage: (content: string, mentionedAgentIds?: string[]) => Promise<void>;
  stopExecution: () => void;
  retryMessage: (messageId: string) => void;
  clearMessages: () => void;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const generateId = (): string =>
  `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

export function useTeamsChat(
  roomId: string | null,
  agents: TeamsAgent[],
  userId?: number,
  username?: string
): UseTeamsChatReturn {
  const [messages, setMessages] = useState<TeamsMessage[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [streamingAgentIds, setStreamingAgentIds] = useState<string[]>([]);
  const [nodeStatuses, setNodeStatuses] = useState<Map<string, TeamsNodeStatus[]>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  // ─── 방 변경 시 메시지 히스토리 로드 ───
  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    async function loadMessages() {
      try {
        const fetched = await teamsApi.fetchMessages(roomId!);
        if (!cancelled) {
          setMessages(fetched);
        }
      } catch {
        // 메시지 로드 실패 시 빈 상태 유지
      }
    }

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [roomId]);

  // ─── 에이전트 실행 (SSE 스트리밍) ───
  const executeAgent = useCallback(
    async (agent: TeamsAgent, userMessage: string, executionId?: string) => {
      if (!roomId) return;

      // 에이전트 placeholder 메시지 추가
      const agentMsgId = generateId();
      const agentMessage: TeamsMessage = {
        id: agentMsgId,
        roomId,
        sender: {
          type: 'agent',
          id: agent.id,
          name: agent.name,
          color: agent.color,
        },
        content: '',
        type: 'agent',
        metadata: executionId ? { executionId } : undefined,
        createdAt: new Date().toISOString(),
        status: 'streaming',
      };

      setMessages((prev) => [...prev, agentMessage]);
      setStreamingAgentIds((prev) => [...prev, agent.id]);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        await teamsApi.executeAgentStream({
          agentId: agent.id,
          message: userMessage,
          executionId,
          signal: abortController.signal,
          onData: (content) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === agentMsgId ? { ...m, content } : m
              )
            );
          },
          onNodeStatus: (nodeId, status) => {
            setNodeStatuses((prev) => {
              const next = new Map(prev);
              const existing = next.get(agentMsgId) || [];
              const idx = existing.findIndex((n) => n.nodeId === nodeId);
              const node: TeamsNodeStatus = {
                nodeId,
                nodeName: nodeId,
                status: status as TeamsNodeStatus['status'],
              };
              if (idx >= 0) {
                existing[idx] = node;
              } else {
                existing.push(node);
              }
              next.set(agentMsgId, [...existing]);
              return next;
            });
          },
          onLog: () => {
            // 로그는 LogViewer에서 별도 조회
          },
          onEnd: () => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === agentMsgId ? { ...m, status: 'sent' as const } : m
              )
            );
            setStreamingAgentIds((prev) => prev.filter((id) => id !== agent.id));
          },
          onError: (error) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === agentMsgId
                  ? { ...m, content: error, status: 'error' as const }
                  : m
              )
            );
            setStreamingAgentIds((prev) => prev.filter((id) => id !== agent.id));
          },
        });
      } catch (err: any) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === agentMsgId
              ? { ...m, content: err.message || 'Execution failed', status: 'error' as const }
              : m
          )
        );
        setStreamingAgentIds((prev) => prev.filter((id) => id !== agent.id));
      }
    },
    [roomId]
  );

  // ─── 메시지 전송 + 라우팅 + 에이전트 실행 ───
  const sendMessage = useCallback(
    async (content: string, mentionedAgentIds?: string[]) => {
      if (!roomId || !content.trim()) return;

      setIsExecuting(true);

      // 사용자 메시지 (optimistic UI)
      const userMsgId = generateId();
      const userMessage: TeamsMessage = {
        id: userMsgId,
        roomId,
        sender: {
          type: 'user',
          id: String(userId || 0),
          name: username || 'User',
        },
        content,
        type: 'user',
        createdAt: new Date().toISOString(),
        status: 'sending',
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        // 백엔드에 메시지 전송 → 라우팅 결과 반환
        const { message: savedMessage, routing } = await teamsApi.sendMessage(
          roomId,
          content,
          mentionedAgentIds
        );

        // 저장된 메시지로 교체
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMsgId ? { ...savedMessage, status: 'sent' as const } : m
          )
        );

        // 라우팅 결과에 따라 에이전트 실행
        if (routing.targets.length > 0) {
          const execPromises = routing.targets.map((target) => {
            const agent = agents.find((a) => a.id === target.agentId);
            if (!agent) return Promise.resolve();
            return executeAgent(agent, content, savedMessage.metadata?.executionId);
          });
          await Promise.all(execPromises);
        }
      } catch (err: any) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMsgId
              ? { ...m, status: 'error' as const }
              : m
          )
        );
      } finally {
        setIsExecuting(false);
      }
    },
    [roomId, userId, username, agents, executeAgent]
  );

  // ─── 실행 중지 ───
  const stopExecution = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsExecuting(false);
    setStreamingAgentIds([]);

    // streaming 상태인 메시지를 sent로 변경
    setMessages((prev) =>
      prev.map((m) =>
        m.status === 'streaming' ? { ...m, status: 'sent' as const } : m
      )
    );
  }, []);

  // ─── 메시지 재시도 ───
  const retryMessage = useCallback(
    (messageId: string) => {
      const msg = messages.find((m) => m.id === messageId);
      if (!msg || msg.type !== 'user') return;

      // 실패한 메시지와 이후 에이전트 응답 제거
      const msgIndex = messages.findIndex((m) => m.id === messageId);
      setMessages((prev) => prev.slice(0, msgIndex));

      // 재전송
      sendMessage(msg.content);
    },
    [messages, sendMessage]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setNodeStatuses(new Map());
  }, []);

  return {
    messages,
    isExecuting,
    streamingAgentIds,
    nodeStatuses,
    sendMessage,
    stopExecution,
    retryMessage,
    clearMessages,
  };
}
