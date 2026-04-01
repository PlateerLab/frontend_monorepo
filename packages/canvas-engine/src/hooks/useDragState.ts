import { useState, useCallback } from 'react';
import type { DragState, View, Position, CanvasNode } from '@xgen/canvas-types';

interface UseDragStateProps {
    historyHelpers?: {
        recordNodeMove: (nodeId: string, fromPosition: { x: number; y: number }, toPosition: { x: number; y: number }) => void;
        recordMultiAction?: (description: string, actions: any[]) => void;
    };
    nodes: CanvasNode[];
}

export interface UseDragStateReturn {
    dragState: DragState;
    setDragState: React.Dispatch<React.SetStateAction<DragState>>;
    startCanvasDrag: (e: React.MouseEvent, view: View) => void;
    startNodeDrag: (e: React.MouseEvent, nodeId: string, nodePosition: { x: number; y: number }, view: View, selectedNodeIds: Set<string>) => void;
    startEdgeDrag: () => void;
    startSelectionBoxDrag: (e: React.MouseEvent, view: View, containerRect: DOMRect) => void;
    stopDrag: () => void;
}

export const useDragState = ({ historyHelpers, nodes }: UseDragStateProps): UseDragStateReturn => {
    const [dragState, setDragState] = useState<DragState>({ type: 'none', startX: 0, startY: 0 });

    const startCanvasDrag = useCallback((e: React.MouseEvent, view: View) => {
        setDragState({
            type: 'canvas',
            startX: e.clientX - view.x,
            startY: e.clientY - view.y
        });
    }, []);

    const startNodeDrag = useCallback((
        e: React.MouseEvent,
        nodeId: string,
        nodePosition: { x: number; y: number },
        view: View,
        selectedNodeIds: Set<string>
    ) => {
        const nodesInDrag = new Set(selectedNodeIds);
        nodesInDrag.add(nodeId);

        // Build initial positions map for all dragged nodes
        const initialPositions: Record<string, { x: number; y: number }> = {};
        const nodesToDrag = selectedNodeIds.has(nodeId) ? Array.from(selectedNodeIds) : [nodeId];
        nodesToDrag.forEach(id => {
            const node = nodes.find(n => n.id === id);
            if (node) {
                initialPositions[id] = { ...node.position };
            }
        });

        setDragState({
            type: 'node',
            nodeId,
            offsetX: (e.clientX / view.scale) - nodePosition.x,
            offsetY: (e.clientY / view.scale) - nodePosition.y,
            initialNodePosition: { ...nodePosition },
            initialPositions,
        });
    }, [nodes]);

    const startEdgeDrag = useCallback(() => {
        setDragState({ type: 'edge' });
    }, []);

    const startSelectionBoxDrag = useCallback((e: React.MouseEvent, view: View, containerRect: DOMRect) => {
        const startX = (e.clientX - containerRect.left - view.x) / view.scale;
        const startY = (e.clientY - containerRect.top - view.y) / view.scale;

        setDragState({
            type: 'selection-box',
            startX: e.clientX,
            startY: e.clientY,
            selectionBox: {
                startX,
                startY,
                currentX: startX,
                currentY: startY
            }
        });
    }, []);

    const stopDrag = useCallback(() => {
        const currentDragState = dragState;

        // 노드 드래그가 끝났을 때 히스토리 기록
        if (currentDragState.type === 'node' && currentDragState.initialPositions && historyHelpers) {
            const moves: any[] = [];

            Object.entries(currentDragState.initialPositions).forEach(([id, initialPos]) => {
                const node = nodes.find(n => n.id === id);
                if (node) {
                    const currentPos = node.position;
                    const distance = Math.sqrt(
                        Math.pow(currentPos.x - initialPos.x, 2) +
                        Math.pow(currentPos.y - initialPos.y, 2)
                    );

                    if (distance > 5) {
                        moves.push({
                            actionType: 'NODE_MOVE' as const,
                            nodeId: id,
                            fromPosition: initialPos,
                            toPosition: currentPos
                        });
                    }
                }
            });

            if (moves.length > 0) {
                if (moves.length === 1 && historyHelpers.recordNodeMove) {
                    const move = moves[0];
                    historyHelpers.recordNodeMove(move.nodeId, move.fromPosition, move.toPosition);
                } else if (historyHelpers.recordMultiAction) {
                    historyHelpers.recordMultiAction(`Moved ${moves.length} nodes`, moves);
                }
            }
        }

        setDragState({ type: 'none' });
    }, [dragState, historyHelpers, nodes]);

    return {
        dragState,
        setDragState,
        startCanvasDrag,
        startNodeDrag,
        startEdgeDrag,
        startSelectionBoxDrag,
        stopDrag
    };
};
