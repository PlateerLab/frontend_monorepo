'use client';

import React, { useId } from 'react';
import styles from './toggle.module.scss';

export interface ToggleProps {
  /** 토글 상태 */
  checked: boolean;
  /** 토글 변경 핸들러 */
  onChange: (checked: boolean) => void;
  /** 라벨 텍스트 */
  label?: string;
  /** 라벨 위치 */
  labelPosition?: 'left' | 'right';
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 추가 클래스 */
  className?: string;
  /** name 속성 */
  name?: string;
}

/**
 * Toggle - 토글 스위치 컴포넌트
 *
 * @example
 * ```tsx
 * <Toggle
 *   checked={isActive}
 *   onChange={setIsActive}
 *   label="활성화"
 * />
 * ```
 */
export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  labelPosition = 'right',
  disabled = false,
  size = 'md',
  className,
  name,
}) => {
  const id = useId();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  const toggle = (
    <div className={`${styles.toggle} ${styles[size]} ${checked ? styles.checked : ''}`}>
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className={styles.input}
      />
      <span className={styles.slider}>
        <span className={styles.knob} />
      </span>
    </div>
  );

  if (!label) {
    return (
      <div className={`${styles.container} ${disabled ? styles.disabled : ''} ${className || ''}`}>
        {toggle}
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${disabled ? styles.disabled : ''} ${className || ''}`}>
      {labelPosition === 'left' && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      {toggle}
      {labelPosition === 'right' && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
    </div>
  );
};

export default Toggle;
