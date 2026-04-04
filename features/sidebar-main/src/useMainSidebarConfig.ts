'use client';

import { useMemo } from 'react';
import { useTranslation } from '@xgen/i18n';
import type { SidebarConfig, SidebarSection, SidebarLabelOverrides } from '@xgen/types';

export interface MainSidebarSection {
  id: string;
  titleKey: string;
  items: {
    id: string;
    titleKey: string;
    descriptionKey?: string;
    iconComponent?: React.ComponentType<{ className?: string }>;
  }[];
}

interface UseMainSidebarConfigOptions {
  sections: MainSidebarSection[];
  activeItemId: string;
  collapsed: boolean;
  userName?: string;
  isAdmin?: boolean;
  onNavigate: (itemId: string, href?: string) => void;
  onToggle: () => void;
  onLogout: () => void;
  onAdminClick?: () => void;
  /** 섹션/아이템 타이틀 오버라이드 (앱 레벨 커스텀) */
  labelOverrides?: SidebarLabelOverrides;
}

/**
 * Main/Canvas 페이지 사이드바 config 생성 훅.
 * 이전에 page.tsx에 있던 config 빌드 로직을 재사용 가능하게 추출.
 */
export function useMainSidebarConfig({
  sections,
  activeItemId,
  collapsed,
  userName,
  isAdmin,
  onNavigate,
  onToggle,
  onLogout,
  onAdminClick,
  labelOverrides,
}: UseMainSidebarConfigOptions): SidebarConfig {
  const { t } = useTranslation();

  const sidebarSections: SidebarSection[] = useMemo(
    () =>
      sections.map((section) => {
        const sectionOverride = labelOverrides?.[section.id];
        return {
          id: section.id,
          titleKey: section.titleKey,
          title: sectionOverride?.title,
          items: section.items.map((item) => ({
            id: item.id,
            titleKey: item.titleKey,
            title: sectionOverride?.items?.[item.id]?.title,
            descriptionKey: item.descriptionKey,
            icon: item.iconComponent,
          })),
        };
      }),
    [sections, labelOverrides],
  );

  return useMemo(
    (): SidebarConfig => ({
      logo: { expanded: 'XGEN', collapsed: 'X' },
      header: {
        modeLabelKey: 'sidebar.userMode',
        showAdminButton: Boolean(onAdminClick),
        onAdminClick,
      },
      sections: sidebarSections,
      support: {
        titleKey: 'sidebar.support.title',
        items: [
          { id: 'service-request', titleKey: 'sidebar.support.request.title', href: '/support?view=inquiry' },
          { id: 'faq', titleKey: 'sidebar.support.faq.title' },
        ],
      },
      user: {
        name: userName || 'User',
        role: isAdmin ? 'Admin' : 'Member',
      },
      onNavigate,
      onLogoClick: () => onNavigate('main-dashboard'),
      onLogout,
      collapsed,
      onToggle,
      activeItemId,
      variant: 'main',
    }),
    [sidebarSections, activeItemId, collapsed, userName, isAdmin, onNavigate, onToggle, onLogout, onAdminClick],
  );
}
