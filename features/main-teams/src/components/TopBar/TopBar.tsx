'use client';

import React from 'react';
import { useTranslation } from '@xgen/i18n';
import styles from './TopBar.module.scss';

interface TopBarProps {
  username?: string;
  memberCount: number;
  onToggleMembers: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ username, memberCount, onToggleMembers }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.topBar}>
      {/* Left: Navigation */}
      <div className={styles.left}>
        <button className={styles.navBtn} title="Back">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 12L6 8L10 4" />
          </svg>
        </button>
        <button className={styles.navBtn} title="Forward">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4L10 8L6 12" />
          </svg>
        </button>
      </div>

      {/* Center: Search */}
      <div className={styles.center}>
        <input type="text" placeholder={t('teams.topBar.search')} />
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
      </div>
    </div>
  );
};
