'use client';

import React from 'react';
import { cn } from '../../lib/utils';

// ─────────────────────────────────────────────────────────────
// SidebarContent — 스크롤 가능한 본문 영역
// ─────────────────────────────────────────────────────────────

export interface SidebarContentProps {
  children: React.ReactNode;
  className?: string;
}

export const SidebarContent: React.FC<SidebarContentProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn('flex-1 min-w-0 w-full overflow-y-auto overflow-x-hidden flex flex-col', className)}>
      {children}
    </div>
  );
};

export default SidebarContent;
