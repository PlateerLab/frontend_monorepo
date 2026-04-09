'use client';

import React from 'react';
import type { CursorPhase } from '../hooks/useCursorAnimation';

interface VirtualCursorProps {
    x: number;
    y: number;
    phase: CursorPhase;
    visible: boolean;
}

/**
 * 가상 마우스 커서 — 크고 눈에 띄는 포인터.
 * 화면 위를 자동으로 이동하며 클릭/드래그 동작을 시연합니다.
 */
const VirtualCursor: React.FC<VirtualCursorProps> = ({ x, y, phase, visible }) => {
    if (!visible) return null;

    const isClicking = phase === 'acting';
    const scale = isClicking ? 0.9 : 1;

    return (
        <div
            style={{
                position: 'fixed',
                left: 0,
                top: 0,
                transform: `translate(${x}px, ${y}px) scale(${scale})`,
                zIndex: 99999,
                pointerEvents: 'none',
                transition: phase === 'moving' ? 'none' : 'transform 0.15s ease',
                willChange: 'transform',
            }}
        >
            {/* 커서 주변 글로우 (항상 표시) */}
            <div
                style={{
                    position: 'absolute',
                    top: -8,
                    left: -8,
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(79,70,229,0.35) 0%, transparent 70%)',
                    animation: 'cursor-glow 1.5s ease-in-out infinite',
                }}
            />

            {/* 클릭 물결 이펙트 */}
            {isClicking && (
                <div
                    style={{
                        position: 'absolute',
                        top: -16,
                        left: -16,
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: '3px solid #4f46e5',
                        animation: 'cursor-ripple 0.6s ease-out forwards',
                    }}
                />
            )}

            {/* 커서 SVG (포인터) — 40x40으로 크게 */}
            <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                    filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))',
                    transform: 'translate(-2px, -2px)',
                }}
            >
                <path
                    d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36z"
                    fill="#ffffff"
                    stroke="#4f46e5"
                    strokeWidth="1.5"
                />
            </svg>

            <style>{`
                @keyframes cursor-ripple {
                    0% { transform: scale(0.5); opacity: 0.9; }
                    100% { transform: scale(3); opacity: 0; }
                }
                @keyframes cursor-glow {
                    0%, 100% { opacity: 0.6; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
            `}</style>
        </div>
    );
};

export default VirtualCursor;
