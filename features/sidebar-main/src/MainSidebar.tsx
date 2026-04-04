'use client';

import React from 'react';
import { Sidebar } from '@xgen/ui';
import type { SidebarConfig, SidebarLabelOverrides } from '@xgen/types';
import { useMainSidebarConfig, type MainSidebarSection } from './useMainSidebarConfig';

export interface MainSidebarProps {
  /** Feature sections (from featureRegistry.getSidebarSections()) */
  sections: MainSidebarSection[];
  /** Current active item ID */
  activeItemId: string;
  /** Collapsed state */
  collapsed: boolean;
  /** User display name */
  userName?: string;
  /** Whether user is admin */
  isAdmin?: boolean;
  /** Navigation handler */
  onNavigate: (itemId: string, href?: string) => void;
  /** Toggle sidebar */
  onToggle: () => void;
  /** Logout handler */
  onLogout: () => void;
  /** Admin page click handler (shows admin button when passed) */
  onAdminClick?: () => void;
  /** 섹션/아이템 타이틀 오버라이드 (앱 레벨 커스텀) */
  labelOverrides?: SidebarLabelOverrides;
}

export const MainSidebar: React.FC<MainSidebarProps> = ({
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
}) => {
  const config = useMainSidebarConfig({
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
  });

  return <Sidebar config={config} />;
};
