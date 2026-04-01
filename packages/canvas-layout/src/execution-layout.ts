import type { CanvasNode, CanvasEdge, Position } from '@xgen/canvas-types';
import { HORIZONTAL_SPACING, VERTICAL_SPACING, NODE_APPROX_WIDTH, NODE_APPROX_HEIGHT } from './constants';
import { clampGap } from './utils/math-utils';

export const buildExecutionLayoutPositions = (
    groups: string[][],
    nodes: CanvasNode[],
    edges: CanvasEdge[] = [],
    viewScale: number = 1,
    spacingX: number = HORIZONTAL_SPACING,
    spacingY: number = VERTICAL_SPACING,
    sizeById: Map<string, { width: number; height: number }> = new Map()
): Record<string, Position> => {
    if (!groups.length || !nodes.length) return {};

    const nodesById = new Map(nodes.map(node => [node.id, node]));
    const layoutNodes = nodes.filter(node => !node.data?.bypass);
    if (!layoutNodes.length) return {};

    const heightSamples: number[] = [];
    const widthSamples: number[] = [];
    layoutNodes.forEach(node => {
        const size = sizeById.get(node.id);
        if (size?.height) heightSamples.push(size.height);
        if (size?.width) widthSamples.push(size.width);
    });

    const averageHeight = heightSamples.length
        ? heightSamples.reduce((sum, value) => sum + value, 0) / heightSamples.length
        : NODE_APPROX_HEIGHT;
    const averageWidth = widthSamples.length
        ? widthSamples.reduce((sum, value) => sum + value, 0) / widthSamples.length
        : NODE_APPROX_WIDTH;
    const maxWidth = widthSamples.length ? Math.max(...widthSamples) : NODE_APPROX_WIDTH;
    const rowGap = clampGap(spacingY - averageHeight, 40, 120);
    const xGap = Math.max(spacingX, maxWidth + 60);

    let minX = Infinity;
    let minY = Infinity;
    layoutNodes.forEach(node => {
        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
    });

    if (!isFinite(minX) || !isFinite(minY)) {
        minX = 0;
        minY = 0;
    }

    const isRouter = (nodeData: any): boolean => {
        return nodeData.id === 'router/Router' || nodeData.nodeName === 'Router';
    };

    const edgeSourceMap = new Map<string, string[]>();
    edges.forEach(edge => {
        const sourceId = edge.source?.nodeId;
        const targetId = edge.target?.nodeId;
        if (sourceId && targetId) {
            const list = edgeSourceMap.get(sourceId) || [];
            list.push(targetId);
            edgeSourceMap.set(sourceId, list);
        }
    });

    const branchKeyByNode = new Map<string, string>();
    const processed = new Set<string>();

    groups.forEach(level => {
        level.forEach(nodeId => {
            const node = nodesById.get(nodeId);
            if (!node || processed.has(nodeId)) return;
            processed.add(nodeId);

            if (isRouter(node.data)) {
                const targets = edgeSourceMap.get(nodeId) || [];
                targets.forEach((targetId, portIndex) => {
                    branchKeyByNode.set(targetId, `${nodeId}_branch_${portIndex}`);
                });
            }

            if (!branchKeyByNode.has(nodeId)) {
                const parentKey = (() => {
                    for (const edge of edges) {
                        if (edge.target?.nodeId === nodeId && branchKeyByNode.has(edge.source.nodeId)) {
                            return branchKeyByNode.get(edge.source.nodeId);
                        }
                    }
                    return undefined;
                })();
                if (parentKey) branchKeyByNode.set(nodeId, parentKey);
            }
        });
    });

    const positions: Record<string, Position> = {};
    const buckets = new Map<string, Map<number, string[]>>();

    groups.forEach((level, levelIndex) => {
        level.forEach(nodeId => {
            const node = nodesById.get(nodeId);
            if (!node || node.data?.bypass) return;
            const branchKey = branchKeyByNode.get(nodeId) || '__default__';
            if (!buckets.has(branchKey)) buckets.set(branchKey, new Map());
            const levelMap = buckets.get(branchKey)!;
            const levelNodes = levelMap.get(levelIndex) || [];
            levelNodes.push(nodeId);
            levelMap.set(levelIndex, levelNodes);
        });
    });

    let branchOffsetY = 0;
    buckets.forEach((levelMap) => {
        let maxHeightInBranch = 0;
        const sortedLevels = Array.from(levelMap.entries()).sort((a, b) => a[0] - b[0]);

        sortedLevels.forEach(([levelIndex, levelNodes]) => {
            let nodeOffsetY = 0;
            levelNodes.forEach((nodeId, nodeIndex) => {
                const nodeHeight = sizeById.get(nodeId)?.height ?? averageHeight;
                positions[nodeId] = {
                    x: minX + levelIndex * xGap,
                    y: minY + branchOffsetY + nodeOffsetY
                };
                nodeOffsetY += nodeHeight + rowGap;
            });
            maxHeightInBranch = Math.max(maxHeightInBranch, nodeOffsetY);
        });

        branchOffsetY += maxHeightInBranch + rowGap * 2;
    });

    return positions;
};
