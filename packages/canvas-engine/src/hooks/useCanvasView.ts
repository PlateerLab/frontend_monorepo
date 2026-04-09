import { useState, useCallback, useRef } from 'react';
import type { View } from '@xgen/canvas-types';

export interface UseCanvasViewProps {
    containerRef: React.RefObject<HTMLDivElement | null>;
    contentRef?: React.RefObject<HTMLDivElement | null>;
    isDraggingRef?: React.RefObject<boolean>;
    isInteractionDisabledRef?: React.RefObject<boolean>;
}

export interface UseCanvasViewReturn {
    view: View;
    setView: React.Dispatch<React.SetStateAction<View>>;
    getCenteredView: () => View;
    handleWheel: (e: WheelEvent) => void;
    zoomBy: (factor: number) => void;
}

export const MIN_SCALE = 0.23;
export const MAX_SCALE = 30;
const ZOOM_SENSITIVITY = 0.05;

export const useCanvasView = ({ containerRef, contentRef, isDraggingRef, isInteractionDisabledRef }: UseCanvasViewProps): UseCanvasViewReturn => {
    const [view, setView] = useState<View>({ x: 0, y: 0, scale: 1 });
    const viewRef = useRef(view);
    viewRef.current = view;

    const getCenteredView = useCallback((): View => {
        const container = containerRef.current;
        const content = contentRef?.current;

        if (container && content) {
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            const contentWidth = content.offsetWidth;
            const contentHeight = content.offsetHeight;

            if (containerWidth <= 0 || containerHeight <= 0) {
                return { x: 0, y: 0, scale: 1 };
            }

            return {
                x: (containerWidth - contentWidth) / 2,
                y: (containerHeight - contentHeight) / 2,
                scale: 1
            };
        }

        if (container) {
            const rect = container.getBoundingClientRect();
            return {
                x: rect.width / 2,
                y: rect.height / 2,
                scale: 1
            };
        }

        return { x: 0, y: 0, scale: 1 };
    }, [containerRef, contentRef]);

    const handleWheel = useCallback((e: WheelEvent): void => {
        // 팝업/오버레이 위에서의 스크롤은 캔버스 줌으로 가로채지 않음
        const target = e.target as HTMLElement;
        if (target.closest('[data-add-nodes-popup], [data-node-selector-overlay]')) {
            return;
        }

        // 캔버스 드래그 중에는 휠 스크롤 확대/축소를 무시
        if (isDraggingRef?.current) {
            return;
        }

        if (isInteractionDisabledRef?.current) {
            return;
        }

        e.preventDefault();
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        setView(prevView => {
            const delta = e.deltaY > 0 ? -1 : 1;
            const newScale = Math.max(
                MIN_SCALE,
                Math.min(MAX_SCALE, prevView.scale + delta * ZOOM_SENSITIVITY * prevView.scale)
            );

            if (newScale === prevView.scale) return prevView;

            const worldX = (mouseX - prevView.x) / prevView.scale;
            const worldY = (mouseY - prevView.y) / prevView.scale;
            const newX = mouseX - worldX * newScale;
            const newY = mouseY - worldY * newScale;

            return { x: newX, y: newY, scale: newScale };
        });
    }, [containerRef, isDraggingRef, isInteractionDisabledRef]);

    const zoomBy = useCallback((factor: number) => {
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        setView(prevView => {
            const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prevView.scale * factor));
            if (newScale === prevView.scale) return prevView;

            const worldX = (centerX - prevView.x) / prevView.scale;
            const worldY = (centerY - prevView.y) / prevView.scale;
            const newX = centerX - worldX * newScale;
            const newY = centerY - worldY * newScale;

            return { x: newX, y: newY, scale: newScale };
        });
    }, [containerRef]);

    return {
        view,
        setView,
        getCenteredView,
        handleWheel,
        zoomBy
    };
};
