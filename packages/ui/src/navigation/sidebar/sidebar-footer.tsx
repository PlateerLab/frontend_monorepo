'use client';

import React from 'react';
import { cn } from '../../lib/utils';

// ─────────────────────────────────────────────────────────────
// SidebarFooter — 하단 영역 (지원, 사용자 프로필, 로그아웃 등)
// ─────────────────────────────────────────────────────────────

export interface SidebarFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn('bg-[var(--color-bg-50)] flex-shrink-0 w-full flex flex-col gap-0', className)}>
      {children}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SidebarDivider — 구분선
// ─────────────────────────────────────────────────────────────

export interface SidebarDividerProps {
  className?: string;
}

export const SidebarDivider: React.FC<SidebarDividerProps> = ({ className }) => {
  return <hr className={cn('border-none border-t border-[var(--color-line-50)] m-0 w-full flex-shrink-0', className)} />;
};

// ─────────────────────────────────────────────────────────────
// SidebarUserProfile — 사용자 프로필 행
// avatar + name + (optional) mode buttons + logout
// ─────────────────────────────────────────────────────────────

export interface SidebarUserProfileProps {
  name: string;
  initial?: string;
  title?: string;
  onClick?: () => void;
  isSidebarClosed?: boolean;
  className?: string;
}

export const SidebarUserProfile: React.FC<SidebarUserProfileProps> = ({
  name,
  initial,
  title,
  onClick,
  isSidebarClosed = false,
  className,
}) => {
  const userInitial = initial || name.charAt(0).toUpperCase();

  return (
    <button
      type="button"
      className={cn(
        'flex-1 min-w-0 flex items-center gap-2 px-[26px] py-[18px] min-h-[50px] box-border',
        'border-none bg-transparent w-full text-left cursor-pointer font-inherit text-inherit',
        'hover:bg-[var(--color-bg-50)]',
        isSidebarClosed && 'justify-center px-0 py-[18px]',
        className,
      )}
      onClick={onClick}
      title={title}
    >
      <div
        className="w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-[var(--subtitle1-font-size,14px)]"
        style={{ background: 'linear-gradient(135deg, var(--color-secondary-200, #305EEB) 0%, var(--color-info-200, #783CED) 100%)' }}
      >
        {userInitial}
      </div>
      {!isSidebarClosed && (
        <span className="font-pretendard text-[var(--subtitle1-font-size,14px)] font-bold leading-[var(--subtitle1-line-height,20px)] text-[var(--color-gray-800)] min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
          {name}
        </span>
      )}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────
// SidebarFooterButton — 하단 버튼 (모드 전환, 로그아웃 등)
// ─────────────────────────────────────────────────────────────

export interface SidebarFooterButtonProps {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  variant?: 'default' | 'logout';
  className?: string;
}

export const SidebarFooterButton: React.FC<SidebarFooterButtonProps> = ({
  onClick,
  title,
  icon,
  variant = 'default',
  className,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-shrink-0 p-2 rounded-lg border border-[var(--color-line-50)] bg-white cursor-pointer',
        'flex items-center justify-center',
        'text-[var(--color-gray-800)] transition-colors duration-200',
        'hover:bg-[var(--color-bg-50)] hover:border-[var(--color-gray-500)]',
        variant === 'logout' && 'mr-3',
        className,
      )}
      title={title}
    >
      <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
    </button>
  );
};

// ─────────────────────────────────────────────────────────────
// SidebarSupportSection — 기술 지원 펼침 영역
// ─────────────────────────────────────────────────────────────

export interface SidebarSupportSectionProps {
  label: string;
  isExpanded: boolean;
  isActive?: boolean;
  isSidebarClosed?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

export const SidebarSupportSection: React.FC<SidebarSupportSectionProps> = ({
  label,
  isExpanded,
  isActive = false,
  isSidebarClosed = false,
  onToggle,
  children,
  className,
}) => {
  const active = isActive || isExpanded;

  return (
    <>
      {/* Expandable support items */}
      <nav
        className={cn(
          'grid overflow-hidden transition-[grid-template-rows] duration-[250ms] ease-out mx-4 w-[calc(100%-32px)] box-border',
          isExpanded
            ? 'grid-rows-[1fr] mb-1 bg-white rounded-lg'
            : 'grid-rows-[0fr]',
          className,
        )}
      >
        <div className={cn(
          'min-h-0 overflow-hidden',
          isExpanded ? 'py-1 visible' : 'py-0 invisible',
        )}>
          {children}
        </div>
      </nav>

      {/* Support toggle button */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex items-center gap-2 px-[26px] py-[18px]',
          'bg-transparent border-none cursor-pointer w-full min-w-0 text-left rounded-lg',
          'text-[var(--color-gray-800)] text-[var(--subtitle1-font-size,14px)] font-normal leading-[var(--subtitle1-line-height,20px)]',
          'transition-colors duration-200 hover:bg-[var(--color-bg-50)]',
          active && 'bg-[var(--color-primary-w-50)]',
          isSidebarClosed && 'justify-center px-0',
        )}
        data-sidebar-trigger
      >
        {/* Help icon */}
        <svg
          width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={cn('flex-shrink-0', active && '[&_path]:stroke-[url(#sidebarActiveGradient)] [&_circle]:stroke-[url(#sidebarActiveGradient)]')}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>

        {!isSidebarClosed && (
          <>
            <span className={cn(
              'min-w-0 overflow-hidden text-ellipsis whitespace-nowrap transition-colors',
              active && 'text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-secondary-200)] to-[var(--color-info-200)]',
            )}>
              {label}
            </span>
            <span className={cn(
              'ml-auto w-6 h-6 flex items-center justify-center flex-shrink-0',
              'text-[var(--color-gray-800)] transition-transform duration-[250ms]',
              isExpanded && 'rotate-180',
            )}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </span>
          </>
        )}
      </button>
    </>
  );
};

export default SidebarFooter;
