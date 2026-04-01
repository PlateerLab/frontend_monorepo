import { useState, useCallback } from 'react';
import type { CanvasEdge } from '@xgen/canvas-types';

interface UseEdgeManagementProps {
    historyHelpers?: {
        recordEdgeCreate?: (edgeId: string, sourceId: string, targetId: string) => void;
        recordEdgeDelete?: (edgeId: string, sourceId: string, targetId: string) => void;
    };
}

export interface UseEdgeManagementReturn {
    edges: CanvasEdge[];
    setEdges: React.Dispatch<React.SetStateAction<CanvasEdge[]>>;
    addEdge: (edge: CanvasEdge, skipHistory?: boolean) => void;
    removeEdge: (edgeId: string, skipHistory?: boolean) => void;
    removeNodeEdges: (nodeId: string) => CanvasEdge[];
    isDuplicateEdge: (sourceNodeId: string, sourcePortId: string, targetNodeId: string, targetPortId: string) => boolean;
    replaceInputEdge: (nodeId: string, portId: string, newEdge: CanvasEdge) => void;
}

export const useEdgeManagement = ({ historyHelpers }: UseEdgeManagementProps = {}): UseEdgeManagementReturn => {
    const [edges, setEdges] = useState<CanvasEdge[]>([]);

    const addEdge = useCallback((edge: CanvasEdge, skipHistory = false) => {
        setEdges(prev => [...prev, edge]);
        if (!skipHistory && historyHelpers?.recordEdgeCreate) {
            historyHelpers.recordEdgeCreate(edge.id, edge.source.nodeId, edge.target.nodeId);
        }
    }, [historyHelpers]);

    const removeEdge = useCallback((edgeId: string, skipHistory = false) => {
        let removedEdge: CanvasEdge | undefined;
        setEdges(prev => {
            removedEdge = prev.find(e => e.id === edgeId);
            return prev.filter(e => e.id !== edgeId);
        });
        if (!skipHistory && historyHelpers?.recordEdgeDelete && removedEdge) {
            historyHelpers.recordEdgeDelete(edgeId, removedEdge.source.nodeId, removedEdge.target.nodeId);
        }
    }, [historyHelpers]);

    const removeNodeEdges = useCallback((nodeId: string): CanvasEdge[] => {
        let removedEdges: CanvasEdge[] = [];
        setEdges(prev => {
            removedEdges = prev.filter(e =>
                e.source.nodeId === nodeId || e.target.nodeId === nodeId
            );
            return prev.filter(e =>
                e.source.nodeId !== nodeId && e.target.nodeId !== nodeId
            );
        });
        return removedEdges;
    }, []);

    const isDuplicateEdge = useCallback((
        sourceNodeId: string,
        sourcePortId: string,
        targetNodeId: string,
        targetPortId: string
    ): boolean => {
        return edges.some(e =>
            e.source.nodeId === sourceNodeId &&
            e.source.portId === sourcePortId &&
            e.target.nodeId === targetNodeId &&
            e.target.portId === targetPortId
        );
    }, [edges]);

    const replaceInputEdge = useCallback((nodeId: string, portId: string, newEdge: CanvasEdge): void => {
        setEdges(prev => {
            const filtered = prev.filter(e =>
                !(e.target.nodeId === nodeId && e.target.portId === portId)
            );
            return [...filtered, newEdge];
        });
    }, []);

    return {
        edges,
        setEdges,
        addEdge,
        removeEdge,
        removeNodeEdges,
        isDuplicateEdge,
        replaceInputEdge
    };
};
