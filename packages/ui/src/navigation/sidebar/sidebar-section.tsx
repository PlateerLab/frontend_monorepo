'use client';

import React from 'react';
import { useTranslation } from '@xgen/i18n';
import { FiChevronDown } from '@xgen/icons';
import type { SidebarSection as SidebarSectionType } from '@xgen/types';
import { cn } from '../../lib/utils';

export interface SidebarSectionProps {
  section: SidebarSectionType;
  isExpanded: boolean;
  onToggle: () => void;
  activeItemId: string;
  onItemClick: (itemId: string, href?: string) => void;
  isSidebarCollapsed: boolean;
  onCollapsedSectionClick: (e: React.MouseEvent) => void;
  isPopoverOpen: boolean;
  defaultIcon?: React.ReactNode;
}

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

  const hasActiveItem = section.items.some((item) => item.id === activeItemId);
  const isActive = isExpanded || isPopoverOpen || hasActiveItem;

  const renderIcon = () => {
    if (section.icon) {
      const IconComponent = section.icon;
      return <IconComponent className="w-5 h-5 shrink-0" />;
    }
    return defaultIcon ? <span className="w-5 h-5 shrink-0 flex items-center justify-center">{defaultIcon}</span> : null;
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    if (isSidebarCollapsed) {
      onCollapsedSectionClick(e);
    } else {
      onToggle();
    }
  };

  return (
    <>
      <button
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
          'hover:bg-gray-50 text-muted-foreground',
          isActive && 'text-primary bg-primary/5',
        )}
        onClick={handleToggleClick}
        data-sidebar-trigger
      >
        {renderIcon()}
        <span className={cn('flex-1 text-left truncate', isSidebarCollapsed && 'sr-only')}>
          {section.title || t(section.titleKey)}
        </span>
        {!isSidebarCollapsed && (
          <span className={cn('w-4 h-4 transition-transform duration-200', isExpanded && 'rotate-180')}>
            <FiChevronDown />
          </span>
        )}
      </button>

      {!isSidebarCollapsed && (
        <nav
          className={cn(
            'overflow-hidden transition-all duration-200',
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          <div className="pl-8 py-1 flex flex-col gap-0.5">
            {section.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onItemClick(item.id, item.href)}
                disabled={item.disabled}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-1.5 rounded-md text-sm transition-colors',
                  'hover:bg-gray-50 text-muted-foreground',
                  activeItemId === item.id && 'text-primary font-medium bg-primary/10',
                  item.disabled && 'opacity-50 cursor-not-allowed',
                )}
              >
                <span className="truncate">{item.title || t(item.titleKey)}</span>
                {item.badge && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>
      )}
    </>
  );
};

export default SidebarSection;
