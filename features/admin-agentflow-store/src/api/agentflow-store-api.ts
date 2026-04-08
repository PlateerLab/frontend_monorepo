import { createApiClient } from '@xgen/api-client';
import type { Agentflow } from '../types';

const api = createApiClient();

// ─────────────────────────────────────────────────────────────
// Agentflow Store APIs
// ─────────────────────────────────────────────────────────────

export async function listAgentflowStore(): Promise<{ workflows: Agentflow[] }> {
  const res = await api.get<{ workflows: Agentflow[] }>(
    '/api/workflow/store/list',
  );
  return res.data;
}

export async function deleteAgentflowFromStore(
  workflowId: string,
  currentVersion: number,
  isTemplate: boolean,
): Promise<void> {
  await api.delete('/api/workflow/store/delete', {
    params: {
      workflow_id: workflowId,
      current_version: currentVersion,
      is_template: isTemplate,
    },
  });
}

export async function updateAgentflowDeploy(
  workflowId: string,
  updateDict: Record<string, unknown>,
): Promise<void> {
  await api.post(
    `/api/admin/workflow/update/${encodeURIComponent(workflowId)}`,
    updateDict,
  );
}
