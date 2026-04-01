import React, { memo } from 'react';
import type { Position } from '@xgen/canvas-types';
import styles from '../styles/Edge.module.scss';

type Orientation = -1 | 0 | 1;

// Configuration for stubs
const STUB_LENGTH_COLLAPSED_OUTPUT = 0;
const STUB_LENGTH_COLLAPSED_INPUT = 0;
const STUB_LENGTH_EXPANDED_OUTPUT = 50;
const STUB_LENGTH_EXPANDED_INPUT = 50;

// Configuration for curvature
const MIN_CONTROL_OFFSET = 40;
const MAX_CONTROL_OFFSET_Y_INFLUENCE = 150;
const CURVATURE_RATIO = 0.5;

const getOrientation = (portType?: 'input' | 'output'): Orientation => {
    if (portType === 'input') return -1;
    if (portType === 'output') return 1;
    return 0;
};

const getStubLength = (portType?: 'input' | 'output', isExpanded?: boolean): number => {
    if (!portType) return 0;
    if (isExpanded) {
        return portType === 'output' ? STUB_LENGTH_EXPANDED_OUTPUT : STUB_LENGTH_EXPANDED_INPUT;
    }
    return portType === 'output' ? STUB_LENGTH_COLLAPSED_OUTPUT : STUB_LENGTH_COLLAPSED_INPUT;
};

const getStubPoint = (pos: Position, orientation: Orientation, length: number): Position => {
    if (orientation === 0 || length === 0) {
        return pos;
    }
    return {
        x: pos.x + orientation * length,
        y: pos.y
    };
};

interface BezierOptions {
    sourcePortType?: 'input' | 'output';
    targetPortType?: 'input' | 'output';
    sourceExpanded?: boolean;
    targetExpanded?: boolean;
    sourcePos: Position;
    targetPos: Position;
}

const buildPath = ({
    sourcePos,
    targetPos,
    sourcePortType,
    targetPortType,
    sourceExpanded,
    targetExpanded
}: BezierOptions): string => {
    const sourceOrientation = getOrientation(sourcePortType);
    const targetOrientation = getOrientation(targetPortType);

    const sourceStubLength = getStubLength(sourcePortType, sourceExpanded);
    const targetStubLength = getStubLength(targetPortType, targetExpanded);

    const start = getStubPoint(sourcePos, sourceOrientation, sourceStubLength);
    const end = getStubPoint(targetPos, targetOrientation, targetStubLength);

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    let controlOffset = absDx * CURVATURE_RATIO;
    const yInfluence = Math.min(absDy * 0.5, MAX_CONTROL_OFFSET_Y_INFLUENCE);

    controlOffset = Math.max(controlOffset, MIN_CONTROL_OFFSET);

    if (absDx < yInfluence * 2) {
        controlOffset = Math.max(controlOffset, yInfluence);
    }

    const cp1 = {
        x: start.x + sourceOrientation * controlOffset,
        y: start.y
    };

    const cp2 = {
        x: end.x + targetOrientation * controlOffset,
        y: end.y
    };

    const pathSegments: string[] = [`M ${sourcePos.x},${sourcePos.y}`];

    if (sourceStubLength > 0) {
        pathSegments.push(`L ${start.x},${start.y}`);
    }

    pathSegments.push(
        `C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${end.x},${end.y}`
    );

    if (targetStubLength > 0) {
        pathSegments.push(`L ${targetPos.x},${targetPos.y}`);
    }

    return pathSegments.join(' ');
};

interface EdgeProps {
    id: string;
    sourcePos: Position;
    targetPos: Position;
    sourcePortType?: 'input' | 'output';
    targetPortType?: 'input' | 'output';
    sourceExpanded?: boolean;
    targetExpanded?: boolean;
    onEdgeClick?: (edgeId: string, e?: React.MouseEvent) => void;
    isSelected?: boolean;
    isPreview?: boolean;
}

const EdgeComponent: React.FC<EdgeProps> = ({
    id,
    sourcePos,
    targetPos,
    sourcePortType,
    targetPortType,
    sourceExpanded,
    targetExpanded,
    onEdgeClick,
    isSelected = false,
    isPreview = false,
}) => {
    if (!sourcePos || !targetPos) return null;

    const d = buildPath({
        sourcePos,
        targetPos,
        sourcePortType,
        targetPortType,
        sourceExpanded,
        targetExpanded
    });

    const handleEdgeClick = (e: React.MouseEvent<SVGGElement>): void => {
        if (isPreview) return;
        e.stopPropagation();
        if (onEdgeClick && id) {
            onEdgeClick(id, e);
        }
    };

    return (
        <g
            className={`${styles.edgeGroup} ${isSelected ? styles.selected : ''} ${isPreview ? styles.preview : ''}`}
            onClick={handleEdgeClick}
            data-edge-id={id}
        >
            <path className={styles.edgeHitbox} d={d} />
            <path className={styles.edgePath} d={d} />
        </g>
    );
};

export const Edge = memo(EdgeComponent);
export default Edge;
