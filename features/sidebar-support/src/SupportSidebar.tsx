'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from '@xgen/i18n';
import { cn } from '@xgen/ui';
import { supportSidebarConfig } from './supportSidebarConfig';

// ─────────────────────────────────────────────────────────────
// Theme constants (Deep Purple)
// ─────────────────────────────────────────────────────────────
const THEME = {
  primary: '#6B4C9A',
  secondary: '#8B6BB7',
  accent: '#9D7FBF',
  dark: '#4A2C6D',
  light: '#E8DFF5',
  gradient: 'linear-gradient(135deg, #6B4C9A 0%, #8B6BB7 100%)',
  gradientHover: 'linear-gradient(135deg, #4A2C6D 0%, #6B4C9A 100%)',
  activeBg: 'rgba(107, 76, 154, 0.1)',
  width: 280,
} as const;

// ─────────────────────────────────────────────────────────────
// Section Icons (Feather-style SVG)
// ─────────────────────────────────────────────────────────────
const SECTION_ICONS: Record<string, React.ReactNode> = {
  'customer-support': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  'service-request': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
};

const ITEM_ICONS: Record<string, React.ReactNode> = {
  faq: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  inquiry: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  'my-inquiries': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  'service-request-form': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  'service-request-results': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────
// SupportSidebar Component
// ─────────────────────────────────────────────────────────────

export interface SupportSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeItem: string;
  onItemClick: (itemId: string) => void;
  userName?: string;
  onLogout?: () => void;
  onGoBack?: () => void;
  onAdminClick?: () => void;
  onMypageClick?: () => void;
  className?: string;
}

export const SupportSidebar: React.FC<SupportSidebarProps> = ({
  isOpen,
  onToggle,
  activeItem,
  onItemClick,
  userName = '',
  onLogout,
  onGoBack,
  onAdminClick,
  onMypageClick,
  className,
}) => {
  const { t } = useTranslation();

  // Accordion — 하나만 열림
  const [expandedSection, setExpandedSection] = useState<string | null>('customer-support');

  // Auto-expand based on activeItem
  useEffect(() => {
    for (const section of supportSidebarConfig) {
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
          key="support-sidebar"
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
              <div className="ml-auto flex items-center gap-1.5">
                {onAdminClick && (
                  <button
                    onClick={onAdminClick}
                    className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center border-none cursor-pointer text-white hover:bg-white/30 transition-colors"
                    title={t('common.adminSettings')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Welcome text */}
            <div className="flex flex-col gap-1">
              <span className="text-white/80 text-xs">{t('support.sidebar.welcome')}</span>
              <button
                onClick={onMypageClick}
                className="bg-transparent border-none cursor-pointer p-0 text-left text-white"
              >
                <span className="text-base font-semibold truncate hover:underline">{userName}</span>
              </button>
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
            {supportSidebarConfig.map((section) => {
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
                      isExpanded && 'text-[#6B4C9A]',
                    )}
                  >
                    <span className={cn(
                      'w-5 h-5 flex items-center justify-center flex-shrink-0 transition-colors',
                      isExpanded ? 'text-[#6B4C9A]' : 'text-gray-500',
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
                              isActive && 'border-l-[3px] border-l-[#6B4C9A] bg-[rgba(107,76,154,0.1)] text-[#6B4C9A] font-medium',
                            )}
                          >
                            <span className={cn(
                              'w-[18px] h-[18px] flex items-center justify-center flex-shrink-0',
                              isActive ? 'text-[#6B4C9A]' : 'text-gray-400',
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
                {t('support.sidebar.goToMain')}
              </button>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
