import type { ComponentType } from 'react';

// ─────────────────────────────────────────────────────────────
// Route Component Props
// ─────────────────────────────────────────────────────────────
export interface RouteComponentProps {
  params?: Record<string, string>;
  searchParams?: Record<string, string | string[] | undefined>;
}

// ─────────────────────────────────────────────────────────────
// Sidebar Types
// ─────────────────────────────────────────────────────────────
export type SidebarSectionId =
  | 'workspace'
  | 'chat'
  | 'workflow'
  | 'model'
  | 'ml-model'
  | 'data'
  | 'support';

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

export interface ChatSession extends BaseEntity {
  title: string;
  lastMessage?: string;
  messageCount: number;
  workflowId?: string;
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
