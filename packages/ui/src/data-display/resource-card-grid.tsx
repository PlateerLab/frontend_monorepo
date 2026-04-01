'use client';

import React, { useCallback, useMemo } from 'react';
import type { ResourceCardProps, ResourceCardGridProps } from '@xgen/types';
import { ResourceCard } from './resource-card';
import { EmptyState } from '../feedback/empty-state';
import styles from './resource-card-grid.module.scss';

// 기본 빈 상태 아이콘
const EmptyIcon: React.FC = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 12V36C8 38.2091 9.79086 40 12 40H36C38.2091 40 40 38.2091 40 36V16C40 13.7909 38.2091 12 36 12H26L22 8H12C9.79086 8 8 9.79086 8 12Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M24 20V32M18 26H30"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * ResourceCardGrid - 리소스 카드들을 그리드로 표시하는 컴포넌트
 *
 * 기능:
 * - 반응형 그리드 레이아웃
 * - 로딩 상태 표시
 * - 빈 상태 표시
 * - 다중 선택 모드 지원
 *
 * @example
 * ```tsx
 * <ResourceCardGrid
 *   items={workflows.map(w => ({
 *     id: w.id,
 *     data: w,
 *     title: w.name,
 *     badges: [{ text: 'LIVE', variant: 'success' }],
 *     onClick: () => handleClick(w),
 *   }))}
 *   loading={isLoading}
 *   showEmptyState
 *   emptyStateProps={{
 *     icon: <FiFolder />,
 *     title: '워크플로우가 없습니다',
 *     description: '새 워크플로우를 만들어 보세요',
 *     action: { label: '만들기', onClick: handleCreate },
 *   }}
 *   multiSelectMode={isMultiSelect}
 *   selectedIds={selectedIds}
 *   onSelectionChange={setSelectedIds}
 * />
 * ```
 */
export function ResourceCardGrid<T = unknown>({
  items,
  loading,
  showEmptyState = true,
  emptyStateProps,
  multiSelectMode = false,
  selectedIds = [],
  onSelectionChange,
  columns = 'auto',
  className,
}: ResourceCardGridProps<T>): React.ReactElement {
  // 선택 핸들러
  const handleSelect = useCallback(
    (id: string, isSelected: boolean) => {
      if (!onSelectionChange) return;

      if (isSelected) {
        onSelectionChange([...selectedIds, id]);
      } else {
        onSelectionChange(selectedIds.filter((sid) => sid !== id));
      }
    },
    [selectedIds, onSelectionChange]
  );

  // 그리드 클래스
  const gridClassName = useMemo(() => {
    const classes = [styles.grid];
    if (columns !== 'auto') {
      classes.push(styles[`columns${columns}`]);
    }
    if (className) {
      classes.push(className);
    }
    return classes.join(' ');
  }, [columns, className]);

  // 로딩 상태
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>로딩 중...</p>
      </div>
    );
  }

  // 빈 상태
  if (items.length === 0 && showEmptyState) {
    return (
      <EmptyState
        icon={emptyStateProps?.icon || <EmptyIcon />}
        title={emptyStateProps?.title || '항목이 없습니다'}
        description={emptyStateProps?.description}
        action={emptyStateProps?.action}
      />
    );
  }

  return (
    <div className={gridClassName}>
      {items.map((item) => (
        <ResourceCard
          key={item.id}
          {...item}
          selectable={multiSelectMode}
          selected={selectedIds.includes(item.id)}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}

export default ResourceCardGrid;

// Re-export types
export type { ResourceCardGridProps } from '@xgen/types';
