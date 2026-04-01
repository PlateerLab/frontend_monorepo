'use client';

// ─────────────────────────────────────────────────────────────
// @xgen/ui - Sidebar 컴포넌트
// 범용 사이드바 - admin, main, mypage, support 등 모든 페이지에서 사용
// ─────────────────────────────────────────────────────────────

export { Sidebar } from './sidebar';
export type { SidebarProps } from './sidebar';

export { SidebarSection } from './sidebar-section';
export type { SidebarSectionProps } from './sidebar-section';

export { SidebarPopover } from './sidebar-popover';
export type { SidebarPopoverProps, PopoverItem } from './sidebar-popover';

// Types re-exported from @xgen/types for convenience
export type {
  SidebarConfig,
  SidebarSection as SidebarSectionType,
  SidebarMenuItem,
  SidebarSectionId,
  SidebarSupportItem,
  SidebarUserProfile,
  SidebarLogo,
  SidebarHeader,
  SidebarSupport,
  SidebarVariant,
} from '@xgen/types';
