import type { ComponentType } from 'react';

// Feature Module Types
export interface RouteComponentProps {
  params?: Record<string, string>;
  searchParams?: Record<string, string | string[] | undefined>;
}

export interface SidebarItem {
  id: string;
  titleKey: string;
  descriptionKey?: string;
  icon?: string;
}

export interface FeatureModule {
  id: string;
  name: string;
  sidebarSection?: string;
  sidebarItems?: SidebarItem[];
  routes?: Record<string, ComponentType<RouteComponentProps>>;
}

// ─────────────────────────────────────────────────────────────
// Introduction Page Plugin
//
// "인트로/랜딩 페이지에 끼워질 수 있는 섹션"의 계약.
// auth-Introduction Feature가 이 슬롯들을 Registry에서 꺼내
// 렌더링한다. 각 섹션 Feature는 자기가 채울 슬롯만 선언하면 된다.
// ─────────────────────────────────────────────────────────────
export interface IntroductionHeaderProps {
  user: { username: string } | null;
  onLogout: () => void;
}

export interface IntroductionSectionPlugin {
  id: string;
  name: string;
  /** 최상단 헤더 컴포넌트 */
  headerComponent?: ComponentType<IntroductionHeaderProps>;
  /** 히어로(메인 타이틀) 섹션 컴포넌트 */
  heroComponent?: ComponentType;
  /** 기능 소개 그리드 섹션 컴포넌트 */
  featuresComponent?: ComponentType;
  /** CTA(행동 유도) 섹션 컴포넌트 */
  ctaComponent?: ComponentType;
  /** 푸터 컴포넌트 */
  footerComponent?: ComponentType;
}

// Feature Registry
class FeatureRegistryClass {
  private features: Map<string, FeatureModule> = new Map();
  private introductionPlugins: Map<string, IntroductionSectionPlugin> = new Map();

  // ── FeatureModule ──
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

  // ── IntroductionSectionPlugin ──
  registerIntroductionPlugin(plugin: IntroductionSectionPlugin): void {
    this.introductionPlugins.set(plugin.id, plugin);
  }

  getIntroductionPlugins(): IntroductionSectionPlugin[] {
    return Array.from(this.introductionPlugins.values());
  }
}

export const FeatureRegistry = new FeatureRegistryClass();

// Re-export React types for convenience
export type { ComponentType, FC, ReactNode } from 'react';
