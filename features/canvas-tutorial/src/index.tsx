'use client';

import './locales';

export { default as TutorialOverlay } from './components/TutorialOverlay';
export { default as TutorialPanel } from './components/TutorialPanel';
export { TUTORIALS } from './scenarios';
export { workflowToTutorial } from './workflowToTutorial';
export type { TutorialData, TutorialStep } from './types';

// ── Virtual Cursor Tutorial ──
export { default as VirtualTutorialOverlay } from './components/VirtualTutorialOverlay';
export { default as ScenarioSelectModal } from './components/ScenarioSelectModal';
export { VirtualTutorialProvider, useVirtualTutorial } from './context/VirtualTutorialContext';
export { VIRTUAL_TUTORIALS } from './scenarios/virtual';
export { tutorialDataToVirtualScenario } from './tutorialDataToVirtualScenario';
export type {
    VirtualTutorialStep,
    VirtualTutorialScenario,
    VirtualTutorialState,
    CursorAction,
    HintPosition,
} from './virtual-cursor-types';
