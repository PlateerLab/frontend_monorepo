'use client';

import React from 'react';
import { useTranslation } from '@xgen/i18n';
import type { VirtualTutorialScenario } from '../virtual-cursor-types';

interface ScenarioSelectModalProps {
    scenarios: VirtualTutorialScenario[];
    completedScenarios: string[];
    onSelect: (scenarioId: string) => void;
    onClose: () => void;
}

/**
 * 시나리오 선택 모달 — 가상 커서 튜토리얼 시나리오 목록.
 */
const ScenarioSelectModal: React.FC<ScenarioSelectModalProps> = ({
    scenarios,
    completedScenarios,
    onSelect,
    onClose,
}) => {
    const { t } = useTranslation();

    const backdropStyle: React.CSSProperties = {
        position: 'fixed',
        inset: 0,
        zIndex: 100001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.4)',
    };

    const modalStyle: React.CSSProperties = {
        background: '#ffffff',
        borderRadius: 16,
        padding: 24,
        width: 420,
        maxWidth: '90vw',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.16)',
    };

    const headingStyle: React.CSSProperties = {
        margin: 0,
        marginBottom: 8,
        fontSize: '1.125rem',
        fontWeight: 600,
        color: '#111827',
    };

    const descStyle: React.CSSProperties = {
        margin: 0,
        marginBottom: 20,
        fontSize: '0.875rem',
        color: '#6b7280',
    };

    const listStyle: React.CSSProperties = {
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    };

    const itemBaseStyle: React.CSSProperties = {
        padding: '12px 16px',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        cursor: 'pointer',
        transition: 'border-color 0.15s ease, background 0.15s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    };

    const closeBtnStyle: React.CSSProperties = {
        marginTop: 16,
        width: '100%',
        padding: '8px 0',
        border: 'none',
        borderRadius: 8,
        background: '#f3f4f6',
        color: '#374151',
        fontSize: '0.8125rem',
        fontWeight: 500,
        cursor: 'pointer',
    };

    return (
        <div style={backdropStyle} onClick={onClose}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
                <h3 style={headingStyle}>
                    {t('canvas.tutorial.virtualTutorial.selectTitle', { defaultValue: '가상 커서 튜토리얼' })}
                </h3>
                <p style={descStyle}>
                    {t('canvas.tutorial.virtualTutorial.selectDescription', { defaultValue: '학습할 시나리오를 선택하세요.' })}
                </p>

                <ul style={listStyle}>
                    {scenarios.map((scenario) => {
                        const isCompleted = completedScenarios.includes(scenario.id);
                        return (
                            <li
                                key={scenario.id}
                                style={{
                                    ...itemBaseStyle,
                                    borderColor: isCompleted ? '#a7f3d0' : '#e5e7eb',
                                    background: isCompleted ? '#ecfdf5' : '#ffffff',
                                }}
                                onClick={() => onSelect(scenario.id)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#4f46e5';
                                    e.currentTarget.style.background = '#f5f3ff';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = isCompleted ? '#a7f3d0' : '#e5e7eb';
                                    e.currentTarget.style.background = isCompleted ? '#ecfdf5' : '#ffffff';
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 500, fontSize: '0.875rem', color: '#111827' }}>
                                        {scenario.titleKey}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>
                                        {scenario.descriptionKey}
                                        {' · '}
                                        {scenario.steps.length}{t('canvas.tutorial.steps', { defaultValue: '단계' })}
                                    </div>
                                </div>
                                {isCompleted && (
                                    <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>
                                        ✓ {t('canvas.tutorial.complete', { defaultValue: '완료' })}
                                    </span>
                                )}
                            </li>
                        );
                    })}
                </ul>

                <button
                    style={closeBtnStyle}
                    onClick={onClose}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#e5e7eb'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
                >
                    {t('canvas.tutorial.exit', { defaultValue: '닫기' })}
                </button>
            </div>
        </div>
    );
};

export default ScenarioSelectModal;
