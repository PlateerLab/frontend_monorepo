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

/** 노드 크기 추정 상수 */
const NODE_WIDTH = 350;
const BASE_NODE_HEIGHT = 140;
const PORT_ROW_HEIGHT = 36;
const PARAM_ROW_HEIGHT = 48;

function estimateNodeHeight(data: Record<string, unknown> | undefined): number {
    const inputs = Array.isArray(data?.inputs) ? (data.inputs as unknown[]).length : 0;
    const outputs = Array.isArray(data?.outputs) ? (data.outputs as unknown[]).length : 0;
    const params = Array.isArray(data?.parameters) ? (data.parameters as unknown[]).length : 0;
    const portRows = Math.max(inputs, outputs);
    return Math.max(200, BASE_NODE_HEIGHT + portRows * PORT_ROW_HEIGHT + params * PARAM_ROW_HEIGHT);
}

interface VirtualTutorialOverlayProps {
    canvasRef: React.RefObject<CanvasRefHandle | null>;
    onTutorialStart?: () => void;
    onTutorialEnd?: () => void;
}

// ── Helper: 스텝 0..endIndex-1 까지 완료 상태의 노드/엣지를 수집 ──
// click 스텝 중 nodeData+targetPosition이 있는 것은 노드 선택 완료 스텝

function collectCanvasState(scenario: VirtualTutorialScenario, endIndex: number) {
    const nodes: { id: string; data: any; position: any }[] = [];
    const edges: { id: string; source: any; target: any }[] = [];
    const addedNodeIds = new Set<string>();
    const addedEdgeIds = new Set<string>();

    for (let i = 0; i < endIndex; i++) {
        const step = scenario.steps[i];

        // add-node (레거시) 또는 click + nodeData (팝업 기반 노드 선택 완료)
        const isNodeAddition =
            (step.cursorAction === 'add-node' ||
             (step.cursorAction === 'click' && step.nodeData && step.targetPosition));

        if (isNodeAddition && step.nodeData && step.targetPosition) {
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

// ── Helper: 원래 튜토리얼 단계 번호(1-based) → 해당하는 첫 서브스텝 인덱스 매핑 ──

function buildStepIndexMap(scenario: VirtualTutorialScenario): Map<number, number> {
    const map = new Map<number, number>();
    for (let i = 0; i < scenario.steps.length; i++) {
        const tutIdx = scenario.steps[i].tutorialStepIndex;
        if (tutIdx != null && !map.has(tutIdx)) {
            map.set(tutIdx, i);
        }
    }
    return map;
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
        skip,
        pause,
        resume,
        goTo,
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

    // ── 원래 튜토리얼 단계 ↔ 서브스텝 인덱스 매핑 ──
    const stepIndexMap = useMemo(() => {
        if (!currentScenario) return new Map<number, number>();
        return buildStepIndexMap(currentScenario);
    }, [currentScenario]);

    // dot 클릭 시 원래 단계 번호(0-based) → 서브스텝 인덱스로 변환
    const handleGoToOriginalStep = useCallback((dotIndex: number) => {
        const tutStepNum = dotIndex + 1; // 1-based
        const subStepIndex = stepIndexMap.get(tutStepNum);
        if (subStepIndex != null) {
            goTo(subStepIndex);
        }
    }, [stepIndexMap, goTo]);

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

                // open-popup과 add-node 스텝 모두에서 노드 위치 수집
                const addNodeSteps = currentScenario.steps
                    .filter((s) =>
                        (s.cursorAction === 'add-node' || s.cursorAction === 'open-popup') &&
                        s.targetPosition
                    );

                let fittedView = currentScenario.view;

                if (addNodeSteps.length > 0) {
                    const PADDING = 200;

                    const nodeRects = addNodeSteps.map((s) => {
                        const pos = s.targetPosition!;
                        const data = s.nodeData as Record<string, unknown> | undefined;
                        const h = estimateNodeHeight(data);
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
    const prevStepIndexRef = useRef<number>(-1);
    useEffect(() => {
        if (!state.isActive || !currentScenario || !canvasRef.current || !viewReady) return;
        if (!canvasRef.current.loadAgentflow) return;

        const idx = state.currentStepIndex;

        if (prevStepIndexRef.current === idx) return;
        prevStepIndexRef.current = idx;

        // 스텝 0..idx-1까지 완료된 노드/엣지 수집
        const { nodes, edges } = collectCanvasState(currentScenario, idx);

        // 스텝 전환 시 팝업 상태 관리
        const step = currentScenario.steps[idx];
        const isPopupInternalStep = step &&
            (step.targetSelector?.includes('data-accordion-group') ||
             step.targetSelector?.includes('data-node-item'));

        if (isPopupInternalStep) {
            // 팝업 내부 요소 타겟 → 이전 open-popup 스텝을 찾아 팝업 열기
            for (let i = idx - 1; i >= 0; i--) {
                const prev = currentScenario.steps[i];
                if (prev.cursorAction === 'open-popup' && prev.targetPosition) {
                    canvasRef.current.openAddNodePopup?.(prev.targetPosition);
                    // 노드 항목 클릭 스텝이면 아코디언도 미리 열기
                    if (step.targetSelector?.includes('data-node-item')) {
                        setTimeout(() => {
                            const accStep = currentScenario.steps[idx - 1];
                            if (accStep?.targetSelector?.includes('data-accordion-group')) {
                                const accEl = document.querySelector(accStep.targetSelector);
                                if (accEl instanceof HTMLElement) accEl.click();
                            }
                        }, 100);
                    }
                    break;
                }
            }
        } else {
            // 팝업과 무관한 스텝 → 팝업 닫기
            canvasRef.current.closeAddNodePopup?.();
        }

        // 현재 뷰를 유지하면서 노드/엣지만 교체
        const currentView = appliedViewRef.current ?? canvasRef.current.getView?.();
        canvasRef.current.loadAgentflow({
            nodes: nodes as any,
            edges: edges as any,
            memos: [],
            view: currentView,
        });

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

    // 팝업 내부 타겟 요소가 스크롤 밖에 있으면 자동 스크롤
    useEffect(() => {
        if (!effectiveSelector) return;
        const isPopupTarget = effectiveSelector.includes('data-accordion-group') ||
            effectiveSelector.includes('data-node-item');
        if (!isPopupTarget) return;

        const timer = setTimeout(() => {
            const el = document.querySelector(effectiveSelector);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 150);
        return () => clearTimeout(timer);
    }, [effectiveSelector]);

    const computedTargetRect = useMemo(() => {
        if (
            !currentStep?.targetPosition ||
            (currentStep.cursorAction !== 'add-node' && currentStep.cursorAction !== 'open-popup')
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

    // ── 팝업이 열려있는 스텝인지 판별 (SpotlightMask 숨김용) ──
    const isPopupStep = currentStep && (
        currentStep.cursorAction === 'open-popup' ||
        currentStep.targetSelector?.includes('data-accordion-group') ||
        currentStep.targetSelector?.includes('data-node-item')
    );

    // ── 현재 캔버스에 있는 노드/엣지의 실제 DOM 위치 수집 (스포트라이트용) ──
    const [canvasHighlightRects, setCanvasHighlightRects] = useState<DOMRect[]>([]);
    const [edgePolylines, setEdgePolylines] = useState<string[]>([]);

    const collectHighlights = useCallback(() => {
        const rects: DOMRect[] = [];
        document.querySelectorAll('[data-node-id]').forEach((el) => {
            rects.push(el.getBoundingClientRect());
        });
        setCanvasHighlightRects(rects);

        const polylines: string[] = [];
        document.querySelectorAll('[data-edge-id]').forEach((group) => {
            const pathEl = group.querySelector('path:last-of-type') as SVGPathElement | null;
            if (!pathEl) return;
            const totalLength = pathEl.getTotalLength();
            if (totalLength <= 0) return;
            const ctm = pathEl.getScreenCTM();
            if (!ctm) return;
            const steps = Math.max(20, Math.ceil(totalLength / 10));
            const points: string[] = [];
            for (let i = 0; i <= steps; i++) {
                const pt = pathEl.getPointAtLength((i / steps) * totalLength);
                const screenX = ctm.a * pt.x + ctm.c * pt.y + ctm.e;
                const screenY = ctm.b * pt.x + ctm.d * pt.y + ctm.f;
                points.push(`${screenX},${screenY}`);
            }
            polylines.push(points.join(' '));
        });
        setEdgePolylines(polylines);
    }, []);

    useEffect(() => {
        if (!state.isActive || !viewReady) {
            setCanvasHighlightRects([]);
            setEdgePolylines([]);
            return;
        }
        const timer = setTimeout(collectHighlights, 100);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.isActive, state.currentStepIndex, viewReady, viewVersion, collectHighlights]);

    useEffect(() => {
        if (!state.isActive || !viewReady) return;
        const container = document.querySelector('[class*="canvasContainer"]');
        if (!container) return;
        let rafId = 0;
        const handleViewChange = () => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(collectHighlights);
        };
        container.addEventListener('wheel', handleViewChange, { passive: true });
        container.addEventListener('mousemove', handleViewChange, { passive: true });
        return () => {
            cancelAnimationFrame(rafId);
            container.removeEventListener('wheel', handleViewChange);
            container.removeEventListener('mousemove', handleViewChange);
        };
    }, [state.isActive, viewReady, collectHighlights]);

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
                const isNodeItemClick = currentStep.targetSelector?.includes('data-node-item');

                if (isNodeItemClick && ref) {
                    // 팝업 노드 선택: 팝업 즉시 닫기 + 노드 생성
                    // React 렌더링 후 다음 스텝 진행 (팝업이 완전히 닫힌 뒤)
                    ref.closeAddNodePopup?.();
                    if (currentStep.nodeData && currentStep.targetPosition) {
                        triggerAddNode(ref, currentStep.nodeData, currentStep.targetPosition, currentStep.nodeId);
                    }
                    // 팝업 닫힘이 렌더링된 후 다음 스텝으로 진행
                    setTimeout(() => autoAdvance(), 100);
                } else {
                    const el = document.querySelector(currentStep.targetSelector);
                    if (el instanceof HTMLElement) triggerClick(el);
                    autoAdvance();
                }
                break;
            }
            case 'open-popup': {
                if (ref?.openAddNodePopup && currentStep.targetPosition) {
                    ref.openAddNodePopup(currentStep.targetPosition);
                }
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
                onGoTo={handleGoToOriginalStep}
                onPause={pause}
                onResume={resume}
                onStop={skip}
            />

            {/* 팝업 스텝에서는 SpotlightMask를 숨김 (팝업이 자체 오버레이를 가짐) */}
            {!isPopupStep && (
                <SpotlightMask targetRect={null} highlightRects={canvasHighlightRects} edgePolylines={edgePolylines} />
            )}

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
