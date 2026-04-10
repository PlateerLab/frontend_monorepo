'use client';

import React, { useState, useMemo } from 'react';
import { useTranslation } from '@xgen/i18n';
import type { TeamsRoom } from '../../types';
import styles from './MemberPanel.module.scss';

interface MemberPanelProps {
  room: TeamsRoom;
  onClose: () => void;
  onRemoveAgent?: (agentId: string) => void;
}

export const MemberPanel: React.FC<MemberPanelProps> = ({
  room,
  onClose,
  onRemoveAgent,
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filteredAgents = useMemo(
    () => room.agents.filter((a) => a.name.toLowerCase().includes(search.toLowerCase())),
    [room.agents, search]
  );

  const filteredMembers = useMemo(
    () => room.members.filter((m) => m.username.toLowerCase().includes(search.toLowerCase())),
    [room.members, search]
  );

  const onlineMembers = filteredMembers.filter((m) => m.isOnline);
  const offlineMembers = filteredMembers.filter((m) => !m.isOnline);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3>{t('teams.memberPanel.title')}</h3>
        <button className={styles.closeBtn} onClick={onClose}>
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 3L11 11M11 3L3 11" />
          </svg>
        </button>
      </div>

      <div className={styles.search}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('teams.memberPanel.search')}
        />
      </div>

      <div className={styles.list}>
        {/* AI Agents */}
        {filteredAgents.length > 0 && (
          <div className={styles.section}>
            <p className={styles.sectionTitle}>
              {t('teams.memberPanel.agents')} ({filteredAgents.length})
            </p>
            {filteredAgents.map((agent) => (
              <div key={agent.id} className={styles.memberItem}>
                <div className={styles.memberAvatar} style={{ background: agent.color }}>
                  {agent.name.charAt(0).toUpperCase()}
                  <span className={styles.onlineDot} />
                </div>
                <div className={styles.memberInfo}>
                  <p className={styles.memberName}>{agent.name}</p>
                  <p className={styles.memberRole}>{agent.description || 'AI Agent'}</p>
                </div>
                {onRemoveAgent && (
                  <button
                    className={styles.removeBtn}
                    onClick={() => onRemoveAgent(agent.id)}
                    title={t('teams.memberPanel.removeAgent')}
                  >
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M2 2L10 10M10 2L2 10" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Online Members */}
        {onlineMembers.length > 0 && (
          <div className={styles.section}>
            <p className={styles.sectionTitle}>
              {t('teams.memberPanel.online')} ({onlineMembers.length})
            </p>
            {onlineMembers.map((member) => (
              <div key={member.userId} className={styles.memberItem}>
                <div className={styles.memberAvatar} style={{ background: '#305eeb' }}>
                  {member.username.charAt(0).toUpperCase()}
                  <span className={styles.onlineDot} />
                </div>
                <div className={styles.memberInfo}>
                  <p className={styles.memberName}>{member.username}</p>
                  <p className={styles.memberRole}>{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Offline Members */}
        {offlineMembers.length > 0 && (
          <div className={styles.section}>
            <p className={styles.sectionTitle}>
              {t('teams.memberPanel.offline')} ({offlineMembers.length})
            </p>
            {offlineMembers.map((member) => (
              <div key={member.userId} className={styles.memberItem}>
                <div className={styles.memberAvatar} style={{ background: '#a0a4ab' }}>
                  {member.username.charAt(0).toUpperCase()}
                </div>
                <div className={styles.memberInfo}>
                  <p className={styles.memberName}>{member.username}</p>
                  <p className={styles.memberRole}>{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
