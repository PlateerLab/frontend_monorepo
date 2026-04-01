'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import type { ToastItem, ConfirmToastItem, ToastPosition } from './toast-types';
import { Toast } from './Toast';
import { ConfirmToast } from './ConfirmToast';
import styles from './toast.module.scss';

// ─────────────────────────────────────────────────────────────
// Position → CSS class mapping
// ─────────────────────────────────────────────────────────────

const positionClassMap: Record<ToastPosition, string> = {
  'top-left': styles.topLeft,
  'top-center': styles.topCenter,
  'top-right': styles.topRight,
  'bottom-left': styles.bottomLeft,
  'bottom-center': styles.bottomCenter,
  'bottom-right': styles.bottomRight,
};

// ─────────────────────────────────────────────────────────────
// ToastContainer Component
// ─────────────────────────────────────────────────────────────

interface ToastContainerProps {
  toasts: ToastItem[];
  confirmToasts: ConfirmToastItem[];
  position: ToastPosition;
  offset: { x: number; y: number };
  onDismiss: (id: string) => void;
  onConfirmResolve: (id: string, confirmed: boolean) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  confirmToasts,
  position,
  offset,
  onDismiss,
  onConfirmResolve,
}) => {
  // SSR guard
  if (typeof document === 'undefined') return null;

  const positionClass = positionClassMap[position] || positionClassMap['bottom-right'];

  // Dynamic offset style
  const offsetStyle: React.CSSProperties = {};
  const isBottom = position.startsWith('bottom');
  const isRight = position.endsWith('right');
  const isLeft = position.endsWith('left');
  const isCenter = position.endsWith('center');

  if (isBottom) {
    offsetStyle.bottom = offset.y;
  } else {
    offsetStyle.top = offset.y;
  }

  if (isRight) {
    offsetStyle.right = offset.x;
  } else if (isLeft) {
    offsetStyle.left = offset.x;
  }
  // center has no horizontal offset (uses transform)

  const isEmpty = toasts.length === 0 && confirmToasts.length === 0;
  if (isEmpty) return null;

  return createPortal(
    <div
      className={`${styles.toastContainer} ${positionClass}`}
      style={offsetStyle}
      aria-live="polite"
      aria-relevant="additions removals"
    >
      {confirmToasts.map((item) => (
        <ConfirmToast key={item.id} item={item} onResolve={onConfirmResolve} />
      ))}
      {toasts.map((item) => (
        <Toast key={item.id} item={item} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
  );
};
