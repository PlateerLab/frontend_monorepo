'use client';

import React from 'react';

interface TutorialControlBarProps {
    onPrev: () => void;
    onNext: () => void;
    onSkip: () => void;
    isFirstStep: boolean;
    isLastStep: boolean;
}

/**
 * 하단 컨트롤 바 — 이전 / 다음 / 건너뛰기 버튼.
 */
const TutorialControlBar: React.FC<TutorialControlBarProps> = ({
    onPrev,
    onNext,
    onSkip,
    isFirstStep,
    isLastStep,
}) => {
    const containerStyle: React.CSSProperties = {
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100000,
        display: 'flex',
        gap: 8,
        padding: '8px 12px',
        background: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: 12,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
    };

    const btnBase: React.CSSProperties = {
        border: 'none',
        borderRadius: 8,
        padding: '6px 16px',
        fontSize: '0.8125rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'background 0.15s ease',
    };

    const primaryBtn: React.CSSProperties = {
        ...btnBase,
        background: '#4f46e5',
        color: '#ffffff',
    };

    const secondaryBtn: React.CSSProperties = {
        ...btnBase,
        background: '#f3f4f6',
        color: '#374151',
    };

    const ghostBtn: React.CSSProperties = {
        ...btnBase,
        background: 'transparent',
        color: '#9ca3af',
    };

    return (
        <div style={containerStyle}>
            <button
                style={ghostBtn}
                onClick={onSkip}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#6b7280'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; }}
            >
                건너뛰기
            </button>

            <button
                style={secondaryBtn}
                onClick={onPrev}
                disabled={isFirstStep}
                onMouseEnter={(e) => {
                    if (!isFirstStep) e.currentTarget.style.background = '#e5e7eb';
                }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
            >
                ← 이전
            </button>

            <button
                style={primaryBtn}
                onClick={onNext}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#4338ca'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#4f46e5'; }}
            >
                {isLastStep ? '완료 ✓' : '다음 →'}
            </button>
        </div>
    );
};

export default TutorialControlBar;
