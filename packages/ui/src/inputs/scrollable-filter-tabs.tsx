'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '../lib/utils';
import { FilterTabs } from './filter-tabs';
import type { FilterTab, FilterTabsProps } from './filter-tabs';

// ─────────────────────────────────────────────────────────────
// ScrollableFilterTabs
//
// FilterTabs를 감싸는 래퍼. 탭이 뷰포트를 초과하면:
//  - 좌우 화살표 버튼 표시
//  - 마우스 드래그로 스크롤
//  - 휠 이벤트로 가로 스크롤
// ─────────────────────────────────────────────────────────────

export interface ScrollableFilterTabsProps extends FilterTabsProps {
  /** 화살표 버튼 클릭 시 스크롤 거리 (px, default: 200) */
  scrollStep?: number;
}

export const ScrollableFilterTabs: React.FC<ScrollableFilterTabsProps> = ({
  scrollStep = 200,
  className,
  ...tabsProps
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ startX: 0, scrollLeft: 0 });

  // ── Overflow 감지 ──

  const checkOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    checkOverflow();
    const el = scrollRef.current;
    if (!el) return;

    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);
    return () => observer.disconnect();
  }, [checkOverflow, tabsProps.tabs]);

  // ── 화살표 버튼 스크롤 ──

  const scrollBy = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const delta = direction === 'left' ? -scrollStep : scrollStep;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  // ── 드래그 스크롤 ──

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    setIsDragging(true);
    dragState.current = { startX: e.pageX, scrollLeft: el.scrollLeft };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const el = scrollRef.current;
    if (!el) return;
    e.preventDefault();
    const dx = e.pageX - dragState.current.startX;
    el.scrollLeft = dragState.current.scrollLeft - dx;
  };

  const handleMouseUp = () => setIsDragging(false);

  // ── 휠 → 가로 스크롤 ──

  const handleWheel = (e: React.WheelEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollWidth <= el.clientWidth) return;
    e.preventDefault();
    el.scrollLeft += e.deltaY;
  };

  const showArrows = canScrollLeft || canScrollRight;

  return (
    <div className={cn('relative flex items-center gap-1', className)}>
      {/* Left arrow */}
      {showArrows && (
        <button
          type="button"
          onClick={() => scrollBy('left')}
          disabled={!canScrollLeft}
          className={cn(
            'shrink-0 flex items-center justify-center w-7 h-7 rounded-md border border-border bg-card transition-colors',
            canScrollLeft
              ? 'text-foreground hover:bg-muted cursor-pointer'
              : 'text-muted-foreground/30 cursor-default',
          )}
          aria-label="Scroll left"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {/* Scrollable area */}
      <div
        ref={scrollRef}
        className={cn(
          'flex-1 overflow-x-auto scrollbar-none min-w-0',
          isDragging ? 'cursor-grabbing select-none' : 'cursor-grab',
        )}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onScroll={checkOverflow}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <FilterTabs {...tabsProps} className="flex-nowrap whitespace-nowrap" />
      </div>

      {/* Right arrow */}
      {showArrows && (
        <button
          type="button"
          onClick={() => scrollBy('right')}
          disabled={!canScrollRight}
          className={cn(
            'shrink-0 flex items-center justify-center w-7 h-7 rounded-md border border-border bg-card transition-colors',
            canScrollRight
              ? 'text-foreground hover:bg-muted cursor-pointer'
              : 'text-muted-foreground/30 cursor-default',
          )}
          aria-label="Scroll right"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ScrollableFilterTabs;
