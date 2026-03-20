# XGEN Frontend Monorepo 구조 설명서

> **경로**: `tmp/xgen-frontend-new/`  
> **최종 업데이트**: 2026-03-20

---

## 목차

1. [개요](#1-개요)
2. [기술 스택](#2-기술-스택)
3. [디렉토리 구조](#3-디렉토리-구조)
4. [루트 설정 파일](#4-루트-설정-파일)
5. [packages/ — 공유 라이브러리](#5-packages--공유-라이브러리)
6. [features/ — 기능 모듈](#6-features--기능-모듈)
7. [apps/ — 애플리케이션](#7-apps--애플리케이션)
8. [모듈 타입 시스템](#8-모듈-타입-시스템)
9. [FeatureRegistry — 등록 시스템](#9-featureregistry--등록-시스템)
10. [기능 토글 메커니즘](#10-기능-토글-메커니즘)
11. [의존성 그래프](#11-의존성-그래프)
12. [web vs web_jeju 차이점](#12-web-vs-web_jeju-차이점)
13. [전체 기능 모듈 목록](#13-전체-기능-모듈-목록)
14. [새 기능 추가 가이드](#14-새-기능-추가-가이드)
15. [앱 페이지 라우팅 구조](#15-앱-페이지-라우팅-구조)
16. [스타일링](#16-스타일링)
17. [CLI 명령어](#17-cli-명령어)

---

## 1. 개요

XGEN Frontend는 **pnpm workspace + Turborepo** 기반 모노레포입니다.

핵심 설계 원칙:
- **기능적 최소 단위(Feature Module)**: UI 기능 하나가 독립 패키지 하나
- **Import 기반 기능 토글**: `features.ts`에서 import를 주석처리하면 해당 기능 비활성화
- **앱별 기능 조합**: 동일 feature 풀에서 앱마다 다른 기능 세트 선택

```
features.ts에서 import 주석처리 → 해당 기능 비활성화 → 번들에서 제외
```

---

## 2. 기술 스택

| 항목 | 버전 | 비고 |
|------|------|------|
| Node.js | ≥20 | `engines` 필드로 강제 |
| pnpm | 9.15.0 | `packageManager` 필드로 고정 |
| Turborepo | ^2.4.0 | 빌드 오케스트레이션 |
| TypeScript | ^5.7.0 | 전 패키지 공유 |
| Next.js | ^15.5.0 | App Router (apps에서만) |
| React | ^19.0.0 | |
| Tailwind CSS | ^4.0.0 | CSS-first config (apps devDep) |
| react-icons | ^5.4.0 | icons 패키지에서만 사용 |

---

## 3. 디렉토리 구조

```
xgen-frontend-new/
│
├── package.json                # 루트 — scripts, devDeps (turbo, typescript)
├── pnpm-workspace.yaml         # workspace 범위 선언
├── turbo.json                  # Turborepo 태스크 정의
├── tsconfig.base.json          # 전 패키지가 extends하는 기본 TS설정
├── .gitignore
├── README.md
│
├── apps/                       # 배포 가능한 Next.js 애플리케이션
│   ├── web/                    #   전체 기능 포함 (port 3000)
│   └── web_jeju/               #   제주은행용 축소 빌드 (port 3001)
│
├── features/                   # 57개 독립 기능 모듈 (각각 npm 패키지)
│   ├── chat-intro/
│   ├── chat-new/
│   ├── canvas-core/
│   ├── admin-governance/
│   └── ...
│
└── packages/                   # 9개 공유 라이브러리
    ├── types/                  #   타입 정의 + FeatureRegistry
    ├── i18n/                   #   다국어 (ko/en)
    ├── ui/                     #   공용 UI 컴포넌트
    ├── utils/                  #   유틸리티 함수
    ├── icons/                  #   SVG 아이콘 + react-icons
    ├── api-client/             #   HTTP 클라이언트
    ├── auth-provider/          #   인증 Context Provider
    ├── config/                 #   환경변수 기반 설정
    └── styles/                 #   글로벌 CSS (Tailwind)
```

---

## 4. 루트 설정 파일

### package.json

```jsonc
{
  "name": "xgen-frontend-monorepo",
  "private": true,
  "scripts": {
    "dev": "turbo dev",                             // 전체 dev
    "dev:web": "turbo dev --filter=@xgen/web",      // web만
    "dev:web-jeju": "turbo dev --filter=@xgen/web-jeju",
    "build": "turbo build",
    "build:web": "turbo build --filter=@xgen/web",
    "build:web-jeju": "turbo build --filter=@xgen/web-jeju",
    "lint": "turbo lint",
    "clean": "turbo clean"
  },
  "devDependencies": { "turbo": "^2.4.0", "typescript": "^5.7.0" },
  "packageManager": "pnpm@9.15.0",
  "engines": { "node": ">=20" }
}
```

### pnpm-workspace.yaml

```yaml
packages:
  - "apps/*"
  - "features/*"
  - "packages/*"
```

세 개의 workspace 그룹을 선언. `workspace:*` 프로토콜로 상호 참조.

### turbo.json

```jsonc
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "dev":   { "cache": false, "persistent": true },
    "lint":  { "dependsOn": ["^build"] },
    "clean": { "cache": false }
  }
}
```

- `^build`: 의존 패키지를 먼저 빌드
- `dev`는 캐시 비활성화 + persistent (watch mode)

### tsconfig.base.json

```jsonc
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "composite": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true
  },
  "exclude": ["node_modules", "dist", ".next", ".turbo"]
}
```

모든 packages/features는 이 파일을 `extends`함.  
apps는 이 파일을 extends 하되, Next.js용으로 `jsx: "preserve"`, `noEmit: true` 등을 오버라이드.

---

## 5. packages/ — 공유 라이브러리

9개 패키지. 모든 feature와 app이 의존할 수 있는 공통 코드.

| 패키지 | npm name | 역할 | 주요 export |
|--------|----------|------|-------------|
| **types** | `@xgen/types` | 타입 시스템 + Registry | `FeatureModule`, `CanvasSubModule`, `AdminSubModule`, `DocumentTabConfig`, `FeatureRegistry` |
| **i18n** | `@xgen/i18n` | 다국어 Provider | `LanguageProvider`, `useLanguage()`, `ko.json`, `en.json` |
| **ui** | `@xgen/ui` | 공용 UI 컴포넌트 | `ContentArea`, `Divider` |
| **utils** | `@xgen/utils` | 유틸리티 함수 | `getCookie`, `setCookie`, `devLog`, 인증 쿠키 헬퍼 |
| **icons** | `@xgen/icons` | 아이콘 컴포넌트 | SVG 사이드바 아이콘, `react-icons` re-export |
| **api-client** | `@xgen/api-client` | HTTP 클라이언트 | `IApiClient`, `WebApiClient`, `createApiClient()` |
| **auth-provider** | `@xgen/auth-provider` | 인증 Context | `CookieProvider`, `useAuth()`, `useCookie()`, `AuthGuard` |
| **config** | `@xgen/config` | 환경 설정 | `API_CONFIG`, `APP_CONFIG`, `getBackendUrl()` |
| **styles** | `@xgen/styles` | 글로벌 CSS | `globals.css` (Tailwind + CSS 변수) |

### 패키지 공통 구조

```
packages/{name}/
├── package.json    # name: "@xgen/{name}", main: "src/index.ts"
├── tsconfig.json   # extends: "../../tsconfig.base.json"
└── src/
    └── index.ts    # (또는 index.tsx, globals.css)
```

### 패키지 간 의존 관계

```
config ← api-client
types ← auth-provider, i18n, ui
utils ← api-client, auth-provider
```

---

## 6. features/ — 기능 모듈

### 설계 철학

> **하나의 feature = 하나의 사용자 기능 = 하나의 npm 패키지**

기능적 최소 단위로 분리하여:
- 각 기능을 독립적으로 개발/테스트 가능
- 앱 간 기능 선택적 포함/제외
- import 한 줄로 기능 활성화/비활성화

### 구조 (공통)

```
features/{feature-name}/
├── package.json    # name: "@xgen/feature-{feature-name}"
├── tsconfig.json   # extends: "../../tsconfig.base.json", jsx: "react-jsx"
└── src/
    └── index.ts    # 'use client' → React 컴포넌트 → 모듈 export → default export
```

### package.json 예시 (chat-new)

```jsonc
{
  "name": "@xgen/feature-chat-new",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@xgen/types": "workspace:*",
    "@xgen/ui": "workspace:*",
    "@xgen/i18n": "workspace:*",
    "@xgen/icons": "workspace:*",
    "@xgen/api-client": "workspace:*",
    "@xgen/auth-provider": "workspace:*",
    "@xgen/config": "workspace:*",
    "@xgen/utils": "workspace:*",
    "react": "^19.0.0"
  }
}
```

### src/index.ts 패턴

모든 feature는 동일한 패턴을 따름:

```tsx
'use client';
import React from 'react';
import type { FeatureModule } from '@xgen/types';

// (1) 내부 컴포넌트 정의
const MyComponent: React.FC = () => ( /* ... */ );

// (2) 모듈 정의 (named export)
export const myFeatureModule: FeatureModule = {
  id: 'my-feature',
  name: '내 기능',
  sidebarSection: 'workspace',
  sidebarItems: [{ id: 'my-item', titleKey: '...', descriptionKey: '...' }],
  routes: { 'my-item': MyComponent },
};

// (3) default export
export default myFeatureModule;
```

---

## 7. apps/ — 애플리케이션

### 공통 구조

```
apps/{app}/
├── package.json        # Next.js + 사용할 feature 의존성
├── next.config.ts      # transpilePackages: @xgen/* 패키지
├── tsconfig.json       # extends base, paths: { "@/*": ["./src/*"] }
└── src/
    ├── features.ts     # ★ 핵심: feature import + registry 등록
    ├── app/            # Next.js App Router 페이지 (라우팅 셸)
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── main/page.tsx
    │   ├── canvas/page.tsx
    │   ├── admin/page.tsx
    │   ├── login/page.tsx
    │   └── ...
    └── components/     # 앱 레벨 레이아웃 컴포넌트 (오케스트레이션)
        ├── XgenSidebar.tsx
        ├── XgenPageContent.tsx
        ├── XgenLayoutContent.tsx
        └── AdminLayout.tsx
```

### features.ts의 역할

`src/features.ts`는 각 앱의 **유일한 기능 결정 지점**:

```typescript
import { FeatureRegistry } from '@xgen/types';

// import = 활성화
import chatNew from '@xgen/feature-chat-new';

// 주석 = 비활성화 (번들에서 tree-shake)
// import agent from '@xgen/feature-agent';

export const registry = new FeatureRegistry();
registry.register(chatNew);
```

### app/ 디렉토리의 역할

`src/app/` 하위의 page.tsx 파일들은 **라우팅 셸(routing shell)**:

```tsx
// apps/web/src/app/login/page.tsx — 전체 코드
'use client';
import { registry } from '@/features';

export default function LoginPage() {
  const mod = registry.get('auth-login');
  const Component = mod?.pageRoutes?.['/login'];
  if (Component) return <Component />;
  return <div>Login module not loaded</div>;
}
```

- Next.js App Router가 파일 시스템 기반 라우팅을 강제하므로 물리적 page.tsx가 필요
- UI 로직 0줄 — registry에서 feature를 꺼내서 위임만 수행
- 실제 컴포넌트, 상태관리, 비즈니스 로직은 전부 `features/` 내부에 존재

### components/ 디렉토리의 역할

| 파일 | 역할 |
|------|------|
| `XgenSidebar.tsx` | registry에서 섹션별 사이드바 항목을 읽어 렌더링 |
| `XgenPageContent.tsx` | registry에서 현재 activeView에 해당하는 라우트 컴포넌트를 찾아 렌더링 |
| `XgenLayoutContent.tsx` | Sidebar + PageContent를 조합하는 메인 레이아웃 |
| `AdminLayout.tsx` | registry에서 AdminSubModule을 읽어 관리자 페이지 레이아웃 구성 |

이것들은 **"feature를 어떻게 조합할 것인가"**를 결정하는 앱 레벨의 오케스트레이션.  
Feature가 "무엇을 보여주는가"라면, 이 컴포넌트들은 "어디에, 어떤 조합으로 보여주는가"를 결정.

---

## 8. 모듈 타입 시스템

`packages/types/src/index.ts`에 정의된 4가지 모듈 인터페이스:

### 8.1 FeatureModule

사이드바 기능 또는 독립 페이지를 정의. 가장 기본적인 모듈 타입.

```typescript
interface FeatureModule {
  id: string;                  // 고유 ID (예: 'chat-new')
  name: string;                // 표시 이름
  sidebarSection?: SidebarSectionKey;  // 사이드바 섹션 (없으면 독립 페이지)
  sidebarItems?: SidebarItemDefinition[];  // 사이드바 항목
  routes?: Record<string, ComponentType>;  // 섹션ID → 컴포넌트 (메인 레이아웃 내)
  pageRoutes?: Record<string, ComponentType>;  // path → 컴포넌트 (독립 페이지)
  alwaysVisibleItems?: string[];  // 권한 무관 항상 표시 항목
  introItems?: string[];          // 인트로 항목
}
```

**사이드바 섹션 키**: `'workspace' | 'chat' | 'workflow' | 'data' | 'train' | 'model' | 'mlModel'`

**사용 예시**: chat-intro, chat-new, dashboard, workflow-list, auth-login 등 대부분의 feature

### 8.2 CanvasSubModule

캔버스(워크플로우 에디터)에 플러그인처럼 확장 기능을 추가.

```typescript
interface CanvasSubModule {
  id: string;
  name: string;
  headerActions?: CanvasHeaderAction[];     // 캔버스 헤더 버튼
  sidePanels?: CanvasSidePanel[];           // 사이드 패널
  bottomPanels?: CanvasBottomPanel[];       // 하단 패널
  specialNodeTypes?: CanvasSpecialNodeType[];  // 특수 노드 타입
  overlayComponents?: ComponentType[];      // 오버레이 UI
}
```

**사용**: canvas-core, canvas-history, canvas-auto-workflow, canvas-execution 등 (9개)

### 8.3 AdminSubModule

관리자 페이지에 새로운 섹션을 추가.

```typescript
interface AdminSubModule {
  id: string;
  name: string;
  sidebarSection: string;      // 관리자 사이드바 그룹
  sidebarItems: AdminSidebarItemDef[];
  routes: Record<string, ComponentType>;
}
```

**사용**: admin-user-management, admin-workflow, admin-governance 등 (9개)

### 8.4 DocumentTabConfig

문서 페이지의 탭을 추가.

```typescript
interface DocumentTabConfig {
  id: string;
  titleKey: string;
  order: number;               // 탭 정렬 순서
  component: ComponentType;
}
```

**사용**: document-collection(order:1), document-filestorage(order:2), document-repository(order:3), document-database(order:4)

### 모듈 타입 선택 가이드

| 상황 | 타입 | 등록 메서드 |
|------|------|------------|
| 사이드바에 메뉴 추가 | `FeatureModule` | `register()` |
| /login 같은 독립 페이지 추가 | `FeatureModule` (pageRoutes 사용) | `register()` |
| 캔버스에 기능 확장 (패널, 노드 등) | `CanvasSubModule` | `registerCanvasSub()` |
| 관리자 페이지에 메뉴 추가 | `AdminSubModule` | `registerAdminSub()` |
| 문서 페이지에 탭 추가 | `DocumentTabConfig` | `registerDocumentTab()` |

---

## 9. FeatureRegistry — 등록 시스템

`packages/types`에 정의된 싱글턴 레지스트리. 각 앱의 `features.ts`에서 인스턴스를 생성하고 모듈을 등록.

```typescript
class FeatureRegistry {
  // 등록
  register(feature: FeatureModule): void;
  registerCanvasSub(sub: CanvasSubModule): void;
  registerAdminSub(sub: AdminSubModule): void;
  registerDocumentTab(tab: DocumentTabConfig): void;

  // 조회
  getAll(): FeatureModule[];
  get(id: string): FeatureModule | undefined;
  getBySection(section: SidebarSectionKey): FeatureModule[];
  getSidebarItems(section: SidebarSectionKey): SidebarItemDefinition[];
  getAllRoutes(): Record<string, ComponentType>;
  getAllPageRoutes(): Record<string, ComponentType>;
  hasRoute(sectionId: string): boolean;
  getAlwaysVisibleItems(): string[];
  getIntroItems(): string[];
  getCanvasSubs(): CanvasSubModule[];
  getAdminSubs(): AdminSubModule[];
  getDocumentTabs(): DocumentTabConfig[];
  buildSidebarItemMap(): Record<string, {...}>;
}
```

### 데이터 흐름

```
feature 패키지 (src/index.ts)
    ↓ default export
app의 features.ts
    ↓ import + registry.register()
앱 컴포넌트 (XgenSidebar, XgenPageContent, AdminLayout)
    ↓ registry.getBySection(), registry.getAllRoutes() 등
렌더링
```

---

## 10. 기능 토글 메커니즘

### 활성화

```typescript
// features.ts
import chatNew from '@xgen/feature-chat-new';   // import 존재 = 활성화
registry.register(chatNew);
```

### 비활성화

```typescript
// features.ts
// import chatNew from '@xgen/feature-chat-new';  // 주석처리 = 비활성화
```

주석처리하면:
1. **import가 사라짐** → 해당 feature 코드가 번들에 포함되지 않음 (tree-shaking)
2. **registry에 등록 안 됨** → 사이드바, 라우트, 패널 등에 나타나지 않음
3. **빌드 크기 감소** → 사용하지 않는 feature는 완전히 제거됨

### 주의사항

- features.ts에서 import를 제거할 때, 해당 feature의 package.json 의존성도 앱의 package.json에서 제거하면 설치 시 불필요한 패키지를 받지 않음
- 독립 페이지 라우트(`/agent`, `/scenario-recorder` 등)의 page.tsx도 해당 앱에서 삭제 필요

---

## 11. 의존성 그래프

```
                     ┌─────────────────────────────────┐
                     │           apps/web               │
                     │        apps/web_jeju             │
                     └────────────┬────────────────────┘
                                  │ imports
                     ┌────────────▼────────────────────┐
                     │       features/* (57개)          │
                     │  @xgen/feature-chat-new          │
                     │  @xgen/feature-canvas-core       │
                     │  @xgen/feature-admin-governance  │
                     │  ...                             │
                     └────────────┬────────────────────┘
                                  │ depends on
              ┌───────────────────▼───────────────────────┐
              │              packages/* (9개)               │
              │                                            │
              │  types ← i18n, ui, auth-provider           │
              │  config ← api-client                       │
              │  utils ← api-client, auth-provider         │
              │  icons (독립)                               │
              │  styles (독립)                              │
              └────────────────────────────────────────────┘
```

---

## 12. web vs web_jeju 차이점

### 기능 포함 비교

| 기능 그룹 | web | web_jeju | 비고 |
|-----------|:---:|:--------:|------|
| Chat (4개) | ✅ | ✅ | |
| Canvas — 기본 (9개) | ✅ | ✅ | |
| Canvas — auto-workflow | ✅ | ❌ | AI 자동 생성 |
| Workflow (3개) | ✅ | ✅ | |
| Document — Collection | ✅ | ✅ | |
| Document — Filestorage | ✅ | ❌ | |
| Document — Repository | ✅ | ❌ | |
| Document — Database | ✅ | ❌ | |
| Tools (3개) | ✅ | ✅ | |
| Data (3개) | ✅ | ✅ | |
| Model (5개) | ✅ | ✅ | |
| ML 모델 (6개) | ✅ | ❌ | 전체 제외 |
| Support (2개) | ✅ | ✅ | |
| Admin — 기본 (6개) | ✅ | ✅ | |
| Admin — MCP | ✅ | ❌ | |
| Admin — ML | ✅ | ❌ | |
| Admin — Governance | ✅ | ❌ | |
| Auth (3개) | ✅ | ✅ | |
| Dashboard | ✅ | ✅ | |
| Agent | ✅ | ❌ | PC 제어 |
| Chatbot | ✅ | ✅ | |
| MyPage | ✅ | ✅ | |
| Scenario Recorder | ✅ | ❌ | |
| **합계** | **57개** | **41개** | **16개 제외** |

### 페이지 라우트 차이

| 경로 | web | web_jeju |
|------|:---:|:--------:|
| `/agent` | ✅ | ❌ (page.tsx 없음) |
| `/scenario-recorder` | ✅ | ❌ |
| `/ml-inference` | ✅ | ❌ |
| `/ml-monitoring` | ✅ | ❌ |

### 포트 번호

- **web**: 3000
- **web_jeju**: 3001

---

## 13. 전체 기능 모듈 목록

### Chat (4개)

| ID | 모듈 타입 | 설명 | 주요 컴포넌트 |
|----|----------|------|--------------|
| `chat-intro` | FeatureModule | 채팅 인트로 | ChatIntroduction |
| `chat-new` | FeatureModule | 새 대화 시작 | ChatInput, ChatArea, MessageList, SuggestionChips |
| `chat-current` | FeatureModule | 현재 대화 | ChatAgentDisplay, ExecutionStatusBar |
| `chat-history` | FeatureModule | 대화 이력 | ChatHistoryItem, HistoryModal |

### Canvas (10개)

| ID | 모듈 타입 | 설명 | 주요 확장 |
|----|----------|------|----------|
| `canvas-intro` | FeatureModule | 캔버스 인트로 + /canvas 페이지 | pageRoutes: /canvas |
| `canvas-core` | CanvasSubModule | 코어 (Provider, Viewport) | CanvasCoreProvider, useCanvasCore |
| `canvas-node-system` | CanvasSubModule | 노드 시스템 | NodeHeader, NodePorts, NodeParameters |
| `canvas-edge-system` | CanvasSubModule | 엣지 시스템 | EdgeRenderer, EdgeLabel, validateConnection |
| `canvas-history` | CanvasSubModule | 실행 취소/다시 실행 | headerActions: undo/redo, sidePanel |
| `canvas-auto-workflow` | CanvasSubModule | AI 자동 워크플로우 | headerAction + sidePanel |
| `canvas-execution` | CanvasSubModule | 실행 패널 | headerActions + bottomPanel |
| `canvas-side-menu` | CanvasSubModule | 사이드 메뉴 | 3개 sidePanels: AddNode, Workflow, Template |
| `canvas-special-nodes` | CanvasSubModule | 특수 노드 | AgentXgenNode, RouterNode, SchemaProviderNode |
| `canvas-header` | CanvasSubModule | 헤더 | DetailPanel, NodeDetailModal |

### Workflow (3개)

| ID | 모듈 타입 | 설명 |
|----|----------|------|
| `workflow-intro` | FeatureModule | 워크플로우 인트로 |
| `workflow-list` | FeatureModule | 워크플로우 목록/관리 |
| `workflow-deploy` | FeatureModule | 배포 설정 |

### Document (4개)

| ID | 모듈 타입 | 추가 | 탭 순서 |
|----|----------|------|--------|
| `document-collection` | FeatureModule + DocumentTabConfig | 컬렉션 | 1 |
| `document-filestorage` | FeatureModule + DocumentTabConfig | 파일 스토리지 | 2 |
| `document-repository` | FeatureModule + DocumentTabConfig | 레포지토리 | 3 |
| `document-database` | FeatureModule + DocumentTabConfig | 데이터베이스 | 4 |

### Tools (3개)

| ID | 설명 |
|----|------|
| `tool-storage` | 도구 스토어 |
| `prompt-store` | 프롬프트 스토어 |
| `auth-profile` | 인증 프로필 카드 |

### Data (3개)

| ID | 설명 |
|----|------|
| `data-intro` | 데이터 인트로 |
| `data-station` | 데이터 스테이션 |
| `data-storage` | 데이터 스토리지 |

### Model (5개)

| ID | 설명 |
|----|------|
| `model-intro` | 모델 인트로 |
| `model-train` | 학습 설정 (BasicCategory, DataCategory, ModelCategory) |
| `model-monitor` | 학습 모니터링 (메트릭 차트) |
| `model-eval` | 모델 평가 (TaskSelector, EvaluationTable) |
| `model-storage` | 모델 스토리지 |

### ML 모델 (6개)

| ID | 설명 | 독립 페이지 |
|----|------|------------|
| `ml-intro` | ML 인트로 | |
| `ml-upload` | 모델 업로드 | |
| `ml-hub` | 모델 허브 (ModelDetailPanel) | |
| `ml-inference` | 추론 테스트 | `/ml-inference` |
| `ml-train` | ML 학습 | |
| `ml-train-monitor` | 학습 모니터링 | `/ml-monitoring` |

### Support (2개)

| ID | 설명 | 독립 페이지 |
|----|------|------------|
| `support-service-request` | 서비스 요청 | `/support` |
| `support-faq` | FAQ (아코디언) | |

### Admin (9개)

| ID | 모듈 타입 | 라우트 수 |
|----|----------|----------|
| `admin-user-management` | AdminSubModule | 3 (users, user-create, group-permissions) |
| `admin-workflow` | AdminSubModule | 9 (workflow-management 등) |
| `admin-settings` | AdminSubModule | 2 (system-config, system-settings) |
| `admin-system-monitor` | AdminSubModule | 3 (system-monitor, system-health, backend-logs) |
| `admin-data` | AdminSubModule | 4 (database, data-scraper, storage, backup) |
| `admin-security` | AdminSubModule | 3 (security-settings, audit-logs, error-logs) |
| `admin-mcp` | AdminSubModule | 2 (mcp-market, mcp-station) |
| `admin-ml` | AdminSubModule | 1 (ml-model-control) |
| `admin-governance` | AdminSubModule | 5 (gov-risk-management 등) |

### Auth (3개)

| ID | 독립 페이지 |
|----|------------|
| `auth-login` | `/login` |
| `auth-signup` | `/signup` |
| `auth-forgot-password` | `/forgot-password` |

### 기타 (5개)

| ID | 설명 | 사이드바/독립 |
|----|------|-------------|
| `dashboard` | 메인 대시보드 (KPI, 업데이트, 오류) | 사이드바: workspace |
| `agent` | Agent 채팅 (LLM → 도구 제어) | 독립: `/agent` |
| `chatbot` | 워크플로우 기반 독립 챗봇 | 독립: `/chatbot/[chatId]` |
| `mypage` | 프로필, 설정, 알림 | 독립: `/mypage` |
| `scenario-recorder` | 시나리오 녹화/재생/AI빌더 | 사이드바: workflow + 독립: `/scenario-recorder` |

### 미사용 디렉토리 (2개)

features/ 내에 `canvas/`, `prompts/` 디렉토리가 존재하지만 어떤 앱의 features.ts에서도 import되지 않는 빈 자리 표시(placeholder). 추후 정리 또는 활용 필요.

---

## 14. 새 기능 추가 가이드

### Step 1: 디렉토리 생성

```bash
mkdir -p features/my-feature/src
```

### Step 2: package.json

```json
{
  "name": "@xgen/feature-my-feature",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@xgen/types": "workspace:*",
    "react": "^19.0.0"
  }
}
```

### Step 3: tsconfig.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src", "jsx": "react-jsx" },
  "include": ["src"]
}
```

### Step 4: src/index.ts

```tsx
'use client';
import React from 'react';
import type { FeatureModule } from '@xgen/types';

const MyPage: React.FC = () => <div>My Feature</div>;

export const myFeatureModule: FeatureModule = {
  id: 'my-feature',
  name: '새 기능',
  sidebarSection: 'workspace',
  sidebarItems: [{ id: 'my-item', titleKey: 'sidebar.workspace.myItem.title', descriptionKey: 'sidebar.workspace.myItem.description' }],
  routes: { 'my-item': MyPage },
};

export default myFeatureModule;
```

### Step 5: 앱에 등록

**apps/web/package.json에 의존성 추가:**
```json
"@xgen/feature-my-feature": "workspace:*"
```

**apps/web/src/features.ts에 import + register:**
```typescript
import myFeature from '@xgen/feature-my-feature';
// ...
registry.register(myFeature);
```

### Step 6: 독립 페이지가 필요한 경우

`apps/web/src/app/my-feature/page.tsx`:
```tsx
'use client';
import { registry } from '@/features';

export default function MyFeaturePage() {
  const mod = registry.get('my-feature');
  const Component = mod?.pageRoutes?.['/my-feature'];
  if (Component) return <Component />;
  return <div>Not loaded</div>;
}
```

---

## 15. 앱 페이지 라우팅 구조

### web (15개 페이지)

```
src/app/
├── page.tsx              → redirect('/main')
├── layout.tsx            → RootLayout (HTML shell + globals.css)
├── main/page.tsx         → XgenLayoutContent (사이드바 + 컨텐츠)
├── canvas/page.tsx       → registry.get('canvas-intro') 위임
├── admin/page.tsx        → AdminLayout
├── login/page.tsx        → registry.get('auth-login') 위임
├── signup/page.tsx       → registry.get('auth-signup') 위임
├── forgot-password/page.tsx → registry.get('auth-forgot-password') 위임
├── agent/page.tsx        → registry.get('agent') 위임
├── chatbot/[chatId]/page.tsx → registry.get('chatbot') 위임
├── mypage/page.tsx       → registry.get('mypage') 위임
├── scenario-recorder/page.tsx → registry.get('scenario-recorder') 위임
├── support/page.tsx      → registry.get('support-service-request') 위임
├── ml-inference/page.tsx → registry.get('ml-inference') 위임
└── ml-monitoring/page.tsx → registry.get('ml-train-monitor') 위임
```

### web_jeju (11개 페이지)

web에서 agent, scenario-recorder, ml-inference, ml-monitoring를 제거한 서브셋.

---

## 16. 스타일링

### 현재 설정

- **Tailwind CSS v4** (`^4.0.0`) — apps의 devDependencies
- **진입점**: `packages/styles/src/globals.css`
- **import**: `apps/*/src/app/layout.tsx` → `import '@xgen/styles/src/globals.css'`

```css
@import "tailwindcss";

:root { /* light theme CSS 변수 */ }
@media (prefers-color-scheme: dark) { :root { /* dark theme CSS 변수 */ } }

* { box-sizing: border-box; margin: 0; padding: 0; }
```

- feature 모듈에서는 Tailwind 유틸리티 클래스를 직접 사용 (className prop)
- CSS 변수(`--primary`, `--sidebar-bg` 등)로 테마 커스터마이즈

---

## 17. CLI 명령어

```bash
# 의존성 설치
pnpm install

# 전체 개발 서버
pnpm dev

# 앱별 실행
pnpm dev:web          # web (port 3000)
pnpm dev:web-jeju     # web_jeju (port 3001)

# 빌드
pnpm build            # 전체
pnpm build:web        # web만
pnpm build:web-jeju   # web_jeju만

# 린트
pnpm lint

# 클린
pnpm clean
```
