'use client';

import React, { useEffect, useState } from 'react';
import type { HintPosition } from '../virtual-cursor-types';

interface HintBubbleProps {
    message: string;
    targetRect: DOMRect | null;
    position?: HintPosition;
}

/**
 * 안내 말풍선 — 스포트라이트 대상 근처에 표시되는 툴팁.
 */
const HintBubble: React.FC<HintBubbleProps> = ({
    message,
    targetRect,
    position = 'auto',
}) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(false);
        const timer = setTimeout(() => setVisible(true), 100);
        return () => clearTimeout(timer);
    }, [message, targetRect]);

    if (!targetRect || !message) return null;

    // auto일 경우 공간이 충분한 곳으로 배치
    let resolvedPos = position;
    if (resolvedPos === 'auto') {
        const spaceBelow = window.innerHeight - targetRect.bottom;
        const spaceAbove = targetRect.top;
        resolvedPos = spaceBelow > 120 ? 'bottom' : spaceAbove > 120 ? 'top' : 'bottom';
    }

    const style: React.CSSProperties = {
        position: 'fixed',
        zIndex: 99999,
        maxWidth: 480,
        padding: '12px 16px',
        whiteSpace: 'pre-wrap' as const,
        wordBreak: 'keep-all' as const,
        background: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: 10,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
        fontSize: '0.875rem',
        lineHeight: 1.6,
        color: '#333',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        pointerEvents: 'none' as const,
    };

    // 위치 계산
    const centerX = targetRect.left + targetRect.width / 2;
    style.left = Math.max(16, Math.min(centerX - 160, window.innerWidth - 336));

    if (resolvedPos === 'bottom') {
        style.top = targetRect.bottom + 12;
    } else if (resolvedPos === 'top') {
        style.bottom = window.innerHeight - targetRect.top + 12;
    } else if (resolvedPos === 'left') {
        style.right = window.innerWidth - targetRect.left + 12;
        style.top = targetRect.top + targetRect.height / 2 - 24;
        style.left = undefined;
    } else if (resolvedPos === 'right') {
        style.left = targetRect.right + 12;
        style.top = targetRect.top + targetRect.height / 2 - 24;
    }

    return (
        <div style={style}>
            💬 {message}
        </div>
    );
};

export default HintBubble;
