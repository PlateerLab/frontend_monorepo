import { useState, useCallback } from 'react';
import type { CanvasMemo, MemoColor } from '@xgen/canvas-types';
import { MEMO_DEFAULT_SIZE, MEMO_DEFAULT_COLOR, MEMO_DEFAULT_FONT_SIZE } from '@xgen/canvas-types';

export interface UseMemoManagementReturn {
    memos: CanvasMemo[];
    setMemos: React.Dispatch<React.SetStateAction<CanvasMemo[]>>;
    addMemo: (position: { x: number; y: number }) => void;
    updateMemoContent: (memoId: string, content: string) => void;
    updateMemoPosition: (memoId: string, position: { x: number; y: number }) => void;
    updateMemoSize: (memoId: string, width: number, height: number) => void;
    updateMemoColor: (memoId: string, color: MemoColor) => void;
    updateMemoFontSize: (memoId: string, fontSize: number) => void;
    deleteMemo: (memoId: string) => void;
}

export const useMemoManagement = (): UseMemoManagementReturn => {
    const [memos, setMemos] = useState<CanvasMemo[]>([]);

    const addMemo = useCallback((position: { x: number; y: number }) => {
        const newMemo: CanvasMemo = {
            id: `memo-${Date.now()}`,
            content: '',
            position,
            size: MEMO_DEFAULT_SIZE,
            color: MEMO_DEFAULT_COLOR,
            fontSize: MEMO_DEFAULT_FONT_SIZE,
        };
        setMemos(prev => [...prev, newMemo]);
    }, []);

    const updateMemoContent = useCallback((memoId: string, content: string) => {
        setMemos(prev => prev.map(memo =>
            memo.id === memoId ? { ...memo, content } : memo
        ));
    }, []);

    const updateMemoPosition = useCallback((memoId: string, position: { x: number; y: number }) => {
        setMemos(prev => prev.map(memo =>
            memo.id === memoId ? { ...memo, position } : memo
        ));
    }, []);

    const updateMemoSize = useCallback((memoId: string, width: number, height: number) => {
        setMemos(prev => prev.map(memo =>
            memo.id === memoId ? { ...memo, width, height } : memo
        ));
    }, []);

    const updateMemoColor = useCallback((memoId: string, color: MemoColor) => {
        setMemos(prev => prev.map(memo =>
            memo.id === memoId ? { ...memo, color } : memo
        ));
    }, []);

    const updateMemoFontSize = useCallback((memoId: string, fontSize: number) => {
        setMemos(prev => prev.map(memo =>
            memo.id === memoId ? { ...memo, fontSize } : memo
        ));
    }, []);

    const deleteMemo = useCallback((memoId: string) => {
        setMemos(prev => prev.filter(memo => memo.id !== memoId));
    }, []);

    return {
        memos,
        setMemos,
        addMemo,
        updateMemoContent,
        updateMemoPosition,
        updateMemoSize,
        updateMemoColor,
        updateMemoFontSize,
        deleteMemo
    };
};
