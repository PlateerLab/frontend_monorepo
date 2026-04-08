import type { CanvasNode, CanvasEdge } from '@xgen/canvas-types';
import type { TutorialData, TutorialStep } from './types';

interface WorkflowTemplateData {
    workflow_name?: string;
    description?: string;
    nodes?: CanvasNode[];
    edges?: CanvasEdge[];
    view?: { x: number; y: number; scale: number };
}

/**
 * 워크플로우 템플릿 데이터를 TutorialData로 변환합니다.
 * - 노드를 위상 정렬하여 학습 순서를 결정
 * - 각 노드의 description을 튜토리얼 메시지로 활용
 * - 엣지는 source/target 노드가 모두 추가된 시점의 스텝에 배정
 */
export function workflowToTutorial(
    workflow: WorkflowTemplateData,
    templateId: string,
    templateDescription?: string,
    tags?: string[],
): TutorialData {
    const nodes = workflow.nodes || [];
    const edges = workflow.edges || [];

    const sortedNodes = topologicalSort(nodes, edges);

    const addedNodeIds = new Set<string>();
    const addedEdgeIds = new Set<string>();
    const steps: TutorialStep[] = [];

    for (let i = 0; i < sortedNodes.length; i++) {
        const node = sortedNodes[i];
        addedNodeIds.add(node.id);

        const newEdges = edges.filter(
            (e) =>
                !addedEdgeIds.has(e.id) &&
                addedNodeIds.has(e.source.nodeId) &&
                addedNodeIds.has(e.target.nodeId),
        );
        newEdges.forEach((e) => addedEdgeIds.add(e.id));

        const title = (node.data as any).nodeNameKo || node.data.nodeName || `노드 ${i + 1}`;
        const description =
            (node.data as any).description_ko ||
            node.data.description ||
            `${node.data.nodeName} 노드를 추가합니다.`;

        steps.push({
            step: i + 1,
            title,
            message: description,
            nodes: [node],
            edges: newEdges,
        });
    }

    return {
        tutorial_id: `template_${templateId}`,
        tutorial_name: workflow.workflow_name || '에이전트플로우 튜토리얼',
        tutorial_description:
            templateDescription ||
            workflow.description ||
            '템플릿 기반 튜토리얼',
        tags: tags || ['템플릿'],
        tutorial_steps: steps,
        view: workflow.view || { x: -36528, y: -15535, scale: 0.73 },
    };
}

function topologicalSort(nodes: CanvasNode[], edges: CanvasEdge[]): CanvasNode[] {
    const nodeMap = new Map<string, CanvasNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    nodes.forEach((n) => {
        inDegree.set(n.id, 0);
        adjacency.set(n.id, []);
    });

    edges.forEach((e) => {
        const srcId = e.source.nodeId;
        const tgtId = e.target.nodeId;
        if (nodeMap.has(srcId) && nodeMap.has(tgtId)) {
            adjacency.get(srcId)!.push(tgtId);
            inDegree.set(tgtId, (inDegree.get(tgtId) || 0) + 1);
        }
    });

    const priority = (node: CanvasNode): number => {
        const fid = (node.data as any).functionId;
        if (fid === 'startnode') return 0;
        if (fid === 'endnode') return 2;
        return 1;
    };

    const queue: CanvasNode[] = [];
    nodes.forEach((n) => {
        if ((inDegree.get(n.id) || 0) === 0) {
            queue.push(n);
        }
    });
    queue.sort((a, b) => priority(a) - priority(b));

    const result: CanvasNode[] = [];
    const visited = new Set<string>();

    while (queue.length > 0) {
        const node = queue.shift()!;
        if (visited.has(node.id)) continue;
        visited.add(node.id);
        result.push(node);

        const neighbors = adjacency.get(node.id) || [];
        const nextNodes: CanvasNode[] = [];

        for (const neighborId of neighbors) {
            const newDegree = (inDegree.get(neighborId) || 1) - 1;
            inDegree.set(neighborId, newDegree);
            if (newDegree === 0 && !visited.has(neighborId)) {
                const neighborNode = nodeMap.get(neighborId);
                if (neighborNode) nextNodes.push(neighborNode);
            }
        }

        nextNodes.sort((a, b) => priority(a) - priority(b));
        queue.push(...nextNodes);
    }

    nodes.forEach((n) => {
        if (!visited.has(n.id)) {
            result.push(n);
        }
    });

    return result;
}
