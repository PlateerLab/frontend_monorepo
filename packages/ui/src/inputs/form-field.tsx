'use client';

import React, { useId } from 'react';
import styles from './form-field.module.scss';

export interface FormFieldProps {
  /** 입력 필드 */
  children: React.ReactNode;
  /** 라벨 텍스트 */
  label?: string;
  /** 필수 여부 */
  required?: boolean;
  /** 설명 텍스트 */
  description?: string;
  /** 에러 메시지 */
  error?: string;
  /** 힌트 텍스트 */
  hint?: string;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 추가 클래스 */
  className?: string;
}

/**
 * FormField - 폼 필드 래퍼 컴포넌트
 *
 * @example
 * ```tsx
 * <FormField
 *   label="워크플로우 이름"
 *   required
 *   error={errors.name}
 *   description="워크플로우를 식별하는 고유한 이름을 입력하세요."
 * >
 *   <input type="text" {...register('name')} />
 * </FormField>
 * ```
 */
export const FormField: React.FC<FormFieldProps> = ({
  children,
  label,
  required = false,
  description,
  error,
  hint,
  disabled = false,
  className,
}) => {
  const id = useId();
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div
      className={`
        ${styles.container}
        ${error ? styles.hasError : ''}
        ${disabled ? styles.disabled : ''}
        ${className || ''}
      `}
    >
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      {description && (
        <p id={descriptionId} className={styles.description}>
          {description}
        </p>
      )}

      <div className={styles.fieldWrapper}>
        {React.isValidElement(children)
          ? React.cloneElement(children as React.ReactElement<any>, {
              id,
              'aria-describedby': [descriptionId, errorId].filter(Boolean).join(' ') || undefined,
              'aria-invalid': !!error,
              disabled,
            })
          : children}
      </div>

      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}

      {hint && !error && (
        <p className={styles.hint}>{hint}</p>
      )}
    </div>
  );
};

export default FormField;
