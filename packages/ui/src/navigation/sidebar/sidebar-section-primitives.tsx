'use client';

import React from 'react';
import { cn } from '../../lib/utils';

// ─────────────────────────────────────────────────────────────
// SidebarSectionList — 섹션들을 담는 컨테이너
// ─────────────────────────────────────────────────────────────

export interface SidebarSectionListProps {
  children: React.ReactNode;
  className?: string;
}

export const SidebarSectionList: React.FC<SidebarSectionListProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn('py-2', className)}>
      {children}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SidebarSectionToggle — 섹션 토글 버튼
// (아이콘 + 타이틀 + chevron)
// ─────────────────────────────────────────────────────────────

export interface SidebarSectionToggleProps {
  title: string;
  icon?: React.ReactNode;
  isExpanded: boolean;
  isActive?: boolean;
  isSidebarClosed?: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}

export const SidebarSectionToggle: React.FC<SidebarSectionToggleProps> = ({
  title,
  icon,
  isExpanded,
  isActive = false,
  isSidebarClosed = false,
  onClick,
  className,
}) => {
  return (
    <button
      className={cn(
        'w-[calc(100%-32px)] mx-4 box-border',
        'flex items-center gap-2 py-[10px] px-[10px]',
        'bg-transparent border-none cursor-pointer rounded-lg',
        'text-[var(--color-gray-800)] text-[var(--subtitle1-font-size,14px)] font-bold leading-[var(--subtitle1-line-height,20px)]',
        'transition-colors duration-200 hover:bg-[var(--color-bg-50)]',
        // Active: gradient background + gradient text
        isActive && 'bg-[var(--color-primary-w-50)]',
        // Collapsed: center icon, fixed size
        isSidebarClosed && 'mx-auto w-10 min-w-10 justify-center',
        className,
      )}
      onClick={onClick}
      data-sidebar-trigger
    >
      {icon && (
        <span
          className={cn(
            'flex items-center justify-center flex-shrink-0 w-6 h-6',
            isActive && '[&_svg_path]:fill-[url(#sidebarActiveGradient)]',
          )}
        >
          {icon}
        </span>
      )}
      <span
        className={cn(
          'flex-1 min-w-0 text-left overflow-hidden text-ellipsis whitespace-nowrap font-normal block',
          // Gradient text when active
          isActive && 'text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-secondary-200)] to-[var(--color-info-200)]',
          isSidebarClosed && 'sr-only',
        )}
      >
        {title}
      </span>
      {!isSidebarClosed && (
        <span
          className={cn(
            'w-6 h-6 flex items-center justify-center flex-shrink-0',
            'text-[var(--color-gray-800)] transition-transform duration-[250ms]',
            isExpanded && 'rotate-180',
          )}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      )}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────
// SidebarSectionNav — 펼쳐지는 네비게이션 항목들
// grid로 높이 애니메이션 (끊김 없이)
// ─────────────────────────────────────────────────────────────

export interface SidebarSectionNavProps {
  children: React.ReactNode;
  isExpanded: boolean;
  className?: string;
}

export const SidebarSectionNav: React.FC<SidebarSectionNavProps> = ({
  children,
  isExpanded,
  className,
}) => {
  return (
    <nav
      className={cn(
        'grid overflow-hidden transition-[grid-template-rows] duration-[250ms] ease-out mx-4 w-[calc(100%-32px)] box-border',
        isExpanded
          ? 'grid-rows-[1fr] bg-white rounded-lg mb-[10px] border border-[var(--color-line-50)]'
          : 'grid-rows-[0fr]',
        className,
      )}
    >
      <div className={cn(
        'min-h-0 overflow-hidden transition-[padding] duration-200 ease-out',
        isExpanded ? 'py-2 visible' : 'py-0 invisible',
      )}>
        {children}
      </div>
    </nav>
  );
};

// ─────────────────────────────────────────────────────────────
// SidebarNavItem — 개별 네비게이션 아이템
// ─────────────────────────────────────────────────────────────

export interface SidebarNavItemProps {
  id: string;
  title: string;
  isActive?: boolean;
  disabled?: boolean;
  badge?: string | number;
  icon?: React.ReactNode;
  onClick: () => void;
  className?: string;
}

export const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  title,
  isActive = false,
  disabled = false,
  badge,
  icon,
  onClick,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-2 px-4 py-2 text-left',
        'bg-transparent border-none cursor-pointer',
        'text-[var(--color-gray-800)] text-[var(--subtitle1-font-size,14px)] leading-[var(--subtitle1-line-height,20px)]',
        'transition-all duration-200 hover:bg-[var(--color-bg-50)]',
        isActive && 'bg-[var(--color-gray-100)] text-[var(--color-secondary-200)]',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      {icon && <span className="w-6 h-6 flex items-center justify-center flex-shrink-0">{icon}</span>}
      <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-normal">
        {title}
      </span>
      {badge != null && (
        <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[var(--color-primary-w-50)] text-[var(--color-secondary-200)]">
          {badge}
        </span>
      )}
    </button>
  );
};

export default SidebarSectionList;
