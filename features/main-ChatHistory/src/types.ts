// Chat History Types

export interface ChatHistoryItem {
  id: string;
  interactionId: string;
  workflowId: string;
  workflowName: string;
  interactionCount: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  isWorkflowDeleted?: boolean;
  userId?: number;
}

export type ChatHistoryFilter = 'all' | 'active' | 'deleted' | 'deploy';
