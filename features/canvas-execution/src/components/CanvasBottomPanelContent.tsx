import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { LuSend } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { cn } from '@xgen/ui';
import {
    hasError,
    hasOutputs,
    isStreamingOutput,
    type ExecutionOutput,
} from '../types';

// ── Helpers ────────────────────────────────────────────────────

const getGraphStructureSignature = (state: any, wfId: string) => {
    if (!state) return `${wfId}|`;
    const nodes = state.nodes || [];
    const edges = state.edges || [];
    const nodeSignatures = nodes
        .map((n: any) =>
            `${n.id}:${n.data?.nodeName}:${Math.round(n.position?.x || 0)}:${Math.round(n.position?.y || 0)}`
        )
        .sort()
        .join(',');
    const edgeSignatures = edges
        .map((e: any) => `${e.source}:${e.sourceHandle}-${e.target}:${e.targetHandle}`)
        .sort()
        .join(',');
    return `${wfId}|${nodeSignatures}|${edgeSignatures}`;
};

const getExecutionGroups = (data: any): string[][] => {
    if (!data) return [];
    if (Array.isArray(data.parallel_execution_order)) return data.parallel_execution_order;
    if (Array.isArray(data.execution_order)) return data.execution_order.map((id: string) => [id]);
    return [];
};

// ── Types ──────────────────────────────────────────────────────

interface ChatMessage {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
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
    /** Preview mode: when provided, skip API calls and use this value for execution order */
    mockExecutionOrder?: {
        parallel_execution_order?: string[][];
        execution_order?: string[];
        nodes?: Record<string, { data?: { nodeName?: string } }>;
    } | null;
    /** Injected API: fetch execution order by workflow data */
    fetchExecutionOrderByData?: (workflowData: any) => Promise<any>;
    /** Injected log viewer component */
    LogViewerComponent?: React.ComponentType<{ logs: any[]; onClearLogs?: () => void; className?: string }>;
}

// ── Component ──────────────────────────────────────────────────

const CanvasBottomPanelContent: React.FC<CanvasBottomPanelContentProps> = ({
    output,
    logs = [],
    onClearLogs,
    workflowName,
    workflowId,
    userId,
    canvasState,
    activeNodes,
    onApplyLayout,
    onExecuteWithInput,
    isExecuting = false,
    executionSource = null,
    mockExecutionOrder,
    fetchExecutionOrderByData,
    LogViewerComponent,
}) => {
    const { t } = useTranslation();
    const [executionOrder, setExecutionOrder] = useState<any>(mockExecutionOrder ?? null);
    const [isLoading, setIsLoading] = useState(false);
    const previousStructureRef = useRef<string>('');
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Chat state
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const chatScrollRef = useRef<HTMLDivElement>(null);
    const chatMsgIdRef = useRef(0);
    const lastOutputRef = useRef<string>('');

    // Button execution result (separate from chat)
    const [buttonResultText, setButtonResultText] = useState('');

    // Execution tab: Chat / Executor
    const [executionTab, setExecutionTab] = useState<'chat' | 'executor'>('chat');

    // Route output to chat messages or executor based on execution source
    useEffect(() => {
        const currentText = (() => {
            if (!output) return '';
            if (hasError(output)) return `Error: ${output.error}`;
            if (isStreamingOutput(output)) return output.stream;
            if (hasOutputs(output)) return JSON.stringify(output.outputs, null, 2);
            return '';
        })();

        if (!currentText || currentText === lastOutputRef.current) return;
        lastOutputRef.current = currentText;

        if (executionSource === 'chat') {
            setChatMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.role === 'assistant') {
                    return [...prev.slice(0, -1), { ...lastMsg, content: currentText }];
                }
                return [...prev, {
                    id: ++chatMsgIdRef.current,
                    role: 'assistant',
                    content: currentText,
                    timestamp: Date.now(),
                }];
            });
        } else {
            setButtonResultText(currentText);
        }
    }, [output, executionSource]);

    // Auto-switch to Executor tab on button execution
    useEffect(() => {
        if (executionSource === 'button' && isExecuting) {
            setButtonResultText('');
            setExecutionTab('executor');
        }
    }, [executionSource, isExecuting]);

    // Auto-switch to Chat tab on chat execution
    useEffect(() => {
        if (executionSource === 'chat' && isExecuting) {
            setExecutionTab('chat');
        }
    }, [executionSource, isExecuting]);

    // Auto-scroll chat
    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const handleSendChat = useCallback(async () => {
        const text = chatInput.trim();
        if (!text || isExecuting || !onExecuteWithInput) return;

        setChatMessages(prev => [...prev, {
            id: ++chatMsgIdRef.current,
            role: 'user',
            content: text,
            timestamp: Date.now(),
        }]);
        setChatInput('');
        lastOutputRef.current = '';

        // Add assistant placeholder
        setChatMessages(prev => [...prev, {
            id: ++chatMsgIdRef.current,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
        }]);

        await onExecuteWithInput(text);
    }, [chatInput, isExecuting, onExecuteWithInput]);

    const handleChatKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendChat();
        }
    }, [handleSendChat]);

    // Mock execution order
    useEffect(() => {
        if (mockExecutionOrder !== undefined) setExecutionOrder(mockExecutionOrder ?? null);
    }, [mockExecutionOrder]);

    const getNodeBypassStatus = useCallback((nodeId: string): boolean => {
        if (!canvasState?.nodes) return false;
        const node = canvasState.nodes.find((n: any) => n.id === nodeId);
        return node?.data?.bypass === true;
    }, [canvasState]);

    const getNodeFromCanvasState = useCallback((nodeId: string): any => {
        if (!canvasState?.nodes) return null;
        return canvasState.nodes.find((n: any) => n.id === nodeId);
    }, [canvasState]);

    const normalizeExecutionOrder = (data: any) => {
        if (data && !data.parallel_execution_order && data.execution_order) {
            return { ...data, parallel_execution_order: data.execution_order.map((id: string) => [id]) };
        }
        return data;
    };

    const fetchExecutionOrder = useCallback(async () => {
        const nodes = canvasState ? (canvasState.nodes || []) : [];
        if (nodes.length === 0) {
            setExecutionOrder(null);
            return;
        }

        if (!fetchExecutionOrderByData) return;
        if (!executionOrder) setIsLoading(true);
        try {
            const workflowData = {
                ...canvasState,
                workflow_name: workflowName,
                workflow_id: workflowId,
                user_id: userId || undefined,
            };
            const result = await fetchExecutionOrderByData(workflowData);
            setExecutionOrder(normalizeExecutionOrder(result));
        } catch {
            setExecutionOrder(null);
        } finally {
            setIsLoading(false);
        }
    }, [canvasState, workflowName, workflowId, userId, fetchExecutionOrderByData]);

    useEffect(() => {
        if (mockExecutionOrder !== undefined) return;
        const currentStructure = getGraphStructureSignature(canvasState, workflowId);
        if (currentStructure === previousStructureRef.current && executionOrder) return;
        previousStructureRef.current = currentStructure;
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(fetchExecutionOrder, 300);
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, [canvasState, workflowId, workflowName, userId, fetchExecutionOrder, mockExecutionOrder]);

    const executionGroups = useMemo(() => getExecutionGroups(executionOrder), [executionOrder]);
    const filteredOrder = useMemo(() => {
        if (!executionGroups.length) return [];
        return executionGroups
            .map((group: string[]) => group.filter((id: string) => !getNodeBypassStatus(id)))
            .filter((g: string[]) => g.length > 0);
    }, [executionGroups, getNodeBypassStatus]);

    const hasExecutionData = executionOrder && (
        (executionOrder.parallel_execution_order && executionOrder.parallel_execution_order.length > 0) ||
        (executionOrder.execution_order && executionOrder.execution_order.length > 0)
    );

    const tabClass = 'flex-1 py-2 border-none bg-transparent text-xs font-medium text-gray-400 cursor-pointer relative flex items-center justify-center gap-1.5 transition-colors duration-150 hover:text-[#40444d]';
    const tabActiveClass = "text-primary font-semibold after:content-[''] after:absolute after:bottom-0 after:left-4 after:right-4 after:h-0.5 after:bg-primary after:rounded-[1px]";
    const bouncingDotsClass = 'flex gap-1 py-1 [&_span]:w-1.5 [&_span]:h-1.5 [&_span]:rounded-full [&_span]:bg-gray-400 [&_span]:animate-[bouncing-dots_1.2s_infinite] [&_span:nth-child(2)]:delay-200 [&_span:nth-child(3)]:delay-[400ms]';

    return (
        <div className="flex flex-1 min-h-0 bg-white border border-black/[0.08] border-t-0 overflow-hidden">
            {/* Left: Execution with Chat / Executor tabs */}
            <div className="shrink-0 basis-[500px] w-[500px] min-w-[500px] max-w-[500px] flex flex-col border-r border-black/[0.08]">
                <div className="flex border-b border-black/[0.08] shrink-0 bg-[#fafbfc]">
                    <button
                        type="button"
                        className={cn(tabClass, executionTab === 'chat' && tabActiveClass)}
                        onClick={() => setExecutionTab('chat')}
                    >
                        {t('canvas.executionPanel.tabChat', 'Chat')}
                    </button>
                    <button
                        type="button"
                        className={cn(tabClass, executionTab === 'executor' && tabActiveClass)}
                        onClick={() => setExecutionTab('executor')}
                    >
                        {t('canvas.executionPanel.tabExecutor', 'Executor')}
                        {executionSource === 'button' && isExecuting && (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-[exec-pulse_1s_infinite]" />
                        )}
                    </button>
                </div>

                {/* Chat tab */}
                {executionTab === 'chat' && (
                    <>
                        <div className="flex-1 overflow-y-auto py-3 px-4 flex flex-col gap-2 text-xs font-normal leading-4 text-[#40444d]" ref={chatScrollRef}>
                            {chatMessages.length === 0 ? (
                                <span className="text-[#7a7f89]">
                                    {t('canvas.executionPanel.chatPlaceholder', 'Send a message to execute the agentflow')}
                                </span>
                            ) : (
                                chatMessages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            'max-w-[85%] py-2 px-3 rounded-[10px] break-words',
                                            msg.role === 'user'
                                                ? 'self-end bg-primary text-white rounded-br-sm'
                                                : 'self-start bg-gray-100 text-[#40444d] rounded-bl-sm',
                                        )}
                                    >
                                        {msg.role === 'assistant' && !msg.content && isExecuting ? (
                                            <div className={bouncingDotsClass}>
                                                <span /><span /><span />
                                            </div>
                                        ) : (
                                            <pre className="m-0 whitespace-pre-wrap break-words text-xs leading-[18px]">{msg.content}</pre>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        {onExecuteWithInput && (
                            <div className="flex items-end gap-1.5 py-2 px-3 border-t border-black/[0.08] bg-[#fafbfc] shrink-0">
                                <textarea
                                    className="flex-1 py-1.5 px-2.5 border border-gray-300 rounded-lg text-xs leading-[18px] text-[#40444d] bg-white resize-none min-h-[30px] max-h-[60px] outline-none transition-[border-color] duration-150 focus:border-primary focus:shadow-[0_0_0_2px_rgba(37,99,235,0.1)] placeholder:text-gray-400 disabled:opacity-50"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={handleChatKeyDown}
                                    placeholder={t('canvas.executionPanel.chatInputPlaceholder', 'Type a message...')}
                                    disabled={isExecuting}
                                    rows={1}
                                />
                                <button
                                    className="flex items-center justify-center w-[30px] h-[30px] border-none rounded-lg bg-primary text-white cursor-pointer shrink-0 transition-[background] duration-150 hover:enabled:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed [&_svg]:w-3.5 [&_svg]:h-3.5"
                                    onClick={handleSendChat}
                                    disabled={isExecuting || !chatInput.trim()}
                                    title={t('canvas.executionPanel.send', 'Send')}
                                    type="button"
                                >
                                    <LuSend />
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Executor tab */}
                {executionTab === 'executor' && (
                    <div className="flex-1 overflow-y-auto py-3 px-4 text-xs font-normal leading-4 text-[#40444d]">
                        {!buttonResultText && !(executionSource === 'button' && isExecuting) ? (
                            <span className="text-[#7a7f89]">
                                {t('canvas.executionPanel.placeholder', 'Run agentflow to see results')}
                            </span>
                        ) : (
                            <>
                                {executionSource === 'button' && isExecuting && !buttonResultText && (
                                    <div className={bouncingDotsClass}>
                                        <span /><span /><span />
                                    </div>
                                )}
                                <pre className="m-0 whitespace-pre-wrap break-words">{buttonResultText}</pre>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Middle: Execution Order Graph */}
            <div className="shrink-0 basis-[252px] min-w-0 bg-[#f7f8fa] border-r border-black/[0.08] overflow-auto">
                <div className="p-4">
                    {isLoading && !executionOrder && (
                        <div className="text-xs text-[#7a7f89]">...</div>
                    )}
                    {filteredOrder.map((group: string[], index: number) => {
                        const groupKey = group.join('-');
                        const getNodeName = (nodeId: string) => {
                            const node = getNodeFromCanvasState(nodeId) || executionOrder?.nodes?.[nodeId];
                            return node?.data?.nodeName ?? executionOrder?.nodes?.[nodeId]?.data?.nodeName ?? nodeId;
                        };
                        return (
                            <div
                                key={groupKey}
                                className={cn(
                                    'flex items-center gap-4 mb-2.5 last:mb-0',
                                    group.length > 1 && 'items-start',
                                )}
                            >
                                <span className="text-xs font-bold leading-4 text-[#40444d] shrink-0">{index + 1}</span>
                                {group.length === 1 ? (
                                    <span className="text-xs font-normal leading-4 text-[#40444d] min-w-0">{getNodeName(group[0])}</span>
                                ) : (
                                    <div className="flex flex-col gap-1 min-w-0 flex-1 border-l border-black/[0.08] pl-2.5">
                                        {group.map((nodeId: string, subIndex: number) => (
                                            <div key={nodeId} className="flex items-center min-w-0">
                                                <span className="text-xs font-normal text-[#40444d] mr-1.5 shrink-0">{subIndex + 1}.</span>
                                                <span className="text-xs font-normal leading-4 text-[#40444d] min-w-0">{getNodeName(nodeId)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {!isLoading && (!hasExecutionData || filteredOrder.length === 0) && (
                        <div className="text-xs text-[#7a7f89]">
                            {t('canvas.detailPanel.noExecutionOrderData', 'No execution order data')}
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Log Viewer */}
            <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
                {LogViewerComponent ? (
                    <LogViewerComponent logs={logs} onClearLogs={onClearLogs} className="flex-1 min-h-0 overflow-hidden flex flex-col text-[15px]" />
                ) : (
                    <pre className="flex-1 min-h-0 overflow-y-auto p-4 m-0 whitespace-pre-wrap text-[15px]">
                        {logs.map((l: any) => JSON.stringify(l)).join('\n')}
                    </pre>
                )}
            </div>
        </div>
    );
};

export default CanvasBottomPanelContent;
