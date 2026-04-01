import './locales';
import type { CanvasPagePlugin } from '@xgen/types';

// ── Types ──────────────────────────────────────────────────────
export type {
    ExecutionOutput,
    ExecutionError,
    ExecutionSuccess,
    ExecutionStream,
    OutputRendererProps,
    ExecutionPanelProps,
    DetailPanelProps,
    BottomExecutionLogPanelProps,
    CanvasExecutionLogPanelProps,
    CanvasBottomPanelContentProps,
} from './types';

export { hasError, hasOutputs, isStreamingOutput } from './types';

// ── Components ─────────────────────────────────────────────────
export { default as ExecutionPanel, OutputRenderer } from './components/ExecutionPanel';
export { default as DetailPanel } from './components/DetailPanel';
export { default as BottomExecutionLogPanel, ExecutionOutputRenderer } from './components/BottomExecutionLogPanel';
export { default as CanvasExecutionLogPanel } from './components/CanvasExecutionLogPanel';
export { default as CanvasBottomPanelContent } from './components/CanvasBottomPanelContent';

// ── Plugin ─────────────────────────────────────────────────────
import ExecutionPanel from './components/ExecutionPanel';
import BottomExecutionLogPanel from './components/BottomExecutionLogPanel';

export const canvasExecutionPlugin: CanvasPagePlugin = {
    id: 'canvas-execution',
    name: 'Canvas Execution',
    bottomPanels: [
        {
            id: 'execution-panel',
            component: ExecutionPanel as any,
        },
        {
            id: 'bottom-execution-log',
            component: BottomExecutionLogPanel as any,
        },
    ],
};
