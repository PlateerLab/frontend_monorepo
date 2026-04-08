'use client';

import { createApiClient } from './index';

// ─────────────────────────────────────────────────────────────
// Tracker API Functions
// ─────────────────────────────────────────────────────────────

/**
 * 에이전트플로우의 실행 순서를 가져옵니다.
 */
export async function getAgentflowExecutionOrder(
    workflowName: string,
    workflowId: string,
    userId?: string | number | null,
): Promise<any> {
    const client = createApiClient({ service: 'core' });

    const body: Record<string, unknown> = {
        workflow_name: workflowName,
        workflow_id: workflowId,
    };
    if (userId != null) body.user_id = userId;

    const response = await client.post<any>('/api/workflow/execute/tracker/order', body);
    return response.data;
}

/**
 * 에이전트플로우 데이터를 기반으로 실행 순서를 가져옵니다.
 */
export async function getAgentflowExecutionOrderByData(workflowData: any): Promise<any> {
    const client = createApiClient({ service: 'core' });
    const response = await client.post<any>('/api/workflow/execute/tracker/order-by-data', workflowData);
    return response.data;
}

/**
 * 에이전트플로우 데이터를 기반으로 자동 정렬 레이아웃 데이터를 가져옵니다.
 */
export async function getAgentflowExecutionLayoutByData(workflowData: any): Promise<any> {
    const client = createApiClient({ service: 'core' });
    const response = await client.post<any>('/api/workflow/execute/tracker/layout-by-data?debug=true', workflowData);
    return response.data;
}
