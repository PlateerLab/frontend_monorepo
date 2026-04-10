'use client';

import React, { useState, useCallback } from 'react';
import { useTranslation } from '@xgen/i18n';
import styles from './TeamsSidebar.module.scss';

interface CreateRoomModalProps {
  onClose: () => void;
  onCreate: (name: string, description?: string) => Promise<void>;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ onClose, onCreate }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || creating) return;

      setCreating(true);
      try {
        await onCreate(name.trim(), description.trim() || undefined);
        onClose();
      } finally {
        setCreating(false);
      }
    },
    [name, description, creating, onCreate, onClose]
  );

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className={styles.modalHeader}>
          <h3>{t('teams.createRoomModal.title')}</h3>
          <button type="button" className={styles.modalClose} onClick={onClose}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4L12 12M12 4L4 12" />
            </svg>
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.field}>
            <label>{t('teams.createRoomModal.name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('teams.createRoomModal.namePlaceholder')}
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label>{t('teams.createRoomModal.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('teams.createRoomModal.descriptionPlaceholder')}
            />
          </div>
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>
            {t('teams.createRoomModal.cancel')}
          </button>
          <button type="submit" className={styles.btnPrimary} disabled={!name.trim() || creating}>
            {t('teams.createRoomModal.create')}
          </button>
        </div>
      </form>
    </div>
  );
};
