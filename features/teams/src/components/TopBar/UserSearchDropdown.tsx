'use client';

import React from 'react';
import { useTranslation } from '@xgen/i18n';
import type { XgenUser } from '../../types';
import styles from './UserSearchDropdown.module.scss';

interface UserSearchDropdownProps {
  query: string;
  loading: boolean;
  results: XgenUser[];
  currentRoomId: string | null;
  alreadyMemberIds: number[];
  onInvite: (user: XgenUser) => void;
  onClose: () => void;
}

export const UserSearchDropdown: React.FC<UserSearchDropdownProps> = ({
  query,
  loading,
  results,
  currentRoomId,
  alreadyMemberIds,
  onInvite,
  onClose,
}) => {
  const { t } = useTranslation();

  if (!query.trim()) return null;

  const memberSet = new Set(alreadyMemberIds);

  return (
    <div className={styles.dropdown} onMouseDown={(e) => e.preventDefault()}>
      {!currentRoomId && (
        <div className={styles.notice}>{t('teams.userSearch.selectRoomFirst')}</div>
      )}

      {loading ? (
        <div className={styles.empty}>{t('teams.userSearch.loading')}</div>
      ) : results.length === 0 ? (
        <div className={styles.empty}>{t('teams.userSearch.noResults')}</div>
      ) : (
        <ul className={styles.list}>
          {results.map((user) => {
            const isMember = memberSet.has(user.id);
            const disabled = !currentRoomId || isMember;
            return (
              <li key={user.id} className={styles.item}>
                <div className={styles.avatar}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className={styles.info}>
                  <p className={styles.username}>{user.username}</p>
                  {user.email && <p className={styles.email}>{user.email}</p>}
                </div>
                <button
                  type="button"
                  className={styles.inviteBtn}
                  disabled={disabled}
                  onClick={() => {
                    if (disabled) return;
                    onInvite(user);
                    onClose();
                  }}
                >
                  {isMember
                    ? t('teams.userSearch.alreadyMember')
                    : t('teams.userSearch.invite')}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
