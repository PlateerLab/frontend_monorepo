'use client';

import React, { useState, useCallback } from 'react';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import { useRoomState } from './hooks/useRoomState';
import { useTeamsChat } from './hooks/useTeamsChat';
import { useAgentExecution } from './hooks/useAgentExecution';
import { TeamsSidebar } from './components/Sidebar/TeamsSidebar';
import { ChatRoom } from './components/ChatRoom/ChatRoom';
import { MemberPanel } from './components/MemberPanel/MemberPanel';
import { TopBar } from './components/TopBar/TopBar';
import { LogViewerModal } from './components/LogViewer/LogViewerModal';
import styles from './TeamsPage.module.scss';

const TeamsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showMemberPanel, setShowMemberPanel] = useState(false);

  // ─── Room State ───
  const {
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
  } = useRoomState();

  // ─── Chat State ───
  const {
    messages,
    isExecuting,
    streamingAgentIds,
    nodeStatuses,
    sendMessage,
    stopExecution,
    retryMessage,
  } = useTeamsChat(
    currentRoom?.id ?? null,
    currentRoom?.agents ?? [],
    user?.user_id,
    user?.username
  );

  // ─── Execution Log ───
  const {
    executionLog,
    logLoading,
    logError,
    showLogViewer,
    openLog,
    closeLog,
  } = useAgentExecution();

  // ─── Handlers ───
  const handleToggleMembers = useCallback(() => {
    setShowMemberPanel((prev) => !prev);
  }, []);

  const handleRemoveAgent = useCallback(
    (agentId: string) => {
      if (!currentRoom) return;
      removeAgentFromRoom(currentRoom.id, agentId);
    },
    [currentRoom, removeAgentFromRoom]
  );

  const memberCount = currentRoom
    ? currentRoom.agents.length + currentRoom.members.length
    : 0;

  // ─── Loading State ───
  if (loading) {
    return (
      <div className={styles.layout}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>{t('teams.loading')}</span>
        </div>
      </div>
    );
  }

  // ─── Error State ───
  if (error) {
    return (
      <div className={styles.layout}>
        <div className={styles.errorState}>
          <p>{error}</p>
          <button className={styles.retryBtn} onClick={refreshRooms}>
            {t('teams.chat.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      {/* Top Bar */}
      <TopBar
        username={user?.username}
        memberCount={memberCount}
        onToggleMembers={handleToggleMembers}
      />

      {/* Main Content */}
      <div className={styles.content}>
        {/* Sidebar */}
        <TeamsSidebar
          rooms={rooms}
          currentRoomId={currentRoom?.id ?? null}
          availableWorkflows={availableWorkflows}
          onSelectRoom={selectRoom}
          onCreateRoom={createRoom}
          onDeleteRoom={deleteRoom}
          onAddAgentToRoom={addAgentToRoom}
        />

        {/* Chat + Member Panel */}
        <div className={styles.mainArea}>
          <ChatRoom
            room={currentRoom}
            messages={messages}
            isExecuting={isExecuting}
            nodeStatuses={nodeStatuses}
            onSendMessage={sendMessage}
            onStopExecution={stopExecution}
            onRetryMessage={retryMessage}
            onViewLog={openLog}
          />

          {showMemberPanel && currentRoom && (
            <MemberPanel
              room={currentRoom}
              onClose={() => setShowMemberPanel(false)}
              onRemoveAgent={handleRemoveAgent}
            />
          )}
        </div>
      </div>

      {/* Log Viewer Modal */}
      {showLogViewer && (
        <LogViewerModal
          log={executionLog}
          loading={logLoading}
          error={logError}
          onClose={closeLog}
        />
      )}
    </div>
  );
};

export default TeamsPage;
