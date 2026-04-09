'use client';

import React from 'react';

interface SpotlightMaskProps {
    targetRect: DOMRect | null;
    padding?: number;
    borderRadius?: number;
}

/**
 * 스포트라이트 마스크 — 대상 영역만 밝게, 나머지 어둡게.
 * SVG mask 기반으로 구멍을 뚫어 대상을 강조합니다.
 */
const SpotlightMask: React.FC<SpotlightMaskProps> = ({
    targetRect,
    padding = 8,
    borderRadius = 8,
}) => {
    if (!targetRect) return null;

    const x = targetRect.left - padding;
    const y = targetRect.top - padding;
    const w = targetRect.width + padding * 2;
    const h = targetRect.height + padding * 2;

    return (
        <svg
            style={{
                position: 'fixed',
                inset: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 99998,
                pointerEvents: 'none',
                transition: 'opacity 0.3s ease',
            }}
        >
            <defs>
                <mask id="spotlight-mask">
                    <rect x="0" y="0" width="100%" height="100%" fill="white" />
                    <rect
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        rx={borderRadius}
                        ry={borderRadius}
                        fill="black"
                        style={{ transition: 'all 0.5s ease' }}
                    />
                </mask>
            </defs>
            <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="rgba(0, 0, 0, 0.5)"
                mask="url(#spotlight-mask)"
            />
        </svg>
    );
};

export default SpotlightMask;
