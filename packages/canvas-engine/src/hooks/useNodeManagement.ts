import { useState, useCallback, useRef, useEffect } from 'react';
import type { CanvasNode, Parameter, Port, CanvasEdge } from '@xgen/canvas-types';

interface UseNodeManagementProps {
    historyHelpers?: {
        recordNodeMove: (nodeId: string, fromPosition: { x: number; y: number }, toPosition: { x: number; y: number }) => void;
        recordNodeCreate: (nodeId: string, nodeType: string, position: { x: number; y: number }) => void;
        recordNodeDelete: (nodeId: string, nodeType: string) => void;
        recordMultiAction?: (description: string, actions: any[]) => void;
    };
    edges?: CanvasEdge[];
    onPasteEdges?: (newEdges: CanvasEdge[]) => void;
}

export interface UseNodeManagementReturn {
    nodes: CanvasNode[];
    setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>;
    copiedNodes: CanvasNode[];
    addNode: (node: CanvasNode, skipHistory?: boolean) => void;
    deleteNode: (nodeId: string, connectedEdges: any[], skipHistory?: boolean) => void;
    copyNodes: (nodeIds: string[]) => void;
    pasteNodes: (targetPosition?: { x: number; y: number }) => string[];
    updateNodeParameter: (nodeId: string, paramId: string, value: string | number | boolean, skipHistory?: boolean, label?: string) => void;
    updateNodeName: (nodeId: string, newName: string) => void;
    updateParameterName: (nodeId: string, paramId: string, newName: string) => void;
    addParameter: (nodeId: string, newParameter: Parameter) => void;
    deleteParameter: (nodeId: string, paramId: string) => void;
    addOutput: (nodeId: string, newOutput: Port) => void;
    deleteOutput: (nodeId: string, outputId: string) => void;
    updateOutputName: (nodeId: string, outputId: string, newName: string) => void;
    toggleBypass: (nodeId: string) => void;
}

export const useNodeManagement = ({ historyHelpers, edges = [], onPasteEdges }: UseNodeManagementProps = {}): UseNodeManagementReturn => {
    const [nodes, setNodes] = useState<CanvasNode[]>([]);
    const [copiedNodes, setCopiedNodes] = useState<CanvasNode[]>([]);
    const [copiedEdges, setCopiedEdges] = useState<CanvasEdge[]>([]);

    const nodesRef = useRef<CanvasNode[]>(nodes);
    const edgesRef = useRef<CanvasEdge[]>(edges);

    useEffect(() => {
        nodesRef.current = nodes;
    }, [nodes]);

    useEffect(() => {
        edgesRef.current = edges;
    }, [edges]);

    const addNode = useCallback((node: CanvasNode, skipHistory = false) => {
        setNodes(prev => [...prev, node]);
        if (!skipHistory && historyHelpers?.recordNodeCreate) {
            historyHelpers.recordNodeCreate(node.id, node.data.nodeName, node.position);
        }
    }, [historyHelpers]);

    const deleteNode = useCallback((nodeId: string, connectedEdges: any[], skipHistory = false) => {
        const nodeToDelete = nodes.find(node => node.id === nodeId);
        if (nodeToDelete) {
            setNodes(prev => prev.filter(node => node.id !== nodeId));
            if (!skipHistory && historyHelpers?.recordNodeDelete) {
                historyHelpers.recordNodeDelete(nodeId, nodeToDelete.data.nodeName);
            }
        }
    }, [nodes, historyHelpers]);

    const copyNodes = useCallback((nodeIds: string[]) => {
        const currentNodes = nodesRef.current;
        const currentEdges = edgesRef.current;

        const nodesToCopy = currentNodes.filter(node => nodeIds.includes(node.id));
        if (nodesToCopy.length > 0) {
            setCopiedNodes(nodesToCopy);

            const edgesToCopy = currentEdges.filter(edge =>
                nodeIds.includes(edge.source.nodeId) && nodeIds.includes(edge.target.nodeId)
            );
            setCopiedEdges(edgesToCopy);
        }
    }, []);

    const pasteNodes = useCallback((targetPosition?: { x: number; y: number }): string[] => {
        if (copiedNodes.length > 0) {
            const newNodes: CanvasNode[] = [];
            const newEdges: CanvasEdge[] = [];
            const pastedIds: string[] = [];
            const timestamp = Date.now();
            const idMap = new Map<string, string>();

            let centerX = 0;
            let centerY = 0;
            copiedNodes.forEach(node => {
                centerX += node.position.x;
                centerY += node.position.y;
            });
            centerX /= copiedNodes.length;
            centerY /= copiedNodes.length;

            copiedNodes.forEach((node, index) => {
                const newId = `${node.data.id}-${timestamp}-${index}`;
                idMap.set(node.id, newId);

                let newPosition: { x: number; y: number };
                if (targetPosition) {
                    const offsetX = node.position.x - centerX;
                    const offsetY = node.position.y - centerY;
                    newPosition = {
                        x: targetPosition.x + offsetX,
                        y: targetPosition.y + offsetY
                    };
                } else {
                    newPosition = {
                        x: node.position.x + 50,
                        y: node.position.y + 50
                    };
                }

                const newNode: CanvasNode = {
                    ...node,
                    id: newId,
                    position: newPosition,
                    isExpanded: node.isExpanded !== undefined ? node.isExpanded : true,
                };
                newNodes.push(newNode);
                pastedIds.push(newNode.id);
            });

            copiedEdges.forEach((edge, index) => {
                const newSourceId = idMap.get(edge.source.nodeId);
                const newTargetId = idMap.get(edge.target.nodeId);

                if (newSourceId && newTargetId) {
                    const newEdge: CanvasEdge = {
                        ...edge,
                        id: `edge-${newSourceId}:${edge.source.portId}-${newTargetId}:${edge.target.portId}-${timestamp}-${index}`,
                        source: {
                            ...edge.source,
                            nodeId: newSourceId
                        },
                        target: {
                            ...edge.target,
                            nodeId: newTargetId
                        }
                    };
                    newEdges.push(newEdge);
                }
            });

            setNodes(prev => [...prev, ...newNodes]);

            if (newEdges.length > 0 && onPasteEdges) {
                onPasteEdges(newEdges);
            }

            if (historyHelpers?.recordMultiAction) {
                const actions: any[] = [];

                newNodes.forEach(node => {
                    actions.push({
                        actionType: 'NODE_CREATE',
                        nodeId: node.id,
                        nodeType: node.data.nodeName,
                        position: node.position
                    });
                });

                newEdges.forEach(edge => {
                    actions.push({
                        actionType: 'EDGE_CREATE',
                        edgeId: edge.id,
                        sourceId: edge.source.nodeId,
                        targetId: edge.target.nodeId
                    });
                });

                historyHelpers.recordMultiAction(`Pasted ${newNodes.length} nodes and ${newEdges.length} edges`, actions);
            } else if (historyHelpers?.recordNodeCreate) {
                newNodes.forEach(node => {
                    historyHelpers.recordNodeCreate(node.id, node.data.nodeName, node.position);
                });
            }

            return pastedIds;
        }
        return [];
    }, [copiedNodes, copiedEdges, historyHelpers, onPasteEdges]);

    const updateNodeParameter = useCallback((nodeId: string, paramId: string, value: string | number | boolean, skipHistory?: boolean, label?: string): void => {
        setNodes(prevNodes => {
            const targetNodeIndex = prevNodes.findIndex(node => node.id === nodeId);
            if (targetNodeIndex === -1) return prevNodes;

            const targetNode = prevNodes[targetNodeIndex];
            if (!targetNode.data.parameters) return prevNodes;

            const targetParamIndex = targetNode.data.parameters.findIndex(param => param.id === paramId);
            if (targetParamIndex === -1) return prevNodes;

            const targetParam = targetNode.data.parameters[targetParamIndex];
            const newValue = typeof targetParam.value === 'number' ? Number(value) : value;

            if (targetParam.value === newValue && targetParam.label === label) {
                return prevNodes;
            }

            const newNodes = [...prevNodes];
            newNodes[targetNodeIndex] = {
                ...targetNode,
                data: {
                    ...targetNode.data,
                    parameters: [
                        ...targetNode.data.parameters.slice(0, targetParamIndex),
                        {
                            ...targetParam,
                            value: newValue,
                            ...(label !== undefined && { label })
                        },
                        ...targetNode.data.parameters.slice(targetParamIndex + 1)
                    ]
                }
            };

            return newNodes;
        });
    }, []);

    const updateNodeName = useCallback((nodeId: string, newName: string): void => {
        setNodes(prevNodes => {
            const targetNodeIndex = prevNodes.findIndex(node => node.id === nodeId);
            if (targetNodeIndex === -1) return prevNodes;

            const targetNode = prevNodes[targetNodeIndex];
            if (targetNode.data.nodeName === newName) return prevNodes;

            const newNodes = [
                ...prevNodes.slice(0, targetNodeIndex),
                {
                    ...targetNode,
                    data: {
                        ...targetNode.data,
                        nodeName: newName,
                        nodeNameKo: newName
                    }
                },
                ...prevNodes.slice(targetNodeIndex + 1)
            ];

            return newNodes;
        });
    }, []);

    const updateParameterName = useCallback((nodeId: string, paramId: string, newName: string): void => {
        setNodes(prevNodes => {
            const targetNodeIndex = prevNodes.findIndex(node => node.id === nodeId);
            if (targetNodeIndex === -1) return prevNodes;

            const targetNode = prevNodes[targetNodeIndex];
            if (!targetNode.data.parameters || !Array.isArray(targetNode.data.parameters)) return prevNodes;

            const targetParamIndex = targetNode.data.parameters.findIndex(param => param.id === paramId);
            if (targetParamIndex === -1) return prevNodes;

            const targetParam = targetNode.data.parameters[targetParamIndex];
            if (targetParam.name === newName) return prevNodes;

            const newNodes = [
                ...prevNodes.slice(0, targetNodeIndex),
                {
                    ...targetNode,
                    data: {
                        ...targetNode.data,
                        parameters: [
                            ...targetNode.data.parameters.slice(0, targetParamIndex),
                            { ...targetParam, name: newName, id: newName },
                            ...targetNode.data.parameters.slice(targetParamIndex + 1)
                        ]
                    }
                },
                ...prevNodes.slice(targetNodeIndex + 1)
            ];

            return newNodes;
        });
    }, []);

    const addParameter = useCallback((nodeId: string, newParameter: Parameter): void => {
        setNodes(prevNodes => {
            const targetNodeIndex = prevNodes.findIndex(node => node.id === nodeId);
            if (targetNodeIndex === -1) return prevNodes;

            const targetNode = prevNodes[targetNodeIndex];
            const existingParameters = targetNode.data.parameters || [];

            const newNodes = [
                ...prevNodes.slice(0, targetNodeIndex),
                {
                    ...targetNode,
                    data: {
                        ...targetNode.data,
                        parameters: [...existingParameters, newParameter]
                    }
                },
                ...prevNodes.slice(targetNodeIndex + 1)
            ];

            return newNodes;
        });
    }, []);

    const deleteParameter = useCallback((nodeId: string, paramId: string): void => {
        setNodes(prevNodes => {
            const targetNodeIndex = prevNodes.findIndex(node => node.id === nodeId);
            if (targetNodeIndex === -1) return prevNodes;

            const targetNode = prevNodes[targetNodeIndex];
            if (!targetNode.data.parameters || !Array.isArray(targetNode.data.parameters)) return prevNodes;

            const newNodes = [
                ...prevNodes.slice(0, targetNodeIndex),
                {
                    ...targetNode,
                    data: {
                        ...targetNode.data,
                        parameters: targetNode.data.parameters.filter(param => param.id !== paramId)
                    }
                },
                ...prevNodes.slice(targetNodeIndex + 1)
            ];

            return newNodes;
        });
    }, []);

    const addOutput = useCallback((nodeId: string, newOutput: Port): void => {
        setNodes(prevNodes => {
            const targetNodeIndex = prevNodes.findIndex(node => node.id === nodeId);
            if (targetNodeIndex === -1) return prevNodes;

            const targetNode = prevNodes[targetNodeIndex];
            const existingOutputs = targetNode.data.outputs || [];

            const newNodes = [
                ...prevNodes.slice(0, targetNodeIndex),
                {
                    ...targetNode,
                    data: {
                        ...targetNode.data,
                        outputs: [...existingOutputs, newOutput]
                    }
                },
                ...prevNodes.slice(targetNodeIndex + 1)
            ];

            return newNodes;
        });
    }, []);

    const deleteOutput = useCallback((nodeId: string, outputId: string): void => {
        setNodes(prevNodes => {
            const targetNodeIndex = prevNodes.findIndex(node => node.id === nodeId);
            if (targetNodeIndex === -1) return prevNodes;

            const targetNode = prevNodes[targetNodeIndex];
            if (!targetNode.data.outputs || !Array.isArray(targetNode.data.outputs)) return prevNodes;

            const newNodes = [
                ...prevNodes.slice(0, targetNodeIndex),
                {
                    ...targetNode,
                    data: {
                        ...targetNode.data,
                        outputs: targetNode.data.outputs.filter(output => output.id !== outputId)
                    }
                },
                ...prevNodes.slice(targetNodeIndex + 1)
            ];

            return newNodes;
        });
    }, []);

    const updateOutputName = useCallback((nodeId: string, outputId: string, newName: string): void => {
        setNodes(prevNodes => {
            const targetNodeIndex = prevNodes.findIndex(node => node.id === nodeId);
            if (targetNodeIndex === -1) return prevNodes;

            const targetNode = prevNodes[targetNodeIndex];
            if (!targetNode.data.outputs || !Array.isArray(targetNode.data.outputs)) return prevNodes;

            const targetOutputIndex = targetNode.data.outputs.findIndex(output => output.id === outputId);
            if (targetOutputIndex === -1) return prevNodes;

            const targetOutput = targetNode.data.outputs[targetOutputIndex];
            if (targetOutput.name === newName) return prevNodes;

            const newNodes = [
                ...prevNodes.slice(0, targetNodeIndex),
                {
                    ...targetNode,
                    data: {
                        ...targetNode.data,
                        outputs: [
                            ...targetNode.data.outputs.slice(0, targetOutputIndex),
                            { ...targetOutput, name: newName, id: newName },
                            ...targetNode.data.outputs.slice(targetOutputIndex + 1)
                        ]
                    }
                },
                ...prevNodes.slice(targetNodeIndex + 1)
            ];

            return newNodes;
        });
    }, []);

    const toggleBypass = useCallback((nodeId: string): void => {
        setNodes(prevNodes => {
            const targetNodeIndex = prevNodes.findIndex(node => node.id === nodeId);
            if (targetNodeIndex === -1) return prevNodes;

            const targetNode = prevNodes[targetNodeIndex];
            const currentBypassed = targetNode.data.bypass || false;

            const newNodes = [
                ...prevNodes.slice(0, targetNodeIndex),
                {
                    ...targetNode,
                    data: {
                        ...targetNode.data,
                        bypass: !currentBypassed
                    }
                },
                ...prevNodes.slice(targetNodeIndex + 1)
            ];

            return newNodes;
        });
    }, []);

    return {
        nodes,
        setNodes,
        copiedNodes,
        addNode,
        deleteNode,
        copyNodes,
        pasteNodes,
        updateNodeParameter,
        updateNodeName,
        updateParameterName,
        addParameter,
        deleteParameter,
        addOutput,
        deleteOutput,
        updateOutputName,
        toggleBypass
    };
};
