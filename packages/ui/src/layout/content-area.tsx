'use client';

import React from 'react';
import styles from './content-area.module.scss';

export type ContentAreaVariant = 'card' | 'page' | 'fullWidth' | 'toolStorage';

export interface ContentAreaProps {
  /** 페이지/섹션 제목 */
  title?: string;
  /** 페이지/섹션 설명 */
  description?: string;
  /** 헤더 표시 여부 (기본 true) */
  showHeader?: boolean;
  /** 레이아웃 변형 */
  variant?: ContentAreaVariant;
  /** 콘텐츠 영역 */
  children: React.ReactNode;
  /** 추가 클래스 */
  className?: string;
  /** 헤더 우측 액션 버튼 슬롯 */
  headerActions?: React.ReactNode;
}

/**
 * ContentArea - 페이지 콘텐츠 래퍼 컴포넌트
 *
 * @example
 * ```tsx
 * <ContentArea
 *   title="워크플로우 목록"
 *   description="생성된 워크플로우를 관리합니다."
 *   headerActions={<Button onClick={onCreate}>새 워크플로우</Button>}
 * >
 *   <WorkflowList />
 * </ContentArea>
 * ```
 */
export const ContentArea: React.FC<ContentAreaProps> = ({
  title,
  description,
  showHeader = true,
  variant = 'card',
  children,
  className,
  headerActions,
}) => {
  const shouldShowHeader = showHeader && (title || description || headerActions);

  return (
    <div className={`${styles.container} ${styles[variant]} ${className || ''}`}>
      {shouldShowHeader && (
        <header className={styles.header}>
          <div className={styles.headerText}>
            {title && <h1 className={styles.title}>{title}</h1>}
            {description && <p className={styles.description}>{description}</p>}
          </div>
          {headerActions && (
            <div className={styles.headerActions}>{headerActions}</div>
          )}
        </header>
      )}
      <div className={styles.body}>{children}</div>
    </div>
  );
};

export default ContentArea;
