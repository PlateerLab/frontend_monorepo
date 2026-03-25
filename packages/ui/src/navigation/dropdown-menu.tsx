'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './dropdown-menu.module.scss';

export interface DropdownMenuItem {
  /** 메뉴 아이템 키 */
  key: string;
  /** 라벨 */
  label: string;
  /** 아이콘 */
  icon?: React.ReactNode;
  /** 비활성화 */
  disabled?: boolean;
  /** 위험 동작 (빨간색 표시) */
  danger?: boolean;
  /** 구분선 표시 (이 아이템 위에) */
  divider?: boolean;
}

export interface DropdownMenuProps {
  /** 트리거 요소 */
  trigger: React.ReactNode;
  /** 메뉴 아이템 목록 */
  items: DropdownMenuItem[];
  /** 메뉴 아이템 클릭 핸들러 */
  onSelect: (key: string) => void;
  /** 메뉴 위치 */
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  /** 추가 클래스 */
  className?: string;
  /** 메뉴 너비 */
  width?: number | 'auto';
}

/**
 * DropdownMenu - 드롭다운 메뉴 컴포넌트
 *
 * @example
 * ```tsx
 * <DropdownMenu
 *   trigger={<Button icon={<MoreIcon />} />}
 *   items={[
 *     { key: 'edit', label: '수정', icon: <EditIcon /> },
 *     { key: 'delete', label: '삭제', danger: true, divider: true },
 *   ]}
 *   onSelect={handleAction}
 * />
 * ```
 */
export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  onSelect,
  placement = 'bottom-end',
  className,
  width = 'auto',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !menuRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'bottom-start':
        top = triggerRect.bottom + scrollY + 4;
        left = triggerRect.left + scrollX;
        break;
      case 'bottom-end':
        top = triggerRect.bottom + scrollY + 4;
        left = triggerRect.right + scrollX - menuRect.width;
        break;
      case 'top-start':
        top = triggerRect.top + scrollY - menuRect.height - 4;
        left = triggerRect.left + scrollX;
        break;
      case 'top-end':
        top = triggerRect.top + scrollY - menuRect.height - 4;
        left = triggerRect.right + scrollX - menuRect.width;
        break;
    }

    // 화면 밖으로 나가지 않도록 조정
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 0) left = 4;
    if (left + menuRect.width > viewportWidth) {
      left = viewportWidth - menuRect.width - 4;
    }
    if (top + menuRect.height > viewportHeight + scrollY) {
      top = triggerRect.top + scrollY - menuRect.height - 4;
    }

    setPosition({ top, left });
  }, [placement]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (key: string, disabled?: boolean) => {
    if (disabled) return;
    onSelect(key);
    setIsOpen(false);
  };

  const menu = isOpen
    ? createPortal(
        <div
          ref={menuRef}
          className={`${styles.menu} ${className || ''}`}
          style={{
            top: position.top,
            left: position.left,
            width: width === 'auto' ? 'auto' : `${width}px`,
            minWidth: width === 'auto' ? '160px' : undefined,
          }}
          role="menu"
        >
          {items.map((item) => (
            <React.Fragment key={item.key}>
              {item.divider && <div className={styles.divider} />}
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => handleSelect(item.key, item.disabled)}
                className={`
                  ${styles.item}
                  ${item.danger ? styles.danger : ''}
                  ${item.disabled ? styles.disabled : ''}
                `}
              >
                {item.icon && <span className={styles.icon}>{item.icon}</span>}
                <span className={styles.label}>{item.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={styles.trigger}
      >
        {trigger}
      </div>
      {menu}
    </>
  );
};

export default DropdownMenu;
