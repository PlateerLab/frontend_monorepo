'use client';

import React from 'react';

interface SpotlightMaskProps {
    targetRect: DOMRect | null;
    /** 추가로 밝게 표시할 사각 영역 (노드 등) */
    highlightRects?: DOMRect[];
    /** 밝게 표시할 엣지 polyline (화면 좌표 "x,y x,y ..." 문자열) */
    edgePolylines?: string[];
    padding?: number;
    borderRadius?: number;
}

/**
 * 스포트라이트 마스크 — 대상 영역만 밝게, 나머지 어둡게.
 * SVG mask 기반으로 구멍을 뚫어 대상을 강조합니다.
 */
const SpotlightMask: React.FC<SpotlightMaskProps> = ({
    targetRect,
    highlightRects = [] as DOMRect[],
    edgePolylines = [] as string[],
    padding = 8,
    borderRadius = 8,
}: SpotlightMaskProps) => {
    if (!targetRect && highlightRects.length === 0 && edgePolylines.length === 0) return null;

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

                    {/* 커서 타겟 영역 */}
                    {targetRect && (
                        <rect
                            x={targetRect.left - padding}
                            y={targetRect.top - padding}
                            width={targetRect.width + padding * 2}
                            height={targetRect.height + padding * 2}
                            rx={borderRadius}
                            ry={borderRadius}
                            fill="black"
                            style={{ transition: 'all 0.5s ease' }}
                        />
                    )}

                    {/* 노드 등 사각 하이라이트 영역 */}
                    {highlightRects.map((rect, i) => (
                        <rect
                            key={`r-${i}`}
                            x={rect.left - padding}
                            y={rect.top - padding}
                            width={rect.width + padding * 2}
                            height={rect.height + padding * 2}
                            rx={borderRadius}
                            ry={borderRadius}
                            fill="black"
                            style={{ transition: 'all 0.5s ease' }}
                        />
                    ))}

                    {/* 엣지 선 하이라이트 */}
                    {edgePolylines.map((points, i) => (
                        <polyline
                            key={`e-${i}`}
                            points={points}
                            fill="none"
                            stroke="black"
                            strokeWidth={6}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    ))}
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
