'use client';

import React from 'react';
import styles from './card-grid.module.scss';

export interface CardGridColumns {
  sm?: number;  // 640px 이상
  md?: number;  // 768px 이상
  lg?: number;  // 1024px 이상
  xl?: number;  // 1280px 이상
}

export type CardGridGap = 'sm' | 'md' | 'lg';

export interface CardGridProps {
  /** 카드 컴포넌트 목록 */
  children: React.ReactNode;
  /** 열 수 (반응형) */
  columns?: CardGridColumns;
  /** 카드 간격 */
  gap?: CardGridGap;
  /** 추가 클래스 */
  className?: string;
}

/**
 * CardGrid - 반응형 카드 그리드 레이아웃
 *
 * @example
 * ```tsx
 * <CardGrid columns={{ sm: 1, md: 2, lg: 3, xl: 4 }} gap="md">
 *   {workflows.map(w => <Card key={w.id} {...w} />)}
 * </CardGrid>
 * ```
 */
export const CardGrid: React.FC<CardGridProps> = ({
  children,
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 'md',
  className,
}) => {
  return (
    <div
      className={`${styles.grid} ${styles[`gap-${gap}`]} ${className || ''}`}
      style={{
        '--columns-sm': columns.sm ?? 1,
        '--columns-md': columns.md ?? 2,
        '--columns-lg': columns.lg ?? 3,
        '--columns-xl': columns.xl ?? 4,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

export default CardGrid;
