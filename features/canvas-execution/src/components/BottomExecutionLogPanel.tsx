import React from 'react';
import { LuChevronUp, LuChevronDown, LuTrash2, LuCopy } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { cn } from '@xgen/ui';
import {
    hasError,
    hasOutputs,
    isStreamingOutput,
    type ExecutionOutput,
    type BottomExecutionLogPanelProps,
} from '../types';
import DetailPanel from './DetailPanel';

const barActionBtnClass = 'inline-flex items-center justify-center p-0.5 border-none rounded-lg bg-transparent text-[#17191c] cursor-pointer w-6 h-6 transition-colors duration-200 hover:bg-black/[0.06]';

const ExecutionOutputRenderer: React.FC<{ output: ExecutionOutput }> = ({ output }) => {
    const { t } = useTranslation();
    if (!output) {
        return <div className="text-[#40444d] whitespace-pre-wrap">{t('canvas.executionPanel.placeholder', 'Run agentflow to see results')}</div>;
    }
    if (hasError(output)) {
        return (
            <div className="py-2 px-2.5 rounded-lg border-l-2 border-l-[#f6c1c1] bg-[#fdf3f3] text-xs text-[#40444d] mb-2">
                <div className="m-0 whitespace-pre-wrap break-words">{output.error}</div>
            </div>
        );
    }
    if (isStreamingOutput(output)) {
        return (
            <div className="py-2 px-2.5 rounded-lg border-l-2 border-l-[#cdd8fa] bg-[#f2f4f7] text-xs text-[#40444d] mb-2">
                <pre className="m-0 whitespace-pre-wrap break-words">{output.stream}</pre>
            </div>
        );
    }
    if (hasOutputs(output)) {
        return (
            <div className="py-2 px-2.5 rounded-lg border-l-2 border-l-[#cdd8fa] bg-[#f2f4f7] text-xs text-[#40444d] mb-2">
                <pre className="m-0 whitespace-pre-wrap break-words">{JSON.stringify(output.outputs, null, 2)}</pre>
            </div>
        );
    }
    return <div className="text-[#40444d] whitespace-pre-wrap">{t('canvas.executionPanel.unexpectedFormat', 'Unexpected format')}</div>;
};

const BottomExecutionLogPanel: React.FC<BottomExecutionLogPanelProps> = ({
    isExpanded,
    onToggleExpanded,
    onClearOutput,
    onCopyOutput,
    output,
    isLoading,
    workflowName,
    workflowId,
    userId,
    canvasState,
    logs = [],
    onClearLogs,
    activeNodes,
    onApplyLayout,
    fetchExecutionOrderByData,
    fetchExecutionOrder,
    LogViewerComponent,
}) => {
    const { t } = useTranslation();

    return (
        <div className={cn(
            'absolute bottom-0 left-0 right-0 z-[1000] flex flex-row bg-white border-t-2 border-black/[0.08] pointer-events-auto',
            isExpanded ? 'h-[300px] min-h-[300px] max-h-[300px]' : '',
        )}>
            <section className="w-[320px] min-w-[320px] max-w-[320px] flex flex-col border-r border-black/[0.08] bg-white">
                <div className="flex items-center gap-2 px-4 py-2 min-h-[40px] shrink-0 border-b border-black/[0.08]">
                    <span className="text-xs font-bold leading-4 text-[#17191c]">Execution</span>
                </div>
                {isExpanded && (
                    <div className="flex-1 min-h-0 p-4 overflow-y-auto text-xs leading-4 text-[#40444d] bg-white">
                        {isLoading ? <div className="border-2 border-[#f3f3f3] border-t-[#305eeb] rounded-full w-3.5 h-3.5 animate-spin" /> : <ExecutionOutputRenderer output={output} />}
                    </div>
                )}
            </section>

            <section className="flex-1 min-w-0 flex flex-col bg-white">
                <div className="flex items-center justify-between px-4 py-2 min-h-[40px] shrink-0 border-l border-b border-black/[0.08]">
                    <span className="text-xs font-bold leading-4 text-[#17191c]">{t('canvas.detailPanel.log', 'Log')}</span>
                    <div className="flex items-center gap-3.5">
                        <button type="button" className={barActionBtnClass} onClick={onClearLogs}
                            title={t('canvas.executionPanel.clearOutput', 'Clear')}>
                            <LuTrash2 size={18} />
                        </button>
                        <span className="w-px h-5 bg-black/[0.08]" aria-hidden="true" />
                        <button type="button" className="inline-flex items-center justify-center p-1 border-none rounded-md bg-transparent text-[#17191c] cursor-pointer transition-colors duration-200 w-6 h-6 hover:bg-black/[0.06]" onClick={onToggleExpanded}
                            title={isExpanded ? t('canvas.bottomPanel.collapse', 'Collapse') : t('canvas.bottomPanel.expand', 'Expand')}
                            aria-expanded={isExpanded}>
                            {isExpanded ? <LuChevronDown /> : <LuChevronUp />}
                        </button>
                        {onCopyOutput && (
                            <button type="button" className={barActionBtnClass} onClick={onCopyOutput}
                                title={t('canvas.executionPanel.copyOutput', 'Copy')}>
                                <LuCopy size={18} />
                            </button>
                        )}
                    </div>
                </div>
                {isExpanded && (
                    <div className="flex-1 min-h-0 border-l border-black/[0.08] overflow-hidden flex flex-col">
                        <DetailPanel
                            embedded
                            embeddedLayout="split"
                            workflowName={workflowName}
                            workflowId={workflowId}
                            userId={userId}
                            canvasState={canvasState}
                            logs={logs}
                            onClearLogs={onClearLogs}
                            activeNodes={activeNodes}
                            onApplyLayout={onApplyLayout}
                            fetchExecutionOrderByData={fetchExecutionOrderByData}
                            fetchExecutionOrder={fetchExecutionOrder}
                            LogViewerComponent={LogViewerComponent}
                        />
                    </div>
                )}
            </section>
        </div>
    );
};

export { ExecutionOutputRenderer };
export default BottomExecutionLogPanel;
