'use client';

// ============================================================
// @xgen/ui - 공통 UI 컴포넌트 라이브러리
//
// ⚠️ 규칙:
// - Feature는 반드시 이 패키지를 통해 UI를 사용한다.
// - Radix UI, lucide-react 등을 Feature에서 직접 import하지 않는다.
// - 새 프리미티브가 필요하면 shadcn CLI로 이 패키지에 추가한다.
// ============================================================

// ─── Utilities ───
export { cn } from './lib/utils';

// Chat Components — 공유 채팅 인터페이스
export {
  ChatPanel,
  ChatMessageList,
  ChatMessageItem,
  ChatInput,
  ChatEmptyState,
  ChatTypingIndicator,
  ChatUserIcon,
  ChatBotIcon,
  ChatSendIcon,
  ChatBubbleIcon,
} from './chat';
export type {
  ChatPanelProps,
  ChatPanelMessage,
  ChatPanelSender,
  ChatPanelMessageStatus,
  ChatPanelAttachment,
  ChatPanelVariant,
  ChatMessageItemProps,
  ChatMessageListProps,
  ChatInputProps,
  ChatEmptyStateProps as ChatPanelEmptyStateProps,
  ChatTypingIndicatorProps,
} from './chat';

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

// Toast System - 토스트 알림 시스템
export { ToastProvider, useToast } from './feedback/toast';
export type {
  ToastType,
  ToastPosition,
  ToastOptions,
  ConfirmToastOptions,
  ConfirmVariant,
  ToastContextValue,
  ToastProviderProps,
} from './feedback/toast';

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

// DataTable - 정렬 가능한 데이터 테이블
export { DataTable } from './data-display/data-table';
export type {
  DataTableProps,
  DataTableColumn,
  SortRule,
  SortDirection,
} from './data-display/data-table';

// StatusBadge - 상태 배지 (활성/비활성/대기 등)
export { StatusBadge } from './data-display/status-badge';
export type { StatusBadgeProps, StatusBadgeVariant } from './data-display/status-badge';

// StatCard - 대시보드 통계 카드 (좌측 accent border)
export { StatCard } from './data-display/stat-card';
export type { StatCardProps, StatCardVariant } from './data-display/stat-card';

// Input Components
export { Button, buttonVariants as inputButtonVariants } from './inputs/button';
export type { ButtonProps, ButtonVariant, ButtonSize, ButtonPadding } from './inputs/button';

export { LanguageToggle } from './inputs/language-toggle';
export type { LanguageToggleProps, LanguageOption } from './inputs/language-toggle';

export { SearchInput } from './inputs/search-input';
export type { SearchInputProps } from './inputs/search-input';

export { FilterTabs } from './inputs/filter-tabs';
export type { FilterTabsProps, FilterTab } from './inputs/filter-tabs';

export { FormField } from './inputs/form-field';
export type { FormFieldProps } from './inputs/form-field';

export { Toggle } from './inputs/toggle';
export type { ToggleProps } from './inputs/toggle';

export { Checkbox } from './inputs/checkbox';
export type { CheckboxProps } from './inputs/checkbox';

export { ToggleSwitch } from './inputs/toggle-switch';
export type { ToggleSwitchProps, ToggleSwitchColor } from './inputs/toggle-switch';

// Navigation Components
export { DropdownMenu } from './navigation/dropdown-menu';
export type { DropdownMenuProps, DropdownMenuItem } from './navigation/dropdown-menu';

// Sidebar Components — 조합형 사이드바 프리미티브 + 호환 API
export {
  // Composed (backward-compatible)
  Sidebar,
  // Primitives
  SidebarLayout,
  SidebarCollapseToggle,
  SidebarHeader as SidebarHeaderPrimitive,
  SidebarHeaderTop,
  SidebarLogoButton,
  SidebarModeLabel,
  SidebarContent,
  SidebarSectionList,
  SidebarSectionToggle,
  SidebarSectionNav,
  SidebarNavItem,
  SidebarFooter,
  SidebarDivider,
  SidebarUserProfile as SidebarUserProfilePrimitive,
  SidebarFooterButton,
  SidebarSupportSection,
  SidebarPopover,
  // Legacy
  SidebarSection,
} from './navigation/sidebar';
export type {
  SidebarProps,
  SidebarLayoutProps,
  SidebarCollapseToggleProps,
  SidebarHeaderProps,
  SidebarHeaderTopProps,
  SidebarLogoButtonProps,
  SidebarModeLabelProps,
  SidebarContentProps,
  SidebarSectionListProps,
  SidebarSectionToggleProps,
  SidebarSectionNavProps,
  SidebarNavItemProps,
  SidebarFooterProps,
  SidebarDividerProps,
  SidebarUserProfileProps,
  SidebarFooterButtonProps,
  SidebarSupportSectionProps,
  SidebarSectionProps,
  SidebarPopoverProps,
  PopoverItem,
  SidebarConfig,
  SidebarSectionType,
  SidebarMenuItem,
  SidebarSectionId,
  SidebarSupportItem,
  SidebarUserProfileType,
  SidebarLogo,
  SidebarHeaderType,
  SidebarSupport,
  SidebarVariant,
} from './navigation/sidebar';

// ─── shadcn Primitives (Radix UI 기반) ───
// Feature에서 @radix-ui/* 직접 import 금지. 아래를 통해 사용한다.

export {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from './primitives/accordion';

export { Badge, badgeVariants } from './primitives/badge';

export {
  Button as ButtonPrimitive, buttonVariants,
} from './primitives/button';

export {
  Card as CardPrimitive, CardHeader, CardFooter, CardTitle,
  CardDescription, CardContent,
} from './primitives/card';

export {
  Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger,
  DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from './primitives/dialog';

export {
  DropdownMenu as DropdownMenuPrimitive,
  DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem as DropdownMenuItemPrimitive,
  DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup,
  DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent,
  DropdownMenuSubTrigger, DropdownMenuRadioGroup,
} from './primitives/dropdown-menu';

export { Input } from './primitives/input';

export { Label } from './primitives/label';

export {
  Popover, PopoverTrigger, PopoverContent,
} from './primitives/popover';

export { RadioGroup, RadioGroupItem } from './primitives/radio-group';

export {
  Select, SelectGroup, SelectValue, SelectTrigger, SelectContent,
  SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton,
  SelectScrollDownButton,
} from './primitives/select';

export { Separator } from './primitives/separator';

export {
  Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose,
  SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription,
} from './primitives/sheet';

export { Skeleton } from './primitives/skeleton';

export { Toaster } from './primitives/sonner';

export { Switch } from './primitives/switch';

export {
  Table as TablePrimitive, TableHeader, TableBody, TableFooter,
  TableHead, TableRow, TableCell, TableCaption,
} from './primitives/table';

export { Tabs, TabsList, TabsTrigger, TabsContent } from './primitives/tabs';

export { Textarea } from './primitives/textarea';

export {
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
} from './primitives/tooltip';
