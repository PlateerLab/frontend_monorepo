import type { VirtualTutorialScenario } from '../virtual-cursor-types';

/**
 * 시나리오 3: 에이전트플로우 실행하기
 * 저장 → 실행 버튼을 가상 커서로 안내.
 */
export const executeAgentflow: VirtualTutorialScenario = {
    id: 'execute-agentflow',
    titleKey: 'canvas.tutorial.virtualTutorial.scenario3Title',
    descriptionKey: 'canvas.tutorial.virtualTutorial.scenario3Desc',
    steps: [
        {
            id: 'step-1-save',
            targetSelector: '[data-tutorial="save"]',
            cursorAction: 'click',
            hintKey: 'canvas.tutorial.virtualTutorial.hint.clickSave',
            hintPosition: 'bottom',
            autoAdvanceDelay: 1000,
        },
        {
            id: 'step-2-wait-save',
            targetSelector: '[data-tutorial="save"]',
            cursorAction: 'wait',
            hintKey: 'canvas.tutorial.virtualTutorial.hint.waitSave',
            hintPosition: 'bottom',
            autoAdvanceDelay: 2000,
        },
        {
            id: 'step-3-complete',
            targetSelector: '[data-tutorial="save"]',
            cursorAction: 'move',
            hintKey: 'canvas.tutorial.virtualTutorial.hint.executeComplete',
            hintPosition: 'bottom',
        },
    ],
};
