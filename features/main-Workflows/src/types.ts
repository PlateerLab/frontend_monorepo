/**
 * @xgen/main-workflows 타입 정의
 *
 * @xgen/types에서 워크플로우 관련 타입을 re-export합니다.
 */

// Re-export workflow types from @xgen/types
export type {
  WorkflowDetail,
  WorkflowStatus,
  WorkflowStatusFilter,
  WorkflowOwnerFilter,
  WorkflowTab,
  WorkflowStoreItem,
  WorkflowSchedule,
  ScheduleStatus,
  ScheduleFrequency,
  WorkflowTestCase,
  WorkflowTesterSession,
  TesterRunStatus,
  DeployStatus,
  SharePermission,
} from '@xgen/types';

// Re-export card types
export type {
  ResourceCardProps,
  CardBadge,
  CardMetaItem,
  CardActionButton,
  CardDropdownItem,
  CardThumbnail,
} from '@xgen/types';

/**
 * 워크플로우 필터 타입 (기존 호환)
 * @deprecated WorkflowStatusFilter 사용 권장
 */
export type WorkflowFilter = 'all' | 'published' | 'draft' | 'archived';

/**
 * 워크플로우 아이템 (기존 호환)
 * @deprecated WorkflowDetail 사용 권장
 */
export interface WorkflowItem {
  /** 워크플로우 ID */
  id: string;

  /** 워크플로우 이름 */
  name: string;

  /** 설명 */
  description?: string;

  /** 상태 */
  status: 'draft' | 'published' | 'archived';

  /** 카테고리 */
  category?: string;

  /** 버전 */
  version?: string;

  /** 노드 수 */
  nodeCount: number;

  /** 태그 */
  tags?: string[];

  /** 최근 실행일 */
  lastExecutedAt?: string;

  /** 실행 횟수 */
  executionCount?: number;

  /** 생성일 */
  createdAt: string;

  /** 수정일 */
  updatedAt: string;

  /** 생성자 ID */
  createdBy?: string;

  /** 썸네일 URL */
  thumbnailUrl?: string;
}
