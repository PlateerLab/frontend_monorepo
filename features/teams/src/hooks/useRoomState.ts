'use client';

import { useState, useCallback, useEffect } from 'react';
import type { TeamsRoom, TeamsAgent, TeamsMember, XgenUser } from '../types';
import * as teamsApi from '../api/teams-api';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface UseRoomStateReturn {
  rooms: TeamsRoom[];
  currentRoom: TeamsRoom | null;
  availableWorkflows: TeamsAgent[];
  loading: boolean;
  error: string | null;
  selectRoom: (roomId: string) => void;
  createRoom: (name: string, description?: string) => Promise<void>;
  deleteRoom: (roomId: string) => Promise<void>;
  refreshRooms: () => Promise<void>;
  addAgentToRoom: (roomId: string, agent: TeamsAgent) => Promise<void>;
  removeAgentFromRoom: (roomId: string, agentId: string) => Promise<void>;
  inviteMember: (roomId: string, user: XgenUser) => Promise<void>;
  removeMember: (roomId: string, userId: number) => Promise<void>;
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

export function useRoomState(): UseRoomStateReturn {
  const [rooms, setRooms] = useState<TeamsRoom[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [availableWorkflows, setAvailableWorkflows] = useState<TeamsAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentRoom = rooms.find((r) => r.id === currentRoomId) ?? null;

  // ─── 초기 데이터 로드 ───
  const loadRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedRooms = await teamsApi.fetchRooms();
      setRooms(fetchedRooms);
    } catch (err: any) {
      setError(err.message || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWorkflows = useCallback(async () => {
    try {
      const workflows = await teamsApi.fetchAvailableWorkflows();
      setAvailableWorkflows(workflows);
    } catch {
      // 워크플로우 로드 실패는 치명적이지 않음
    }
  }, []);

  useEffect(() => {
    loadRooms();
    loadWorkflows();
  }, [loadRooms, loadWorkflows]);

  // ─── 방 선택 시 멤버/에이전트 로드 ───
  useEffect(() => {
    if (!currentRoomId) return;

    async function loadRoomDetails() {
      try {
        const [members, agents] = await Promise.all([
          teamsApi.fetchMembers(currentRoomId!),
          teamsApi.fetchAgents(currentRoomId!),
        ]);

        setRooms((prev) =>
          prev.map((r) =>
            r.id === currentRoomId ? { ...r, members, agents } : r
          )
        );
      } catch {
        // 디테일 로드 실패는 UI에 영향 없음
      }
    }

    loadRoomDetails();
  }, [currentRoomId]);

  // ─── Actions ───

  const selectRoom = useCallback((roomId: string) => {
    setCurrentRoomId(roomId);
  }, []);

  const createRoom = useCallback(
    async (name: string, description?: string, llmModel?: string) => {
      try {
        const newRoom = await teamsApi.createRoom(
          name,
          description,
          'hybrid',
          llmModel
        );
        setRooms((prev) => [newRoom, ...prev]);
        setCurrentRoomId(newRoom.id);
      } catch (err: any) {
        setError(err.message || 'Failed to create room');
      }
    },
    []
  );

  const deleteRoom = useCallback(
    async (roomId: string) => {
      try {
        await teamsApi.deleteRoom(roomId);
        setRooms((prev) => prev.filter((r) => r.id !== roomId));
        if (currentRoomId === roomId) {
          setCurrentRoomId(null);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete room');
      }
    },
    [currentRoomId]
  );

  const refreshRooms = useCallback(async () => {
    await loadRooms();
  }, [loadRooms]);

  const addAgentToRoom = useCallback(
    async (roomId: string, agent: TeamsAgent) => {
      try {
        await teamsApi.addAgent(roomId, agent.id, agent.name, agent.description, agent.color);
        setRooms((prev) =>
          prev.map((r) =>
            r.id === roomId ? { ...r, agents: [...r.agents, agent] } : r
          )
        );
      } catch (err: any) {
        setError(err.message || 'Failed to add agent');
      }
    },
    []
  );

  const removeAgentFromRoom = useCallback(
    async (roomId: string, agentId: string) => {
      try {
        await teamsApi.removeAgent(roomId, agentId);
        setRooms((prev) =>
          prev.map((r) =>
            r.id === roomId
              ? { ...r, agents: r.agents.filter((a) => a.id !== agentId) }
              : r
          )
        );
      } catch (err: any) {
        setError(err.message || 'Failed to remove agent');
      }
    },
    []
  );

  const inviteMember = useCallback(
    async (roomId: string, user: XgenUser) => {
      try {
        const room = rooms.find((r) => r.id === roomId);
        if (room?.members.some((m) => m.userId === user.id)) return;

        await teamsApi.addMember(roomId, user.id, user.username, 'member');

        const newMember: TeamsMember = {
          userId: user.id,
          username: user.username,
          role: 'member',
          isOnline: true,
          joinedAt: new Date().toISOString(),
        };
        setRooms((prev) =>
          prev.map((r) =>
            r.id === roomId
              ? { ...r, members: [...r.members, newMember] }
              : r
          )
        );
      } catch (err: any) {
        setError(err.message || 'Failed to invite member');
      }
    },
    [rooms]
  );

  const removeMember = useCallback(
    async (roomId: string, userId: number) => {
      try {
        await teamsApi.removeMember(roomId, userId);
        setRooms((prev) =>
          prev.map((r) =>
            r.id === roomId
              ? { ...r, members: r.members.filter((m) => m.userId !== userId) }
              : r
          )
        );
      } catch (err: any) {
        setError(err.message || 'Failed to remove member');
      }
    },
    []
  );

  return {
    rooms,
    currentRoom,
    availableWorkflows,
    loading,
    error,
    selectRoom,
    createRoom,
    deleteRoom,
    refreshRooms,
    addAgentToRoom,
    removeAgentFromRoom,
    inviteMember,
    removeMember,
  };
}
