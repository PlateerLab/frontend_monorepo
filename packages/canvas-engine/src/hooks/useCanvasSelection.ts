import { useState, useCallback } from 'react';

export interface UseCanvasSelectionReturn {
    selectedNodeIds: Set<string>;
    selectedEdgeIds: Set<string>;
    clearSelection: () => void;
    selectNode: (nodeId: string, multi?: boolean) => void;
    selectEdge: (edgeId: string, multi?: boolean) => void;
    toggleNodeSelection: (nodeId: string) => void;
    toggleEdgeSelection: (edgeId: string) => void;
    setSelection: (nodes: Set<string>, edges: Set<string>) => void;
}

export const useCanvasSelection = (): UseCanvasSelectionReturn => {
    const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
    const [selectedEdgeIds, setSelectedEdgeIds] = useState<Set<string>>(new Set());

    const clearSelection = useCallback((): void => {
        setSelectedNodeIds(new Set());
        setSelectedEdgeIds(new Set());
    }, []);

    const selectNode = useCallback((nodeId: string, multi: boolean = false): void => {
        if (multi) {
            setSelectedNodeIds(prev => new Set([...prev, nodeId]));
        } else {
            setSelectedNodeIds(new Set([nodeId]));
            setSelectedEdgeIds(new Set());
        }
    }, []);

    const selectEdge = useCallback((edgeId: string, multi: boolean = false): void => {
        if (multi) {
            setSelectedEdgeIds(prev => new Set([...prev, edgeId]));
        } else {
            setSelectedEdgeIds(new Set([edgeId]));
            setSelectedNodeIds(new Set());
        }
    }, []);

    const toggleNodeSelection = useCallback((nodeId: string): void => {
        setSelectedNodeIds(prev => {
            const next = new Set(prev);
            if (next.has(nodeId)) {
                next.delete(nodeId);
            } else {
                next.add(nodeId);
            }
            return next;
        });
    }, []);

    const toggleEdgeSelection = useCallback((edgeId: string): void => {
        setSelectedEdgeIds(prev => {
            const next = new Set(prev);
            if (next.has(edgeId)) {
                next.delete(edgeId);
            } else {
                next.add(edgeId);
            }
            return next;
        });
    }, []);

    const setSelection = useCallback((nodes: Set<string>, edges: Set<string>): void => {
        setSelectedNodeIds(nodes);
        setSelectedEdgeIds(edges);
    }, []);

    return {
        selectedNodeIds,
        selectedEdgeIds,
        clearSelection,
        selectNode,
        selectEdge,
        toggleNodeSelection,
        toggleEdgeSelection,
        setSelection
    };
};
