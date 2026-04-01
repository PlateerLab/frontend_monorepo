'use client';

import React from 'react';
import { useTranslation } from '@xgen/i18n';
import { FiChevronDown } from '@xgen/icons';
import type { SidebarSection as SidebarSectionType, SidebarMenuItem } from '@xgen/types';
import styles from './sidebar.module.scss';

export interface SidebarSectionProps {
  /** 섹션 데이터 */
  section: SidebarSectionType;
  /** 확장 상태 */
  isExpanded: boolean;
  /** 토글 핸들러 */
  onToggle: () => void;
  /** 현재 활성 아이템 ID */
  activeItemId: string;
  /** 아이템 클릭 핸들러 */
  onItemClick: (itemId: string, href?: string) => void;
  /** 사이드바 축소 상태 */
  isSidebarCollapsed: boolean;
  /** 축소 상태에서 섹션 클릭 핸들러 (팝오버용) */
  onCollapsedSectionClick: (e: React.MouseEvent) => void;
  /** 팝오버 열림 상태 */
  isPopoverOpen: boolean;
  /** 섹션 기본 아이콘 (icon이 없을 때 사용) */
  defaultIcon?: React.ReactNode;
}

/**
 * SidebarSection - 아코디언 스타일 사이드바 섹션
 *
 * @example
 * ```tsx
 * <SidebarSection
 *   section={{
 *     id: 'workspace',
 *     titleKey: 'sidebar.workspace.title',
 *     items: [{ id: 'dashboard', titleKey: 'sidebar.dashboard' }],
 *   }}
 *   isExpanded={expandedSection === 'workspace'}
 *   onToggle={() => toggleSection('workspace')}
 *   activeItemId={activeItem}
 *   onItemClick={handleNavigate}
 *   isSidebarCollapsed={collapsed}
 *   onCollapsedSectionClick={handleCollapsedClick}
 *   isPopoverOpen={openPopover === 'workspace'}
 * />
 * ```
 */
export const SidebarSection: React.FC<SidebarSectionProps> = ({
  section,
  isExpanded,
  onToggle,
  activeItemId,
  onItemClick,
  isSidebarCollapsed,
  onCollapsedSectionClick,
  isPopoverOpen,
  defaultIcon,
}) => {
  const { t } = useTranslation();

  // 섹션 내 활성 아이템이 있는지 확인
  const hasActiveItem = section.items.some((item) => item.id === activeItemId);
  const isActive = isExpanded || isPopoverOpen || hasActiveItem;

  // 섹션 아이콘 렌더링
  const renderIcon = () => {
    if (section.icon) {
      const IconComponent = section.icon;
      return <IconComponent className={styles.toggleSectionIcon} />;
    }
    return defaultIcon ? <span className={styles.toggleSectionIcon}>{defaultIcon}</span> : null;
  };

  // 클릭 핸들러
  const handleToggleClick = (e: React.MouseEvent) => {
    if (isSidebarCollapsed) {
      onCollapsedSectionClick(e);
    } else {
      onToggle();
    }
  };

  return (
    <>
      {/* 섹션 토글 버튼 */}
      <button
        className={`${styles.sectionToggle} ${isActive ? styles.active : ''}`}
        onClick={handleToggleClick}
        data-sidebar-trigger
      >
        {renderIcon()}
        <span className={styles.toggleTitle}>{t(section.titleKey)}</span>
        <span className={`${styles.toggleIcon} ${isExpanded ? styles.expanded : ''}`}>
          <FiChevronDown />
        </span>
      </button>

      {/* 서브메뉴 (아코디언 콘텐츠) */}
      <nav className={`${styles.sectionNav} ${isExpanded ? styles.expanded : ''}`}>
        <div className={styles.sectionNavInner}>
          {section.items.map((item) => (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id, item.href)}
              className={`${styles.navItem} ${styles.navItemNoIcon} ${activeItemId === item.id ? styles.active : ''}`}
              disabled={item.disabled}
            >
              <div className={styles.navText}>
                <div className={styles.navTitle}>{t(item.titleKey)}</div>
              </div>
              {item.badge && (
                <span className={styles.navBadge}>{item.badge}</span>
              )}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
};

export default SidebarSection;
