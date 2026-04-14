'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from '@xgen/i18n';
import type { TeamsRoom, TeamsAgent } from '../../types';
import { AGENT_COLORS } from '../../types';
import { CreateRoomModal } from './CreateRoomModal';
import styles from './TeamsSidebar.module.scss';

// ─────────────────��───────────────────────────────────────────
// Props
// ─���──────────────────���─────────────────────────────���──────────

interface TeamsSidebarProps {
  rooms: TeamsRoom[];
  currentRoomId: string | null;
  availableWorkflows: TeamsAgent[];
  onSelectRoom: (roomId: string) => void;
  onCreateRoom: (name: string, description?: string, llmModel?: string) => Promise<void>;
  onDeleteRoom: (roomId: string) => Promise<void>;
  onAddAgentToRoom: (roomId: string, agent: TeamsAgent) => Promise<void>;
}

// ──────────────────────────────���──────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const formatTime = (dateStr?: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  if (diff < 60_000) return 'now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getRoomColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AGENT_COLORS[Math.abs(hash) % AGENT_COLORS.length];
};

// ────────��─────────────────────────��──────────────────────────
// Component
// ─────────��─────────────���────────────────────────────���────────

export const TeamsSidebar: React.FC<TeamsSidebarProps> = ({
  rooms,
  currentRoomId,
  availableWorkflows,
  onSelectRoom,
  onCreateRoom,
  onDeleteRoom,
  onAddAgentToRoom,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'rooms' | 'workflows'>('rooms');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredRooms = useMemo(
    () =>
      rooms.filter((r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [rooms, searchQuery]
  );

  const filteredWorkflows = useMemo(
    () =>
      availableWorkflows.filter((w) =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [availableWorkflows, searchQuery]
  );

  const handleAddWorkflowToRoom = useCallback(
    (agent: TeamsAgent) => {
      if (!currentRoomId) return;
      onAddAgentToRoom(currentRoomId, agent);
    },
    [currentRoomId, onAddAgentToRoom]
  );

  return (
    <div className={styles.sidebar}>
      {/* Header */}
      <div className={styles.header}>
        <h2>{t('teams.title')}</h2>
        <button
          className={styles.createBtn}
          onClick={() => setShowCreateModal(true)}
          title={t('teams.sidebar.createRoom')}
        >
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 3.75V14.25M3.75 9H14.25" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'rooms' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('rooms')}
        >
          {t('teams.sidebar.rooms')}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'workflows' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('workflows')}
        >
          {t('teams.sidebar.workflows')}
        </button>
      </div>

      {/* Search */}
      <div className={styles.search}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('teams.sidebar.search')}
        />
      </div>

      {/* List */}
      <div className={styles.list}>
        {activeTab === 'rooms' ? (
          filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
              <button
                key={room.id}
                className={`${styles.roomCard} ${room.id === currentRoomId ? styles.roomCardActive : ''}`}
                onClick={() => onSelectRoom(room.id)}
              >
                <div
                  className={styles.roomAvatar}
                  style={{ background: getRoomColor(room.name) }}
                >
                  {room.name.charAt(0).toUpperCase()}
                </div>
                <div className={styles.roomInfo}>
                  <p className={styles.roomName}>{room.name}</p>
                  <div className={styles.roomMeta}>
                    {room.agents.length > 0 && (
                      <div className={styles.agentDots}>
                        {room.agents.slice(0, 4).map((a) => (
                          <span
                            key={a.id}
                            className={styles.agentDot}
                            style={{ background: a.color }}
                          />
                        ))}
                      </div>
                    )}
                    <span className={styles.roomTime}>
                      {formatTime(room.lastMessageAt || room.createdAt)}
                    </span>
                  </div>
                </div>
                <div className={styles.roomRight}>
                  {room.unreadCount > 0 && (
                    <span className={styles.unreadBadge}>{room.unreadCount}</span>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="6" y="10" width="36" height="28" rx="4" />
                  <path d="M6 18L24 28L42 18" />
                </svg>
              </div>
              <p className={styles.emptyTitle}>{t('teams.sidebar.noRooms')}</p>
              <p className={styles.emptyDesc}>{t('teams.sidebar.noRoomsDesc')}</p>
            </div>
          )
        ) : (
          filteredWorkflows.length > 0 ? (
            filteredWorkflows.map((wf, idx) => (
              <button
                key={`${wf.id}__${idx}`}
                className={styles.workflowCard}
                onClick={() => handleAddWorkflowToRoom(wf)}
                title={currentRoomId ? t('teams.workflow.addToRoom') : ''}
                disabled={!currentRoomId}
              >
                <span
                  className={styles.workflowDot}
                  style={{ background: wf.color }}
                />
                <div className={styles.workflowInfo}>
                  <p className={styles.workflowName}>{wf.name}</p>
                  {wf.description && (
                    <p className={styles.workflowDesc}>{wf.description}</p>
                  )}
                </div>
                <span
                  className={`${styles.workflowStatus} ${
                    wf.status === 'online' ? styles.workflowStatusOnline : styles.workflowStatusOffline
                  }`}
                >
                  {wf.status === 'online' ? t('teams.workflow.online') : t('teams.workflow.offline')}
                </span>
              </button>
            ))
          ) : (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>{t('teams.sidebar.noWorkflows')}</p>
            </div>
          )
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreate={onCreateRoom}
        />
      )}
    </div>
  );
};
