// Chat New Types
// API에서 받아오는 워크플로우 데이터와 컴포넌트 타입 정의

export type { WorkflowOption, WorkflowDetailResponse } from '@xgen/types';

// ─────────────────────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────────────────────

export interface WorkflowDetailFromAPI {
  id: number;
  workflow_name: string;
  workflow_id: string;
  username: string;
  user_id: number;
  full_name?: string;
  node_count: number;
  edge_count: number;
  updated_at: string;
  created_at: string;
  has_startnode: boolean;
  has_endnode: boolean;
  is_completed: boolean;
  is_shared: boolean;
  share_roles: string[] | null;
  share_permissions: string;
  metadata?: Record<string, unknown>;
  error?: string;
  is_accepted?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Component Types
// ─────────────────────────────────────────────────────────────

export type WorkflowOwnerFilter = 'all' | 'personal' | 'shared';

export interface ChatNewPageProps {
  onNavigate?: (sectionId: string) => void;
  onSelectWorkflow?: (workflow: {
    workflowId: string;
    workflowName: string;
    userId?: number;
  }) => void;
}
