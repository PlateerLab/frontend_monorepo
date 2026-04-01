'use client';

// ============================================================
// @xgen/ui - 공통 UI 컴포넌트 라이브러리
// ============================================================

// Layout Components
export { ContentArea } from './layout/content-area';
export type { ContentAreaProps, ContentAreaVariant } from './layout/content-area';

export { ResizablePanel } from './layout/resizable-panel';
export type { ResizablePanelProps } from './layout/resizable-panel';

// Feedback Components
export { Modal } from './feedback/modal';
export type { ModalProps, ModalSize } from './feedback/modal';

export { EmptyState } from './feedback/empty-state';
export type { EmptyStateProps, SuggestionItem } from './feedback/empty-state';

// Data Display Components
export { Card } from './data-display/card';
export type { CardProps, CardMetadata, CardAction, CardBadge } from './data-display/card';

export { CardGrid } from './data-display/card-grid';
export type { CardGridProps, CardGridColumns, CardGridGap } from './data-display/card-grid';

// Resource Card - 워크플로우, 프롬프트, 컬렉션 등 범용 리소스 카드
export { ResourceCard } from './data-display/resource-card';
export type {
  ResourceCardProps,
  CardBadge as ResourceCardBadge,
  CardMetaItem,
  CardActionButton,
  CardDropdownItem,
  CardThumbnail,
} from './data-display/resource-card';

export { ResourceCardGrid } from './data-display/resource-card-grid';
export type { ResourceCardGridProps } from './data-display/resource-card-grid';

// Input Components
export { Button } from './inputs/button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './inputs/button';

export { SearchInput } from './inputs/search-input';
export type { SearchInputProps } from './inputs/search-input';

export { FilterTabs } from './inputs/filter-tabs';
export type { FilterTabsProps, FilterTab } from './inputs/filter-tabs';

export { FormField } from './inputs/form-field';
export type { FormFieldProps } from './inputs/form-field';

export { Toggle } from './inputs/toggle';
export type { ToggleProps } from './inputs/toggle';

// Navigation Components
export { DropdownMenu } from './navigation/dropdown-menu';
export type { DropdownMenuProps, DropdownMenuItem } from './navigation/dropdown-menu';

// Sidebar Components - 범용 사이드바 (admin, main, mypage, support 등)
export { Sidebar, SidebarSection, SidebarPopover } from './navigation/sidebar';
export type {
  SidebarProps,
  SidebarSectionProps,
  SidebarPopoverProps,
  PopoverItem,
  SidebarConfig,
  SidebarSectionType,
  SidebarMenuItem,
  SidebarSectionId,
  SidebarSupportItem,
  SidebarUserProfile,
  SidebarLogo,
  SidebarHeader,
  SidebarSupport,
  SidebarVariant,
} from './navigation/sidebar';
