'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './sidebar.module.scss';

export interface PopoverItem {
  id: string;
  title: string;
  href?: string;
}

export interface SidebarPopoverProps {
  /** 앵커 요소의 DOMRect */
  anchorRect: DOMRect | null;
  /** 팝오버 메뉴 아이템 */
  items: PopoverItem[];
  /** 현재 활성 아이템 ID */
  activeItemId: string;
  /** 아이템 클릭 핸들러 */
  onItemClick: (id: string, href?: string) => void;
  /** 팝오버 닫기 핸들러 */
  onClose: () => void;
}

/**
 * SidebarPopover - 축소 상태 사이드바의 팝오버 메뉴
 *
 * @example
 * ```tsx
 * <SidebarPopover
 *   anchorRect={buttonRect}
 *   items={[
 *     { id: 'item-1', title: '메뉴 1' },
 *     { id: 'item-2', title: '메뉴 2', href: '/page' },
 *   ]}
 *   activeItemId="item-1"
 *   onItemClick={(id, href) => navigate(id, href)}
 *   onClose={() => setOpen(false)}
 * />
 * ```
 */
export const SidebarPopover: React.FC<SidebarPopoverProps> = ({
  anchorRect,
  items,
  activeItemId,
  onItemClick,
  onClose,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!anchorRect) return;

    const handleMouseDown = (e: MouseEvent) => {
      const el = popoverRef.current;
      if (el && !el.contains(e.target as Node)) {
        // 사이드바 트리거 버튼 클릭은 무시
        const target = e.target as HTMLElement;
        if (target.closest?.('[data-sidebar-trigger]')) return;
        onClose();
      }
    };

    document.addEventListener('mousedown', handleMouseDown, true);
    return () => document.removeEventListener('mousedown', handleMouseDown, true);
  }, [onClose, anchorRect]);

  // 앵커가 없거나 SSR 환경이면 렌더링하지 않음
  if (!anchorRect || typeof document === 'undefined') return null;

  const left = anchorRect.right + 8;
  const top = anchorRect.top;

  const content = (
    <div
      ref={popoverRef}
      className={styles.sidebarPopover}
      style={{ left, top }}
      role="menu"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`${styles.sidebarPopoverItem} ${activeItemId === item.id ? styles.active : ''}`}
          onClick={() => {
            onItemClick(item.id, item.href);
            onClose();
          }}
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
