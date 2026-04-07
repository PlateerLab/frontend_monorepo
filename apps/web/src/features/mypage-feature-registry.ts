/**
 * Mypage Feature Registry
 *
 * Feature 중심 동적 빌드 — Main/Admin과 동일한 패턴.
 * 각 feature module이 자신의 sidebarItems를 선언하고,
 * 레지스트리가 섹션별로 그룹핑하여 사이드바에 전달.
 */

import type { MypageFeatureModule, SidebarItem, MypageSidebarSectionId } from '@xgen/types';
import { FeatureRegistry as CoreRegistry } from '@xgen/types';
import type { ComponentType } from 'react';
import type { RouteComponentProps } from '@xgen/types';

// ─────────────────────────────────────────────────────────────
// Mypage Section Order & Metadata
// ─────────────────────────────────────────────────────────────

interface MypageSectionMeta {
  id: MypageSidebarSectionId;
  titleKey: string;
}

const MYPAGE_SECTION_ORDER: MypageSectionMeta[] = [
  { id: 'mypage-profile', titleKey: 'mypage.sidebar.sections.profile' },
  { id: 'mypage-settings', titleKey: 'mypage.sidebar.sections.settings' },
];

// ─────────────────────────────────────────────────────────────
// Mypage Feature Initialization
// ─────────────────────────────────────────────────────────────

let mypageInitialized = false;

/**
 * Placeholder component for unimplemented mypage sections.
 */
const PlaceholderSection: ComponentType<RouteComponentProps> = () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  return React.createElement('div', {
    className: 'flex items-center justify-center h-64',
  }, React.createElement('p', {
    className: 'text-sm text-muted-foreground',
  }, 'Coming soon...'));
};

/**
 * Initialize mypage features by registering feature modules with CoreRegistry.
 */
export async function initializeMypageFeatures(): Promise<void> {
  if (mypageInitialized) return;

  try {
    // Profile section — 실제 구현된 컴포넌트 사용
    const profileMod = await import('@xgen/mypage-profile');
    const ProfileView = profileMod.ProfileView as ComponentType<RouteComponentProps>;
    const ProfileEdit = profileMod.ProfileEdit as ComponentType<RouteComponentProps>;

    const profileFeature: MypageFeatureModule = {
      id: 'mypage-profile',
      name: 'MypageProfile',
      mypageSection: 'mypage-profile',
      sidebarItems: [
        { id: 'profile', titleKey: 'mypage.sidebar.profile', descriptionKey: 'mypage.sidebar.profileDesc' },
        { id: 'profile-edit', titleKey: 'mypage.sidebar.profileEdit', descriptionKey: 'mypage.sidebar.profileEditDesc' },
      ],
      routes: {
        'profile': ProfileView,
        'profile-edit': ProfileEdit,
      },
      requiresAuth: true,
    };

    // Settings section — placeholder 컴포넌트 (미구현)
    const settingsFeature: MypageFeatureModule = {
      id: 'mypage-settings',
      name: 'MypageSettings',
      mypageSection: 'mypage-settings',
      sidebarItems: [
        { id: 'settings', titleKey: 'mypage.sidebar.settings', descriptionKey: 'mypage.sidebar.settingsDesc' },
        { id: 'security', titleKey: 'mypage.sidebar.security', descriptionKey: 'mypage.sidebar.securityDesc' },
        { id: 'notifications', titleKey: 'mypage.sidebar.notifications', descriptionKey: 'mypage.sidebar.notificationsDesc' },
      ],
      routes: {
        'settings': PlaceholderSection,
        'security': PlaceholderSection,
        'notifications': PlaceholderSection,
      },
      requiresAuth: true,
    };

    CoreRegistry.registerMypageFeature(profileFeature);
    CoreRegistry.registerMypageFeature(settingsFeature);

    mypageInitialized = true;
  } catch (error) {
    console.error('[Mypage] Failed to initialize mypage features:', error);
    mypageInitialized = true;
  }
}

/**
 * Get route component for a given mypage sidebar item ID.
 */
export function getMypageRouteComponent(itemId: string) {
  return CoreRegistry.getMypageRouteComponent(itemId);
}

/**
 * Mypage 사이드바 섹션을 Feature 기반으로 동적 빌드.
 * Admin/Main과 동일한 패턴.
 */
export function getMypageSidebarSections(): { id: string; titleKey: string; items: SidebarItem[] }[] {
  const sectionMap = new Map<string, SidebarItem[]>();

  MYPAGE_SECTION_ORDER.forEach(({ id }) => {
    sectionMap.set(id, []);
  });

  CoreRegistry.getMypageFeatures().forEach((feature) => {
    const items = sectionMap.get(feature.mypageSection);
    if (items && feature.sidebarItems) {
      items.push(...feature.sidebarItems);
    }
  });

  return MYPAGE_SECTION_ORDER
    .filter(({ id }) => {
      const items = sectionMap.get(id);
      return items && items.length > 0;
    })
    .map(({ id, titleKey }) => ({
      id,
      titleKey,
      items: sectionMap.get(id) || [],
    }));
}
