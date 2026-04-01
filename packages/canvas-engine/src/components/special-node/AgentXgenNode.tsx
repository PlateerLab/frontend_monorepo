import React, { useMemo, useEffect, useRef, memo } from 'react';
import { Node } from '../Node/index';
import type { NodeComponentProps } from '../Node/index';
import type { Port } from '@xgen/canvas-types';

/**
 * Agent Xgen 전용 Special Node
 * streaming 파라미터 값에 따라 output을 동적으로 변경합니다.
 * - streaming = true: stream output 표시
 * - streaming = false: result output 표시
 *
 * 프로덕션 환경 호환성:
 * - useRef를 사용하여 onOutputsUpdate 함수의 최신 참조 유지
 * - streamingValue만 의존성으로 사용하여 불필요한 재렌더링 방지
 * - outputs 업데이트는 실제 값 변경 시에만 실행
 */
export interface AgentXgenNodeProps extends NodeComponentProps {
    /** Callback to update node's actual output data when streaming state changes */
    onOutputsUpdate?: (nodeId: string, outputs: Port[]) => void;
}

const AgentXgenNodeComponent: React.FC<AgentXgenNodeProps> = ({
    node,
    onOutputsUpdate,
    ...restProps
}) => {
    const { id } = node;
    const outputs = node.data?.outputs ?? [];
    const parameters = node.data?.parameters ?? [];

    const onOutputsUpdateRef = useRef(onOutputsUpdate);
    useEffect(() => {
        onOutputsUpdateRef.current = onOutputsUpdate;
    }, [onOutputsUpdate]);

    // streaming 파라미터의 값만 추출
    const streamingValue = useMemo(() => {
        const streamingParam = parameters.find(p => p.id === 'streaming');
        return streamingParam?.value ?? true; // 기본값 true
    }, [parameters]);

    // streaming 파라미터 값에 따라 outputs를 동적으로 필터링
    const dynamicOutputs = useMemo((): Port[] => {
        if (!outputs || outputs.length === 0) return [];

        // 백엔드에서 제공하는 outputs 중 streaming dependency에 맞는 것만 필터링
        const filtered = outputs.filter(output => {
            if (output.dependency === 'streaming') {
                const depVal = output.dependencyValue;
                if (typeof depVal === 'boolean') {
                    return Boolean(streamingValue) === depVal;
                }
                return String(streamingValue).toLowerCase() === String(depVal).toLowerCase();
            }
            return true; // streaming dependency가 없는 output은 항상 표시
        });

        return filtered;
    }, [streamingValue, outputs]);

    // streaming 파라미터 변경 시 실제 노드 데이터의 outputs 업데이트
    useEffect(() => {
        const updateFn = onOutputsUpdateRef.current;
        if (!updateFn) return;

        const currentOutputId = outputs?.[0]?.id;
        const newOutputId = dynamicOutputs[0]?.id;

        if (currentOutputId !== newOutputId) {
            updateFn(id, dynamicOutputs);
        }
    }, [streamingValue, id, dynamicOutputs, outputs]);

    // Build filtered node with dynamic outputs
    const filteredNode = useMemo(() => {
        if (!node.data) return node;
        if (dynamicOutputs.length === outputs.length) return node;

        return {
            ...node,
            data: {
                ...node.data,
                outputs: dynamicOutputs
            }
        };
    }, [node, dynamicOutputs, outputs.length]);

    return <Node node={filteredNode} {...restProps} />;
};

export const AgentXgenNode = memo(AgentXgenNodeComponent);
