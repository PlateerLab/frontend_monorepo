import { ComponentType } from 'react';

/* ═══════════════════════════════════════════════
   Feature Module System
   ═══════════════════════════════════════════════ */

/** 사이드바 항목 정의 (i18n 키 기반) */
export interface SidebarItemDefinition {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon?: ComponentType<{ className?: string }>;
}

/** 사이드바 섹션 그룹 키 */
export type SidebarSectionKey =
  | 'workspace'
  | 'chat'
  | 'workflow'
  | 'data'
  | 'train'
  | 'model'
  | 'mlModel'
  | 'support'
  | 'mypage';

/** 라우트 컴포넌트 공통 props */
export interface RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
  onChatStarted?: () => void;
  onChatSelect?: () => void;
}

/** 독립 페이지 라우트 정의 (legacy, 현재는 Record<string, ComponentType> 방식 사용) */
export interface PageRouteDefinition {
  path: string;
  component: ComponentType<any>;
}

/**
 * FeatureModule: 최소 기능 단위 모듈
 *
 * 각 feature 패키지가 export하는 핵심 인터페이스.
 * 앱의 features.ts에서 import → registry.register()로 활성화.
 * import를 주석처리하면 해당 기능이 비활성화됨.
 */
export interface FeatureModule {
  /** 고유 ID (예: 'chat-new', 'canvas-auto-workflow') */
  id: string;
  /** 표시 이름 */
  name: string;
  /** 속할 사이드바 섹션 (없으면 독립 페이지) */
  sidebarSection?: SidebarSectionKey;
  /** 사이드바 항목 목록 */
  sidebarItems?: SidebarItemDefinition[];
  /** 섹션 ID → 컴포넌트 매핑 (메인 레이아웃 내 렌더링) */
  routes?: Record<string, ComponentType<RouteComponentProps>>;
  /** 독립 페이지 라우트 (path → 컴포넌트, Next.js 라우터로 분기) */
  pageRoutes?: Record<string, ComponentType<any>>;
  /** 섹션 아이콘 (사이드바 헤더) */
  sectionIcon?: ComponentType<{ className?: string }>;
  /** 항상 접근 가능한 항목 ID (권한 체크 안 함) */
  alwaysVisibleItems?: string[];
  /** 인트로 항목 ID (권한 체크 안 함) */
  introItems?: string[];
}

/**
 * Canvas Sub-Module: 캔버스 기능 확장 모듈
 *
 * canvas-core에 플러그인처럼 등록되는 서브 기능.
 * canvas-auto-workflow, canvas-history 등이 이 인터페이스를 사용.
 */
export interface CanvasSubModule {
  id: string;
  name: string;
  /** 캔버스 헤더에 추가할 버튼 */
  headerActions?: CanvasHeaderAction[];
  /** 캔버스 사이드 패널에 추가할 패널 */
  sidePanels?: CanvasSidePanel[];
  /** 캔버스 하단 패널에 추가할 패널 */
  bottomPanels?: CanvasBottomPanel[];
  /** 캔버스에 추가할 특수 노드 타입 */
  specialNodeTypes?: CanvasSpecialNodeType[];
  /** 캔버스 뷰에 오버레이로 추가할 컴포넌트 */
  overlayComponents?: ComponentType<any>[];
}

export interface CanvasHeaderAction {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  onClick: () => void;
  position: 'left' | 'right';
}

export interface CanvasSidePanel {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  component: ComponentType<any>;
}

export interface CanvasBottomPanel {
  id: string;
  label: string;
  component: ComponentType<any>;
}

export interface CanvasSpecialNodeType {
  type: string;
  component: ComponentType<any>;
}

/**
 * Admin Sub-Module: 관리자 기능 확장 모듈
 *
 * admin 페이지에 플러그인처럼 등록되는 서브 기능.
 * admin-user-management, admin-governance 등이 이 인터페이스를 사용.
 */
export interface AdminSubModule {
  id: string;
  name: string;
  /** 관리자 사이드바 섹션 */
  sidebarSection: string;
  /** 관리자 사이드바 항목 */
  sidebarItems: AdminSidebarItemDef[];
  /** 섹션 ID → 컴포넌트 매핑 */
  routes: Record<string, ComponentType<any>>;
}

export interface AdminSidebarItemDef {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon?: ComponentType<{ className?: string }>;
}

/** Document 탭 설정 */
export interface DocumentTabConfig {
  id: string;
  titleKey: string;
  order: number;
  component: ComponentType<RouteComponentProps>;
}

/* ═══════════════════════════════════════════════
   Feature Registry
   ═══════════════════════════════════════════════ */

export class FeatureRegistry {
  private features: Map<string, FeatureModule> = new Map();
  private canvasSubs: Map<string, CanvasSubModule> = new Map();
  private adminSubs: Map<string, AdminSubModule> = new Map();
  private docTabs: DocumentTabConfig[] = [];

  register(feature: FeatureModule): void {
    this.features.set(feature.id, feature);
  }

  registerCanvasSub(sub: CanvasSubModule): void {
    this.canvasSubs.set(sub.id, sub);
  }

  registerAdminSub(sub: AdminSubModule): void {
    this.adminSubs.set(sub.id, sub);
  }

  registerDocumentTab(tab: DocumentTabConfig): void {
    this.docTabs.push(tab);
    this.docTabs.sort((a, b) => a.order - b.order);
  }

  getAll(): FeatureModule[] { return Array.from(this.features.values()); }
  get(id: string): FeatureModule | undefined { return this.features.get(id); }

  getBySection(section: SidebarSectionKey): FeatureModule[] {
    return this.getAll().filter(f => f.sidebarSection === section);
  }

  getSidebarItems(section: SidebarSectionKey): SidebarItemDefinition[] {
    return this.getBySection(section).flatMap(f => f.sidebarItems ?? []);
  }

  getAllRoutes(): Record<string, ComponentType<RouteComponentProps>> {
    const routes: Record<string, ComponentType<RouteComponentProps>> = {};
    for (const f of this.getAll()) Object.assign(routes, f.routes ?? {});
    return routes;
  }

  getAllPageRoutes(): Record<string, ComponentType<any>> {
    const routes: Record<string, ComponentType<any>> = {};
    for (const f of this.getAll()) Object.assign(routes, f.pageRoutes ?? {});
    return routes;
  }

  hasRoute(sectionId: string): boolean {
    return this.getAll().some(f => f.routes && sectionId in f.routes);
  }

  getAlwaysVisibleItems(): string[] {
    return this.getAll().flatMap(f => f.alwaysVisibleItems ?? []);
  }

  getIntroItems(): string[] {
    return this.getAll().flatMap(f => f.introItems ?? []);
  }

  getCanvasSubs(): CanvasSubModule[] { return Array.from(this.canvasSubs.values()); }
  getAdminSubs(): AdminSubModule[] { return Array.from(this.adminSubs.values()); }
  getDocumentTabs(): DocumentTabConfig[] { return [...this.docTabs]; }

  /** 전체 사이드바 항목 맵 (i18n 키 기반) */
  buildSidebarItemMap(): Record<string, { titleKey: string; descriptionKey: string }> {
    const map: Record<string, { titleKey: string; descriptionKey: string }> = {};
    for (const f of this.getAll()) {
      for (const item of f.sidebarItems ?? []) {
        map[item.id] = { titleKey: item.titleKey, descriptionKey: item.descriptionKey };
      }
    }
    return map;
  }
}

/* ═══════════════════════════════════════════════
   Common Types
   ═══════════════════════════════════════════════ */

export type TranslateFunction = (key: string, vars?: Record<string, unknown>) => string;
export type Locale = 'ko' | 'en';

export interface User {
  user_id: number;
  username: string;
  access_token: string;
}

export interface AvailableSections {
  available_user_section: string[];
  available_admin_section: string[];
}

export interface AuthContextType {
  user: User | null;
  availableSections: AvailableSections | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoggingOut: boolean;
  setUser: (user: User | null) => void;
  clearAuth: (clearStorage?: boolean) => void;
  refreshAuth: () => void;
  hasAccessToSection: (sectionId: string) => boolean;
  updateAvailableSections: (sections: AvailableSections) => void;
}

export interface ContentAreaProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  headerButtons?: React.ReactNode;
  className?: string;
  showHeader?: boolean;
  variant?: 'card' | 'page' | 'toolStorage';
}
