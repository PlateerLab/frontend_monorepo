'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from '@xgen/i18n';
import { cn } from '@xgen/ui';
import { mypageSidebarConfig } from './mypageSidebarConfig';

// ─────────────────────────────────────────────────────────────
// Theme constants (Teal / Cyan)
// ─────────────────────────────────────────────────────────────
const THEME = {
  primary: '#0891B2',
  secondary: '#22D3EE',
  accent: '#67E8F9',
  dark: '#155E75',
  light: '#E0F7FA',
  gradient: 'linear-gradient(135deg, #0891B2 0%, #22D3EE 100%)',
  gradientHover: 'linear-gradient(135deg, #155E75 0%, #0891B2 100%)',
  activeBg: 'rgba(8, 145, 178, 0.1)',
  width: 280,
} as const;

// ─────────────────────────────────────────────────────────────
// Section Icons (Feather-style SVG)
// ─────────────────────────────────────────────────────────────
const SECTION_ICONS: Record<string, React.ReactNode> = {
  profile: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

const ITEM_ICONS: Record<string, React.ReactNode> = {
  profile: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  'profile-edit': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  security: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  notifications: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────
// MypageSidebar Component
// ─────────────────────────────────────────────────────────────

export interface MypageSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeItem: string;
  onItemClick: (itemId: string) => void;
  userName?: string;
  onLogout?: () => void;
  onGoBack?: () => void;
  onAdminClick?: () => void;
  className?: string;
}

export const MypageSidebar: React.FC<MypageSidebarProps> = ({
  isOpen,
  onToggle,
  activeItem,
  onItemClick,
  userName = '',
  onLogout,
  onGoBack,
  onAdminClick,
  className,
}) => {
  const { t } = useTranslation();

  // Accordion — 하나만 열림
  const [expandedSection, setExpandedSection] = useState<string | null>('profile');

  // Auto-expand based on activeItem
  useEffect(() => {
    for (const section of mypageSidebarConfig) {
      if (section.items.some((item) => item.id === activeItem)) {
        setExpandedSection(section.id);
        break;
      }
    }
  }, [activeItem]);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSection((prev) => (prev === sectionId ? null : sectionId));
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          key="mypage-sidebar"
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'tween', duration: 0.3 }}
          className={cn(
            'fixed top-0 left-0 h-screen flex flex-col flex-shrink-0 z-[100]',
            'bg-white shadow-lg',
            className,
          )}
          style={{ width: THEME.width }}
        >
          {/* ── Gradient Header ── */}
          <div
            className="relative flex flex-col p-6 text-white"
            style={{ background: THEME.gradient }}
          >
            {/* Close button */}
            <button
              onClick={onToggle}
              className="absolute top-3 right-0 translate-x-1/2 w-8 h-8 rounded-full bg-white text-gray-700 flex items-center justify-center shadow-md border-none cursor-pointer z-10 hover:bg-gray-100 transition-colors"
              title={t('common.close')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Logo row */}
            <div className="flex items-center gap-2 mb-5">
              <span className="font-pretendard text-lg font-bold tracking-wide">XGEN</span>
              {onAdminClick && (
                <button
                  onClick={onAdminClick}
                  className="ml-auto w-7 h-7 rounded-full bg-white/20 flex items-center justify-center border-none cursor-pointer text-white hover:bg-white/30 transition-colors"
                  title={t('common.adminSettings')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Welcome text */}
            <div className="flex flex-col gap-1">
              <span className="text-white/80 text-xs">{t('mypage.sidebar.welcome')}</span>
              <span className="text-base font-semibold truncate">{userName}</span>
            </div>

            {/* Logout button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="mt-3 self-start flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-white text-xs border-none cursor-pointer hover:bg-white/30 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {t('common.logout')}
              </button>
            )}
          </div>

          {/* ── Content (Sections) ── */}
          <div className="flex-1 overflow-y-auto py-4">
            {mypageSidebarConfig.map((section) => {
              const isExpanded = expandedSection === section.id;

              return (
                <div key={section.id} className="mb-2">
                  {/* Section Toggle */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={cn(
                      'w-[calc(100%-24px)] mx-3 flex items-center gap-3 px-3 py-2.5',
                      'bg-transparent border-none cursor-pointer rounded-lg',
                      'text-sm font-semibold text-gray-700',
                      'transition-colors duration-200',
                      'hover:bg-gray-50',
                      isExpanded && 'text-[#0891B2]',
                    )}
                  >
                    <span className={cn(
                      'w-5 h-5 flex items-center justify-center flex-shrink-0 transition-colors',
                      isExpanded ? 'text-[#0891B2]' : 'text-gray-500',
                    )}>
                      {SECTION_ICONS[section.id]}
                    </span>
                    <span className="flex-1 text-left">{t(section.titleKey)}</span>
                    <span className={cn(
                      'w-5 h-5 flex items-center justify-center text-gray-400 transition-transform duration-200',
                      isExpanded && 'rotate-180',
                    )}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </button>

                  {/* Section Items */}
                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-300 ease-out',
                      isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0',
                    )}
                  >
                    <div className="mt-1 mx-3">
                      {section.items.map((item) => {
                        const isActive = activeItem === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => onItemClick(item.id)}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2 mb-0.5',
                              'bg-transparent border-none cursor-pointer rounded-lg text-left',
                              'text-sm text-gray-600 transition-all duration-200',
                              'hover:bg-gray-50',
                              isActive && 'border-l-[3px] border-l-[#0891B2] bg-[rgba(8,145,178,0.1)] text-[#0891B2] font-medium',
                            )}
                          >
                            <span className={cn(
                              'w-[18px] h-[18px] flex items-center justify-center flex-shrink-0',
                              isActive ? 'text-[#0891B2]' : 'text-gray-400',
                            )}>
                              {ITEM_ICONS[item.id]}
                            </span>
                            <span className="flex-1 truncate">{t(item.titleKey)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Footer ── */}
          <div className="p-4 border-t border-gray-100">
            {onGoBack && (
              <button
                onClick={onGoBack}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-semibold border-none cursor-pointer transition-all duration-200"
                style={{ background: THEME.gradient }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = THEME.gradientHover; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = THEME.gradient; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                {t('mypage.sidebar.goToMain')}
              </button>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
