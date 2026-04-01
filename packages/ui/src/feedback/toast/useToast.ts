'use client';

import { useContext } from 'react';
import { ToastContext } from './ToastProvider';
import type { ToastContextValue } from './toast-types';

/**
 * useToast — 토스트 API에 접근하는 Hook
 *
 * @example
 * ```tsx
 * const { toast } = useToast();
 *
 * // 간단한 토스트
 * toast.success('저장되었습니다');
 * toast.error('저장에 실패했습니다');
 *
 * // 로딩 → 성공 패턴
 * const id = toast.loading('저장 중...');
 * await save();
 * toast.update(id, 'success', '저장 완료');
 *
 * // 확인 토스트 (Promise)
 * const ok = await toast.confirm({
 *   title: '삭제 확인',
 *   message: '정말 삭제하시겠습니까?',
 *   variant: 'danger',
 *   confirmText: '삭제',
 *   cancelText: '취소',
 *   enableKeyboard: true,
 * });
 * if (ok) { deleteItem(); }
 * ```
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error(
      'useToast must be used within a <ToastProvider>. ' +
      'Add <ToastProvider> to your app layout.',
    );
  }
  return ctx;
}
