'use client';

import React from 'react';
import styles from './button.module.scss';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 버튼 변형 */
  variant?: ButtonVariant;
  /** 버튼 크기 */
  size?: ButtonSize;
  /** 좌측 아이콘 */
  leftIcon?: React.ReactNode;
  /** 우측 아이콘 */
  rightIcon?: React.ReactNode;
  /** 아이콘만 있는 버튼 */
  iconOnly?: boolean;
  /** 로딩 상태 */
  loading?: boolean;
  /** 전체 너비 */
  fullWidth?: boolean;
  /** 추가 클래스 */
  className?: string;
}

/**
 * Button - 범용 버튼 컴포넌트
 *
 * @example
 * ```tsx
 * <Button variant="primary" leftIcon={<PlusIcon />}>
 *   새로 만들기
 * </Button>
 *
 * <Button variant="ghost" iconOnly>
 *   <MoreIcon />
 * </Button>
 * ```
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      leftIcon,
      rightIcon,
      iconOnly = false,
      loading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          ${styles.button}
          ${styles[variant]}
          ${styles[size]}
          ${iconOnly ? styles.iconOnly : ''}
          ${fullWidth ? styles.fullWidth : ''}
          ${loading ? styles.loading : ''}
          ${className || ''}
        `}
        {...props}
      >
        {loading && (
          <span className={styles.spinner}>
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="31.4 31.4"
              />
            </svg>
          </span>
        )}
        {!loading && leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
        {!iconOnly && <span className={styles.label}>{children}</span>}
        {iconOnly && !loading && children}
        {!loading && rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
