import type { ComponentType, ReactNode } from 'react';
import type React from 'react';

// ─────────────────────────────────────────────────────────────
// Route Component Props
// ─────────────────────────────────────────────────────────────
export interface RouteComponentProps {
  params?: Record<string, string>;
  searchParams?: Record<string, string | string[] | undefined>;
}

// ─────────────────────────────────────────────────────────────
// Sidebar Types — 범용 사이드바 컴포넌트 인터페이스
// admin, main, mypage, support 등 모든 페이지에서 공통으로 사용
// ─────────────────────────────────────────────────────────────

/** 사이드바 섹션 ID 타입 */
export type SidebarSectionId =
  | 'workspace'
  | 'chat'
  | 'workflow'
  | 'support'
  | 'admin'
  | 'mypage'
  | string; // 확장 가능

/** 사이드바 메뉴 아이템 */
export interface SidebarMenuItem {
  /** 고유 ID */
  id: string;
  /** i18n 타이틀 키 */
  titleKey: string;
  /** i18n 설명 키 */
  descriptionKey?: string;
  /** 아이콘 컴포넌트 */
  icon?: ComponentType<{ className?: string }>;
  /** 배지 (숫자 또는 텍스트) */
  badge?: string | number;
  /** 링크 URL (onNavigate 대신 직접 이동할 때) */
  href?: string;
  /** 비활성화 여부 */
  disabled?: boolean;
}

/** 사이드바 섹션 (아코디언) */
export interface SidebarSection {
  /** 섹션 고유 ID */
  id: SidebarSectionId;
  /** i18n 섹션 타이틀 키 */
  titleKey: string;
  /** 섹션 아이콘 컴포넌트 */
  icon?: ComponentType<{ className?: string }>;
  /** 섹션 내 메뉴 아이템들 */
  items: SidebarMenuItem[];
  /** 기본 확장 여부 */
  defaultExpanded?: boolean;
}

/** 사이드바 지원 섹션 아이템 */
export interface SidebarSupportItem {
  /** 고유 ID */
  id: string;
  /** i18n 타이틀 키 */
  titleKey: string;
  /** 링크 URL */
  href?: string;
}

/** 사용자 프로필 정보 */
export interface SidebarUserProfile {
  /** 사용자 이름 */
  name: string;
  /** 역할/직급 */
  role?: string;
  /** 아바타 URL 또는 문자 */
  avatar?: string;
}

/** 사이드바 로고 설정 */
export interface SidebarLogo {
  /** 확장 상태 로고 텍스트 */
  expanded: string;
  /** 축소 상태 로고 텍스트 */
  collapsed: string;
}

/** 사이드바 헤더 설정 */
export interface SidebarHeader {
  /** 모드 라벨 (예: "User Mode", "Admin Mode") */
  modeLabelKey?: string;
  /** 관리자 버튼 표시 여부 */
  showAdminButton?: boolean;
  /** 관리자 버튼 클릭 핸들러 */
  onAdminClick?: () => void;
}

/** 사이드바 지원 섹션 설정 */
export interface SidebarSupport {
  /** i18n 섹션 타이틀 키 */
  titleKey: string;
  /** 지원 메뉴 아이템들 */
  items: SidebarSupportItem[];
}

/** 사이드바 테마/변형 */
export type SidebarVariant = 'main' | 'admin' | 'support' | 'mypage';

/**
 * 사이드바 전체 설정
 * @xgen/ui의 Sidebar 컴포넌트에 전달
 */
export interface SidebarConfig {
  /** 로고 설정 */
  logo?: SidebarLogo;
  /** 헤더 설정 */
  header?: SidebarHeader;
  /** 섹션 목록 (메인 메뉴) */
  sections: SidebarSection[];
  /** 지원 섹션 */
  support?: SidebarSupport;
  /** 사용자 프로필 */
  user?: SidebarUserProfile;
  /** 로그아웃 핸들러 */
  onLogout?: () => void;
  /** 메뉴 클릭 핸들러 */
  onNavigate: (itemId: string, href?: string) => void;
  /** 로고 클릭 핸들러 */
  onLogoClick?: () => void;
  /** 축소 상태 */
  collapsed?: boolean;
  /** 축소 토글 핸들러 */
  onToggle?: () => void;
  /** 현재 활성 메뉴 ID */
  activeItemId?: string;
  /** 사이드바 테마/변형 */
  variant?: SidebarVariant;
  /** 추가 CSS 클래스 */
  className?: string;
}

// 하위 호환을 위한 기존 타입 (deprecated, 향후 제거 예정)
/** @deprecated SidebarMenuItem 사용 권장 */
export interface SidebarItem {
  id: string;
  titleKey: string;
  descriptionKey?: string;
  icon?: string;
  iconComponent?: ComponentType<{ className?: string }>;
}

// ─────────────────────────────────────────────────────────────
// Feature Module (기존 호환)
// ─────────────────────────────────────────────────────────────
export interface FeatureModule {
  id: string;
  name: string;
  sidebarSection?: string;
  sidebarItems?: SidebarItem[];
  routes?: Record<string, ComponentType<RouteComponentProps>>;
}

// ─────────────────────────────────────────────────────────────
// Main Feature Module
// /main 페이지에 등록되는 Feature 인터페이스
// ─────────────────────────────────────────────────────────────
export interface MainFeatureModule {
  /** Feature 고유 ID (디렉토리명과 동일해야 함) */
  id: string;
  /** Feature 표시 이름 */
  name: string;
  /** 사이드바 섹션 */
  sidebarSection: SidebarSectionId;
  /** 사이드바 메뉴 아이템들 */
  sidebarItems: SidebarItem[];
  /** 라우트 맵 (sidebarItem.id → 컴포넌트) */
  routes: Record<string, ComponentType<RouteComponentProps>>;
  /** 인증 필수 여부 */
  requiresAuth?: boolean;
  /** 필요 권한 목록 */
  permissions?: string[];
}

// ─────────────────────────────────────────────────────────────
// Admin Feature Module
// /admin 페이지에 등록되는 Feature 인터페이스
// ─────────────────────────────────────────────────────────────

/** Admin 사이드바 섹션 ID */
export type AdminSidebarSectionId =
  | 'admin-user'
  | 'admin-workflow'
  | 'admin-setting'
  | 'admin-system'
  | 'admin-data'
  | 'admin-security'
  | 'admin-mcp'
  | 'admin-ml'
  | 'admin-governance'
  | string;

export interface AdminFeatureModule {
  /** Feature 고유 ID (디렉토리명과 동일해야 함) */
  id: string;
  /** Feature 표시 이름 */
  name: string;
  /** Admin 사이드바 섹션 */
  adminSection: AdminSidebarSectionId;
  /** 라우트 맵 (sidebarItem.id → 컴포넌트) */
  routes: Record<string, ComponentType<RouteComponentProps>>;
  /** 인증 필수 여부 */
  requiresAuth?: boolean;
  /** 필요 권한 목록 */
  permissions?: string[];
}

// ─────────────────────────────────────────────────────────────
// Dashboard Plugin
// 대시보드에 위젯을 추가할 수 있는 확장 지점
// ─────────────────────────────────────────────────────────────
export interface DashboardWidget {
  id: string;
  order: number;
  component: ComponentType;
}

export interface DashboardPlugin {
  id: string;
  name: string;
  /** KPI 카드 위젯들 */
  kpiWidgets?: DashboardWidget[];
  /** 최신 업데이트 섹션 */
  updatesWidget?: DashboardWidget;
  /** 상위 컨텐츠 섹션 */
  topContentWidget?: DashboardWidget;
  /** 에러/알림 섹션 */
  alertsWidget?: DashboardWidget;
}

// ─────────────────────────────────────────────────────────────
// Introduction Page Plugin (기존)
// ─────────────────────────────────────────────────────────────
export interface IntroductionHeaderProps {
  user: { username: string } | null;
  onLogout: () => void;
}

export interface IntroductionSectionPlugin {
  id: string;
  name: string;
  headerComponent?: ComponentType<IntroductionHeaderProps>;
  heroComponent?: ComponentType;
  featuresComponent?: ComponentType;
  ctaComponent?: ComponentType;
  footerComponent?: ComponentType;
}

// ─────────────────────────────────────────────────────────────
// Storage List Plugin
// 목록 페이지(워크플로우, 도구, 프롬프트 등)의 공통 인터페이스
// ─────────────────────────────────────────────────────────────
export interface StorageFilterConfig {
  key: string;
  labelKey: string;
  countFn?: () => Promise<number>;
}

export interface StorageListPlugin {
  id: string;
  name: string;
  /** 필터 탭 설정 */
  filters?: StorageFilterConfig[];
  /** 카드 렌더러 컴포넌트 */
  cardRenderer?: ComponentType<{ item: unknown; onAction: (action: string) => void }>;
  /** 빈 상태 컴포넌트 */
  emptyStateRenderer?: ComponentType<{ filter: string }>;
  /** 생성 모달 컴포넌트 */
  createModalRenderer?: ComponentType<{ onClose: () => void; onSuccess: () => void }>;
  /** 상세 모달 컴포넌트 */
  detailModalRenderer?: ComponentType<{ item: unknown; onClose: () => void }>;
}

// ─────────────────────────────────────────────────────────────
// Card Types — 범용 카드 컴포넌트 인터페이스
// 워크플로우, 프롬프트, 컬렉션, 스케줄 등 다양한 목록에서 사용
// ─────────────────────────────────────────────────────────────

/** 배지 변형 타입 */
export type CardBadgeVariant =
  | 'success'    // 활성/라이브
  | 'warning'    // 대기중/초안
  | 'error'      // 에러/비활성
  | 'info'       // 정보
  | 'primary'    // 기본/공유
  | 'secondary'  // 보조/개인
  | 'purple'     // 배포됨
  | 'default';   // 기본

/** 카드 배지 */
export interface CardBadge {
  /** 배지 텍스트 (i18n 키 또는 문자열) */
  text: string;
  /** 배지 변형 */
  variant: CardBadgeVariant;
  /** 툴팁 텍스트 */
  tooltip?: string;
}

/** 카드 메타데이터 아이템 */
export interface CardMetaItem {
  /** 아이콘 (React 노드 또는 아이콘 컴포넌트) */
  icon?: React.ReactNode;
  /** 라벨 (선택적) */
  label?: string;
  /** 값 */
  value: string | number;
  /** 툴팁 */
  tooltip?: string;
}

/** 카드 액션 버튼 */
export interface CardActionButton {
  /** 고유 ID */
  id: string;
  /** 아이콘 */
  icon: React.ReactNode;
  /** 라벨/툴팁 */
  label: string;
  /** 클릭 핸들러 */
  onClick: () => void;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 비활성화 시 표시할 메시지 */
  disabledMessage?: string;
}

/** 드롭다운 메뉴 아이템 */
export interface CardDropdownItem {
  /** 고유 ID */
  id: string;
  /** 라벨 */
  label: string;
  /** 아이콘 */
  icon?: React.ReactNode;
  /** 클릭 핸들러 */
  onClick: () => void;
  /** 위험 액션 여부 (삭제 등) */
  danger?: boolean;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 구분선 표시 (이 아이템 위에) */
  dividerBefore?: boolean;
}

/** 카드 썸네일/아이콘 설정 */
export interface CardThumbnail {
  /** 아이콘 컴포넌트 또는 노드 */
  icon?: React.ReactNode;
  /** 이미지 URL */
  imageUrl?: string;
  /** 배경색 (hex 또는 CSS 색상) */
  backgroundColor?: string;
  /** 아이콘 색상 */
  iconColor?: string;
}

/** 카드 공통 Props */
export interface ResourceCardProps<T = unknown> {
  /** 카드 고유 ID */
  id: string;
  /** 원본 데이터 (제네릭) */
  data: T;
  /** 카드 제목 */
  title: string;
  /** 카드 설명 (선택적) */
  description?: string;
  /** 에러 메시지 (선택적) */
  errorMessage?: string;
  /** 썸네일/아이콘 설정 */
  thumbnail?: CardThumbnail;
  /** 상태 배지 목록 */
  badges?: CardBadge[];
  /** 메타데이터 목록 */
  metadata?: CardMetaItem[];
  /** 기본 액션 버튼들 (좌측) */
  primaryActions?: CardActionButton[];
  /** 드롭다운 메뉴 아이템들 (더보기 버튼) */
  dropdownActions?: CardDropdownItem[];
  /** 선택 가능 여부 */
  selectable?: boolean;
  /** 선택됨 여부 */
  selected?: boolean;
  /** 카드 클릭 핸들러 */
  onClick?: (data: T) => void;
  /** 카드 더블클릭 핸들러 */
  onDoubleClick?: (data: T) => void;
  /** 선택 변경 핸들러 */
  onSelect?: (id: string, selected: boolean) => void;
  /** 비활성 상태 (unactive) */
  inactive?: boolean;
  /** 비활성 상태 메시지 */
  inactiveMessage?: string;
  /** 추가 CSS 클래스 */
  className?: string;
}

/** 카드 그리드 Props */
export interface ResourceCardGridProps<T = unknown> {
  /** 카드 목록 */
  items: Array<ResourceCardProps<T>>;
  /** 로딩 상태 */
  loading?: boolean;
  /** 빈 상태 표시 여부 */
  showEmptyState?: boolean;
  /** 빈 상태 Props */
  emptyStateProps?: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  /** 다중 선택 모드 */
  multiSelectMode?: boolean;
  /** 선택된 ID 목록 */
  selectedIds?: string[];
  /** 선택 변경 핸들러 */
  onSelectionChange?: (ids: string[]) => void;
  /** 그리드 열 수 (기본: auto) */
  columns?: 1 | 2 | 3 | 4 | 'auto';
  /** 추가 CSS 클래스 */
  className?: string;
}

// ─────────────────────────────────────────────────────────────
// Workflow Management Types — 워크플로우 관리 타입
// Storage, Store, Scheduler, Tester 공통
// ─────────────────────────────────────────────────────────────

/** 워크플로우 상태 */
export type WorkflowStatus = 'active' | 'draft' | 'archived' | 'unactive';

/** 배포 상태 */
export type DeployStatus = 'deployed' | 'not_deployed' | 'pending' | 'error' | null;

/** 공유 권한 */
export type SharePermission = 'read_only' | 'read_write';

/** 워크플로우 필터 */
export type WorkflowStatusFilter = 'all' | 'active' | 'archived' | 'unactive';
export type WorkflowOwnerFilter = 'all' | 'personal' | 'shared';

/** 워크플로우 탭 */
export type WorkflowTab = 'storage' | 'store' | 'scheduler' | 'tester';

/** 워크플로우 상세 정보 */
export interface WorkflowDetail {
  /** DB ID */
  keyValue: number;
  /** 워크플로우 UUID */
  id: string;
  /** 워크플로우 이름 */
  name: string;
  /** 설명 */
  description?: string;
  /** 작성자 이름 */
  author: string;
  /** 작성자 사용자 ID */
  userId?: number;
  /** 노드 수 */
  nodeCount: number;
  /** 상태 */
  status: WorkflowStatus;
  /** 마지막 수정일 */
  lastModified?: string;
  /** 생성일 */
  createdAt?: string;
  /** 파일명 */
  filename?: string;
  /** 에러 메시지 */
  error?: string;
  /** 공유 여부 */
  isShared?: boolean;
  /** 공유 그룹 */
  shareGroup?: string | null;
  /** 공유 권한 */
  sharePermissions?: SharePermission;
  /** 배포 요청 여부 */
  inquireDeploy?: boolean;
  /** 승인 여부 */
  isAccepted?: boolean;
  /** 배포 여부 */
  isDeployed?: boolean;
}

/** 워크플로우 스토어 아이템 (템플릿) */
export interface WorkflowStoreItem {
  /** DB ID */
  id: number;
  /** 워크플로우 UUID */
  workflowId: string;
  /** 업로드 이름 */
  uploadName: string;
  /** 워크플로우 이름 */
  workflowName: string;
  /** 설명 */
  description?: string;
  /** 작성자 이름 */
  username?: string;
  /** 작성자 ID */
  userId: number;
  /** 노드 수 */
  nodeCount: number;
  /** 엣지 수 */
  edgeCount: number;
  /** 템플릿 여부 */
  isTemplate: boolean;
  /** 완료 여부 */
  isCompleted: boolean;
  /** 버전 */
  currentVersion: number;
  latestVersion: number;
  /** 태그 */
  tags?: string[];
  /** 생성/수정일 */
  createdAt: string;
  updatedAt: string;
  /** 메타데이터 */
  metadata?: Record<string, unknown>;
  /** 시작/종료 노드 여부 */
  hasStartNode: boolean;
  hasEndNode: boolean;
  /** 평점 */
  ratingCount?: number;
  ratingSum?: number;
}

/** 스케줄 상태 */
export type ScheduleStatus = 'active' | 'paused' | 'completed' | 'failed';

/** 스케줄 주기 타입 */
export type ScheduleFrequency = 'once' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'cron';

/** 워크플로우 스케줄 */
export interface WorkflowSchedule {
  /** 스케줄 ID */
  id: number;
  /** 워크플로우 ID */
  workflowId: string;
  /** 워크플로우 이름 */
  workflowName: string;
  /** 스케줄 이름 */
  name: string;
  /** 설명 */
  description?: string;
  /** 스케줄 상태 */
  status: ScheduleStatus;
  /** 주기 타입 */
  frequency: ScheduleFrequency;
  /** Cron 표현식 (frequency가 cron일 때) */
  cronExpression?: string;
  /** 다음 실행 시간 */
  nextRunAt?: string;
  /** 마지막 실행 시간 */
  lastRunAt?: string;
  /** 마지막 실행 결과 */
  lastRunStatus?: 'success' | 'failed';
  /** 총 실행 횟수 */
  runCount: number;
  /** 생성/수정일 */
  createdAt: string;
  updatedAt: string;
  /** 작성자 */
  userId?: number;
  username?: string;
}

/** 테스터 실행 상태 */
export type TesterRunStatus = 'idle' | 'running' | 'success' | 'failed';

/** 워크플로우 테스트 케이스 */
export interface WorkflowTestCase {
  /** 테스트 케이스 ID */
  id: string;
  /** 테스트 이름 */
  name: string;
  /** 입력값 */
  input: Record<string, unknown>;
  /** 예상 출력 (선택적) */
  expectedOutput?: Record<string, unknown>;
  /** 실제 출력 */
  actualOutput?: Record<string, unknown>;
  /** 실행 상태 */
  status: TesterRunStatus;
  /** 실행 시간 (ms) */
  executionTime?: number;
  /** 에러 메시지 */
  error?: string;
  /** 실행일시 */
  executedAt?: string;
}

/** 워크플로우 테스터 세션 */
export interface WorkflowTesterSession {
  /** 세션 ID */
  id: string;
  /** 워크플로우 ID */
  workflowId: string;
  /** 워크플로우 이름 */
  workflowName: string;
  /** 테스트 케이스 목록 */
  testCases: WorkflowTestCase[];
  /** 전체 상태 */
  status: TesterRunStatus;
  /** 성공 개수 */
  passedCount: number;
  /** 실패 개수 */
  failedCount: number;
  /** 생성일 */
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// API Types
// ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────
// Auth Types
// ─────────────────────────────────────────────────────────────
export interface User {
  id: string;
  user_id: number;
  username: string;
  email?: string;
  role?: string;
  is_admin?: boolean;
  user_type?: string;
  permissions?: string[];
  available_user_section?: string[];
  available_admin_section?: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
}

// ─────────────────────────────────────────────────────────────
// Common Entity Types
// ─────────────────────────────────────────────────────────────
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowItem extends BaseEntity {
  name: string;
  description?: string;
  thumbnail?: string;
  isActive: boolean;
  isShared: boolean;
  executionCount: number;
  createdBy: string;
  tags?: string[];
}

export interface DocumentItem extends BaseEntity {
  name: string;
  type: 'document' | 'collection';
  size?: number;
  parentId?: string;
  path: string;
  createdBy: string;
}

export interface ToolItem extends BaseEntity {
  name: string;
  description?: string;
  category: string;
  isBuiltIn: boolean;
  createdBy?: string;
}

export interface PromptItem extends BaseEntity {
  name: string;
  content: string;
  tags?: string[];
  isShared: boolean;
  createdBy: string;
}

export interface ModelItem extends BaseEntity {
  name: string;
  baseModel: string;
  status: 'training' | 'ready' | 'failed';
  metrics?: Record<string, number>;
  createdBy: string;
}

// ─────────────────────────────────────────────────────────────
// Chat Types
// 채팅 관련 인터페이스
// ─────────────────────────────────────────────────────────────

/** 채팅 메시지 발신자 타입 */
export type ChatMessageSender = 'user' | 'assistant' | 'system';

/** 채팅 메시지 상태 */
export type ChatMessageStatus = 'pending' | 'sent' | 'error' | 'streaming';

/** 파일 첨부 정보 */
export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
}

/** 채팅 메시지 */
export interface ChatMessage {
  id: string;
  sender: ChatMessageSender;
  content: string;
  createdAt: string;
  status: ChatMessageStatus;
  attachments?: ChatAttachment[];
  metadata?: {
    tokens?: number;
    processingTime?: number;
    toolCalls?: Array<{
      name: string;
      status: 'running' | 'completed' | 'failed';
    }>;
    sources?: Array<{
      id: string;
      title: string;
      page?: number;
    }>;
  };
  errorMessage?: string;
}

/** 워크플로우 정보 (채팅에서 사용) */
export interface ChatWorkflow {
  id: string;
  name: string;
  description?: string;
  nodeCount?: number;
  status: 'active' | 'draft' | 'archived';
  isShared?: boolean;
  userId?: number;
  username?: string;
  lastModified?: string;
}

/** 워크플로우 선택 옵션 */
export interface WorkflowOption extends ChatWorkflow {
  category?: string;
  usageCount?: number;
  isFavorite?: boolean;
  lastUsedAt?: string;
  tags?: string[];
}

/** 채팅 기록 항목 */
export interface ChatHistoryItem {
  id: string;
  interactionId: string;
  workflowId: string;
  workflowName: string;
  interactionCount: number;
  createdAt: string;
  updatedAt: string;
  isWorkflowDeleted?: boolean;
  userId?: number;
  metadata?: Record<string, unknown>;
}

/** 채팅 기록 필터 */
export type ChatHistoryFilter = 'all' | 'active' | 'deleted' | 'deploy';

/** 채팅 세션 */
export interface ChatSession extends BaseEntity {
  interactionId: string;
  workflow: ChatWorkflow;
  messages: ChatMessage[];
  title?: string;
  lastMessage?: string;
  messageCount: number;
  startedAt?: string;
}

/** 현재 채팅 데이터 (로컬 스토리지 저장용) */
export interface CurrentChatData {
  workflowId: string;
  workflowName: string;
  interactionId: string;
  userId?: number;
  startedAt: string;
}

/** 입력 상태 */
export interface ChatInputState {
  content: string;
  attachments: ChatAttachment[];
  isComposing: boolean;
}

/** 추천 질문 */
export interface SuggestedQuestion {
  id: string;
  text: string;
  category?: string;
}

/** 채팅 UI 상태 */
export interface ChatUIState {
  showAttachmentMenu: boolean;
  showSettingsModal: boolean;
  isLoading: boolean;
}

/** 채팅 실행 상태 */
export interface ChatExecutionState {
  isPaused: boolean;
  currentToolName: string | null;
  toolCallCount: number;
  isStreaming: boolean;
}

// ─────────────────────────────────────────────────────────────
// Chat API Types (요청/응답)
// ─────────────────────────────────────────────────────────────

/** Interaction 목록 API 응답 */
export interface ListInteractionsResponse {
  execution_meta_list: Array<{
    id: string;
    interaction_id: string;
    workflow_id: string;
    workflow_name: string;
    interaction_count: number;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
  }>;
}

/** 워크플로우 상세 API 응답 */
export interface WorkflowDetailResponse {
  id: number;
  workflow_name: string;
  workflow_id: string;
  username: string;
  user_id: number;
  full_name?: string;
  node_count: number;
  edge_count: number;
  updated_at: string;
  created_at: string;
  has_startnode: boolean;
  has_endnode: boolean;
  is_completed: boolean;
  is_shared: boolean;
  share_group: string | null;
  share_permissions: string;
  metadata: Record<string, unknown>;
  error?: string;
}

/** 메시지 전송 요청 */
export interface SendMessageRequest {
  workflow_id: string;
  workflow_name: string;
  interaction_id: string;
  message: string;
  user_id?: number;
  attachments?: ChatAttachment[];
  metadata?: Record<string, unknown>;
}

/** 메시지 전송 응답 (스트리밍용) */
export interface StreamMessageChunk {
  type: 'token' | 'tool_call' | 'source' | 'error' | 'done';
  content?: string;
  toolName?: string;
  toolStatus?: 'running' | 'completed' | 'failed';
  source?: {
    id: string;
    title: string;
    page?: number;
  };
  error?: string;
}

// ─────────────────────────────────────────────────────────────
// Auth Profile Types (API 인증 정보 관리)
// ─────────────────────────────────────────────────────────────

/** 인증 프로필 인증 타입 */
export type AuthProfileType = 'bearer' | 'api_key' | 'oauth2' | 'basic' | 'custom';

/** 인증 프로필 상태 */
export type AuthProfileStatus = 'active' | 'inactive';

/** 인증 프로필 테스트 결과 */
export interface AuthProfileTestResult {
  success: boolean;
  message?: string;
  responseTime?: number;
  statusCode?: number;
  error?: string;
}

/** 인증 프로필 (Storage) */
export interface AuthProfile {
  /** 서비스 ID (고유 식별자) */
  serviceId: string;
  /** 프로필 이름 */
  name: string;
  /** 설명 */
  description?: string;
  /** 인증 타입 */
  authType: AuthProfileType;
  /** 상태 */
  status: AuthProfileStatus;
  /** 인증 payload (토큰, API Key 등) */
  payload?: string;
  /** 사용자 ID */
  userId?: number;
  /** 사용자 이름 */
  username?: string;
  /** 생성일 */
  createdAt: string;
  /** 수정일 */
  updatedAt: string;
  /** 마지막 테스트 일시 */
  lastTestedAt?: string;
  /** 마지막 테스트 결과 */
  lastTestResult?: AuthProfileTestResult;
  /** 메타데이터 */
  metadata?: Record<string, unknown>;
}

/** 인증 프로필 스토어 아이템 */
export interface AuthProfileStoreItem {
  /** 템플릿 ID */
  templateId: string;
  /** 서비스 ID */
  serviceId: string;
  /** 프로필 이름 */
  name: string;
  /** 설명 */
  description?: string;
  /** 인증 타입 */
  authType: AuthProfileType;
  /** 태그 */
  tags: string[];
  /** 사용자 ID */
  userId?: number;
  /** 사용자 이름 */
  username?: string;
  /** 생성일 */
  createdAt: string;
  /** 메타데이터 */
  metadata?: Record<string, unknown>;
}

/** Auth Profile 탭 */
export type AuthProfileTab = 'storage' | 'store';

/** Auth Profile 필터 */
export type AuthProfileFilter = 'all' | 'active' | 'inactive';

/** Auth Profile 스토어 필터 */
export type AuthProfileStoreFilter = 'all' | 'my';

// ─────────────────────────────────────────────────────────────
// Workflow Tab Plugin
// 워크플로우 페이지에 탭으로 끼워지는 플러그인 인터페이스
// ─────────────────────────────────────────────────────────────
export interface WorkflowTabPlugin {
  /** 플러그인 고유 ID (탭 key로도 사용) */
  id: string;
  /** 플러그인 이름 */
  name: string;
  /** 탭 라벨 i18n 키 */
  tabLabelKey: string;
  /** 탭 순서 (작을수록 앞) */
  order: number;
  /** 탭 컨텐츠 컴포넌트 */
  component: ComponentType<WorkflowTabPluginProps>;
}

export interface WorkflowTabPluginProps {
  /** 다른 섹션으로 이동 */
  onNavigate?: (sectionId: string) => void;
}

// ─────────────────────────────────────────────────────────────
// Canvas Page Plugin
// 캔버스 페이지에 끼워지는 플러그인 인터페이스
// ─────────────────────────────────────────────────────────────

/** 캔버스 코어가 플러그인에 주입하는 공유 context */
export interface CanvasPluginContext {
  canvasRef: React.RefObject<any>;
  canvasMode: 'edit' | 'run';
  workflowId: string;
  workflowName: string;
  isExecuting: boolean;
  isSaving: boolean;
}

/** 사이드 패널 설정 */
export interface CanvasSidePanel {
  id: string;
  label: string;
  icon?: ComponentType;
  component: ComponentType<CanvasSidePanelProps>;
  order?: number;
}

export interface CanvasSidePanelProps extends CanvasPluginContext {
  onClose: () => void;
  onLoadWorkflow?: (data: any) => void;
}

/** 하단 패널 설정 */
export interface CanvasBottomPanel {
  id: string;
  label: string;
  component: ComponentType<CanvasBottomPanelProps>;
  order?: number;
}

export interface CanvasBottomPanelProps extends CanvasPluginContext {
  isExpanded: boolean;
  onToggleExpand: () => void;
}

/** 오버레이 설정 (사이드바, 패널 등) */
export interface CanvasOverlay {
  id: string;
  component: ComponentType<CanvasOverlayProps>;
}

export interface CanvasOverlayProps extends CanvasPluginContext {
  isOpen: boolean;
  onClose: () => void;
}

/** 모달 설정 */
export interface CanvasModal {
  id: string;
  component: ComponentType<CanvasModalProps>;
}

export interface CanvasModalProps extends CanvasPluginContext {
  isOpen: boolean;
  data?: unknown;
  onClose: () => void;
}

/** 헤더 컴포넌트 Props */
export interface CanvasHeaderProps extends CanvasPluginContext {
  onSave: () => void;
  onNewWorkflow: () => void;
  onDeploy: () => void;
  onAddNodeClick?: () => void;
  onAutoWorkflowClick?: () => void;
  onTemplateStart?: () => void;
  onImportWorkflow?: () => void;
  onWorkflowNameChange?: (name: string) => void;
  onDuplicate?: () => void;
  isOwner?: boolean;
  sidebarLayout?: { isOpen: boolean };
  renameWorkflow?: (oldName: string, newName: string, workflowId: string) => Promise<void>;
  checkWorkflowExistence?: (name: string) => Promise<{ exists: boolean }>;
  listWorkflows?: () => Promise<any[]>;
}

/** 캔버스 페이지 플러그인 */
export interface CanvasPagePlugin {
  id: string;
  name: string;
  /** 헤더 컴포넌트 (하나만 등록 가능) */
  headerComponent?: ComponentType<CanvasHeaderProps>;
  /** 사이드 패널 목록 */
  sidePanels?: CanvasSidePanel[];
  /** 하단 패널 목록 */
  bottomPanels?: CanvasBottomPanel[];
  /** 오버레이 (사이드바/패널 형태) */
  overlays?: CanvasOverlay[];
  /** 모달 */
  modals?: CanvasModal[];
  /** 드롭 핸들러 (파일 드롭 가로채기) */
  dropHandler?: (event: DragEvent, context: CanvasPluginContext) => boolean;
}

// ─────────────────────────────────────────────────────────────
// Feature Registry
// ─────────────────────────────────────────────────────────────
class FeatureRegistryClass {
  private features: Map<string, FeatureModule> = new Map();
  private mainFeatures: Map<string, MainFeatureModule> = new Map();
  private adminFeatures: Map<string, AdminFeatureModule> = new Map();
  private introductionPlugins: Map<string, IntroductionSectionPlugin> = new Map();
  private dashboardPlugins: Map<string, DashboardPlugin> = new Map();
  private storageListPlugins: Map<string, StorageListPlugin> = new Map();
  private workflowTabPlugins: Map<string, WorkflowTabPlugin> = new Map();
  private canvasPagePlugins: Map<string, CanvasPagePlugin> = new Map();

  // ── FeatureModule (기존 호환) ──
  register(feature: FeatureModule): void {
    this.features.set(feature.id, feature);
  }

  get(id: string): FeatureModule | undefined {
    return this.features.get(id);
  }

  getAll(): FeatureModule[] {
    return Array.from(this.features.values());
  }

  unregister(id: string): void {
    this.features.delete(id);
  }

  // ── MainFeatureModule ──
  registerMainFeature(feature: MainFeatureModule): void {
    this.mainFeatures.set(feature.id, feature);
  }

  getMainFeature(id: string): MainFeatureModule | undefined {
    return this.mainFeatures.get(id);
  }

  getMainFeatures(): MainFeatureModule[] {
    return Array.from(this.mainFeatures.values());
  }

  getMainFeaturesBySidebar(section: SidebarSectionId): MainFeatureModule[] {
    return this.getMainFeatures().filter(f => f.sidebarSection === section);
  }

  // ── AdminFeatureModule ──
  registerAdminFeature(feature: AdminFeatureModule): void {
    this.adminFeatures.set(feature.id, feature);
  }

  getAdminFeature(id: string): AdminFeatureModule | undefined {
    return this.adminFeatures.get(id);
  }

  getAdminFeatures(): AdminFeatureModule[] {
    return Array.from(this.adminFeatures.values());
  }

  getAdminFeaturesBySection(section: AdminSidebarSectionId): AdminFeatureModule[] {
    return this.getAdminFeatures().filter(f => f.adminSection === section);
  }

  /** 모든 admin feature의 route를 flat하게 반환 */
  getAdminRouteComponent(itemId: string): ComponentType<RouteComponentProps> | undefined {
    for (const feature of this.adminFeatures.values()) {
      if (feature.routes[itemId]) {
        return feature.routes[itemId];
      }
    }
    return undefined;
  }

  // ── IntroductionSectionPlugin ──
  registerIntroductionPlugin(plugin: IntroductionSectionPlugin): void {
    this.introductionPlugins.set(plugin.id, plugin);
  }

  getIntroductionPlugins(): IntroductionSectionPlugin[] {
    return Array.from(this.introductionPlugins.values());
  }

  // ── DashboardPlugin ──
  registerDashboardPlugin(plugin: DashboardPlugin): void {
    this.dashboardPlugins.set(plugin.id, plugin);
  }

  getDashboardPlugins(): DashboardPlugin[] {
    return Array.from(this.dashboardPlugins.values());
  }

  // ── StorageListPlugin ──
  registerStorageListPlugin(plugin: StorageListPlugin): void {
    this.storageListPlugins.set(plugin.id, plugin);
  }

  getStorageListPlugin(id: string): StorageListPlugin | undefined {
    return this.storageListPlugins.get(id);
  }

  getStorageListPlugins(): StorageListPlugin[] {
    return Array.from(this.storageListPlugins.values());
  }

  // ── WorkflowTabPlugin ──
  registerWorkflowTabPlugin(plugin: WorkflowTabPlugin): void {
    this.workflowTabPlugins.set(plugin.id, plugin);
  }

  getWorkflowTabPlugins(): WorkflowTabPlugin[] {
    return Array.from(this.workflowTabPlugins.values())
      .sort((a, b) => a.order - b.order);
  }

  // ── CanvasPagePlugin ──
  registerCanvasPagePlugin(plugin: CanvasPagePlugin): void {
    this.canvasPagePlugins.set(plugin.id, plugin);
  }

  getCanvasPagePlugins(): CanvasPagePlugin[] {
    return Array.from(this.canvasPagePlugins.values());
  }

  getCanvasPagePlugin(id: string): CanvasPagePlugin | undefined {
    return this.canvasPagePlugins.get(id);
  }
}

export const FeatureRegistry = new FeatureRegistryClass();

// Re-export React types for convenience
export type { ComponentType, FC, ReactNode } from 'react';
