import type { Position } from '@xgen/canvas-types';

export const buildLaneMeta = (columns: Array<{ lanes: Map<string, string[]> }>) => {
    const laneMetaByNode = new Map<string, { laneId: string; colIndex: number; laneKey: string; index: number }>();
    const laneNodesById = new Map<string, string[]>();
    const laneKeyById = new Map<string, string>();

    columns.forEach((column, colIndex) => {
        if (!column) return;
        column.lanes.forEach((laneNodes, laneKey) => {
            const laneId = `${colIndex}|${laneKey}`;
            laneNodesById.set(laneId, laneNodes);
            laneKeyById.set(laneId, laneKey);
            laneNodes.forEach((nodeId, index) => {
                laneMetaByNode.set(nodeId, { laneId, colIndex, laneKey, index });
            });
        });
    });

    return { laneMetaByNode, laneNodesById, laneKeyById };
};

export const getLaneBoundsByKey = (
    laneMetaByNode: Map<string, { laneId: string; colIndex: number; laneKey: string; index: number }>,
    positions: Record<string, Position>,
    getNodeHeight: (nodeId: string) => number
) => {
    const laneBounds = new Map<string, { minY: number; maxY: number }>();
    laneMetaByNode.forEach((meta, nodeId) => {
        const position = positions[nodeId];
        if (!position) return;
        const height = getNodeHeight(nodeId);
        const bounds = laneBounds.get(meta.laneKey) || { minY: Number.POSITIVE_INFINITY, maxY: Number.NEGATIVE_INFINITY };
        bounds.minY = Math.min(bounds.minY, position.y);
        bounds.maxY = Math.max(bounds.maxY, position.y + height);
        laneBounds.set(meta.laneKey, bounds);
    });
    return laneBounds;
};

export const getLaneMetricsById = (
    laneNodesById: Map<string, string[]>,
    laneKeyById: Map<string, string>,
    positions: Record<string, Position>,
    getNodeHeight: (nodeId: string) => number
) => {
    const laneMetrics = new Map<string, { laneKey: string; topY: number; bottomY: number; height: number }>();
    laneNodesById.forEach((laneNodes, laneId) => {
        if (!laneNodes.length) return;
        const firstId = laneNodes[0];
        const lastId = laneNodes[laneNodes.length - 1];
        const firstPos = positions[firstId];
        const lastPos = positions[lastId];
        if (!firstPos || !lastPos) return;
        const bottomY = lastPos.y + getNodeHeight(lastId);
        const topY = firstPos.y;
        if (!Number.isFinite(topY) || !Number.isFinite(bottomY)) return;
        const laneKey = laneKeyById.get(laneId) || '';
        laneMetrics.set(laneId, { laneKey, topY, bottomY, height: bottomY - topY });
    });
    return laneMetrics;
};
