/**
 * SpecialNode 중앙 관리 파일
 *
 * 새로운 Special Node를 추가하는 방법:
 * 1. SpecialNode 폴더에 새로운 TSX 파일 생성
 * 2. registerSpecialNode() 호출하여 등록
 * 3. 끝! CanvasNodes.tsx는 자동으로 처리됩니다.
 */

import type { FC } from 'react';
import type { NodeComponentProps } from '../Node/index';

export interface SpecialNodeConfig {
    /** 노드의 고유 식별자 */
    name: string;
    /** Display label for this special node type */
    label: string;
    /** 렌더링할 React 컴포넌트 */
    component: FC<NodeComponentProps>;
    /** 노드 데이터를 검증하는 함수 */
    matcher: (nodeData: { id: string; nodeName?: string; name?: string; [key: string]: any }) => boolean;
    /** 노드에 전달할 추가 props 키 목록 */
    additionalProps?: string[];
    /** 특별한 처리가 필요한 props (CanvasNodes에서 직접 처리) */
    requiresSpecialHandling?: boolean;
}

const SPECIAL_NODES: SpecialNodeConfig[] = [];

/**
 * Register a special node renderer.
 * Called by feature packages to inject their special node components.
 */
export function registerSpecialNode(config: SpecialNodeConfig): void {
    const existingIndex = SPECIAL_NODES.findIndex(
        (n) => n.name === config.name
    );
    if (existingIndex >= 0) {
        SPECIAL_NODES[existingIndex] = config;
    } else {
        SPECIAL_NODES.push(config);
    }
}

/**
 * 노드 데이터로부터 적절한 Special Node 설정을 찾습니다.
 */
export function findSpecialNode(
    nodeData: { id: string; nodeName?: string; name?: string; [key: string]: any }
): SpecialNodeConfig | null {
    for (const config of SPECIAL_NODES) {
        if (config.matcher(nodeData)) {
            return config;
        }
    }
    return null;
}

/**
 * 노드가 Special Node인지 확인합니다.
 */
export function isSpecialNode(
    nodeData: { id: string; nodeName?: string; name?: string; [key: string]: any }
): boolean {
    return SPECIAL_NODES.some(config => config.matcher(nodeData));
}

/**
 * 모든 Special Node의 추가 props 키 목록을 반환합니다.
 */
export function getAllAdditionalProps(): string[] {
    const propsSet = new Set<string>();
    SPECIAL_NODES.forEach(node => {
        if (node.additionalProps) {
            node.additionalProps.forEach(prop => propsSet.add(prop));
        }
    });
    return Array.from(propsSet);
}

/**
 * Get all registered special node configurations.
 */
export function getSpecialNodes(): readonly SpecialNodeConfig[] {
    return SPECIAL_NODES;
}

/**
 * Built-in matchers for common special node types.
 * Use exact ID matching as in the original implementation.
 */
export const SpecialNodeMatchers = {
    router: (nodeData: { id: string; nodeName?: string }) =>
        nodeData.id === 'router/Router' ||
        nodeData.nodeName === 'Router',
    agentXgen: (nodeData: { id: string; nodeName?: string }) =>
        nodeData.id === 'agents/xgen' ||
        nodeData.id === 'agents/xgen_251216' ||
        nodeData.id === 'agents/xgen_2512' ||
        nodeData.nodeName === 'Agent Xgen',
    schemaProvider: (nodeData: { id: string; nodeName?: string }) =>
        nodeData.id === 'input_schema_provider' ||
        nodeData.id === 'output_schema_provider' ||
        nodeData.nodeName === 'Schema Provider(Input)',
} as const;
