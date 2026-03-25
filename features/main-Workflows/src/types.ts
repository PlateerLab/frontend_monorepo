/**
 * @xgen/main-workflows 타입 정의
 */

/**
 * 워크플로우 상태
 */
export type WorkflowStatus = 'draft' | 'published' | 'archived';

/**
 * 워크플로우 항목
 */
export interface WorkflowItem {
  /** 워크플로우 ID */
  id: string;

  /** 워크플로우 이름 */
  name: string;

  /** 설명 */
  description?: string;

  /** 상태 */
  status: WorkflowStatus;

  /** 카테고리 */
  category?: string;

  /** 버전 */
  version: string;

  /** 노드 수 */
  nodeCount: number;

  /** 태그 */
  tags?: string[];

  /** 최근 실행일 */
  lastExecutedAt?: string;

  /** 실행 횟수 */
  executionCount: number;

  /** 생성일 */
  createdAt: string;

  /** 수정일 */
  updatedAt: string;

  /** 생성자 ID */
  createdBy: string;

  /** 썸네일 URL */
  thumbnailUrl?: string;
}

/**
 * 워크플로우 필터
 */
export type WorkflowFilter = 'all' | 'draft' | 'published' | 'archived';
