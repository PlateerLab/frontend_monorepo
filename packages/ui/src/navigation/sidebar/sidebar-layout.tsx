'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

// ─────────────────────────────────────────────────────────────
// SidebarLayout — 모든 사이드바 변형의 기본 쉘
// position:fixed, full-height, flex column, motion animation
// ─────────────────────────────────────────────────────────────

export interface SidebarLayoutProps {
  children: React.ReactNode;
  /** 열림/닫힘 상태 (collapsible 사이드바용) */
  isOpen?: boolean;
  /** 열림 너비 (px) */
  openWidth?: number;
  /** 닫힘 너비 (px) — 0이면 완전히 숨김 */
  closedWidth?: number;
  /** 추가 CSS 클래스 */
  className?: string;
  /** framer-motion 비활성화 */
  disableAnimation?: boolean;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  children,
  isOpen = true,
  openWidth = 250,
  closedWidth = 72,
  className,
  disableAnimation = false,
}) => {
  const currentWidth = isOpen ? openWidth : closedWidth;

  const motionProps = disableAnimation
    ? {}
    : {
        initial: { x: '-100%' },
        animate: { x: 0 },
        exit: { x: '-100%' },
        transition: { type: 'tween' as const, duration: 0.3 },
      };

  return (
    <motion.aside
      className={cn(
        'fixed top-0 left-0 h-screen flex flex-col flex-shrink-0 z-[100] overflow-visible',
        'border-r border-[var(--color-line-50)] bg-[var(--color-bg-50)]',
        'transition-[width] duration-[250ms] ease-out',
        className,
      )}
      style={{ width: currentWidth }}
      {...motionProps}
    >
      {/* SVG gradient for active state — 모든 사이드바에서 공유 */}
      <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <linearGradient id="sidebarActiveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0.0164" stopColor="var(--color-secondary-200, #305EEB)" />
            <stop offset="1" stopColor="var(--color-info-200, #783CED)" />
          </linearGradient>
        </defs>
      </svg>
      {children}
    </motion.aside>
  );
};

export default SidebarLayout;
