import { useCallback } from 'react';
import type { CanvasNode, CanvasEdge } from '@xgen/canvas-types';

interface UseKeyboardHandlersProps {
    selectedNodeIds: Set<string>;
    selectedEdgeIds: Set<string>;

    copyNodes: (nodeIds: string[]) => void;
    pasteNodes: () => string[];
    deleteNode: (nodeId: string, connectedEdges: CanvasEdge[], skipHistory?: boolean) => void;
    removeEdge: (edgeId: string, skipHistory?: boolean) => void;
    removeNodeEdges: (nodeId: string) => CanvasEdge[];
    clearSelection: () => void;
    selectNode: (nodeId: string) => void;
    setSelection: (nodes: Set<string>, edges: Set<string>) => void;

    toggleBypass: (nodeId: string) => void;
    toggleExpanded: (nodeId: string) => void;

    undo: () => any;
    redo: () => any;
    canUndo: boolean;
    canRedo: boolean;
    historyHelpers?: {
        recordMultiAction: (description: string, actions: any[]) => void;
    };
    nodes: CanvasNode[];
    edges: CanvasEdge[];
}

interface UseKeyboardHandlersReturn {
    handleKeyDown: (e: KeyboardEvent) => void;
}

const isCtrlOrCmdPressed = (e: KeyboardEvent): boolean => {
    const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    return isMac ? e.metaKey : e.ctrlKey;
};

export const useKeyboardHandlers = ({
    selectedNodeIds,
    selectedEdgeIds,
    copyNodes,
    pasteNodes,
    deleteNode,
    removeEdge,
    removeNodeEdges,
    clearSelection,
    selectNode,
    setSelection,
    toggleBypass,
    toggleExpanded,
    undo,
    redo,
    canUndo,
    canRedo,
    historyHelpers,
    nodes,
    edges
}: UseKeyboardHandlersProps): UseKeyboardHandlersReturn => {

    const handleKeyDown = useCallback((e: KeyboardEvent): void => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
            return;
        }

        const isCtrlOrCmd = isCtrlOrCmdPressed(e);

        if (isCtrlOrCmd && e.key === 'c') {
            e.preventDefault();
            const nodeIds = Array.from(selectedNodeIds);
            if (nodeIds.length > 0) {
                copyNodes(nodeIds);
            }
        } else if (isCtrlOrCmd && e.key === 'v') {
            e.preventDefault();
            const pastedNodeIds = pasteNodes();
            if (pastedNodeIds.length > 0) {
                setSelection(new Set(pastedNodeIds), new Set());
            }
        } else if (isCtrlOrCmd && e.shiftKey && e.key === 'Z') {
            e.preventDefault();
            if (canRedo) {
                redo();
            }
        } else if (isCtrlOrCmd && e.key === 'z') {
            e.preventDefault();
            if (canUndo) {
                undo();
            }
        } else if ((e.key === 'Delete' || e.key === 'Backspace')) {
            if (selectedNodeIds.size > 0 || selectedEdgeIds.size > 0) {
                e.preventDefault();

                const actions: any[] = [];

                selectedEdgeIds.forEach(edgeId => {
                    const edge = edges.find(e => e.id === edgeId);
                    if (edge) {
                        actions.push({
                            actionType: 'EDGE_DELETE',
                            edgeId: edge.id,
                            sourceId: edge.source.nodeId,
                            targetId: edge.target.nodeId
                        });
                        removeEdge(edgeId, true);
                    }
                });

                selectedNodeIds.forEach(nodeId => {
                    const node = nodes.find(n => n.id === nodeId);
                    if (node) {
                        const connectedEdges = removeNodeEdges(nodeId);

                        connectedEdges.forEach(edge => {
                            if (!selectedEdgeIds.has(edge.id)) {
                                actions.push({
                                    actionType: 'EDGE_DELETE',
                                    edgeId: edge.id,
                                    sourceId: edge.source.nodeId,
                                    targetId: edge.target.nodeId
                                });
                            }
                        });

                        actions.push({
                            actionType: 'NODE_DELETE',
                            nodeId: node.id,
                            nodeType: node.data.nodeName
                        });

                        deleteNode(nodeId, connectedEdges, true);
                    }
                });

                if (actions.length > 0 && historyHelpers?.recordMultiAction) {
                    historyHelpers.recordMultiAction(`Deleted ${actions.length} items`, actions);
                }

                clearSelection();
            }
        } else if ((e.key === 'e' || e.key === 'E') && !isCtrlOrCmd && !e.altKey) {
            if (selectedNodeIds.size > 0) {
                e.preventDefault();
                selectedNodeIds.forEach(nodeId => {
                    toggleExpanded(nodeId);
                });
            }
        } else if ((e.key === 'b' || e.key === 'B') && !isCtrlOrCmd && !e.altKey) {
            if (selectedNodeIds.size > 0) {
                e.preventDefault();
                selectedNodeIds.forEach(nodeId => {
                    toggleBypass(nodeId);
                });
            }
        }
    }, [
        selectedNodeIds,
        selectedEdgeIds,
        copyNodes,
        pasteNodes,
        deleteNode,
        removeEdge,
        removeNodeEdges,
        clearSelection,
        selectNode,
        setSelection,
        toggleBypass,
        toggleExpanded,
        undo,
        redo,
        canUndo,
        canRedo,
        historyHelpers,
        nodes,
        edges
    ]);

    return {
        handleKeyDown
    };
};
