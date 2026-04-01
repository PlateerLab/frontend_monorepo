import { useCallback } from 'react';
import type {
    CanvasEdge,
    CanvasNode,
    NodeData,
    Position,
    EdgePreview
} from '@xgen/canvas-types';
import {
    generatePortKey,
    findPortData,
    isClick,
    areTypesCompatible
} from '../utils/canvas-utils';

export interface PortMouseEventData {
    nodeId: string;
    portId: string;
    portType: 'input' | 'output';
    isMulti?: boolean;
    type: string;
}

interface UsePortHandlersProps {
    edges: CanvasEdge[];
    nodes: CanvasNode[];
    portPositions: Record<string, Position>;
    isDraggingOutput: boolean;
    isDraggingInput: boolean;
    portClickStart: { data: PortMouseEventData; timestamp: number; position: { x: number; y: number } } | null;

    edgePreviewRef: React.MutableRefObject<EdgePreview | null>;

    setPortClickStart: React.Dispatch<React.SetStateAction<any>>;
    setEdgePreview: React.Dispatch<React.SetStateAction<EdgePreview | null>>;
    setSnappedPortKey: React.Dispatch<React.SetStateAction<string | null>>;
    setIsSnapTargetValid: React.Dispatch<React.SetStateAction<boolean>>;
    setIsDraggingOutput: (value: boolean) => void;
    setIsDraggingInput: (value: boolean) => void;
    setCurrentOutputType: (value: string | null) => void;
    setCurrentInputType: (value: string | null) => void;
    setSourcePortForConnection: (value: any) => void;
    setCompatibleNodes: React.Dispatch<React.SetStateAction<NodeData[]>>;
    setEdges: React.Dispatch<React.SetStateAction<CanvasEdge[]>>;

    startEdgeDrag: () => void;
    removeEdge: (edgeId: string) => void;
    addNode: (node: CanvasNode) => void;
    addEdge: (edge: CanvasEdge) => void;
    clearCompatibleNodes: () => void;
    isDuplicateEdge: (sourceNodeId: string, sourcePortId: string, targetNodeId: string, targetPortId: string) => boolean;
    findCompatibleInputNodes: (outputType: string) => NodeData[];
    findCompatibleOutputNodes: (inputType: string) => NodeData[];
}

interface UsePortHandlersReturn {
    handlePortMouseDown: (data: PortMouseEventData, mouseEvent?: React.MouseEvent) => void;
    handlePortMouseUp: (data: PortMouseEventData, mouseEvent?: React.MouseEvent) => void;
}

export const usePortHandlers = ({
    edges,
    nodes,
    portPositions,
    isDraggingOutput,
    isDraggingInput,
    portClickStart,
    edgePreviewRef,
    setPortClickStart,
    setEdgePreview,
    setSnappedPortKey,
    setIsSnapTargetValid,
    setIsDraggingOutput,
    setIsDraggingInput,
    setCurrentOutputType,
    setCurrentInputType,
    setSourcePortForConnection,
    setCompatibleNodes,
    setEdges,
    startEdgeDrag,
    removeEdge,
    addNode,
    addEdge,
    clearCompatibleNodes,
    isDuplicateEdge,
    findCompatibleInputNodes,
    findCompatibleOutputNodes,
}: UsePortHandlersProps): UsePortHandlersReturn => {

    const handlePortMouseDown = useCallback((data: PortMouseEventData, mouseEvent?: React.MouseEvent): void => {
        const { nodeId, portId, portType, isMulti, type } = data;

        if (mouseEvent) {
            setPortClickStart({
                data,
                timestamp: Date.now(),
                position: { x: mouseEvent.clientX, y: mouseEvent.clientY }
            });
        }

        if (portType === 'input') {
            let existingEdge: CanvasEdge | undefined;
            if (!isMulti) {
                existingEdge = edges.find(e => e.target.nodeId === nodeId && e.target.portId === portId);
            } else {
                existingEdge = edges.findLast(e => e.target.nodeId === nodeId && e.target.portId === portId);
            }

            if (existingEdge) {
                startEdgeDrag();
                const sourcePosKey = generatePortKey(existingEdge.source.nodeId, existingEdge.source.portId, existingEdge.source.portType as 'input' | 'output');
                const sourcePos = portPositions[sourcePosKey];
                const targetPosKey = generatePortKey(existingEdge.target.nodeId, existingEdge.target.portId, existingEdge.target.portType as 'input' | 'output');
                const targetPos = portPositions[targetPosKey];

                const sourcePortData = findPortData(nodes, existingEdge.source.nodeId, existingEdge.source.portId, existingEdge.source.portType);

                if (sourcePos && sourcePortData) {
                    setEdgePreview({
                        source: { ...existingEdge.source, type: sourcePortData.type },
                        startPos: sourcePos,
                        targetPos: targetPos
                    });
                }

                removeEdge(existingEdge.id);
                return;
            } else {
                startEdgeDrag();
                setIsDraggingInput(true);
                setCurrentInputType(type);
                setSourcePortForConnection({ nodeId, portId, portType, type });

                const startPosKey = generatePortKey(nodeId, portId, portType as 'input' | 'output');
                const startPos = portPositions[startPosKey];
                if (startPos) {
                    setEdgePreview({
                        source: { nodeId, portId, portType, type },
                        startPos,
                        targetPos: startPos
                    });
                }
                return;
            }
        }

        if (portType === 'output') {
            startEdgeDrag();
            setIsDraggingOutput(true);
            setCurrentOutputType(type);
            setSourcePortForConnection({ nodeId, portId, portType, type });

            const startPosKey = generatePortKey(nodeId, portId, portType as 'input' | 'output');
            const startPos = portPositions[startPosKey];
            if (startPos) {
                setEdgePreview({
                    source: { nodeId, portId, portType, type },
                    startPos,
                    targetPos: startPos
                });
            }
            return;
        }
    }, [
        edges,
        portPositions,
        nodes,
        startEdgeDrag,
        setPortClickStart,
        setEdgePreview,
        removeEdge,
        setIsDraggingInput,
        setIsDraggingOutput,
        setCurrentInputType,
        setCurrentOutputType,
        setSourcePortForConnection
    ]);

    const handlePortMouseUp = useCallback((data: PortMouseEventData, mouseEvent?: React.MouseEvent): void => {
        const { nodeId, portId, portType, type } = data;
        const currentEdgePreview = edgePreviewRef.current;

        const isClickAction = portClickStart && mouseEvent &&
            isClick(
                portClickStart.timestamp,
                portClickStart.position,
                { x: mouseEvent.clientX, y: mouseEvent.clientY }
            );

        // Port click (no drag) → open connectable nodes modal
        if (isClickAction &&
            portClickStart.data.nodeId === nodeId &&
            portClickStart.data.portId === portId &&
            portClickStart.data.portType === portType) {

            const portPosKey = generatePortKey(nodeId, portId, portType as 'input' | 'output');
            const portPos = portPositions[portPosKey];

            if (portPos) {
                setSourcePortForConnection({ nodeId, portId, portType, type });
                setEdgePreview({
                    source: { nodeId, portId, portType, type },
                    startPos: portPos,
                    targetPos: portPos
                });

                let compatible: NodeData[] = [];
                if (portType === 'output') {
                    setIsDraggingOutput(true);
                    setCurrentOutputType(type);
                    compatible = findCompatibleInputNodes(type);
                } else if (portType === 'input') {
                    setIsDraggingInput(true);
                    setCurrentInputType(type);
                    compatible = findCompatibleOutputNodes(type);
                }

                if (compatible.length > 0) {
                    setCompatibleNodes(compatible);
                }
            }

            setPortClickStart(null);
            return;
        }

        setPortClickStart(null);

        if (!currentEdgePreview) return;

        if (!areTypesCompatible(currentEdgePreview.source.type, type)) {
            setSnappedPortKey(null);
            setIsSnapTargetValid(true);
            setEdgePreview(null);
            return;
        }

        if (currentEdgePreview.source.portType === portType) {
            setEdgePreview(null);
            return;
        }

        if (currentEdgePreview.source.nodeId === nodeId) {
            setEdgePreview(null);
            return;
        }

        // Handle regular node connection
        clearCompatibleNodes();

        if (isDuplicateEdge(
            currentEdgePreview.source.nodeId,
            currentEdgePreview.source.portId,
            nodeId,
            portId
        )) {
            setEdgePreview(null);
            return;
        }

        // Handle input port replacement (for non-multi inputs)
        if (portType === 'input') {
            const targetPort = findPortData(nodes, nodeId, portId, 'input');
            if (targetPort && !targetPort.multi) {
                const existingEdge = edges.find(edge =>
                    edge.target.nodeId === nodeId && edge.target.portId === portId
                );
                if (existingEdge) {
                    removeEdge(existingEdge.id);
                }
            }
        }

        let newEdge: CanvasEdge;
        if (currentEdgePreview.source.portType === 'input') {
            newEdge = {
                id: `edge-${nodeId}:${portId}-${currentEdgePreview.source.nodeId}:${currentEdgePreview.source.portId}-${Date.now()}`,
                source: { nodeId, portId, portType },
                target: currentEdgePreview.source,
            };
        } else {
            newEdge = {
                id: `edge-${currentEdgePreview.source.nodeId}:${currentEdgePreview.source.portId}-${nodeId}:${portId}-${Date.now()}`,
                source: currentEdgePreview.source,
                target: { nodeId, portId, portType }
            };
        }

        addEdge(newEdge);
        setEdgePreview(null);
        setSnappedPortKey(null);
        setIsSnapTargetValid(true);
    }, [
        edges,
        nodes,
        portPositions,
        isDraggingOutput,
        isDraggingInput,
        portClickStart,
        edgePreviewRef,
        setPortClickStart,
        setEdgePreview,
        setSnappedPortKey,
        setIsSnapTargetValid,
        setIsDraggingOutput,
        setIsDraggingInput,
        setCurrentOutputType,
        setCurrentInputType,
        setSourcePortForConnection,
        setCompatibleNodes,
        addNode,
        addEdge,
        clearCompatibleNodes,
        isDuplicateEdge,
        findCompatibleInputNodes,
        findCompatibleOutputNodes,
    ]);

    return {
        handlePortMouseDown,
        handlePortMouseUp
    };
};
