import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { FiX, FiPlus, FiMinus } from '@xgen/icons';
import styles from '../styles/CanvasMemo.module.scss';
import type { CanvasMemo as CanvasMemoType, MemoColor } from '@xgen/canvas-types';
import { MEMO_COLORS, MEMO_DEFAULT_FONT_SIZE, MEMO_MIN_FONT_SIZE, MEMO_MAX_FONT_SIZE } from '@xgen/canvas-types';

const COLOR_DOT_STYLES: Record<string, string> = {
    yellow: '#ffe082',
    blue: '#90caf9',
    green: '#a5d6a7',
    pink: '#f48fb1',
    purple: '#ce93d8',
};

interface MemoProps {
    memo: CanvasMemoType;
    isSelected: boolean;
    onMouseDown: (e: React.MouseEvent, memoId: string) => void;
    onContentChange: (memoId: string, content: string) => void;
    onColorChange: (memoId: string, color: MemoColor) => void;
    onSizeChange: (memoId: string, size: { width: number; height: number }) => void;
    onFontSizeChange: (memoId: string, fontSize: number) => void;
    onDelete: (memoId: string) => void;
}

const MemoComponent: React.FC<MemoProps> = ({
    memo,
    isSelected,
    onMouseDown,
    onContentChange,
    onColorChange,
    onSizeChange,
    onFontSizeChange,
    onDelete,
}) => {
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
    const memoRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const color = memo.color || 'yellow';
    const size = useMemo(() => memo.size || { width: 200, height: 150 }, [memo.size]);
    const fontSize = memo.fontSize || MEMO_DEFAULT_FONT_SIZE;

    const handleFontSizeIncrease = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (fontSize < MEMO_MAX_FONT_SIZE) {
            onFontSizeChange(memo.id, fontSize + 2);
        }
    }, [memo.id, fontSize, onFontSizeChange]);

    const handleFontSizeDecrease = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (fontSize > MEMO_MIN_FONT_SIZE) {
            onFontSizeChange(memo.id, fontSize - 2);
        }
    }, [memo.id, fontSize, onFontSizeChange]);

    const handleMemoContainerMouseDown = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();

        const target = e.target as HTMLElement;
        if (
            target.closest('textarea') ||
            target.closest('button') ||
            target.closest(`.${styles.colorDot}`) ||
            target.closest(`.${styles.colorPicker}`) ||
            target.closest(`.${styles.memoBody}`)
        ) {
            return;
        }
        onMouseDown(e, memo.id);
    }, [memo.id, onMouseDown]);

    const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onContentChange(memo.id, e.target.value);
    }, [memo.id, onContentChange]);

    const handleDelete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(memo.id);
    }, [memo.id, onDelete]);

    const handleColorDotClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setShowColorPicker(prev => !prev);
    }, []);

    const handleColorSelect = useCallback((newColor: MemoColor) => {
        onColorChange(memo.id, newColor);
        setShowColorPicker(false);
    }, [memo.id, onColorChange]);

    // Close color picker on outside click
    useEffect(() => {
        if (!showColorPicker) return;
        const handleClick = () => setShowColorPicker(false);
        const timer = setTimeout(() => {
            document.addEventListener('click', handleClick);
        }, 0);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('click', handleClick);
        };
    }, [showColorPicker]);

    // Resize handling
    const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        resizeStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            width: size.width,
            height: size.height,
        };
    }, [size]);

    useEffect(() => {
        if (!isResizing) return;

        const handleResizeMove = (e: MouseEvent) => {
            if (!resizeStartRef.current) return;
            const dx = e.clientX - resizeStartRef.current.x;
            const dy = e.clientY - resizeStartRef.current.y;
            const memoEl = memoRef.current;
            let scale = 1;
            if (memoEl) {
                const contentEl = memoEl.parentElement;
                if (contentEl) {
                    const transform = contentEl.style.transform;
                    const scaleMatch = transform.match(/scale\(([^)]+)\)/);
                    if (scaleMatch) {
                        scale = parseFloat(scaleMatch[1]);
                    }
                }
            }
            const newWidth = Math.max(140, resizeStartRef.current.width + dx / scale);
            const newHeight = Math.max(80, resizeStartRef.current.height + dy / scale);
            onSizeChange(memo.id, { width: newWidth, height: newHeight });
        };

        const handleResizeUp = () => {
            setIsResizing(false);
            resizeStartRef.current = null;
        };

        window.addEventListener('mousemove', handleResizeMove);
        window.addEventListener('mouseup', handleResizeUp);
        return () => {
            window.removeEventListener('mousemove', handleResizeMove);
            window.removeEventListener('mouseup', handleResizeUp);
        };
    }, [isResizing, memo.id, onSizeChange]);

    const handleTextareaKeyDown = useCallback((e: React.KeyboardEvent) => {
        e.stopPropagation();
    }, []);

    const handleMemoClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
    }, []);

    return (
        <div
            ref={memoRef}
            role="group"
            className={`${styles.memo} ${styles[color]} ${isSelected ? styles.selected : ''} ${isResizing ? styles.dragging : ''}`}
            style={{
                left: memo.position.x,
                top: memo.position.y,
                width: size.width,
                height: size.height,
            }}
            data-memo-id={memo.id}
            onMouseDown={handleMemoContainerMouseDown}
            onClick={handleMemoClick}
        >
            <div className={styles.memoHeader}>
                <div
                    role="button"
                    tabIndex={0}
                    className={styles.colorDot}
                    style={{ backgroundColor: COLOR_DOT_STYLES[color] }}
                    onClick={handleColorDotClick}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleColorDotClick(e as unknown as React.MouseEvent); }}
                />
                <div className={styles.headerActions}>
                    <button className={styles.actionButton} onClick={handleFontSizeDecrease} title="Decrease font size">
                        <FiMinus size={11} />
                    </button>
                    <span className={styles.fontSizeLabel}>{fontSize}</span>
                    <button className={styles.actionButton} onClick={handleFontSizeIncrease} title="Increase font size">
                        <FiPlus size={11} />
                    </button>
                    <button className={styles.actionButton} onClick={handleDelete} title="Delete memo">
                        <FiX size={13} />
                    </button>
                </div>

                {showColorPicker && (
                    <div className={styles.colorPicker} role="listbox" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                        {MEMO_COLORS.map((c) => (
                            <div
                                key={c}
                                role="option"
                                tabIndex={0}
                                aria-selected={c === color}
                                className={`${styles.colorOption} ${styles[`color${c.charAt(0).toUpperCase() + c.slice(1)}`]} ${c === color ? styles.active : ''}`}
                                onClick={() => handleColorSelect(c)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleColorSelect(c); }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.memoBody}>
                <textarea
                    ref={textareaRef}
                    className={styles.memoTextarea}
                    style={{ fontSize: `${fontSize}px` }}
                    value={memo.content}
                    onChange={handleContentChange}
                    onKeyDown={handleTextareaKeyDown}
                    placeholder="메모를 입력하세요..."
                />
            </div>

            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
            <div
                className={styles.resizeHandle}
                onMouseDown={handleResizeMouseDown}
            />
        </div>
    );
};

export const Memo = React.memo(MemoComponent);
export default Memo;
