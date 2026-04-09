'use client';

import React from 'react';

interface StepProgressIndicatorProps {
    title: string;
    currentStep: number;
    totalSteps: number;
}

/**
 * 상단 진행률 표시 — 시나리오 이름 + 점 진행 ●●●○○○
 */
const StepProgressIndicator: React.FC<StepProgressIndicatorProps> = ({
    title,
    currentStep,
    totalSteps,
}) => {
    const containerStyle: React.CSSProperties = {
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 16px',
        background: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: 20,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        fontSize: '0.8125rem',
        color: '#374151',
        fontWeight: 500,
    };

    const dotsStyle: React.CSSProperties = {
        display: 'flex',
        gap: 4,
        alignItems: 'center',
    };

    return (
        <div style={containerStyle}>
            <span>{title}</span>
            <div style={dotsStyle}>
                {Array.from({ length: totalSteps }, (_, i) => (
                    <span
                        key={i}
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: i <= currentStep ? '#4f46e5' : '#d1d5db',
                            transition: 'background 0.2s ease',
                        }}
                    />
                ))}
            </div>
            <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                {currentStep + 1}/{totalSteps}
            </span>
        </div>
    );
};

export default StepProgressIndicator;
