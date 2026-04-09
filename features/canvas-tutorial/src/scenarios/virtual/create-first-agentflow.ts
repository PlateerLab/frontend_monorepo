import type { VirtualTutorialScenario } from '../virtual-cursor-types';

/**
 * 시나리오 1: 첫 에이전트플로우 만들기
 * Input String → Agent → Output 기본 구조를 가상 커서로 시연.
 */
export const createFirstAgentflow: VirtualTutorialScenario = {
    id: 'create-first-agentflow',
    titleKey: 'canvas.tutorial.virtualTutorial.scenario1Title',
    descriptionKey: 'canvas.tutorial.virtualTutorial.scenario1Desc',
    steps: [
        {
            id: 'step-1-open-sidebar',
            targetSelector: '[data-tutorial="add-node"]',
            cursorAction: 'click',
            hintKey: 'canvas.tutorial.virtualTutorial.hint.openSidebar',
            hintPosition: 'bottom',
            autoAdvanceDelay: 600,
        },
        {
            id: 'step-2-add-input-node',
            targetSelector: '[data-node-type="input_string"]',
            cursorAction: 'add-node',
            hintKey: 'canvas.tutorial.virtualTutorial.hint.addInputNode',
            hintPosition: 'right',
            nodeData: {
                id: 'input_string',
                nodeName: 'Input String',
                nodeNameKo: '입력 문자열',
                description: 'String input node',
                functionId: 'startnode',
                inputs: [],
                outputs: [{ id: 'text', name: 'Text', type: 'STR' }],
                parameters: [],
            },
            targetPosition: { x: 200, y: 300 },
            autoAdvanceDelay: 800,
        },
        {
            id: 'step-3-add-agent-node',
            targetSelector: '[data-node-type="agent"]',
            cursorAction: 'add-node',
            hintKey: 'canvas.tutorial.virtualTutorial.hint.addAgentNode',
            hintPosition: 'right',
            nodeData: {
                id: 'agent',
                nodeName: 'Agent',
                nodeNameKo: '에이전트',
                description: 'AI Agent node',
                functionId: 'agent',
                inputs: [{ id: 'input', name: 'Input', type: 'STR', required: false }],
                outputs: [{ id: 'output', name: 'Output', type: 'STR' }],
                parameters: [],
            },
            targetPosition: { x: 600, y: 300 },
            autoAdvanceDelay: 800,
        },
        {
            id: 'step-4-connect-input-to-agent',
            targetSelector: '[data-tutorial-port="output"][data-tutorial-node-id^="tutorial-"]',
            cursorAction: 'connect',
            hintKey: 'canvas.tutorial.virtualTutorial.hint.connectInputToAgent',
            hintPosition: 'bottom',
            sourcePortSelector: '[data-tutorial-port="output"][data-tutorial-node-id^="tutorial-"]',
            targetPortSelector: '[data-tutorial-port="input"][data-tutorial-node-id^="tutorial-"]',
            autoAdvanceDelay: 800,
        },
        {
            id: 'step-5-complete',
            targetSelector: '[data-tutorial="save"]',
            cursorAction: 'move',
            hintKey: 'canvas.tutorial.virtualTutorial.hint.firstFlowComplete',
            hintPosition: 'bottom',
        },
    ],
};
