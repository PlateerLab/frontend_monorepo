import { useCallback } from 'react';
import type {
    DragState,
    View,
    Position,
    CanvasNode,
    NodeData,
    EdgePreview,
    CanvasEdge
} from '@xgen/canvas-types';
import {
    isParameterInput,
    getWorldPosition,
    parsePortKey,
    findClosestSnapTarget,
    findPortData,
    areTypesCompatible,
    SNAP_DISTANCE
} from '../utils/canvas-utils';

const isCtrlOrCmdPressed = (e: React.MouseEvent | KeyboardEvent): boolean => {
    const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    return isMac ? e.metaKey : e.ctrlKey;
};

interface UseCanvasEventHandlersProps {
    dragState: DragState;
    view: View;
    portPositions: Record<string, Position>;
    nodes: CanvasNode[];
    edges: CanvasEdge[];
    isDraggingOutput: boolean;
    isDraggingInput: boolean;
    portClickStart: { data: any; timestamp: number; position: { x: number; y: number } } | null;
    selectedNodeIds: Set<string>;
    selectedEdgeIds: Set<string>;

    containerRef: React.RefObject<HTMLDivElement | null>;
    edgePreviewRef: React.MutableRefObject<EdgePreview | null>;
    snappedPortKeyRef: React.MutableRefObject<string | null>;

    setView: React.Dispatch<React.SetStateAction<View>>;
    setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>;
    setEdgePreview: React.Dispatch<React.SetStateAction<EdgePreview | null>>;
    setSnappedPortKey: React.Dispatch<React.SetStateAction<string | null>>;
    setIsSnapTargetValid: React.Dispatch<React.SetStateAction<boolean>>;
    setPortClickStart: React.Dispatch<React.SetStateAction<any>>;
    setCompatibleNodes: React.Dispatch<React.SetStateAction<NodeData[]>>;

    clearSelection: () => void;
    startCanvasDrag: (e: React.MouseEvent, view: View) => void;
    startSelectionBoxDrag: (e: React.MouseEvent, view: View, containerRect: DOMRect) => void;
    clearCompatibleNodes: () => void;
    findCompatibleInputNodes: (outputType: string) => NodeData[];
    findCompatibleOutputNodes: (inputType: string) => NodeData[];
    stopDrag: () => void;
    selectNode: (nodeId: string, multi?: boolean) => void;
    selectEdge: (edgeId: string, multi?: boolean) => void;
    toggleNodeSelection: (nodeId: string) => void;
    toggleEdgeSelection: (edgeId: string) => void;
    setSelection: (nodes: Set<string>, edges: Set<string>) => void;
    startNodeDrag: (e: React.MouseEvent, nodeId: string, nodePosition: { x: number; y: number }, view: View, selectedNodeIds: Set<string>) => void;
    setDragState: React.Dispatch<React.SetStateAction<DragState>>;

    handlePortMouseUp: (data: any, mouseEvent?: React.MouseEvent) => void;
}

interface UseCanvasEventHandlersReturn {
    handleCanvasMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
    handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
    handleMouseUp: (e?: React.MouseEvent<HTMLDivElement>) => void;
    handleNodeMouseDown: (e: React.MouseEvent, nodeId: string) => void;
    handleEdgeClick: (edgeId: string, e?: React.MouseEvent) => void;
}

export const useCanvasEventHandlers = ({
    dragState,
    view,
    portPositions,
    nodes,
    edges,
    isDraggingOutput,
    isDraggingInput,
    portClickStart,
    selectedNodeIds,
    selectedEdgeIds,
    containerRef,
    edgePreviewRef,
    snappedPortKeyRef,
    setView,
    setNodes,
    setEdgePreview,
    setSnappedPortKey,
    setIsSnapTargetValid,
    setPortClickStart,
    setCompatibleNodes,
    clearSelection,
    startCanvasDrag,
    startSelectionBoxDrag,
    clearCompatibleNodes,
    findCompatibleInputNodes,
    findCompatibleOutputNodes,
    stopDrag,
    selectNode,
    selectEdge,
    toggleNodeSelection,
    toggleEdgeSelection,
    setSelection,
    startNodeDrag,
    setDragState,
    handlePortMouseUp
}: UseCanvasEventHandlersProps): UseCanvasEventHandlersReturn => {

    const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>): void => {
        const target = e.target as HTMLElement;
        if (isParameterInput(target)) return;
        if (e.button !== 0) return;

        if (isDraggingOutput || isDraggingInput) {
            clearCompatibleNodes();
        }

        if (isCtrlOrCmdPressed(e)) {
            const container = containerRef.current;
            if (container) {
                const rect = container.getBoundingClientRect();
                startSelectionBoxDrag(e, view, rect);
            }
        } else {
            clearSelection();
            startCanvasDrag(e, view);
        }
    }, [isDraggingOutput, isDraggingInput, clearCompatibleNodes, clearSelection, startCanvasDrag, startSelectionBoxDrag, view, containerRef]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>): void => {
        if (dragState.type === 'none') return;

        if (portClickStart) {
            setPortClickStart(null);
        }

        if (dragState.type === 'canvas') {
            setView(prev => ({
                ...prev,
                x: e.clientX - (dragState.startX || 0),
                y: e.clientY - (dragState.startY || 0)
            }));
        } else if (dragState.type === 'selection-box') {
            if (dragState.selectionBox) {
                const container = containerRef.current;
                if (!container) return;
                const rect = container.getBoundingClientRect();

                const currentX = (e.clientX - rect.left - view.x) / view.scale;
                const currentY = (e.clientY - rect.top - view.y) / view.scale;

                setDragState(prev => ({
                    ...prev,
                    selectionBox: {
                        ...prev.selectionBox!,
                        currentX,
                        currentY
                    }
                }));

                const startX = dragState.selectionBox.startX;
                const startY = dragState.selectionBox.startY;

                const left = Math.min(startX, currentX);
                const right = Math.max(startX, currentX);
                const top = Math.min(startY, currentY);
                const bottom = Math.max(startY, currentY);

                const newSelectedNodes = new Set<string>();
                const newSelectedEdges = new Set<string>();

                nodes.forEach(node => {
                    const nodeX = node.position.x;
                    const nodeY = node.position.y;
                    const nodeW = 200;
                    const nodeH = 100;

                    if (nodeX < right && nodeX + nodeW > left &&
                        nodeY < bottom && nodeY + nodeH > top) {
                        newSelectedNodes.add(node.id);
                    }
                });

                edges.forEach(edge => {
                    if (newSelectedNodes.has(edge.source.nodeId) && newSelectedNodes.has(edge.target.nodeId)) {
                        newSelectedEdges.add(edge.id);
                    }
                });

                setSelection(newSelectedNodes, newSelectedEdges);
            }
        } else if (dragState.type === 'node') {
            const newX = (e.clientX / view.scale) - (dragState.offsetX || 0);
            const newY = (e.clientY / view.scale) - (dragState.offsetY || 0);

            const deltaX = newX - (dragState.initialNodePosition?.x || 0);
            const deltaY = newY - (dragState.initialNodePosition?.y || 0);

            setNodes(prevNodes =>
                prevNodes.map(node => {
                    if (dragState.initialPositions && dragState.initialPositions[node.id]) {
                        const initialPos = dragState.initialPositions[node.id];
                        return {
                            ...node,
                            position: {
                                x: initialPos.x + deltaX,
                                y: initialPos.y + deltaY
                            }
                        };
                    }
                    return node;
                })
            );
        } else if (dragState.type === 'edge') {
            const container = containerRef.current;
            if (!container || !edgePreviewRef.current) return;

            const rect = container.getBoundingClientRect();
            const mousePos = getWorldPosition(e.clientX, e.clientY, rect, view);

            setEdgePreview(prev => prev ? { ...prev, targetPos: mousePos } : null);

            const edgeSource = edgePreviewRef.current.source;
            if (!edgeSource) return;

            const closestPortKey = findClosestSnapTarget(
                mousePos,
                portPositions,
                SNAP_DISTANCE,
                (key) => {
                    const parsed = parsePortKey(key);
                    if (!parsed) return false;
                    return parsed.portType === 'input' && edgeSource.nodeId !== parsed.nodeId;
                }
            );

            if (closestPortKey) {
                const parsed = parsePortKey(closestPortKey);
                if (parsed) {
                    const targetPort = findPortData(nodes, parsed.nodeId, parsed.portId, parsed.portType);
                    const isValid = targetPort ? areTypesCompatible(edgeSource.type, targetPort.type) : false;
                    setIsSnapTargetValid(isValid);
                }
            } else {
                setIsSnapTargetValid(true);
            }

            setSnappedPortKey(closestPortKey);
        }
    }, [
        dragState,
        view,
        portPositions,
        nodes,
        edges,
        portClickStart,
        setView,
        setNodes,
        setEdgePreview,
        setSnappedPortKey,
        setIsSnapTargetValid,
        setPortClickStart,
        containerRef,
        edgePreviewRef,
        setSelection
    ]);

    const handleMouseUp = useCallback((e?: React.MouseEvent<HTMLDivElement>): void => {
        // Edge dropped on empty canvas → show connectable nodes modal
        if (dragState.type === 'edge' && (isDraggingOutput || isDraggingInput) && !snappedPortKeyRef.current && e) {
            const container = containerRef.current;
            if (container && edgePreviewRef.current) {
                const sourceType = edgePreviewRef.current.source.type;
                let compatible: NodeData[] = [];

                if (isDraggingOutput) {
                    compatible = findCompatibleInputNodes(sourceType);
                } else if (isDraggingInput) {
                    compatible = findCompatibleOutputNodes(sourceType);
                }

                if (compatible.length > 0) {
                    setCompatibleNodes(compatible);
                }
                setEdgePreview(null);
                stopDrag();
                return;
            }
        }

        stopDrag();

        if (dragState.type === 'edge' && snappedPortKeyRef.current) {
            const source = edgePreviewRef.current?.source;
            const parsed = parsePortKey(snappedPortKeyRef.current);

            if (source && parsed) {
                handlePortMouseUp({
                    nodeId: parsed.nodeId,
                    portId: parsed.portId,
                    portType: parsed.portType as 'input' | 'output',
                    type: ''
                });
            }
        }

        setEdgePreview(null);
        setSnappedPortKey(null);
        setIsSnapTargetValid(true);
    }, [
        dragState,
        isDraggingOutput,
        isDraggingInput,
        view,
        findCompatibleInputNodes,
        findCompatibleOutputNodes,
        setCompatibleNodes,
        setEdgePreview,
        stopDrag,
        setSnappedPortKey,
        setIsSnapTargetValid,
        containerRef,
        edgePreviewRef,
        snappedPortKeyRef,
        handlePortMouseUp
    ]);

    const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string): void => {
        if (e.button !== 0) return;
        e.stopPropagation();

        const isCtrl = isCtrlOrCmdPressed(e);

        if (isCtrl) {
            if (!selectedNodeIds.has(nodeId)) {
                selectNode(nodeId, true);
                const newSet = new Set(selectedNodeIds);
                newSet.add(nodeId);
                const node = nodes.find(n => n.id === nodeId);
                if (node) {
                    startNodeDrag(e, nodeId, node.position, view, newSet);
                }
            } else {
                toggleNodeSelection(nodeId);
            }
        } else {
            if (!selectedNodeIds.has(nodeId)) {
                selectNode(nodeId, false);
                const newSet = new Set([nodeId]);
                const node = nodes.find(n => n.id === nodeId);
                if (node) {
                    startNodeDrag(e, nodeId, node.position, view, newSet);
                }
            } else {
                const node = nodes.find(n => n.id === nodeId);
                if (node) {
                    startNodeDrag(e, nodeId, node.position, view, selectedNodeIds);
                }
            }
        }
    }, [nodes, view, selectNode, toggleNodeSelection, startNodeDrag, selectedNodeIds]);

    const handleEdgeClick = useCallback((edgeId: string, e?: React.MouseEvent): void => {
        if (e) {
            e.stopPropagation();
        }
        if (e && isCtrlOrCmdPressed(e)) {
            toggleEdgeSelection(edgeId);
        } else {
            selectEdge(edgeId, false);
        }
    }, [selectEdge, toggleEdgeSelection]);

    return {
        handleCanvasMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleNodeMouseDown,
        handleEdgeClick
    };
};
