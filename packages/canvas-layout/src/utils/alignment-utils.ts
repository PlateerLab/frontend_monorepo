import type { Position } from '@xgen/canvas-types';
import { clampValue } from './math-utils';
import { getLayoutHintMaps } from './sort-utils';

export const applyChainAlignment = (
    group: any,
    positions: Record<string, Position>,
    basePositions: Record<string, Position>,
    laneMetaByNode: Map<string, { laneId: string; colIndex: number; laneKey: string; index: number }>,
    laneNodesById: Map<string, string[]>,
    laneKeyById: Map<string, string>,
    laneBoundsByKey: Map<string, { minY: number; maxY: number }>,
    laneMetricsById: Map<string, { laneKey: string; topY: number; bottomY: number; height: number }>,
    laneShiftById: Map<string, number>
) => {
    const { chainGroups } = getLayoutHintMaps(group);
    if (!chainGroups.length) return;

    chainGroups.forEach((chain: any) => {
        if (!Array.isArray(chain?.nodes) || chain.nodes.length === 0) return;
        const anchorId = chain?.anchor;
        let anchorY = anchorId ? basePositions[anchorId]?.y : undefined;
        if (typeof anchorY !== 'number') {
            const fallbackId = chain.nodes.find((nodeId: string) => basePositions[nodeId]);
            anchorY = fallbackId ? basePositions[fallbackId]?.y : undefined;
        }
        if (typeof anchorY !== 'number') return;

        const boundsByNode = new Map<string, { minY: number; maxY: number; baseY: number; laneId: string }>();
        let allowedMin = Number.NEGATIVE_INFINITY;
        let allowedMax = Number.POSITIVE_INFINITY;

        chain.nodes.forEach((nodeId: string) => {
            const basePosition = basePositions[nodeId];
            if (!basePosition || !positions[nodeId]) return;
            const meta = laneMetaByNode.get(nodeId);
            if (!meta) return;
            const laneId = meta.laneId;
            const laneKey = laneKeyById.get(laneId) || meta.laneKey;
            const laneBounds = laneBoundsByKey.get(laneKey);
            const metrics = laneMetricsById.get(laneId);
            if (!laneBounds || !metrics) return;
            const minDelta = laneBounds.minY - metrics.topY;
            const maxDelta = laneBounds.maxY - metrics.bottomY;
            const minY = basePosition.y + minDelta;
            const maxY = basePosition.y + maxDelta;
            boundsByNode.set(nodeId, { minY, maxY, baseY: basePosition.y, laneId });
            allowedMin = Math.max(allowedMin, minY);
            allowedMax = Math.min(allowedMax, maxY);
        });

        if (!boundsByNode.size) return;

        let targetY = anchorY;
        if (allowedMin <= allowedMax) {
            targetY = clampValue(anchorY, allowedMin, allowedMax);
        }

        boundsByNode.forEach((bounds) => {
            const desiredY = clampValue(targetY, bounds.minY, bounds.maxY);
            const delta = desiredY - bounds.baseY;
            const existingShift = laneShiftById.get(bounds.laneId);
            if (existingShift !== undefined) return;
            laneShiftById.set(bounds.laneId, delta);
            const laneNodes = laneNodesById.get(bounds.laneId) || [];
            laneNodes.forEach(nodeId => {
                const basePosition = basePositions[nodeId];
                if (!basePosition) return;
                positions[nodeId] = { x: basePosition.x, y: basePosition.y + delta };
            });
        });
    });
};

export const resolveRowCollisions = (
    columns: Array<{ lanes: Map<string, string[]> }>,
    positions: Record<string, Position>,
    portIndexByNode: Map<string, number>,
    levelOrderByNode: Map<string, number>,
    rowGap: number
) => {
    const offsetStep = Math.min(12, rowGap / 3);
    if (!(offsetStep > 0)) return;

    columns.forEach(column => {
        if (!column) return;
        column.lanes.forEach(laneNodes => {
            const rows = new Map<number, { baseY: number; nodes: string[] }>();
            laneNodes.forEach(nodeId => {
                const position = positions[nodeId];
                if (!position || !Number.isFinite(position.y)) return;
                const rowKey = Math.round(position.y * 100) / 100;
                const row = rows.get(rowKey);
                if (row) {
                    row.nodes.push(nodeId);
                } else {
                    rows.set(rowKey, { baseY: position.y, nodes: [nodeId] });
                }
            });

            rows.forEach(row => {
                if (row.nodes.length <= 1) return;
                const sorted = [...row.nodes].sort((a, b) => {
                    const portA = portIndexByNode.get(a) ?? Number.POSITIVE_INFINITY;
                    const portB = portIndexByNode.get(b) ?? Number.POSITIVE_INFINITY;
                    if (portA !== portB) return portA < portB ? -1 : 1;
                    return (levelOrderByNode.get(a) ?? 0) - (levelOrderByNode.get(b) ?? 0);
                });
                const startOffset = -((sorted.length - 1) / 2) * offsetStep;
                sorted.forEach((nodeId, index) => {
                    if (positions[nodeId]) {
                        positions[nodeId].y = row.baseY + startOffset + index * offsetStep;
                    }
                });
            });
        });
    });
};
