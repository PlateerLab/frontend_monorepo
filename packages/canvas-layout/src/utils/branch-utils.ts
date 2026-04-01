export const normalizeLevels = (group: any): string[][] => {
    if (!group) return [];
    if (Array.isArray(group)) {
        if (group.length === 0) return [];
        if (Array.isArray(group[0])) return group.filter(Array.isArray);
        return [group.filter((id: any) => typeof id === 'string')];
    }
    const levels = group.levels || group.execution_order;
    if (Array.isArray(levels)) {
        if (levels.length === 0) return [];
        if (Array.isArray(levels[0])) return levels.filter(Array.isArray);
        return [levels.filter((id: any) => typeof id === 'string')];
    }
    return [];
};

export const getBranchLevels = (branch: any): string[][] => {
    if (!branch) return [];
    const levels = branch.levels || branch.execution_order;
    if (Array.isArray(levels)) {
        if (levels.length === 0) return [];
        if (Array.isArray(levels[0])) return levels;
        return [levels.filter((id: any) => typeof id === 'string')];
    }
    if (Array.isArray(branch.nodes)) {
        return [branch.nodes.filter((id: any) => typeof id === 'string')];
    }
    return [];
};

export const resolveBranchPortOrder = (
    routerGroup: any,
    routerId: string,
    nodesById: Map<string, { id: string; position: { x: number; y: number } }>,
    branchPortOrderMap?: Record<string, string[]>
): string[] => {
    const branches = routerGroup?.branches;
    if (!branches || typeof branches !== 'object') return [];

    if (branchPortOrderMap?.[routerId]) {
        return branchPortOrderMap[routerId].filter((port: string) => branches[port]);
    }

    if (routerGroup.branch_port_order && Array.isArray(routerGroup.branch_port_order)) {
        return routerGroup.branch_port_order.filter((port: string) => branches[port]);
    }

    const branchKeys = Object.keys(branches);
    return branchKeys.sort((a, b) => {
        const aNodes = getBranchLevels(branches[a]).flat();
        const bNodes = getBranchLevels(branches[b]).flat();
        const aFirst = aNodes[0] ? nodesById.get(aNodes[0]) : undefined;
        const bFirst = bNodes[0] ? nodesById.get(bNodes[0]) : undefined;
        if (aFirst && bFirst) {
            if (aFirst.position.y !== bFirst.position.y) return aFirst.position.y - bFirst.position.y;
            return aFirst.position.x - bFirst.position.x;
        }
        return a.localeCompare(b);
    });
};
