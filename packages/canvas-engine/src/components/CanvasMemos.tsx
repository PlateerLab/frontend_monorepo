import React, { memo } from 'react';
import { Memo } from './Memo';
import type { CanvasMemo } from '@xgen/canvas-types';

export interface CanvasMemosProps {
    memos: CanvasMemo[];
    selectedMemoIds: string[];
    scale?: number;
    onMemoMouseDown?: (e: React.MouseEvent, memoId: string) => void;
    onMemoDoubleClick?: (e: React.MouseEvent, memoId: string) => void;
    onMemoChange?: (memoId: string, changes: Partial<CanvasMemo>) => void;
    onMemoDelete?: (memoId: string) => void;
    onMemoContextMenu?: (e: React.MouseEvent, memoId: string) => void;
}

const CanvasMemosComponent: React.FC<CanvasMemosProps> = ({
    memos,
    selectedMemoIds,
    scale = 1,
    onMemoMouseDown,
    onMemoDoubleClick,
    onMemoChange,
    onMemoDelete,
    onMemoContextMenu
}) => {
    return (
        <>
            {memos.map((memo) => (
                <Memo
                    key={memo.id}
                    memo={memo}
                    isSelected={selectedMemoIds.includes(memo.id)}
                    scale={scale}
                    onMouseDown={(e) => onMemoMouseDown?.(e, memo.id)}
                    onDoubleClick={(e) => onMemoDoubleClick?.(e, memo.id)}
                    onChange={(changes) => onMemoChange?.(memo.id, changes)}
                    onDelete={() => onMemoDelete?.(memo.id)}
                    onContextMenu={(e) => onMemoContextMenu?.(e, memo.id)}
                />
            ))}
        </>
    );
};

export const CanvasMemos = memo(CanvasMemosComponent);
