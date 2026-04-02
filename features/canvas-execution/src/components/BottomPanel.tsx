import React from 'react';
import { useBottomPanel } from '../context/BottomPanelContext';
import { BottomPanelProvider } from '../context/BottomPanelProvider';
import ResizeHandle from './ResizeHandle';
import BottomPanelHeader from './BottomPanelHeader';
import BottomPanelContent from './BottomPanelContent';
import { cn } from '@xgen/ui';
import type { LogViewerProps, BottomPanelProviderProps } from '../types';

// ── Inner panel (requires context) ────────────────────────────

interface BottomPanelInnerProps {
    LogViewerComponent?: React.ComponentType<LogViewerProps>;
}

const BottomPanelInner: React.FC<BottomPanelInnerProps> = ({ LogViewerComponent }) => {
    const { panelMode, panelHeight, setPanelHeight } = useBottomPanel();

    const isExpanded = panelMode === 'expanded';
    const isFullscreen = panelMode === 'fullscreen';

    return (
        <div
            className={cn(
                'absolute left-0 right-0 bottom-0 flex flex-col z-[11] pointer-events-none [&>*]:pointer-events-auto',
                isFullscreen && 'h-[calc(100vh-56px)]',
                isExpanded && !isFullscreen && 'h-[var(--panel-height,300px)]',
            )}
            style={isExpanded ? { '--panel-height': `${panelHeight}px` } as React.CSSProperties : undefined}
        >
            {isExpanded && (
                <ResizeHandle
                    onResize={setPanelHeight}
                    onResizeEnd={undefined}
                />
            )}
            <BottomPanelHeader />
            <BottomPanelContent LogViewerComponent={LogViewerComponent} />
        </div>
    );
};

// ── Self-contained panel (includes Provider) ──────────────────

export interface BottomPanelProps {
    onExecute?: (inputText?: string) => Promise<void>;
    onExecuteWithInput?: (inputText?: string) => Promise<void>;
    workflowId?: string;
    workflowName?: string;
    userId?: string | null;
    canvasState?: any;
    logs?: any[];
    output?: any;
    isLoading?: boolean;
    executionSource?: 'button' | 'chat' | null;
    fetchExecutionOrderByData?: (data: any) => Promise<any>;
    LogViewerComponent?: React.ComponentType<LogViewerProps>;
    [key: string]: unknown;
}

const BottomPanel: React.FC<BottomPanelProps> = ({
    onExecute,
    onExecuteWithInput,
    workflowId = '',
    workflowName = '',
    userId,
    canvasState,
    logs,
    output,
    isLoading,
    executionSource,
    fetchExecutionOrderByData,
    LogViewerComponent,
}) => {
    // Use onExecuteWithInput if available, otherwise onExecute
    const executeFn = onExecuteWithInput || onExecute || (async () => {});

    return (
        <BottomPanelProvider
            onExecute={executeFn}
            workflowId={workflowId}
            workflowName={workflowName}
            userId={userId}
            canvasState={canvasState}
            fetchExecutionOrderByData={fetchExecutionOrderByData}
            LogViewerComponent={LogViewerComponent}
        >
            <BottomPanelBridge
                logs={logs}
                output={output}
                isLoading={isLoading}
                executionSource={executionSource}
            />
            <BottomPanelInner LogViewerComponent={LogViewerComponent} />
        </BottomPanelProvider>
    );
};

// ── Bridge: syncs external props into context ─────────────────

interface BridgeProps {
    logs?: any[];
    output?: any;
    isLoading?: boolean;
    executionSource?: 'button' | 'chat' | null;
}

const BottomPanelBridge: React.FC<BridgeProps> = ({ logs, output, isLoading, executionSource }) => {
    const {
        setLogs,
        setExecutionOutput,
        setIsExecuting,
        setExecutionSource,
    } = useBottomPanel();

    // Sync external logs into context
    React.useEffect(() => {
        if (logs) setLogs(logs);
    }, [logs, setLogs]);

    // Sync external execution output into context
    React.useEffect(() => {
        if (output !== undefined) setExecutionOutput(output);
    }, [output, setExecutionOutput]);

    // Sync external loading state
    React.useEffect(() => {
        if (isLoading !== undefined) setIsExecuting(isLoading);
    }, [isLoading, setIsExecuting]);

    // Sync external execution source
    React.useEffect(() => {
        if (executionSource !== undefined) setExecutionSource(executionSource);
    }, [executionSource, setExecutionSource]);

    return null;
};

export default BottomPanel;
