// ── Execution Output Types ─────────────────────────────────────

export interface ExecutionError {
    error: string;
}

export interface ExecutionSuccess {
    outputs: Record<string, any>;
}

export interface ExecutionStream {
    stream: string;
}

export type ExecutionOutput = ExecutionError | ExecutionSuccess | ExecutionStream | null;

// ── Type Guards ────────────────────────────────────────────────

export const hasError = (output: ExecutionOutput): output is ExecutionError =>
    output !== null && 'error' in output;

export const hasOutputs = (output: ExecutionOutput): output is ExecutionSuccess =>
    output !== null && 'outputs' in output;

export const isStreamingOutput = (output: ExecutionOutput): output is ExecutionStream =>
    output !== null && 'stream' in output;

// ── Component Props ────────────────────────────────────────────

export interface OutputRendererProps {
    output: ExecutionOutput;
}

export interface ExecutionPanelProps {
    onExecute: () => void;
    onClear: () => void;
    output: ExecutionOutput;
    isLoading: boolean;
}

export interface DetailPanelProps {
    embedded?: boolean;
    embeddedLayout?: 'tabs' | 'split';
    workflowName: string;
    workflowId: string;
    userId?: string | null;
    canvasState?: any;
    logs?: any[];
    onClearLogs?: () => void;
    activeNodes?: Set<string>;
    onApplyLayout?: () => void;
    /** Injected API: fetch execution order by workflow data */
    fetchExecutionOrderByData?: (workflowData: any) => Promise<any>;
    /** Injected API: fetch execution order by name/id */
    fetchExecutionOrder?: (workflowName: string, workflowId: string, userId?: string) => Promise<any>;
    /** Log viewer component — injected to avoid hard dependency */
    LogViewerComponent?: React.ComponentType<{ logs: any[]; onClearLogs?: () => void }>;
}

export interface BottomExecutionLogPanelProps {
    isExpanded: boolean;
    onToggleExpanded: () => void;
    onClearOutput: () => void;
    onCopyOutput?: () => void;
    output: ExecutionOutput;
    isLoading: boolean;
    workflowName: string;
    workflowId: string;
    userId?: string | null;
    canvasState?: any;
    logs?: any[];
    onClearLogs?: () => void;
    activeNodes?: Set<string>;
    onApplyLayout?: () => void;
    fetchExecutionOrderByData?: (workflowData: any) => Promise<any>;
    fetchExecutionOrder?: (workflowName: string, workflowId: string, userId?: string) => Promise<any>;
    LogViewerComponent?: React.ComponentType<{ logs: any[]; onClearLogs?: () => void }>;
}

export interface CanvasExecutionLogPanelProps {
    expanded: boolean;
    onToggleExpand: () => void;
    onClearLogs: () => void;
    onFullscreen?: () => void;
    children: React.ReactNode;
}

export interface CanvasBottomPanelContentProps {
    output: ExecutionOutput;
    onClearOutput?: () => void;
    logs?: any[];
    onClearLogs?: () => void;
    workflowName: string;
    workflowId: string;
    userId?: string | null;
    canvasState?: any;
    activeNodes?: Set<string>;
    onApplyLayout?: () => void;
    onExecuteWithInput?: (inputText?: string) => Promise<void>;
    isExecuting?: boolean;
    executionSource?: 'button' | 'chat' | null;
    mockExecutionOrder?: {
        parallel_execution_order?: string[][];
        execution_order?: string[];
        nodes?: Record<string, { data?: { nodeName?: string } }>;
    } | null;
    fetchExecutionOrderByData?: (workflowData: any) => Promise<any>;
    LogViewerComponent?: React.ComponentType<{ logs: any[]; onClearLogs?: () => void; className?: string }>;
}
