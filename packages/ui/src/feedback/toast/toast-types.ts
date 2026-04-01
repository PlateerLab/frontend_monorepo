import type { ReactNode } from 'react';

// ─────────────────────────────────────────────────────────────
// Toast Type Definitions
// ─────────────────────────────────────────────────────────────

/** 토스트 기본 타입 */
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

/** 확인 토스트 변형 (버튼 색상 결정) */
export type ConfirmVariant = 'danger' | 'warning' | 'info';

/** 토스트 위치 */
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/** 토스트 옵션 */
export interface ToastOptions {
  /** 자동 닫힘 시간 (ms). 0이면 수동 닫기만 가능 */
  duration?: number;
  /** 커스텀 아이콘 */
  icon?: ReactNode;
  /** 토스트 ID (중복 방지 또는 업데이트에 사용) */
  id?: string;
}

/** 확인 토스트 옵션 */
export interface ConfirmToastOptions {
  /** 제목 */
  title: string;
  /** 메시지 */
  message: string;
  /** 확인 버튼 텍스트 */
  confirmText?: string;
  /** 취소 버튼 텍스트 */
  cancelText?: string;
  /** 변형 (버튼 색상 결정) */
  variant?: ConfirmVariant;
  /** Enter/ESC 키보드 단축키 활성화 */
  enableKeyboard?: boolean;
  /** 키보드 힌트 메시지 */
  keyboardHint?: string;
}

/** 내부 토스트 상태 */
export interface ToastItem {
  /** 고유 ID */
  id: string;
  /** 토스트 타입 */
  type: ToastType;
  /** 메시지 */
  message: string;
  /** 자동 닫힘 시간 */
  duration: number;
  /** 커스텀 아이콘 */
  icon?: ReactNode;
  /** 생성 시각 */
  createdAt: number;
  /** 삭제 애니메이션 진행 여부 */
  removing?: boolean;
}

/** 확인 토스트 내부 상태 */
export interface ConfirmToastItem {
  /** 고유 ID */
  id: string;
  /** 제목 */
  title: string;
  /** 메시지 */
  message: string;
  /** 확인 버튼 텍스트 */
  confirmText: string;
  /** 취소 버튼 텍스트 */
  cancelText: string;
  /** 변형 */
  variant: ConfirmVariant;
  /** Enter/ESC 키보드 단축키 활성화 */
  enableKeyboard: boolean;
  /** 키보드 힌트 메시지 */
  keyboardHint?: string;
  /** resolve 함수 (Promise 해소용) */
  resolve: (confirmed: boolean) => void;
}

/** 토스트 컨텍스트 API */
export interface ToastContextValue {
  toast: {
    /** 성공 토스트 */
    success: (message: string, options?: ToastOptions) => string;
    /** 에러 토스트 */
    error: (message: string, options?: ToastOptions) => string;
    /** 경고 토스트 */
    warning: (message: string, options?: ToastOptions) => string;
    /** 정보 토스트 */
    info: (message: string, options?: ToastOptions) => string;
    /** 로딩 토스트 (수동 dismiss 필요) */
    loading: (message: string, options?: Omit<ToastOptions, 'duration'>) => string;
    /** 확인 토스트 (Promise<boolean> 반환) */
    confirm: (options: ConfirmToastOptions) => Promise<boolean>;
    /** 특정 토스트 닫기 */
    dismiss: (id: string) => void;
    /** 모든 토스트 닫기 */
    dismissAll: () => void;
    /** 로딩 → 성공으로 업데이트 */
    update: (id: string, type: ToastType, message: string, options?: ToastOptions) => void;
  };
}

/** ToastProvider Props */
export interface ToastProviderProps {
  children: ReactNode;
  /** 토스트 위치 (기본: bottom-right) */
  position?: ToastPosition;
  /** 최대 동시 표시 수 (기본: 5) */
  maxToasts?: number;
  /** 기본 duration (기본: 3000) */
  defaultDuration?: number;
  /** 토스트 컨테이너 offset (px) */
  offset?: { x?: number; y?: number };
}
