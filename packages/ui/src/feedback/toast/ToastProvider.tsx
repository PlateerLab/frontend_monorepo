'use client';

import React, {
  createContext,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import type {
  ToastItem,
  ConfirmToastItem,
  ToastType,
  ToastOptions,
  ConfirmToastOptions,
  ToastContextValue,
  ToastProviderProps,
} from './toast-types';
import { ToastContainer } from './ToastContainer';

// ─────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────

export const ToastContext = createContext<ToastContextValue | null>(null);

// ─────────────────────────────────────────────────────────────
// ID Generator
// ─────────────────────────────────────────────────────────────

let toastCounter = 0;
function generateId(): string {
  toastCounter += 1;
  return `toast-${toastCounter}-${Date.now()}`;
}

// ─────────────────────────────────────────────────────────────
// Default durations
// ─────────────────────────────────────────────────────────────

const TYPE_DURATION: Record<ToastType, number> = {
  success: 3000,
  error: 4000,
  warning: 4000,
  info: 3000,
  loading: 0, // manual dismiss
};

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────

const REMOVE_ANIMATION_MS = 200;

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'bottom-right',
  maxToasts = 5,
  defaultDuration,
  offset = {},
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmToasts, setConfirmToasts] = useState<ConfirmToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const resolvedOffset = useMemo(
    () => ({ x: offset.x ?? 60, y: offset.y ?? 60 }),
    [offset.x, offset.y],
  );

  // ─── Internal helpers ───

  const scheduleRemoval = useCallback((id: string, duration: number) => {
    if (duration <= 0) return;

    const timer = setTimeout(() => {
      // Start exit animation
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, removing: true } : t)),
      );
      // Actually remove after animation
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        timersRef.current.delete(id);
      }, REMOVE_ANIMATION_MS);
    }, duration);

    timersRef.current.set(id, timer);
  }, []);

  const clearTimer = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, options?: ToastOptions): string => {
      const id = options?.id ?? generateId();
      const duration =
        type === 'loading' ? 0 : (options?.duration ?? defaultDuration ?? TYPE_DURATION[type]);

      // If toast with same id exists, update it
      setToasts((prev) => {
        const existingIdx = prev.findIndex((t) => t.id === id);
        const newItem: ToastItem = {
          id,
          type,
          message,
          duration,
          icon: options?.icon,
          createdAt: Date.now(),
        };

        let next: ToastItem[];
        if (existingIdx !== -1) {
          next = [...prev];
          next[existingIdx] = newItem;
        } else {
          next = [...prev, newItem];
        }

        // Enforce maxToasts limit (remove oldest non-loading)
        if (next.length > maxToasts) {
          const excess = next.length - maxToasts;
          let removed = 0;
          next = next.filter((t) => {
            if (removed >= excess) return true;
            if (t.type !== 'loading' && t.id !== id) {
              clearTimer(t.id);
              removed += 1;
              return false;
            }
            return true;
          });
        }

        return next;
      });

      // Clear existing timer for this id (if updating)
      clearTimer(id);

      // Schedule auto-removal
      if (duration > 0) {
        scheduleRemoval(id, duration);
      }

      return id;
    },
    [maxToasts, defaultDuration, scheduleRemoval, clearTimer],
  );

  // ─── Public API ───

  const dismiss = useCallback(
    (id: string) => {
      clearTimer(id);
      // Start exit animation
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, removing: true } : t)),
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, REMOVE_ANIMATION_MS);
    },
    [clearTimer],
  );

  const dismissAll = useCallback(() => {
    timersRef.current.forEach((_, id) => clearTimer(id));
    setToasts((prev) => prev.map((t) => ({ ...t, removing: true })));
    setTimeout(() => {
      setToasts([]);
    }, REMOVE_ANIMATION_MS);
    // Also resolve all confirm toasts as cancelled
    setConfirmToasts((prev) => {
      prev.forEach((ct) => ct.resolve(false));
      return [];
    });
  }, [clearTimer]);

  const update = useCallback(
    (id: string, type: ToastType, message: string, options?: ToastOptions) => {
      clearTimer(id);
      const duration =
        type === 'loading' ? 0 : (options?.duration ?? defaultDuration ?? TYPE_DURATION[type]);

      setToasts((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, type, message, duration, icon: options?.icon, removing: false }
            : t,
        ),
      );

      if (duration > 0) {
        scheduleRemoval(id, duration);
      }
    },
    [defaultDuration, clearTimer, scheduleRemoval],
  );

  const confirm = useCallback((options: ConfirmToastOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      const id = generateId();
      const item: ConfirmToastItem = {
        id,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText ?? '확인',
        cancelText: options.cancelText ?? '취소',
        variant: options.variant ?? 'info',
        enableKeyboard: options.enableKeyboard ?? false,
        keyboardHint: options.keyboardHint,
        resolve,
      };
      setConfirmToasts((prev) => [...prev, item]);
    });
  }, []);

  const handleConfirmResolve = useCallback((id: string, confirmed: boolean) => {
    setConfirmToasts((prev) => {
      const item = prev.find((ct) => ct.id === id);
      if (item) {
        item.resolve(confirmed);
      }
      return prev.filter((ct) => ct.id !== id);
    });
  }, []);

  // ─── Context value (stable reference) ───

  const toast = useMemo<ToastContextValue['toast']>(
    () => ({
      success: (msg, opts) => addToast('success', msg, opts),
      error: (msg, opts) => addToast('error', msg, opts),
      warning: (msg, opts) => addToast('warning', msg, opts),
      info: (msg, opts) => addToast('info', msg, opts),
      loading: (msg, opts) => addToast('loading', msg, opts),
      confirm,
      dismiss,
      dismissAll,
      update,
    }),
    [addToast, confirm, dismiss, dismissAll, update],
  );

  const contextValue = useMemo<ToastContextValue>(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer
        toasts={toasts}
        confirmToasts={confirmToasts}
        position={position}
        offset={resolvedOffset}
        onDismiss={dismiss}
        onConfirmResolve={handleConfirmResolve}
      />
    </ToastContext.Provider>
  );
};
