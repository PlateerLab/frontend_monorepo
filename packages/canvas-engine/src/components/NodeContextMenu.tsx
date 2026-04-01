import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    FiCopy,
    FiTrash2,
    FiEdit3,
    FiMaximize2,
    FiMinimize2,
    FiCpu,
    FiEye,
    FiPlay,
    FiSave,
    FiSlash
} from '@xgen/icons';
import styles from '../styles/NodeContextMenu.module.scss';
import { useTranslation } from '@xgen/i18n';

interface NodeContextMenuProps {
    isOpen: boolean;
    position: { x: number; y: number };
    nodeId: string;
    nodeName: string;
    nodeNameKo?: string;
    functionId?: string;
    isExpanded?: boolean;
    isBypassed?: boolean;
    onClose: () => void;
    onCopy?: () => void;
    onDelete?: () => void;
    onRename?: () => void;
    onToggleExpand?: () => void;
    onToggleBypass?: () => void;
    onViewDetails?: () => void;
    onExecuteNode?: () => void;
    onSaveAsTemplate?: () => void;
}

interface MenuItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    shortcut?: string;
    disabled?: boolean;
    danger?: boolean;
    onClick?: () => void;
}

interface MenuGroup {
    id: string;
    label?: string;
    items: MenuItem[];
}

const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
    isOpen,
    position,
    nodeId,
    nodeName,
    nodeNameKo,
    functionId,
    isExpanded = true,
    isBypassed = false,
    onClose,
    onCopy,
    onDelete,
    onRename,
    onToggleExpand,
    onToggleBypass,
    onViewDetails,
    onExecuteNode,
    onSaveAsTemplate,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const { locale } = useTranslation();
    const displayName = (locale === 'ko' && nodeNameKo) ? nodeNameKo : nodeName;

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
                return;
            }

            if (e.key === 'F2') {
                e.preventDefault();
                e.stopPropagation();
                onRename?.();
                onClose();
                return;
            }

            if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
                e.preventDefault();
                e.stopPropagation();
                onCopy?.();
                onClose();
                return;
            }

            if (e.key === 'e' || e.key === 'E') {
                if (e.ctrlKey || e.metaKey || e.altKey) return;
                e.preventDefault();
                e.stopPropagation();
                onToggleExpand?.();
                onClose();
                return;
            }

            if (e.key === 'b' || e.key === 'B') {
                if (e.ctrlKey || e.metaKey || e.altKey) return;
                e.preventDefault();
                e.stopPropagation();
                onToggleBypass?.();
                onClose();
                return;
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                e.stopPropagation();
                onDelete?.();
                onClose();
                return;
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (e.buttons !== 0) {
                onClose();
            }
        };

        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('mousemove', handleMouseMove);
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousemove', handleMouseMove);
        };
    }, [isOpen, onClose, onRename, onCopy, onToggleExpand, onDelete]);

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
                { id: 'rename', label: 'Rename', icon: <FiEdit3 />, shortcut: 'F2', onClick: onRename },
                { id: 'copy', label: 'Copy', icon: <FiCopy />, shortcut: '⌘C', onClick: onCopy },
            ],
        },
        {
            id: 'view',
            label: 'VIEW',
            items: [
                { id: 'toggleExpand', label: isExpanded ? 'Collapse' : 'Expand', icon: isExpanded ? <FiMinimize2 /> : <FiMaximize2 />, shortcut: 'E', onClick: onToggleExpand },
                { id: 'viewDetails', label: 'View Details', icon: <FiEye />, onClick: onViewDetails },
            ],
        },
        {
            id: 'actions',
            label: 'ACTIONS',
            items: [
                { id: 'bypass', label: isBypassed ? 'Enable' : 'Bypass', icon: <FiSlash />, shortcut: 'B', onClick: onToggleBypass },
                { id: 'execute', label: 'Execute', icon: <FiPlay />, shortcut: '⇧↵', onClick: onExecuteNode, disabled: true },
                { id: 'saveTemplate', label: 'Save as Template', icon: <FiSave />, onClick: onSaveAsTemplate, disabled: true },
            ],
        },
        {
            id: 'danger',
            items: [
                { id: 'delete', label: 'Delete', icon: <FiTrash2 />, shortcut: 'Del', danger: true, onClick: onDelete },
            ],
        },
    ];

    const handleItemClick = (item: MenuItem) => {
        if (item.disabled) return;
        onClose();
        requestAnimationFrame(() => {
            item.onClick?.();
        });
    };

    const menuContent = (
        <>
            <div className={styles.overlay} onClick={onClose} onContextMenu={(e) => e.preventDefault()} />
            <div
                ref={menuRef}
                className={styles.contextMenu}
                style={{ left: position.x, top: position.y }}
                onContextMenu={(e) => e.preventDefault()}
            >
                <div className={styles.menuHeader}>
                    <div className={styles.nodeIcon}>
                        <FiCpu />
                    </div>
                    <div className={styles.nodeInfo}>
                        <div className={styles.nodeName}>{displayName}</div>
                        {functionId && (
                            <div className={styles.nodeType}>{functionId}</div>
                        )}
                    </div>
                </div>

                {menuGroups.map((group) => (
                    <div key={group.id} className={styles.menuGroup}>
                        {group.label && (
                            <div className={styles.groupLabel}>{group.label}</div>
                        )}
                        {group.items.map((item) => (
                            <div
                                key={item.id}
                                className={`${styles.menuItem} ${item.disabled ? styles.disabled : ''} ${item.danger ? styles.danger : ''}`}
                                onClick={() => handleItemClick(item)}
                            >
                                <span className={styles.menuIcon}>{item.icon}</span>
                                <span className={styles.menuLabel}>{item.label}</span>
                                {item.shortcut && (
                                    <span className={styles.menuShortcut}>{item.shortcut}</span>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </>
    );

    return createPortal(menuContent, document.body);
};

export default NodeContextMenu;
