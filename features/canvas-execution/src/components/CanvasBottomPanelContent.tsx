import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { LuSend } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import {
    hasError,
    hasOutputs,
    isStreamingOutput,
    type ExecutionOutput,
} from '../types';
import styles from '../styles/canvas-bottom-panel-content.module.scss';

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

    return (
        <div className={styles.box}>
            {/* Left: Execution with Chat / Executor tabs */}
            <div className={styles.colExecution}>
                <div className={styles.executionTabs}>
                    <button
                        type="button"
                        className={`${styles.executionTab} ${executionTab === 'chat' ? styles.executionTabActive : ''}`}
                        onClick={() => setExecutionTab('chat')}
                    >
                        {t('canvas.executionPanel.tabChat', 'Chat')}
                    </button>
                    <button
                        type="button"
                        className={`${styles.executionTab} ${executionTab === 'executor' ? styles.executionTabActive : ''}`}
                        onClick={() => setExecutionTab('executor')}
                    >
                        {t('canvas.executionPanel.tabExecutor', 'Executor')}
                        {executionSource === 'button' && isExecuting && (
                            <span className={styles.executionTabDot} />
                        )}
                    </button>
                </div>

                {/* Chat tab */}
                {executionTab === 'chat' && (
                    <>
                        <div className={styles.chatArea} ref={chatScrollRef}>
                            {chatMessages.length === 0 ? (
                                <span className={styles.placeholder}>
                                    {t('canvas.executionPanel.chatPlaceholder', 'Send a message to execute the workflow')}
                                </span>
                            ) : (
                                chatMessages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`${styles.chatBubble} ${msg.role === 'user' ? styles.chatUser : styles.chatAssistant}`}
                                    >
                                        {msg.role === 'assistant' && !msg.content && isExecuting ? (
                                            <div className={styles.chatTyping}>
                                                <span /><span /><span />
                                            </div>
                                        ) : (
                                            <pre className={styles.chatContent}>{msg.content}</pre>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        {onExecuteWithInput && (
                            <div className={styles.chatInputBar}>
                                <textarea
                                    className={styles.chatInput}
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={handleChatKeyDown}
                                    placeholder={t('canvas.executionPanel.chatInputPlaceholder', 'Type a message...')}
                                    disabled={isExecuting}
                                    rows={1}
                                />
                                <button
                                    className={styles.chatSendBtn}
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
                    <div className={styles.executorArea}>
                        {!buttonResultText && !(executionSource === 'button' && isExecuting) ? (
                            <span className={styles.placeholder}>
                                {t('canvas.executionPanel.placeholder', 'Run workflow to see results')}
                            </span>
                        ) : (
                            <>
                                {executionSource === 'button' && isExecuting && !buttonResultText && (
                                    <div className={styles.executorLoading}>
                                        <span /><span /><span />
                                    </div>
                                )}
                                <pre className={styles.executionPre}>{buttonResultText}</pre>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Middle: Execution Order Graph */}
            <div className={styles.colOrder}>
                <div className={styles.orderInner}>
                    {isLoading && !executionOrder && (
                        <div className={styles.orderLoading}>...</div>
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
                                className={`${styles.orderRow} ${group.length > 1 ? styles.orderRowGroup : ''}`}
                            >
                                <span className={styles.orderNum}>{index + 1}</span>
                                {group.length === 1 ? (
                                    <span className={styles.orderNodeName}>{getNodeName(group[0])}</span>
                                ) : (
                                    <div className={styles.orderGroupColumn}>
                                        {group.map((nodeId: string, subIndex: number) => (
                                            <div key={nodeId} className={styles.orderSubItem}>
                                                <span className={styles.orderSubIndex}>{subIndex + 1}.</span>
                                                <span className={styles.orderSubName}>{getNodeName(nodeId)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {!isLoading && (!hasExecutionData || filteredOrder.length === 0) && (
                        <div className={styles.orderEmpty}>
                            {t('canvas.detailPanel.noExecutionOrderData', 'No execution order data')}
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Log Viewer */}
            <div className={styles.colLog}>
                {LogViewerComponent ? (
                    <LogViewerComponent logs={logs} onClearLogs={onClearLogs} className={styles.logViewerFill} />
                ) : (
                    <pre className={styles.logViewerFill} style={{ padding: 16, margin: 0, whiteSpace: 'pre-wrap', overflowY: 'auto' }}>
                        {logs.map((l: any) => JSON.stringify(l)).join('\n')}
                    </pre>
                )}
            </div>
        </div>
    );
};

export default CanvasBottomPanelContent;
