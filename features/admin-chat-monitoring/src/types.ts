export interface AgentflowLog {
  id: number;
  user_id: number | null;
  username: string | null;
  interaction_id: string;
  workflow_id: string;
  workflow_name: string;
  input_data: string | null;
  output_data: string | null;
  expected_output: string | null;
  llm_eval_score: number | null;
  test_mode: boolean;
  user_score: number;
  created_at: string;
  updated_at: string;
}

export interface PaginationInfo {
  page: number;
  page_size: number;
  offset: number;
  total_returned: number;
}

export interface ChatLogsResponse {
  io_logs: AgentflowLog[];
  pagination: PaginationInfo;
}
