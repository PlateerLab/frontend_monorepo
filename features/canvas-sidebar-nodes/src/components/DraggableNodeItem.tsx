import React, { DragEvent, useRef, useCallback } from 'react';
import { useTranslation } from '@xgen/i18n';
import styles from '../styles/side-menu.module.scss';

interface Port {
    id: string;
    name: string;
    type: string;
    required?: boolean;
    multi?: boolean;
}

interface Parameter {
    id: string;
    name: string;
    value: string | number | boolean;
    type?: string;
    required?: boolean;
    optional?: boolean;
    options?: Array<{ value: string | number; label?: string }>;
    step?: number;
    min?: number;
    max?: number;
    is_api?: boolean;
    api_name?: string;
}

export interface NodeData {
    id: string;
    nodeName: string;
    nodeNameKo?: string;
    functionId?: string;
    inputs?: Port[];
    outputs?: Port[];
    parameters?: Parameter[];
}

interface DraggableNodeItemProps {
    nodeData: NodeData;
    onDoubleClick?: (nodeData: NodeData) => void;
    onSidebarDragStart?: (nodeData: NodeData) => void;
    onSidebarDragEnd?: () => void;
}

const DOUBLE_CLICK_DELAY = 300;

const DraggableNodeItem: React.FC<DraggableNodeItemProps> = ({
    nodeData,
    onDoubleClick,
    onSidebarDragStart,
    onSidebarDragEnd,
}) => {
    const { locale } = useTranslation();
    const clickCountRef = useRef(0);
    const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isDraggingRef = useRef(false);

    const onDragStart = (event: DragEvent<HTMLDivElement>): void => {
        isDraggingRef.current = true;
        const nodeDataString = JSON.stringify(nodeData);
        event.dataTransfer.setData('application/json', nodeDataString);
        event.dataTransfer.setData('text/plain', nodeDataString);
        event.dataTransfer.effectAllowed = 'copy';
        const emptyImg = new Image();
        emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        event.dataTransfer.setDragImage(emptyImg, 0, 0);
        onSidebarDragStart?.(nodeData);
    };

    const onDragEnd = (): void => {
        isDraggingRef.current = false;
        onSidebarDragEnd?.();
        clickCountRef.current = 0;
        if (clickTimerRef.current) {
            clearTimeout(clickTimerRef.current);
            clickTimerRef.current = null;
        }
    };

    const handleClick = useCallback(
        (e: React.MouseEvent): void => {
            e.preventDefault();
            if (isDraggingRef.current) return;
            clickCountRef.current += 1;
            if (clickCountRef.current === 1) {
                clickTimerRef.current = setTimeout(() => {
                    clickCountRef.current = 0;
                }, DOUBLE_CLICK_DELAY);
            } else if (clickCountRef.current === 2) {
                if (clickTimerRef.current) {
                    clearTimeout(clickTimerRef.current);
                    clickTimerRef.current = null;
                }
                clickCountRef.current = 0;
                if (onDoubleClick) onDoubleClick(nodeData);
            }
        },
        [nodeData, onDoubleClick],
    );

    return (
        <div
            className={styles.menuItem}
            draggable="true"
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={handleClick}
            style={{ cursor: 'grab' }}
        >
            <span>{locale === 'ko' && nodeData.nodeNameKo ? nodeData.nodeNameKo : nodeData.nodeName}</span>
        </div>
    );
};

export default DraggableNodeItem;
