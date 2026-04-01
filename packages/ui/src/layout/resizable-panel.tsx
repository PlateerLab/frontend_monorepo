'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import styles from './resizable-panel.module.scss';

export type ResizableDirection = 'horizontal' | 'vertical';

export interface ResizablePanelProps {
  /** 왼쪽/상단 패널 */
  leftPanel: React.ReactNode;
  /** 오른쪽/하단 패널 */
  rightPanel: React.ReactNode;
  /** 분할 방향 */
  direction?: ResizableDirection;
  /** 기본 분할 비율 (0-100) */
  defaultSplit?: number;
  /** 최소 크기 (0-100) */
  minSize?: number;
  /** 최대 크기 (0-100) */
  maxSize?: number;
  /** 크기 변경 콜백 */
  onResize?: (size: number) => void;
  /** 추가 클래스 */
  className?: string;
}

/**
 * ResizablePanel - 드래그로 크기 조절 가능한 분할 패널
 *
 * @example
 * ```tsx
 * <ResizablePanel
 *   direction="horizontal"
 *   defaultSplit={60}
 *   minSize={30}
 *   leftPanel={<ChatArea />}
 *   rightPanel={<PDFViewer />}
 * />
 * ```
 */
export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  leftPanel,
  rightPanel,
  direction = 'horizontal',
  defaultSplit = 50,
  minSize = 20,
  maxSize = 80,
  onResize,
  className,
}) => {
  const [split, setSplit] = useState(defaultSplit);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      let newSplit: number;

      if (direction === 'horizontal') {
        newSplit = ((e.clientX - rect.left) / rect.width) * 100;
      } else {
        newSplit = ((e.clientY - rect.top) / rect.height) * 100;
      }

      newSplit = Math.max(minSize, Math.min(maxSize, newSplit));
      setSplit(newSplit);
      onResize?.(newSplit);
    },
    [direction, minSize, maxSize, onResize]
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    const handleMouseMoveGlobal = (e: MouseEvent) => handleMouseMove(e);
    const handleMouseUpGlobal = () => handleMouseUp();

    document.addEventListener('mousemove', handleMouseMoveGlobal);
    document.addEventListener('mouseup', handleMouseUpGlobal);

    return () => {
      document.removeEventListener('mousemove', handleMouseMoveGlobal);
      document.removeEventListener('mouseup', handleMouseUpGlobal);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${styles[direction]} ${className || ''}`}
    >
      <div
        className={styles.leftPanel}
        style={{
          [direction === 'horizontal' ? 'width' : 'height']: `${split}%`,
        }}
      >
        {leftPanel}
      </div>
      <div
        className={styles.divider}
        onMouseDown={handleMouseDown}
        role="separator"
        aria-orientation={direction}
        tabIndex={0}
      >
        <div className={styles.dividerHandle} />
      </div>
      <div
        className={styles.rightPanel}
        style={{
          [direction === 'horizontal' ? 'width' : 'height']: `${100 - split}%`,
        }}
      >
        {rightPanel}
      </div>
    </div>
  );
};

export default ResizablePanel;
