'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from '@xgen/i18n';
import {
  SidebarLayout,
  SidebarCollapseToggle,
  SidebarHeaderPrimitive as SidebarHeader,
  SidebarHeaderTop,
  SidebarLogoButton,
  SidebarModeLabel,
  SidebarContent,
  SidebarSectionList,
  SidebarSectionToggle,
  SidebarSectionNav,
  SidebarNavItem,
  SidebarFooter,
  SidebarDivider,
  SidebarUserProfilePrimitive as SidebarUserProfile,
  SidebarFooterButton,
  SidebarPopover,
  type PopoverItem,
} from '@xgen/ui';
import { mypageSidebarConfig, toSidebarSections } from './mypageSidebarConfig';

// ─────────────────────────────────────────────────────────────
// Mypage Sidebar Section Icons (Feather style — matching admin)
// ─────────────────────────────────────────────────────────────

const SECTION_ICONS: Record<string, React.ReactNode> = {
  'mypage-profile': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  'mypage-settings': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────
// MypageSidebar Component
// AdminSidebar와 동일한 구조 — @xgen/ui primitive 사용
// ─────────────────────────────────────────────────────────────

export interface MypageSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeItem: string;
  onItemClick: (itemId: string) => void;
  userName?: string;
  onLogout: () => void;
  onBackToMain?: () => void;
  onAdminClick?: () => void;
  onUserClick?: () => void;
  onLogoClick?: () => void;
  className?: string;
}

export const MypageSidebar: React.FC<MypageSidebarProps> = ({
  isOpen,
  onToggle,
  activeItem,
  onItemClick,
  userName,
  onLogout,
  onBackToMain,
  onAdminClick,
  onUserClick,
  onLogoClick,
  className,
}) => {
  const { t } = useTranslation();

  const sections = useMemo(() => toSidebarSections(mypageSidebarConfig), []);

  // Only 1 section open at a time (accordion)
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [openPopover, setOpenPopover] = useState<number | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<DOMRect | null>(null);

  // Auto-expand section containing active item
  useEffect(() => {
    if (!isOpen) {
      setExpandedSection(null);
      setOpenPopover(null);
      setPopoverAnchor(null);
      return;
    }
    for (const section of sections) {
      if (section.items.some((item) => item.id === activeItem)) {
        setExpandedSection(section.id);
        break;
      }
    }
  }, [activeItem, isOpen, sections]);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSection((prev) => (prev === sectionId ? null : sectionId));
  }, []);

  const handleClosedSectionClick = useCallback((sectionIndex: number, e: React.MouseEvent) => {
    setPopoverAnchor((e.currentTarget as HTMLElement).getBoundingClientRect());
    setOpenPopover(sectionIndex);
  }, []);

  const handleItemClick = useCallback((itemId: string) => {
    setOpenPopover(null);
    setPopoverAnchor(null);
    onItemClick(itemId);
  }, [onItemClick]);

  const popoverItems = useMemo((): PopoverItem[] => {
    if (openPopover == null || !sections[openPopover]) return [];
    return sections[openPopover].items.map((item) => ({ id: item.id, title: t(item.titleKey) }));
  }, [openPopover, sections, t]);

  return (
    <SidebarLayout isOpen={isOpen} openWidth={250} closedWidth={72} className={className}>
      <SidebarCollapseToggle
        isOpen={isOpen}
        onToggle={onToggle}
        openTitle={t('sidebar.openSidebar')}
        closeTitle={t('sidebar.closeSidebar')}
      />

      {/* Header */}
      <SidebarHeader className={!isOpen ? 'px-0 flex justify-center' : undefined}>
        <SidebarHeaderTop className={!isOpen ? 'justify-center' : undefined}>
          <SidebarLogoButton onClick={onLogoClick || (() => handleItemClick('profile'))}>
            {isOpen
              ? <img src="/icons/logo/Icon_Logo_M.svg" alt="XGEN" height={30} style={{ height: 30, width: 'auto' }} />
              : <img src="/icons/logo/Icon_Logo_Symbol.svg" alt="X" height={30} style={{ height: 30, width: 'auto' }} />
            }
          </SidebarLogoButton>
          {isOpen && (
            <SidebarModeLabel>
              {t('sidebar.myPageMode')}
            </SidebarModeLabel>
          )}
        </SidebarHeaderTop>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        <SidebarSectionList>
          {sections.map((section, idx) => {
            const hasActiveItem = section.items.some((item) => item.id === activeItem);
            const isExpanded = expandedSection === section.id;
            const isActive = isExpanded || openPopover === idx || hasActiveItem;

            const handleToggle = (e: React.MouseEvent) => {
              if (!isOpen) {
                handleClosedSectionClick(idx, e);
              } else {
                toggleSection(section.id);
              }
            };

            return (
              <React.Fragment key={section.id}>
                <SidebarSectionToggle
                  title={t(section.titleKey)}
                  icon={SECTION_ICONS[section.id]}
                  isExpanded={isExpanded}
                  isActive={isActive}
                  isSidebarClosed={!isOpen}
                  onClick={handleToggle}
                />
                {isOpen && (
                  <SidebarSectionNav isExpanded={isExpanded}>
                    {section.items.map((item) => (
                      <SidebarNavItem
                        key={item.id}
                        id={item.id}
                        title={t(item.titleKey)}
                        isActive={activeItem === item.id}
                        onClick={() => handleItemClick(item.id)}
                      />
                    ))}
                  </SidebarSectionNav>
                )}
              </React.Fragment>
            );
          })}
        </SidebarSectionList>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <SidebarDivider />
        <div className={`flex flex-col w-full ${!isOpen ? 'items-center' : ''}`}>
          {userName && (
            <SidebarUserProfile
              name={userName}
              onClick={onUserClick}
              title={t('common.myPage')}
              isSidebarClosed={!isOpen}
            />
          )}
          {isOpen && (
            <div className="flex items-center gap-2 px-[26px] pb-3">
              {onBackToMain && (
                <SidebarFooterButton
                  onClick={onBackToMain}
                  title={t('mypage.sidebar.goToMain')}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  }
                />
              )}
              {onAdminClick && (
                <SidebarFooterButton
                  onClick={onAdminClick}
                  title={t('admin.sidebar.title')}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  }
                />
              )}
              <SidebarFooterButton
                onClick={onLogout}
                title={t('common.logout')}
                variant="logout"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                }
              />
            </div>
          )}
        </div>
      </SidebarFooter>

      {/* Popover for collapsed state */}
      {openPopover != null && (
        <SidebarPopover
          anchorRect={popoverAnchor}
          items={popoverItems}
          activeItemId={activeItem}
          onItemClick={(id) => handleItemClick(id)}
          onClose={() => setOpenPopover(null)}
        />
      )}
    </SidebarLayout>
  );
};
