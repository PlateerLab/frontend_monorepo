// Dashboard Types
export interface DashboardOverview {
  total: number;
  normal: number;
  paused: number;
  error: number;
  updatedAt?: string;
}

export interface LatestUpdateItem {
  id: string;
  prefix: string;
  text: string;
  isLink?: boolean;
  onClick?: () => void;
}

export interface TopWorkflowItem {
  id: string;
  name: string;
  isLink?: boolean;
  onClick?: () => void;
}

export interface DashboardErrorItem {
  id: string;
  workflowName: string;
  time: string;
  message: string;
  selected?: boolean;
}

export interface DashboardData {
  overview: DashboardOverview;
  latestUpdates: LatestUpdateItem[];
  topWorkflows: TopWorkflowItem[];
  errors: DashboardErrorItem[];
}
