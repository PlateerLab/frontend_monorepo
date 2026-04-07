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
import { adminSidebarConfig, toSidebarSections } from './adminSidebarConfig';

// ─────────────────────────────────────────────────────────────
// Admin Sidebar Section Icons (원본으로부터 가져옴)
// ─────────────────────────────────────────────────────────────

const SECTION_ICONS: Record<string, React.ReactNode> = {
  'admin-user': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  'admin-workflow': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  'admin-setting': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  'admin-system': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  'admin-data': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6V18C4 19.66 7.58 21 12 21C16.42 21 20 19.66 20 18V6" /><path d="M4 12C4 13.66 7.58 15 12 15C16.42 15 20 13.66 20 12" />
    </svg>
  ),
  'admin-mcp': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  ),
  'admin-governance': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" /><path d="M3 10h18" /><path d="M5 6l7-3 7 3" /><line x1="4" y1="10" x2="4" y2="21" /><line x1="8" y1="10" x2="8" y2="21" /><line x1="12" y1="10" x2="12" y2="21" /><line x1="16" y1="10" x2="16" y2="21" /><line x1="20" y1="10" x2="20" y2="21" />
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────
// AdminSidebar Component
// ─────────────────────────────────────────────────────────────

export interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeItem: string;
  onItemClick: (itemId: string) => void;
  userName?: string;
  locale?: string;
  onLocaleChange?: (locale: string) => void;
  onLogout: () => void;
  onBackToChat?: () => void;
  onUserClick?: () => void;
  onLogoClick?: () => void;
  className?: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  onToggle,
  activeItem,
  onItemClick,
  userName,
  locale,
  onLocaleChange,
  onLogout,
  onBackToChat,
  onUserClick,
  onLogoClick,
  className,
}) => {
  const { t } = useTranslation();
  const [showLangPopover, setShowLangPopover] = React.useState(false);

  const sections = useMemo(() => toSidebarSections(adminSidebarConfig), []);

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
          <SidebarLogoButton onClick={onLogoClick || (() => handleItemClick('dashboard'))}>
            {isOpen
              ? <img src="/icons/logo/Icon_Logo_M.svg" alt="XGEN" height={30} style={{ height: 30, width: 'auto' }} />
              : <img src="/icons/logo/Icon_Logo_Symbol.svg" alt="X" height={30} style={{ height: 30, width: 'auto' }} />
            }
          </SidebarLogoButton>
          {isOpen && (
            <SidebarModeLabel className="text-[var(--color-info-200)]">
              {t('sidebar.adminMode')}
            </SidebarModeLabel>
          )}
        </SidebarHeaderTop>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        <SidebarSectionList>
          {/* Dashboard button (before sections) */}
          <SidebarSectionToggle
            title="Admin"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" /><path d="M2 17L12 22L22 17" /><path d="M2 12L12 17L22 12" />
              </svg>
            }
            isExpanded={false}
            isActive={activeItem === 'dashboard'}
            isSidebarClosed={!isOpen}
            onClick={() => handleItemClick('dashboard')}
          />

          {/* 9 Sections */}
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
              {onBackToChat && (
                <SidebarFooterButton
                  onClick={onBackToChat}
                  title={t('admin.sidebar.backToChat')}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  }
                />
              )}
              {onLocaleChange && (
                <div className="relative">
                  <SidebarFooterButton
                    onClick={() => setShowLangPopover((v) => !v)}
                    title={t('common.language')}
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    }
                  />
                  {showLangPopover && (
                    <>
                      <div className="fixed inset-0 z-[998]" onClick={() => setShowLangPopover(false)} />
                      <div className="absolute bottom-full left-0 mb-2 z-[999] bg-white rounded-lg border border-[var(--color-line-50)] shadow-lg py-1 min-w-[100px]">
                        {[
                          { value: 'ko', label: 'KOR', sub: '한국어' },
                          { value: 'en', label: 'ENG', sub: 'English' },
                        ].map((lang) => (
                          <button
                            key={lang.value}
                            type="button"
                            className={`w-full px-3 py-2 text-left text-sm cursor-pointer border-none transition-colors duration-150 flex items-center justify-between gap-3 ${
                              locale === lang.value
                                ? 'bg-[var(--color-primary-w-50,#f0f0ff)] text-[var(--color-secondary-200,#305EEB)] font-semibold'
                                : 'bg-transparent text-[var(--color-gray-800)] hover:bg-[var(--color-bg-50)]'
                            }`}
                            onClick={() => {
                              onLocaleChange(lang.value);
                              setShowLangPopover(false);
                            }}
                          >
                            <span className="font-semibold">{lang.label}</span>
                            <span className="text-xs text-[var(--color-gray-500)]">{lang.sub}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
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
