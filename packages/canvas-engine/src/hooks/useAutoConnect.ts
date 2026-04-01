import { useCallback } from 'react';
import type { CanvasNode, CanvasEdge, Position, Port, NodeData } from '@xgen/canvas-types';
import { calculateDistance, NODE_APPROX_WIDTH } from '../utils/canvas-utils';

interface UseAutoConnectProps {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
    selectedNodeIds: Set<string>;
    addEdge: (edge: CanvasEdge) => void;
    isDuplicateEdge: (sourceNodeId: string, sourcePortId: string, targetNodeId: string, targetPortId: string) => boolean;
    areTypesCompatible: (sourceType?: string, targetType?: string) => boolean;
}

interface UseAutoConnectReturn {
    findAutoConnection: (nodeId: string) => void;
}

// Check if a port is active based on its dependency parameter value
const isPortActive = (port: Port, nodeData: NodeData): boolean => {
    if (!port.dependency) return true;
    const param = nodeData.parameters?.find(p => p.id === port.dependency);
    if (!param) return true;
    return param.value === port.dependencyValue;
};

export const useAutoConnect = ({
    nodes,
    edges,
    selectedNodeIds,
    addEdge,
    isDuplicateEdge,
    areTypesCompatible
}: UseAutoConnectProps): UseAutoConnectReturn => {

    const findAutoConnection = useCallback((nodeId: string): void => {
        const targetNode = nodes.find(n => n.id === nodeId);
        if (!targetNode) return;

        const maxDistance = NODE_APPROX_WIDTH * 3;

        // Track already-connected input ports (non-multi ports can only have one connection)
        const connectedInputs = new Set<string>();
        for (const edge of edges) {
            connectedInputs.add(`${edge.target.nodeId}:${edge.target.portId}`);
        }

        const isInputAvailable = (nId: string, port: Port): boolean => {
            if (port.isMulti || port.multi) return true;
            return !connectedInputs.has(`${nId}:${port.id}`);
        };

        // Find nearby nodes sorted by distance, with selected nodes prioritized
        const nearbyNodes = nodes
            .filter(n => n.id !== nodeId)
            .map(n => ({
                node: n,
                distance: calculateDistance(targetNode.position, n.position)
            }))
            .sort((a, b) => {
                const aSelected = selectedNodeIds.has(a.node.id) ? 0 : 1;
                const bSelected = selectedNodeIds.has(b.node.id) ? 0 : 1;
                if (aSelected !== bSelected) return aSelected - bSelected;
                return a.distance - b.distance;
            });

        for (const { node: nearNode, distance } of nearbyNodes) {
            // Skip nodes beyond max distance (except selected ones which are sorted first)
            if (distance > maxDistance) {
                if (selectedNodeIds.has(nearNode.id)) continue;
                break;
            }

            // Try: nearNode output -> targetNode input
            if (nearNode.data.outputs && targetNode.data.inputs) {
                for (const output of nearNode.data.outputs) {
                    if (!isPortActive(output, nearNode.data)) continue;
                    for (const input of targetNode.data.inputs) {
                        if (!isPortActive(input, targetNode.data)) continue;
                        if (!isInputAvailable(targetNode.id, input)) continue;
                        if (!areTypesCompatible(output.type, input.type)) continue;
                        if (isDuplicateEdge(nearNode.id, output.id, targetNode.id, input.id)) continue;

                        const newEdge: CanvasEdge = {
                            id: `edge-${nearNode.id}:${output.id}-${targetNode.id}:${input.id}-${Date.now()}`,
                            source: { nodeId: nearNode.id, portId: output.id, portType: 'output' },
                            target: { nodeId: targetNode.id, portId: input.id, portType: 'input' }
                        };
                        addEdge(newEdge);
                        return;
                    }
                }
            }

            // Try: targetNode output -> nearNode input
            if (targetNode.data.outputs && nearNode.data.inputs) {
                for (const output of targetNode.data.outputs) {
                    if (!isPortActive(output, targetNode.data)) continue;
                    for (const input of nearNode.data.inputs) {
                        if (!isPortActive(input, nearNode.data)) continue;
                        if (!isInputAvailable(nearNode.id, input)) continue;
                        if (!areTypesCompatible(output.type, input.type)) continue;
                        if (isDuplicateEdge(targetNode.id, output.id, nearNode.id, input.id)) continue;

                        const newEdge: CanvasEdge = {
                            id: `edge-${targetNode.id}:${output.id}-${nearNode.id}:${input.id}-${Date.now()}`,
                            source: { nodeId: targetNode.id, portId: output.id, portType: 'output' },
                            target: { nodeId: nearNode.id, portId: input.id, portType: 'input' }
                        };
                        addEdge(newEdge);
                        return;
                    }
                }
            }
        }
    }, [nodes, edges, selectedNodeIds, addEdge, isDuplicateEdge, areTypesCompatible]);

    return {
        findAutoConnection
    };
};
