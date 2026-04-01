'use client';

import { ApiClient, type ApiClientConfig, type RequestConfig } from './client';
import { getBackendUrl, type BackendService } from '@xgen/config';

// ─────────────────────────────────────────────────────────────
// API Client Factory
// ─────────────────────────────────────────────────────────────

let defaultClient: ApiClient | null = null;
const serviceClients: Map<BackendService, ApiClient> = new Map();

// 쿠키에서 토큰 읽기
function getAccessTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(/xgen_access_token=([^;]+)/);
  return match ? match[1] : null;
}

// 기본 인증 해제 핸들러
function defaultOnUnauthorized(): void {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export interface CreateApiClientOptions {
  service?: BackendService;
  getAccessToken?: () => string | null;
  onUnauthorized?: () => void;
  onError?: (error: { code: string; message: string }) => void;
}

/**
 * API 클라이언트 생성/조회
 *
 * @example
 * ```ts
 * // 기본 클라이언트 (core 서비스)
 * const api = createApiClient();
 * const data = await api.get<UserList>('/users');
 *
 * // 특정 서비스 클라이언트
 * const mlApi = createApiClient({ service: 'ml' });
 * const models = await mlApi.get<ModelList>('/models');
 * ```
 */
export function createApiClient(options: CreateApiClientOptions = {}): ApiClient {
  const {
    service = 'core',
    getAccessToken = getAccessTokenFromCookie,
    onUnauthorized = defaultOnUnauthorized,
    onError,
  } = options;

  // 캐시된 클라이언트가 있으면 반환
  if (service === 'core' && defaultClient && !options.getAccessToken && !options.onError) {
    return defaultClient;
  }

  const cached = serviceClients.get(service);
  if (cached && !options.getAccessToken && !options.onError) {
    return cached;
  }

  // 새 클라이언트 생성
  const config: ApiClientConfig = {
    baseUrl: getBackendUrl(service),
    getAccessToken,
    onUnauthorized,
    onError,
  };

  const client = new ApiClient(config);

  // 캐시에 저장
  if (!options.getAccessToken && !options.onError) {
    if (service === 'core') {
      defaultClient = client;
    } else {
      serviceClients.set(service, client);
    }
  }

  return client;
}

/**
 * 기본 API 클라이언트 반환 (createApiClient() 단축)
 */
export function getApiClient(): ApiClient {
  return createApiClient();
}

// Re-exports
export { ApiClient } from './client';
export type { ApiClientConfig, RequestConfig } from './client';
export type { ApiResponse, ApiError, PaginatedResponse } from '@xgen/types';

// Auth exports
export {
  login,
  logout,
  signup,
  signupGuest,
  validateToken,
  getCurrentUser,
  getUserFromCookie,
  hashPassword,
  getCookie,
  setCookie,
  deleteCookie,
  clearAllAuthCookies,
} from './auth';
export type {
  LoginData,
  LoginResult,
  SignupData,
  SignupResult,
  TokenValidationResult,
  UserInfo,
} from './auth';

// Workflow API exports
export {
  saveWorkflow,
  listWorkflows,
  listWorkflowsDetail,
  listWorkflowsDetailAdmin,
  loadWorkflow,
  deleteWorkflow,
  checkWorkflowExistence,
  renameWorkflow,
  duplicateWorkflow,
  executeWorkflowStream,
  listWorkflowVersions,
  getWorkflowVersionData,
  updateWorkflow,
  updateWorkflowVersion,
  updateWorkflowVersionLabel,
  deleteWorkflowVersion,
  getWorkflowPerformance,
  deleteWorkflowPerformance,
  getWorkflowIOLogs,
  rateWorkflowIOLog,
  deleteWorkflowIOLogs,
  getDeployStatus,
  generateEmbedJs,
} from './workflow';
export type {
  WorkflowContent,
  WorkflowSaveRequest,
  WorkflowListItem,
  WorkflowLoadResult,
  WorkflowExistence,
  ExecuteWorkflowOptions,
  DeployStatus,
} from './workflow';

// Node API exports
export {
  getNodes,
  getNodeDetail,
  exportNodes,
  useNodes,
} from './nodes';
export type {
  NodeCategory,
  NodeFunction,
  NodeSpec,
  NodeDetail,
  UseNodesReturn,
} from './nodes';

// Tracker API exports
export {
  getWorkflowExecutionOrder,
  getWorkflowExecutionOrderByData,
  getWorkflowExecutionLayoutByData,
} from './tracker';
