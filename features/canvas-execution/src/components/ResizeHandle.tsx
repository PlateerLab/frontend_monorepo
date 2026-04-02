import React, { useCallback, useRef, useEffect } from 'react';
import type { ResizeHandleProps } from '../types';

const MIN_PANEL_HEIGHT = 150;
const MAX_VH_RATIO = 0.6; // 60vh

const ResizeHandle: React.FC<ResizeHandleProps> = ({ onResize, onResizeEnd, disabled = false }) => {
    const isDragging = useRef(false);
    const startY = useRef(0);
    const startHeight = useRef(0);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (disabled) return;
            e.preventDefault();
            isDragging.current = true;
            startY.current = e.clientY;

            // Get the current panel height from CSS variable
            const panel = (e.target as HTMLElement).closest('[style]');
            const currentHeight = panel
                ? parseInt(getComputedStyle(panel).getPropertyValue('--panel-height') || '300', 10)
                : 300;
            startHeight.current = currentHeight;

            document.body.style.cursor = 'ns-resize';
            document.body.style.userSelect = 'none';
        },
        [disabled]
    );

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return;
            const delta = startY.current - e.clientY;
            const maxHeight = window.innerHeight * MAX_VH_RATIO;
            const newHeight = Math.min(Math.max(startHeight.current + delta, MIN_PANEL_HEIGHT), maxHeight);
            onResize(newHeight);
        };

        const handleMouseUp = () => {
            if (!isDragging.current) return;
            isDragging.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            onResizeEnd?.();
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [onResize, onResizeEnd]);

    if (disabled) return null;

    return (
        <div
            className="absolute -top-[3px] left-0 right-0 h-1.5 cursor-ns-resize z-[1] flex items-center justify-center group hover:[&>div]:bg-primary"
            onMouseDown={handleMouseDown}
            role="separator"
            aria-orientation="horizontal"
        >
            <div className="w-9 h-[3px] rounded-sm bg-transparent transition-[background] duration-150" />
        </div>
    );
};

export default ResizeHandle;
