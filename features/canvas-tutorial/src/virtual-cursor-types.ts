import type { NodeData, Position, View } from '@xgen/canvas-types';

/** 커서 동작 유형 */
export type CursorAction =
    | 'move'
    | 'click'
    | 'add-node'
    | 'connect'
    | 'type'
    | 'wait';

/** 힌트 말풍선 위치 */
export type HintPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto';

/** 가상 커서 튜토리얼 한 스텝 */
export interface VirtualTutorialStep {
    id: string;

    /** 스포트라이트 + 커서 이동 대상 (CSS 선택자) */
    targetSelector: string;

    /** 커서 동작 */
    cursorAction: CursorAction;

    // ===== add-node 모드 전용 =====

    /** 원본 노드 인스턴스 ID (엣지 연결에 필요) */
    nodeId?: string;

    /** 추가할 노드의 데이터 */
    nodeData?: NodeData;

    /** 노드를 배치할 캔버스 월드 좌표 */
    targetPosition?: Position;

    // ===== connect 모드 전용 =====

    /** 커서 애니메이션 시작점: 소스 포트 선택자 */
    sourcePortSelector?: string;

    /** 커서 애니메이션 끝점: 타겟 포트 선택자 */
    targetPortSelector?: string;

    /** 소스 노드 ID (addEdge 호출용) */
    sourceNodeId?: string;

    /** 소스 포트 ID (addEdge 호출용) */
    sourcePortId?: string;

    /** 타겟 노드 ID (addEdge 호출용) */
    targetNodeId?: string;

    /** 타겟 포트 ID (addEdge 호출용) */
    targetPortId?: string;

    // ===== type 모드 전용 =====

    /** 입력할 텍스트 */
    typeText?: string;

    // ===== 공통 =====

    /** 안내 메시지 i18n 키 */
    hintKey: string;

    /** 원본 튜토리얼 스텝 제목 */
    stepTitle?: string;

    /** 원본 튜토리얼 스텝 메시지 */
    stepMessage?: string;

    /** 원본 튜토리얼 스텝 인덱스 (1-based) */
    tutorialStepIndex?: number;

    /** 원본 튜토리얼 총 스텝 수 */
    tutorialStepTotal?: number;

    /** 힌트 위치 (기본: auto) */
    hintPosition?: HintPosition;

    /** wait 모드: 사용자 행동 완료 조건 */
    completionCheck?: () => boolean;

    /** 스텝 진입 시 실행할 준비 작업 */
    onEnter?: () => void;

    /** 자동 진행 딜레이(ms). wait 모드에선 무시 */
    autoAdvanceDelay?: number;
}

/** 시나리오: 스텝들의 묶음 */
export interface VirtualTutorialScenario {
    id: string;
    titleKey: string;
    descriptionKey: string;
    steps: VirtualTutorialStep[];
    /** 시나리오 시작 시 캔버스 뷰 설정 */
    view?: View;
}

/** 가상 커서 튜토리얼 전체 상태 */
export interface VirtualTutorialState {
    isActive: boolean;
    currentScenarioId: string | null;
    currentStepIndex: number;
    completedScenarios: string[];
}
