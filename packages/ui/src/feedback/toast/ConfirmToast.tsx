'use client';

import React, { useEffect, useCallback } from 'react';
import type { ConfirmToastItem } from './toast-types';
import styles from './toast.module.scss';

// ─────────────────────────────────────────────────────────────
// ConfirmToast Component
// ─────────────────────────────────────────────────────────────

interface ConfirmToastProps {
  item: ConfirmToastItem;
  onResolve: (id: string, confirmed: boolean) => void;
}

export const ConfirmToast: React.FC<ConfirmToastProps> = ({ item, onResolve }) => {
  const handleConfirm = useCallback(() => {
    onResolve(item.id, true);
  }, [item.id, onResolve]);

  const handleCancel = useCallback(() => {
    onResolve(item.id, false);
  }, [item.id, onResolve]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!item.enableKeyboard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [item.enableKeyboard, handleConfirm, handleCancel]);

  const variantClass = styles[item.variant] || '';
  const buttonClass =
    item.variant === 'danger'
      ? styles.confirmButtonDanger
      : item.variant === 'warning'
        ? styles.confirmButtonWarning
        : styles.confirmButtonInfo;

  return (
    <div className={styles.confirmToast} role="alertdialog" aria-labelledby={`confirm-title-${item.id}`}>
      <p id={`confirm-title-${item.id}`} className={`${styles.confirmTitle} ${variantClass}`}>
        {item.title}
      </p>
      <p className={styles.confirmMessage}>{item.message}</p>
      {item.enableKeyboard && item.keyboardHint && (
        <p className={styles.keyboardHint}>{item.keyboardHint}</p>
      )}
      <div className={styles.confirmActions}>
        <button type="button" className={styles.cancelButton} onClick={handleCancel}>
          {item.cancelText}
        </button>
        <button type="button" className={buttonClass} onClick={handleConfirm}>
          {item.confirmText}
        </button>
      </div>
    </div>
  );
};
