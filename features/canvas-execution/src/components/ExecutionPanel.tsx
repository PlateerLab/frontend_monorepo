import React, { useState, useCallback } from 'react';
import { LuPlay, LuTrash2, LuCircleX, LuChevronUp, LuChevronDown, LuCopy, LuCheck } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { cn } from '@xgen/ui';
import {
    type OutputRendererProps,
    type ExecutionPanelProps,
    hasError,
    hasOutputs,
    isStreamingOutput,
} from '../types';

const OutputRenderer: React.FC<OutputRendererProps> = ({ output }) => {
    const { t } = useTranslation();

    if (!output) {
        return <div className="text-[#40444d] whitespace-pre-wrap">{t('canvas.executionPanel.placeholder', 'Run workflow to see results')}</div>;
    }
    if (hasError(output)) {
        return (
            <div className="py-2 px-2.5 rounded-lg border-l-2 border-l-[#f6c1c1] bg-[#fdf3f3] text-xs text-[#40444d] mb-2">
                <div className="flex items-center gap-1.5 text-red-600 font-medium mb-1">
                    <LuCircleX />
                    <span>{t('canvas.executionPanel.executionFailed', 'Execution failed')}</span>
                </div>
                <div>{output.error}</div>
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
    return <div className="text-[#40444d] whitespace-pre-wrap">{t('canvas.executionPanel.unexpectedFormat', 'Unexpected output format')}</div>;
};

const toggleBtnClass = 'flex items-center justify-center p-1 border-none rounded-md bg-[#f8f9fa] text-[#495057] text-sm cursor-pointer transition-all duration-200 min-w-6 h-6 hover:bg-[#e9ecef] hover:text-[#343a40] hover:scale-105';
const actionBtnBase = 'flex items-center gap-1.5 py-1.5 px-3 border-none rounded-md text-sm font-medium cursor-pointer transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed';
const iconOnlyBtnClass = `${actionBtnBase} !py-1.5 !px-1.5 bg-[#f8f9fa] text-[#495057] hover:enabled:bg-[#e9ecef] hover:enabled:text-[#343a40]`;

const ExecutionPanel: React.FC<ExecutionPanelProps> = ({ onExecute, onClear, output, isLoading }) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState<boolean>(true);
    const [isCopied, setIsCopied] = useState<boolean>(false);

    const getOutputText = useCallback((): string => {
        if (!output) return '';
        if (hasError(output)) return `Error: ${output.error}`;
        if (isStreamingOutput(output)) return output.stream;
        if (hasOutputs(output)) return JSON.stringify(output.outputs, null, 2);
        return '';
    }, [output]);

    const handleCopy = useCallback(async (): Promise<void> => {
        const text = getOutputText();
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }, [getOutputText]);

    const hasOutput = output && (hasError(output) || isStreamingOutput(output) || hasOutputs(output));

    return (
        <div className={cn(
            'w-[450px] max-h-[40vh] bg-white/90 backdrop-blur-[10px] rounded-xl shadow-[0_8px_25px_rgba(0,0,0,0.15)] border border-black/10 flex flex-col overflow-hidden transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] select-none',
            !isExpanded && 'max-h-none h-auto w-[200px]',
        )}>
            <div className={cn(
                'flex justify-between items-center px-4 py-2 border-b border-[#e0e0e0] shrink-0 transition-[border-bottom] duration-300',
                !isExpanded && 'border-b-transparent',
            )}>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsExpanded(!isExpanded)} className={toggleBtnClass} type="button"
                        title={isExpanded ? 'Collapse Panel' : 'Expand Panel'}>
                        {isExpanded ? <LuChevronUp /> : <LuChevronDown />}
                    </button>
                    <h4 className="m-0 font-semibold text-[0.95rem]">{t('canvas.executionPanel.title', 'Execution')}</h4>
                </div>
                <div className="flex items-center gap-2 transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]" style={{ display: isExpanded ? 'flex' : 'none' }}>
                    <button onClick={onClear} className={iconOnlyBtnClass}
                        title={t('canvas.executionPanel.clearOutput', 'Clear')} disabled={isLoading || !hasOutput} type="button">
                        <LuTrash2 />
                    </button>
                    <button onClick={handleCopy} className={cn(iconOnlyBtnClass, isCopied && '!bg-[#d3f9d8] !text-[#2f9e44]')}
                        title={isCopied ? t('canvas.executionPanel.copied', 'Copied') : t('canvas.executionPanel.copyOutput', 'Copy')}
                        disabled={isLoading || !hasOutput} type="button">
                        {isCopied ? <LuCheck /> : <LuCopy />}
                    </button>
                    <button onClick={onExecute} className={`${actionBtnBase} bg-[#28a745] text-white hover:enabled:bg-[#218838]`}
                        title={t('canvas.executionPanel.runAgentflow', 'Run')} disabled={isLoading} type="button">
                        {isLoading ? (
                            <div className="border-2 border-[#f3f3f3] border-t-[#3498db] rounded-full w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <>
                                <LuPlay />
                                <span>{t('canvas.executionPanel.saveAndRun', 'Save & Run')}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
            {isExpanded && (
                <div className="grow p-4 overflow-y-auto font-mono text-sm bg-[#f8f9fa] animate-[slideDown_0.4s_cubic-bezier(0.4,0,0.2,1)]">
                    <pre className="m-0 whitespace-pre-wrap break-words text-[#333]">
                        <OutputRenderer output={output} />
                    </pre>
                </div>
            )}
        </div>
    );
};

export { OutputRenderer };
export default ExecutionPanel;
