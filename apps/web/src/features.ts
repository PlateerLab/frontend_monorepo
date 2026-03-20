/**
 * features.ts — 전체 기능 등록 파일
 *
 * 이 파일에서 import를 주석처리하면 해당 기능이 비활성화됩니다.
 * 각 import 한 줄 = 사이드바 메뉴 항목 한 개.
 * 명명규칙: {page}-{PascalCaseSubPageName}
 */
import { FeatureRegistry } from '@xgen/types';

/* ── Workspace (1) ── */
import mainDashboard from '@xgen/feature-main-Dashboard';

/* ── Chat (4) ── */
import chatIntro from '@xgen/feature-main-ChatIntroduction';
import newChat from '@xgen/feature-main-NewChat';
import currentChat from '@xgen/feature-main-CurrentChat';
import chatHistory from '@xgen/feature-main-ChatHistory';

/* ── Canvas (10) — 기능별 세분화 유지 ── */
import canvasIntro from '@xgen/feature-canvas-intro';
import canvasCore from '@xgen/feature-canvas-core';
import canvasNodeSystem from '@xgen/feature-canvas-node-system';
import canvasEdgeSystem from '@xgen/feature-canvas-edge-system';
import canvasHistory from '@xgen/feature-canvas-history';
import canvasAutoWorkflow from '@xgen/feature-canvas-auto-workflow';
import canvasExecution from '@xgen/feature-canvas-execution';
import canvasSideMenu from '@xgen/feature-canvas-side-menu';
import canvasSpecialNodes from '@xgen/feature-canvas-special-nodes';
import canvasHeader from '@xgen/feature-canvas-header';

/* ── Workflow (5) ── */
import workflowIntro from '@xgen/feature-main-WorkflowIntroduction';
import workflowStorage from '@xgen/feature-main-WorkflowManagement-Storage';
import workflowStore from '@xgen/feature-main-WorkflowManagement-Store';
import workflowScheduler from '@xgen/feature-main-WorkflowManagement-Scheduler';
import workflowTester from '@xgen/feature-main-WorkflowManagement-Tester';

/* ── Document (4) — 탭별 세분화 유지 ── */
import documentCollection, { documentCollectionTab } from '@xgen/feature-main-DocumentManagement-Collections';
import documentFilestorage, { documentFilestorageTab } from '@xgen/feature-main-DocumentManagement-FileStorage';
import documentRepository, { documentRepositoryTab } from '@xgen/feature-main-DocumentManagement-Repository';
import documentDatabase, { documentDatabaseTab } from '@xgen/feature-main-DocumentManagement-Database';

/* ── Workflow Tools (5) ── */
import toolStorage from '@xgen/feature-main-ExecutionTools';
import promptStorage from '@xgen/feature-main-PromptManagement-Storage';
import promptStoreBrowse from '@xgen/feature-main-PromptManagement-Store';
import authProfileStorage from '@xgen/feature-main-AuthProfileManagement-Storage';
import authProfileStore from '@xgen/feature-main-AuthProfileManagement-Store';

/* ── Model (5) ── */
import modelIntro from '@xgen/feature-main-ModelIntroduction';
import train from '@xgen/feature-main-Training';
import trainMonitor from '@xgen/feature-main-TrainMonitor';
import evalFeature from '@xgen/feature-main-Evaluation';
import modelStorage from '@xgen/feature-main-ModelStorage';

/* ── ML Model (6) ── */
import mlModelIntro from '@xgen/feature-main-MLModelIntroduction';
import modelUpload from '@xgen/feature-main-ModelUpload';
import modelHub from '@xgen/feature-main-ModelHub';
import modelInference from '@xgen/feature-main-ModelInference';
import mlTrain from '@xgen/feature-main-MLTraining';
import mlTrainMonitor from '@xgen/feature-main-MLTrainMonitor';

/* ── Support (5) ── */
import supportFaq from '@xgen/feature-support-FAQ';
import supportInquiry from '@xgen/feature-support-Inquiry';
import supportMyInquiries from '@xgen/feature-support-MyInquiries';
import supportServiceRequestForm from '@xgen/feature-support-ServiceRequestForm';
import supportServiceRequestResults from '@xgen/feature-support-ServiceRequestResults';

/* ── Admin — Admin (1) ── */
import adminAdmin from '@xgen/feature-admin-Admin';

/* ── Admin — User Management (3) ── */
import adminUsers from '@xgen/feature-admin-Users';
import adminUserCreate from '@xgen/feature-admin-UserCreate';
import adminGroupPermissions from '@xgen/feature-admin-GroupPermissions';

/* ── Admin — Workflow (9) ── */
import adminWorkflowManagement from '@xgen/feature-admin-WorkflowManagement';
import adminWorkflowMonitoring from '@xgen/feature-admin-WorkflowMonitoring';
import adminTestMonitoring from '@xgen/feature-admin-TestMonitoring';
import adminAgentTraces from '@xgen/feature-admin-AgentTraces';
import adminChatMonitoring from '@xgen/feature-admin-ChatMonitoring';
import adminUserTokenDashboard from '@xgen/feature-admin-UserTokenDashboard';
import adminNodeManagement from '@xgen/feature-admin-NodeManagement';
import adminWorkflowStore from '@xgen/feature-admin-WorkflowStore';
import adminPromptStore from '@xgen/feature-admin-PromptStore';

/* ── Admin — Settings (2) ── */
import adminSystemSettings from '@xgen/feature-admin-SystemSettings';
import adminSystemConfig from '@xgen/feature-admin-SystemConfig';

/* ── Admin — System Status (3) ── */
import adminSystemMonitor from '@xgen/feature-admin-SystemMonitor';
import adminSystemHealth from '@xgen/feature-admin-SystemHealth';
import adminBackendLogs from '@xgen/feature-admin-BackendLogs';

/* ── Admin — Data (4) ── */
import adminDatabase from '@xgen/feature-admin-Database';
import adminDataScraper from '@xgen/feature-admin-DataScraper';
import adminStorage from '@xgen/feature-admin-Storage';
import adminBackup from '@xgen/feature-admin-Backup';

/* ── Admin — Security (3) ── */
import adminSecuritySettings from '@xgen/feature-admin-SecuritySettings';
import adminAuditLogs from '@xgen/feature-admin-AuditLogs';
import adminErrorLogs from '@xgen/feature-admin-ErrorLogs';

/* ── Admin — MCP (2) ── */
import adminMcpMarket from '@xgen/feature-admin-MCPMarket';
import adminMcpStation from '@xgen/feature-admin-MCPStation';

/* ── Admin — ML (1) ── */
import adminMlModelControl from '@xgen/feature-admin-MLModelControl';

/* ── Admin — Governance (5) ── */
import adminGovRiskManagement from '@xgen/feature-admin-GovRiskManagement';
import adminGovMonitoring from '@xgen/feature-admin-GovMonitoring';
import adminGovControlPolicy from '@xgen/feature-admin-GovControlPolicy';
import adminGovOperationHistory from '@xgen/feature-admin-GovOperationHistory';
import adminGovAuditTracking from '@xgen/feature-admin-GovAuditTracking';

/* ── Auth (3) ── */
import authLogin from '@xgen/feature-auth-Login';
import authSignup from '@xgen/feature-auth-Signup';
import authForgotPassword from '@xgen/feature-auth-ForgotPassword';

/* ── MyPage (5) ── */
import mypageProfile from '@xgen/feature-mypage-Profile';
import mypageProfileEdit from '@xgen/feature-mypage-ProfileEdit';
import mypageSettings from '@xgen/feature-mypage-Settings';
import mypageSecurity from '@xgen/feature-mypage-Security';
import mypageNotifications from '@xgen/feature-mypage-Notifications';

/* ── Misc (1) ── */
import scenarioRecorder from '@xgen/feature-main-ScenarioRecorder';

/* ═══════════════════════════════════════════════
   Registry
   ═══════════════════════════════════════════════ */

export const registry = new FeatureRegistry();

/* ── FeatureModule 등록 ── */
const features = [
  mainDashboard,
  chatIntro, newChat, currentChat, chatHistory,
  canvasIntro,
  workflowIntro, workflowStorage, workflowStore, workflowScheduler, workflowTester,
  documentCollection, documentFilestorage, documentRepository, documentDatabase,
  toolStorage, promptStorage, promptStoreBrowse, authProfileStorage, authProfileStore,
  modelIntro, train, trainMonitor, evalFeature, modelStorage,
  mlModelIntro, modelUpload, modelHub, modelInference, mlTrain, mlTrainMonitor,
  supportFaq, supportInquiry, supportMyInquiries,
  supportServiceRequestForm, supportServiceRequestResults,
  authLogin, authSignup, authForgotPassword,
  mypageProfile, mypageProfileEdit, mypageSettings, mypageSecurity, mypageNotifications,
  scenarioRecorder,
];
features.forEach((f) => registry.register(f));

/* ── CanvasSubModule 등록 ── */
const canvasSubs = [
  canvasCore, canvasNodeSystem, canvasEdgeSystem,
  canvasHistory, canvasAutoWorkflow, canvasExecution,
  canvasSideMenu, canvasSpecialNodes, canvasHeader,
];
canvasSubs.forEach((s) => registry.registerCanvasSub(s));

/* ── AdminSubModule 등록 (33개 — 사이드바 항목 단위) ── */
const adminSubs = [
  adminAdmin,
  adminUsers, adminUserCreate, adminGroupPermissions,
  adminWorkflowManagement, adminWorkflowMonitoring, adminTestMonitoring,
  adminAgentTraces, adminChatMonitoring, adminUserTokenDashboard,
  adminNodeManagement, adminWorkflowStore, adminPromptStore,
  adminSystemSettings, adminSystemConfig,
  adminSystemMonitor, adminSystemHealth, adminBackendLogs,
  adminDatabase, adminDataScraper, adminStorage, adminBackup,
  adminSecuritySettings, adminAuditLogs, adminErrorLogs,
  adminMcpMarket, adminMcpStation,
  adminMlModelControl,
  adminGovRiskManagement, adminGovMonitoring, adminGovControlPolicy,
  adminGovOperationHistory, adminGovAuditTracking,
];
adminSubs.forEach((s) => registry.registerAdminSub(s));

/* ── DocumentTabConfig 등록 ── */
[documentCollectionTab, documentFilestorageTab, documentRepositoryTab, documentDatabaseTab]
  .forEach((t) => registry.registerDocumentTab(t));
