// ─────────────────────────────────────────────────────────────
// Admin Workflow Store — Types
// ─────────────────────────────────────────────────────────────

export interface Workflow {
  id: number;
  created_at: string;
  updated_at: string;
  current_version: number;
  description: string;
  edge_count: number;
  full_name?: string;
  has_endnode: boolean;
  has_startnode: boolean;
  is_completed: boolean;
  is_template: boolean;
  latest_version: number;
  metadata?: unknown;
  workflow_data?: unknown;
  node_count: number;
  tags?: string[] | null;
  user_id?: number;
  username?: string;
  workflow_id: string;
  workflow_name: string;
  workflow_upload_name: string;
  is_shared?: boolean;
  share_roles?: string[] | null;
  share_permissions?: string | null;
  is_accepted?: boolean | null;
  inquire_deploy?: boolean | null;
  is_deployed?: boolean | null;
  enable_deploy?: boolean | null;
}

export type FilterMode = 'all' | 'active' | 'inactive';
