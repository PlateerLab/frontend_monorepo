'use client';

import React, { useState, useEffect } from 'react';

interface TutorialTopBarProps {
    /** 현재 스텝 번호 (1-based) */
    currentStep: number;
    totalSteps: number;
    /** 스텝 제목 (e.g. "시작 노드 생성") */
    title: string;
    /** 스텝 설명 메시지 */
    message?: string;
    /** 일시정지 여부 */
    isPaused?: boolean;
    /** 이전 스텝 콜백 */
    onPrev?: () => void;
    /** 다음 스텝 콜백 */
    onNext?: () => void;
    /** 일시정지 콜백 */
    onPause?: () => void;
    /** 재개 콜백 */
    onResume?: () => void;
    /** 중지 콜백 */
    onStop?: () => void;
}

/**
 * 가상 커서 튜토리얼용 상단 정보 바.
 * 캔버스 헤더(56px) 바로 아래, 사이드바 오른쪽부터 캔버스 영역 상단에 표시.
 */
const TutorialTopBar: React.FC<TutorialTopBarProps> = (props: TutorialTopBarProps) => {
    const {
        currentStep,
        totalSteps,
        title,
        message,
        isPaused = false,
        onPrev,
        onNext,
        onPause,
        onResume,
        onStop,
    } = props;
    const [sidebarWidth, setSidebarWidth] = useState(0);

    useEffect(() => {
        const findSidebar = (): Element | null =>
            document.querySelector('aside');

        const detect = () => {
            const sidebar = findSidebar();
            if (sidebar) {
                setSidebarWidth(sidebar.getBoundingClientRect().width);
            }
        };

        detect();
        const observer = new ResizeObserver(detect);
        const sidebar = findSidebar();
        if (sidebar) observer.observe(sidebar);
        return () => observer.disconnect();
    }, []);

    const isFirst = currentStep <= 1;
    const isLast = currentStep >= totalSteps;

    return (
        <div style={{ ...containerStyle, left: sidebarWidth }}>
            {/* 좌측: 단계 뱃지 + < > 네비게이션 + 제목 */}
            <div style={leftStyle}>
                <span style={badgeStyle}>
                    {currentStep}/{totalSteps} 단계
                </span>

                {/* < > 네비게이션 */}
                <div style={navStyle}>
                    <button
                        type="button"
                        style={{
                            ...navBtnStyle,
                            ...(isFirst ? navBtnDisabledStyle : {}),
                        }}
                        onClick={onPrev}
                        disabled={isFirst}
                        title="이전 단계"
                    >
                        ‹
                    </button>
                    <button
                        type="button"
                        style={{
                            ...navBtnStyle,
                            ...(isLast ? navBtnDisabledStyle : {}),
                        }}
                        onClick={onNext}
                        disabled={isLast}
                        title="다음 단계"
                    >
                        ›
                    </button>
                </div>

                <span style={titleStyle}>{title}</span>
            </div>

            {/* 중앙: 메시지 (최대 3줄) */}
            {message && (
                <div style={messageStyle}>{message}</div>
            )}

            {/* 우측: 진행 점 + 일시정지 + 종료 */}
            <div style={rightStyle}>
                <div style={dotsStyle}>
                    {Array.from({ length: totalSteps }, (_, i) => (
                        <span
                            key={i}
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: i < currentStep ? '#4f46e5' : '#e5e7eb',
                                transition: 'background 0.3s ease',
                            }}
                        />
                    ))}
                </div>

                {/* 일시정지 / 재개 버튼 */}
                {(onPause || onResume) && (
                    <button
                        type="button"
                        onClick={isPaused ? onResume : onPause}
                        style={pauseBtnStyle}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = isPaused ? '#4f46e5' : '#f3f4f6';
                            e.currentTarget.style.color = isPaused ? '#fff' : '#374151';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = isPaused ? '#eef2ff' : 'transparent';
                            e.currentTarget.style.color = isPaused ? '#4f46e5' : '#6b7280';
                        }}
                        title={isPaused ? '재개' : '일시정지'}
                    >
                        {isPaused ? '▶' : '⏸'}
                    </button>
                )}

                {onStop && (
                    <button
                        onClick={onStop}
                        style={stopBtnStyle}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#ef4444';
                            e.currentTarget.style.color = '#fff';
                            e.currentTarget.style.borderColor = '#ef4444';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#6b7280';
                            e.currentTarget.style.borderColor = '#d1d5db';
                        }}
                    >
                        종료
                    </button>
                )}
            </div>
        </div>
    );
};

/* ── styles ── */

const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 56,
    left: 0,
    right: 0,
    zIndex: 100000,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '10px 20px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.92) 100%)',
    borderBottom: '1px solid #e5e7eb',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    transition: 'left 0.2s ease',
};

const leftStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
};

const badgeStyle: React.CSSProperties = {
    padding: '3px 10px',
    borderRadius: 12,
    background: '#4f46e5',
    color: '#fff',
    fontSize: '0.75rem',
    fontWeight: 600,
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
};

const navStyle: React.CSSProperties = {
    display: 'flex',
    gap: 2,
    alignItems: 'center',
};

const navBtnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    padding: 0,
    border: '1px solid #d1d5db',
    borderRadius: 6,
    background: '#fff',
    color: '#374151',
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1,
    cursor: 'pointer',
    transition: 'all 0.15s',
};

const navBtnDisabledStyle: React.CSSProperties = {
    opacity: 0.35,
    cursor: 'default',
};

const titleStyle: React.CSSProperties = {
    fontWeight: 600,
    color: '#111827',
    fontSize: '0.875rem',
    whiteSpace: 'nowrap',
};

const messageStyle: React.CSSProperties = {
    flex: 1,
    color: '#4b5563',
    fontSize: '0.8125rem',
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
    minWidth: 0,
};

const rightStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
    marginLeft: 'auto',
};

const dotsStyle: React.CSSProperties = {
    display: 'flex',
    gap: 5,
    alignItems: 'center',
};

const pauseBtnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    padding: 0,
    border: '1px solid #d1d5db',
    borderRadius: 14,
    background: 'transparent',
    color: '#6b7280',
    fontSize: '0.7rem',
    cursor: 'pointer',
    transition: 'all 0.15s',
    lineHeight: 1,
};

const stopBtnStyle: React.CSSProperties = {
    padding: '4px 14px',
    border: '1px solid #d1d5db',
    borderRadius: 14,
    background: 'transparent',
    color: '#6b7280',
    fontSize: '0.75rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
};

export default TutorialTopBar;
