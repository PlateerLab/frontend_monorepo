import type { ComponentType } from 'react';

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
  | 'model'
  | 'ml-model'
  | 'data'
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
  username: string;
  email?: string;
  role?: string;
  permissions?: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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
// Feature Registry
// ─────────────────────────────────────────────────────────────
class FeatureRegistryClass {
  private features: Map<string, FeatureModule> = new Map();
  private mainFeatures: Map<string, MainFeatureModule> = new Map();
  private introductionPlugins: Map<string, IntroductionSectionPlugin> = new Map();
  private dashboardPlugins: Map<string, DashboardPlugin> = new Map();
  private storageListPlugins: Map<string, StorageListPlugin> = new Map();

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
}

export const FeatureRegistry = new FeatureRegistryClass();

// Re-export React types for convenience
export type { ComponentType, FC, ReactNode } from 'react';
