'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@xgen/i18n';
import type { XgenUser, TeamsMember } from '../../types';
import { useUserSearch } from '../../hooks/useUserSearch';
import { UserSearchDropdown } from './UserSearchDropdown';
import styles from './TopBar.module.scss';

interface TopBarProps {
  username?: string;
  currentUserId?: number;
  memberCount: number;
  currentRoomId: string | null;
  currentMembers: TeamsMember[];
  onToggleMembers: () => void;
  onInviteUser: (roomId: string, user: XgenUser) => Promise<void> | void;
  onLogout?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  username,
  currentUserId,
  memberCount,
  currentRoomId,
  currentMembers,
  onToggleMembers,
  onInviteUser,
  onLogout,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [focused, setFocused] = useState(false);

  const excludeIds = useMemo(() => {
    const ids = currentMembers.map((m) => m.userId);
    if (currentUserId) ids.push(currentUserId);
    return ids;
  }, [currentMembers, currentUserId]);

  const { loading, results, query, setQuery } = useUserSearch(excludeIds);

  const handleInvite = useCallback(
    async (user: XgenUser) => {
      if (!currentRoomId) return;
      await onInviteUser(currentRoomId, user);
      setQuery('');
    },
    [currentRoomId, onInviteUser, setQuery]
  );

  const handleClose = useCallback(() => {
    setFocused(false);
    setQuery('');
  }, [setQuery]);

  return (
    <div className={styles.topBar}>
      {/* Left: Logo + Navigation */}
      <div className={styles.left}>
        <button
          className={styles.homeBtn}
          onClick={() => router.push('/main')}
          title="Back to XGEN"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 12L6 8L10 4" />
          </svg>
        </button>
        <span className={styles.logoText}>XGEN Teams</span>
      </div>

      {/* Center: Search */}
      <div className={styles.center}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleClose();
          }}
          placeholder={t('teams.topBar.search')}
        />
        {focused && query.trim() && (
          <UserSearchDropdown
            query={query}
            loading={loading}
            results={results}
            currentRoomId={currentRoomId}
            alreadyMemberIds={currentMembers.map((m) => m.userId)}
            onInvite={handleInvite}
            onClose={handleClose}
          />
        )}
      </div>

      {/* Right: Members + Profile */}
      <div className={styles.right}>
        <button className={styles.membersBtn} onClick={onToggleMembers}>
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="5" cy="4" r="2.5" />
            <path d="M1 12C1 9.79 2.79 8 5 8C7.21 8 9 9.79 9 12" />
            <circle cx="10" cy="5" r="2" />
            <path d="M10 9C11.66 9 13 10.34 13 12" />
          </svg>
          {t('teams.topBar.members')}
          <span className={styles.memberCount}>{memberCount}</span>
        </button>

        {username && (
          <div className={styles.profileAvatar} title={username}>
            {username.charAt(0).toUpperCase()}
          </div>
        )}
        {onLogout && (
          <button className={styles.logoutBtn} onClick={onLogout} title="Logout">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M14 8H6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
