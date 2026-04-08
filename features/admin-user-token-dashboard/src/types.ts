export interface AgentflowUsageDetail {
  usage_count: number;
  total_tokens: number;
  interactions: number;
  input_tokens: number;
  output_tokens: number;
}

export interface UserTokenUsage {
  user_id: number;
  username: string | null;
  total_interactions: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  average_input_tokens: number;
  average_output_tokens: number;
  first_interaction: string;
  last_interaction: string;
  most_used_workflow: string | null;
  workflow_usage_count: number;
  workflow_usage?: Record<string, AgentflowUsageDetail>;
}

export interface PaginationInfo {
  page: number;
  page_size: number;
  total_users: number;
  total_pages: number;
}

export interface TokenUsageResponse {
  users: UserTokenUsage[];
  pagination: PaginationInfo;
}
