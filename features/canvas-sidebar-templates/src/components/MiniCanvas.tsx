import React, { useState, useRef, useEffect, type MouseEvent } from 'react';
import styles from '../styles/mini-canvas.module.scss';
import type { Position, CanvasNode, CanvasEdge } from '@xgen/canvas-types';

// ── Types ──────────────────────────────────────────────────────

export interface Template {
    name: string;
    description?: string;
    tags?: string[];
    nodes?: number;
    data?: {
        nodes?: CanvasNode[];
        edges?: CanvasEdge[];
    };
}

interface MiniCanvasProps {
    template: Template;
}

// ── Component ──────────────────────────────────────────────────

const MiniCanvas: React.FC<MiniCanvasProps> = ({ template }) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState<number>(0.3);
    const [offset, setOffset] = useState<Position>({ x: 400, y: 200 });
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });

    const nodes: CanvasNode[] = template.data?.nodes || [];
    const edges: CanvasEdge[] = template.data?.edges || [];

    const calculateOptimalView = () => {
        if (nodes.length === 0) return { adjustedNodes: [] as CanvasNode[] };

        const minX = Math.min(...nodes.map((n) => n.position.x));
        const maxX = Math.max(...nodes.map((n) => n.position.x));
        const minY = Math.min(...nodes.map((n) => n.position.y));
        const maxY = Math.max(...nodes.map((n) => n.position.y));

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const width = maxX - minX;
        const height = maxY - minY;

        const canvasWidth = 350;
        const canvasHeight = 250;
        const scaleX = width > 0 ? canvasWidth / width : 1;
        const scaleY = height > 0 ? canvasHeight / height : 1;
        const optimalScale = Math.min(scaleX, scaleY, 0.5);
        const spacingMultiplier = 5;

        const adjustedNodes: CanvasNode[] = nodes.map((node) => ({
            ...node,
            data: { ...node.data, parameters: [] },
            position: {
                x: (node.position.x - centerX) * optimalScale * spacingMultiplier,
                y: (node.position.y - centerY) * optimalScale * spacingMultiplier,
            },
        }));

        return { adjustedNodes };
    };

    const { adjustedNodes } = calculateOptimalView();

    const handleMouseDown = (e: MouseEvent<HTMLDivElement>): void => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
            setDragStart({
                x: e.clientX - rect.left - offset.x,
                y: e.clientY - rect.top - offset.y,
            });
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const wheelHandler = (e: WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setScale((prev) => Math.max(0.2, Math.min(2, prev + delta)));
        };
        canvas.addEventListener('wheel', wheelHandler, { passive: false });
        return () => canvas.removeEventListener('wheel', wheelHandler);
    }, []);

    useEffect(() => {
        if (!isDragging) return;
        const handleMouseMove = (e: globalThis.MouseEvent): void => {
            e.preventDefault();
            e.stopPropagation();
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;
            setOffset({
                x: e.clientX - rect.left - dragStart.x,
                y: e.clientY - rect.top - dragStart.y,
            });
        };
        const handleMouseUp = (e: globalThis.MouseEvent): void => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart]);

    return (
        <div
            className={styles.miniCanvas}
            ref={canvasRef}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown}
        >
            <div
                className={styles.canvasContent}
                style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                    transformOrigin: '0 0',
                }}
            >
                <div className={styles.grid} />

                {/* SVG Edges */}
                <svg
                    className={styles.edgesSvg}
                    style={{
                        width: '2000px',
                        height: '2000px',
                        position: 'absolute',
                        top: '-500px',
                        left: '-500px',
                        pointerEvents: 'none',
                        zIndex: 1,
                    }}
                >
                    {edges.map((edge) => {
                        const sourceNode = adjustedNodes.find((n) => n.id === edge.source.nodeId);
                        const targetNode = adjustedNodes.find((n) => n.id === edge.target.nodeId);
                        if (!sourceNode || !targetNode) return null;

                        const nodeWidth = 350 * 0.8;
                        const nodeHeight = 120 * 0.8;
                        const sx = sourceNode.position.x + nodeWidth + 500;
                        const sy = sourceNode.position.y + nodeHeight / 2 + 500;
                        const tx = targetNode.position.x + 500;
                        const ty = targetNode.position.y + nodeHeight / 2 + 500;

                        const dx = Math.abs(tx - sx) * 0.5;
                        const d = `M${sx},${sy} C${sx + dx},${sy} ${tx - dx},${ty} ${tx},${ty}`;

                        return (
                            <path
                                key={edge.id}
                                d={d}
                                fill="none"
                                stroke="#adb5bd"
                                strokeWidth={2}
                                opacity={0.6}
                            />
                        );
                    })}
                </svg>

                {/* Nodes */}
                <div className={styles.nodesContainer}>
                    {adjustedNodes.map((node) => (
                        <div
                            key={node.id}
                            className={styles.miniNode}
                            style={{
                                position: 'absolute',
                                left: node.position.x,
                                top: node.position.y,
                                width: 280,
                                padding: '8px 12px',
                                background: '#fff',
                                border: '1px solid #dee2e6',
                                borderRadius: 8,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {node.data.nodeName}
                        </div>
                    ))}
                </div>
            </div>

            {/* Zoom controls */}
            <div className={styles.zoomControls}>
                <button className={styles.zoomButton} onClick={() => setScale((p) => Math.min(2, p + 0.1))} type="button">+</button>
                <span className={styles.zoomLevel}>{Math.round(scale * 100)}%</span>
                <button className={styles.zoomButton} onClick={() => setScale((p) => Math.max(0.2, p - 0.1))} type="button">-</button>
            </div>
        </div>
    );
};

export default MiniCanvas;
