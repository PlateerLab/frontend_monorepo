import type { Position, View } from '@xgen/canvas-types';

/**
 * 화면(client) 좌표 → 캔버스 월드 좌표 변환
 *
 * 캔버스 렌더링: transform: translate(view.x, view.y) scale(view.scale)
 * 역변환: worldX = (clientX - containerLeft - view.x) / view.scale
 */
export function clientToWorld(
    clientX: number,
    clientY: number,
    containerRect: DOMRect,
    view: View,
): Position {
    return {
        x: (clientX - containerRect.left - view.x) / view.scale,
        y: (clientY - containerRect.top - view.y) / view.scale,
    };
}

/**
 * 캔버스 월드 좌표 → 화면(client) 좌표 변환
 * (커서를 캔버스 내 특정 월드 위치로 이동시킬 때 사용)
 */
export function worldToClient(
    worldX: number,
    worldY: number,
    containerRect: DOMRect,
    view: View,
): { clientX: number; clientY: number } {
    return {
        clientX: worldX * view.scale + view.x + containerRect.left,
        clientY: worldY * view.scale + view.y + containerRect.top,
    };
}
