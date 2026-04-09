'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { VirtualTutorialProvider, useVirtualTutorial } from '../context/VirtualTutorialContext';
import { VIRTUAL_TUTORIALS } from '../scenarios/virtual';
import VirtualTutorialOverlay from './VirtualTutorialOverlay';
import ScenarioSelectModal from './ScenarioSelectModal';
import type { CanvasRefHandle } from '../utils/event-triggers';

// ── 내부 헬퍼 컴포넌트 ──

/** 시나리오 선택 모달 (Provider 내부에서 사용) */
const VirtualScenarioModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { state, scenarios, start } = useVirtualTutorial();
    return (
        <ScenarioSelectModal
            scenarios={scenarios}
            completedScenarios={state.completedScenarios}
            onSelect={(id: string) => { start(id); onClose(); }}
            onClose={onClose}
        />
    );
};

/** 재생 버튼에서 직접 시나리오를 시작하는 헬퍼 */
const StartHelper: React.FC<{
    scenarioId: string | null;
    onConsumed: () => void;
}> = ({ scenarioId, onConsumed }) => {
    const { start } = useVirtualTutorial();
    useEffect(() => {
        if (scenarioId) {
            start(scenarioId);
            onConsumed();
        }
    }, [scenarioId, start, onConsumed]);
    return null;
};

// ── Public API: 외부에서 시나리오를 트리거하기 위한 핸들 ──

export interface VirtualTutorialHandle {
    /** tutorialId로 가상 튜토리얼 시작 (TutorialPanel의 ▶ 버튼에서 호출) */
    startByTutorialId: (tutorialId: string) => void;
    /** 시나리오 선택 모달 열기 */
    openModal: () => void;
}

interface VirtualTutorialIntegrationProps {
    canvasRef: React.RefObject<CanvasRefHandle | null>;
    onTutorialStart?: () => void;
    onTutorialEnd?: () => void;
    /** 부모에서 핸들을 받아가기 위한 콜백 */
    onReady?: (handle: VirtualTutorialHandle) => void;
    children?: React.ReactNode;
}

/**
 * 가상 커서 튜토리얼의 모든 것을 포함하는 통합 컴포넌트.
 * Provider + Overlay + Modal + StartHelper를 하나로 묶음.
 *
 * CanvasPage에서 이 컴포넌트 import 한 줄만 주석처리하면
 * 가상 튜토리얼 전체가 깔끔하게 비활성화됨.
 */
const VirtualTutorialIntegration: React.FC<VirtualTutorialIntegrationProps> = ({
    canvasRef,
    onTutorialStart,
    onTutorialEnd,
    onReady,
    children,
}) => {
    return (
        <VirtualTutorialProvider scenarios={VIRTUAL_TUTORIALS}>
            <InnerIntegration
                canvasRef={canvasRef}
                onTutorialStart={onTutorialStart}
                onTutorialEnd={onTutorialEnd}
                onReady={onReady}
            />
            {children}
        </VirtualTutorialProvider>
    );
};

/** Provider 내부에서 useVirtualTutorial을 사용하기 위한 내부 컴포넌트 */
const InnerIntegration: React.FC<Omit<VirtualTutorialIntegrationProps, 'children'>> = ({
    canvasRef,
    onTutorialStart,
    onTutorialEnd,
    onReady,
}) => {
    const [showModal, setShowModal] = useState(false);
    const [pendingScenarioId, setPendingScenarioId] = useState<string | null>(null);

    const startByTutorialId = useCallback((tutorialId: string) => {
        setShowModal(false);
        const scenarioId = `virtual-${tutorialId}`;
        setPendingScenarioId(scenarioId);
    }, []);

    const openModal = useCallback(() => {
        setShowModal(true);
    }, []);

    // 핸들을 부모에게 전달
    useEffect(() => {
        onReady?.({ startByTutorialId, openModal });
    }, [onReady, startByTutorialId, openModal]);

    return (
        <>
            <VirtualTutorialOverlay
                canvasRef={canvasRef}
                onTutorialStart={onTutorialStart}
                onTutorialEnd={onTutorialEnd}
            />
            {showModal && (
                <VirtualScenarioModal onClose={() => setShowModal(false)} />
            )}
            <StartHelper
                scenarioId={pendingScenarioId}
                onConsumed={() => setPendingScenarioId(null)}
            />
        </>
    );
};

export default VirtualTutorialIntegration;
