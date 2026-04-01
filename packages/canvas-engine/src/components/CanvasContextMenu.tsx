import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiClipboard, FiMaximize2, FiMinimize2, FiGrid, FiEdit3 } from '@xgen/icons';
import styles from '../styles/CanvasContextMenu.module.scss';

interface CanvasContextMenuProps {
    isOpen: boolean;
    position: { x: number; y: number };
    canPaste: boolean;
    allExpanded: boolean;
    nodeCount: number;
    onClose: () => void;
    onPaste: () => void;
    onExpandAll: () => void;
    onCollapseAll: () => void;
    onAddMemo: () => void;
}

interface MenuItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    disabled?: boolean;
    onClick: () => void;
}

interface MenuGroup {
    id: string;
    label?: string;
    items: MenuItem[];
}

const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
    isOpen,
    position,
    canPaste,
    allExpanded,
    nodeCount,
    onClose,
    onPaste,
    onExpandAll,
    onCollapseAll,
    onAddMemo,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    const getAdjustedPosition = useCallback(() => {
        if (!menuRef.current) return position;

        const menuRect = menuRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let adjustedX = position.x;
        let adjustedY = position.y;

        if (position.x + menuRect.width > viewportWidth - 10) {
            adjustedX = viewportWidth - menuRect.width - 10;
        }
        if (position.y + menuRect.height > viewportHeight - 10) {
            adjustedY = viewportHeight - menuRect.height - 10;
        }
        if (adjustedX < 10) adjustedX = 10;
        if (adjustedY < 10) adjustedY = 10;

        return { x: adjustedX, y: adjustedY };
    }, [position]);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }, 0);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen && menuRef.current) {
            const adjusted = getAdjustedPosition();
            menuRef.current.style.left = `${adjusted.x}px`;
            menuRef.current.style.top = `${adjusted.y}px`;
        }
    }, [isOpen, getAdjustedPosition]);

    if (!isOpen) return null;

    const menuGroups: MenuGroup[] = [
        {
            id: 'edit',
            label: 'EDIT',
            items: [
                {
                    id: 'paste',
                    label: 'Paste',
                    icon: <FiClipboard />,
                    disabled: !canPaste,
                    onClick: () => { onPaste(); onClose(); },
                },
            ],
        },
        {
            id: 'create',
            label: 'CREATE',
            items: [
                {
                    id: 'addMemo',
                    label: 'Add Memo',
                    icon: <FiEdit3 />,
                    onClick: () => { onAddMemo(); onClose(); },
                },
            ],
        },
        {
            id: 'view',
            label: 'VIEW',
            items: [
                {
                    id: 'expandAll',
                    label: 'Expand All',
                    icon: <FiMaximize2 />,
                    disabled: allExpanded || nodeCount === 0,
                    onClick: () => { onExpandAll(); onClose(); },
                },
                {
                    id: 'collapseAll',
                    label: 'Collapse All',
                    icon: <FiMinimize2 />,
                    disabled: !allExpanded || nodeCount === 0,
                    onClick: () => { onCollapseAll(); onClose(); },
                },
                {
                    id: 'fitView',
                    label: 'Fit View',
                    icon: <FiGrid />,
                    disabled: nodeCount === 0,
                    onClick: () => { onClose(); },
                },
            ],
        },
    ];

    const menuContent = (
        <>
            <div className={styles.overlay} onClick={onClose} onContextMenu={(e) => e.preventDefault()} />
            <div
                ref={menuRef}
                className={styles.contextMenu}
                style={{ left: position.x, top: position.y }}
                onContextMenu={(e) => e.preventDefault()}
            >
                {menuGroups.map((group) => (
                    <div key={group.id} className={styles.menuGroup}>
                        {group.label && (
                            <div className={styles.groupLabel}>{group.label}</div>
                        )}
                        {group.items.map((item) => (
                            <div
                                key={item.id}
                                className={`${styles.menuItem} ${item.disabled ? styles.disabled : ''}`}
                                onClick={item.disabled ? undefined : item.onClick}
                            >
                                <span className={styles.menuIcon}>{item.icon}</span>
                                <span className={styles.menuLabel}>{item.label}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </>
    );

    return createPortal(menuContent, document.body);
};

export default CanvasContextMenu;
