'use client';

import { createApiClient } from './index';

// ─────────────────────────────────────────────────────────────
// Node API Types (matches backend /api/node/get response)
// ─────────────────────────────────────────────────────────────

export interface NodeCategory {
    categoryId: string;
    categoryName: string;
    icon?: string;
    functions?: NodeFunction[];
}

export interface NodeFunction {
    functionId: string;
    functionName: string;
    nodes?: NodeSpec[];
}

export interface NodeSpec {
    id: string;
    nodeName: string;
    nodeNameKo?: string;
    description?: string;
    description_ko?: string;
    functionId?: string;
    inputs?: any[];
    outputs?: any[];
    parameters?: any[];
    bypass?: boolean;
    [key: string]: unknown;
}

export interface NodeDetail {
    id: string;
    name?: string;
    nodeName?: string;
    description?: string;
    inputs?: any[];
    outputs?: any[];
    parameters?: any[];
    [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────
// Node API Functions
// ─────────────────────────────────────────────────────────────

export async function getNodes(): Promise<NodeCategory[]> {
    const client = createApiClient({ service: 'core' });
    const response = await client.get<any>('/api/node/get');
    return response.data;
}

export async function getNodeDetail(nodeId: string): Promise<NodeDetail> {
    const client = createApiClient({ service: 'core' });
    const response = await client.get<NodeDetail>('/api/node/detail', {
        params: { node_id: nodeId },
    });
    return response.data;
}

export async function exportNodes(): Promise<NodeCategory[]> {
    const client = createApiClient({ service: 'core' });
    await client.get<any>('/api/node/export');
    return getNodes();
}

// ─────────────────────────────────────────────────────────────
// useNodes Hook
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseNodesReturn {
    nodes: NodeCategory[];
    flatNodeSpecs: NodeSpec[];
    isLoading: boolean;
    error: string | null;
    isInitialized: boolean;
    refreshNodes: () => Promise<void>;
}

export function useNodes(): UseNodesReturn {
    const [nodes, setNodes] = useState<NodeCategory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const fetchedRef = useRef(false);

    // 숨길 노드 ID 목록 (삭제 아닌 필터링)
    const HIDDEN_NODE_IDS = [
        'agents_lotte',  // 롯데 에이전트 (LotteGPT) — 현재 미사용
        'agents/lotte',  // 동일 노드 (슬래시 형식 ID)
    ];

    const filterHiddenNodes = useCallback((categories: NodeCategory[]): NodeCategory[] => {
        return categories.map((cat) => ({
            ...cat,
            functions: cat.functions?.map((func) => ({
                ...func,
                nodes: func.nodes?.filter((node) => !HIDDEN_NODE_IDS.includes(node.id)),
            })).filter((func) => (func.nodes?.length ?? 0) > 0),
        })).filter((cat) => (cat.functions?.length ?? 0) > 0);
    }, []);

    const fetchNodes = useCallback(async () => {
        if (isLoading) return;
        setIsLoading(true);
        setError(null);
        try {
            const categories = await getNodes();
            setNodes(filterHiddenNodes(categories));
            setIsInitialized(true);
        } catch (e) {
            setError((e as Error).message || 'Failed to load nodes');
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, filterHiddenNodes]);

    useEffect(() => {
        if (!fetchedRef.current) {
            fetchedRef.current = true;
            fetchNodes();
        }
    }, [fetchNodes]);

    const flatNodeSpecs: NodeSpec[] = nodes.flatMap((category: NodeCategory) =>
        category.functions?.flatMap((func: NodeFunction) => func.nodes || []) || []
    );

    const refreshNodes = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const categories = await exportNodes();
            setNodes(filterHiddenNodes(categories));
        } catch (e) {
            setError((e as Error).message || 'Failed to refresh nodes');
        } finally {
            setIsLoading(false);
        }
    }, [filterHiddenNodes]);

    return { nodes, flatNodeSpecs, isLoading, error, isInitialized, refreshNodes };
}
