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
  getUserFromToken,
  decodeJwtPayload,
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
  JwtPayload,
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
  // Admin workflow APIs
  getAllWorkflowMetaAdmin,
  deleteWorkflowAdmin,
  updateWorkflowAdmin,
  getAdminAllIOLogs,
  getWorkflowPerformanceAdmin,
  deleteWorkflowPerformanceAdmin,
  getAdminIOLogsForWorkflow,
} from './workflow';
export type {
  WorkflowContent,
  WorkflowSaveRequest,
  WorkflowListItem,
  WorkflowLoadResult,
  WorkflowExistence,
  ExecuteWorkflowOptions,
  DeployStatus,
  AdminWorkflowMeta,
  AdminIOLog,
  AdminPerformanceData,
  AdminNodePerformance,
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

// Admin User API exports
export {
  getAllUsers,
  getStandbyUsers,
  approveUser,
  deleteUser as deleteAdminUser,
  editUser,
  addUserGroup,
  removeUserGroup,
  updateUserAvailableAdminSections,
  updateUserAvailableUserSections,
} from './admin-users';

// Admin Group API exports
export {
  getAllGroups,
  getAllGroupsList,
  createGroup,
  getGroupUsers,
  updateGroupPermissions,
  deleteGroup,
} from './admin-groups';

// Admin System API exports
export {
  getSystemStatus,
  getServerStatus,
  streamSystemStatus,
  getBackendLogs,
  formatBytes,
  formatUptime,
  getCPUStatus,
  getMemoryStatus,
  getDiskStatus,
  getSecurityPolicies,
  getIPRules,
  getTokenPolicies,
  toggleSecurityPolicy,
  getSystemAuditLogs,
  getSystemErrorLogs,
  resolveErrorLog,
} from './admin-system';
export type {
  SystemData,
  CPUInfo,
  MemoryInfo,
  GPUInfo,
  NetworkInfo,
  DiskInfo,
  ServiceInfo,
  BackendLog,
  BackendLogsResponse,
  ResourceStatus,
  SecurityPolicy,
  IPRule,
  TokenPolicy,
  AuditEventCategory,
  AuditEventStatus,
  AuditEvent,
  AuditEventsResponse,
  ErrorLevel,
  ErrorLogEntry,
  ErrorLogsResponse,
} from './admin-system';

// Admin Database API exports
export {
  getDatabaseInfo,
  getTableList,
  getTableStructure,
  getTableSampleData,
  getTableRowCount,
  executeQuery,
  getAllTablesInfo,
} from './admin-database';
export type {
  TableInfo,
  QueryResult,
  DatabaseInfo,
  ColumnInfo,
} from './admin-database';

// Admin Crawler API exports
export {
  getCrawlerSessions,
  getCrawlerSessionDetail,
  createCrawlerSession,
  cancelCrawlerSession,
  deleteCrawlerSessionData,
  getCrawlerPages,
  getCrawlerPageDetail,
  startCrawlerSessionIndexing,
  integrateCrawlerSessionDocuments,
  subscribeToCrawlerSessionEvents,
} from './admin-crawler';
export type {
  CrawlerSessionStatus,
  CrawlerSessionSummary,
  CrawlerSessionDetail,
  CreateCrawlerSessionRequest,
  CrawlerPage,
  CrawlerPagesResponse,
  StartIndexingRequest,
} from './admin-crawler';

// Admin MCP API exports
export {
  checkMCPHealth,
  checkMCPDetailedHealth,
  listMCPSessions,
  getMCPSession,
  createMCPSession,
  deleteMCPSession,
  getMCPSessionTools,
  sendMCPRequest,
  callMCPTool,
  listMCPTools,
  listMCPPrompts,
  getMCPPrompt,
  listMCPResources,
  readMCPResource,
  getMCPMarketList,
  authLoginMCPSession,
  authStatusMCPSession,
  authLogoutMCPSession,
  createPythonMCPSession,
  createNodeMCPSession,
  transformMCPItemResponse,
} from './admin-mcp';
export type {
  MCPCategory,
  MCPItem,
  MCPItemResponse,
  MCPMarketListResponse,
  MCPSession,
  MCPTool,
  MCPPrompt,
  MCPResource,
  MCPHealthResponse,
  CreateMCPSessionRequest,
  MCPAuthStatus,
  MCPSearchFilters,
} from './admin-mcp';

// Admin Model Management API exports
export {
  listGPUs,
  loadModel,
  unloadModel,
  unloadAllModels,
  listModels,
  checkModelHealth,
  getLoadingStatus,
  getDefaultModelConfig,
} from './admin-models';
export type {
  GPUListItem,
  GPUListResponse,
  ModelBackend,
  LoadModelRequest,
  ModelInfo,
  ModelListResponse,
  ModelHealthStatus,
  LoadingStatusResponse,
  DefaultModelConfig,
} from './admin-models';

// Admin Governance API exports
export {
  // Workflow Approval
  getApprovalRequests,
  getWorkflowApprovalDetail,
  reviewGovernanceWorkflow,
  // Risk Review
  getWorkflowRiskAssessments,
  getWorkflowRiskDetail,
  updateRiskAssessment,
  submitGovernanceReview,
  getRiskChangeHistory,
  // File Management
  getGovernanceFiles,
  uploadGovernanceFile,
  downloadGovernanceFile,
  deleteGovernanceFile,
  // Monitoring / Inspections
  getMonitoringWorkflows,
  getInspections,
  getInspectionDetail,
  createInspection,
  updateInspection,
  deleteInspection,
  getOverdueInspections,
  // Control Policy - PII
  getPIIsList,
  createPII,
  updatePII,
  deletePII,
  // Control Policy - Forbidden Words
  getForbiddenWordsList,
  createForbiddenWord,
  updateForbiddenWord,
  deleteForbiddenWord,
  // Control Policy - Risk Policy
  getActiveRiskPolicy,
  getRiskPolicyVersions,
  saveRiskPolicy,
  clearRiskPolicyHistory,
  // Legacy aliases
  getPolicyRules,
  createPolicyRule,
  updatePolicyRule,
  deletePolicyRule,
  getRiskPolicies,
  createRiskPolicy,
  // Operation History
  getOperationLogs,
  getOperationStats,
  // Audit Tracking
  getAuditLogs,
  getTrackedWorkflows,
  getAuditTrackingStats,
  getWorkflowAuditTimeline,
} from './admin-governance';
export type {
  RiskLevel,
  GovernanceStatus,
  ChecklistItem,
  ChecklistCategory,
  RiskAssessment,
  RiskChangeHistory,
  GovernanceFile,
  ApprovalStatus,
  ApprovalRequest,
  NodeSummary,
  WorkflowDetail,
  ReviewHistoryEntry,
  CombinedHistoryEntry,
  OverdueItem,
  WorkflowSummary,
  InspectionCycle,
  InspectionType,
  InspectionResult,
  InspectionRecord,
  PolicyRule,
  RiskPolicy,
  RiskPolicyCategory,
  RiskPolicyVersion,
  ActivityType,
  OperationResult,
  OperationLog,
  OperationStats,
  AuditAction,
  AuditLogEntry,
  TrackedWorkflow,
  AuditStats,
  TimelineEntry,
} from './admin-governance';
