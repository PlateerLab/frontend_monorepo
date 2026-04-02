import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { LuChevronUp, LuChevronDown } from '@xgen/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@xgen/i18n';
import { cn } from '@xgen/ui';
import type { DetailPanelProps } from '../types';

// ── Helpers ────────────────────────────────────────────────────

const getGraphStructureSignature = (state: any, wfId: string) => {
    if (!state) return `${wfId}|`;
    const nodes = state.nodes || [];
    const edges = state.edges || [];
    const nodeSignatures = nodes
        .map((n: any) => `${n.id}:${n.data?.nodeName}:${Math.round(n.position?.x || 0)}:${Math.round(n.position?.y || 0)}`)
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

// ── Component ──────────────────────────────────────────────────

const DetailPanel: React.FC<DetailPanelProps> = ({
    embedded,
    embeddedLayout = 'tabs',
    workflowName,
    workflowId,
    userId,
    canvasState,
    logs = [],
    onClearLogs,
    activeNodes,
    onApplyLayout,
    fetchExecutionOrderByData,
    fetchExecutionOrder: fetchExecutionOrderApi,
    LogViewerComponent,
}) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<'Graph' | 'Detail'>('Graph');
    const [executionOrder, setExecutionOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const previousStructureRef = useRef<string>('');
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const getNodeBypassStatus = useCallback(
        (nodeId: string): boolean => {
            if (!canvasState?.nodes) return false;
            const node = canvasState.nodes.find((n: any) => n.id === nodeId);
            return node?.data?.bypass === true;
        },
        [canvasState],
    );

    const getNodeFromCanvasState = useCallback(
        (nodeId: string): any => {
            if (!canvasState?.nodes) return null;
            return canvasState.nodes.find((n: any) => n.id === nodeId);
        },
        [canvasState],
    );

    const normalizeExecutionOrder = (data: any) => {
        if (data && !data.parallel_execution_order && data.execution_order) {
            return { ...data, parallel_execution_order: data.execution_order.map((id: string) => [id]) };
        }
        return data;
    };

    const fetchExecutionOrderData = async () => {
        const stateToUse = canvasState;
        if (stateToUse) {
            const hasNodes = stateToUse.nodes && stateToUse.nodes.length > 0;
            if (hasNodes && fetchExecutionOrderByData) {
                if (!executionOrder) setIsLoading(true);
                setError(null);
                try {
                    const workflowData = {
                        ...stateToUse,
                        workflow_name: workflowName,
                        workflow_id: workflowId,
                        user_id: userId || undefined,
                    };
                    const result = await fetchExecutionOrderByData(workflowData);
                    setExecutionOrder(normalizeExecutionOrder(result));
                } catch (err: any) {
                    setError(err.message || 'Failed to fetch execution order');
                } finally {
                    setIsLoading(false);
                }
            } else if (!hasNodes && executionOrder) {
                setExecutionOrder(null);
            }
            return;
        }

        if (workflowName && workflowId && workflowId !== 'None' && fetchExecutionOrderApi) {
            if (!executionOrder) setIsLoading(true);
            setError(null);
            try {
                const result = await fetchExecutionOrderApi(workflowName, workflowId, userId || undefined);
                setExecutionOrder(normalizeExecutionOrder(result));
            } catch (err: any) {
                setError(err.message || 'Failed to fetch execution order');
            } finally {
                setIsLoading(false);
            }
            return;
        }

        if (executionOrder) setExecutionOrder(null);
    };

    useEffect(() => {
        if (isExpanded && activeTab === 'Graph') {
            const currentStructure = getGraphStructureSignature(canvasState, workflowId);
            if (currentStructure === previousStructureRef.current && executionOrder) return;
            previousStructureRef.current = currentStructure;
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => {
                fetchExecutionOrderData();
            }, 300);
        }
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, [isExpanded, activeTab, workflowName, workflowId, canvasState]);

    const executionGroups = useMemo(() => getExecutionGroups(executionOrder), [executionOrder]);

    const { filteredExecutionOrder, bypassedNodes } = useMemo(() => {
        if (!executionGroups.length) return { filteredExecutionOrder: [] as string[][], bypassedNodes: [] as string[] };
        const bypassed: string[] = [];
        const filtered = executionGroups
            .map((group: string[]) =>
                group.filter((nodeId: string) => {
                    const isBypassed = getNodeBypassStatus(nodeId);
                    if (isBypassed) { bypassed.push(nodeId); return false; }
                    return true;
                }),
            )
            .filter((group: string[]) => group.length > 0);
        return { filteredExecutionOrder: filtered, bypassedNodes: bypassed };
    }, [executionGroups, getNodeBypassStatus]);

    const canApplyLayout = !!onApplyLayout && filteredExecutionOrder.length > 0 && !isLoading;
    const hasExecutionData = executionOrder && (
        executionOrder.parallel_execution_order?.length > 0 || executionOrder.execution_order?.length > 0
    );
    const hasData = !isLoading && !error && hasExecutionData;

    // ── Graph Content ──────────────────────────────────────────

    const graphContent = (
        <div>
            {error && (
                <div style={{ color: 'red', padding: '10px', backgroundColor: '#fff5f5', borderRadius: '4px' }}>{error}</div>
            )}
            {hasExecutionData && executionGroups.length > 0 && (
                <div style={{ fontSize: '0.8rem', opacity: isLoading ? 0.6 : 1, transition: 'opacity 0.2s ease-in-out' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        <AnimatePresence initial={false}>
                            {filteredExecutionOrder.map((group: string[], index: number) => {
                                const groupKey = group.join('-');
                                return (
                                    <motion.li key={groupKey} layout
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        style={{ borderBottom: '1px solid #eee', background: 'white', overflow: 'hidden' }}>
                                        <div style={{ padding: '10px', display: 'flex', alignItems: group.length > 1 ? 'flex-start' : 'center', gap: '6px' }}>
                                            <span style={{ backgroundColor: '#e9ecef', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 'bold', flexShrink: 0 }}>{index + 1}</span>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0, flex: 1, borderLeft: group.length > 1 ? '2px solid #e9ecef' : 'none', paddingLeft: group.length > 1 ? '8px' : '0' }}>
                                                {group.map((nodeId: string, subIndex: number) => {
                                                    const nodeInfo = executionOrder.nodes?.[nodeId];
                                                    const canvasNode = getNodeFromCanvasState(nodeId);
                                                    const nodeName = canvasNode?.data?.nodeName || nodeInfo?.data?.nodeName || 'Unknown';
                                                    const isActive = activeNodes?.has(nodeId);
                                                    return (
                                                        <div key={nodeId} style={{
                                                            display: 'flex', alignItems: 'center', minWidth: 0,
                                                            backgroundColor: isActive ? '#e6fcf5' : 'transparent',
                                                            borderRadius: isActive ? '4px' : '0',
                                                            padding: isActive ? '4px' : '0',
                                                            transition: 'background-color 0.3s ease',
                                                        }}>
                                                            {group.length > 1 && (
                                                                <span style={{ fontSize: '0.75rem', color: '#adb5bd', marginRight: '8px', fontWeight: 500, minWidth: '12px' }}>{subIndex + 1}.</span>
                                                            )}
                                                            <span style={{ fontWeight: 600, marginRight: '6px', whiteSpace: 'nowrap', fontSize: '0.8rem', color: isActive ? '#0ca678' : 'inherit' }}>{nodeName}</span>
                                                            <span style={{ color: isActive ? '#20c997' : '#868e96', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }} title={nodeId}>({nodeId})</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </motion.li>
                                );
                            })}
                        </AnimatePresence>
                    </ul>
                    {bypassedNodes.length > 0 && (
                        <div style={{ marginTop: '12px', padding: '8px 12px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px dashed #dee2e6' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#868e96', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Bypassed ({bypassedNodes.length})
                            </div>
                            {bypassedNodes.map((nodeId: string) => {
                                const nodeInfo = executionOrder.nodes?.[nodeId];
                                const canvasNode = getNodeFromCanvasState(nodeId);
                                const nodeName = canvasNode?.data?.nodeName || nodeInfo?.data?.nodeName || 'Unknown';
                                return (
                                    <div key={nodeId} style={{ display: 'flex', alignItems: 'center', padding: '4px 0', opacity: 0.6 }}>
                                        <span style={{ fontSize: '0.65rem', color: '#868e96', backgroundColor: '#e9ecef', padding: '1px 6px', borderRadius: '3px', marginRight: '8px', fontWeight: 500 }}>BYPASS</span>
                                        <span style={{ fontWeight: 600, marginRight: '6px', whiteSpace: 'nowrap', fontSize: '0.85rem', color: '#adb5bd', textDecoration: 'line-through' }}>{nodeName}</span>
                                        <span style={{ color: '#ced4da', fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textDecoration: 'line-through' }} title={nodeId}>({nodeId})</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
            {isLoading && !executionOrder && (
                <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
            )}
            {!isLoading && !error && !hasExecutionData && (
                <div style={{ color: '#868e96', textAlign: 'center', padding: '10px' }}>
                    No execution order data available.
                </div>
            )}
        </div>
    );

    const detailLogContent = LogViewerComponent
        ? <LogViewerComponent logs={logs} onClearLogs={onClearLogs} />
        : <pre style={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>{logs.map((l: any) => JSON.stringify(l)).join('\n')}</pre>;

    const contentInner = (
        <div className="grow overflow-y-auto overflow-x-hidden text-sm bg-white">
            {activeTab === 'Graph' && graphContent}
            {activeTab === 'Detail' && detailLogContent}
        </div>
    );

    // ── Render Modes ───────────────────────────────────────────

    const toggleBtnClass = 'flex items-center justify-center p-1 border-none rounded-md bg-[#f8f9fa] text-[#495057] text-sm cursor-pointer transition-all duration-200 min-w-6 h-6 hover:bg-[#e9ecef] hover:text-[#343a40] hover:scale-105';
    const tabBtnClass = 'py-1 px-3 border-none rounded-md text-sm font-medium cursor-pointer bg-transparent text-[#868e96] transition-all duration-200 hover:text-[#495057]';
    const tabActiveClass = 'bg-white text-[#343a40] shadow-[0_2px_4px_rgba(0,0,0,0.05)]';
    const layoutBtnClass = 'py-1 px-2.5 border border-[#dee2e6] rounded-md bg-white text-[#343a40] text-xs font-semibold cursor-pointer transition-colors duration-200 hover:enabled:bg-[#e9ecef] hover:enabled:border-[#ced4da] disabled:text-[#adb5bd] disabled:bg-[#f1f3f5] disabled:border-[#e9ecef] disabled:cursor-not-allowed';

    if (embedded && embeddedLayout === 'split') {
        return (
            <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
                <div className="flex-[2_2_0] min-w-0 overflow-hidden flex flex-col bg-[#f7f8fa]">
                    <div className="overflow-y-auto flex-1 min-h-0 py-3 px-4 text-[0.8rem]">{graphContent}</div>
                </div>
                <div className="flex-[3_3_0] min-w-0 overflow-hidden flex flex-col border-l border-black/[0.08] bg-white">
                    <div className="overflow-y-auto flex-1 min-h-0 py-3 px-4 bg-white">{detailLogContent}</div>
                </div>
            </div>
        );
    }

    if (embedded) {
        return (
            <div className="flex flex-col h-full min-h-0 overflow-hidden py-3 px-4 pb-4 bg-transparent">
                <div className="flex items-center gap-2 flex-wrap justify-end mb-2">
                    {activeTab === 'Graph' && (
                        <button className={layoutBtnClass}
                            onClick={(e) => { e.stopPropagation(); onApplyLayout?.(); }}
                            disabled={!canApplyLayout}
                            title={t('canvas.detailPanel.applyLayoutTooltip', 'Apply layout')}
                            type="button">
                            {t('canvas.detailPanel.applyLayout', 'Apply Layout')}
                        </button>
                    )}
                    <div className="flex gap-1 bg-[#f1f3f5] p-1 rounded-lg">
                        <button className={cn(tabBtnClass, activeTab === 'Graph' && tabActiveClass)}
                            onClick={(e) => { e.stopPropagation(); setActiveTab('Graph'); }} type="button">
                            {t('canvas.detailPanel.graph', 'Graph')}
                        </button>
                        <button className={cn(tabBtnClass, activeTab === 'Detail' && tabActiveClass)}
                            onClick={(e) => { e.stopPropagation(); setActiveTab('Detail'); }} type="button">
                            {t('canvas.detailPanel.detail', 'Detail')}
                        </button>
                    </div>
                </div>
                {contentInner}
            </div>
        );
    }

    return (
        <div className={cn(
            'w-[450px] max-h-[40vh] bg-white/90 backdrop-blur-[10px] rounded-xl shadow-[0_8px_25px_rgba(0,0,0,0.15)] border border-black/10 flex flex-col overflow-hidden transition-[width] duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] select-none',
            !isExpanded && 'max-h-none h-auto w-[200px]',
            !hasData && activeTab === 'Graph' && 'px-4 py-1 pb-2',
        )}>
            <div className={cn(
                'flex justify-between items-center px-4 py-2 border-b border-[#e0e0e0] shrink-0 transition-[border-bottom] duration-300',
                !isExpanded && 'border-b-transparent',
            )}>
                <div className="flex items-center gap-2 grow min-w-0">
                    <button onClick={() => setIsExpanded(!isExpanded)} className={toggleBtnClass} type="button"
                        title={isExpanded ? 'Collapse Panel' : 'Expand Panel'}>
                        {isExpanded ? <LuChevronUp /> : <LuChevronDown />}
                    </button>
                    <div className="flex items-center gap-2 flex-wrap justify-end ml-auto max-w-full">
                        {isExpanded && activeTab === 'Graph' && (
                            <button className={layoutBtnClass}
                                onClick={(e) => { e.stopPropagation(); onApplyLayout?.(); }}
                                disabled={!canApplyLayout}
                                title={t('canvas.detailPanel.applyLayoutTooltip', 'Apply layout')}
                                type="button">
                                {t('canvas.detailPanel.applyLayout', 'Apply Layout')}
                            </button>
                        )}
                        <div className="flex gap-1 bg-[#f1f3f5] p-1 rounded-lg">
                            <button className={cn(tabBtnClass, activeTab === 'Graph' && tabActiveClass)}
                                onClick={(e) => { e.stopPropagation(); setActiveTab('Graph'); }} type="button">
                                {t('canvas.detailPanel.graph', 'Graph')}
                            </button>
                            <button className={cn(tabBtnClass, activeTab === 'Detail' && tabActiveClass)}
                                onClick={(e) => { e.stopPropagation(); setActiveTab('Detail'); }} type="button">
                                {t('canvas.detailPanel.detail', 'Detail')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {isExpanded && contentInner}
        </div>
    );
};

export default DetailPanel;
