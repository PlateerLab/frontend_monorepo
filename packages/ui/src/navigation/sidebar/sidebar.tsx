'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@xgen/i18n';
import { FiChevronLeft, FiChevronRight, FiChevronUp, FiHelpCircle, FiSettings, FiLogOut } from '@xgen/icons';
import type { SidebarConfig, SidebarSection as SidebarSectionType, SidebarSectionId } from '@xgen/types';
import { SidebarSection } from './sidebar-section';
import { SidebarPopover, PopoverItem } from './sidebar-popover';
import styles from './sidebar.module.scss';

// ─────────────────────────────────────────────────────────────
// Section Icons (기본 아이콘)
// ─────────────────────────────────────────────────────────────

const DefaultSectionIcons: Record<string, React.ReactNode> = {
  workspace: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  chat: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 12C21 16.418 16.97 20 12 20C10.5 20 9.08 19.68 7.8 19.12L3 20L4.3 16.1C3.47 14.87 3 13.47 3 12C3 7.582 7.03 4 12 4C16.97 4 21 7.582 21 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  workflow: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  model: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L22 7V17L12 22L2 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M12 12L22 7M12 12L2 7M12 12V22" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  data: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="12" cy="6" rx="8" ry="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 6V18C4 19.66 7.58 21 12 21C16.42 21 20 19.66 20 18V6" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 12C4 13.66 7.58 15 12 15C16.42 15 20 13.66 20 12" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  support: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  admin: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M19.4 15C19.1277 15.6171 19.2583 16.3378 19.73 16.82L19.79 16.88C20.1656 17.2551 20.3766 17.7642 20.3766 18.295C20.3766 18.8258 20.1656 19.3349 19.79 19.71C19.4149 20.0856 18.9058 20.2966 18.375 20.2966C17.8442 20.2966 17.3351 20.0856 16.96 19.71L16.9 19.65C16.4178 19.1783 15.6971 19.0477 15.08 19.32C14.4755 19.5791 14.0826 20.1724 14.08 20.83V21C14.08 22.1046 13.1846 23 12.08 23C10.9754 23 10.08 22.1046 10.08 21V20.91C10.0642 20.2327 9.63587 19.6339 9 19.4C8.38291 19.1277 7.66219 19.2583 7.18 19.73L7.12 19.79C6.74485 20.1656 6.23582 20.3766 5.705 20.3766C5.17418 20.3766 4.66515 20.1656 4.29 19.79C3.91445 19.4149 3.70343 18.9058 3.70343 18.375C3.70343 17.8442 3.91445 17.3351 4.29 16.96L4.35 16.9C4.82167 16.4178 4.95233 15.6971 4.68 15.08C4.42093 14.4755 3.82764 14.0826 3.17 14.08H3C1.89543 14.08 1 13.1846 1 12.08C1 10.9754 1.89543 10.08 3 10.08H3.09C3.76733 10.0642 4.36613 9.63587 4.6 9C4.87233 8.38291 4.74167 7.66219 4.27 7.18L4.21 7.12C3.83445 6.74485 3.62343 6.23582 3.62343 5.705C3.62343 5.17418 3.83445 4.66515 4.21 4.29C4.58515 3.91445 5.09418 3.70343 5.625 3.70343C6.15582 3.70343 6.66485 3.91445 7.04 4.29L7.1 4.35C7.58219 4.82167 8.30291 4.95233 8.92 4.68H9C9.60447 4.42093 9.99738 3.82764 10 3.17V3C10 1.89543 10.8954 1 12 1C13.1046 1 14 1.89543 14 3V3.09C14.0026 3.74764 14.3955 4.34093 15 4.6C15.6171 4.87233 16.3378 4.74167 16.82 4.27L16.88 4.21C17.2551 3.83445 17.7642 3.62343 18.295 3.62343C18.8258 3.62343 19.3349 3.83445 19.71 4.21C20.0856 4.58515 20.2966 5.09418 20.2966 5.625C20.2966 6.15582 20.0856 6.66485 19.71 7.04L19.65 7.1C19.1783 7.58219 19.0477 8.30291 19.32 8.92V9C19.5791 9.60447 20.1724 9.99738 20.83 10H21C22.1046 10 23 10.8954 23 12C23 13.1046 22.1046 14 21 14H20.91C20.2524 14.0026 19.6591 14.3955 19.4 15Z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
};

const getDefaultIcon = (sectionId: string): React.ReactNode => {
  // ID에서 키워드 추출하여 매칭
  if (sectionId.includes('workspace') || sectionId.includes('dashboard')) return DefaultSectionIcons.workspace;
  if (sectionId.includes('chat')) return DefaultSectionIcons.chat;
  if (sectionId.includes('workflow') || sectionId.includes('canvas')) return DefaultSectionIcons.workflow;
  if (sectionId.includes('model') || sectionId.includes('ml')) return DefaultSectionIcons.model;
  if (sectionId.includes('data') || sectionId.includes('document')) return DefaultSectionIcons.data;
  if (sectionId.includes('support') || sectionId.includes('faq')) return DefaultSectionIcons.support;
  if (sectionId.includes('admin')) return DefaultSectionIcons.admin;
  return DefaultSectionIcons.workspace;
};

// ─────────────────────────────────────────────────────────────
// Sidebar Props
// ─────────────────────────────────────────────────────────────

export interface SidebarProps {
  /** 사이드바 설정 */
  config: SidebarConfig;
}

/**
 * Sidebar - 범용 사이드바 컴포넌트
 *
 * admin, main, mypage, support 등 모든 페이지에서 사용 가능한 공통 사이드바.
 * SidebarConfig를 통해 섹션, 메뉴, 사용자 정보 등을 설정합니다.
 *
 * @example
 * ```tsx
 * const config: SidebarConfig = {
 *   logo: { expanded: 'XGEN', collapsed: 'X' },
 *   header: { modeLabelKey: 'sidebar.userMode' },
 *   sections: [
 *     {
 *       id: 'workspace',
 *       titleKey: 'sidebar.workspace.title',
 *       items: [
 *         { id: 'dashboard', titleKey: 'sidebar.dashboard' },
 *       ],
 *     },
 *   ],
 *   support: {
 *     titleKey: 'sidebar.support.title',
 *     items: [
 *       { id: 'faq', titleKey: 'sidebar.faq' },
 *     ],
 *   },
 *   user: { name: 'John', role: 'Admin' },
 *   onNavigate: (id) => router.push(`/main?view=${id}`),
 *   onLogout: handleLogout,
 *   collapsed: false,
 *   onToggle: () => setCollapsed(!collapsed),
 *   activeItemId: 'dashboard',
 * };
 *
 * <Sidebar config={config} />
 * ```
 */
export const Sidebar: React.FC<SidebarProps> = ({ config }) => {
  const { t } = useTranslation();
  const {
    logo,
    header,
    sections,
    support,
    user,
    onLogout,
    onNavigate,
    onLogoClick,
    collapsed = false,
    onToggle,
    activeItemId = '',
    variant = 'main',
    className,
  } = config;

  // 현재 확장된 섹션
  const [expandedSection, setExpandedSection] = useState<SidebarSectionId | null>(null);
  // 지원 섹션 확장 상태
  const [supportExpanded, setSupportExpanded] = useState(false);
  // 팝오버 상태 (축소 시)
  const [openPopover, setOpenPopover] = useState<SidebarSectionId | 'support' | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<DOMRect | null>(null);

  // 활성 아이템에 따라 섹션 자동 확장
  useEffect(() => {
    if (collapsed) {
      setExpandedSection(null);
      setSupportExpanded(false);
      return;
    }

    // 활성 아이템이 속한 섹션 찾기
    const activeSection = sections.find((section) =>
      section.items.some((item) => item.id === activeItemId)
    );
    if (activeSection) {
      setExpandedSection(activeSection.id);
    }

    // 지원 섹션 활성 아이템 확인
    if (support?.items.some((item) => item.id === activeItemId)) {
      setSupportExpanded(true);
    }
  }, [activeItemId, sections, support, collapsed]);

  // 섹션 토글
  const toggleSection = useCallback((sectionId: SidebarSectionId) => {
    setExpandedSection((prev) => (prev === sectionId ? null : sectionId));
  }, []);

  // 축소 상태에서 섹션 클릭 (팝오버 표시)
  const handleCollapsedSectionClick = useCallback(
    (sectionId: SidebarSectionId, e: React.MouseEvent) => {
      setPopoverAnchor((e.currentTarget as HTMLElement).getBoundingClientRect());
      setOpenPopover(sectionId);
    },
    []
  );

  // 축소 상태에서 지원 섹션 클릭
  const handleSupportClickWhenCollapsed = useCallback((e: React.MouseEvent) => {
    setPopoverAnchor((e.currentTarget as HTMLElement).getBoundingClientRect());
    setOpenPopover('support');
  }, []);

  // 팝오버 아이템 생성
  const popoverItems = useMemo((): PopoverItem[] => {
    if (openPopover === 'support' && support) {
      return support.items.map((item) => ({
        id: item.id,
        title: t(item.titleKey),
        href: item.href,
      }));
    }

    const section = sections.find((s) => s.id === openPopover);
    if (!section) return [];

    return section.items.map((item) => ({
      id: item.id,
      title: t(item.titleKey),
      href: item.href,
    }));
  }, [openPopover, sections, support, t]);

  // 팝오버 아이템 클릭
  const handlePopoverItemClick = useCallback(
    (id: string, href?: string) => {
      onNavigate(id, href);
    },
    [onNavigate]
  );

  // 로고 클릭
  const handleLogoClick = useCallback(() => {
    if (onLogoClick) {
      onLogoClick();
    } else {
      // 기본: 첫 번째 메뉴로 이동
      const firstItem = sections[0]?.items[0];
      if (firstItem) {
        onNavigate(firstItem.id, firstItem.href);
      }
    }
  }, [onLogoClick, onNavigate, sections]);

  // 지원 아이템 활성 상태 확인
  const isSupportActive =
    support?.items.some((item) => item.id === activeItemId) || false;

  // 바리언트 클래스
  const variantClass = variant === 'admin' ? styles.variantAdmin : '';

  return (
    <motion.aside
      className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${variantClass} ${className || ''}`}
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ type: 'tween', duration: 0.3 }}
    >
      {/* SVG gradient for active state */}
      <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <linearGradient id="sidebarActiveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0.0164" stopColor="#305EEB" />
            <stop offset="1" stopColor="#783CED" />
          </linearGradient>
        </defs>
      </svg>

      {/* Collapse Toggle Button */}
      {onToggle && (
        <button
          onClick={onToggle}
          className={styles.collapseToggleBtn}
          title={collapsed ? t('sidebar.openSidebar') : t('sidebar.closeSidebar')}
          aria-label={collapsed ? t('sidebar.openSidebar') : t('sidebar.closeSidebar')}
        >
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      )}

      <div className={styles.sidebarContent}>
        {/* Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.headerTop}>
            <button className={styles.logoButton} onClick={handleLogoClick}>
              <span className={styles.logoText}>
                {collapsed ? (logo?.collapsed || 'X') : (logo?.expanded || 'XGEN')}
              </span>
            </button>
            {!collapsed && header?.modeLabelKey && (
              <span className={styles.headerModeLabel}>{t(header.modeLabelKey)}</span>
            )}
            {!collapsed && header?.showAdminButton && header?.onAdminClick && (
              <button
                type="button"
                onClick={header.onAdminClick}
                className={styles.headerAdminButton}
                title={t('common.adminPage')}
              >
                <FiSettings />
              </button>
            )}
          </div>
        </div>

        {/* Section List */}
        <div className={styles.sidebarSectionList}>
          {sections.map((section) => (
            <SidebarSection
              key={section.id}
              section={section}
              isExpanded={expandedSection === section.id}
              onToggle={() => toggleSection(section.id)}
              activeItemId={activeItemId}
              onItemClick={onNavigate}
              isSidebarCollapsed={collapsed}
              onCollapsedSectionClick={(e) => handleCollapsedSectionClick(section.id, e)}
              isPopoverOpen={openPopover === section.id}
              defaultIcon={getDefaultIcon(section.id)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className={styles.sidebarFooter}>
          <hr className={styles.sidebarFooterDivider} />

          {/* Support Section */}
          {support && (
            <>
              {!collapsed && (
                <nav
                  className={`${styles.supportNav} ${supportExpanded ? styles.supportNavExpanded : ''}`}
                >
                  <div className={styles.supportNavInner}>
                    {support.items.map((item) => (
                      <button
                        key={item.id}
                        className={`${styles.supportNavItem} ${activeItemId === item.id ? styles.active : ''}`}
                        onClick={() => onNavigate(item.id, item.href)}
                      >
                        <span className={styles.supportNavTitle}>{t(item.titleKey)}</span>
                      </button>
                    ))}
                  </div>
                </nav>
              )}

              <button
                type="button"
                className={`${styles.supportButton} ${isSupportActive || supportExpanded ? styles.supportButtonActive : ''}`}
                onClick={
                  collapsed
                    ? handleSupportClickWhenCollapsed
                    : () => setSupportExpanded((prev) => !prev)
                }
                data-sidebar-trigger
              >
                <FiHelpCircle />
                {!collapsed && (
                  <>
                    <span className={styles.supportButtonLabel}>{t(support.titleKey)}</span>
                    <span
                      className={`${styles.supportChevron} ${supportExpanded ? styles.supportChevronExpanded : ''}`}
                    >
                      <FiChevronUp />
                    </span>
                  </>
                )}
              </button>

              <hr className={styles.sidebarFooterDivider} />
            </>
          )}

          {/* User Profile */}
          {user && (
            <div className={styles.footerUserRow}>
              <button className={styles.userProfileRow} type="button">
                <div className={styles.userAvatar}>
                  {user.avatar || user.name.charAt(0).toUpperCase()}
                </div>
                {!collapsed && (
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{user.name}</span>
                    {user.role && <span className={styles.userRole}>{user.role}</span>}
                  </div>
                )}
              </button>
              {!collapsed && onLogout && (
                <button
                  type="button"
                  className={styles.footerLogoutButton}
                  onClick={onLogout}
                  title={t('common.logout')}
                >
                  <FiLogOut />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Popover for collapsed state */}
      {openPopover && (
        <SidebarPopover
          anchorRect={popoverAnchor}
          items={popoverItems}
          activeItemId={activeItemId}
          onItemClick={handlePopoverItemClick}
          onClose={() => setOpenPopover(null)}
        />
      )}
    </motion.aside>
  );
};

export default Sidebar;
