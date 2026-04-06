'use client';

import React from 'react';
import { cn } from '../lib/utils';

// ─────────────────────────────────────────────────────────────
// ContentArea — 통합 콘텐츠 래퍼
//
// 모든 콘텐츠 페이지의 레이아웃을 통일하는 단일 래퍼.
// 4개 영역: Header(고정) → Toolbar(고정,선택) → Main(스크롤) → Footer(고정,선택)
//
// - 항상 h-screen, 내부 스크롤
// - 헤더: h-14 (56px), 사이드바 헤더와 동일 높이/보더
// - 툴바: FilterTabs, SearchInput 등 고정 영역
// - 메인: flex-1 overflow-y-auto
// - 푸터: 하단 고정 액션 영역
// ─────────────────────────────────────────────────────────────

export interface ContentAreaProps {
  /** 헤더 좌측 제목 */
  title?: string;
  /** 헤더 좌측 부제 (제목 옆 인라인) */
  description?: string;
  /** 헤더 우측 액션 버튼들 */
  headerActions?: React.ReactNode;
  /** 헤더 전체를 커스텀으로 대체 (title/description/headerActions 무시) */
  headerContent?: React.ReactNode;
  /** false면 헤더 영역 전체 숨김 (default: true) */
  showHeader?: boolean;
  /** 헤더 아래 고정 툴바 영역 (FilterTabs, SearchInput 등) */
  toolbar?: React.ReactNode;
  /** 툴바 아래 추가 고정 서브 툴바 영역 (optional, 2차 필터/검색 등) */
  subToolbar?: React.ReactNode;
  /** 메인 스크롤 영역 콘텐츠 */
  children: React.ReactNode;
  /** 하단 고정 영역 */
  footer?: React.ReactNode;
  /** 메인 영역 기본 패딩 적용 (default: true → p-6) */
  contentPadding?: boolean;
  /** 루트 컨테이너 추가 클래스 */
  className?: string;
  /** 스크롤 영역 추가 클래스 */
  contentClassName?: string;
}

export const ContentArea: React.FC<ContentAreaProps> = ({
  title,
  description,
  headerActions,
  headerContent,
  showHeader = true,
  toolbar,
  subToolbar,
  children,
  footer,
  contentPadding = true,
  className,
  contentClassName,
}) => {
  const hasHeader = showHeader && (title || headerActions || headerContent);

  return (
    <div className={cn('flex flex-col h-screen overflow-hidden bg-[#f8f9fa]', className)}>
      {/* ── Header: h-14, 사이드바와 동일 ── */}
      {hasHeader && (
        <header className="flex items-center justify-between h-14 min-h-14 max-h-14 px-[22px] border-b border-[var(--color-line-50)] shrink-0">
          {headerContent ?? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                {title && (
                  <h1 className="text-base font-bold text-foreground m-0 truncate">{title}</h1>
                )}
                {description && (
                  <p className="text-sm text-muted-foreground m-0 truncate hidden sm:block">{description}</p>
                )}
              </div>
              {headerActions && (
                <div className="flex items-center gap-2 shrink-0">{headerActions}</div>
              )}
            </>
          )}
        </header>
      )}

      {/* ── Toolbar: 고정 영역 ── */}
      {toolbar && (
        <div className="px-6 py-3 border-b border-[var(--color-line-50)] shrink-0">
          {toolbar}
        </div>
      )}

      {/* ── SubToolbar: 추가 고정 영역 (2차 필터/검색) ── */}
      {subToolbar && (
        <div className="px-6 py-3 border-b border-[var(--color-line-50)] shrink-0">
          {subToolbar}
        </div>
      )}

      {/* ── Main: 스크롤 영역 ── */}
      <div
        className={cn(
          'flex-1 overflow-y-auto overflow-x-hidden min-h-0',
          contentPadding && 'p-6',
          contentClassName,
        )}
      >
        {children}
      </div>

      {/* ── Footer: 고정 영역 ── */}
      {footer && (
        <div className="px-6 py-3 border-t border-[var(--color-line-50)] shrink-0">
          {footer}
        </div>
      )}
    </div>
  );
};

export default ContentArea;
