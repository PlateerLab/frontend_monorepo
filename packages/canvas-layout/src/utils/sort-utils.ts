export const getLayoutHintMaps = (group: any) => {
    const result = {
        primaryPortOrder: null as Record<string, { index: number }> | null,
        chainByNode: null as Record<string, { group: number | string }> | null,
        chainGroups: [] as any[],
    };
    if (!group || typeof group !== 'object') return result;

    if (group.primary_port_order && typeof group.primary_port_order === 'object') {
        result.primaryPortOrder = group.primary_port_order;
    }
    if (group.chain_by_node && typeof group.chain_by_node === 'object') {
        result.chainByNode = group.chain_by_node;
    }
    if (Array.isArray(group.chain_groups)) {
        result.chainGroups = group.chain_groups;
    }
    return result;
};

export const sortLevelNodesByPort = (
    levelNodes: string[],
    group: any,
    portIndexByNode: Map<string, number>,
    levelOrderByNode: Map<string, number>
): string[] => {
    if (!levelNodes.length) return levelNodes;

    const { primaryPortOrder, chainByNode, chainGroups } = getLayoutHintMaps(group);
    const hasPrimaryOrder = primaryPortOrder && Object.keys(primaryPortOrder).length > 0;

    const anchorByGroup = new Map<number | string, string>();
    if (!chainGroups) return levelNodes;
    chainGroups.forEach((chain: any) => {
        if (chain && (typeof chain.id === 'number' || typeof chain.id === 'string') && typeof chain.anchor === 'string') {
            anchorByGroup.set(chain.id, chain.anchor);
        }
    });

    const getPortIndex = (nodeId: string, fallbackIndex: number) => {
        const fallback = hasPrimaryOrder ? Number.POSITIVE_INFINITY : fallbackIndex;
        const chainMeta = chainByNode?.[nodeId];
        if (chainMeta && typeof chainMeta.group !== 'undefined') {
            const anchorId = anchorByGroup.get(chainMeta.group);
            const anchorIndex = anchorId ? primaryPortOrder?.[anchorId]?.index : undefined;
            if (typeof anchorIndex === 'number') return anchorIndex;
        }
        const directIndex = primaryPortOrder?.[nodeId]?.index;
        if (typeof directIndex === 'number') return directIndex;
        return fallback;
    };

    const decorated = levelNodes.map((nodeId, index) => {
        if (!levelOrderByNode.has(nodeId)) {
            levelOrderByNode.set(nodeId, index);
        }
        const portIndex = getPortIndex(nodeId, index);
        if (!portIndexByNode.has(nodeId) || portIndexByNode.get(nodeId) === Number.POSITIVE_INFINITY) {
            portIndexByNode.set(nodeId, portIndex);
        }
        return { nodeId, portIndex, index };
    });

    decorated.sort((a, b) => {
        if (a.portIndex !== b.portIndex) {
            return a.portIndex < b.portIndex ? -1 : 1;
        }
        return a.index - b.index;
    });

    return decorated.map(item => item.nodeId);
};
