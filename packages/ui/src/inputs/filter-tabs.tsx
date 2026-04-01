'use client';

import React from 'react';
import styles from './filter-tabs.module.scss';

export interface FilterTab {
  /** 탭 고유 키 */
  key: string;
  /** 탭 라벨 */
  label: string;
  /** 개수 (옵션) */
  count?: number;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 아이콘 (옵션) */
  icon?: React.ReactNode;
}

export interface FilterTabsProps {
  /** 탭 목록 */
  tabs: FilterTab[];
  /** 현재 선택된 탭 키 */
  activeKey: string;
  /** 탭 변경 핸들러 */
  onChange: (key: string) => void;
  /** 탭 스타일 */
  variant?: 'default' | 'pills' | 'underline';
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 전체 너비 채우기 */
  fullWidth?: boolean;
  /** 추가 클래스 */
  className?: string;
}

/**
 * FilterTabs - 필터 탭 컴포넌트
 *
 * @example
 * ```tsx
 * <FilterTabs
 *   tabs={[
 *     { key: 'all', label: '전체', count: 100 },
 *     { key: 'active', label: '활성', count: 50 },
 *     { key: 'inactive', label: '비활성', count: 50 },
 *   ]}
 *   activeKey={filter}
 *   onChange={setFilter}
 *   variant="pills"
 * />
 * ```
 */
export const FilterTabs: React.FC<FilterTabsProps> = ({
  tabs,
  activeKey,
  onChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className,
}) => {
  return (
    <div
      className={`
        ${styles.container}
        ${styles[variant]}
        ${styles[size]}
        ${fullWidth ? styles.fullWidth : ''}
        ${className || ''}
      `}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={activeKey === tab.key}
          disabled={tab.disabled}
          onClick={() => onChange(tab.key)}
          className={`${styles.tab} ${activeKey === tab.key ? styles.active : ''}`}
        >
          {tab.icon && <span className={styles.icon}>{tab.icon}</span>}
          <span className={styles.label}>{tab.label}</span>
          {tab.count !== undefined && (
            <span className={styles.count}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
};

export default FilterTabs;
