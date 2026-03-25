/**
 * @xgen/main-chat-new 타입 정의
 */

/**
 * 워크플로우 항목 (채팅 시작용)
 */
export interface WorkflowOption {
  /** 워크플로우 ID */
  workflowId: string;

  /** 워크플로우 이름 */
  name: string;

  /** 워크플로우 설명 */
  description?: string;

  /** 카테고리 */
  category?: string;

  /** 사용 횟수 */
  usageCount?: number;

  /** 즐겨찾기 여부 */
  isFavorite?: boolean;

  /** 최근 사용일 */
  lastUsedAt?: string;

  /** 버전 정보 */
  version?: string;

  /** 태그 */
  tags?: string[];

  /** 아이콘 URL */
  iconUrl?: string;
}

/**
 * 워크플로우 카테고리
 */
export interface WorkflowCategory {
  id: string;
  name: string;
  count: number;
}

/**
 * 초기 메시지 설정
 */
export interface InitialMessageConfig {
  content: string;
  attachments?: File[];
}
