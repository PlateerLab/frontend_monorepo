'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * DOM 요소의 위치를 추적하는 훅.
 * - querySelector로 대상 요소를 찾고
 * - ResizeObserver, scroll 이벤트로 위치 갱신
 * - MutationObserver로 아직 DOM에 없는 요소 대기
 */
export function useElementTarget(selector: string | undefined): DOMRect | null {
    const [rect, setRect] = useState<DOMRect | null>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const mutationObserverRef = useRef<MutationObserver | null>(null);
    const rafRef = useRef<number>(0);

    const updateRect = useCallback(() => {
        if (!selector) {
            setRect(null);
            return;
        }
        const el = document.querySelector(selector);
        if (el) {
            const r = el.getBoundingClientRect();
            setRect((prev) => {
                if (
                    prev &&
                    Math.abs(prev.x - r.x) < 0.5 &&
                    Math.abs(prev.y - r.y) < 0.5 &&
                    Math.abs(prev.width - r.width) < 0.5 &&
                    Math.abs(prev.height - r.height) < 0.5
                ) {
                    return prev;
                }
                return r;
            });
        } else {
            setRect(null);
        }
    }, [selector]);

    useEffect(() => {
        if (!selector) {
            setRect(null);
            return;
        }

        const el = document.querySelector(selector);

        // ResizeObserver: 크기 변경 감지
        if (el) {
            updateRect();
            resizeObserverRef.current = new ResizeObserver(() => {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = requestAnimationFrame(updateRect);
            });
            resizeObserverRef.current.observe(el);
        }

        // MutationObserver: 요소가 아직 DOM에 없을 때 생성 대기
        if (!el) {
            mutationObserverRef.current = new MutationObserver(() => {
                const found = document.querySelector(selector);
                if (found) {
                    mutationObserverRef.current?.disconnect();
                    mutationObserverRef.current = null;
                    updateRect();

                    resizeObserverRef.current = new ResizeObserver(() => {
                        cancelAnimationFrame(rafRef.current);
                        rafRef.current = requestAnimationFrame(updateRect);
                    });
                    resizeObserverRef.current.observe(found);
                }
            });
            mutationObserverRef.current.observe(document.body, {
                childList: true,
                subtree: true,
            });
        }

        // scroll 이벤트
        const onScroll = () => {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(updateRect);
        };
        window.addEventListener('scroll', onScroll, true);

        return () => {
            resizeObserverRef.current?.disconnect();
            mutationObserverRef.current?.disconnect();
            window.removeEventListener('scroll', onScroll, true);
            cancelAnimationFrame(rafRef.current);
        };
    }, [selector, updateRect]);

    return rect;
}
