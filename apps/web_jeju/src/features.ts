/**
 * features.ts — 제주은행 빌드용 기능 등록 파일
 *
 * web 앱 대비 제외된 기능:
 * - canvas-auto-workflow (AI 자동 워크플로우)
 * - main-DocumentManagement-FileStorage, main-DocumentManagement-Repository, main-DocumentManagement-Database (컴렉션만 사용)
 * - main-ML* 전체 (ML 모델 기능)
 * - admin-MCP*, admin-ML*, admin-Gov* (고급 관리 기능)
 * - main-ScenarioRecorder (시나리오 레코더)
 */
import { FeatureRegistry } from '@xgen/types';

/* ── Workspace (1) ── */
import mainDashboard from '@xgen/feature-main-Dashboard';

/* ── Chat (4) ── */
import chatIntro from '@xgen/feature-main-ChatIntroduction';
import newChat from '@xgen/feature-main-NewChat';
import currentChat from '@xgen/feature-main-CurrentChat';
import chatHistory from '@xgen/feature-main-ChatHistory';

/* ── Canvas (auto-workflow 제외) (9) ── */
import canvasIntro from '@xgen/feature-canvas-intro';
import canvasCore from '@xgen/feature-canvas-core';
import canvasNodeSystem from '@xgen/feature-canvas-node-system';
import canvasEdgeSystem from '@xgen/feature-canvas-edge-system';
import canvasHistory from '@xgen/feature-canvas-history';
// import canvasAutoWorkflow from '@xgen/feature-canvas-auto-workflow';  // 제주은행 제외
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

/* ── Document (컬렉션만 사용) (1) ── */
import documentCollection, { documentCollectionTab } from '@xgen/feature-main-DocumentManagement-Collections';
// import documentFilestorage, { documentFilestorageTab } from '@xgen/feature-main-DocumentManagement-FileStorage';  // 제주은행 제외
// import documentRepository, { documentRepositoryTab } from '@xgen/feature-main-DocumentManagement-Repository';      // 제주은행 제외
// import documentDatabase, { documentDatabaseTab } from '@xgen/feature-main-DocumentManagement-Database';            // 제주은행 제외

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

/* ── ML (전체 제외) ── */
// import mlModelIntro from '@xgen/feature-main-MLModelIntroduction';   // 제주은행 제외
// import modelUpload from '@xgen/feature-main-ModelUpload';             // 제주은행 제외
// import modelHub from '@xgen/feature-main-ModelHub';                   // 제주은행 제외
// import modelInference from '@xgen/feature-main-ModelInference';       // 제주은행 제외
// import mlTrain from '@xgen/feature-main-MLTraining';                  // 제주은행 제외
// import mlTrainMonitor from '@xgen/feature-main-MLTrainMonitor';       // 제주은행 제외

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

/* ── Admin — MCP (전체 제외) ── */
// import adminMcpMarket from '@xgen/feature-admin-MCPMarket';       // 제주은행 제외
// import adminMcpStation from '@xgen/feature-admin-MCPStation';      // 제주은행 제외

/* ── Admin — ML (전체 제외) ── */
// import adminMlModelControl from '@xgen/feature-admin-MLModelControl'; // 제주은행 제외

/* ── Admin — Governance (전체 제외) ── */
// import adminGovRiskManagement from '@xgen/feature-admin-GovRiskManagement';     // 제주은행 제외
// import adminGovMonitoring from '@xgen/feature-admin-GovMonitoring';             // 제주은행 제외
// import adminGovControlPolicy from '@xgen/feature-admin-GovControlPolicy';       // 제주은행 제외
// import adminGovOperationHistory from '@xgen/feature-admin-GovOperationHistory'; // 제주은행 제외
// import adminGovAuditTracking from '@xgen/feature-admin-GovAuditTracking';       // 제주은행 제외

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

/* ── Misc ── */
// import scenarioRecorder from '@xgen/feature-main-ScenarioRecorder'; // 제주은행 제외

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
  documentCollection,
  toolStorage, promptStorage, promptStoreBrowse, authProfileStorage, authProfileStore,
  modelIntro, train, trainMonitor, evalFeature, modelStorage,
  supportFaq, supportInquiry, supportMyInquiries,
  supportServiceRequestForm, supportServiceRequestResults,
  authLogin, authSignup, authForgotPassword,
  mypageProfile, mypageProfileEdit, mypageSettings, mypageSecurity, mypageNotifications,
];
features.forEach((f) => registry.register(f));

/* ── CanvasSubModule 등록 (auto-workflow 제외) ── */
const canvasSubs = [
  canvasCore, canvasNodeSystem, canvasEdgeSystem,
  canvasHistory, canvasExecution,
  canvasSideMenu, canvasSpecialNodes, canvasHeader,
];
canvasSubs.forEach((s) => registry.registerCanvasSub(s));

/* ── AdminSubModule 등록 (25개 — MCP/ML/Governance 제외) ── */
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
];
adminSubs.forEach((s) => registry.registerAdminSub(s));

/* ── DocumentTabConfig 등록 (컬렉션만) ── */
[documentCollectionTab].forEach((t) => registry.registerDocumentTab(t));
