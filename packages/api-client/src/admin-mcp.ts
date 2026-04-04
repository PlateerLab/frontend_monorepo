'use client';

import { createApiClient } from './index';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type MCPCategory =
  | 'all'
  | 'dev-tools'
  | 'productivity'
  | 'ai'
  | 'data-analysis'
  | 'business'
  | 'media'
  | 'integration'
  | 'other';

/** 프론트엔드에서 사용하는 MCP 마켓 아이템 (camelCase) */
export interface MCPItem {
  id: string;
  name: string;
  author: string;
  description: string;
  iconUrl?: string;
  downloads: number;
  stars: number;
  category: string;
  status: '우수' | '양호' | '일반';
  lastUpdated: string;
  version?: string;
  serverType?: 'python' | 'node';
  serverCommand?: string;
  serverArgs?: string[];
  envVars?: Record<string, string>;
  workingDir?: string;
  additionalCommands?: string[];
  language?: string;
  features?: string[];
  repository?: string;
  documentation?: string;
  source?: 'default' | 'db';
}

/** API 응답에서 받는 원본 MCP 아이템 타입 (snake_case) */
export interface MCPItemResponse {
  item_id: string;
  name: string;
  author: string;
  description: string;
  icon_url?: string;
  downloads: number;
  stars: number;
  category: string;
  status: '우수' | '양호' | '일반';
  last_updated: string;
  version?: string;
  server_type?: 'python' | 'node';
  server_command?: string;
  server_args?: string[];
  env_vars?: Record<string, string>;
  working_dir?: string;
  language?: string;
  features?: string[];
  repository?: string;
  documentation?: string;
  additional_commands?: string[];
  source?: 'default' | 'db';
}

/** MCP 마켓 목록 API 응답 타입 */
export interface MCPMarketListResponse {
  success: boolean;
  items: MCPItemResponse[];
  total_count: number;
}

/** API 응답을 프론트엔드 타입으로 변환 */
export function transformMCPItemResponse(item: MCPItemResponse): MCPItem {
  return {
    id: item.item_id,
    name: item.name,
    author: item.author,
    description: item.description,
    iconUrl: item.icon_url,
    downloads: item.downloads,
    stars: item.stars,
    category: item.category,
    status: item.status,
    lastUpdated: item.last_updated,
    version: item.version,
    serverType: item.server_type,
    serverCommand: item.server_command,
    serverArgs: item.server_args,
    envVars: item.env_vars,
    workingDir: item.working_dir,
    language: item.language,
    features: item.features,
    repository: item.repository,
    documentation: item.documentation,
    additionalCommands: item.additional_commands,
    source: item.source,
  };
}

export interface MCPSession {
  session_id: string;
  session_name?: string;
  server_type: string;
  server_command?: string;
  server_args?: string[];
  status: string;
  created_at: string;
  pid?: number;
  error_message?: string;
  user_id?: string;
}

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{ name: string; description?: string; required?: boolean }>;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPHealthResponse {
  status: string;
  sessions_count?: number;
}

export interface CreateMCPSessionRequest {
  session_name?: string;
  server_type: string;
  server_command: string;
  server_args?: string[];
  env_vars?: Record<string, string>;
  working_dir?: string;
  additional_commands?: string[];
}

export interface MCPAuthStatus {
  authenticated: boolean;
  device_code?: string;
  verification_uri?: string;
  verification_url?: string;
  user_code?: string;
  expires_in?: number;
  status?: string;
  message?: string;
}

export interface MCPSearchFilters {
  category?: string;
  searchQuery?: string;
  sortBy?: 'downloads' | 'stars' | 'updated' | 'name';
}

// ─────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────

function getClient() {
  const raw = createApiClient();
  return {
    async get<T>(endpoint: string, config?: Parameters<typeof raw.get>[1]): Promise<T> {
      const res = await raw.get<T>(endpoint, config);
      return res.data;
    },
    async post<T>(endpoint: string, body?: unknown, config?: Parameters<typeof raw.post>[2]): Promise<T> {
      const res = await raw.post<T>(endpoint, body, config);
      return res.data;
    },
    async delete<T>(endpoint: string, body?: unknown, config?: Parameters<typeof raw.delete>[2]): Promise<T> {
      const res = await raw.delete<T>(endpoint, body, config);
      return res.data;
    },
  };
}

/** MCP Station 헬스 체크 */
export async function checkMCPHealth(): Promise<MCPHealthResponse> {
  const client = getClient();
  return client.get<MCPHealthResponse>('/api/mcp/health');
}

/** MCP Station 상세 헬스 */
export async function checkMCPDetailedHealth(): Promise<MCPHealthResponse> {
  const client = getClient();
  return client.get<MCPHealthResponse>('/api/mcp/health/detailed');
}

/** MCP 세션 목록 */
export async function listMCPSessions(): Promise<MCPSession[]> {
  const client = getClient();
  return client.get<MCPSession[]>('/api/mcp/sessions');
}

/** MCP 세션 상세 */
export async function getMCPSession(sessionId: string): Promise<MCPSession> {
  const client = getClient();
  return client.get<MCPSession>(`/api/mcp/sessions/${encodeURIComponent(sessionId)}`);
}

/** MCP 세션 생성 */
export async function createMCPSession(
  request: CreateMCPSessionRequest,
): Promise<MCPSession> {
  const client = getClient();
  return client.post<MCPSession>('/api/mcp/sessions', request);
}

/** MCP 세션 삭제 */
export async function deleteMCPSession(sessionId: string): Promise<void> {
  const client = getClient();
  await client.delete<void>(`/api/mcp/sessions/${encodeURIComponent(sessionId)}`);
}

/** MCP 세션 도구 목록 */
export async function getMCPSessionTools(sessionId: string): Promise<MCPTool[]> {
  const client = getClient();
  return client.get<MCPTool[]>(`/api/mcp/sessions/${encodeURIComponent(sessionId)}/tools`);
}

/** MCP 서버로 요청 라우팅 (범용) */
export async function sendMCPRequest(mcpRequest: {
  session_id: string;
  method: string;
  params?: Record<string, unknown>;
}): Promise<unknown> {
  const client = getClient();
  return client.post<unknown>('/api/mcp/request', mcpRequest);
}

/** MCP 도구 호출 */
export async function callMCPTool(
  sessionId: string,
  toolName: string,
  args?: unknown,
): Promise<unknown> {
  return sendMCPRequest({
    session_id: sessionId,
    method: 'tools/call',
    params: { name: toolName, arguments: args ?? {} },
  });
}

/** MCP 도구 목록 (MCP request 경유) */
export async function listMCPTools(sessionId: string): Promise<unknown> {
  return sendMCPRequest({
    session_id: sessionId,
    method: 'tools/list',
    params: {},
  });
}

/** MCP 프롬프트 목록 */
export async function listMCPPrompts(sessionId: string): Promise<MCPPrompt[]> {
  return sendMCPRequest({
    session_id: sessionId,
    method: 'prompts/list',
    params: {},
  }) as Promise<MCPPrompt[]>;
}

/** MCP 프롬프트 가져오기 */
export async function getMCPPrompt(
  sessionId: string,
  promptName: string,
  args?: Record<string, unknown>,
): Promise<unknown> {
  return sendMCPRequest({
    session_id: sessionId,
    method: 'prompts/get',
    params: { name: promptName, arguments: args ?? {} },
  });
}

/** MCP 리소스 목록 */
export async function listMCPResources(sessionId: string): Promise<MCPResource[]> {
  return sendMCPRequest({
    session_id: sessionId,
    method: 'resources/list',
    params: {},
  }) as Promise<MCPResource[]>;
}

/** MCP 리소스 읽기 */
export async function readMCPResource(sessionId: string, uri: string): Promise<unknown> {
  return sendMCPRequest({
    session_id: sessionId,
    method: 'resources/read',
    params: { uri },
  });
}

/** MCP 마켓 목록 */
export async function getMCPMarketList(): Promise<MCPMarketListResponse> {
  const client = getClient();
  return client.get<MCPMarketListResponse>('/api/mcp/market/list');
}

/** MS365 MCP 인증 로그인 */
export async function authLoginMCPSession(sessionId: string): Promise<MCPAuthStatus> {
  const client = getClient();
  return client.post<MCPAuthStatus>(`/api/mcp/sessions/${encodeURIComponent(sessionId)}/auth/login`);
}

/** MS365 MCP 인증 상태 */
export async function authStatusMCPSession(sessionId: string): Promise<MCPAuthStatus> {
  const client = getClient();
  return client.get<MCPAuthStatus>(`/api/mcp/sessions/${encodeURIComponent(sessionId)}/auth/status`);
}

/** MS365 MCP 인증 로그아웃 */
export async function authLogoutMCPSession(sessionId: string): Promise<void> {
  const client = getClient();
  await client.post<void>(`/api/mcp/sessions/${encodeURIComponent(sessionId)}/auth/logout`);
}

/** Python MCP 세션 생성 편의 함수 */
export async function createPythonMCPSession(
  scriptPath: string,
  args: string[] = [],
  envVars: Record<string, string> = {},
  workingDir?: string,
  sessionName?: string,
  additionalCommands?: string[],
): Promise<MCPSession> {
  return createMCPSession({
    server_type: 'python',
    server_command: scriptPath,
    server_args: args,
    env_vars: envVars,
    working_dir: workingDir,
    session_name: sessionName,
    additional_commands: additionalCommands,
  });
}

/** Node MCP 세션 생성 편의 함수 */
export async function createNodeMCPSession(
  scriptPath: string,
  args: string[] = [],
  envVars: Record<string, string> = {},
  workingDir?: string,
  sessionName?: string,
  additionalCommands?: string[],
): Promise<MCPSession> {
  return createMCPSession({
    server_type: 'node',
    server_command: scriptPath,
    server_args: args,
    env_vars: envVars,
    working_dir: workingDir,
    session_name: sessionName,
    additional_commands: additionalCommands,
  });
}
