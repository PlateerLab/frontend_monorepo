'use client';

import React, { useMemo } from 'react';
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
  onUserClick?: () => void;
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
  onUserClick,
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
      logo: {
        expanded: React.createElement('img', { src: '/icons/logo/Icon_Logo_M.svg', alt: 'XGEN', height: 30, style: { height: 30, width: 'auto' } }),
        collapsed: React.createElement('img', { src: '/icons/logo/Icon_Logo_Symbol.svg', alt: 'X', height: 30, style: { height: 30, width: 'auto' } }),
      },
      header: {
        modeLabelKey: 'sidebar.userMode',
        showAdminButton: Boolean(onAdminClick),
        onAdminClick,
      },
      sections: sidebarSections,

      user: {
        name: userName || 'User',
        role: isAdmin ? 'Admin' : 'Member',
      },
      onNavigate,
      onLogoClick: () => onNavigate('main-dashboard'),
      onLogout,
      onUserClick,
      collapsed,
      onToggle,
      activeItemId,
      variant: 'main',
    }),
    [sidebarSections, activeItemId, collapsed, userName, isAdmin, onNavigate, onToggle, onLogout, onAdminClick, onUserClick],
  );
}
