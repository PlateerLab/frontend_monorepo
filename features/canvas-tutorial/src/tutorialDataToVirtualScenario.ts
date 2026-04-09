import type { TutorialData } from './types';
import type { VirtualTutorialScenario, VirtualTutorialStep } from './virtual-cursor-types';

/**
 * 기존 JSON 기반 TutorialData를 VirtualTutorialScenario로 변환.
 *
 * 각 tutorial_step에서:
 *   - 노드 1개 → add-node 스텝 생성 (커서가 캔버스 위치로 이동하며 노드 추가)
 *   - 엣지 N개 → connect 스텝 N개 생성 (addEdge API 호출)
 *
 * 결과: 커서가 자동으로 노드를 배치하고 엣지를 연결하는 데모가 됩니다.
 */
export function tutorialDataToVirtualScenario(tutorial: TutorialData): VirtualTutorialScenario {
    const steps: VirtualTutorialStep[] = [];
    let stepIdx = 0;

    for (const tutStep of tutorial.tutorial_steps) {
        const tutStepIndex = tutStep.step; // 1-based
        const totalTutSteps = tutorial.tutorial_steps.length;

        // 1) 각 노드를 add-node 스텝으로 생성
        for (const node of tutStep.nodes) {
            stepIdx++;
            steps.push({
                id: `${tutorial.tutorial_id}-s${stepIdx}-add-${node.id}`,
                targetSelector: '',
                cursorAction: 'add-node',
                nodeId: node.id,
                nodeData: node.data,
                targetPosition: node.position,
                hintKey: tutStep.title + ': ' + tutStep.message,
                stepTitle: tutStep.title,
                stepMessage: tutStep.message,
                tutorialStepIndex: tutStepIndex,
                tutorialStepTotal: totalTutSteps,
                hintPosition: 'bottom',
                autoAdvanceDelay: 1200,
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
