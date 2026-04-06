'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

export interface PopoverItem {
  id: string;
  title: string;
  href?: string;
}

export interface SidebarPopoverProps {
  anchorRect: DOMRect | null;
  items: PopoverItem[];
  activeItemId: string;
  onItemClick: (id: string, href?: string) => void;
  onClose: () => void;
}

export const SidebarPopover: React.FC<SidebarPopoverProps> = ({
  anchorRect,
  items,
  activeItemId,
  onItemClick,
  onClose,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!anchorRect) return;

    const handleMouseDown = (e: MouseEvent) => {
      const el = popoverRef.current;
      if (el && !el.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (target.closest?.('[data-sidebar-trigger]')) return;
        onClose();
      }
    };

    document.addEventListener('mousedown', handleMouseDown, true);
    return () => document.removeEventListener('mousedown', handleMouseDown, true);
  }, [onClose, anchorRect]);

  if (!anchorRect || typeof document === 'undefined') return null;

  const left = anchorRect.right + 8;
  const top = anchorRect.top;

  const content = (
    <div
      ref={popoverRef}
      className="fixed z-40 min-w-[180px] rounded-lg border border-border bg-popover shadow-lg py-1"
      style={{ left, top }}
      role="menu"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={cn(
            'w-full px-4 py-2 text-sm text-left transition-colors hover:bg-gray-50',
            activeItemId === item.id && 'text-primary font-medium bg-primary/5',
          )}
          onClick={() => { onItemClick(item.id, item.href); onClose(); }}
          role="menuitem"
        >
          {item.title}
        </button>
      ))}
    </div>
  );

  return createPortal(content, document.body);
};

export default SidebarPopover;
