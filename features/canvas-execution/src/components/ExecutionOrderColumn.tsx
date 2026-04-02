import React, { useMemo, useCallback } from 'react';
import { useTranslation } from '@xgen/i18n';
import { LuCheck, LuX, LuPlay } from '@xgen/icons';
import { cn } from '@xgen/ui';
import { useBottomPanel } from '../context/BottomPanelContext';
import type { ExecutionGroup, ExecutionNodeState } from '../types';

// ── Status Icon ────────────────────────────────────────────────

const statusColorMap: Record<string, string> = {
    running: 'text-primary animate-[exec-pulse_1s_infinite]',
    completed: 'text-green-600',
    failed: 'text-red-600',
    bypassed: 'text-[#7a7f89]',
};

const StatusIcon: React.FC<{ status?: ExecutionNodeState['status'] }> = ({ status }) => {
    if (!status || status === 'pending') return null;

    const iconMap: Record<string, React.ReactNode> = {
        running: <LuPlay />,
        completed: <LuCheck />,
        failed: <LuX />,
    };

    return (
        <span className={cn('inline-flex items-center ml-1 [&_svg]:w-3 [&_svg]:h-3', statusColorMap[status])}>
            {iconMap[status] || null}
        </span>
    );
};

// ── Order Item ─────────────────────────────────────────────────

interface OrderItemProps {
    index: number;
    group: ExecutionGroup;
    nodeStates: Map<string, ExecutionNodeState>;
    getNodeName: (nodeId: string) => string;
}

const OrderItem: React.FC<OrderItemProps> = ({ index, group, nodeStates, getNodeName }) => {
    const isGroup = group.length > 1;

    return (
        <div className={cn('flex items-center gap-4 mb-2.5 last:mb-0', isGroup && 'items-start')}>
            <span className="text-xs font-bold leading-4 text-[#40444d] shrink-0 w-[18px] text-center">{index + 1}</span>
            {!isGroup ? (
                <>
                    <span className="text-xs font-normal leading-4 text-[#40444d] min-w-0 flex-1">{getNodeName(group[0])}</span>
                    <StatusIcon status={nodeStates.get(group[0])?.status} />
                </>
            ) : (
                <div className="flex flex-col gap-1 min-w-0 flex-1 border-l border-black/[0.08] pl-2.5">
                    {group.map((nodeId, subIndex) => (
                        <div key={nodeId} className="flex items-center min-w-0 [&+&]:pt-1">
                            <span className="text-xs font-normal text-[#40444d] mr-1.5 shrink-0">{subIndex + 1}.</span>
                            <span className="text-xs font-normal leading-4 text-[#40444d] min-w-0">{getNodeName(nodeId)}</span>
                            <StatusIcon status={nodeStates.get(nodeId)?.status} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Execution Order Column ─────────────────────────────────────

const ExecutionOrderColumn: React.FC = () => {
    const { t } = useTranslation();
    const { executionOrder, isLoadingOrder, nodeStates } = useBottomPanel();

    const getExecutionGroups = useMemo((): ExecutionGroup[] => {
        if (!executionOrder) return [];
        if (Array.isArray(executionOrder.parallel_execution_order)) return executionOrder.parallel_execution_order;
        if (Array.isArray(executionOrder.execution_order)) return executionOrder.execution_order.map((id: string) => [id]);
        return [];
    }, [executionOrder]);

    const filteredOrder = useMemo(() => {
        return getExecutionGroups.filter((g) => g.length > 0);
    }, [getExecutionGroups]);

    const getNodeName = useCallback((nodeId: string): string => {
        return executionOrder?.nodes?.[nodeId]?.data?.nodeName ?? nodeId;
    }, [executionOrder]);

    const hasData = filteredOrder.length > 0;

    return (
        <div className="flex-[0_0_252px] min-w-[180px] bg-[#f7f8fa] border-r border-black/[0.08] overflow-auto flex flex-col">
            <div className="py-2 px-4 border-b border-black/[0.08] shrink-0">
                <span className="text-xs font-bold leading-4 text-[#1d1f23]">
                    {t('canvas.bottomPanel.order.title')}
                </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                {isLoadingOrder && !executionOrder && (
                    <div className="text-xs text-[#7a7f89]">
                        {t('canvas.bottomPanel.order.loading')}
                    </div>
                )}
                {filteredOrder.map((group, index) => (
                    <OrderItem
                        key={group.join('-')}
                        index={index}
                        group={group}
                        nodeStates={nodeStates}
                        getNodeName={getNodeName}
                    />
                ))}
                {!isLoadingOrder && !hasData && (
                    <div className="text-xs text-[#7a7f89]">
                        {t('canvas.bottomPanel.order.empty')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExecutionOrderColumn;
