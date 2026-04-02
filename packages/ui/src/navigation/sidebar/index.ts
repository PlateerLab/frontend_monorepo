'use client';

// ---------------------------------------------------------------------------
// @xgen/ui - Sidebar Components
// Composable sidebar primitives + backward-compatible Sidebar (SidebarConfig)
// ---------------------------------------------------------------------------

// Composed Sidebar (backward-compatible API)
export { Sidebar } from './sidebar';
export type { SidebarProps } from './sidebar';

// --- Primitives ---

// Layout Shell
export { SidebarLayout } from './sidebar-layout';
export type { SidebarLayoutProps } from './sidebar-layout';

// Collapse Toggle
export { SidebarCollapseToggle } from './sidebar-collapse-toggle';
export type { SidebarCollapseToggleProps } from './sidebar-collapse-toggle';

// Header
export { SidebarHeader, SidebarHeaderTop, SidebarLogoButton, SidebarModeLabel } from './sidebar-header';
export type { SidebarHeaderProps, SidebarHeaderTopProps, SidebarLogoButtonProps, SidebarModeLabelProps } from './sidebar-header';

// Content
export { SidebarContent } from './sidebar-content';
export type { SidebarContentProps } from './sidebar-content';

// Section primitives
export { SidebarSectionList, SidebarSectionToggle, SidebarSectionNav, SidebarNavItem } from './sidebar-section-primitives';
export type { SidebarSectionListProps, SidebarSectionToggleProps, SidebarSectionNavProps, SidebarNavItemProps } from './sidebar-section-primitives';

// Footer
export {
  SidebarFooter,
  SidebarDivider,
  SidebarUserProfile,
  SidebarFooterButton,
  SidebarSupportSection,
} from './sidebar-footer';
export type {
  SidebarFooterProps,
  SidebarDividerProps,
  SidebarUserProfileProps,
  SidebarFooterButtonProps,
  SidebarSupportSectionProps,
} from './sidebar-footer';

// Popover
export { SidebarPopover } from './sidebar-popover';
export type { SidebarPopoverProps, PopoverItem } from './sidebar-popover';

// Legacy SidebarSection (accordion) - kept for backward compat
export { SidebarSection } from './sidebar-section';
export type { SidebarSectionProps } from './sidebar-section';

// Types re-exported from @xgen/types for convenience
export type {
  SidebarConfig,
  SidebarSection as SidebarSectionType,
  SidebarMenuItem,
  SidebarSectionId,
  SidebarSupportItem,
  SidebarUserProfile as SidebarUserProfileType,
  SidebarLogo,
  SidebarHeader as SidebarHeaderType,
  SidebarSupport,
  SidebarVariant,
} from '@xgen/types';