'use client';

import React from 'react';
import { cn } from '../../lib/utils';

// ─────────────────────────────────────────────────────────────
// SidebarHeader — 사이드바 상단 헤더 영역
// 로고, 모드 라벨, 관리자 버튼 등을 배치
// ─────────────────────────────────────────────────────────────

export interface SidebarHeaderProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * 기본 헤더 컨테이너.
 * 내부 콘텐츠(로고, 라벨 등)는 children으로 전달.
 */
export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'h-14 px-[22px] flex items-center border-b border-[var(--color-line-50)] bg-[var(--color-bg-50)] flex-shrink-0 min-w-0 overflow-hidden',
        className,
      )}
    >
      {children}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SidebarHeaderTop — 로고 + 모드 라벨 행
// ─────────────────────────────────────────────────────────────

export interface SidebarHeaderTopProps {
  children: React.ReactNode;
  className?: string;
}

export const SidebarHeaderTop: React.FC<SidebarHeaderTopProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-1 min-w-0', className)}>
      {children}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SidebarLogoButton — 로고 클릭 버튼
// ─────────────────────────────────────────────────────────────

export interface SidebarLogoButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export const SidebarLogoButton: React.FC<SidebarLogoButtonProps> = ({
  onClick,
  children,
  className,
}) => {
  return (
    <button
      type="button"
      className={cn(
        'bg-transparent border-none cursor-pointer p-0 min-w-0 flex-shrink-0 text-left',
        'transition-opacity duration-200 hover:opacity-90',
        'flex items-center overflow-hidden',
        'text-[var(--color-gray-800)]',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────
// SidebarModeLabel — 모드 텍스트 (예: "User Mode", "Admin")
// ─────────────────────────────────────────────────────────────

export interface SidebarModeLabelProps {
  children: React.ReactNode;
  className?: string;
}

export const SidebarModeLabel: React.FC<SidebarModeLabelProps> = ({
  children,
  className,
}) => {
  return (
    <span
      className={cn(
        'font-pretendard text-[var(--subtitle1-font-size,14px)] font-bold leading-[var(--subtitle1-line-height,20px)]',
        'text-[var(--color-gray-500)] min-w-0 overflow-hidden text-ellipsis whitespace-nowrap',
        className,
      )}
    >
      {children}
    </span>
  );
};

export default SidebarHeader;
