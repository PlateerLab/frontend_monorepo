import type { CanvasNode, CanvasEdge, Position } from '@xgen/canvas-types';
import { HORIZONTAL_SPACING, VERTICAL_SPACING, NODE_APPROX_WIDTH, NODE_APPROX_HEIGHT } from './constants';
import { clampGap } from './utils/math-utils';
import { normalizeLevels, getBranchLevels, resolveBranchPortOrder } from './utils/branch-utils';
import { sortLevelNodesByPort } from './utils/sort-utils';
import { buildLaneMeta, getLaneBoundsByKey, getLaneMetricsById } from './utils/lane-utils';
import { applyChainAlignment, resolveRowCollisions } from './utils/alignment-utils';
import { buildExecutionLayoutPositions } from './execution-layout';

export const buildAgentflowLayoutPositions = (
    layoutData: any,
    nodes: CanvasNode[],
    edges: CanvasEdge[] = [],
    viewScale: number = 1,
    spacingX: number = HORIZONTAL_SPACING,
    spacingY: number = VERTICAL_SPACING,
    sizeById: Map<string, { width: number; height: number }> = new Map()
): Record<string, Position> => {
    if (!layoutData || !nodes.length) return {};

    const routerGroups = layoutData.router_groups && typeof layoutData.router_groups === 'object'
        ? layoutData.router_groups
        : null;

    if (!routerGroups || Object.keys(routerGroups).length === 0) {
        const fallbackGroups = Array.isArray(layoutData.parallel_execution_order)
            ? layoutData.parallel_execution_order
            : Array.isArray(layoutData.execution_order)
                ? layoutData.execution_order.map((id: string) => [id])
                : [];
        if (fallbackGroups.length) {
            return buildExecutionLayoutPositions(fallbackGroups, nodes, edges, viewScale, spacingX, spacingY, sizeById);
        }

        const entryLevels = normalizeLevels(layoutData.entry_group);
        if (entryLevels.length) {
            return buildExecutionLayoutPositions(entryLevels, nodes, edges, viewScale, spacingX, spacingY, sizeById);
        }

        return {};
    }

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
    const maxWidth = widthSamples.length ? Math.max(...widthSamples) : NODE_APPROX_WIDTH;
    const rowGap = clampGap(spacingY - averageHeight, 40, 120);
    const xGap = Math.max(spacingX, maxWidth + 60);
    const branchGap = Math.max(80, rowGap * 1.5);
    const sectionGap = Math.max(120, rowGap * 2);

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

    const columns: Array<{ lanes: Map<string, string[]> }> = [];
    const placed = new Set<string>();
    const nodeColumnIndex = new Map<string, number>();
    let maxColIndex = -1;
    const portIndexByNode = new Map<string, number>();
    const levelOrderByNode = new Map<string, number>();

    const ensureColumn = (index: number) => {
        if (!columns[index]) {
            columns[index] = { lanes: new Map() };
        }
    };

    const ensureNodeOrdering = (nodeId: string) => {
        if (!portIndexByNode.has(nodeId)) {
            portIndexByNode.set(nodeId, Number.POSITIVE_INFINITY);
        }
        if (!levelOrderByNode.has(nodeId)) {
            levelOrderByNode.set(nodeId, 0);
        }
    };

    const addNodeToColumn = (colIndex: number, laneKey: string, nodeId: string) => {
        if (placed.has(nodeId)) return;
        const node = nodesById.get(nodeId);
        if (!node || node.data?.bypass) return;
        ensureNodeOrdering(nodeId);
        ensureColumn(colIndex);
        const laneNodes = columns[colIndex].lanes.get(laneKey) || [];
        laneNodes.push(nodeId);
        columns[colIndex].lanes.set(laneKey, laneNodes);
        placed.add(nodeId);
        nodeColumnIndex.set(nodeId, colIndex);
    };

    const trackColumn = (colIndex: number) => {
        maxColIndex = Math.max(maxColIndex, colIndex);
    };

    // 1) entry_group
    let columnCursor = 0;
    const entryLevels = normalizeLevels(layoutData.entry_group);
    const entryColumns: number[] = [];
    entryLevels.forEach((level, levelIndex) => {
        const colIndex = columnCursor + levelIndex;
        trackColumn(colIndex);
        entryColumns.push(colIndex);
        const sortedLevel = sortLevelNodesByPort(level, layoutData.entry_group, portIndexByNode, levelOrderByNode);
        sortedLevel.forEach(nodeId => addNodeToColumn(colIndex, 'base', nodeId));
    });
    columnCursor += entryLevels.length;

    // 2) router chain order
    const routerGroupKeys = Object.keys(routerGroups);
    let routerChain: string[] = Array.isArray(layoutData.router_chain_order)
        ? [...layoutData.router_chain_order]
        : [];
    if (!routerChain.length) {
        const getRouterNodeId = (routerId: string) => {
            const group = routerGroups[routerId];
            return group?.router_id || group?.router_node || routerId;
        };
        routerChain = [...routerGroupKeys].sort((a, b) => {
            const nodeA = nodesById.get(getRouterNodeId(a));
            const nodeB = nodesById.get(getRouterNodeId(b));
            if (nodeA && nodeB) {
                if (nodeA.position.y !== nodeB.position.y) return nodeA.position.y - nodeB.position.y;
                if (nodeA.position.x !== nodeB.position.x) return nodeA.position.x - nodeB.position.x;
            }
            return a.localeCompare(b);
        });
    } else {
        routerChain = routerChain.filter(routerId => routerGroups[routerId]);
    }

    const routerGapColumns = Number.isFinite(layoutData.router_gap) ? layoutData.router_gap : 1;
    const routerSegments: Array<{ columns: number[]; laneOrder: string[] }> = [];
    const branchPortOrderMap = layoutData.branch_port_order;

    // 3) router groups
    routerChain.forEach(routerId => {
        const routerGroup = routerGroups[routerId];
        if (!routerGroup) return;

        const routerCol = columnCursor;
        const segmentColumns: number[] = [];
        trackColumn(routerCol);
        segmentColumns.push(routerCol);

        const sharedInputsLevels = normalizeLevels(routerGroup.shared_inputs);
        sharedInputsLevels.forEach(level => {
            const sortedLevel = sortLevelNodesByPort(level, routerGroup.shared_inputs, portIndexByNode, levelOrderByNode);
            sortedLevel.forEach(nodeId => addNodeToColumn(routerCol, 'base', nodeId));
        });

        const routerNodeId = routerGroup.router_id || routerGroup.router_node || routerId;
        addNodeToColumn(routerCol, 'base', routerNodeId);

        const branchOrder = resolveBranchPortOrder(routerGroup, routerId, nodesById, branchPortOrderMap);
        const branchLevelsByPort = new Map<string, string[][]>();
        branchOrder.forEach(port => {
            const branch = routerGroup.branches?.[port];
            branchLevelsByPort.set(port, getBranchLevels(branch));
        });

        let maxBranchDepth = 0;
        branchLevelsByPort.forEach(levels => {
            maxBranchDepth = Math.max(maxBranchDepth, levels.length);
        });

        for (let levelIndex = 0; levelIndex < maxBranchDepth; levelIndex += 1) {
            const colIndex = routerCol + 1 + levelIndex;
            trackColumn(colIndex);
            segmentColumns.push(colIndex);
            branchOrder.forEach(port => {
                const levels = branchLevelsByPort.get(port) || [];
                const levelNodes = levels[levelIndex] || [];
                const sortedLevel = sortLevelNodesByPort(levelNodes, routerGroup.branches?.[port], portIndexByNode, levelOrderByNode);
                sortedLevel.forEach(nodeId => addNodeToColumn(colIndex, `branch:${port}`, nodeId));
            });
        }

        const sharedLevels = normalizeLevels(routerGroup.shared);
        sharedLevels.forEach((level, levelIndex) => {
            const colIndex = routerCol + 1 + maxBranchDepth + levelIndex;
            trackColumn(colIndex);
            segmentColumns.push(colIndex);
            const sortedLevel = sortLevelNodesByPort(level, routerGroup.shared, portIndexByNode, levelOrderByNode);
            sortedLevel.forEach(nodeId => addNodeToColumn(colIndex, 'base', nodeId));
        });

        const laneOrder = ['base', ...branchOrder.map(port => `branch:${port}`)];
        routerSegments.push({ columns: segmentColumns, laneOrder });

        columnCursor = routerCol + 1 + maxBranchDepth + sharedLevels.length + routerGapColumns;
    });

    maxColIndex = Math.max(maxColIndex, columnCursor - 1);

    // 4) orphan_group
    const orphanLevels = normalizeLevels(layoutData.orphan_group);
    const orphanInputs = Array.isArray(layoutData.orphan_inputs) ? layoutData.orphan_inputs : [];
    let orphanStartCol = columnCursor;
    const alignedCols = orphanInputs
        .map((nodeId: string) => nodeColumnIndex.get(nodeId))
        .filter((value: number | undefined): value is number => typeof value === 'number');
    if (alignedCols.length) {
        orphanStartCol = Math.min(...alignedCols);
    }

    const orphanColumns: number[] = [];
    orphanLevels.forEach((level, levelIndex) => {
        const colIndex = orphanStartCol + levelIndex;
        trackColumn(colIndex);
        orphanColumns.push(colIndex);
        const sortedLevel = sortLevelNodesByPort(level, layoutData.orphan_group, portIndexByNode, levelOrderByNode);
        sortedLevel.forEach(nodeId => addNodeToColumn(colIndex, 'orphan', nodeId));
    });

    // 5) unreachable_group
    const unreachableLevels = normalizeLevels(layoutData.unreachable_group);
    const unreachableStartCol = Math.max(columnCursor, maxColIndex + 1);
    const unreachableColumns: number[] = [];
    unreachableLevels.forEach((level, levelIndex) => {
        const colIndex = unreachableStartCol + levelIndex;
        trackColumn(colIndex);
        unreachableColumns.push(colIndex);
        const sortedLevel = sortLevelNodesByPort(level, layoutData.unreachable_group, portIndexByNode, levelOrderByNode);
        sortedLevel.forEach(nodeId => addNodeToColumn(colIndex, 'unreachable', nodeId));
    });

    const positions: Record<string, Position> = {};
    const getNodeHeight = (nodeId: string) => sizeById.get(nodeId)?.height ?? averageHeight ?? NODE_APPROX_HEIGHT;

    const getLaneColumnHeight = (laneNodes: string[]) => {
        let height = 0;
        laneNodes.forEach((nodeId, index) => {
            if (index > 0) height += rowGap;
            height += getNodeHeight(nodeId);
        });
        return height;
    };

    const layoutSegment = (segmentColumns: number[], laneOrder: string[], baseYOffset: number) => {
        if (!segmentColumns.length || !laneOrder.length) return 0;

        const activeLaneOrder = laneOrder.filter(laneKey =>
            segmentColumns.some(colIndex => (columns[colIndex]?.lanes.get(laneKey) || []).length > 0)
        );
        if (!activeLaneOrder.length) return 0;

        const laneHeights = new Map<string, number>();
        activeLaneOrder.forEach(laneKey => {
            let maxHeight = 0;
            segmentColumns.forEach(colIndex => {
                const laneNodes = columns[colIndex]?.lanes.get(laneKey) || [];
                maxHeight = Math.max(maxHeight, getLaneColumnHeight(laneNodes));
            });
            laneHeights.set(laneKey, maxHeight);
        });

        let offset = 0;
        const laneStartY = new Map<string, number>();
        activeLaneOrder.forEach((laneKey, index) => {
            laneStartY.set(laneKey, minY + baseYOffset + offset);
            offset += laneHeights.get(laneKey) || 0;
            if (index < activeLaneOrder.length - 1) {
                offset += branchGap;
            }
        });

        segmentColumns.forEach(colIndex => {
            const column = columns[colIndex];
            if (!column) return;
            const x = minX + colIndex * xGap;
            activeLaneOrder.forEach(laneKey => {
                const laneNodes = column.lanes.get(laneKey) || [];
                let y = laneStartY.get(laneKey) ?? minY + baseYOffset;
                laneNodes.forEach(nodeId => {
                    positions[nodeId] = { x, y };
                    y += getNodeHeight(nodeId) + rowGap;
                });
            });
        });

        return offset;
    };

    // 6) compute positions
    let mainHeight = 0;
    if (entryColumns.length) {
        mainHeight = Math.max(mainHeight, layoutSegment(entryColumns, ['base'], 0));
    }
    routerSegments.forEach(segment => {
        mainHeight = Math.max(mainHeight, layoutSegment(segment.columns, segment.laneOrder, 0));
    });

    let currentYOffset = mainHeight;
    if (orphanColumns.length) {
        const orphanHeight = layoutSegment(orphanColumns, ['orphan'], currentYOffset + sectionGap);
        currentYOffset += sectionGap + orphanHeight;
    }
    if (unreachableColumns.length) {
        const unreachableHeight = layoutSegment(unreachableColumns, ['unreachable'], currentYOffset + sectionGap);
        currentYOffset += sectionGap + unreachableHeight;
    }

    const remainingNodes = nodes.filter(node => !node.data?.bypass && !positions[node.id]);
    if (remainingNodes.length) {
        const fallbackCol = maxColIndex + 1;
        const fallbackX = minX + fallbackCol * xGap;
        let fallbackY = minY + currentYOffset + sectionGap;
        remainingNodes.forEach(node => {
            positions[node.id] = { x: fallbackX, y: fallbackY };
            fallbackY += getNodeHeight(node.id) + rowGap;
        });
    }

    const basePositions: Record<string, Position> = {};
    Object.entries(positions).forEach(([nodeId, position]) => {
        basePositions[nodeId] = { x: position.x, y: position.y };
    });

    // 7) chain alignment
    const { laneMetaByNode, laneNodesById, laneKeyById } = buildLaneMeta(columns);
    const laneBoundsByKey = getLaneBoundsByKey(laneMetaByNode, basePositions, getNodeHeight);
    const laneMetricsById = getLaneMetricsById(laneNodesById, laneKeyById, basePositions, getNodeHeight);
    const laneShiftById = new Map<string, number>();
    const alignChains = (group: any) => applyChainAlignment(
        group,
        positions,
        basePositions,
        laneMetaByNode,
        laneNodesById,
        laneKeyById,
        laneBoundsByKey,
        laneMetricsById,
        laneShiftById
    );

    alignChains(layoutData.entry_group);
    Object.values(routerGroups).forEach((routerGroup: any) => {
        if (!routerGroup) return;
        alignChains(routerGroup.shared_inputs);
        alignChains(routerGroup.shared);
        if (routerGroup.branches && typeof routerGroup.branches === 'object') {
            Object.values(routerGroup.branches).forEach(branch => alignChains(branch));
        }
    });
    alignChains(layoutData.orphan_group);
    alignChains(layoutData.unreachable_group);

    // 8) resolve row collisions
    resolveRowCollisions(columns, positions, portIndexByNode, levelOrderByNode, rowGap);

    return positions;
};
