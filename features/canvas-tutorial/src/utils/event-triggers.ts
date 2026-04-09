import type { CanvasNode, CanvasEdge, NodeData, Position, View } from '@xgen/canvas-types';

export interface CanvasRefHandle {
    addNode: (node: CanvasNode) => void;
    addEdge: (edge: CanvasEdge) => void;
    getNodes?: () => CanvasNode[];
    getEdges?: () => CanvasEdge[];
    getView?: () => View;
    setView?: (view: View) => void;
    loadAgentflow?: (data: { nodes: CanvasNode[]; edges: CanvasEdge[]; memos?: any[]; view?: View }) => void;
}

/** click 모드: DOM 요소에 클릭 이벤트 발생 */
export function triggerClick(element: HTMLElement): void {
    element.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
    );
}

/** add-node 모드: canvasRef.addNode() API 호출로 노드 추가 (중복 방지) */
export function triggerAddNode(
    canvasRef: CanvasRefHandle,
    nodeData: NodeData,
    position: Position,
    nodeId?: string,
): string {
    const id = nodeId || `tutorial-${Date.now()}`;

    // 이미 같은 ID의 노드가 있으면 건너뜀
    if (canvasRef.getNodes) {
        const existing = canvasRef.getNodes();
        if (existing.some(n => n.id === id)) {
            return id;
        }
    }

    canvasRef.addNode({
        id,
        data: { ...nodeData } as NodeData,
        position,
    });
    return id;
}

/** connect 모드: canvasRef.addEdge() API 호출로 엣지 연결 (중복 방지) */
export function triggerConnect(
    canvasRef: CanvasRefHandle,
    sourceNodeId: string,
    sourcePortId: string,
    targetNodeId: string,
    targetPortId: string,
): void {
    const edgeId = `edge-${sourceNodeId}-${sourcePortId}-${targetNodeId}-${targetPortId}`;

    // 이미 같은 ID의 엣지가 있으면 건너뜀
    if (canvasRef.getEdges) {
        const existing = canvasRef.getEdges();
        if (existing.some(e => e.id === edgeId)) {
            return;
        }
    }

    canvasRef.addEdge({
        id: edgeId,
        source: { nodeId: sourceNodeId, portId: sourcePortId, portType: 'output' },
        target: { nodeId: targetNodeId, portId: targetPortId, portType: 'input' },
    });
}

/** type 모드: 입력 필드에 한 글자씩 입력 (타이핑 효과) */
export async function triggerType(
    input: HTMLInputElement | HTMLTextAreaElement,
    text: string,
    charDelayMs = 50,
): Promise<void> {
    input.focus();
    for (const char of text) {
        await new Promise((r) => setTimeout(r, charDelayMs));

        // React controlled component 호환: nativeInputValueSetter 사용
        const nativeSetter =
            Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                'value',
            )?.set ??
            Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype,
                'value',
            )?.set;

        nativeSetter?.call(input, input.value + char);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }
}
