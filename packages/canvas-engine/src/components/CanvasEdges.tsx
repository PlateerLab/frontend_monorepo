import React, { memo, useMemo } from 'react';
import { Edge } from './Edge';
import styles from '../styles/Edge.module.scss';
import type { CanvasEdge, CanvasNode, EdgePreview, Position } from '@xgen/canvas-types';

export interface CanvasEdgesProps {
    edges: CanvasEdge[];
    nodes: CanvasNode[];
    portPositions: Record<string, Position>;
    selectedEdgeIds: string[];
    edgePreview?: EdgePreview | null;
    scale?: number;
    onEdgeClick?: (e: React.MouseEvent, edgeId: string) => void;
    onEdgeContextMenu?: (e: React.MouseEvent, edgeId: string) => void;
}

/**
 * Get port position from the tracked portPositions map.
 * Falls back to a calculated position if not found.
 */
function getPortPosition(
    nodeId: string,
    portId: string,
    portType: 'input' | 'output',
    portPositions: Record<string, Position>,
    nodes: CanvasNode[]
): Position | null {
    const key = `${nodeId}__PORTKEYDELIM__${portId}__PORTKEYDELIM__${portType}`;
    if (portPositions[key]) {
        return portPositions[key];
    }
    // Fallback: approximate from node position (better than nothing)
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return null;
    const ports = portType === 'input'
        ? (node.data?.inputs ?? [])
        : (node.data?.outputs ?? []);
    const portIndex = ports.findIndex((p) => p.id === portId);
    if (portIndex < 0) return null;
    const portX = portType === 'output'
        ? (node.position?.x ?? 0) + 400
        : (node.position?.x ?? 0);
    const portY = (node.position?.y ?? 0) + 60 + portIndex * 30 + 12;
    return { x: portX, y: portY };
}

const CanvasEdgesComponent: React.FC<CanvasEdgesProps> = ({
    edges,
    nodes,
    portPositions,
    selectedEdgeIds,
    edgePreview,
    scale = 1,
    onEdgeClick,
    onEdgeContextMenu
}) => {
    // Sort edges: selected edges on top
    const sortedEdges = useMemo(() => {
        return [...edges].sort((a, b) => {
            const aSelected = selectedEdgeIds.includes(a.id) ? 1 : 0;
            const bSelected = selectedEdgeIds.includes(b.id) ? 1 : 0;
            return aSelected - bSelected;
        });
    }, [edges, selectedEdgeIds]);

    return (
        <svg className={styles.edgesContainer}>
            {sortedEdges.map((edge) => {
                const isSelected = selectedEdgeIds.includes(edge.id);
                const sourcePos = getPortPosition(
                    edge.source.nodeId,
                    edge.source.portId,
                    'output',
                    portPositions,
                    nodes
                );
                const targetPos = getPortPosition(
                    edge.target.nodeId,
                    edge.target.portId,
                    'input',
                    portPositions,
                    nodes
                );

                if (!sourcePos || !targetPos) return null;

                return (
                    <Edge
                        key={edge.id}
                        id={edge.id}
                        sourcePos={sourcePos}
                        targetPos={targetPos}
                        sourcePortType="output"
                        targetPortType="input"
                        isSelected={isSelected}
                        onEdgeClick={(edgeId, e) => e && onEdgeClick?.(e, edgeId)}
                    />
                );
            })}

            {/* Edge Preview (during drag) */}
            {edgePreview && (
                <Edge
                    id="edge-preview"
                    sourcePos={edgePreview.startPos}
                    targetPos={edgePreview.targetPos}
                    sourcePortType={edgePreview.source.type as 'input' | 'output'}
                    targetPortType="input"
                    isPreview
                />
            )}
        </svg>
    );
};

export const CanvasEdges = memo(CanvasEdgesComponent);
