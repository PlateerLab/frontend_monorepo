'use client';

import React from 'react';
import { Sidebar } from '@xgen/ui';
import type { SidebarConfig } from '@xgen/types';
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
  });

  return <Sidebar config={config} />;
};
