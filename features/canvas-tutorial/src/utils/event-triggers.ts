import type { CanvasNode, CanvasEdge, NodeData, Position, View } from '@xgen/canvas-types';

export interface CanvasRefHandle {
    addNode: (node: CanvasNode) => void;
    addEdge: (edge: CanvasEdge) => void;
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

/** add-node 모드: canvasRef.addNode() API 호출로 노드 추가 */
export function triggerAddNode(
    canvasRef: CanvasRefHandle,
    nodeData: NodeData,
    position: Position,
    nodeId?: string,
): string {
    const id = nodeId || `tutorial-${Date.now()}`;
    canvasRef.addNode({
        id,
        data: { ...nodeData } as NodeData,
        position,
    });
    return id;
}

/** connect 모드: canvasRef.addEdge() API 호출로 엣지 연결 */
export function triggerConnect(
    canvasRef: CanvasRefHandle,
    sourceNodeId: string,
    sourcePortId: string,
    targetNodeId: string,
    targetPortId: string,
): void {
    canvasRef.addEdge({
        id: `edge-${sourceNodeId}-${sourcePortId}-${targetNodeId}-${targetPortId}`,
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
