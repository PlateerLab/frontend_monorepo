'use client';

import React from 'react';
import styles from './MainSidebar.module.scss';
import { useTranslation } from '@xgen/i18n';

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

export interface MainSidebarProps {
  sections: SidebarSection[];
  activeItemId: string;
  onNavigate: (itemId: string) => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

// ─────────────────────────────────────────────────────────────
// Sidebar Icons
// ─────────────────────────────────────────────────────────────

export const SidebarIcons = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="11" y="2" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="2" y="11" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="11" y="11" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  chat: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 10C17 13.866 13.866 17 10 17C8.98 17 8.01 16.79 7.13 16.41L3 17L3.59 12.87C3.21 11.99 3 11.02 3 10C3 6.134 6.134 3 10 3C13.866 3 17 6.134 17 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  workflow: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="15" cy="5" r="2" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="10" cy="15" r="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6.5 6.5L9 13M13.5 6.5L11 13" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  model: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L18 6V14L10 18L2 14V6L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M10 10L18 6M10 10L2 6M10 10V18" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  data: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="10" cy="5" rx="6" ry="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 5V15C4 16.1 6.69 17 10 17C13.31 17 16 16.1 16 15V5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 10C4 11.1 6.69 12 10 12C13.31 12 16 11.1 16 10" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  support: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 14V10M10 7H10.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 2V4M10 16V18M2 10H4M16 10H18M4.22 4.22L5.64 5.64M14.36 14.36L15.78 15.78M4.22 15.78L5.64 14.36M14.36 5.64L15.78 4.22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────
// Helper to get icon by section
// ─────────────────────────────────────────────────────────────

const getSectionIcon = (sectionId: string, itemId: string): React.ReactNode => {
  const icons: Record<string, React.ReactNode> = {
    'dashboard': SidebarIcons.dashboard,
    'chat': SidebarIcons.chat,
    'chat-intro': SidebarIcons.chat,
    'chat-history': SidebarIcons.chat,
    'chat-new': SidebarIcons.chat,
    'workflow': SidebarIcons.workflow,
    'canvas': SidebarIcons.workflow,
    'workflows': SidebarIcons.workflow,
    'documents': SidebarIcons.workflow,
    'tool-storage': SidebarIcons.workflow,
    'prompt-storage': SidebarIcons.workflow,
    'model': SidebarIcons.model,
    'model-train': SidebarIcons.model,
    'model-eval': SidebarIcons.model,
    'model-storage': SidebarIcons.model,
    'model-metrics': SidebarIcons.model,
    'ml': SidebarIcons.model,
    'ml-train': SidebarIcons.model,
    'ml-hub': SidebarIcons.model,
    'data': SidebarIcons.data,
    'data-station': SidebarIcons.data,
    'data-storage': SidebarIcons.data,
    'service-request': SidebarIcons.support,
    'faq': SidebarIcons.support,
    'settings': SidebarIcons.settings,
    'profile': SidebarIcons.settings,
  };
  return icons[itemId] || SidebarIcons.dashboard;
};

// ─────────────────────────────────────────────────────────────
// MainSidebar Component
// ─────────────────────────────────────────────────────────────

export const MainSidebar: React.FC<MainSidebarProps> = ({
  sections,
  activeItemId,
  onNavigate,
  collapsed = false,
  onToggle,
}) => {
  const { t } = useTranslation();

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.header}>
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L22 8V16L12 22L2 16V8L12 2Z" fill="currentColor"/>
            </svg>
          </div>
          {!collapsed && <span className={styles.logoText}>XGEN</span>}
        </div>
        <button className={styles.toggleBtn} onClick={onToggle}>
          <CollapseIcon collapsed={collapsed} />
        </button>
      </div>

      <nav className={styles.nav}>
        {sections.map(section => (
          <div key={section.id} className={styles.section}>
            {!collapsed && (
              <h3 className={styles.sectionTitle}>{t(section.titleKey)}</h3>
            )}
            <ul className={styles.items}>
              {section.items.map(item => (
                <li key={item.id}>
                  <button
                    className={`${styles.navItem} ${activeItemId === item.id ? styles.active : ''}`}
                    onClick={() => onNavigate(item.id)}
                    title={collapsed ? t(item.titleKey) : undefined}
                  >
                    <span className={styles.icon}>
                      {item.icon || getSectionIcon(section.id, item.id)}
                    </span>
                    {!collapsed && (
                      <>
                        <span className={styles.title}>{t(item.titleKey)}</span>
                        {item.badge && (
                          <span className={styles.badge}>{item.badge}</span>
                        )}
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        {!collapsed && (
          <div className={styles.user}>
            <div className={styles.avatar}>U</div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>User</span>
              <span className={styles.userRole}>Member</span>
            </div>
          </div>
        )}
      </div>
    </aside>
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
    <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default MainSidebar;
