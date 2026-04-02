'use client';

import React from 'react';
import { cn } from '../../lib/utils';

// ─────────────────────────────────────────────────────────────
// SidebarCollapseToggle — 사이드바 접기/펼치기 버튼
// 절대 위치로 사이드바 우측 가장자리에 배치
// ─────────────────────────────────────────────────────────────

export interface SidebarCollapseToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  openTitle?: string;
  closeTitle?: string;
  className?: string;
}

export const SidebarCollapseToggle: React.FC<SidebarCollapseToggleProps> = ({
  isOpen,
  onToggle,
  openTitle = '사이드바 열기',
  closeTitle = '사이드바 닫기',
  className,
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2',
        'w-[30px] h-[30px] rounded-full',
        'bg-white border-none shadow-[var(--shadow-input-20,0_1px_3px_rgba(0,0,0,.1))]',
        'cursor-pointer z-[101] flex items-center justify-center p-0',
        'hover:bg-[var(--color-bg-50)]',
        className,
      )}
      title={isOpen ? closeTitle : openTitle}
      aria-label={isOpen ? closeTitle : openTitle}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {isOpen ? (
          <polyline points="15 18 9 12 15 6" />
        ) : (
          <polyline points="9 18 15 12 9 6" />
        )}
      </svg>
    </button>
  );
};

export default SidebarCollapseToggle;
