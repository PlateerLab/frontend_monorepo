'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { CursorAction } from '../virtual-cursor-types';

export type CursorPhase = 'idle' | 'moving' | 'acting' | 'done';

interface CursorAnimationState {
    x: number;
    y: number;
    phase: CursorPhase;
}

const MOVE_DURATION = 800; // ms

/**
 * 커서 애니메이션 Hook.
 * stepKey가 바뀔 때마다 현재 위치 → 목표 중앙으로 부드럽게 이동.
 * 도착 후 action에 따라 acting → done 전이, onActionComplete 호출.
 */
export function useCursorAnimation(
    targetRect: DOMRect | null,
    action: CursorAction | undefined,
    onActionComplete?: () => void,
    stepKey?: string,
): CursorAnimationState {
    const initX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
    const initY = typeof window !== 'undefined' ? window.innerHeight / 2 : 0;

    const [state, setState] = useState<CursorAnimationState>({
        x: initX,
        y: initY,
        phase: 'idle',
    });

    const animFrameRef = useRef<number>(0);
    const actingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // currentPos는 항상 최신 커서 좌표 (stale closure 방지)
    const currentPosRef = useRef({ x: initX, y: initY });
    const onActionCompleteRef = useRef(onActionComplete);
    onActionCompleteRef.current = onActionComplete;

    // targetRect를 안정적인 primitive로 변환 (DOMRect 객체 비교 문제 방지)
    const targetX = targetRect ? targetRect.left + targetRect.width / 2 : null;
    const targetY = targetRect ? targetRect.top + targetRect.height / 2 : null;

    useEffect(() => {
        // cleanup: 이전 스텝의 pending 타이머 모두 취소
        cancelAnimationFrame(animFrameRef.current);
        if (actingTimerRef.current !== null) {
            clearTimeout(actingTimerRef.current);
            actingTimerRef.current = null;
        }

        if (targetX === null || targetY === null || !action) {
            setState((s) => ({ ...s, phase: 'idle' }));
            return;
        }

        const startX = currentPosRef.current.x;
        const startY = currentPosRef.current.y;
        const startTime = performance.now();

        setState((s) => ({ ...s, phase: 'moving' }));

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / MOVE_DURATION, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            const x = startX + (targetX - startX) * eased;
            const y = startY + (targetY - startY) * eased;

            currentPosRef.current = { x, y };

            if (progress < 1) {
                setState({ x, y, phase: 'moving' });
                animFrameRef.current = requestAnimationFrame(animate);
            } else {
                setState({ x: targetX, y: targetY, phase: 'acting' });
                currentPosRef.current = { x: targetX, y: targetY };

                const actingDelay =
                    action === 'click' || action === 'add-node' ? 400 :
                    action === 'connect' ? 600 : 200;

                actingTimerRef.current = setTimeout(() => {
                    actingTimerRef.current = null;
                    setState((s) => ({ ...s, phase: 'done' }));
                    onActionCompleteRef.current?.();
                }, actingDelay);
            }
        };

        animFrameRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animFrameRef.current);
            if (actingTimerRef.current !== null) {
                clearTimeout(actingTimerRef.current);
                actingTimerRef.current = null;
            }
        };
        // stepKey가 바뀔 때만 재시작. targetX/Y는 안정적인 number.
    }, [targetX, targetY, action, stepKey]);

    return state;
}
