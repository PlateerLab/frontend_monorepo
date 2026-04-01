'use client';

import React from 'react';
import type { ToastItem } from './toast-types';
import styles from './toast.module.scss';

// ─────────────────────────────────────────────────────────────
// Icons (inline SVG — 외부 의존성 없이 self-contained)
// ─────────────────────────────────────────────────────────────

const CheckCircleIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertCircleIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const AlertTriangleIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const InfoIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const XIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Default icon per type
// ─────────────────────────────────────────────────────────────

const defaultIcons: Record<string, React.ReactNode> = {
  success: <CheckCircleIcon />,
  error: <AlertCircleIcon />,
  warning: <AlertTriangleIcon />,
  info: <InfoIcon />,
};

const iconStyleMap: Record<string, string> = {
  success: styles.iconSuccess,
  error: styles.iconError,
  warning: styles.iconWarning,
  info: styles.iconInfo,
  loading: styles.iconLoading,
};

// ─────────────────────────────────────────────────────────────
// Toast Component
// ─────────────────────────────────────────────────────────────

interface ToastProps {
  item: ToastItem;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ item, onDismiss }) => {
  const typeClass = styles[item.type] || '';
  const removingClass = item.removing ? styles.removing : '';
  const iconClass = iconStyleMap[item.type] || '';

  const renderIcon = () => {
    if (item.type === 'loading') {
      return <div className={styles.spinner} />;
    }
    const icon = item.icon ?? defaultIcons[item.type];
    if (!icon) return null;
    return icon;
  };

  return (
    <div
      className={`${styles.toast} ${typeClass} ${removingClass}`}
      role="alert"
      aria-live="polite"
    >
      <span className={`${styles.icon} ${iconClass}`}>
        {renderIcon()}
      </span>
      <div className={styles.content}>
        <p className={styles.message}>{item.message}</p>
      </div>
      {item.type !== 'loading' && (
        <button
          type="button"
          className={styles.closeButton}
          onClick={() => onDismiss(item.id)}
          aria-label="Close"
        >
          <XIcon />
        </button>
      )}
    </div>
  );
};
