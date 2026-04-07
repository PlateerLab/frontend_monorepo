/**
 * @xgen/ui hooks
 *
 * 공유 React 훅을 보관한다.
 * shadcn CLI가 생성하는 훅(use-mobile 등)과
 * XGEN 커스텀 훅(use-toast 등)이 공존한다.
 */

export { useExternalDrop, extractFilesFromDataTransfer, isExternalFileDrag } from './use-external-drop';
export type { ExternalDropResult, UseExternalDropOptions, UseExternalDropReturn } from './use-external-drop';
