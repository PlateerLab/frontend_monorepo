'use client';

import { createApiClient } from './index';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

// --- Common ---
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
export type GovernanceStatus = 'pending' | 'approved' | 'rejected';

// --- Risk Management / Risk Review ---
export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface ChecklistCategory {
  name: string;
  weight: string;
  items: ChecklistItem[];
}

export interface RiskAssessment {
  workflow_id: string;
  workflow_name: string;
  risk_level: RiskLevel;
  governance_status: GovernanceStatus;
  score: number;
  checklist: ChecklistCategory[];
  reviewer?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  owner_name?: string;
  owner_department?: string;
  impact_scope?: string;
  rationale?: string;
  is_risk_assessed?: boolean;
  is_deployed?: boolean;
  is_governance_accepted?: boolean;
  governance_reviewed_by?: string;
  governance_review_comment?: string;
}

export interface RiskChangeHistory {
  id: number;
  workflow_id: string;
  previous_level: RiskLevel;
  new_level: RiskLevel;
  reason: string;
  changed_by: string;
  changed_at: string;
  impact_scope?: string;
  rationale?: string;
}

export interface GovernanceFile {
  id: string;
  name: string;
  size: number;
  uploaded_at: string;
  uploaded_by: string;
}

// --- Workflow Approval ---
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalRequest {
  id: string;
  workflow_id: string;
  workflow_name: string;
  requester: string;
  requester_department?: string;
  status: ApprovalStatus;
  requested_at: string;
  reviewed_at?: string;
  reviewer?: string;
  reason?: string;
  is_governance_accepted?: boolean;
  governance_reviewed_by?: string;
  governance_review_comment?: string;
}

export interface NodeSummary {
  nodeId: string;
  nodeName: string;
  functionId: string;
  category: string;
  parameters: Record<string, unknown>;
  inputs: string[];
  outputs: string[];
}

export interface WorkflowDetail {
  workflow_id: string;
  workflow_name: string;
  owner_name: string;
  owner_department?: string;
  governance_status: GovernanceStatus;
  is_governance_accepted?: boolean;
  governance_reviewed_by?: string;
  governance_review_comment?: string;
  risk_level?: RiskLevel;
  is_deployed?: boolean;
  created_at: string;
  updated_at: string;
  current_version?: number;
  node_count?: number;
  edge_count?: number;
  node_summaries?: NodeSummary[];
  edges?: Array<{ source: string; target: string }>;
  canvas_data?: unknown;
  impact_scope?: string;
  rationale?: string;
  risk_history?: RiskChangeHistory[];
  review_history?: ReviewHistoryEntry[];
  combined_history?: CombinedHistoryEntry[];
}

export interface ReviewHistoryEntry {
  id: number;
  type: 'review';
  action: string;
  comment?: string;
  reviewer: string;
  reviewed_at: string;
  status_change?: { from: string; to: string };
}

export interface CombinedHistoryEntry {
  id: number;
  type: 'risk_change' | 'review';
  timestamp: string;
  performer: string;
  description: string;
  details?: Record<string, unknown>;
}

// --- Monitoring / Inspections ---
export type InspectionCycle = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
export type InspectionType = 'regular' | 'ad-hoc' | 'emergency';
export type InspectionResult = 'normal' | 'needs-improvement' | 'urgent-action' | 'incomplete';

export interface InspectionRecord {
  id: number;
  workflowId: string;
  workflowName: string;
  inspectionCycle: InspectionCycle;
  inspectionType: InspectionType;
  inspectionDate: string;
  nextInspectionDate: string;
  inspectionResult: InspectionResult;
  inspectionItems: string;
  inspectionContent: string;
  issueManagement: string;
  applicableScope: string;
  managerId: number;
  managerName: string;
}

export interface OverdueItem {
  id: number;
  workflowId: string;
  workflowName: string;
  expectedDate: string;
  overdueDays: number;
  inspectionCycle: InspectionCycle;
  managerName: string;
}

export interface WorkflowSummary {
  workflowId: string;
  workflowName: string;
  inspectionCount: number;
  latestInspection?: InspectionRecord;
}

// --- Control Policy ---
export interface PolicyRule {
  id: string;
  name: string;
  type: 'pii' | 'forbidden-word';
  pattern: string;
  replacement?: string;
  description?: string;
  masking?: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface RiskPolicy {
  id: string;
  version: number;
  grade_config: Record<RiskLevel, { min: number; max: number }>;
  categories?: RiskPolicyCategory[];
  active: boolean;
  created_at: string;
}

export interface RiskPolicyCategory {
  name: string;
  weight: string;
  items: Array<{ id: string; label: string }>;
}

export interface RiskPolicyVersion {
  version: number;
  created_at: string;
  created_by: string;
  change_summary?: string;
  is_active: boolean;
}

// --- Operation History ---
export type ActivityType =
  | 'workflow_change'
  | 'model_change'
  | 'policy_change'
  | 'deploy_approval'
  | 'deploy_rejection'
  | 'deploy_request'
  | 'permission_change'
  | 'monitoring_record'
  | 'data_change';

export type OperationResult = 'success' | 'failure' | 'pending';

export interface OperationLog {
  id: number;
  timestamp: string;
  activityType: ActivityType;
  activityTypeLabel?: string;
  activityDetail: string;
  workflowId?: string;
  workflowName?: string;
  targetType?: string;
  targetName?: string;
  result: OperationResult;
  resultLabel?: string;
  details: Record<string, unknown> | null;
  creatorId?: number;
  creatorName?: string;
  creatorDepartment?: string;
  handlerId?: number;
  handlerName?: string;
  handlerDepartment?: string;
  performerId?: number;
  performerName?: string;
  performerDepartment?: string;
  approvalStatus?: string;
  approverName?: string;
}

export interface OperationStats {
  total: number;
  success: number;
  failure: number;
  pending: number;
  by_type?: Record<string, number>;
}

// --- Audit Tracking ---
export type AuditAction =
  | 'governance_full_approval'
  | 'governance_review'
  | 'workflow_modified'
  | 'approval_revoked'
  | 'deploy_status_change'
  | 'system_approval_change';

export interface AuditLogEntry {
  id: number;
  action: AuditAction;
  targetId: string;
  targetName: string;
  description: string;
  details: Record<string, unknown> | null;
  performerId: number;
  performerName: string;
  ipAddress: string;
  createdAt: string;
}

export interface TrackedWorkflow {
  workflowId: string;
  workflowName: string;
  userId?: number;
  ownerName: string;
  ownerDepartment?: string;
  isDeployed: boolean;
  isAccepted: boolean;
  isGovernanceAccepted: boolean;
  governanceReviewedBy?: string;
  createdAt: string;
  updatedAt: string;
  trackingStatus?: string;
  lastAuditDate?: string;
  auditCount?: number;
}

export interface AuditStats {
  totalLogs: number;
  trackedWorkflows: number;
  fullApprovalCount: number;
  revokedCount: number;
  actionCounts?: Record<string, number>;
}

export interface TimelineEntry {
  id: number;
  action: AuditAction;
  description: string;
  performerName: string;
  details?: Record<string, unknown>;
  createdAt: string;
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
    async put<T>(endpoint: string, body?: unknown, config?: Parameters<typeof raw.put>[2]): Promise<T> {
      const res = await raw.put<T>(endpoint, body, config);
      return res.data;
    },
    async delete<T>(endpoint: string, body?: unknown, config?: Parameters<typeof raw.delete>[2]): Promise<T> {
      const res = await raw.delete<T>(endpoint, body, config);
      return res.data;
    },
    async upload<T>(endpoint: string, formData: FormData, config?: Parameters<typeof raw.upload>[2]): Promise<T> {
      const res = await raw.upload<T>(endpoint, formData, config);
      return res.data;
    },
  };
}

// ─── Workflow Approval ────────────────────────────────────────

/** 거버넌스 승인 대기 워크플로우 목록 */
export async function getApprovalRequests(): Promise<ApprovalRequest[]> {
  const client = getClient();
  return client.get<ApprovalRequest[]>('/api/admin/governance/workflow-approval/workflows');
}

/** 워크플로우 상세 정보 (캔버스, 노드 요약 포함) */
export async function getWorkflowApprovalDetail(workflowId: string): Promise<WorkflowDetail> {
  const client = getClient();
  return client.get<WorkflowDetail>(`/api/admin/governance/workflow-approval/workflows/${encodeURIComponent(workflowId)}/detail`);
}

/** 워크플로우 거버넌스 승인/거부 */
export async function reviewGovernanceWorkflow(
  workflowId: string,
  isAccepted: boolean,
  comment?: string,
): Promise<unknown> {
  const client = getClient();
  return client.post(`/api/admin/governance/workflow-approval/workflows/${encodeURIComponent(workflowId)}/review`, {
    is_governance_accepted: isAccepted,
    comment,
  });
}

// ─── Risk Review (통합 리스크 + 거버넌스 리뷰) ─────────────────

/** 리스크 리뷰 워크플로우 목록 */
export async function getWorkflowRiskAssessments(): Promise<RiskAssessment[]> {
  const client = getClient();
  return client.get<RiskAssessment[]>('/api/admin/governance/risk-review/workflows');
}

/** 리스크 리뷰 워크플로우 상세 */
export async function getWorkflowRiskDetail(workflowId: string): Promise<WorkflowDetail> {
  const client = getClient();
  return client.get<WorkflowDetail>(`/api/admin/governance/risk-review/workflows/${encodeURIComponent(workflowId)}/detail`);
}

/** 리스크 등급 업데이트 */
export async function updateRiskAssessment(
  workflowId: string,
  data: {
    risk_level: RiskLevel;
    rationale?: string;
    impact_scope?: string;
    score?: number;
    checklist?: ChecklistCategory[];
  },
): Promise<unknown> {
  const client = getClient();
  return client.put(`/api/admin/governance/risk-review/workflows/${encodeURIComponent(workflowId)}/risk-level`, data);
}

/** 거버넌스 리뷰 제출 (승인/거부/조건부 승인) */
export async function submitGovernanceReview(
  workflowId: string,
  data: {
    action: 'approve' | 'reject' | 'conditional_approve';
    comment?: string;
    conditions?: string[];
  },
): Promise<unknown> {
  const client = getClient();
  return client.post(`/api/admin/governance/risk-review/workflows/${encodeURIComponent(workflowId)}/review`, data);
}

/** 리스크 변경 이력 */
export async function getRiskChangeHistory(workflowId: string): Promise<CombinedHistoryEntry[]> {
  const client = getClient();
  return client.get<CombinedHistoryEntry[]>(`/api/admin/governance/risk-review/workflows/${encodeURIComponent(workflowId)}/history`);
}

// ─── File Management ──────────────────────────────────────────

/** 거버넌스 파일 목록 */
export async function getGovernanceFiles(workflowId: string): Promise<GovernanceFile[]> {
  const client = getClient();
  return client.get<GovernanceFile[]>(`/api/admin/governance/risk/workflows/${encodeURIComponent(workflowId)}/files`);
}

/** 거버넌스 파일 업로드 */
export async function uploadGovernanceFile(workflowId: string, file: File): Promise<GovernanceFile> {
  const client = getClient();
  const formData = new FormData();
  formData.append('file', file);
  return client.upload<GovernanceFile>(`/api/admin/governance/risk/workflows/${encodeURIComponent(workflowId)}/files`, formData);
}

/** 거버넌스 파일 다운로드 */
export async function downloadGovernanceFile(fileId: string, fileName: string): Promise<void> {
  const client = getClient();
  const blob = await client.get<Blob>(`/api/admin/governance/risk/files/${encodeURIComponent(fileId)}/download`, {
    responseType: 'blob',
  } as Record<string, unknown>);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
}

/** 거버넌스 파일 삭제 */
export async function deleteGovernanceFile(fileId: string): Promise<void> {
  const client = getClient();
  await client.delete<void>(`/api/admin/governance/risk/files/${encodeURIComponent(fileId)}`);
}

// ─── Monitoring / Inspections ─────────────────────────────────

/** 모니터링 워크플로우 목록 */
export async function getMonitoringWorkflows(): Promise<WorkflowSummary[]> {
  const client = getClient();
  return client.get<WorkflowSummary[]>('/api/admin/governance/monitoring/workflows');
}

/** 점검 이력 목록 (필터 지원) */
export async function getInspections(params?: {
  workflow_id?: string;
  cycle?: InspectionCycle;
  type?: InspectionType;
  result?: InspectionResult;
}): Promise<InspectionRecord[]> {
  const client = getClient();
  const queryParams: Record<string, string> = {};
  if (params?.workflow_id) queryParams.workflow_id = params.workflow_id;
  if (params?.cycle) queryParams.cycle = params.cycle;
  if (params?.type) queryParams.type = params.type;
  if (params?.result) queryParams.result = params.result;
  return client.get<InspectionRecord[]>('/api/admin/governance/monitoring/inspections', {
    params: queryParams,
  });
}

/** 점검 상세 */
export async function getInspectionDetail(inspectionId: number): Promise<InspectionRecord> {
  const client = getClient();
  return client.get<InspectionRecord>(`/api/admin/governance/monitoring/inspections/${inspectionId}`);
}

/** 점검 생성 */
export async function createInspection(data: Omit<InspectionRecord, 'id'>): Promise<InspectionRecord> {
  const client = getClient();
  return client.post<InspectionRecord>('/api/admin/governance/monitoring/inspections', data);
}

/** 점검 수정 */
export async function updateInspection(
  id: number,
  data: Partial<InspectionRecord>,
): Promise<InspectionRecord> {
  const client = getClient();
  return client.put<InspectionRecord>(`/api/admin/governance/monitoring/inspections/${id}`, data);
}

/** 점검 삭제 */
export async function deleteInspection(id: number): Promise<void> {
  const client = getClient();
  await client.delete<void>(`/api/admin/governance/monitoring/inspections/${id}`);
}

/** 기한 초과 점검 목록 */
export async function getOverdueInspections(): Promise<OverdueItem[]> {
  const client = getClient();
  return client.get<OverdueItem[]>('/api/admin/governance/monitoring/overdue');
}

// ─── Control Policy ───────────────────────────────────────────

/** PII 정책 목록 */
export async function getPIIsList(): Promise<PolicyRule[]> {
  const client = getClient();
  return client.get<PolicyRule[]>('/api/admin/config/pii');
}

/** PII 정책 생성 */
export async function createPII(data: Omit<PolicyRule, 'id' | 'created_at' | 'updated_at'>): Promise<PolicyRule> {
  const client = getClient();
  return client.post<PolicyRule>('/api/admin/config/pii', data);
}

/** PII 정책 수정 */
export async function updatePII(id: string, data: Partial<PolicyRule>): Promise<PolicyRule> {
  const client = getClient();
  return client.put<PolicyRule>(`/api/admin/config/pii/${encodeURIComponent(id)}`, data);
}

/** PII 정책 삭제 */
export async function deletePII(id: string): Promise<void> {
  const client = getClient();
  await client.delete<void>(`/api/admin/config/pii/${encodeURIComponent(id)}`);
}

/** 금칙어 목록 */
export async function getForbiddenWordsList(): Promise<PolicyRule[]> {
  const client = getClient();
  return client.get<PolicyRule[]>('/api/admin/config/forbidden-words');
}

/** 금칙어 생성 */
export async function createForbiddenWord(data: Omit<PolicyRule, 'id' | 'created_at' | 'updated_at'>): Promise<PolicyRule> {
  const client = getClient();
  return client.post<PolicyRule>('/api/admin/config/forbidden-words', data);
}

/** 금칙어 수정 */
export async function updateForbiddenWord(id: string, data: Partial<PolicyRule>): Promise<PolicyRule> {
  const client = getClient();
  return client.put<PolicyRule>(`/api/admin/config/forbidden-words/${encodeURIComponent(id)}`, data);
}

/** 금칙어 삭제 */
export async function deleteForbiddenWord(id: string): Promise<void> {
  const client = getClient();
  await client.delete<void>(`/api/admin/config/forbidden-words/${encodeURIComponent(id)}`);
}

/** 활성 리스크 정책 조회 */
export async function getActiveRiskPolicy(): Promise<RiskPolicy> {
  const client = getClient();
  return client.get<RiskPolicy>('/api/admin/config/risk-policy/active');
}

/** 리스크 정책 버전 목록 */
export async function getRiskPolicyVersions(): Promise<RiskPolicyVersion[]> {
  const client = getClient();
  return client.get<RiskPolicyVersion[]>('/api/admin/config/risk-policy/versions');
}

/** 리스크 정책 저장 */
export async function saveRiskPolicy(data: {
  categories: RiskPolicyCategory[];
  grade_levels: Record<RiskLevel, { min: number; max: number }>;
}): Promise<RiskPolicy> {
  const client = getClient();
  return client.post<RiskPolicy>('/api/admin/config/risk-policy', data);
}

/** 리스크 정책 이력 초기화 */
export async function clearRiskPolicyHistory(): Promise<void> {
  const client = getClient();
  await client.delete<void>('/api/admin/config/risk-policy/history');
}

// Legacy aliases for backward compatibility
export const getPolicyRules = getPIIsList;
export const createPolicyRule = createPII;
export const updatePolicyRule = updatePII;
export const deletePolicyRule = deletePII;
export const getRiskPolicies = getActiveRiskPolicy;
export const createRiskPolicy = saveRiskPolicy;

// ─── Operation History ────────────────────────────────────────

/** 운영 이력 로그 */
export async function getOperationLogs(params?: {
  type?: ActivityType;
  result?: OperationResult;
  search?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}): Promise<OperationLog[]> {
  const client = getClient();
  const queryParams: Record<string, string> = {};
  if (params?.type) queryParams.type = params.type;
  if (params?.result) queryParams.result = params.result;
  if (params?.search) queryParams.search = params.search;
  if (params?.start_date) queryParams.start_date = params.start_date;
  if (params?.end_date) queryParams.end_date = params.end_date;
  if (params?.limit) queryParams.limit = String(params.limit);
  if (params?.offset) queryParams.offset = String(params.offset);
  return client.get<OperationLog[]>('/api/admin/governance/operation-history/logs', {
    params: queryParams,
  });
}

/** 운영 통계 */
export async function getOperationStats(params?: {
  start_date?: string;
  end_date?: string;
}): Promise<OperationStats> {
  const client = getClient();
  const queryParams: Record<string, string> = {};
  if (params?.start_date) queryParams.start_date = params.start_date;
  if (params?.end_date) queryParams.end_date = params.end_date;
  return client.get<OperationStats>('/api/admin/governance/operation-history/stats', {
    params: queryParams,
  });
}

// ─── Audit Tracking ───────────────────────────────────────────

/** 감사 로그 목록 */
export async function getAuditLogs(params?: {
  action?: AuditAction;
  workflow_id?: string;
  limit?: number;
  offset?: number;
}): Promise<AuditLogEntry[]> {
  const client = getClient();
  const queryParams: Record<string, string> = {};
  if (params?.action) queryParams.action = params.action;
  if (params?.workflow_id) queryParams.workflow_id = params.workflow_id;
  if (params?.limit) queryParams.limit = String(params.limit);
  if (params?.offset) queryParams.offset = String(params.offset);
  return client.get<AuditLogEntry[]>('/api/admin/governance/audit-tracking/logs', {
    params: queryParams,
  });
}

/** 추적 워크플로우 목록 */
export async function getTrackedWorkflows(): Promise<TrackedWorkflow[]> {
  const client = getClient();
  return client.get<TrackedWorkflow[]>('/api/admin/governance/audit-tracking/tracked-workflows');
}

/** 감사 추적 통계 */
export async function getAuditTrackingStats(): Promise<AuditStats> {
  const client = getClient();
  return client.get<AuditStats>('/api/admin/governance/audit-tracking/stats');
}

/** 워크플로우 감사 타임라인 */
export async function getWorkflowAuditTimeline(workflowId: string): Promise<TimelineEntry[]> {
  const client = getClient();
  return client.get<TimelineEntry[]>(`/api/admin/governance/audit-tracking/workflow/${encodeURIComponent(workflowId)}/timeline`);
}
