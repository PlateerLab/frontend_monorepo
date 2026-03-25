'use client';

import React, { useState, useCallback, useEffect } from 'react';
import styles from './MainLayout.module.scss';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface SidebarSection {
  id: string;
  titleKey: string;
  items: SidebarItem[];
}

export interface SidebarItem {
  id: string;
  titleKey: string;
  descriptionKey?: string;
  icon?: React.ReactNode;
  badge?: string;
}

export interface MainLayoutProps {
  children: React.ReactNode;
  sections: SidebarSection[];
  activeItemId: string;
  onNavigate: (itemId: string) => void;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}

// ─────────────────────────────────────────────────────────────
// MainLayout Component
// ─────────────────────────────────────────────────────────────

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  sections,
  activeItemId,
  onNavigate,
  sidebarCollapsed = false,
  onSidebarToggle,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(sidebarCollapsed);

  useEffect(() => {
    setIsCollapsed(sidebarCollapsed);
  }, [sidebarCollapsed]);

  const handleToggle = useCallback(() => {
    setIsCollapsed(prev => !prev);
    onSidebarToggle?.();
  }, [onSidebarToggle]);

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoArea}>
            {!isCollapsed && <span className={styles.logoText}>XGEN</span>}
          </div>
          <button className={styles.toggleButton} onClick={handleToggle}>
            <CollapseIcon collapsed={isCollapsed} />
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {sections.map(section => (
            <div key={section.id} className={styles.section}>
              {!isCollapsed && (
                <h3 className={styles.sectionTitle}>{section.titleKey}</h3>
              )}
              <ul className={styles.sectionItems}>
                {section.items.map(item => (
                  <li key={item.id}>
                    <button
                      className={`${styles.navItem} ${activeItemId === item.id ? styles.active : ''}`}
                      onClick={() => onNavigate(item.id)}
                      title={isCollapsed ? item.titleKey : undefined}
                    >
                      {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
                      {!isCollapsed && (
                        <>
                          <span className={styles.itemTitle}>{item.titleKey}</span>
                          {item.badge && <span className={styles.itemBadge}>{item.badge}</span>}
                        </>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          {!isCollapsed && (
            <div className={styles.userSection}>
              <div className={styles.userAvatar}>U</div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>User</span>
                <span className={styles.userRole}>Member</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const CollapseIcon: React.FC<{ collapsed: boolean }> = ({ collapsed }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
  >
    <path
      d="M12.5 5L7.5 10L12.5 15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default MainLayout;
