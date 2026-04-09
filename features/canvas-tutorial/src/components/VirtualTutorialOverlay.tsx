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
import type { VirtualTutorialScenario } from '../virtual-cursor-types';
import SpotlightMask from './SpotlightMask';
import VirtualCursor from './VirtualCursor';
import TutorialTopBar from './TutorialTopBar';

/** 기본 자동 진행 딜레이 (명시적 autoAdvanceDelay가 없을 때) */
const DEFAULT_AUTO_ADVANCE_MS = 1200;

interface VirtualTutorialOverlayProps {
    canvasRef: React.RefObject<CanvasRefHandle | null>;
    onTutorialStart?: () => void;
    onTutorialEnd?: () => void;
}

// ── Helper: 스텝 0..endIndex-1 까지 완료 상태의 노드/엣지를 수집 ──

function collectCanvasState(scenario: VirtualTutorialScenario, endIndex: number) {
    const nodes: { id: string; data: any; position: any }[] = [];
    const edges: { id: string; source: any; target: any }[] = [];
    const addedNodeIds = new Set<string>();
    const addedEdgeIds = new Set<string>();

    for (let i = 0; i < endIndex; i++) {
        const step = scenario.steps[i];
        if (step.cursorAction === 'add-node' && step.nodeData && step.targetPosition) {
            const nodeId = step.nodeId || `tutorial-${i}`;
            if (!addedNodeIds.has(nodeId)) {
                addedNodeIds.add(nodeId);
                nodes.push({
                    id: nodeId,
                    data: { ...step.nodeData },
                    position: step.targetPosition,
                });
            }
        } else if (
            step.cursorAction === 'connect' &&
            step.sourceNodeId && step.sourcePortId &&
            step.targetNodeId && step.targetPortId
        ) {
            const edgeId = `edge-${step.sourceNodeId}-${step.sourcePortId}-${step.targetNodeId}-${step.targetPortId}`;
            if (!addedEdgeIds.has(edgeId)) {
                addedEdgeIds.add(edgeId);
                edges.push({
                    id: edgeId,
                    source: { nodeId: step.sourceNodeId, portId: step.sourcePortId, portType: 'output' },
                    target: { nodeId: step.targetNodeId, portId: step.targetPortId, portType: 'input' },
                });
            }
        }
    }

    return { nodes, edges };
}

// ── Main Overlay ──

const VirtualTutorialOverlay: React.FC<VirtualTutorialOverlayProps> = ({
    canvasRef,
    onTutorialStart,
    onTutorialEnd,
}: VirtualTutorialOverlayProps) => {
    const {
        state,
        currentStep,
        currentScenario,
        next,
        prev,
        skip,
        pause,
        resume,
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
    const [viewVersion, setViewVersion] = useState(0);
    const appliedViewRef = useRef<{ x: number; y: number; scale: number } | null>(null);

    // ── 시나리오 시작 시 캔버스 초기화 + fit-to-view ──
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

            const timer = setTimeout(() => {
                const ref = canvasRef.current;
                if (!ref) return;

                const addNodeSteps = currentScenario.steps
                    .filter((s) => s.cursorAction === 'add-node' && s.targetPosition);

                let fittedView = currentScenario.view;

                if (addNodeSteps.length > 0) {
                    const NODE_WIDTH = 350;
                    const BASE_NODE_HEIGHT = 140;
                    const PORT_ROW_HEIGHT = 36;
                    const PARAM_ROW_HEIGHT = 48;
                    const PADDING = 200;

                    const nodeRects = addNodeSteps.map((s) => {
                        const pos = s.targetPosition!;
                        const data = s.nodeData as Record<string, unknown> | undefined;
                        const inputs = Array.isArray(data?.inputs) ? (data.inputs as unknown[]).length : 0;
                        const outputs = Array.isArray(data?.outputs) ? (data.outputs as unknown[]).length : 0;
                        const params = Array.isArray(data?.parameters) ? (data.parameters as unknown[]).length : 0;
                        const portRows = Math.max(inputs, outputs);
                        const estimatedHeight = BASE_NODE_HEIGHT + portRows * PORT_ROW_HEIGHT + params * PARAM_ROW_HEIGHT;
                        const h = Math.max(200, estimatedHeight);
                        return { x: pos.x, y: pos.y, w: NODE_WIDTH, h };
                    });

                    const minX = Math.min(...nodeRects.map((r) => r.x));
                    const minY = Math.min(...nodeRects.map((r) => r.y));
                    const maxX = Math.max(...nodeRects.map((r) => r.x + r.w));
                    const maxY = Math.max(...nodeRects.map((r) => r.y + r.h));

                    const worldWidth = maxX - minX + PADDING * 2;
                    const worldHeight = maxY - minY + PADDING * 2;

                    const container = document.querySelector('[class*="canvasContainer"]');
                    const containerRect = container?.getBoundingClientRect();
                    const cw = containerRect?.width ?? window.innerWidth * 0.8;
                    const ch = containerRect?.height ?? window.innerHeight * 0.8;

                    const scaleX = cw / worldWidth;
                    const scaleY = ch / worldHeight;
                    const scale = Math.min(scaleX, scaleY, 1.0) * 0.85;

                    const centerWorldX = (minX + maxX) / 2;
                    const centerWorldY = (minY + maxY) / 2;

                    fittedView = {
                        x: cw / 2 - centerWorldX * scale,
                        y: ch / 2 - centerWorldY * scale,
                        scale,
                    };
                }

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

                requestAnimationFrame(() => {
                    setViewReady(true);
                    setViewVersion((v: number) => v + 1);
                });
            }, 500);

            return () => clearTimeout(timer);
        }
        if (!state.isActive) {
            prevScenarioIdRef.current = null;
            setViewReady(false);
        }
    }, [state.isActive, currentScenario, canvasRef]);

    // ── 스텝 전환 시 캔버스 상태 동기화 ──
    // currentStepIndex가 바뀔 때마다 해당 스텝 이전까지의 노드/엣지를 캔버스에 로드
    const prevStepIndexRef = useRef<number>(-1);
    useEffect(() => {
        if (!state.isActive || !currentScenario || !canvasRef.current || !viewReady) return;
        if (!canvasRef.current.loadAgentflow) return;

        const idx = state.currentStepIndex;

        // 최초 시나리오 시작 시(0번 스텝)도 동기화 — 빈 캔버스 상태 보장
        if (prevStepIndexRef.current === idx) return;
        prevStepIndexRef.current = idx;

        // 스텝 0..idx-1까지 완료된 노드/엣지 수집
        const { nodes, edges } = collectCanvasState(currentScenario, idx);

        // 현재 뷰를 유지하면서 노드/엣지만 교체
        const currentView = appliedViewRef.current ?? canvasRef.current.getView?.();
        canvasRef.current.loadAgentflow({
            nodes: nodes as any,
            edges: edges as any,
            memos: [],
            view: currentView,
        });

        // 뷰 버전 올려서 computedTargetRect 재계산
        setViewVersion((v: number) => v + 1);
    }, [state.isActive, state.currentStepIndex, currentScenario, canvasRef, viewReady]);

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

    useEffect(() => {
        setConnectPhase('source');
    }, [currentStep?.id]);

    const effectiveSelector = useMemo(() => {
        if (!state.isActive || !currentStep) return undefined;
        if (currentStep.cursorAction === 'connect') {
            return connectPhase === 'source'
                ? currentStep.sourcePortSelector
                : currentStep.targetPortSelector;
        }
        return currentStep.targetSelector || undefined;
    }, [state.isActive, currentStep, connectPhase]);

    const rawTargetRect = useElementTarget(effectiveSelector);

    const computedTargetRect = useMemo(() => {
        if (
            !currentStep?.targetPosition ||
            currentStep.cursorAction !== 'add-node'
        ) {
            return null;
        }

        const liveView = appliedViewRef.current ?? canvasRef.current?.getView?.();
        if (!liveView) return null;

        const wp = currentStep.targetPosition;
        const relX = wp.x * liveView.scale + liveView.x;
        const relY = wp.y * liveView.scale + liveView.y;

        const container = document.querySelector('[class*="canvasContainer"]');
        const offset = container?.getBoundingClientRect() ?? { left: 0, top: 0 };

        const screenX = relX + offset.left;
        const screenY = relY + offset.top;

        return new DOMRect(screenX - 20, screenY - 20, 40, 40);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep?.id, viewVersion]);

    const fallbackRect = useMemo(() => {
        if (typeof window === 'undefined') return null;
        return new DOMRect(
            window.innerWidth / 2 - 40,
            window.innerHeight / 2 - 40,
            80,
            80,
        );
    }, []);

    const targetRect = rawTargetRect ?? computedTargetRect ?? (state.isActive && currentStep ? fallbackRect : null);

    // ── 자동 진행 ──
    const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const autoAdvance = useCallback(
        (delayOverride?: number) => {
            if (state.isPaused) return;
            const delay = delayOverride ?? currentStep?.autoAdvanceDelay ?? DEFAULT_AUTO_ADVANCE_MS;
            autoAdvanceTimerRef.current = setTimeout(next, delay);
        },
        [currentStep, next, state.isPaused],
    );

    // 스텝 바뀔 때 pending autoAdvance 타이머 취소
    useEffect(() => {
        return () => {
            if (autoAdvanceTimerRef.current !== null) {
                clearTimeout(autoAdvanceTimerRef.current);
                autoAdvanceTimerRef.current = null;
            }
        };
    }, [currentStep?.id]);

    // ── 커서 이동 완료 후 → 액션 실행 → 자동 다음 스텝 ──
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
                    setConnectPhase('target');
                } else {
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
                autoAdvance();
                break;
            case 'wait':
                break;
            default:
                autoAdvance();
                break;
        }
    }, [currentStep, canvasRef, autoAdvance, connectPhase]);

    const cursorStepKey = currentStep?.cursorAction === 'connect'
        ? `${currentStep.id}-${connectPhase}`
        : currentStep?.id;

    const cursorState = useCursorAnimation(
        state.isPaused ? null : targetRect,
        currentStep?.cursorAction,
        handleActionComplete,
        cursorStepKey,
    );

    // wait 모드
    useEffect(() => {
        if (!state.isActive || state.isPaused || !currentStep || currentStep.cursorAction !== 'wait') return;

        if (currentStep.completionCheck) {
            const interval = setInterval(() => {
                if (currentStep.completionCheck?.()) next();
            }, 500);
            return () => clearInterval(interval);
        }

        const delay = currentStep.autoAdvanceDelay ?? DEFAULT_AUTO_ADVANCE_MS;
        const timer = setTimeout(next, delay);
        return () => clearTimeout(timer);
    }, [state.isActive, state.isPaused, currentStep, next]);

    if (!state.isActive || !currentStep || !currentScenario || !viewReady) return null;

    return (
        <>
            <TutorialTopBar
                currentStep={currentStep.tutorialStepIndex ?? state.currentStepIndex + 1}
                totalSteps={currentStep.tutorialStepTotal ?? currentScenario.steps.length}
                title={currentStep.stepTitle ?? currentScenario.titleKey}
                message={currentStep.stepMessage}
                isPaused={state.isPaused}
                onPrev={prev}
                onNext={next}
                onPause={pause}
                onResume={resume}
                onStop={skip}
            />

            <SpotlightMask targetRect={targetRect} />

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
