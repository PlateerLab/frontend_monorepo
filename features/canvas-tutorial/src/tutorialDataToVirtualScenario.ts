import type { TutorialData } from './types';
import type { VirtualTutorialScenario, VirtualTutorialStep } from './virtual-cursor-types';

/**
 * 기존 JSON 기반 TutorialData를 VirtualTutorialScenario로 변환.
 *
 * 각 tutorial_step에서:
 *   - 노드 1개 → 3개 서브스텝 생성:
 *     1) open-popup: 캔버스 더블클릭 → 노드추가 팝업 열기
 *     2) click: 아코디언 그룹(functionName) 클릭 → 펼치기
 *     3) click: 노드 항목 클릭 → 노드 생성 + 팝업 닫기
 *   - 엣지 N개 → connect 스텝 N개 생성
 */
export function tutorialDataToVirtualScenario(tutorial: TutorialData): VirtualTutorialScenario {
    const steps: VirtualTutorialStep[] = [];
    let stepIdx = 0;

    for (const tutStep of tutorial.tutorial_steps) {
        const tutStepIndex = tutStep.step; // 1-based
        const totalTutSteps = tutorial.tutorial_steps.length;

        // 1) 각 노드를 3개 서브스텝으로 생성
        for (const node of tutStep.nodes) {
            const functionId = (node.data as any)?.functionId || '';

            // 1-a) 캔버스 더블클릭 → 노드추가 팝업 열기
            stepIdx++;
            steps.push({
                id: `${tutorial.tutorial_id}-s${stepIdx}-open-popup-${node.id}`,
                targetSelector: '',
                cursorAction: 'open-popup',
                nodeId: node.id,
                nodeData: node.data,
                targetPosition: node.position,
                hintKey: tutStep.title + ': ' + tutStep.message,
                stepTitle: tutStep.title,
                stepMessage: tutStep.message,
                tutorialStepIndex: tutStepIndex,
                tutorialStepTotal: totalTutSteps,
                hintPosition: 'bottom',
                autoAdvanceDelay: 1000,
            });

            // 1-b) 아코디언 그룹 클릭 → 펼치기
            stepIdx++;
            steps.push({
                id: `${tutorial.tutorial_id}-s${stepIdx}-accordion-${node.id}`,
                targetSelector: `[data-accordion-group="${functionId}"]`,
                cursorAction: 'click',
                hintKey: '',
                stepTitle: tutStep.title,
                stepMessage: tutStep.message,
                tutorialStepIndex: tutStepIndex,
                tutorialStepTotal: totalTutSteps,
                hintPosition: 'bottom',
                autoAdvanceDelay: 1500,
            });

            // 1-c) 노드 항목으로 스크롤 + 클릭 → 노드 생성 + 팝업 닫기
            stepIdx++;
            steps.push({
                id: `${tutorial.tutorial_id}-s${stepIdx}-select-${node.id}`,
                targetSelector: `[data-node-item="${node.data.id}"]`,
                cursorAction: 'click',
                nodeId: node.id,
                nodeData: node.data,
                targetPosition: node.position,
                hintKey: '',
                stepTitle: tutStep.title,
                stepMessage: tutStep.message,
                tutorialStepIndex: tutStepIndex,
                tutorialStepTotal: totalTutSteps,
                hintPosition: 'bottom',
                autoAdvanceDelay: 1500,
            });
        }

        // 2) 각 엣지를 connect 스텝으로 생성
        for (const edge of tutStep.edges) {
            stepIdx++;
            steps.push({
                id: `${tutorial.tutorial_id}-s${stepIdx}-edge-${edge.id}`,
                targetSelector: `[data-tutorial-node-id="${edge.source.nodeId}"][data-tutorial-port="output"]`,
                cursorAction: 'connect',
                sourceNodeId: edge.source.nodeId,
                sourcePortId: edge.source.portId,
                targetNodeId: edge.target.nodeId,
                targetPortId: edge.target.portId,
                sourcePortSelector: `[data-tutorial-node-id="${edge.source.nodeId}"][data-tutorial-port="output"][data-port-id="${edge.source.portId}"]`,
                targetPortSelector: `[data-tutorial-node-id="${edge.target.nodeId}"][data-tutorial-port="input"][data-port-id="${edge.target.portId}"]`,
                hintKey: `연결: ${edge.source.nodeId.split('-')[0]} → ${edge.target.nodeId.split('-')[0]}`,
                stepTitle: tutStep.title,
                stepMessage: tutStep.message,
                tutorialStepIndex: tutStepIndex,
                tutorialStepTotal: totalTutSteps,
                hintPosition: 'bottom',
                autoAdvanceDelay: 1000,
            });
        }
    }

    return {
        id: `virtual-${tutorial.tutorial_id}`,
        titleKey: tutorial.tutorial_name,
        descriptionKey: tutorial.tutorial_description,
        steps,
        view: tutorial.view,
    };
}
