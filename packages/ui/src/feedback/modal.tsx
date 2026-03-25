'use client';

import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './modal.module.scss';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  /** 모달 표시 여부 */
  isOpen: boolean;
  /** 닫기 콜백 */
  onClose: () => void;
  /** 모달 제목 */
  title?: string;
  /** 모달 크기 */
  size?: ModalSize;
  /** ESC 키로 닫기 (기본 true) */
  closeOnEsc?: boolean;
  /** 오버레이 클릭으로 닫기 (기본 true) */
  closeOnOverlay?: boolean;
  /** 닫기 버튼 표시 (기본 true) */
  showCloseButton?: boolean;
  /** 모달 콘텐츠 */
  children: React.ReactNode;
  /** 푸터 영역 */
  footer?: React.ReactNode;
  /** 추가 클래스 */
  className?: string;
}

/**
 * Modal - 포털 기반 범용 모달 컴포넌트
 *
 * @example
 * ```tsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="워크플로우 편집"
 *   size="lg"
 *   footer={
 *     <div>
 *       <Button variant="secondary" onClick={handleClose}>취소</Button>
 *       <Button variant="primary" onClick={handleSave}>저장</Button>
 *     </div>
 *   }
 * >
 *   <WorkflowEditForm />
 * </Modal>
 * ```
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  closeOnEsc = true,
  closeOnOverlay = true,
  showCloseButton = true,
  children,
  footer,
  className,
}) => {
  // ESC 키 핸들링
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEsc) {
        onClose();
      }
    },
    [closeOnEsc, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('keydown', handleKeyDown);
    // body 스크롤 잠금
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, handleKeyDown]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlay) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // SSR에서는 포털을 렌더링하지 않음
  if (typeof document === 'undefined') return null;

  const modalContent = (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={`${styles.modal} ${styles[size]} ${className || ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <header className={styles.header}>
            {title && (
              <h2 id="modal-title" className={styles.title}>
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="닫기"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </header>
        )}
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
