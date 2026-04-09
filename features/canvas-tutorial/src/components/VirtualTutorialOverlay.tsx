'use client';

import React, { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { useVirtualTutorial } from '../context/VirtualTutorialContext';
import { useElementTarget } from '../hooks/useElementTarget';
import { useCursorAnimation } from '../hooks/useCursorAnimation';
import {
    triggerClick,
    triggerAddNode,
    triggerConnect,
    triggerType,
    type CanvasRefHandle,
} from '../utils/event-triggers';
import SpotlightMask from './SpotlightMask';
import VirtualCursor from './VirtualCursor';
import TutorialTopBar from './TutorialTopBar';

/** 기본 자동 진행 딜레이 (명시적 autoAdvanceDelay가 없을 때) */
const DEFAULT_AUTO_ADVANCE_MS = 1200;

interface VirtualTutorialOverlayProps {
    canvasRef: React.RefObject<CanvasRefHandle | null>;
    /** 가상 튜토리얼이 시작될 때 호출 (패널 닫기 등) */
    onTutorialStart?: () => void;
    /** 가상 튜토리얼이 종료될 때 호출 (패널 복원 등) */
    onTutorialEnd?: () => void;
}

/**
 * 가상 커서 튜토리얼 오버레이 — 자동 재생 모드.
 * 커서가 스스로 움직이며 노드 추가 / 연결 / 클릭을 시연합니다.
 * 사용자는 "중지" 버튼으로만 개입합니다.
 */
const VirtualTutorialOverlay: React.FC<VirtualTutorialOverlayProps> = ({
    canvasRef,
    onTutorialStart,
    onTutorialEnd,
}) => {
    const {
        state,
        currentStep,
        currentScenario,
        next,
        skip,
    } = useVirtualTutorial();

    // 시나리오 시작/종료 감지 → 콜백 호출
    const wasActiveRef = useRef(false);
    useEffect(() => {
        if (state.isActive && !wasActiveRef.current) {
            onTutorialStart?.();
        } else if (!state.isActive && wasActiveRef.current) {
            onTutorialEnd?.();
        }
        wasActiveRef.current = state.isActive;
    }, [state.isActive, onTutorialStart, onTutorialEnd]);

    // fit-to-view 완료 전까지 커서 애니메이션을 차단하는 gate
    const [viewReady, setViewReady] = useState(false);
    // computedTargetRect가 view 변경 후 재계산되도록 하는 카운터
    const [viewVersion, setViewVersion] = useState(0);
    // loadAgentflow 직후 getView()가 stale할 수 있으므로 직접 저장
    const appliedViewRef = useRef<{ x: number; y: number; scale: number } | null>(null);

    // 시나리오 시작 시 캔버스 초기화 + fit-to-view 계산
    // 패널이 닫힌 후 컨테이너 크기가 변경되므로 약간의 딜레이 후 계산
    const prevScenarioIdRef = useRef<string | null>(null);
    useEffect(() => {
        if (
            state.isActive &&
            currentScenario &&
            currentScenario.id !== prevScenarioIdRef.current &&
            canvasRef.current
        ) {
            prevScenarioIdRef.current = currentScenario.id;
            setViewReady(false);

            // 패널 닫힘 후 레이아웃 리플로우를 기다림
            const timer = setTimeout(() => {
                const ref = canvasRef.current;
                if (!ref) return;

                // 모든 노드의 월드 좌표 바운딩 박스 계산
                const addNodeSteps = currentScenario.steps
                    .filter((s) => s.cursorAction === 'add-node' && s.targetPosition);

                let fittedView = currentScenario.view;

                if (addNodeSteps.length > 0) {
                    const NODE_WIDTH = 350;
                    const BASE_NODE_HEIGHT = 140; // 헤더 + 기본 마진
                    const PORT_ROW_HEIGHT = 36; // 포트 행 하나당 높이
                    const PARAM_ROW_HEIGHT = 48; // 파라미터 행 하나당 높이
                    const PADDING = 200; // 넉넉한 여유 공간

                    // 각 노드별로 포트/파라미터 수에 따른 높이 추정
                    const nodeRects = addNodeSteps.map((s) => {
                        const pos = s.targetPosition!;
                        const data = s.nodeData as Record<string, unknown> | undefined;
                        const inputs = Array.isArray(data?.inputs) ? (data.inputs as unknown[]).length : 0;
                        const outputs = Array.isArray(data?.outputs) ? (data.outputs as unknown[]).length : 0;
                        const params = Array.isArray(data?.parameters) ? (data.parameters as unknown[]).length : 0;
                        const portRows = Math.max(inputs, outputs);
                        const estimatedHeight = BASE_NODE_HEIGHT + portRows * PORT_ROW_HEIGHT + params * PARAM_ROW_HEIGHT;
                        // 최소 200
                        const h = Math.max(200, estimatedHeight);
                        return { x: pos.x, y: pos.y, w: NODE_WIDTH, h };
                    });

                    const minX = Math.min(...nodeRects.map((r) => r.x));
                    const minY = Math.min(...nodeRects.map((r) => r.y));
                    const maxX = Math.max(...nodeRects.map((r) => r.x + r.w));
                    const maxY = Math.max(...nodeRects.map((r) => r.y + r.h));

                    const worldWidth = maxX - minX + PADDING * 2;
                    const worldHeight = maxY - minY + PADDING * 2;

                    // 캔버스 컨테이너의 실제 크기 (패널 닫힌 후)
                    const container = document.querySelector('[class*="canvasContainer"]');
                    const containerRect = container?.getBoundingClientRect();
                    const cw = containerRect?.width ?? window.innerWidth * 0.8;
                    const ch = containerRect?.height ?? window.innerHeight * 0.8;

                    // 전체 노드가 화면에 들어오는 scale 계산 (0.85 여유 계수 적용)
                    const scaleX = cw / worldWidth;
                    const scaleY = ch / worldHeight;
                    const scale = Math.min(scaleX, scaleY, 1.0) * 0.85;

                    // 중앙 정렬 view 좌표
                    // transform: translate(vx, vy) scale(s) → 월드점 (wx,wy)는 화면 (vx+wx*s, vy+wy*s) 에 표시
                    const centerWorldX = (minX + maxX) / 2;
                    const centerWorldY = (minY + maxY) / 2;

                    fittedView = {
                        x: cw / 2 - centerWorldX * scale,
                        y: ch / 2 - centerWorldY * scale,
                        scale,
                    };

                    console.log('[VirtualTutorial] fit-to-view:', {
                        container: { cw, ch, found: !!container },
                        nodeRects,
                        world: { minX, minY, maxX, maxY, worldWidth, worldHeight },
                        computed: { scaleX, scaleY, scale },
                        view: fittedView,
                    });
                }

                // 캔버스 클리어 + 계산된 뷰 적용
                appliedViewRef.current = fittedView;
                if (ref.loadAgentflow) {
                    ref.loadAgentflow({
                        nodes: [],
                        edges: [],
                        memos: [],
                        view: fittedView,
                    });
                } else if (ref.setView && fittedView) {
                    ref.setView(fittedView);
                }

                // view 적용 후 React 리렌더 대기 → gate 해제 + 버전 올림
                requestAnimationFrame(() => {
                    setViewReady(true);
                    setViewVersion((v: number) => v + 1);
                });
            }, 500); // 패널 닫힘 애니메이션 + 리플로우 완료 대기

            return () => clearTimeout(timer);
        }
        if (!state.isActive) {
            prevScenarioIdRef.current = null;
            setViewReady(false);
        }
    }, [state.isActive, currentScenario, canvasRef]);

    // 스텝 진입 시 onEnter 콜백 실행
    const prevStepIdRef = useRef<string | null>(null);
    useEffect(() => {
        if (currentStep && currentStep.id !== prevStepIdRef.current) {
            prevStepIdRef.current = currentStep.id;
            currentStep.onEnter?.();
        }
    }, [currentStep]);

    // ── connect 스텝 2단계 애니메이션: source 포트 → target 포트 ──
    const [connectPhase, setConnectPhase] = useState<'source' | 'target'>('source');

    // 스텝이 바뀌면 connect phase를 source로 리셋
    useEffect(() => {
        setConnectPhase('source');
    }, [currentStep?.id]);

    // 실효 CSS 선택자: connect 스텝은 phase에 따라 source/target 포트 전환
    const effectiveSelector = useMemo(() => {
        if (!state.isActive || !currentStep) return undefined;
        if (currentStep.cursorAction === 'connect') {
            return connectPhase === 'source'
                ? currentStep.sourcePortSelector
                : currentStep.targetPortSelector;
        }
        return currentStep.targetSelector || undefined;
    }, [state.isActive, currentStep, connectPhase]);

    // 타겟 요소 위치 추적
    const rawTargetRect = useElementTarget(effectiveSelector);

    // add-node 모드: 월드 좌표 → 화면 좌표 변환 (라이브 캔버스 뷰 기반)
    const computedTargetRect = useMemo(() => {
        if (
            !currentStep?.targetPosition ||
            currentStep.cursorAction !== 'add-node'
        ) {
            return null;
        }

        // appliedViewRef를 우선 사용 (loadAgentflow 직후 getView()가 stale할 수 있음)
        const liveView = appliedViewRef.current ?? canvasRef.current?.getView?.();
        if (!liveView) return null;

        const wp = currentStep.targetPosition;

        // world -> screen (relative to canvas container)
        const relX = wp.x * liveView.scale + liveView.x;
        const relY = wp.y * liveView.scale + liveView.y;

        // 캔버스 컨테이너의 실제 화면 위치 보정
        const container = document.querySelector('[class*="canvasContainer"]');
        const offset = container?.getBoundingClientRect() ?? { left: 0, top: 0 };

        const screenX = relX + offset.left;
        const screenY = relY + offset.top;

        return new DOMRect(screenX - 20, screenY - 20, 40, 40);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep?.id, viewVersion]);

    // 최종 fallback: 화면 중앙 (안정적 참조)
    const fallbackRect = useMemo(() => {
        if (typeof window === 'undefined') return null;
        return new DOMRect(
            window.innerWidth / 2 - 40,
            window.innerHeight / 2 - 40,
            80,
            80,
        );
    }, []);

    // 우선순위: DOM 요소 → 월드좌표 계산 → 중앙 fallback
    const targetRect = rawTargetRect ?? computedTargetRect ?? (state.isActive && currentStep ? fallbackRect : null);

    // 자동 진행 helper: 모든 스텝은 자동으로 다음 스텝으로 넘어감
    const autoAdvance = useCallback(
        (delayOverride?: number) => {
            const delay = delayOverride ?? currentStep?.autoAdvanceDelay ?? DEFAULT_AUTO_ADVANCE_MS;
            setTimeout(next, delay);
        },
        [currentStep, next],
    );

    // 커서 이동 완료 후 → 액션 실행 → 자동 다음 스텝
    const handleActionComplete = useCallback(() => {
        if (!currentStep) return;

        const { cursorAction } = currentStep;
        const ref = canvasRef.current;

        switch (cursorAction) {
            case 'click': {
                const el = document.querySelector(currentStep.targetSelector);
                if (el instanceof HTMLElement) triggerClick(el);
                autoAdvance();
                break;
            }
            case 'add-node': {
                if (ref && currentStep.nodeData && currentStep.targetPosition) {
                    triggerAddNode(ref, currentStep.nodeData, currentStep.targetPosition, currentStep.nodeId);
                }
                autoAdvance();
                break;
            }
            case 'connect': {
                if (connectPhase === 'source') {
                    // source 포트에 도달 → target 포트로 드래그 이동 시작
                    setConnectPhase('target');
                    // 자동 진행하지 않음 — target 포트로 커서 애니메이션 계속
                } else {
                    // target 포트에 도달 → 엣지 생성
                    if (
                        ref &&
                        currentStep.sourceNodeId &&
                        currentStep.sourcePortId &&
                        currentStep.targetNodeId &&
                        currentStep.targetPortId
                    ) {
                        triggerConnect(
                            ref,
                            currentStep.sourceNodeId,
                            currentStep.sourcePortId,
                            currentStep.targetNodeId,
                            currentStep.targetPortId,
                        );
                    }
                    autoAdvance();
                }
                break;
            }
            case 'type': {
                const input = document.querySelector(currentStep.targetSelector);
                if (
                    currentStep.typeText &&
                    (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)
                ) {
                    triggerType(input, currentStep.typeText).then(() => autoAdvance());
                    return;
                }
                autoAdvance();
                break;
            }
            case 'move':
                // move = 커서만 이동, 자동 진행
                autoAdvance();
                break;
            case 'wait':
                // wait = completionCheck 폴링으로만 진행 (아래 useEffect)
                break;
            default:
                autoAdvance();
                break;
        }
    }, [currentStep, canvasRef, autoAdvance, connectPhase]);

    // stepKey: connect 스텝은 phase를 포함해 source→target 전환 시 재애니메이션
    const cursorStepKey = currentStep?.cursorAction === 'connect'
        ? `${currentStep.id}-${connectPhase}`
        : currentStep?.id;

    const cursorState = useCursorAnimation(
        targetRect,
        currentStep?.cursorAction,
        handleActionComplete,
        cursorStepKey,
    );

    // wait 모드: completionCheck 폴링 또는 타임아웃 자동 진행
    useEffect(() => {
        if (!state.isActive || !currentStep || currentStep.cursorAction !== 'wait') return;

        // completionCheck가 있으면 폴링
        if (currentStep.completionCheck) {
            const interval = setInterval(() => {
                if (currentStep.completionCheck?.()) next();
            }, 500);
            return () => clearInterval(interval);
        }

        // completionCheck 없으면 딜레이 후 자동 진행
        const delay = currentStep.autoAdvanceDelay ?? DEFAULT_AUTO_ADVANCE_MS;
        const timer = setTimeout(next, delay);
        return () => clearTimeout(timer);
    }, [state.isActive, currentStep, next]);

    if (!state.isActive || !currentStep || !currentScenario || !viewReady) return null;

    return (
        <>
            {/* 상단 정보 바: 단계 뱃지 + 제목 + 메시지 + 진행 점 + 중지 */}
            <TutorialTopBar
                currentStep={currentStep.tutorialStepIndex ?? state.currentStepIndex + 1}
                totalSteps={currentStep.tutorialStepTotal ?? currentScenario.steps.length}
                title={currentStep.stepTitle ?? currentScenario.titleKey}
                message={currentStep.stepMessage}
                onStop={skip}
            />

            {/* 스포트라이트 마스크 */}
            <SpotlightMask targetRect={targetRect} />

            {/* 가상 커서 - 항상 표시 */}
            <VirtualCursor
                x={cursorState.x}
                y={cursorState.y}
                phase={cursorState.phase}
                visible={true}
            />
        </>
    );
};

export default VirtualTutorialOverlay;
