import './locales';
import './styles/animations.css';
import type { CanvasPagePlugin } from '@xgen/types';

// ── Types (New) ────────────────────────────────────────────────
export type {
    PanelMode,
    LogEntry,
    LogLevel,
    LogEventType,
    ChatMessage,
    ExecutionOrderData,
    ExecutionGroup,
    ExecutionNodeStatus,
    ExecutionNodeState,
    BottomPanelState,
    BottomPanelActions,
    BottomPanelContextValue,
    BottomPanelProviderProps,
    ResizeHandleProps,
    BottomPanelHeaderProps,
    ExecutionColumnProps,
    ChatTabProps,
    ExecutorTabProps,
    ExecutionOrderColumnProps,
    ExecutionOrderItemProps,
    LogColumnProps,
    LogViewerProps,
} from './types';

// ── Types (Legacy — backward compat) ──────────────────────────
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

// ── Context & Provider (New) ───────────────────────────────────
export { BottomPanelContext, useBottomPanel } from './context/BottomPanelContext';
export { BottomPanelProvider } from './context/BottomPanelProvider';

// ── Hooks (New) ────────────────────────────────────────────────
export { useResizePanel } from './hooks/useResizePanel';
export { useChatPersistence } from './hooks/useChatPersistence';
export { useExecutionOrder } from './hooks/useExecutionOrder';
export { useBottomPanelShortcuts } from './hooks/useBottomPanelShortcuts';

// ── Components (New) ──────────────────────────────────────────
export { default as BottomPanel } from './components/BottomPanel';
export { default as BottomPanelHeader } from './components/BottomPanelHeader';
export { default as BottomPanelContent } from './components/BottomPanelContent';
export { default as ResizeHandle } from './components/ResizeHandle';
export { default as ExecutionColumn } from './components/ExecutionColumn';
export { default as ChatTab } from './components/ChatTab';
export { default as ExecutorTab } from './components/ExecutorTab';
export { default as ExecutionOrderColumn } from './components/ExecutionOrderColumn';
export { default as LogColumn } from './components/LogColumn';

// ── Components (Legacy — backward compat) ─────────────────────
export { default as ExecutionPanel, OutputRenderer } from './components/ExecutionPanel';
export { default as DetailPanel } from './components/DetailPanel';
export { default as BottomExecutionLogPanel, ExecutionOutputRenderer } from './components/BottomExecutionLogPanel';
export { default as CanvasExecutionLogPanel } from './components/CanvasExecutionLogPanel';
export { default as CanvasBottomPanelContent } from './components/CanvasBottomPanelContent';

// ── Plugin ─────────────────────────────────────────────────────
import BottomPanel from './components/BottomPanel';

export const canvasExecutionPlugin: CanvasPagePlugin = {
    id: 'canvas-execution',
    name: 'Canvas Execution',
    bottomPanels: [
        {
            id: 'bottom-panel',
            component: BottomPanel as any,
        },
    ],
};
