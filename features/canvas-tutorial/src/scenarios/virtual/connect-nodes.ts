import type { VirtualTutorialScenario } from '../virtual-cursor-types';

/**
 * 시나리오 2: 노드 연결하기
 * 이미 배치된 두 노드 사이에 엣지를 연결하는 방법을 시연.
 */
export const connectNodes: VirtualTutorialScenario = {
    id: 'connect-nodes',
    titleKey: 'canvas.tutorial.virtualTutorial.scenario2Title',
    descriptionKey: 'canvas.tutorial.virtualTutorial.scenario2Desc',
    steps: [
        {
            id: 'step-1-identify-source',
            targetSelector: '[data-tutorial-port="output"]',
            cursorAction: 'move',
            hintKey: 'canvas.tutorial.virtualTutorial.hint.identifySourcePort',
            hintPosition: 'right',
            autoAdvanceDelay: 1500,
        },
        {
            id: 'step-2-identify-target',
            targetSelector: '[data-tutorial-port="input"]',
            cursorAction: 'move',
            hintKey: 'canvas.tutorial.virtualTutorial.hint.identifyTargetPort',
            hintPosition: 'left',
            autoAdvanceDelay: 1500,
        },
        {
            id: 'step-3-connect',
            targetSelector: '[data-tutorial-port="output"]',
            cursorAction: 'connect',
            hintKey: 'canvas.tutorial.virtualTutorial.hint.dragToConnect',
            hintPosition: 'bottom',
            sourcePortSelector: '[data-tutorial-port="output"]',
            targetPortSelector: '[data-tutorial-port="input"]',
            autoAdvanceDelay: 1000,
        },
        {
            id: 'step-4-done',
            targetSelector: '[data-tutorial="save"]',
            cursorAction: 'move',
            hintKey: 'canvas.tutorial.virtualTutorial.hint.connectionComplete',
            hintPosition: 'bottom',
        },
    ],
};
