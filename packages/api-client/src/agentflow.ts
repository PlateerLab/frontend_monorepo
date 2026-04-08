'use client';

import { createApiClient } from './index';
import type { ApiClient } from './client';

// ─────────────────────────────────────────────────────────────
// ⚠️  Backend API Naming Convention
// ─────────────────────────────────────────────────────────────
// API paths use "workflow" naming (e.g., /api/workflow/save, /api/workflow/load).
// Request/response fields also use "workflow" (workflow_id, workflow_name, etc.).
//
//   Frontend "agentflow" === Backend "workflow"
//
// Do NOT rename API paths or snake_case fields without backend coordination.
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Agentflow API Types
// ─────────────────────────────────────────────────────────────

export interface AgentflowContent {
    nodes?: any[];
    edges?: any[];
    memos?: any[];
    view?: { x: number; y: number; scale: number };
    workflow_id?: string;
    [key: string]: unknown;
}

export interface AgentflowSaveRequest {
    workflow_name: string;
    workflow_id: string;
    content: AgentflowContent;
    user_id?: number | string;
}

export interface AgentflowListItem {
    workflow_name: string;
    workflow_id: string;
    updated_at?: string;
    created_at?: string;
    user_id?: number;
    username?: string;
    full_name?: string;
    node_count?: number;
    edge_count?: number;
    has_startnode?: boolean;
    has_endnode?: boolean;
    is_completed?: boolean;
    is_shared?: boolean;
    share_roles?: string[] | null;
    share_permissions?: string;
    metadata?: Record<string, unknown>;
    error?: string;
    is_accepted?: boolean;
}

export interface AgentflowLoadResult {
    workflow_name: string;
    workflow_id: string;
    content: AgentflowContent;
    version?: number;
}

export interface AgentflowExistence {
    exists: boolean;
    workflow_id?: string;
}

export interface ExecuteAgentflowOptions {
    workflowName: string;
    workflowId: string;
    inputData?: string | Record<string, unknown>;
    interactionId?: string;
    selectedCollections?: string[];
    selectedFiles?: string[];
    additional_params?: Record<string, unknown>;
    bypass_agents?: string[];
    parallel_workflows?: boolean;
    parallel_chat_code?: string;
    user_id?: string | number;
    signal?: AbortSignal;
    skipAuth?: boolean;
    customBaseUrl?: string;
    useDeployEndpoint?: boolean;
    onData?: (data: any) => void;
    onLog?: (log: any) => void;
    onNodeStatus?: (nodeId: string, status: string) => void;
    onTool?: (tool: any) => void;
    onEnd?: () => void;
    onError?: (error: any) => void;
}

// ─────────────────────────────────────────────────────────────
// Agentflow Name Validation
// ─────────────────────────────────────────────────────────────

function validateAgentflowName(name: string): string {
    if (!name || typeof name !== 'string') {
        throw new Error('Agentflow name is required');
    }
    return name.trim().replace(/[<>:"/\\|?*]/g, '_');
}

function generateAgentflowId(): string {
    return `wf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ─────────────────────────────────────────────────────────────
// Agentflow API Functions
// ─────────────────────────────────────────────────────────────

function getClient(): ApiClient {
    return createApiClient({ service: 'core' });
}

export async function saveAgentflow(
    workflowName: string,
    workflowContent: AgentflowContent,
    workflowId?: string | null,
    userId?: string | number | null,
): Promise<any> {
    const name = validateAgentflowName(workflowName);
    const finalId = workflowId && workflowId !== 'None' ? workflowId : generateAgentflowId();
    const client = getClient();

    const body: AgentflowSaveRequest = {
        workflow_name: name,
        workflow_id: finalId,
        content: { ...workflowContent, workflow_id: finalId },
    };

    if (userId != null) {
        body.user_id = userId;
    }

    const response = await client.post<any>('/api/workflow/save', body);
    return response.data;
}

export async function listAgentflows(): Promise<string[]> {
    const client = getClient();
    const response = await client.get<{ workflows: string[] }>('/api/workflow/list');
    return response.data.workflows || [];
}

export async function listAgentflowsDetail(): Promise<AgentflowListItem[]> {
    const client = getClient();
    const response = await client.get<{ workflows: AgentflowListItem[] }>('/api/workflow/list/detail');
    return response.data.workflows || [];
}

export async function loadAgentflow(workflowId: string, userId?: string | number): Promise<AgentflowLoadResult> {
    const client = getClient();
    const params: Record<string, string> = {};
    if (userId != null) params.user_id = String(userId);
    const response = await client.get<AgentflowLoadResult>(`/api/workflow/load/${encodeURIComponent(workflowId)}`, { params });
    return response.data;
}

export async function deleteAgentflow(workflowId: string): Promise<void> {
    const client = getClient();
    await client.delete(`/api/workflow/delete/${encodeURIComponent(workflowId)}`);
}

export async function checkAgentflowExistence(workflowName: string): Promise<AgentflowExistence> {
    const client = getClient();
    const response = await client.post<AgentflowExistence>(
        `/api/workflow/check/workflow?workflow_name=${encodeURIComponent(workflowName)}`,
        {},
    );
    return response.data;
}

export async function renameAgentflow(oldName: string, newName: string, workflowId: string): Promise<any> {
    const client = getClient();
    const params = new URLSearchParams({
        old_name: oldName,
        new_name: newName,
        workflow_id: workflowId,
    });
    const response = await client.post<any>(`/api/workflow/rename/workflow?${params}`, {});
    return response.data;
}

export async function duplicateAgentflow(workflowId: string, userId?: string | number): Promise<any> {
    const client = getClient();
    let url = `/api/workflow/duplicate/${encodeURIComponent(workflowId)}`;
    if (userId != null) url += `?user_id=${userId}`;
    const response = await client.get<any>(url);
    return response.data;
}

// ─────────────────────────────────────────────────────────────
// SSE-based Execution
// ─────────────────────────────────────────────────────────────

export async function executeAgentflowStream(options: ExecuteAgentflowOptions): Promise<void> {
    const {
        workflowName, workflowId, inputData,
        interactionId, selectedCollections, selectedFiles,
        additional_params, bypass_agents,
        parallel_workflows, parallel_chat_code,
        user_id, signal, skipAuth, customBaseUrl, useDeployEndpoint,
        onData, onLog, onNodeStatus, onTool, onEnd, onError,
    } = options;

    const client = getClient();
    const baseUrl = customBaseUrl || (client as any).baseUrl || '';

    const body: Record<string, unknown> = {
        workflow_name: workflowName,
        workflow_id: workflowId,
    };
    if (inputData) body.input_data = inputData;
    if (interactionId) body.interaction_id = interactionId;
    if (selectedCollections?.length) body.selected_collections = selectedCollections;
    if (selectedFiles?.length) body.selected_files = selectedFiles;
    if (additional_params) body.additional_params = additional_params;
    if (bypass_agents?.length) body.bypass_agents = bypass_agents;
    if (parallel_workflows != null) body.parallel_workflows = parallel_workflows;
    if (parallel_chat_code) body.parallel_chat_code = parallel_chat_code;
    if (user_id != null) body.user_id = user_id;

    try {
        const token = (!skipAuth && typeof document !== 'undefined')
            ? document.cookie.match(/xgen_access_token=([^;]+)/)?.[1] ?? null
            : null;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const streamEndpoint = useDeployEndpoint
            ? `${baseUrl}/api/workflow/execute/based-id/stream/deploy`
            : `${baseUrl}/api/workflow/execute/based-id/stream`;

        const response = await fetch(streamEndpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal,
        });

        if (!response.ok) {
            throw new Error(`Execution failed: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const blocks = buffer.split('\n\n');
            buffer = blocks.pop() ?? '';

            for (const block of blocks) {
                const lines = block.split('\n');
                let eventType = 'message';
                let data: string | null = null;

                for (const line of lines) {
                    if (line.startsWith('event: ')) {
                        eventType = line.substring(7).trim();
                    } else if (line.startsWith('data: ')) {
                        data = line.substring(6).trim();
                    }
                }

                if (!data || data === '[DONE]') continue;

                try {
                    const parsed = JSON.parse(data);

                    if (eventType === 'log') {
                        onLog?.(parsed);
                    } else if (eventType === 'node_status') {
                        onNodeStatus?.(parsed.node_id, parsed.status);
                    } else if (eventType === 'tool') {
                        onTool?.(parsed);
                    } else {
                        // message event - check parsed.type
                        const type = parsed.type;
                        if (type === 'data') {
                            onData?.(parsed.content);
                        } else if (type === 'summary') {
                            if (parsed.data?.outputs?.length > 0) {
                                const output = parsed.data.outputs[0];
                                const outputStr = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
                                onData?.(outputStr);
                            }
                        } else if (type === 'end') {
                            onEnd?.();
                            return;
                        } else if (type === 'error') {
                            throw new Error(parsed.detail || 'Agentflow execution error');
                        } else {
                            onData?.(parsed);
                        }
                    }
                } catch (e) {
                    if ((e as Error).message?.includes('Agentflow execution error')) throw e;
                    // Skip unparseable lines
                }
            }
        }

        onEnd?.();
    } catch (error) {
        if ((error as Error).name !== 'AbortError') {
            onError?.(error);
        }
    }
}

// ─────────────────────────────────────────────────────────────
// Version Management
// ─────────────────────────────────────────────────────────────

export async function listAgentflowVersions(workflowId: string, userId?: string | number): Promise<any[]> {
    const client = getClient();
    const params: Record<string, string> = { workflow_id: workflowId };
    if (userId != null) params.user_id = String(userId);
    const response = await client.get<any>('/api/workflow/version/list', { params });
    return response.data;
}

export async function getAgentflowVersionData(workflowId: string, userId: string | number, version: number): Promise<any> {
    const client = getClient();
    const response = await client.get<any>(
        '/api/workflow/version/data',
        { params: { workflow_id: workflowId, user_id: String(userId), version: String(version) } },
    );
    return response.data;
}

// ─────────────────────────────────────────────────────────────
// Additional Agentflow Functions (matching original backend)
// ─────────────────────────────────────────────────────────────

export async function updateAgentflow(
    workflowId: string,
    updateData: Record<string, unknown>,
): Promise<any> {
    const client = getClient();
    const response = await client.post<any>(
        `/api/workflow/update/${encodeURIComponent(workflowId)}`,
        updateData,
    );
    return response.data;
}

export async function listAgentflowsDetailAdmin(): Promise<AgentflowListItem[]> {
    const client = getClient();
    const response = await client.get<{ workflows: AgentflowListItem[] }>('/api/workflow/list/admin');
    return response.data.workflows || [];
}

export async function updateAgentflowVersion(workflowId: string, version: number): Promise<any> {
    const client = getClient();
    const params = new URLSearchParams({
        workflow_id: workflowId,
        version: String(version),
    });
    const response = await client.post<any>(`/api/workflow/version/change?${params}`, {});
    return response.data;
}

export async function updateAgentflowVersionLabel(
    workflowId: string,
    version: number,
    newVersionLabel: string,
): Promise<any> {
    const client = getClient();
    const params = new URLSearchParams({
        workflow_id: workflowId,
        version: String(version),
        new_version_label: newVersionLabel,
    });
    const response = await client.post<any>(`/api/workflow/version/label-name?${params}`, {});
    return response.data;
}

export async function deleteAgentflowVersion(workflowId: string, version: number): Promise<any> {
    const client = getClient();
    const params = new URLSearchParams({
        workflow_id: workflowId,
        version: String(version),
    });
    const response = await client.delete<any>(`/api/workflow/delete/version?${params}`);
    return response.data;
}

export async function getAgentflowPerformance(
    workflowName: string,
    workflowId: string,
): Promise<any> {
    const client = getClient();
    const params = new URLSearchParams({
        workflow_name: workflowName,
        workflow_id: workflowId,
    });
    const response = await client.get<any>(`/api/workflow/performance?${params}`);
    return response.data;
}

export async function deleteAgentflowPerformance(
    workflowName: string,
    workflowId: string,
): Promise<any> {
    const client = getClient();
    const params = new URLSearchParams({
        workflow_name: workflowName,
        workflow_id: workflowId,
    });
    const response = await client.delete<any>(`/api/workflow/performance?${params}`);
    return response.data;
}

export async function getAgentflowIOLogs(
    workflowName: string,
    workflowId: string,
    interactionId: string = 'default',
): Promise<any> {
    const client = getClient();
    const params = new URLSearchParams({
        workflow_name: workflowName,
        workflow_id: workflowId,
        interaction_id: interactionId,
    });
    const response = await client.get<any>(`/api/workflow/io_logs?${params}`);
    return response.data;
}

export async function rateAgentflowIOLog(
    ioId: string,
    workflowName: string,
    workflowId: string,
    interactionId: string = 'default',
    rating: number = 3,
): Promise<any> {
    const client = getClient();
    const params = new URLSearchParams({
        io_id: ioId,
        workflow_name: workflowName,
        workflow_id: workflowId,
        interaction_id: interactionId,
        rating: String(rating),
    });
    const response = await client.post<any>(`/api/workflow/io_log/rating?${params}`, {});
    return response.data;
}

export async function deleteAgentflowIOLogs(
    workflowName: string,
    workflowId: string,
    interactionId: string = 'default',
): Promise<any> {
    const client = getClient();
    const params = new URLSearchParams({
        workflow_name: workflowName,
        workflow_id: workflowId,
        interaction_id: interactionId,
    });
    const response = await client.delete<any>(`/api/workflow/io_logs?${params}`);
    return response.data;
}

// ─────────────────────────────────────────────────────────────
// Deploy API
// ─────────────────────────────────────────────────────────────

export interface DeployStatus {
    workflow_name: string;
    workflow_id: string;
    is_deployed: boolean;
    deploy_key?: string;
    deploy_name?: string;
    deploy_start_msg?: string;
    deploy_msg_selection?: string[];
    deploy_img?: string;
    deploy_style?: {
        theme?: 'light' | 'dark';
        primaryColor?: string;
        botMessageColor?: string;
        embedWidth?: string;
        embedHeight?: string;
        defaultExpanded?: boolean;
        enableAudio?: boolean;
        enableFile?: boolean;
        enableToolList?: boolean;
        enableAgentList?: boolean;
        suggestedRepliesAlignment?: 'left' | 'center' | 'right';
    };
}

export async function getDeployStatus(workflowId: string, userId: string | number): Promise<DeployStatus> {
    const client = getClient();
    const response = await client.post<DeployStatus>(
        `/api/workflow/deploy/status/${encodeURIComponent(workflowId)}`,
        { user_id: String(userId) },
    );
    return response.data;
}

/** Public version of getDeployStatus that skips authentication (for chatbot page). */
export async function getDeployStatusPublic(workflowId: string, userId: string | number): Promise<DeployStatus> {
    const client = createApiClient({
        getAccessToken: () => null,
        onUnauthorized: () => {},
    });
    const response = await client.post<DeployStatus>(
        `/api/workflow/deploy/status/${encodeURIComponent(workflowId)}`,
        { user_id: String(userId) },
    );
    return response.data;
}

export async function generateEmbedJs(params: {
    workflowId: string;
    userId: string;
    apiHost: string;
    backendApiHost: string;
    workflowName: string;
    uriPrefix?: string;
    embedType?: 'popup' | 'full';
}): Promise<{ url: string }> {
    const client = getClient();
    const response = await client.post<{ url: string }>('/api/workflow/generate-embed', params);
    return response.data;
}

// ─────────────────────────────────────────────────────────────
// Deploy Settings API
// ─────────────────────────────────────────────────────────────

export interface DeployUpdateData {
    deploy_name?: string;
    deploy_start_msg?: string;
    deploy_msg_selection?: string[];
    deploy_img?: string;
    deploy_style?: {
        theme?: 'light' | 'dark';
        primaryColor?: string;
        botMessageColor?: string;
        embedWidth?: string;
        embedHeight?: string;
        defaultExpanded?: boolean;
        enableAudio?: boolean;
        enableFile?: boolean;
        enableToolList?: boolean;
        enableAgentList?: boolean;
        suggestedRepliesAlignment?: 'left' | 'center' | 'right';
    };
    deploy_error_msg?: Record<string, string>;
}

export async function updateDeploySettings(
    workflowId: string,
    updateData: DeployUpdateData,
): Promise<{ message: string; workflow_id: string }> {
    const client = getClient();
    const response = await client.post<{ message: string; workflow_id: string }>(
        `/api/workflow/deploy/update/${encodeURIComponent(workflowId)}`,
        updateData,
    );
    return response.data;
}

export async function uploadDeployImage(
    workflowId: string,
    file: File | null,
    userId?: number | string,
    defaultImage?: boolean,
): Promise<{ message: string; workflow_id: string; deploy_img: string; object_name: string; file_size: number }> {
    // FormData upload requires raw fetch (not JSON)
    const client = getClient();
    const baseUrl = (client as any).baseUrl || '';
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (userId) formData.append('user_id_form', String(userId));
    if (defaultImage) formData.append('default_image', 'true');

    const token = typeof document !== 'undefined'
        ? document.cookie.match(/xgen_access_token=([^;]+)/)?.[1] ?? null
        : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(
        `${baseUrl}/api/workflow/deploy/update/image/${encodeURIComponent(workflowId)}`,
        { method: 'POST', headers, body: formData },
    );
    if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
    return response.json();
}

export async function getDeployImage(workflowId: string, bustCache = true): Promise<string> {
    const client = getClient();
    const baseUrl = (client as any).baseUrl || '';
    const timestamp = bustCache ? `?t=${Date.now()}` : '';

    const token = typeof document !== 'undefined'
        ? document.cookie.match(/xgen_access_token=([^;]+)/)?.[1] ?? null
        : null;
    const headers: Record<string, string> = {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(
        `${baseUrl}/api/workflow/deploy/image/${encodeURIComponent(workflowId)}${timestamp}`,
        { method: 'GET', headers },
    );
    if (!response.ok) throw new Error(`Get image failed: ${response.status}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
}

export async function deleteDeployChat(
    interactionId: string,
): Promise<{ success: boolean; message?: string }> {
    const client = getClient();
    const response = await client.delete<{ success: boolean; message?: string }>(
        `/api/workflow/deploy/logs/${encodeURIComponent(interactionId)}`,
    );
    return response.data;
}

// ─────────────────────────────────────────────────────────────
// Interaction API
// ─────────────────────────────────────────────────────────────

export interface InteractionListFilters {
    interaction_id?: string;
    workflow_id?: string;
    limit?: number;
}

export interface ExecutionMeta {
    id: string;
    interaction_id: string;
    workflow_id: string;
    workflow_name: string;
    interaction_count: number;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export async function listInteractions(
    filters: InteractionListFilters = {},
): Promise<ExecutionMeta[]> {
    const client = getClient();
    const params = new URLSearchParams();
    if (filters.interaction_id) params.append('interaction_id', filters.interaction_id);
    if (filters.workflow_id) params.append('workflow_id', filters.workflow_id);
    params.append('limit', String(filters.limit ?? 1000));
    const response = await client.get<{ execution_meta_list: ExecutionMeta[] }>(`/api/interaction/list?${params}`);
    return response.data.execution_meta_list || [];
}

// ─────────────────────────────────────────────────────────────
// Admin Agentflow Management APIs
// ─────────────────────────────────────────────────────────────

export interface AdminAgentflowMeta {
    id: number;
    workflow_id: string;
    workflow_name: string;
    username: string;
    user_id: number;
    node_count: number;
    updated_at: string;
    created_at?: string;
    has_startnode?: boolean;
    has_endnode?: boolean;
    is_shared: boolean;
    share_roles?: string[] | null;
    share_permissions?: string | null;
    description?: string;
    inquire_deploy?: boolean;
    is_accepted?: boolean;
    is_deployed?: boolean;
    error?: string;
}

export async function getAllAgentflowMetaAdmin(
    page = 1,
    pageSize = 1000,
    userId?: number | null,
): Promise<{ workflows: AdminAgentflowMeta[] }> {
    const client = getClient();
    const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
    });
    if (userId != null) params.set('user_id', String(userId));
    const response = await client.get<{ workflows: AdminAgentflowMeta[] }>(
        `/api/admin/workflow/all-list?${params}`,
    );
    return response.data;
}

export async function deleteAgentflowAdmin(
    workflowId: string,
    userId: number,
): Promise<void> {
    const client = getClient();
    await client.delete(
        `/api/admin/workflow/delete/${encodeURIComponent(workflowId)}?user_id=${userId}`,
    );
}

export async function updateAgentflowAdmin(
    workflowId: string,
    updateData: Record<string, unknown>,
): Promise<any> {
    const client = getClient();
    const response = await client.post<any>(
        `/api/admin/workflow/update/${encodeURIComponent(workflowId)}`,
        updateData,
    );
    return response.data;
}

// ─────────────────────────────────────────────────────────────
// Admin Agentflow Monitoring APIs
// ─────────────────────────────────────────────────────────────

export interface AdminIOLog {
    id: number;
    user_id: number;
    workflow_name: string;
    workflow_id: string;
    interaction_id: string;
    input_data: string;
    output_data: string;
    llm_eval_score?: number | null;
    user_score?: number | null;
    mode?: string;
    created_at: string;
}

export async function getAdminAllIOLogs(
    page = 1,
    pageSize = 50,
    userId?: number | null,
    workflowId?: string | null,
    workflowName?: string | null,
): Promise<{ logs: AdminIOLog[]; total: number }> {
    const client = getClient();
    const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
    });
    if (userId != null) params.set('user_id', String(userId));
    if (workflowId) params.set('workflow_id', workflowId);
    if (workflowName) params.set('workflow_name', workflowName);
    const response = await client.get<{ logs: AdminIOLog[]; total: number }>(
        `/api/admin/workflow/all-io-logs?${params}`,
    );
    return response.data;
}

export interface AdminPerformanceData {
    summary: {
        total_executions: number;
        avg_processing_time_ms: number;
        avg_cpu_usage_percent: number;
        avg_ram_usage_mb: number;
    };
    nodes: AdminNodePerformance[];
}

export interface AdminNodePerformance {
    node_name: string;
    avg_processing_time_ms: number;
    avg_cpu_usage_percent: number;
    avg_ram_usage_mb: number;
    avg_gpu_usage_percent: number;
    avg_gpu_memory_mb: number;
    execution_count: number;
}

export async function getAgentflowPerformanceAdmin(
    userId: number,
    workflowName: string,
    workflowId: string,
): Promise<AdminPerformanceData> {
    const client = getClient();
    const params = new URLSearchParams({
        user_id: String(userId),
        workflow_name: workflowName,
        workflow_id: workflowId,
    });
    const response = await client.get<AdminPerformanceData>(
        `/api/admin/workflow/performance?${params}`,
    );
    return response.data;
}

export async function deleteAgentflowPerformanceAdmin(
    userId: number,
    workflowName: string,
    workflowId: string,
): Promise<void> {
    const client = getClient();
    const params = new URLSearchParams({
        user_id: String(userId),
        workflow_name: workflowName,
        workflow_id: workflowId,
    });
    await client.delete(`/api/admin/workflow/performance?${params}`);
}

export async function getAdminIOLogsForAgentflow(
    userId: number,
    workflowName: string,
    workflowId: string,
): Promise<AdminIOLog[]> {
    const client = getClient();
    const params = new URLSearchParams({
        user_id: String(userId),
        workflow_name: workflowName,
        workflow_id: workflowId,
    });
    const response = await client.get<{ logs: AdminIOLog[] }>(
        `/api/admin/workflow/admin-io-logs?${params}`,
    );
    return response.data.logs ?? [];
}
