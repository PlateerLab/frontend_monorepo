# XGEN Frontend 마이그레이션 계획서

## xgen-frontend → frontend_monorepo 완전 마이그레이션

---

## 목차

1. [마이그레이션 개요](#1-마이그레이션-개요)
2. [현재 상태 분석 요약](#2-현재-상태-분석-요약)
3. [마이그레이션 원칙](#3-마이그레이션-원칙)
4. [Phase 0 — 공유 패키지(packages/) 마이그레이션](#4-phase-0--공유-패키지packages-마이그레이션)
5. [Phase 1 — Auth 페이지 마이그레이션](#5-phase-1--auth-페이지-마이그레이션)
6. [Phase 2 — Main 페이지 마이그레이션](#6-phase-2--main-페이지-마이그레이션)
7. [Phase 3 — Canvas 시스템 마이그레이션](#7-phase-3--canvas-시스템-마이그레이션)
8. [Phase 4 — Admin 페이지 마이그레이션](#8-phase-4--admin-페이지-마이그레이션)
9. [Phase 5 — Support / MyPage / 기타 마이그레이션](#9-phase-5--support--mypage--기타-마이그레이션)
10. [Phase 6 — App 레이어 조립 및 라우팅](#10-phase-6--app-레이어-조립-및-라우팅)
11. [Phase 7 — 통합 테스트 및 정리](#11-phase-7--통합-테스트-및-정리)
12. [모노레포 구조 수정 사항 (누락 Feature 보완)](#12-모노레포-구조-수정-사항-누락-feature-보완)
13. [파일별 매핑 테이블](#13-파일별-매핑-테이블)
14. [위험 요소 및 주의사항](#14-위험-요소-및-주의사항)

---

## 1. 마이그레이션 개요

### 목표

`xgen-frontend` (단일 Next.js 프로젝트)의 **모든 비즈니스 코드**를 `frontend_monorepo`의 3-레이어 아키텍처로 이전한다.

```
xgen-frontend (단일 프로젝트)
  └─ src/app/              → 모든 코드가 한 곳에 혼재

frontend_monorepo (3-레이어)
  ├─ apps/web/             → 조립만 (라우팅, 레이아웃)
  ├─ features/             → 기능 하나 = 폴더 하나 = 패키지 하나
  └─ packages/             → 공유 인프라 (UI, API, 인증, i18n 등)
```

### 핵심 규칙

| 규칙 | 설명 |
|---|---|
| Feature 독립성 | Feature 간 import 금지. 삭제해도 다른 Feature가 깨지지 않을 것 |
| App은 조립만 | `apps/web/`에는 비즈니스 로직 넣지 않는다 |
| 공유 패키지 사용 필수 | API → `@xgen/api-client`, 인증 → `@xgen/auth-provider`, i18n → `@xgen/i18n` 등 |
| 네이밍 규칙 | 파일명 kebab-case, Feature id = 디렉토리명 |

---

## 2. 현재 상태 분석 요약

### xgen-frontend 구조 (마이그레이션 원본)

| 영역 | 경로 | 화면 수 |
|---|---|---|
| Auth | `src/app/(auth)/` | 4 (login, signup, forgot-password, reset-password) |
| Main Dashboard | `src/app/main/components/MainDashboard.tsx` | 1 |
| Chat | `src/app/main/chatSection/` | 4 (intro, new-chat, current-chat, history) |
| Workflow | `src/app/main/workflowSection/` | 7+ (intro, canvas, workflows, tools, auth-profile, prompt, scheduler) |
| Documents | `src/app/main/workflowSection/components/documents/` | 4+ (collections, file-storage, repository, database) |
| Data | `src/app/main/dataSection/` | 4 (intro, processor, station, storage) |
| Model Training | `src/app/main/modelSection/` | 5 (intro, train, monitor, eval, storage) |
| ML Model | `src/app/ml-inference/` + `src/app/main/mlSection/` | 6 (intro, upload, hub, inference, train, monitor) |
| Canvas Editor | `src/app/canvas/` | 1 (복합 노드/엣지/실행 시스템) |
| Admin | `src/app/admin/` | 33+ (query param 기반 view 전환) |
| Support | `src/app/support/` | 5 (FAQ, inquiry, my-inquiries, service-request, results) |
| MyPage | `src/app/mypage/` | 2 (profile, profile-edit) |
| Agent | `src/app/agent/` | 1 (agent chat + tool system) |
| Chatbot | `src/app/chatbot/` | 1 (standalone/embed chat) |
| ML Monitoring | `src/app/ml-monitoring/` | 1 (bias, IO, version, XAI) |
| Embed Test | `src/app/embed-test/` | 1 |
| Scenario Recorder | `src/app/scenario-recorder/` | 1 |
| 공유 코드 | `src/app/_common/` | API 30+, Components 25+, Utils 25+, Hooks 3, Icons 12 |

### frontend_monorepo 현재 상태 (마이그레이션 대상)

| 항목 | 상태 |
|---|---|
| packages/ (9개) | 기본 구조 완료 (api-client, auth-provider, config, i18n, icons, styles, types, ui, utils) |
| features/ (65+개 폴더) | 폴더 생성됨, 일부는 실제 구현, 대부분 스텁/플레이스홀더 |
| apps/web/ | 라우팅 구조 + features.ts 등록 시스템 완료 |
| 누락 Feature | main-DataIntroduction, main-DataProcessor, main-DataStation, main-DataStorage, chatbot, agent, embed-test, ml-monitoring 관련 Feature 없음 |

---

## 3. 마이그레이션 원칙

### 3-1. 작업 순서 원칙

```
1. packages/ (공유 인프라) → 가장 먼저. 모든 Feature가 의존.
2. auth-* (인증)         → 로그인 없으면 다른 페이지 테스트 불가.
3. main-* (핵심 기능)    → 가장 큰 덩어리. 화면별로 분리 이전.
4. canvas-* (캔버스)     → 독립적이지만 복잡. main 이후 진행.
5. admin-* (관리자)      → main과 독립적이므로 별도 진행 가능.
6. support-* / mypage-*  → 비교적 간단. 마지막에 진행.
7. apps/web 조립          → 모든 Feature 이전 후 라우팅 연결.
```

### 3-2. 개별 Feature 마이그레이션 절차 (반복 템플릿)

모든 Feature에 대해 동일한 절차를 따른다:

```
Step A: 원본 코드 분석
  - xgen-frontend에서 해당 화면의 모든 파일 식별
  - 사용 중인 공유 코드(_common) 파악
  - 다른 화면과의 의존관계 확인

Step B: Feature 폴더 구성
  - features/{feature-name}/src/ 아래 파일 구조 설계
  - package.json 의존성 설정

Step C: 코드 이전
  - 컴포넌트 코드 이전 (파일명 kebab-case 변환)
  - **SCSS → Tailwind CSS 재작성** (.module.scss 파일 이전하지 않음, JSX에 Tailwind 유틸리티 클래스 직접 작성)
  - 공유 코드 → @xgen/* 패키지 import로 변경
  - i18n 하드코딩 문자열 → useTranslation() 변환
  - fetch 직접 호출 → @xgen/api-client 변환
  - process.env → @xgen/config 변환
  - 쿠키 직접 파싱 → @xgen/auth-provider 변환
  - react-icons 직접 사용 → @xgen/icons 변환

Step D: Feature export 구성
  - FeatureModule / AdminSubModule / CanvasSubModule 인터페이스 구현
  - default export 작성
  - 'use client' 선언 확인

Step E: 등록 및 확인
  - apps/web/src/features.ts에 import + register
  - apps/web/package.json에 의존성 추가
  - pnpm install → pnpm dev:web → 화면 확인
```

---

## 4. Phase 0 — 공유 패키지(packages/) 마이그레이션

> **목표:** xgen-frontend의 `_common/` 코드를 monorepo의 `packages/`로 완전 이전

### TASK 0-1. @xgen/api-client — API 클라이언트 강화

**원본:** `_common/api/core/` + `_common/api/helper/apiClient.js`

| 작업 항목 | 세부 내용 |
|---|---|
| 0-1-1 | `_common/api/core/createApiClient.ts` → `packages/api-client/src/create-api-client.ts` — 팩토리 패턴 이전 |
| 0-1-2 | `_common/api/core/ApiClient.interface.ts` → `packages/api-client/src/api-client.interface.ts` — IApiClient, ILLMClient 인터페이스 이전 |
| 0-1-3 | `_common/api/core/WebApiClient.ts` → `packages/api-client/src/web-api-client.ts` — HTTP 클라이언트 이전 (인증 토큰 자동 첨부, 에러 핸들링) |
| 0-1-4 | `_common/api/core/TauriApiClient.ts` → `packages/api-client/src/tauri-api-client.ts` — Tauri IPC 클라이언트 이전 |
| 0-1-5 | `_common/api/core/platform.ts` → `packages/api-client/src/platform.ts` — 플랫폼 감지 (isTauri, isServer, isBrowser) |
| 0-1-6 | `_common/api/core/types.ts` → `packages/api-client/src/types.ts` — API 응답/요청 타입 |
| 0-1-7 | index.ts 업데이트 — 모든 새 모듈 export |

**주의:** 현재 monorepo의 `api-client`는 기본 fetch wrapper만 있으므로, xgen의 인증 토큰 자동 첨부/갱신 로직을 반드시 이전해야 함.

### TASK 0-2. @xgen/api-client — 도메인 API 모듈 이전

**원본:** `_common/api/domains/` + `_common/api/*.js` (30+ 파일)

| 작업 항목 | 세부 내용 |
|---|---|
| 0-2-1 | `_common/api/domains/auth.ts` → `packages/api-client/src/domains/auth.ts` |
| 0-2-2 | `_common/api/domains/config.ts` → `packages/api-client/src/domains/config.ts` |
| 0-2-3 | `_common/api/domains/llm.ts` → `packages/api-client/src/domains/llm.ts` |
| 0-2-4 | `_common/api/domains/workflow.ts` → `packages/api-client/src/domains/workflow.ts` |
| 0-2-5 | `_common/api/authAPI.js` → `packages/api-client/src/domains/auth-api.ts` (JS→TS 변환) |
| 0-2-6 | `_common/api/authProfileAPI.js` → `packages/api-client/src/domains/auth-profile-api.ts` |
| 0-2-7 | `_common/api/citationAPI.js` → `packages/api-client/src/domains/citation-api.ts` |
| 0-2-8 | `_common/api/configAPI.js` → `packages/api-client/src/domains/config-api.ts` |
| 0-2-9 | `_common/api/dataManagerAPI.js` → `packages/api-client/src/domains/data-manager-api.ts` |
| 0-2-10 | `_common/api/dbConnectionAPI.js` → `packages/api-client/src/domains/db-connection-api.ts` |
| 0-2-11 | `_common/api/governanceAPI.js` → `packages/api-client/src/domains/governance-api.ts` |
| 0-2-12 | `_common/api/huggingfaceAPI.js` → `packages/api-client/src/domains/huggingface-api.ts` |
| 0-2-13 | `_common/api/interactionAPI.js` → `packages/api-client/src/domains/interaction-api.ts` |
| 0-2-14 | `_common/api/llmAPI.js` → `packages/api-client/src/domains/llm-api.ts` |
| 0-2-15 | `_common/api/mlAPI.js` → `packages/api-client/src/domains/ml-api.ts` |
| 0-2-16 | `_common/api/modelAPI.js` → `packages/api-client/src/domains/model-api.ts` |
| 0-2-17 | `_common/api/nodeAPI.js` → `packages/api-client/src/domains/node-api.ts` |
| 0-2-18 | `_common/api/parameterApi.ts` → `packages/api-client/src/domains/parameter-api.ts` |
| 0-2-19 | `_common/api/promptAPI.js` → `packages/api-client/src/domains/prompt-api.ts` |
| 0-2-20 | `_common/api/sttAPI.js` → `packages/api-client/src/domains/stt-api.ts` |
| 0-2-21 | `_common/api/toolsAPI.js` → `packages/api-client/src/domains/tools-api.ts` |
| 0-2-22 | `_common/api/ttsAPI.js` → `packages/api-client/src/domains/tts-api.ts` |
| 0-2-23 | `_common/api/vastAPI.js` → `packages/api-client/src/domains/vast-api.ts` |

### TASK 0-3. @xgen/api-client — RAG API 모듈 이전

**원본:** `_common/api/rag/` (8 파일)

| 작업 항목 | 세부 내용 |
|---|---|
| 0-3-1 | `rag/documentAPI.js` → `packages/api-client/src/domains/rag/document-api.ts` |
| 0-3-2 | `rag/embeddingAPI.js` → `packages/api-client/src/domains/rag/embedding-api.ts` |
| 0-3-3 | `rag/folderAPI.js` → `packages/api-client/src/domains/rag/folder-api.ts` |
| 0-3-4 | `rag/repositoryScheduleAPI.js` → `packages/api-client/src/domains/rag/repository-schedule-api.ts` |
| 0-3-5 | `rag/retrievalAPI.js` → `packages/api-client/src/domains/rag/retrieval-api.ts` |
| 0-3-6 | `rag/storageAPI.js` → `packages/api-client/src/domains/rag/storage-api.ts` |
| 0-3-7 | `rag/storageFileAPI.js` → `packages/api-client/src/domains/rag/storage-file-api.ts` |
| 0-3-8 | `rag/storageFolderAPI.js` → `packages/api-client/src/domains/rag/storage-folder-api.ts` |

### TASK 0-4. @xgen/api-client — Workflow API 모듈 이전

**원본:** `_common/api/workflow/` (10 파일)

| 작업 항목 | 세부 내용 |
|---|---|
| 0-4-1 | `workflow/workflowAPI.js` → `packages/api-client/src/domains/workflow/workflow-api.ts` |
| 0-4-2 | `workflow/autoWorkflowAPI.js` → `packages/api-client/src/domains/workflow/auto-workflow-api.ts` |
| 0-4-3 | `workflow/batchAPI.js` → `packages/api-client/src/domains/workflow/batch-api.ts` |
| 0-4-4 | `workflow/scheduleAPI.js` → `packages/api-client/src/domains/workflow/schedule-api.ts` |
| 0-4-5 | `workflow/tableDataFilesAPI.ts` → `packages/api-client/src/domains/workflow/table-data-files-api.ts` |
| 0-4-6 | `workflow/tracker.js` → `packages/api-client/src/domains/workflow/tracker.ts` |
| 0-4-7 | `workflow/workflowDeployAPI.ts` → `packages/api-client/src/domains/workflow/workflow-deploy-api.ts` |
| 0-4-8 | `workflow/deploy.ts` → `packages/api-client/src/domains/workflow/deploy.ts` |
| 0-4-9 | `workflow/workflowStoreAPI.js` → `packages/api-client/src/domains/workflow/workflow-store-api.ts` |
| 0-4-10 | `workflow/types.ts` → `packages/api-client/src/domains/workflow/types.ts` |

### TASK 0-5. @xgen/api-client — Trainer API 모듈 이전

**원본:** `_common/api/trainer/` (2 파일)

| 작업 항목 | 세부 내용 |
|---|---|
| 0-5-1 | `trainer/evalAPI.js` → `packages/api-client/src/domains/trainer/eval-api.ts` |
| 0-5-2 | `trainer/trainAPI.js` → `packages/api-client/src/domains/trainer/train-api.ts` |

### TASK 0-6. @xgen/auth-provider — 인증 시스템 강화

**원본:** `_common/components/CookieProvider.tsx` + `_common/components/authGuard/`

| 작업 항목 | 세부 내용 |
|---|---|
| 0-6-1 | `CookieProvider.tsx` 로직 → `packages/auth-provider/src/cookie-provider.tsx` 이전 (토큰 갱신 로직 포함) |
| 0-6-2 | `AuthGuard.tsx` → `packages/auth-provider/src/auth-guard.tsx` — 인증 가드 컴포넌트 강화 |
| 0-6-3 | `ReverseAuthGuard.tsx` → `packages/auth-provider/src/reverse-auth-guard.tsx` — 비인증 사용자용 가드 |
| 0-6-4 | `SectionGuard.tsx` → `packages/auth-provider/src/section-guard.tsx` — 섹션별 권한 가드 |
| 0-6-5 | index.ts 업데이트 — AuthGuard, ReverseAuthGuard, SectionGuard export 추가 |

### TASK 0-7. @xgen/config — 환경설정 강화

**원본:** `src/app/config.js` + `_common/api/core/` 환경변수 사용 부분

| 작업 항목 | 세부 내용 |
|---|---|
| 0-7-1 | `config.js`의 모든 `process.env.NEXT_PUBLIC_*` 읽기 → `packages/config/src/index.ts`에 통합 |
| 0-7-2 | 컨테이너 환경변수 감지 로직 (`containerInfo.ts`) → `packages/config/src/container-info.ts` |
| 0-7-3 | Deploy 설정 관련 (`deploySettingsStorage.ts`) → `packages/config/src/deploy-settings.ts` |

### TASK 0-8. @xgen/i18n — 다국어 완전 이전

**원본:** `src/i18n/` + `locales/ko.json`, `locales/en.json`

| 작업 항목 | 세부 내용 |
|---|---|
| 0-8-1 | `src/i18n/locales/ko.json` → `packages/i18n/src/locales/ko.json` — 전체 한국어 번역 이전 |
| 0-8-2 | `src/i18n/locales/en.json` → `packages/i18n/src/locales/en.json` — 전체 영어 번역 이전 |
| 0-8-3 | LanguageProvider 로직 검증 — xgen 원본과 동일하게 hydration 처리 확인 |

### TASK 0-9. @xgen/icons — 아이콘 완전 이전

**원본:** `_common/icons/` (12 파일) + `main/sidebar/icons/`

| 작업 항목 | 세부 내용 |
|---|---|
| 0-9-1 | `_common/icons/AlertDangerIcon.tsx` → `packages/icons/src/alert-danger-icon.tsx` |
| 0-9-2 | `_common/icons/ChatbotAvatarIcon.tsx` → `packages/icons/src/chatbot-avatar-icon.tsx` |
| 0-9-3 | `_common/icons/ChatbotIcon.tsx` → `packages/icons/src/chatbot-icon.tsx` |
| 0-9-4 | `_common/icons/ChatButtonIcon.tsx` → `packages/icons/src/chat-button-icon.tsx` |
| 0-9-5 | `_common/icons/EyeOffIcon.tsx` → `packages/icons/src/eye-off-icon.tsx` |
| 0-9-6 | `_common/icons/EyeOpenIcon.tsx` → `packages/icons/src/eye-open-icon.tsx` |
| 0-9-7 | `_common/icons/download.tsx` → `packages/icons/src/download-icon.tsx` |
| 0-9-8 | `_common/icons/refresh.tsx` → `packages/icons/src/refresh-icon.tsx` |
| 0-9-9 | `_common/icons/upload.tsx` → `packages/icons/src/upload-icon.tsx` |
| 0-9-10 | `main/sidebar/icons/` → 사이드바 전용 아이콘 → `packages/icons/src/` (sidebar-* 접두사) |
| 0-9-11 | index.ts 업데이트 — 모든 새 아이콘 export |

### TASK 0-10. @xgen/ui — 공통 UI 컴포넌트 이전

**원본:** `_common/components/` 중 범용 UI

| 작업 항목 | 세부 내용 |
|---|---|
| 0-10-1 | `_common/components/CardButton.tsx` → `packages/ui/src/components/card-button.tsx` |
| 0-10-2 | `_common/components/LanguageSelector.tsx` → `packages/ui/src/components/language-selector.tsx` |
| 0-10-3 | `_common/components/LogModal.tsx` → `packages/ui/src/components/log-modal.tsx` |
| 0-10-4 | `_common/components/LogViewer.tsx` → `packages/ui/src/components/log-viewer.tsx` |
| 0-10-5 | `_common/components/SearchInput/SearchInput.tsx` → `packages/ui/src/components/search-input.tsx` |
| 0-10-6 | `_common/components/ToastProvider.jsx` → `packages/ui/src/components/toast-provider.tsx` (JSX→TSX) |
| 0-10-7 | `_common/components/chatParser/` (전체) → `packages/ui/src/components/chat-parser/` — 15개 파서 컴포넌트 |
| 0-10-8 | `_common/components/docsFile/` (전체) → `packages/ui/src/components/docs-file/` — 문서 파일 모달 |
| 0-10-9 | index.ts 업데이트 — 모든 새 UI 컴포넌트 export |

### TASK 0-11. @xgen/utils — 유틸리티 이전

**원본:** `_common/utils/` (25+ 파일)

| 작업 항목 | 세부 내용 |
|---|---|
| 0-11-1 | `browserFingerprint.ts` → `packages/utils/src/browser-fingerprint.ts` |
| 0-11-2 | `chatStorage.ts` → `packages/utils/src/chat-storage.ts` |
| 0-11-3 | `chatVariablesStorage.ts` → `packages/utils/src/chat-variables-storage.ts` |
| 0-11-4 | `cookieUtils.js` → `packages/utils/src/cookie-utils.ts` (이미 일부 이전됨, 병합) |
| 0-11-5 | `credentialCrypto.ts` → `packages/utils/src/credential-crypto.ts` |
| 0-11-6 | `currentChatStorage.ts` → `packages/utils/src/current-chat-storage.ts` |
| 0-11-7 | `deployInteractionId.ts` → `packages/utils/src/deploy-interaction-id.ts` |
| 0-11-8 | `documentCache.ts` → `packages/utils/src/document-cache.ts` |
| 0-11-9 | `generateSha1Hash.ts` → `packages/utils/src/generate-hash.ts` (SHA-256 사용 권장) |
| 0-11-10 | `isStreamingWorkflow.ts` → `packages/utils/src/is-streaming-workflow.ts` |
| 0-11-11 | `logoutUtils.ts` → `packages/utils/src/logout-utils.ts` |
| 0-11-12 | `nodeHook.ts` → `packages/utils/src/node-hook.ts` |
| 0-11-13 | `sseManager.ts` → `packages/utils/src/sse-manager.ts` |
| 0-11-14 | `stringParser.ts` → `packages/utils/src/string-parser.ts` |
| 0-11-15 | `storageUtils.ts` → `packages/utils/src/storage-utils.ts` |
| 0-11-16 | `tabSessionManager.ts` → `packages/utils/src/tab-session-manager.ts` |
| 0-11-17 | `toastUtils.tsx` → `packages/utils/src/toast-utils.tsx` |
| 0-11-18 | `ttsUtils.ts` → `packages/utils/src/tts-utils.ts` |
| 0-11-19 | `urlEncryption.ts` → `packages/utils/src/url-encryption.ts` |
| 0-11-20 | `workflowStorage.js` → `packages/utils/src/workflow-storage.ts` (JS→TS 변환) |
| 0-11-21 | index.ts 업데이트 — 모든 새 유틸리티 export |

### TASK 0-12. @xgen/types — 타입 정의 보강

**원본:** `_common/types/` + 각 섹션 `types/`

| 작업 항목 | 세부 내용 |
|---|---|
| 0-12-1 | `_common/types/deploySettings.ts` → `packages/types/src/deploy-settings.ts` — DeployCustomSettings 타입 |
| 0-12-2 | `_common/contexts/BatchTesterContext.tsx`의 타입 → `packages/types/src/batch-tester.ts` |
| 0-12-3 | `_common/contexts/UploadStatusContext.tsx`의 타입 → `packages/types/src/upload-status.ts` |
| 0-12-4 | `_common/contexts/DocumentFileModalContext.tsx`의 타입 → `packages/types/src/document-file-modal.ts` |
| 0-12-5 | index.ts 업데이트 — 모든 새 타입 export |

### TASK 0-13. @xgen/styles — Tailwind CSS 기반 스타일 시스템 구축

**원본:** `src/app/globals.css` + `_common/default.scss` + `_common/_variables.scss`

> **전략 결정: SCSS 전면 폐기, Tailwind CSS 처음부터 적용**
> - SCSS 파일을 그대로 이전하지 않는다.
> - 모든 스타일을 Tailwind 유틸리티 클래스 + CSS 변수로 재작성한다.
> - SCSS 변수(`_variables.scss`)는 CSS 변수(custom properties)로 변환하여 `globals.css`에 통합한다.

| 작업 항목 | 세부 내용 |
|---|---|
| 0-13-1 | `packages/styles/src/globals.css` — Tailwind 기본 설정 (`@tailwind base/components/utilities`) 포함 |
| 0-13-2 | `_variables.scss`의 SCSS 변수 → CSS 변수(`--xgen-*`)로 변환하여 `globals.css`의 `:root`에 통합 |
| 0-13-3 | `tailwind.config.ts` — CSS 변수를 Tailwind theme으로 매핑 (예: `colors: { primary: 'var(--xgen-primary)' }`) |
| 0-13-4 | `packages/styles/tailwind-preset.ts` 생성 — 모노레포 전체 공유 Tailwind 프리셋 (색상, 타이포, 간격 등) |
| 0-13-5 | sass 의존성 제거 — package.json에서 sass 관련 의존성 삭제 |

### TASK 0-14. 새 패키지 생성 — @xgen/contexts (공유 Context)

**원본:** `_common/contexts/` (3 파일)

| 작업 항목 | 세부 내용 |
|---|---|
| 0-14-1 | `packages/contexts/` 패키지 신규 생성 (또는 개별 Feature에서 필요한 Context만 자체 보유) |
| 0-14-2 | `BatchTesterContext.tsx` → `packages/contexts/src/batch-tester-context.tsx` |
| 0-14-3 | `UploadStatusContext.tsx` → `packages/contexts/src/upload-status-context.tsx` |
| 0-14-4 | `DocumentFileModalContext.tsx` → `packages/contexts/src/document-file-modal-context.tsx` |

> **판단 기준:** 3개 이상 Feature가 사용하면 packages/, 아니면 사용하는 Feature 내부에 둔다.

### TASK 0-15. 새 패키지 생성 — @xgen/lib (시스템 라이브러리)

**원본:** `src/lib/` (local-cli, mcp)

| 작업 항목 | 세부 내용 |
|---|---|
| 0-15-1 | `src/lib/local-cli/` → `packages/lib/src/local-cli/` — Local CLI Manager, Bridge, Clients |
| 0-15-2 | `src/lib/mcp/` → `packages/lib/src/mcp/` — MCP Client, Browser Manager |
| 0-15-3 | `src/lib/chatbot-embed.ts` → `packages/lib/src/chatbot-embed.ts` |

---

## 5. Phase 1 — Auth 페이지 마이그레이션

> **목표:** 인증 페이지 3개 Feature 완전 이전

### TASK 1-1. auth-Login — 로그인 화면

**원본:** `src/app/(auth)/login/page.tsx` + `LoginPage.module.scss`

| 작업 항목 | 세부 내용 |
|---|---|
| 1-1-1 | `page.tsx` 분석 — 로그인 폼 UI, 이메일/비밀번호, 에러 처리, AuthAPI 연동 |
| 1-1-2 | `LoginPage.module.scss` → Tailwind 유틸리티 클래스로 재작성 (SCSS 파일 이전하지 않음) |
| 1-1-3 | 로그인 컴포넌트 → `features/auth-Login/src/login-page.tsx` 이전 |
| 1-1-4 | `authAPI.js`의 login 함수 → `@xgen/api-client`의 auth-api 사용으로 변경 |
| 1-1-5 | `CookieProvider` 직접 사용 → `@xgen/auth-provider`의 `useAuth()` 로 변경 |
| 1-1-6 | 하드코딩 문자열 → `useTranslation()` 변환 |
| 1-1-7 | `EyeOffIcon`, `EyeOpenIcon` → `@xgen/icons`에서 import |
| 1-1-8 | `index.ts` export — FeatureModule 또는 별도 인터페이스 구현 |
| 1-1-9 | `apps/web/src/app/login/page.tsx` 라우트 연결 확인 |

### TASK 1-2. auth-Signup — 회원가입 화면

**원본:** `src/app/(auth)/signup/page.tsx` + `SignupPage.module.scss`

| 작업 항목 | 세부 내용 |
|---|---|
| 1-2-1 | `page.tsx` 분석 — 회원가입 폼, 유효성 검증 |
| 1-2-2 | `SignupPage.module.scss` → Tailwind 유틸리티 클래스로 재작성 (SCSS 파일 이전하지 않음) |
| 1-2-3 | 회원가입 컴포넌트 → `features/auth-Signup/src/signup-page.tsx` |
| 1-2-4 | API 호출 → `@xgen/api-client` 변환 |
| 1-2-5 | 하드코딩 문자열 → `useTranslation()` 변환 |
| 1-2-6 | `index.ts` export |

### TASK 1-3. auth-ForgotPassword — 비밀번호 찾기/재설정 화면

**원본:** `src/app/(auth)/forgot-password/page.tsx` + `reset-password/page.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 1-3-1 | `forgot-password/page.tsx` 분석 — 이메일 입력, 인증코드 요청 |
| 1-3-2 | `reset-password/page.tsx` 분석 — 새 비밀번호 입력, 비밀번호 변경 |
| 1-3-3 | `ForgotPassword.module.scss` → Tailwind 유틸리티 클래스로 재작성 (SCSS 파일 이전하지 않음) |
| 1-3-4 | `ResetPassword.module.scss` → Tailwind 유틸리티 클래스로 재작성 (SCSS 파일 이전하지 않음) |
| 1-3-5 | 두 화면 모두 → `features/auth-ForgotPassword/src/` 안에 배치 (같은 Feature) |
| 1-3-6 | API 호출 → `@xgen/api-client` 변환 |
| 1-3-7 | `index.ts` export — routes에 forgot-password, reset-password 두 경로 등록 |

---

## 6. Phase 2 — Main 페이지 마이그레이션

> **목표:** 일반 사용자 화면(main) 전체 이전 — 가장 큰 덩어리

### TASK 2-1. main-dashboard — 메인 대시보드

**원본:** `src/app/main/components/MainDashboard.tsx` + `MainDashboard.module.scss`

| 작업 항목 | 세부 내용 |
|---|---|
| 2-1-1 | `MainDashboard.tsx` 분석 — KPI 카드, 최근 업데이트, 워크플로우 요약 |
| 2-1-2 | `MainDashboard.module.scss` → Tailwind 유틸리티 클래스로 재작성 (SCSS 파일 이전하지 않음) |
| 2-1-3 | 대시보드 컴포넌트 → `features/main-dashboard/src/main-dashboard.tsx` |
| 2-1-4 | KPI 카드 컴포넌트 → 반복 UI를 별도 컴포넌트 `features/main-dashboard/src/components/kpi-card.tsx`로 분리 |
| 2-1-5 | API 호출 → `@xgen/api-client` 변환 |
| 2-1-6 | 목업 데이터 → 실제 API 또는 목업 명시 분리 |
| 2-1-7 | `index.ts` — FeatureModule export (sidebarSection: 'workspace') |

### TASK 2-2. main-ChatIntroduction — 채팅 인트로

**원본:** `src/app/main/chatSection/components/ChatIntroduction.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 2-2-1 | `ChatIntroduction.tsx` 분석 — 채팅 기능 소개 UI |
| 2-2-2 | ContentArea 래퍼 → `@xgen/ui`의 ContentArea 사용 |
| 2-2-3 | 컴포넌트 → `features/main-ChatIntroduction/src/chat-introduction.tsx` |
| 2-2-4 | `index.ts` — FeatureModule export (sidebarSection: 'chat', introItems 포함) |

### TASK 2-3. main-NewChat — 새 채팅

**원본:** `src/app/main/chatSection/components/ChatContent.tsx` + 관련 컴포넌트

| 작업 항목 | 세부 내용 |
|---|---|
| 2-3-1 | `ChatContent.tsx` 분석 — 새 채팅 생성, 워크플로우 선택 |
| 2-3-2 | `ChatInterface.tsx` → `features/main-NewChat/src/components/chat-interface.tsx` |
| 2-3-3 | `ChatInput/` 디렉토리 → `features/main-NewChat/src/components/chat-input/` |
| 2-3-4 | `SoundInput/` → `features/main-NewChat/src/components/sound-input/` |
| 2-3-5 | `WorkflowSelection.tsx` → `features/main-NewChat/src/components/workflow-selection.tsx` |
| 2-3-6 | `WorkflowSelectionModal.tsx` → `features/main-NewChat/src/components/workflow-selection-modal.tsx` |
| 2-3-7 | chatSection hooks (`useChatState.ts`, `useInputHandling.ts` 등) — NewChat에서만 사용하는 것은 이 Feature 내부에, 여러 chat feature가 공유하면 `@xgen/utils` 또는 별도 패키지로 추출 |
| 2-3-8 | chatSection types → Feature 내부 `types/` 또는 `@xgen/types`에 추가 |
| 2-3-9 | chatSection assets (SCSS) → Tailwind 유틸리티 클래스로 재작성 (SCSS 파일 이전하지 않음) |
| 2-3-10 | `index.ts` — FeatureModule export (sidebarSection: 'chat') |

### TASK 2-4. main-CurrentChat — 현재 채팅

**원본:** `src/app/main/chatSection/components/CurrentChatInterface.tsx` + ChatContainer/ + 관련 컴포넌트

| 작업 항목 | 세부 내용 |
|---|---|
| 2-4-1 | `CurrentChatInterface.tsx` 분석 — 활성 채팅 세션 |
| 2-4-2 | `ChatContainer/` → `features/main-CurrentChat/src/components/chat-container/` |
| 2-4-3 | `ChatArea.tsx` → `features/main-CurrentChat/src/components/chat-area.tsx` |
| 2-4-4 | `ChatHeader.tsx` → `features/main-CurrentChat/src/components/chat-header.tsx` |
| 2-4-5 | `ChatInput/` → `features/main-CurrentChat/src/components/chat-input/` |
| 2-4-6 | `MessageList.tsx` → `features/main-CurrentChat/src/components/message-list.tsx` |
| 2-4-7 | `CollectionDisplay/` → `features/main-CurrentChat/src/components/collection-display/` |
| 2-4-8 | `FileDisplay/` → `features/main-CurrentChat/src/components/file-display/` |
| 2-4-9 | `ExecutionStatusBar.tsx` → `features/main-CurrentChat/src/components/execution-status-bar.tsx` |
| 2-4-10 | **공유 Hook 판단:** `useChatState`, `useCitationsMeta`, `useCollectionManagement`, `useFileManagement`, `useScrollManagement`, `useWorkflowExecution` — NewChat과 CurrentChat 모두 사용 시 `@xgen/utils` 이전, 단독 사용 시 Feature 내부 |
| 2-4-11 | ChatParser 사용 → `@xgen/ui`의 ChatParser import로 변경 (TASK 0-10-7에서 이전됨) |
| 2-4-12 | `index.ts` — FeatureModule export (sidebarSection: 'chat') |

### TASK 2-5. main-chat-history — 채팅 히스토리

**원본:** `src/app/main/chatSection/components/ChatHistory.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 2-5-1 | `ChatHistory.tsx` 분석 — 이전 채팅 목록, 검색, 필터 |
| 2-5-2 | 컴포넌트 → `features/main-chat-history/src/chat-history.tsx` |
| 2-5-3 | 관련 SCSS → Tailwind 유틸리티 클래스로 재작성 (SCSS 파일 이전하지 않음) |
| 2-5-4 | API 호출 (채팅 목록) → `@xgen/api-client` 변환 |
| 2-5-5 | `index.ts` — FeatureModule export (sidebarSection: 'chat') |

### TASK 2-6. main-WorkflowIntroduction — 워크플로우 인트로

**원본:** `src/app/main/workflowSection/components/WorkflowIntroduction.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 2-6-1 | `WorkflowIntroduction.tsx` → `features/main-WorkflowIntroduction/src/workflow-introduction.tsx` |
| 2-6-2 | ContentArea 래퍼 → `@xgen/ui` import |
| 2-6-3 | `index.ts` — FeatureModule export (sidebarSection: 'workflow', introItems 포함) |

### TASK 2-7. main-WorkflowManagement-Storage — 완성 워크플로우 저장소

**원본:** `src/app/main/workflowSection/components/workflows/CompletedWorkflows.tsx` + 관련 파일

| 작업 항목 | 세부 내용 |
|---|---|
| 2-7-1 | `CompletedWorkflows.tsx` 분석 — 워크플로우 목록, CRUD |
| 2-7-2 | `DeploySettings.tsx` → `features/main-WorkflowManagement-Storage/src/components/deploy-settings.tsx` |
| 2-7-3 | `WorkflowVersionModal.tsx` → `features/main-WorkflowManagement-Storage/src/components/workflow-version-modal.tsx` |
| 2-7-4 | `WorkflowEditModal.tsx` → `features/main-WorkflowManagement-Storage/src/components/workflow-edit-modal.tsx` |
| 2-7-5 | API 호출 → `@xgen/api-client` (workflow-api, workflow-deploy-api) |
| 2-7-6 | `index.ts` — FeatureModule export (sidebarSection: 'workflow') |

### TASK 2-8. main-WorkflowManagement-Store — 워크플로우 스토어 (마켓)

**원본:** `src/app/main/workflowSection/components/workflows/WorkflowStore.tsx` + 모달

| 작업 항목 | 세부 내용 |
|---|---|
| 2-8-1 | `WorkflowStore.tsx` → `features/main-WorkflowManagement-Store/src/workflow-store.tsx` |
| 2-8-2 | `WorkflowStoreDetailModal.tsx` → `features/main-WorkflowManagement-Store/src/components/workflow-store-detail-modal.tsx` |
| 2-8-3 | `WorkflowStoreMiniCanvas.tsx` → `features/main-WorkflowManagement-Store/src/components/workflow-store-mini-canvas.tsx` |
| 2-8-4 | `WorkflowStoreUploadModal.tsx` → `features/main-WorkflowManagement-Store/src/components/workflow-store-upload-modal.tsx` |
| 2-8-5 | `index.ts` — FeatureModule export (sidebarSection: 'workflow') |

### TASK 2-9. main-WorkflowManagement-Scheduler — 워크플로우 스케줄러

**원본:** `src/app/main/workflowSection/components/WorkflowScheduler.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 2-9-1 | `WorkflowScheduler.tsx` → `features/main-WorkflowManagement-Scheduler/src/workflow-scheduler.tsx` |
| 2-9-2 | 스케줄 API → `@xgen/api-client` (schedule-api) |
| 2-9-3 | `index.ts` export |

### TASK 2-10. main-WorkflowManagement-Tester — 워크플로우 테스터

**원본:** `src/app/main/workflowSection/components/WorkflowTester.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 2-10-1 | `WorkflowTester.tsx` → `features/main-WorkflowManagement-Tester/src/workflow-tester.tsx` |
| 2-10-2 | BatchTesterContext 사용 → `@xgen/contexts` 또는 Feature 내부 Context |
| 2-10-3 | `index.ts` export |

### TASK 2-11. main-DocumentManagement-Collections — 문서 컬렉션

**원본:** `src/app/main/workflowSection/components/documents/DocumentCollectionsSection.tsx` + 관련

| 작업 항목 | 세부 내용 |
|---|---|
| 2-11-1 | `DocumentCollectionsSection.tsx` → `features/main-DocumentManagement-Collections/src/document-collections-section.tsx` |
| 2-11-2 | `DocumentDirectoryModal.tsx` → `features/main-DocumentManagement-Collections/src/components/document-directory-modal.tsx` |
| 2-11-3 | `DocumentDirectory.tsx` → `features/main-DocumentManagement-Collections/src/components/document-directory.tsx` |
| 2-11-4 | `DocumentDocumentsSection.tsx` → `features/main-DocumentManagement-Collections/src/components/document-documents-section.tsx` |
| 2-11-5 | `DocumentsDirectoryTree.tsx` → `features/main-DocumentManagement-Collections/src/components/documents-directory-tree.tsx` |
| 2-11-6 | `DocumentsGraph.tsx` → `features/main-DocumentManagement-Collections/src/components/documents-graph.tsx` |
| 2-11-7 | 관련 모달 (11개+) → 각각 `components/` 하위에 배치 |
| 2-11-8 | RAG API 호출 → `@xgen/api-client` (rag/) |
| 2-11-9 | `index.ts` — FeatureModule + DocumentTabConfig export |

### TASK 2-12. main-DocumentManagement-FileStorage — 파일 스토리지

**원본:** `src/app/main/workflowSection/components/documents/DocumentFileStorage*.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 2-12-1 | `DocumentFileStorageSection.tsx` → `features/main-DocumentManagement-FileStorage/src/document-file-storage-section.tsx` |
| 2-12-2 | `DocumentFileStorageDocumentsSection.tsx` → 해당 Feature 내부 |
| 2-12-3 | `DocumentFileStorageModal.tsx` → 해당 Feature 내부 |
| 2-12-4 | `FileStorageDirectoryModal.tsx` → 해당 Feature 내부 |
| 2-12-5 | `FileStorageDirectoryTree.tsx` → 해당 Feature 내부 |
| 2-12-6 | `index.ts` — FeatureModule + DocumentTabConfig export |

### TASK 2-13. main-DocumentManagement-Repository — 문서 레포지토리

**원본:** `src/app/main/workflowSection/components/documents/DocumentRepositoriesSection.tsx` + 모달

| 작업 항목 | 세부 내용 |
|---|---|
| 2-13-1 | `DocumentRepositoriesSection.tsx` → `features/main-DocumentManagement-Repository/src/document-repositories-section.tsx` |
| 2-13-2 | `DocumentRepositoryModal.tsx` → 해당 Feature 내부 |
| 2-13-3 | `index.ts` — FeatureModule + DocumentTabConfig export |

### TASK 2-14. main-DocumentManagement-Database — 데이터베이스 연결

**원본:** `src/app/main/workflowSection/components/documents/DatabaseConnections.tsx` + 모달

| 작업 항목 | 세부 내용 |
|---|---|
| 2-14-1 | `DatabaseConnections.tsx` → `features/main-DocumentManagement-Database/src/database-connections.tsx` |
| 2-14-2 | `DatabaseConnectionFormModal.tsx` → 해당 Feature 내부 |
| 2-14-3 | `DatabaseConnectionDetailModal.tsx` → 해당 Feature 내부 |
| 2-14-4 | `credentialCrypto.ts` → `@xgen/utils` 사용 |
| 2-14-5 | `index.ts` — FeatureModule + DocumentTabConfig export |

### TASK 2-15. main-ExecutionTools — 도구 스토리지

**원본:** `src/app/main/workflowSection/components/ToolStorage.tsx` + `tools/`

| 작업 항목 | 세부 내용 |
|---|---|
| 2-15-1 | `ToolStorage.tsx` → `features/main-ExecutionTools/src/tool-storage.tsx` |
| 2-15-2 | `ToolStorageDetailModal.tsx` → 해당 Feature 내부 |
| 2-15-3 | `ToolStorageUpload.tsx` → 해당 Feature 내부 |
| 2-15-4 | `ToolStore.tsx` → 별도 Feature 또는 같은 Feature 내에서 탭 분리 판단 |
| 2-15-5 | `ToolStoreDetailModal.tsx`, `ToolStoreUploadModal.tsx` → 해당 Feature 내부 |
| 2-15-6 | `index.ts` export |

### TASK 2-16. main-PromptManagement-Storage — 프롬프트 저장소

**원본:** `src/app/main/workflowSection/components/prompt/PromptStorage.tsx` + 관련

| 작업 항목 | 세부 내용 |
|---|---|
| 2-16-1 | `PromptStorage.tsx` → `features/main-PromptManagement-Storage/src/prompt-storage.tsx` |
| 2-16-2 | `PromptCreateModal.tsx` → 해당 Feature 내부 |
| 2-16-3 | `PromptEditModal.tsx` → 해당 Feature 내부 |
| 2-16-4 | `PromptExpandModal.tsx` → 해당 Feature 내부 |
| 2-16-5 | `PromptVersionModal.tsx` → 해당 Feature 내부 |
| 2-16-6 | `index.ts` export |

### TASK 2-17. main-PromptManagement-Store — 프롬프트 스토어

**원본:** `src/app/main/workflowSection/components/prompt/PromptStore.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 2-17-1 | `PromptStore.tsx` → `features/main-PromptManagement-Store/src/prompt-store.tsx` |
| 2-17-2 | `PromptStoreUpload.tsx` → 해당 Feature 내부 |
| 2-17-3 | `index.ts` export |

### TASK 2-18. main-AuthProfileManagement-Storage — 인증 프로필 저장소

**원본:** `src/app/main/workflowSection/components/AuthProfile.tsx` + 관련

| 작업 항목 | 세부 내용 |
|---|---|
| 2-18-1 | `AuthProfile.tsx` → `features/main-AuthProfileManagement-Storage/src/auth-profile.tsx` |
| 2-18-2 | `AuthProfileUpload.tsx` → 해당 Feature 내부 |
| 2-18-3 | `index.ts` export |

### TASK 2-19. main-AuthProfileManagement-Store — 인증 프로필 스토어

**원본:** `src/app/main/workflowSection/components/AuthProfileStoreUploadModal.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 2-19-1 | `AuthProfileStoreUploadModal.tsx` → `features/main-AuthProfileManagement-Store/src/auth-profile-store.tsx` |
| 2-19-2 | `index.ts` export |

### TASK 2-20. main-ModelIntroduction — 모델 인트로

**원본:** `src/app/main/modelSection/components/ModelIntroduction.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 2-20-1 | `ModelIntroduction.tsx` → `features/main-ModelIntroduction/src/model-introduction.tsx` |
| 2-20-2 | `index.ts` — FeatureModule export (sidebarSection: 'model', introItems 포함) |

### TASK 2-21. main-Training — 모델 트레이닝

**원본:** `src/app/main/modelSection/components/TrainPageContent.tsx` + `Train/`

| 작업 항목 | 세부 내용 |
|---|---|
| 2-21-1 | `TrainPageContent.tsx` → `features/main-Training/src/train-page-content.tsx` |
| 2-21-2 | `Train/BasicCategory.tsx` → 해당 Feature 내부 `components/basic-category.tsx` |
| 2-21-3 | `Train/DataCategory.tsx` → `components/data-category.tsx` |
| 2-21-4 | `Train/DataStorageModal.tsx` → `components/data-storage-modal.tsx` |
| 2-21-5 | `Train/ModelCategory.tsx` → `components/model-category.tsx` |
| 2-21-6 | `Train/ModelStorageModal.tsx` → `components/model-storage-modal.tsx` |
| 2-21-7 | `Train/TrainerCategory.tsx` → `components/trainer-category.tsx` |
| 2-21-8 | `Train/sampleHandler.tsx` → `components/sample-handler.tsx` |
| 2-21-9 | Trainer API → `@xgen/api-client` (trainer/train-api) |
| 2-21-10 | `index.ts` export (sidebarSection: 'model') |

### TASK 2-22. main-TrainMonitor — 트레이닝 모니터

**원본:** `src/app/main/modelSection/components/MetricsPageContent.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 2-22-1 | `MetricsPageContent.tsx` → `features/main-TrainMonitor/src/metrics-page-content.tsx` |
| 2-22-2 | 차트 컴포넌트 분리 (필요시) |
| 2-22-3 | SSE 연결 → `@xgen/utils` (sse-manager) |
| 2-22-4 | `index.ts` export (sidebarSection: 'model') |

> **주의:** `MetricsPageContent.tsx`는 `train-monitor`와 `ml-train-monitor` 모두에서 공유됨. 코드 복제 없이 하나의 공통 컴포넌트로 만들어 두 Feature에서 사용하거나, packages/ui에 올릴지 결정 필요.

### TASK 2-23. main-Evaluation — 모델 평가

**원본:** `src/app/main/modelSection/components/EvalPageContent.tsx` + `Eval/`

| 작업 항목 | 세부 내용 |
|---|---|
| 2-23-1 | `EvalPageContent.tsx` → `features/main-Evaluation/src/eval-page-content.tsx` |
| 2-23-2 | `Eval/EvaluationTable.tsx` → `components/evaluation-table.tsx` |
| 2-23-3 | `Eval/JobDetailModal.tsx` → `components/job-detail-modal.tsx` |
| 2-23-4 | `Eval/SelectionPopup.tsx` → `components/selection-popup.tsx` |
| 2-23-5 | `Eval/TaskSelector.tsx` → `components/task-selector.tsx` |
| 2-23-6 | `Eval/utils/eval.ts` → `utils/eval.ts` (Feature 내부) |
| 2-23-7 | Trainer API → `@xgen/api-client` (trainer/eval-api) |
| 2-23-8 | `index.ts` export (sidebarSection: 'model') |

### TASK 2-24. main-ModelStorage — 모델 스토리지

**원본:** `src/app/main/modelSection/components/StoragePageContent.tsx` + `Storage/`

| 작업 항목 | 세부 내용 |
|---|---|
| 2-24-1 | `StoragePageContent.tsx` → `features/main-ModelStorage/src/storage-page-content.tsx` |
| 2-24-2 | `Storage/StorageDatasetInfoModal.tsx` → `components/storage-dataset-info-modal.tsx` |
| 2-24-3 | `Storage/StorageModelInfoModal.tsx` → `components/storage-model-info-modal.tsx` |
| 2-24-4 | `index.ts` export (sidebarSection: 'model') |

### TASK 2-25. main-MLModelIntroduction — ML 모델 인트로

**원본:** `src/app/main/mlSection/components/MlModelIntroduction.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 2-25-1 | `MlModelIntroduction.tsx` → `features/main-MLModelIntroduction/src/ml-model-introduction.tsx` |
| 2-25-2 | `MlModelIntro.module.scss` → Tailwind 유틸리티 클래스로 재작성 (SCSS 파일 이전하지 않음) |
| 2-25-3 | `index.ts` export (sidebarSection: 'mlModel', introItems 포함) |

### TASK 2-26. main-ModelUpload — 모델 업로드

**원본:** `src/app/ml-inference/components/model-upload/`

| 작업 항목 | 세부 내용 |
|---|---|
| 2-26-1 | `MlModelUploadView.tsx` → `features/main-ModelUpload/src/ml-model-upload-view.tsx` |
| 2-26-2 | `UploadModelSection.tsx` → `features/main-ModelUpload/src/components/upload-model-section.tsx` |
| 2-26-3 | `index.ts` export (sidebarSection: 'mlModel') |

### TASK 2-27. main-ModelHub — 모델 허브

**원본:** `src/app/ml-inference/components/model-hub/`

| 작업 항목 | 세부 내용 |
|---|---|
| 2-27-1 | `MlModelHubView.tsx` → `features/main-ModelHub/src/ml-model-hub-view.tsx` |
| 2-27-2 | `ModelDetailModal.tsx` → `components/model-detail-modal.tsx` |
| 2-27-3 | `ModelDetailPanel.tsx` → `components/model-detail-panel.tsx` |
| 2-27-4 | `ModelRegistryPanel.tsx` → `components/model-registry-panel.tsx` |
| 2-27-5 | `ModelStageDialog.tsx` + `ModelStageDialogContainer.tsx` → `components/model-stage-dialog.tsx` |
| 2-27-6 | `ModelVersionDialog.tsx` → `components/model-version-dialog.tsx` |
| 2-27-7 | `DeleteModelDialog.tsx` + Container → `components/delete-model-dialog.tsx` |
| 2-27-8 | ML API → `@xgen/api-client` (ml-api, huggingface-api) |
| 2-27-9 | `index.ts` export (sidebarSection: 'mlModel') |

### TASK 2-28. main-ModelInference — 모델 추론

**원본:** `src/app/ml-inference/components/model-infer/`

| 작업 항목 | 세부 내용 |
|---|---|
| 2-28-1 | `MlModelInferenceView.tsx` → `features/main-ModelInference/src/ml-model-inference-view.tsx` |
| 2-28-2 | `InferenceConsole.tsx` → `components/inference-console.tsx` |
| 2-28-3 | ML API → `@xgen/api-client` |
| 2-28-4 | `index.ts` export (sidebarSection: 'mlModel') |

### TASK 2-29. ML 공유 컴포넌트 처리

**원본:** `src/app/ml-inference/components/` (공통 파일)

| 작업 항목 | 세부 내용 |
|---|---|
| 2-29-1 | `MlModelWorkspaceContext.tsx` → 판단: 3개 ML Feature (upload, hub, inference)가 공유 → `@xgen/contexts` 또는 `packages/` 내 별도 처리 |
| 2-29-2 | `MlModelWorkspacePage.tsx` → 라우팅/레이아웃 역할 → `apps/web/src/app/ml-inference/` 에 유지 (조립 레이어) |
| 2-29-3 | `MlModelToolbar.tsx` → 공유 UI → `@xgen/ui` 또는 해당 Feature 내 |
| 2-29-4 | `MlModelFullView.tsx` → 해당 Feature 내부 |
| 2-29-5 | `MlModelWorkspace.module.scss` → Tailwind 유틸리티 클래스로 재작성 (SCSS 파일 이전하지 않음) |
| 2-29-6 | `types.ts` → `@xgen/types`에 ML 관련 타입 추가 |
| 2-29-7 | `utils/stageUtils.ts` → `@xgen/utils` 또는 Feature 내부 |

### TASK 2-30. main-MLTraining — ML 트레이닝

**원본:** `src/app/main/mlSection/components/MLTrainPage.tsx` + 관련

| 작업 항목 | 세부 내용 |
|---|---|
| 2-30-1 | `MLTrainPage.tsx` → `features/main-MLTraining/src/ml-train-page.tsx` |
| 2-30-2 | `BasicCategory.tsx` → `components/basic-category.tsx` |
| 2-30-3 | `DataCategory.tsx` → `components/data-category.tsx` |
| 2-30-4 | `ModelCategory.tsx` → `components/model-category.tsx` |
| 2-30-5 | `UserScriptCatalog.tsx` → `components/user-script-catalog.tsx` |
| 2-30-6 | `UserScriptWorkbench.tsx` → `components/user-script-workbench.tsx` |
| 2-30-7 | `MLTrain.module.scss`, `UserScriptWorkbench.module.scss` → Tailwind 유틸리티 클래스로 재작성 (SCSS 파일 이전하지 않음) |
| 2-30-8 | `index.ts` export (sidebarSection: 'mlModel') |

### TASK 2-31. main-MLTrainMonitor — ML 트레이닝 모니터

**원본:** `MetricsPageContent.tsx` (main-TrainMonitor와 공유)

| 작업 항목 | 세부 내용 |
|---|---|
| 2-31-1 | MetricsPageContent 공유 전략 확정 — (A) `@xgen/ui`에 MetricsView 공통 컴포넌트 또는 (B) 코드 복제 |
| 2-31-2 | `features/main-MLTrainMonitor/src/` 에 적절히 배치 |
| 2-31-3 | `index.ts` export (sidebarSection: 'mlModel') |

### TASK 2-32. main-ScenarioRecorder — 시나리오 레코더

**원본:** `src/app/scenario-recorder/` (전체)

| 작업 항목 | 세부 내용 |
|---|---|
| 2-32-1 | `page.tsx` 분석 — 녹화/재생 통합 인터페이스 |
| 2-32-2 | `components/ActionEditor.tsx` → `features/main-ScenarioRecorder/src/components/action-editor.tsx` |
| 2-32-3 | `components/ActionList.tsx` → `components/action-list.tsx` |
| 2-32-4 | `components/AgentChat.tsx` → `components/agent-chat.tsx` |
| 2-32-5 | `components/BrowserPreview.tsx` → `components/browser-preview.tsx` |
| 2-32-6 | `components/TauriBrowserPreview.tsx` → `components/tauri-browser-preview.tsx` |
| 2-32-7 | `components/ScenarioList.tsx` → `components/scenario-list.tsx` |
| 2-32-8 | `components/SaveScenarioModal.tsx` → `components/save-scenario-modal.tsx` |
| 2-32-9 | `components/EditScenarioModal.tsx` → `components/edit-scenario-modal.tsx` |
| 2-32-10 | `components/ExecuteScenarioModal.tsx` → `components/execute-scenario-modal.tsx` |
| 2-32-11 | `components/ExecutionLogsPanel.tsx` → `components/execution-logs-panel.tsx` |
| 2-32-12 | `components/ExecutionStatusPanel.tsx` → `components/execution-status-panel.tsx` |
| 2-32-13 | `hooks/` (6 파일) → `features/main-ScenarioRecorder/src/hooks/` 이전 |
| 2-32-14 | `lib/ScenarioExecutor.ts` → `features/main-ScenarioRecorder/src/lib/scenario-executor.ts` |
| 2-32-15 | `api/scenarioRecorderAPI.ts` → `@xgen/api-client` 또는 Feature 내부 |
| 2-32-16 | `types/index.ts` → Feature 내부 types |
| 2-32-17 | `index.ts` export |

---

## 7. Phase 3 — Canvas 시스템 마이그레이션

> **목표:** 캔버스 에디터 시스템을 CanvasSubModule 아키텍처로 분해 이전

### TASK 3-0. canvas-intro — 캔버스 인트로

**원본:** `src/app/main/workflowSection/components/CanvasIntroduction.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 3-0-1 | `CanvasIntroduction.tsx` → `features/canvas-intro/src/canvas-introduction.tsx` |
| 3-0-2 | `index.ts` export |

### TASK 3-1. canvas-core — 캔버스 코어

**원본:** `src/app/canvas/components/Canvas/` + `canvas/page.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 3-1-1 | `Canvas/index.tsx` → `features/canvas-core/src/canvas.tsx` — 메인 캔버스 렌더러 |
| 3-1-2 | `Canvas/components/CanvasNodes.tsx` → `features/canvas-core/src/components/canvas-nodes.tsx` |
| 3-1-3 | `Canvas/components/CanvasEdges.tsx` → `features/canvas-core/src/components/canvas-edges.tsx` |
| 3-1-4 | `Canvas/hooks/useCanvasEventHandlers.ts` → `hooks/use-canvas-event-handlers.ts` |
| 3-1-5 | `Canvas/hooks/useCanvasSelection.ts` → `hooks/use-canvas-selection.ts` |
| 3-1-6 | `Canvas/hooks/useCanvasView.ts` → `hooks/use-canvas-view.ts` |
| 3-1-7 | `Canvas/hooks/useDragState.ts` → `hooks/use-drag-state.ts` |
| 3-1-8 | `Canvas/hooks/useEdgeManagement.ts` → `hooks/use-edge-management.ts` |
| 3-1-9 | `Canvas/hooks/useHistoryManagement.ts` → `hooks/use-history-management.ts` |
| 3-1-10 | `Canvas/hooks/useKeyboardHandlers.ts` → `hooks/use-keyboard-handlers.ts` |
| 3-1-11 | `Canvas/hooks/useNodeManagement.ts` → `hooks/use-node-management.ts` |
| 3-1-12 | `Canvas/hooks/usePortHandlers.ts` → `hooks/use-port-handlers.ts` |
| 3-1-13 | `Canvas/types/index.ts` → `types/index.ts` |
| 3-1-14 | `Canvas/utils/canvasUtils.ts` → `utils/canvas-utils.ts` |
| 3-1-15 | `canvas/types.ts` → 공유 Canvas 타입 → `@xgen/types`에 추가 |
| 3-1-16 | `CanvasEmptyState.tsx` → `components/canvas-empty-state.tsx` |
| 3-1-17 | `CanvasContextMenu.tsx` → `components/canvas-context-menu.tsx` |
| 3-1-18 | 관련 SCSS 파일 → Tailwind 유틸리티 클래스로 재작성 (SCSS 파일 이전하지 않음) |
| 3-1-19 | `index.ts` — CanvasSubModule export |

### TASK 3-2. canvas-node-system — 노드 시스템

**원본:** `src/app/canvas/components/Node/`

| 작업 항목 | 세부 내용 |
|---|---|
| 3-2-1 | `Node/index.tsx` → `features/canvas-node-system/src/node.tsx` |
| 3-2-2 | `Node/components/NodeHeader.tsx` → `components/node-header.tsx` |
| 3-2-3 | `Node/components/NodePorts.tsx` → `components/node-ports.tsx` |
| 3-2-4 | `Node/components/NodePortsCollapsed.tsx` → `components/node-ports-collapsed.tsx` |
| 3-2-5 | `Node/components/NodeParameters.tsx` → `components/node-parameters.tsx` |
| 3-2-6 | `Node/components/NodeContextMenu.tsx` → `components/node-context-menu.tsx` |
| 3-2-7 | `Node/components/RouterNodePorts.tsx` → `components/router-node-ports.tsx` |
| 3-2-8 | `Node/components/parameters/ApiParameter.tsx` → `components/parameters/api-parameter.tsx` |
| 3-2-9 | `Node/components/parameters/BooleanParameter.tsx` → `components/parameters/boolean-parameter.tsx` |
| 3-2-10 | `Node/components/parameters/DefaultParameter.tsx` → `components/parameters/default-parameter.tsx` |
| 3-2-11 | `Node/components/parameters/ExpandableParameter.tsx` → `components/parameters/expandable-parameter.tsx` |
| 3-2-12 | `Node/components/parameters/FileParameter.tsx` → `components/parameters/file-parameter.tsx` |
| 3-2-13 | `Node/components/parameters/HandleParameter.tsx` → `components/parameters/handle-parameter.tsx` |
| 3-2-14 | `Node/components/parameters/ToolNameParameter.tsx` → `components/parameters/tool-name-parameter.tsx` |
| 3-2-15 | `Node/components/specialized/RouterNodeParameters.tsx` → `components/specialized/router-node-parameters.tsx` |
| 3-2-16 | `Node/components/specialized/SchemaProviderNodeParameters.tsx` → `components/specialized/schema-provider-node-parameters.tsx` |
| 3-2-17 | `Node/hooks/useApiParameters.ts` → `hooks/use-api-parameters.ts` |
| 3-2-18 | `Node/hooks/useNodeContextMenu.ts` → `hooks/use-node-context-menu.ts` |
| 3-2-19 | `Node/hooks/useNodeEditing.ts` → `hooks/use-node-editing.ts` |
| 3-2-20 | `Node/hooks/useParameterEditing.ts` → `hooks/use-parameter-editing.ts` |
| 3-2-21 | `Node/types/index.ts` → `types/index.ts` |
| 3-2-22 | `Node/utils/nodeUtils.ts` → `utils/node-utils.ts` |
| 3-2-23 | `Node/utils/parameterUtils.ts` → `utils/parameter-utils.ts` |
| 3-2-24 | `Node/utils/portUtils.ts` → `utils/port-utils.ts` |
| 3-2-25 | `NodeModal.tsx` → `components/node-modal.tsx` |
| 3-2-26 | `NodeDetailModal.tsx` → `components/node-detail-modal.tsx` |
| 3-2-27 | `index.ts` — CanvasSubModule export |

### TASK 3-3. canvas-edge-system — 엣지 시스템

**원본:** `src/app/canvas/components/Edge.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 3-3-1 | `Edge.tsx` → `features/canvas-edge-system/src/edge.tsx` |
| 3-3-2 | 엣지 관련 SCSS → Tailwind 유틸리티 클래스로 재작성 (SCSS 파일 이전하지 않음) |
| 3-3-3 | `index.ts` — CanvasSubModule export |

### TASK 3-4. canvas-header — 캔버스 헤더

**원본:** `src/app/canvas/components/Header.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 3-4-1 | `Header.tsx` → `features/canvas-header/src/header.tsx` |
| 3-4-2 | 워크플로우 저장/로드 UI, workflow API → `@xgen/api-client` |
| 3-4-3 | `index.ts` — CanvasSubModule export (headerActions 제공) |

### TASK 3-5. canvas-side-menu — 사이드 메뉴

**원본:** `src/app/canvas/components/SideMenu.tsx` + `SideMenuPanel/`

| 작업 항목 | 세부 내용 |
|---|---|
| 3-5-1 | `SideMenu.tsx` → `features/canvas-side-menu/src/side-menu.tsx` |
| 3-5-2 | `SideMenuPanel/AddNodePanel.tsx` → `components/add-node-panel.tsx` |
| 3-5-3 | `SideMenuPanel/TemplatePanel.tsx` → `components/template-panel.tsx` |
| 3-5-4 | `SideMenuPanel/TemplatePreview.tsx` → `components/template-preview.tsx` |
| 3-5-5 | `SideMenuPanel/WorkflowPanel.tsx` → `components/workflow-panel.tsx` |
| 3-5-6 | `SideMenuPanel/MiniCanvas.tsx` → `components/mini-canvas.tsx` |
| 3-5-7 | `Helper/DraggableNodeItem.tsx` → `components/draggable-node-item.tsx` |
| 3-5-8 | `Helper/NodeList.tsx` → `components/node-list.tsx` |
| 3-5-9 | `index.ts` — CanvasSubModule export (sidePanels 제공) |

### TASK 3-6. canvas-execution — 캔버스 실행

**원본:** `src/app/canvas/components/ExecutionPanel.tsx` + `EditRunFloating.tsx` + `BottomExecutionLogPanel.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 3-6-1 | `ExecutionPanel.tsx` → `features/canvas-execution/src/execution-panel.tsx` |
| 3-6-2 | `EditRunFloating.tsx` → `components/edit-run-floating.tsx` |
| 3-6-3 | `BottomExecutionLogPanel.tsx` → `components/bottom-execution-log-panel.tsx` |
| 3-6-4 | `CanvasBottomPanelContent.tsx` → `components/canvas-bottom-panel-content.tsx` |
| 3-6-5 | workflow tracker → `@xgen/api-client` |
| 3-6-6 | `index.ts` — CanvasSubModule export (bottomPanels 제공) |

### TASK 3-7. canvas-history — 캔버스 히스토리

**원본:** `src/app/canvas/components/HistoryPanel.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 3-7-1 | `HistoryPanel.tsx` → `features/canvas-history/src/history-panel.tsx` |
| 3-7-2 | `Canvas/hooks/usePredictedNodes.ts` → 이 Feature 또는 canvas-core에 배치 판단 |
| 3-7-3 | `index.ts` — CanvasSubModule export (sidePanels 제공) |

### TASK 3-8. canvas-auto-workflow — 자동 워크플로우

**원본:** `src/app/canvas/components/AutoWorkflowSidebar.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 3-8-1 | `AutoWorkflowSidebar.tsx` → `features/canvas-auto-workflow/src/auto-workflow-sidebar.tsx` |
| 3-8-2 | `AutoWorkflowSidebar.module.scss` → Tailwind 유틸리티 클래스로 재작성 (SCSS 파일 이전하지 않음) |
| 3-8-3 | Auto Workflow API → `@xgen/api-client` (auto-workflow-api) |
| 3-8-4 | `index.ts` — CanvasSubModule export (sidePanels 제공) |

### TASK 3-9. canvas-special-nodes — 특수 노드

**원본:** `src/app/canvas/components/SpecialNode/`

| 작업 항목 | 세부 내용 |
|---|---|
| 3-9-1 | `AgentXgenNode.tsx` → `features/canvas-special-nodes/src/agent-xgen-node.tsx` |
| 3-9-2 | `RouterNode.tsx` → `router-node.tsx` |
| 3-9-3 | `SchemaProviderNode.tsx` → `schema-provider-node.tsx` |
| 3-9-4 | `specialNode.ts` + `specialNode.js` → `special-node-config.ts` (통합, TS 변환) |
| 3-9-5 | `index.ts` — CanvasSubModule export (specialNodeTypes 제공) |

### TASK 3-10. Canvas 상수/샘플 데이터 처리

**원본:** `src/app/canvas/constants/`

| 작업 항목 | 세부 내용 |
|---|---|
| 3-10-1 | `constants/nodes.js` → `features/canvas-core/src/constants/nodes.ts` (JS→TS) |
| 3-10-2 | `constants/workflow/*.json` → `features/canvas-core/src/constants/` (샘플 워크플로우) |

---

## 8. Phase 4 — Admin 페이지 마이그레이션

> **목표:** 관리자 화면 33개 view를 각각 독립 AdminSubModule Feature로 이전

### TASK 4-0. admin-Admin — 관리자 대시보드

**원본:** `src/app/admin/components/AdminDashboardContent.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 4-0-1 | `AdminDashboardContent.tsx` → `features/admin-Admin/src/admin-dashboard-content.tsx` |
| 4-0-2 | `AdminSidebar.tsx` → `apps/web/src/components/` (조립 레이어, 어드민 레이아웃) |
| 4-0-3 | `AdminPageContent.tsx` → `apps/web/src/components/` (라우팅 로직, 조립 레이어) |
| 4-0-4 | `index.ts` — AdminSubModule export |

### TASK 4-1. admin-Users — 사용자 관리

**원본:** `src/app/admin/components/AdminUserContent.tsx` + 모달

| 작업 항목 | 세부 내용 |
|---|---|
| 4-1-1 | `AdminUserContent.tsx` → `features/admin-Users/src/admin-user-content.tsx` — 사용자 목록, 검색, 필터 |
| 4-1-2 | `AdminUserAddModal.tsx` → `components/admin-user-add-modal.tsx` — 사용자 추가 모달 |
| 4-1-3 | `AdminUserEditModal.tsx` → `components/admin-user-edit-modal.tsx` — 사용자 편집 모달 |
| 4-1-4 | Auth API → `@xgen/api-client` |
| 4-1-5 | `index.ts` — AdminSubModule export (sidebarSection: 'user-management') |

### TASK 4-2. admin-UserCreate — 사용자 등록

**원본:** `src/app/admin/components/AdminRegisterUser.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 4-2-1 | `AdminRegisterUser.tsx` → `features/admin-UserCreate/src/admin-register-user.tsx` |
| 4-2-2 | `index.ts` — AdminSubModule export |

### TASK 4-3. admin-GroupPermissions — 그룹 권한

**원본:** `src/app/admin/components/AdminGroupContent.tsx` + `modals/`

| 작업 항목 | 세부 내용 |
|---|---|
| 4-3-1 | `AdminGroupContent.tsx` → `features/admin-GroupPermissions/src/admin-group-content.tsx` |
| 4-3-2 | `modals/AdminGroupAddModal.tsx` → `components/admin-group-add-modal.tsx` |
| 4-3-3 | `modals/AdminGroupCreateModal.tsx` → `components/admin-group-create-modal.tsx` |
| 4-3-4 | `modals/AdminGroupPermissionModal.tsx` → `components/admin-group-permission-modal.tsx` |
| 4-3-5 | `index.ts` — AdminSubModule export |

### TASK 4-4. admin-WorkflowManagement — 워크플로우 관리

**원본:** `src/app/admin/components/AdminWorkflowControll.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 4-4-1 | `AdminWorkflowControll.tsx` → `features/admin-WorkflowManagement/src/admin-workflow-control.tsx` |
| 4-4-2 | workflow API → `@xgen/api-client` |
| 4-4-3 | `index.ts` — AdminSubModule export |

### TASK 4-5. admin-WorkflowMonitoring — 워크플로우 모니터링 (Playground)

**원본:** `src/app/admin/components/AdminPlayground.tsx` + `playground/`

| 작업 항목 | 세부 내용 |
|---|---|
| 4-5-1 | `AdminPlayground.tsx` → `features/admin-WorkflowMonitoring/src/admin-playground.tsx` — 4탭 (executor, monitoring, batchtester, test-logs) |
| 4-5-2 | `playground/Executor.tsx` → `components/executor.tsx` |
| 4-5-3 | `playground/Monitor.tsx` → `components/monitor.tsx` |
| 4-5-4 | `playground/Tester.tsx` → `components/tester.tsx` |
| 4-5-5 | `playground/TesterLogs.tsx` → `components/tester-logs.tsx` |
| 4-5-6 | `playground/charts/` → `components/charts/` (차트 컴포넌트 전체) |
| 4-5-7 | SSE Manager → `@xgen/utils` |
| 4-5-8 | `index.ts` — AdminSubModule export |

### TASK 4-6. admin-TestMonitoring — 테스트 모니터링

**원본:** `src/app/admin/components/AdminWorkflowTestMonitoring.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 4-6-1 | `AdminWorkflowTestMonitoring.tsx` → `features/admin-TestMonitoring/src/admin-workflow-test-monitoring.tsx` |
| 4-6-2 | `index.ts` — AdminSubModule export |

### TASK 4-7. admin-AgentTraces — 에이전트 추적

**원본:** `src/app/admin/components/AdminAgentTraces.tsx` + `AdminAgentTraceDetail.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 4-7-1 | `AdminAgentTraces.tsx` → `features/admin-AgentTraces/src/admin-agent-traces.tsx` |
| 4-7-2 | `AdminAgentTraceDetail.tsx` → `components/admin-agent-trace-detail.tsx` |
| 4-7-3 | `index.ts` — AdminSubModule export |

### TASK 4-8. admin-NodeManagement — 노드 관리

**원본:** `src/app/admin/components/AdminNodeManage.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 4-8-1 | `AdminNodeManage.tsx` → `features/admin-NodeManagement/src/admin-node-manage.tsx` |
| 4-8-2 | node API → `@xgen/api-client` |
| 4-8-3 | `index.ts` — AdminSubModule export |

### TASK 4-9. admin-ChatMonitoring — 채팅 모니터링

**원본:** `src/app/admin/components/AdminWorkflowChatLogsContent.tsx` + 모달

| 작업 항목 | 세부 내용 |
|---|---|
| 4-9-1 | `AdminWorkflowChatLogsContent.tsx` → `features/admin-ChatMonitoring/src/admin-workflow-chat-logs-content.tsx` |
| 4-9-2 | `AdminWorkflowChatLogsDetailModal.tsx` → `components/admin-workflow-chat-logs-detail-modal.tsx` |
| 4-9-3 | `index.ts` — AdminSubModule export |

### TASK 4-10. admin-UserTokenDashboard — 유저 토큰 대시보드

**원본:** `src/app/admin/components/AdminUserTokenDashboard.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 4-10-1 | `AdminUserTokenDashboard.tsx` → `features/admin-UserTokenDashboard/src/admin-user-token-dashboard.tsx` |
| 4-10-2 | `index.ts` — AdminSubModule export |

### TASK 4-11. admin-WorkflowStore — 워크플로우 스토어

**원본:** `src/app/admin/components/AdminWorkflowStore.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 4-11-1 | `AdminWorkflowStore.tsx` → `features/admin-WorkflowStore/src/admin-workflow-store.tsx` |
| 4-11-2 | `index.ts` — AdminSubModule export |

### TASK 4-12. admin-PromptStore — 관리자 프롬프트 관리

**원본:** `src/app/admin/components/AdminPromptStore/` (4 파일)

| 작업 항목 | 세부 내용 |
|---|---|
| 4-12-1 | `AdminPromptStore.tsx` → `features/admin-PromptStore/src/admin-prompt-store.tsx` |
| 4-12-2 | `AdminPromptCreateModal.tsx` → `components/admin-prompt-create-modal.tsx` |
| 4-12-3 | `AdminPromptEditModal.tsx` → `components/admin-prompt-edit-modal.tsx` |
| 4-12-4 | `AdminPromptExpandModal.tsx` → `components/admin-prompt-expand-modal.tsx` |
| 4-12-5 | `index.ts` — AdminSubModule export |

### TASK 4-13. admin-SystemSettings — 시스템 설정

**원본:** `src/app/admin/components/AdminSettings.tsx` + `config/` (매우 복잡)

| 작업 항목 | 세부 내용 |
|---|---|
| 4-13-1 | `AdminSettings.tsx` → `features/admin-SystemSettings/src/admin-settings.tsx` — 메인 설정 탭 라우터 |
| 4-13-2 | `AdminLLMConfig.tsx` → `components/llm-config/admin-llm-config.tsx` — LLM 설정 (OpenAI, Anthropic, Gemini, AWS, SGLang, vLLM) |
| 4-13-3 | `config/AdminAudio/AdminSTTConfig.tsx` → `components/audio-config/admin-stt-config.tsx` |
| 4-13-4 | `config/AdminAudio/AdminTTSConfig.tsx` → `components/audio-config/admin-tts-config.tsx` |
| 4-13-5 | `config/AdminEmbed/AdminEmbeddingConfig.tsx` → `components/embed-config/admin-embedding-config.tsx` |
| 4-13-6 | `config/AdminEmbed/AdminVectorDBConfig.tsx` → `components/embed-config/admin-vector-db-config.tsx` |
| 4-13-7 | `config/AdminEmbed/AdminRerankerConfig.tsx` → `components/embed-config/admin-reranker-config.tsx` |
| 4-13-8 | `config/AdminVL/AdminVLConfig.tsx` → `components/vl-config/admin-vl-config.tsx` |
| 4-13-9 | `config/AdminGuarder/AdminGuarderConfig.tsx` → `components/guarder-config/admin-guarder-config.tsx` |
| 4-13-10 | `config/AdminGuarder/AdminGuarderModelConfig.tsx` → `components/guarder-config/admin-guarder-model-config.tsx` |
| 4-13-11 | `config/AdminGuarder/AdminGuarderPIIsConfig.tsx` → `components/guarder-config/admin-guarder-piis-config.tsx` |
| 4-13-12 | `config/AdminVastAiConfig.tsx` → `components/vast-ai-config/admin-vast-ai-config.tsx` |
| 4-13-13 | `config/AdminVastModal/` → `components/vast-ai-config/` (모달 파일들) |
| 4-13-14 | `AdminRepositorySchedule.tsx` → `components/repository-schedule/admin-repository-schedule.tsx` |
| 4-13-15 | `AdminBaseConfigPanel.tsx` → `components/base-config/admin-base-config-panel.tsx` |
| 4-13-16 | `AdminConnectionConfig.tsx` → `components/base-config/admin-connection-config.tsx` |
| 4-13-17 | Config API → `@xgen/api-client` (config-api, llm-api) |
| 4-13-18 | `index.ts` — AdminSubModule export |

### TASK 4-14. admin-SystemConfig — 시스템 구성 뷰어

**원본:** `src/app/admin/components/AdminConfigViewer.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 4-14-1 | `AdminConfigViewer.tsx` → `features/admin-SystemConfig/src/admin-config-viewer.tsx` |
| 4-14-2 | `index.ts` — AdminSubModule export |

### TASK 4-15. admin-SystemMonitor — 시스템 모니터

**원본:** `src/app/admin/components/AdminSystemMonitor.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 4-15-1 | `AdminSystemMonitor.tsx` → `features/admin-SystemMonitor/src/admin-system-monitor.tsx` |
| 4-15-2 | `index.ts` — AdminSubModule export |

### TASK 4-16. admin-SystemHealth — 시스템 헬스

**원본:** `src/app/admin/components/AdminSystemHealth.tsx` + `SystemHealthDetail.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 4-16-1 | `AdminSystemHealth.tsx` → `features/admin-SystemHealth/src/admin-system-health.tsx` |
| 4-16-2 | `SystemHealthDetail.tsx` → `components/system-health-detail.tsx` |
| 4-16-3 | `systemHealthTypes.ts` → `types/system-health-types.ts` |
| 4-16-4 | `index.ts` — AdminSubModule export |

### TASK 4-17. admin-BackendLogs — 백엔드 로그

**원본:** `src/app/admin/components/AdminBackendLogs.tsx` + 모달

| 작업 항목 | 세부 내용 |
|---|---|
| 4-17-1 | `AdminBackendLogs.tsx` → `features/admin-BackendLogs/src/admin-backend-logs.tsx` |
| 4-17-2 | `AdminBackendLogDetailModal.tsx` → `components/admin-backend-log-detail-modal.tsx` |
| 4-17-3 | `index.ts` — AdminSubModule export |

### TASK 4-18. admin-Database — 데이터베이스 관리

**원본:** `src/app/admin/components/database/`

| 작업 항목 | 세부 내용 |
|---|---|
| 4-18-1 | `AdminDatabase.tsx` → `features/admin-Database/src/admin-database.tsx` |
| 4-18-2 | `AdminDatabaseDetailModal.tsx` → `components/admin-database-detail-modal.tsx` |
| 4-18-3 | `AdminVectorDatabase.tsx` → `components/admin-vector-database.tsx` |
| 4-18-4 | `DataLake.tsx` → `components/data-lake.tsx` |
| 4-18-5 | `types/` → Feature 내부 types/ |
| 4-18-6 | `mocks/` → Feature 내부 mocks/ |
| 4-18-7 | `index.ts` — AdminSubModule export |

### TASK 4-19. admin-DataScraper — 데이터 스크래퍼

**원본:** `src/app/admin/components/AdminDataScraper.tsx` + `AdminScraper.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 4-19-1 | `AdminDataScraper.tsx` → `features/admin-DataScraper/src/admin-data-scraper.tsx` |
| 4-19-2 | `AdminScraper.tsx` → `components/admin-scraper.tsx` |
| 4-19-3 | `database/mocks/scraper.mock.ts` → `mocks/scraper.mock.ts` |
| 4-19-4 | `database/types/scraper.types.ts` → `types/scraper.types.ts` |
| 4-19-5 | `index.ts` — AdminSubModule export |

### TASK 4-20. admin-Storage — 스토리지 관리

**원본:** Placeholder 상태

| 작업 항목 | 세부 내용 |
|---|---|
| 4-20-1 | 현재 placeholder 확인 → 실제 구현 코드가 xgen에 있는지 확인 |
| 4-20-2 | placeholder 유지 또는 xgen 코드 이전 |
| 4-20-3 | `index.ts` — AdminSubModule export |

### TASK 4-21. admin-Backup — 백업 관리

**원본:** Placeholder 상태

| 작업 항목 | 세부 내용 |
|---|---|
| 4-21-1 | placeholder 유지 또는 xgen 코드 이전 |
| 4-21-2 | `index.ts` — AdminSubModule export |

### TASK 4-22. admin-SecuritySettings — 보안 설정

**원본:** Placeholder 상태

| 작업 항목 | 세부 내용 |
|---|---|
| 4-22-1 | placeholder 유지 또는 xgen 코드 이전 |
| 4-22-2 | `index.ts` — AdminSubModule export |

### TASK 4-23. admin-AuditLogs — 감사 로그

**원본:** Placeholder 상태

| 작업 항목 | 세부 내용 |
|---|---|
| 4-23-1 | placeholder 유지 또는 xgen 코드 이전 |
| 4-23-2 | `index.ts` — AdminSubModule export |

### TASK 4-24. admin-ErrorLogs — 에러 로그

**원본:** Placeholder 상태

| 작업 항목 | 세부 내용 |
|---|---|
| 4-24-1 | placeholder 유지 또는 xgen 코드 이전 |
| 4-24-2 | `index.ts` — AdminSubModule export |

### TASK 4-25. admin-MCPMarket — MCP 마켓

**원본:** `src/app/admin/components/mcp/MCPMarketContent.tsx` + 관련

| 작업 항목 | 세부 내용 |
|---|---|
| 4-25-1 | `MCPMarketContent.tsx` → `features/admin-MCPMarket/src/mcp-market-content.tsx` |
| 4-25-2 | `MCPCard.tsx` → `components/mcp-card.tsx` |
| 4-25-3 | `MCPCategoryTabs.tsx` → `components/mcp-category-tabs.tsx` |
| 4-25-4 | `MCPSearchBar.tsx` → `components/mcp-search-bar.tsx` |
| 4-25-5 | `MCPDetailSection.tsx` → `components/mcp-detail-section.tsx` |
| 4-25-6 | `mockData.ts` → `mocks/mock-data.ts` |
| 4-25-7 | `types.ts` → `types/mcp-types.ts` |
| 4-25-8 | `index.ts` — AdminSubModule export |

### TASK 4-26. admin-MCPStation — MCP 스테이션

**원본:** `src/app/admin/components/mcp/MCPStation.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 4-26-1 | `MCPStation.tsx` → `features/admin-MCPStation/src/mcp-station.tsx` |
| 4-26-2 | `index.ts` — AdminSubModule export |

### TASK 4-27. admin-MLModelControl — ML 모델 제어

**원본:** `src/app/admin/components/ml/`

| 작업 항목 | 세부 내용 |
|---|---|
| 4-27-1 | `AdminLLMModelManager.tsx` → `features/admin-MLModelControl/src/admin-llm-model-manager.tsx` |
| 4-27-2 | `MLModelController.tsx` → `components/ml-model-controller.tsx` |
| 4-27-3 | MlModelWorkspaceProvider/Page 통합 — `apps/web` 조립 또는 Feature 내부 |
| 4-27-4 | `index.ts` — AdminSubModule export |

### TASK 4-28. admin-GovRiskManagement — 거버넌스 리스크 관리

**원본:** `src/app/admin/components/governance/GovernanceRiskManagement.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 4-28-1 | `GovernanceRiskManagement.tsx` → `features/admin-GovRiskManagement/src/governance-risk-management.tsx` |
| 4-28-2 | Governance API → `@xgen/api-client` |
| 4-28-3 | `index.ts` — AdminSubModule export |

### TASK 4-29. admin-GovMonitoring — 거버넌스 모니터링

**원본:** `src/app/admin/components/governance/GovernanceMonitoring.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 4-29-1 | `GovernanceMonitoring.tsx` → `features/admin-GovMonitoring/src/governance-monitoring.tsx` |
| 4-29-2 | `index.ts` — AdminSubModule export |

### TASK 4-30. admin-GovControlPolicy — 거버넌스 제어 정책

**원본:** `src/app/admin/components/governance/GovernanceControlPolicy.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 4-30-1 | `GovernanceControlPolicy.tsx` → `features/admin-GovControlPolicy/src/governance-control-policy.tsx` |
| 4-30-2 | `index.ts` — AdminSubModule export |

### TASK 4-31. admin-GovOperationHistory — 거버넌스 운영 이력

**원본:** `src/app/admin/components/governance/GovernanceOperationHistory.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 4-31-1 | `GovernanceOperationHistory.tsx` → `features/admin-GovOperationHistory/src/governance-operation-history.tsx` |
| 4-31-2 | `index.ts` — AdminSubModule export |

### TASK 4-32. admin-GovAuditTracking — 거버넌스 감사 추적

**원본:** (xgen에 해당 컴포넌트 존재 여부 확인 필요)

| 작업 항목 | 세부 내용 |
|---|---|
| 4-32-1 | xgen 원본에 해당 컴포넌트가 있는지 확인 |
| 4-32-2 | 있으면 이전, 없으면 placeholder 유지 |
| 4-32-3 | `index.ts` — AdminSubModule export |

### TASK 4-33. Admin 인증 화면 (별도)

**원본:** `src/app/admin/login-superuser/` + `create-superuser/`

| 작업 항목 | 세부 내용 |
|---|---|
| 4-33-1 | `AdminLogin.tsx` → `apps/web/src/app/admin/login-superuser/` (admin 전용 인증이므로 app 레이어에 유지하거나 별도 Feature 생성) |
| 4-33-2 | `create-superuser/page.tsx` → 동일 판단 |

---

## 9. Phase 5 — Support / MyPage / 기타 마이그레이션

### TASK 5-1. support-FAQ — FAQ

**원본:** `src/app/support/sections/faq/components/FAQ.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 5-1-1 | `FAQ.tsx` → `features/support-FAQ/src/faq.tsx` |
| 5-1-2 | `FAQ.module.scss` → Tailwind 유틸리티 클래스로 재작성 (SCSS 파일 이전하지 않음) |
| 5-1-3 | `index.ts` export |

### TASK 5-2. support-Inquiry — 문의 작성

**원본:** `src/app/support/sections/inquiry/`

| 작업 항목 | 세부 내용 |
|---|---|
| 5-2-1 | `Inquiry.tsx` → `features/support-Inquiry/src/inquiry.tsx` |
| 5-2-2 | `Inquiry.module.scss` → Tailwind 유틸리티 클래스로 재작성 (SCSS 파일 이전하지 않음) |
| 5-2-3 | `index.ts` export |

### TASK 5-3. support-MyInquiries — 내 문의 목록

**원본:** `src/app/support/sections/myInquiries/`

| 작업 항목 | 세부 내용 |
|---|---|
| 5-3-1 | `MyInquiries.tsx` → `features/support-MyInquiries/src/my-inquiries.tsx` |
| 5-3-2 | `MyInquiries.module.scss` → Tailwind 유틸리티 클래스로 재작성 (SCSS 파일 이전하지 않음) |
| 5-3-3 | `index.ts` export |

### TASK 5-4. support-ServiceRequestForm — 서비스 요청 작성

**원본:** `src/app/support/sections/serviceRequest/components/ServiceRequestForm.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 5-4-1 | `ServiceRequestForm.tsx` → `features/support-ServiceRequestForm/src/service-request-form.tsx` |
| 5-4-2 | `ServiceRequestModal.tsx` → `components/service-request-modal.tsx` |
| 5-4-3 | `ServiceRequestForm.module.scss` + `ServiceRequestModal.module.scss` → Tailwind 유틸리티 클래스로 재작성 (SCSS 파일 이전하지 않음) |
| 5-4-4 | `index.ts` export |

### TASK 5-5. support-ServiceRequestResults — 서비스 요청 결과

**원본:** `src/app/support/sections/serviceRequest/components/ServiceRequestResults.tsx` + Detail

| 작업 항목 | 세부 내용 |
|---|---|
| 5-5-1 | `ServiceRequestResults.tsx` → `features/support-ServiceRequestResults/src/service-request-results.tsx` |
| 5-5-2 | `ServiceRequestDetail.tsx` → `components/service-request-detail.tsx` |
| 5-5-3 | `data/serviceRequestList.ts` → `data/service-request-list.ts` |
| 5-5-4 | `index.ts` export |

### TASK 5-6. mypage-profile — 프로필 보기

**원본:** `src/app/mypage/sections/profile/components/Profile.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 5-6-1 | `Profile.tsx` → `features/mypage-profile/src/profile.tsx` |
| 5-6-2 | `Profile.module.scss` → Tailwind 유틸리티 클래스로 재작성 (SCSS 파일 이전하지 않음) |
| 5-6-3 | user API → `@xgen/api-client` |
| 5-6-4 | `index.ts` export |

### TASK 5-7. mypage-ProfileEdit — 프로필 편집

**원본:** `src/app/mypage/sections/profile/components/ProfileEdit.tsx`

| 작업 항목 | 세부 내용 |
|---|---|
| 5-7-1 | `ProfileEdit.tsx` → `features/mypage-ProfileEdit/src/profile-edit.tsx` |
| 5-7-2 | `ProfileEdit.module.scss` → Tailwind 유틸리티 클래스로 재작성 (SCSS 파일 이전하지 않음) |
| 5-7-3 | `index.ts` export |

### TASK 5-8. 기타 — Agent 채팅 (신규 Feature 필요)

**원본:** `src/app/agent/` (전체)

| 작업 항목 | 세부 내용 |
|---|---|
| 5-8-1 | 신규 Feature 생성: `features/main-AgentChat/` |
| 5-8-2 | `AgentService.ts` → `features/main-AgentChat/src/agent-service.ts` |
| 5-8-3 | `AgentChat.tsx` → `features/main-AgentChat/src/agent-chat.tsx` |
| 5-8-4 | `MessageBubble.tsx` → `components/message-bubble.tsx` |
| 5-8-5 | `ToolCallCard.tsx` → `components/tool-call-card.tsx` |
| 5-8-6 | `ToolStatusBar.tsx` → `components/tool-status-bar.tsx` |
| 5-8-7 | `tools/` (8 파일) → `tools/` (ToolRegistry, ToolExecutor, BrowserTool, ExecTool, FsTool, LocalCLITool, SecurityPolicy) |
| 5-8-8 | package.json, tsconfig.json 생성 |
| 5-8-9 | `index.ts` — FeatureModule export |
| 5-8-10 | features.ts 등록 |

### TASK 5-9. 기타 — Chatbot Standalone (신규 Feature 필요)

**원본:** `src/app/chatbot/`

| 작업 항목 | 세부 내용 |
|---|---|
| 5-9-1 | 신규 Feature 생성: `features/main-ChatbotStandalone/` |
| 5-9-2 | `[chatId]/page.tsx` → `features/main-ChatbotStandalone/src/standalone-chat.tsx` |
| 5-9-3 | `StandaloneChat.module.scss` → Tailwind 유틸리티 클래스로 재작성 (SCSS 파일 이전하지 않음) |
| 5-9-4 | `embed/` → Feature 내부 또는 별도 Feature |
| 5-9-5 | package.json, tsconfig.json 생성 |
| 5-9-6 | `index.ts` export |
| 5-9-7 | features.ts 등록 |

### TASK 5-10. 기타 — ML Monitoring (신규 Feature 필요)

**원본:** `src/app/ml-monitoring/`

| 작업 항목 | 세부 내용 |
|---|---|
| 5-10-1 | 신규 Feature 생성: `features/main-MLMonitoring/` |
| 5-10-2 | `MLMonitoringDashboard.tsx` → `features/main-MLMonitoring/src/ml-monitoring-dashboard.tsx` |
| 5-10-3 | `BiasAndFairness.tsx` → `components/bias-and-fairness.tsx` |
| 5-10-4 | `ModelIOLogging.tsx` → `components/model-io-logging.tsx` |
| 5-10-5 | `ModelVersionManagement.tsx` → `components/model-version-management.tsx` |
| 5-10-6 | `UserActivityLogging.tsx` → `components/user-activity-logging.tsx` |
| 5-10-7 | `XAILogging.tsx` → `components/xai-logging.tsx` |
| 5-10-8 | `MLMonitoring.module.scss` → Tailwind 유틸리티 클래스로 재작성 (SCSS 파일 이전하지 않음) |
| 5-10-9 | package.json, tsconfig.json 생성 |
| 5-10-10 | `index.ts` export |
| 5-10-11 | features.ts 등록 |

### TASK 5-11. 기타 — Embed Test (신규 Feature 필요)

**원본:** `src/app/embed-test/`

| 작업 항목 | 세부 내용 |
|---|---|
| 5-11-1 | 신규 Feature 생성: `features/main-EmbedTest/` |
| 5-11-2 | `page.tsx` → `features/main-EmbedTest/src/embed-test.tsx` |
| 5-11-3 | `EmbedTest.module.scss` → Tailwind 유틸리티 클래스로 재작성 (SCSS 파일 이전하지 않음) |
| 5-11-4 | package.json, tsconfig.json 생성 |
| 5-11-5 | `index.ts` export |

### TASK 5-12. 기타 — Data Section (누락 Feature 생성)

**원본:** `src/app/main/dataSection/`

| 작업 항목 | 세부 내용 |
|---|---|
| 5-12-1 | 신규 Feature: `features/main-DataIntroduction/` — `DataIntroduction.tsx` 이전 |
| 5-12-2 | 신규 Feature: `features/main-DataProcessor/` — `DataProcessor.tsx` + `DataProcessorSidebar.tsx` 이전 |
| 5-12-3 | 신규 Feature: `features/main-DataStation/` — `DataStation.tsx` 이전 |
| 5-12-4 | 신규 Feature: `features/main-DataStorage/` — `DataStorage.tsx` 이전 |
| 5-12-5 | `dataSection/components/modals/` (20+ 모달) → 각 Feature에 사용처별 분배 |
| 5-12-6 | 각 Feature에 package.json, tsconfig.json, index.ts 생성 |
| 5-12-7 | features.ts 등록 |

---

## 10. Phase 6 — App 레이어 조립 및 라우팅

> **목표:** `apps/web/`에서 모든 Feature를 조립, Next.js App Router 라우팅 연결

### TASK 6-1. 앱 라우팅 구조 정리

| 작업 항목 | 세부 내용 |
|---|---|
| 6-1-1 | `apps/web/src/app/main/page.tsx` — AuthGuard 래핑, Feature Registry에서 main 섹션 로드 |
| 6-1-2 | `apps/web/src/app/admin/page.tsx` — AdminSubModule 기반 view 라우팅 |
| 6-1-3 | `apps/web/src/app/canvas/page.tsx` — CanvasSubModule 기반 캔버스 조립 |
| 6-1-4 | `apps/web/src/app/login/page.tsx` — auth-Login Feature 렌더 |
| 6-1-5 | `apps/web/src/app/signup/page.tsx` — auth-Signup Feature 렌더 |
| 6-1-6 | `apps/web/src/app/forgot-password/page.tsx` — auth-ForgotPassword Feature 렌더 |
| 6-1-7 | `apps/web/src/app/mypage/page.tsx` — mypage Feature 렌더 |
| 6-1-8 | `apps/web/src/app/support/page.tsx` — support Feature 렌더 |
| 6-1-9 | `apps/web/src/app/agent/page.tsx` — agent Feature 렌더 |
| 6-1-10 | `apps/web/src/app/chatbot/[chatId]/page.tsx` — chatbot Feature 렌더 |
| 6-1-11 | `apps/web/src/app/ml-inference/page.tsx` — ML Feature 렌더 |
| 6-1-12 | `apps/web/src/app/ml-monitoring/page.tsx` — ML Monitoring Feature 렌더 |
| 6-1-13 | `apps/web/src/app/scenario-recorder/page.tsx` — ScenarioRecorder Feature 렌더 |

### TASK 6-2. 레이아웃 컴포넌트 (apps/web/src/components/)

| 작업 항목 | 세부 내용 |
|---|---|
| 6-2-1 | `XgenSidebar.tsx` — FeatureRegistry 기반 사이드바 렌더링 (xgen의 `main/sidebar/` 로직 이전) |
| 6-2-2 | `XgenLayoutContent.tsx` — 메인 레이아웃 (사이드바 + 콘텐츠 영역) |
| 6-2-3 | `XgenPageContent.tsx` — 페이지 콘텐츠 라우터 (activeSection 기반) |
| 6-2-4 | `AdminLayout.tsx` — 어드민 레이아웃 (admin 사이드바 + 콘텐츠) |
| 6-2-5 | 사이드바 설정 — `sidebarConfig.ts` 로직을 FeatureRegistry 기반으로 변환 |

### TASK 6-3. features.ts 최종 정리

| 작업 항목 | 세부 내용 |
|---|---|
| 6-3-1 | 모든 Feature import 확인 (누락 없는지) |
| 6-3-2 | register() / registerCanvasSub() / registerAdminSub() / registerDocumentTab() 호출 확인 |
| 6-3-3 | 사용하지 않는 Feature 주석 처리로 기능 토글 테스트 |

### TASK 6-4. Next.js 설정

| 작업 항목 | 세부 내용 |
|---|---|
| 6-4-1 | `next.config.ts` — transpilePackages에 모든 @xgen/* 패키지 포함 |
| 6-4-2 | `middleware.ts` — CORS 설정 이전 (xgen의 middleware.ts) |
| 6-4-3 | `layout.tsx` — LanguageProvider, CookieProvider, ToastProvider 래핑 |
| 6-4-4 | `globals.css` → `@xgen/styles` import |

### TASK 6-5. API Routes 이전

**원본:** `src/app/api/` + `src/app/fe/`

| 작업 항목 | 세부 내용 |
|---|---|
| 6-5-1 | `src/app/api/` → `apps/web/src/app/api/` — Next.js API 라우트는 app 레이어에 유지 |
| 6-5-2 | `src/app/fe/[uriPrefix]/[fileName]/route.ts` → `apps/web/src/app/fe/` — 파일 라우트 유지 |

---

## 11. Phase 7 — 통합 테스트 및 정리

### TASK 7-1. Feature 독립성 테스트

| 작업 항목 | 세부 내용 |
|---|---|
| 7-1-1 | 각 Feature의 import 한 줄을 주석 처리했을 때 빌드가 성공하는지 확인 |
| 7-1-2 | Feature 간 의존이 있는 경우 → packages/ 추출 또는 인터페이스 분리 |

### TASK 7-2. 빌드 검증

| 작업 항목 | 세부 내용 |
|---|---|
| 7-2-1 | `pnpm install` — 모든 워크스페이스 의존성 해결 확인 |
| 7-2-2 | `pnpm build:web` — 전체 빌드 성공 확인 |
| 7-2-3 | TypeScript 에러 0개 확인 |
| 7-2-4 | ESLint 경고/에러 정리 |

### TASK 7-3. 화면별 동작 확인

| 작업 항목 | 세부 내용 |
|---|---|
| 7-3-1 | Auth: 로그인 → 회원가입 → 비밀번호 찾기 흐름 |
| 7-3-2 | Main: 대시보드 → 채팅 (생성/진행/히스토리) → 워크플로우 각 탭 |
| 7-3-3 | Canvas: 캔버스 진입 → 노드 추가 → 엣지 연결 → 실행 |
| 7-3-4 | Admin: 관리자 로그인 → 각 view 전환 (33개) |
| 7-3-5 | Support / MyPage: 각 섹션 진입 확인 |
| 7-3-6 | 기타: Agent, Chatbot, ML Monitoring 확인 |

### TASK 7-4. 코드 정리

| 작업 항목 | 세부 내용 |
|---|---|
| 7-4-1 | 사용되지 않는 import 제거 |
| 7-4-2 | 빈 파일/폴더 제거 |
| 7-4-3 | JS → TS 변환 미완료 파일 최종 처리 |
| 7-4-4 | console.log 제거 (devLog으로 교체) |
| 7-4-5 | 하드코딩 문자열 최종 점검 (i18n 누락) |
| 7-4-6 | PascalCase 파일명 → kebab-case 최종 점검 |

---

## 12. 모노레포 구조 수정 사항 (누락 Feature 보완)

현재 monorepo에 존재하지 않는 Feature 폴더를 생성해야 한다:

### 신규 생성 필요 Features

| Feature 폴더 | package.json name | 원본 |
|---|---|---|
| `features/main-DataIntroduction/` | `@xgen/feature-main-DataIntroduction` | `dataSection/DataIntroduction.tsx` |
| `features/main-DataProcessor/` | `@xgen/feature-main-DataProcessor` | `dataSection/DataProcessor.tsx` |
| `features/main-DataStation/` | `@xgen/feature-main-DataStation` | `dataSection/DataStation.tsx` |
| `features/main-DataStorage/` | `@xgen/feature-main-DataStorage` | `dataSection/DataStorage.tsx` |
| `features/main-AgentChat/` | `@xgen/feature-main-AgentChat` | `agent/` |
| `features/main-ChatbotStandalone/` | `@xgen/feature-main-ChatbotStandalone` | `chatbot/` |
| `features/main-MLMonitoring/` | `@xgen/feature-main-MLMonitoring` | `ml-monitoring/` |
| `features/main-EmbedTest/` | `@xgen/feature-main-EmbedTest` | `embed-test/` |

### 신규 생성 필요 Packages

| 패키지 폴더 | package.json name | 원본 |
|---|---|---|
| `packages/contexts/` | `@xgen/contexts` | `_common/contexts/` (3개+ Feature가 공유 시) |
| `packages/lib/` | `@xgen/lib` | `src/lib/` (local-cli, mcp, chatbot-embed) |

---

## 13. 파일별 매핑 테이블

### xgen-frontend → monorepo 최상위 매핑

| xgen-frontend 경로 | monorepo 대상 | 레이어 |
|---|---|---|
| `src/app/_common/api/core/` | `packages/api-client/src/` | packages |
| `src/app/_common/api/domains/` | `packages/api-client/src/domains/` | packages |
| `src/app/_common/api/*.js` | `packages/api-client/src/domains/` | packages |
| `src/app/_common/api/rag/` | `packages/api-client/src/domains/rag/` | packages |
| `src/app/_common/api/workflow/` | `packages/api-client/src/domains/workflow/` | packages |
| `src/app/_common/api/trainer/` | `packages/api-client/src/domains/trainer/` | packages |
| `src/app/_common/components/authGuard/` | `packages/auth-provider/src/` | packages |
| `src/app/_common/components/CookieProvider.tsx` | `packages/auth-provider/src/` | packages |
| `src/app/_common/components/chatParser/` | `packages/ui/src/components/chat-parser/` | packages |
| `src/app/_common/components/CardButton.tsx` | `packages/ui/src/components/` | packages |
| `src/app/_common/components/SearchInput/` | `packages/ui/src/components/` | packages |
| `src/app/_common/components/LogModal.tsx` | `packages/ui/src/components/` | packages |
| `src/app/_common/components/LogViewer.tsx` | `packages/ui/src/components/` | packages |
| `src/app/_common/components/ToastProvider.jsx` | `packages/ui/src/components/` | packages |
| `src/app/_common/components/docsFile/` | `packages/ui/src/components/docs-file/` | packages |
| `src/app/_common/icons/` | `packages/icons/src/` | packages |
| `src/app/_common/utils/` | `packages/utils/src/` | packages |
| `src/app/_common/types/` | `packages/types/src/` | packages |
| `src/app/_common/contexts/` | `packages/contexts/src/` 또는 Feature 내부 | packages |
| `src/i18n/locales/` | `packages/i18n/src/locales/` | packages |
| `src/app/config.js` | `packages/config/src/` | packages |
| `src/containerInfo.ts` | `packages/config/src/` | packages |
| `src/lib/` | `packages/lib/src/` | packages |
| `src/middleware.ts` | `apps/web/src/middleware.ts` | apps |
| `src/app/globals.css` | `packages/styles/src/globals.css` | packages |
| `src/app/_common/_variables.scss` | `packages/styles/src/globals.css` (CSS 변수로 변환 후 통합) | packages |
| `src/app/(auth)/login/` | `features/auth-Login/src/` | features |
| `src/app/(auth)/signup/` | `features/auth-Signup/src/` | features |
| `src/app/(auth)/forgot-password/` | `features/auth-ForgotPassword/src/` | features |
| `src/app/main/components/MainDashboard.tsx` | `features/main-dashboard/src/` | features |
| `src/app/main/chatSection/` | `features/main-Chat*/src/` (4 Features) | features |
| `src/app/main/workflowSection/` | `features/main-Workflow*/src/` + `main-Document*/src/` | features |
| `src/app/main/dataSection/` | `features/main-Data*/src/` (4 Features) | features |
| `src/app/main/modelSection/` | `features/main-Model*/src/` + `main-Training/src/` | features |
| `src/app/main/mlSection/` | `features/main-ML*/src/` | features |
| `src/app/canvas/` | `features/canvas-*/src/` (10 Features) | features |
| `src/app/admin/` | `features/admin-*/src/` (33 Features) | features |
| `src/app/support/` | `features/support-*/src/` (5 Features) | features |
| `src/app/mypage/` | `features/mypage-*/src/` (2+ Features) | features |
| `src/app/agent/` | `features/main-AgentChat/src/` (신규) | features |
| `src/app/chatbot/` | `features/main-ChatbotStandalone/src/` (신규) | features |
| `src/app/ml-monitoring/` | `features/main-MLMonitoring/src/` (신규) | features |
| `src/app/scenario-recorder/` | `features/main-ScenarioRecorder/src/` | features |
| `src/app/embed-test/` | `features/main-EmbedTest/src/` (신규) | features |
| `src/app/main/sidebar/` | `apps/web/src/components/` | apps |
| `src/app/main/components/XgenLayoutContent.tsx` | `apps/web/src/components/` | apps |
| `src/app/main/components/XgenPageContent.tsx` | `apps/web/src/components/` | apps |
| `src/app/api/` | `apps/web/src/app/api/` | apps |
| `src/app/fe/` | `apps/web/src/app/fe/` | apps |

---

## 14. 위험 요소 및 주의사항

### 14-1. 가장 위험한 의존 관계

| 문제 | 해결 |
|---|---|
| Chat hooks (6개)를 NewChat과 CurrentChat이 공유 | `@xgen/utils`에 추출하거나, 각 Feature에 복사 후 독립화 |
| MetricsPageContent를 TrainMonitor와 MLTrainMonitor가 공유 | `@xgen/ui`에 공통 MetricsView 컴포넌트로 추출 |
| MlModelWorkspaceContext를 ModelUpload, ModelHub, ModelInference 3개가 공유 | `@xgen/contexts`에 추출 |
| Admin의 query parameter 라우팅 (`?view=xxx`) → Feature 분리 필요 | apps/web에서 view → Feature 매핑 로직 작성 |
| Documents 화면이 workflowSection에 물리적으로 위치 | Feature 분리 시 올바른 위치로 이동 |

### 14-2. JS → TS 변환 대상

다음 파일들은 마이그레이션 시 TypeScript로 변환해야 한다:

- `_common/api/*.js` (약 20+ 파일)
- `_common/utils/cookieUtils.js`
- `_common/utils/workflowStorage.js`
- `canvas/components/SpecialNode/specialNode.js`
- `canvas/constants/nodes.js`
- `_common/components/ToastProvider.jsx`
- `_common/api/helper/apiClient.js`
- `mypage/api/userAPI.js`

### 14-3. 스타일 전략 — Tailwind CSS 전면 적용

> **결정:** SCSS를 이전하지 않는다. 모든 스타일을 Tailwind CSS로 처음부터 재작성한다.

| 항목 | 세부 내용 |
|---|---|
| **기본 방침** | SCSS 파일(`.module.scss`)을 복사/이전하지 않는다. 컴포넌트 마이그레이션 시 JSX에 Tailwind 유틸리티 클래스를 직접 작성한다. |
| **SCSS 변수** | `_variables.scss`의 색상/크기/타이포 변수 → CSS 변수(`--xgen-*`)로 변환 → `globals.css`의 `:root`에 선언 → `tailwind.config.ts`의 `theme.extend`에 매핑 |
| **공유 프리셋** | `packages/styles/tailwind-preset.ts` — 모노레포 전역 Tailwind 프리셋. 모든 Feature/App이 이 프리셋을 `extends`하여 디자인 일관성 유지 |
| **복잡한 스타일** | 유틸리티 클래스만으로 표현 어려운 경우 → `@apply`로 컴포넌트 클래스 정의 (CSS 파일 내) 또는 CSS 변수 활용. CSS Modules(`.module.css`) 사용 최소화 |
| **sass 의존성** | 프로젝트 전체에서 `sass` 패키지 제거. `postcss` + `tailwindcss` + `autoprefixer`만 유지 |
| **Feature별 설정** | 각 Feature는 자체 `tailwind.config.ts` 없이 공유 프리셋 사용. `apps/web/tailwind.config.ts`에서 전체 content 경로 지정 |

**Tailwind 설정 구조:**
```
packages/styles/
├── src/globals.css              ← @tailwind base/components/utilities + CSS 변수
└── tailwind-preset.ts           ← 공유 프리셋 (colors, spacing, typography 등)

apps/web/
├── tailwind.config.ts           ← preset: [require('@xgen/styles/tailwind-preset')]
│                                   content: ['./src/**', '../../features/*/src/**', '../../packages/*/src/**']
└── postcss.config.mjs           ← tailwindcss + autoprefixer
```

### 14-4. 마이그레이션 순서 제약

```
Phase 0 (packages) → 반드시 먼저
  └── Phase 1 (auth) → 로그인 테스트 가능
  └── Phase 2 (main) → 핵심 기능 테스트 가능
  └── Phase 3 (canvas) → Phase 2 이후 (일부 main Feature와 연관)
  └── Phase 4 (admin) → Phase 0 이후 독립 진행 가능
  └── Phase 5 (support/mypage/기타) → Phase 0 이후 독립 진행 가능
  └── Phase 6 (app assembly) → Phase 1~5 완료 후
  └── Phase 7 (testing) → Phase 6 완료 후
```

**병렬 가능:** Phase 2, 3, 4, 5는 Phase 0 완료 후 병렬 진행 가능

---

## 부록: 작업 규모 추정

| Phase | TASK 수 | 세부 작업 항목 수 | 복잡도 |
|---|---|---|---|
| Phase 0 (packages) | 15 | ~110 | ★★★ (기반, 광범위) |
| Phase 1 (auth) | 3 | ~20 | ★ (단순) |
| Phase 2 (main) | 32 | ~160 | ★★★★ (가장 큼) |
| Phase 3 (canvas) | 11 | ~80 | ★★★★ (복잡) |
| Phase 4 (admin) | 34 | ~100 | ★★★ (많지만 패턴 동일) |
| Phase 5 (support/mypage/기타) | 12 | ~60 | ★★ (중간) |
| Phase 6 (app assembly) | 5 | ~25 | ★★ (조립) |
| Phase 7 (testing) | 4 | ~20 | ★★ (검증) |
| **합계** | **~116** | **~575** | |
