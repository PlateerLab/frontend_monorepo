# XGEN Frontend — 설계 원칙 해설서 (Principle Documents)

> 이 문서는 `README.md`에서 선언한 원칙을 **왜 그렇게 해야 하는지**, **실제로 어떻게 적용하는지**,
> 그리고 **잘못 적용하면 어떤 일이 벌어지는지**를 구체적 예시와 함께 설명합니다.
>
> 목표: 이 문서를 읽고 나면 **"아, 그래서 이렇게 하는 거구나"**라고 말할 수 있어야 합니다.

---

## 목차

1. [전체 아키텍처를 한 장의 그림으로 이해하기](#1-전체-아키텍처를-한-장의-그림으로-이해하기)
2. [계층 구조: App / Feature / Package — 비유로 이해하기](#2-계층-구조-app--feature--package--비유로-이해하기)
3. [Feature Module 작성법 완전 가이드](#3-feature-module-작성법-완전-가이드)
4. [4가지 모듈 타입 — 각각 언제, 왜 쓰는가](#4-4가지-모듈-타입--각각-언제-왜-쓰는가)
5. [Package 구성 요소 — 한 줄 설명이 아닌 진짜 이해](#5-package-구성-요소--한-줄-설명이-아닌-진짜-이해)
6. [의존성 방향 — 위반하면 실제로 어떤 일이 벌어지나](#6-의존성-방향--위반하면-실제로-어떤-일이-벌어지나)
7. [기능 토글 시스템 — 처음부터 끝까지 동작 원리](#7-기능-토글-시스템--처음부터-끝까지-동작-원리)
8. [폴더 구조 — 왜 이 위치에 이 파일이 있는가](#8-폴더-구조--왜-이-위치에-이-파일이-있는가)
9. [네이밍 규칙 — 이름만 보고 역할을 파악하는 법](#9-네이밍-규칙--이름만-보고-역할을-파악하는-법)
10. [컴포넌트화 — 복붙 vs 분리의 판단 기준](#10-컴포넌트화--복붙-vs-분리의-판단-기준)
11. [새 Feature 추가 — Step by Step 실전 튜토리얼](#11-새-feature-추가--step-by-step-실전-튜토리얼)
12. [자주 하는 실수 & 교정 가이드](#12-자주-하는-실수--교정-가이드)
13. [코드 리뷰 체크리스트](#13-코드-리뷰-체크리스트)
14. [요약: 5분 안에 기억해야 할 것](#14-요약-5분-안에-기억해야-할-것)

---

## 1. 전체 아키텍처를 한 장의 그림으로 이해하기

### 아키텍처 전체 조감도

```
┌─────────────────────────────────────────────────────────────────────┐
│                         사용자 (브라우저)                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │ 접속
┌────────────────────────────▼────────────────────────────────────────┐
│  apps/web (또는 apps/web_jeju)                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  features.ts                                                 │   │
│  │  ┌──────────────────────────────────┐                        │   │
│  │  │ import chatNew from '...'   ✅    │  ← 이 줄이 있으면 기능 ON │   │
│  │  │ // import mlHub from '...' ❌    │  ← 주석이면 기능 OFF      │   │
│  │  │                                  │                        │   │
│  │  │ registry.register(chatNew)       │  ← Registry에 등록      │   │
│  │  └──────────────────────────────────┘                        │   │
│  │                                                              │   │
│  │  XgenSidebar.tsx ← registry.getSidebarItems()로 메뉴 생성     │   │
│  │  XgenLayoutContent.tsx ← registry.getAllRoutes()로 화면 렌더링  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│          ┌───────────────────┼──────────────────────┐               │
│          ▼                   ▼                      ▼               │
│  ┌─────────────┐   ┌──────────────┐    ┌───────────────┐          │
│  │ chatNew     │   │ canvasCore   │    │ adminUsers    │          │
│  │ (Feature)   │   │ (Feature)    │    │ (Feature)     │          │
│  └──────┬──────┘   └──────┬───────┘    └───────┬───────┘          │
│         │                 │                     │                   │
│         ▼                 ▼                     ▼                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  packages/                                                   │   │
│  │  @xgen/types │ @xgen/ui │ @xgen/api-client │ @xgen/i18n │...│   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 핵심 데이터 흐름

```
① 앱 시작 → features.ts 실행 → Feature들이 Registry에 등록됨
② 사이드바 렌더링 → Registry에서 sidebarItems 조회 → 메뉴 동적 생성
③ 사용자가 메뉴 클릭 → Registry에서 해당 route의 컴포넌트 조회 → 렌더링
④ 컴포넌트 내부 → @xgen/api-client로 API 호출 → @xgen/auth-provider로 인증 확인
```

---

## 2. 계층 구조: App / Feature / Package — 비유로 이해하기

### 레고 비유

이 프로젝트를 **레고**로 비유하면:

| 계층 | 레고 비유 | 실제 역할 |
|------|-----------|-----------|
| **packages/** | 레고 **기본 블록** (2x4 브릭, 바퀴, 창문) | 어떤 것이든 만들 수 있는 범용 부품 |
| **features/** | 레고 **조립 설명서 한 봉지** (성 만들기 세트의 "탑 봉지", "문 봉지") | 하나의 완성된 기능 단위 |
| **apps/** | 레고 **완성품 전시대** (어떤 봉지를 올릴지 결정) | 어떤 기능을 포함할지 결정하는 조립 지점 |

### 식당 비유

| 계층 | 식당 비유 | 실제 역할 |
|------|-----------|-----------|
| **packages/** | **식재료 + 주방 도구** (칼, 냄비, 소금, 기름) | 모든 요리에 공통으로 필요한 것 |
| **features/** | **레시피 하나** (김치찌개, 된장찌개, 비빔밥) | 독립적으로 완성되는 하나의 요리 |
| **apps/** | **메뉴판** (오늘의 메뉴: 김치찌개, 비빔밥) | 어떤 요리를 손님에게 제공할지 결정 |

> **핵심:**
> - **식재료(packages)**는 어떤 요리에든 쓸 수 있지만, 그 자체로는 요리가 아닙니다.
> - **레시피(features)**는 하나의 완성된 요리이지만, 다른 레시피를 재료로 쓰지 않습니다. (된장찌개 레시피 안에 김치찌개 레시피를 넣지 않음)
> - **메뉴판(apps)**은 어떤 요리를 내놓을지만 결정합니다. 메뉴판에 레시피를 적지 않습니다.

### 이 비유가 깨지는 순간 = 설계 실패

```
❌ 식재료(packages) 안에 "김치찌개 전용 양념"을 넣음
   → 그건 김치찌개 레시피(feature) 안에 있어야 함

❌ 레시피(feature) A가 레시피 B를 재료로 사용
   → "김치찌개에 된장찌개를 넣는다" = 순환 참조의 시작

❌ 메뉴판(app) 안에 새로운 레시피를 적음
   → 메뉴판은 목록만 관리해야 함. 요리법은 레시피 봉지에.
```

---

## 3. Feature Module 작성법 완전 가이드

### 3.1 Feature의 물리적 구조

모든 Feature는 동일한 구조를 따릅니다:

```
features/{feature-name}/
├── package.json        # npm 패키지 선언
├── tsconfig.json       # TypeScript 설정 (tsconfig.base.json을 extends)
└── src/
    └── index.ts        # 진입점. 오직 이 파일 하나.
                        # (필요에 따라 같은 src/ 내에 추가 파일 가능하지만,
                        #  외부에서 접근하는 건 항상 index.ts 뿐)
```

### 3.2 package.json 작성법

```jsonc
{
  "name": "@xgen/feature-{kebab-name}",     // 반드시 @xgen/feature- 접두사
  "version": "0.0.0",                        // 모노레포 내부용이므로 버전 무의미
  "private": true,                            // npm에 배포하지 않음
  "main": "src/index.ts",                    // 진입점
  "types": "src/index.ts",                   // 타입 진입점 (동일)
  "dependencies": {
    "@xgen/types": "workspace:*",            // 필수: 계약(인터페이스) 참조
    "@xgen/ui": "workspace:*",              // 필요 시: 공통 UI 컴포넌트
    "@xgen/i18n": "workspace:*",            // 필요 시: 다국어
    "@xgen/icons": "workspace:*",           // 필요 시: 아이콘
    "@xgen/api-client": "workspace:*",      // 필요 시: API 호출
    "@xgen/auth-provider": "workspace:*",   // 필요 시: 인증
    "@xgen/config": "workspace:*",          // 필요 시: 환경설정
    "@xgen/utils": "workspace:*",           // 필요 시: 유틸리티
    "react": "^19.0.0"                      // 필수: React
  }
}
```

**중요: `workspace:*`의 의미**
- `"workspace:*"`는 "이 모노레포 안에 있는 패키지를 사용한다"는 선언
- npm에서 다운로드하지 않음. 로컬 packages/ 의 코드를 직접 참조
- 버전이 `*`인 이유: 모노레포 내부에서는 항상 최신 코드를 사용하므로

### 3.3 index.ts 작성법 (FeatureModule)

```typescript
'use client';
// ↑ React 19 / Next.js 15에서 클라이언트 컴포넌트임을 선언

import type { FeatureModule } from '@xgen/types';
// ↑ 반드시 @xgen/types에서 계약을 가져온다

// ────────────────────────────────────────
// 1단계: 이 Feature가 렌더링할 컴포넌트 정의
// ────────────────────────────────────────
function MyFeaturePage() {
  return (
    <div>
      <h1>내 기능 페이지</h1>
      {/* ... */}
    </div>
  );
}

// ────────────────────────────────────────
// 2단계: FeatureModule 계약에 맞게 객체 생성
// ────────────────────────────────────────
export const myFeature: FeatureModule = {
  // [필수] id: 디렉토리명과 반드시 일치
  id: 'main-MyFeature',

  // [필수] name: 사람이 읽을 수 있는 이름
  name: 'My Feature',

  // [필수] sidebarSection: 이 기능이 사이드바 어떤 섹션에 들어가는지
  // 'workspace' | 'chat' | 'workflow' | 'data' | 'train' | 'model' | 'mlModel' | 'support' | 'mypage'
  sidebarSection: 'workspace',

  // [필수] sidebarItems: 사이드바에 표시될 항목 정의
  sidebarItems: [
    {
      id: 'my-feature',                              // 고유 ID (라우팅에 사용)
      titleKey: 'workspace.myFeature.title',          // i18n 번역 키
      descriptionKey: 'workspace.myFeature.description',
    }
  ],

  // [필수] routes: sidebarItem의 id → 렌더링할 컴포넌트 매핑
  routes: {
    'my-feature': MyFeaturePage,     // 사이드바에서 'my-feature' 클릭 → MyFeaturePage 렌더링
  },

  // [선택] pageRoutes: 독립 URL 페이지가 필요할 때
  // pageRoutes: {
  //   '/my-feature': MyFeatureFullPage    // /my-feature URL로 직접 접근 가능
  // },

  // [선택] isAlwaysVisible: 접근 권한과 무관하게 항상 표시
  // isAlwaysVisible: true,

  // [선택] isIntro: 섹션의 인트로 페이지 역할
  // isIntro: true,
};

// ────────────────────────────────────────
// 3단계: default export (App에서 import하기 위함)
// ────────────────────────────────────────
export default myFeature;
```

### 3.4 "왜 이 구조여야 하는가?" — 구조의 존재 이유

| 요소 | 존재 이유 |
|------|-----------|
| `'use client'` | Next.js 15 App Router에서 서버/클라이언트 컴포넌트를 구분. 대부분의 Feature는 인터랙티브하므로 클라이언트 |
| `id`가 디렉토리명과 동일 | 디버깅 시 "이 id는 어떤 폴더에 있지?" 추적이 즉시 가능. 불일치하면 추적 불가 |
| `sidebarSection` | 57개 Feature가 사이드바에서 카테고리별로 자동 그룹핑됨. 하드코딩 없이 Registry가 처리 |
| `sidebarItems[].titleKey` | 하드코딩된 문자열이 아닌 i18n 키. 한국어/영어 전환이 코드 수정 없이 가능 |
| `routes` 맵 | 사이드바 클릭 → 컴포넌트 렌더링의 **선언적** 매핑. App은 이 맵을 읽어서 라우팅을 자동 처리 |
| `default export` | App의 `features.ts`에서 `import X from '...'`으로 깔끔하게 가져오기 위함 |

---

## 4. 4가지 모듈 타입 — 각각 언제, 왜 쓰는가

### 4.1 FeatureModule — "사이드바에 메뉴가 필요한 독립 기능"

```
사용하는 상황:
  "채팅 기록" 기능을 만든다 → 사이드바에 "채팅 기록" 메뉴가 생기고,
  클릭하면 채팅 기록 화면이 나타나야 한다.
```

**실제 예시**: `main-chat-history`
- 사이드바 "Chat" 섹션에 "대화 이력" 메뉴 추가
- 클릭하면 대화 목록 화면 렌더링
- 독립적 — 이 Feature를 삭제해도 "새 채팅", "현재 채팅"은 정상 동작

### 4.2 CanvasSubModule — "캔버스 편집기 안에서 동작하는 플러그인"

```
사용하는 상황:
  캔버스(워크플로우 편집기)에 "AI 자동 생성" 버튼을 추가하고 싶다.
  캔버스 헤더에 버튼이 나타나고, 사이드 패널이 열려야 한다.
```

**왜 FeatureModule이 아닌가?**
- CanvasSubModule은 사이드바에 메뉴를 추가하는 게 아님
- **캔버스 내부**의 헤더/사이드패널/하단패널/오버레이에 UI를 주입하는 것
- `canvas-core`가 이 플러그인들을 조합하여 완전한 캔버스를 구성

```typescript
export const canvasAutoWorkflowModule: CanvasSubModule = {
  id: 'canvas-auto-workflow',
  name: 'Auto Workflow Generation',

  // 캔버스 헤더에 버튼 추가
  headerActions: [
    { id: 'auto-generate', label: 'AI 자동 생성', position: 'right', onClick: () => {} }
  ],

  // 캔버스 사이드에 패널 추가
  sidePanels: [
    { id: 'auto-workflow-panel', label: '자동 생성', component: AutoWorkflowSidebar }
  ],

  // 캔버스에 특수 노드 타입 추가 (선택)
  specialNodeTypes: [
    { type: 'auto-generated', label: '자동 생성 노드', component: AutoNode }
  ],
};
```

**전체 캔버스 조립 과정:**

```
canvas-core (기본 캔버스)
  + canvas-node-system (노드 드래그/드롭)
  + canvas-edge-system (노드 간 연결선)
  + canvas-history (Ctrl+Z/Ctrl+Y)
  + canvas-auto-workflow (AI 자동 생성)   ← 이걸 빼면? AI 버튼만 사라짐. 캔버스는 정상.
  + canvas-execution (실행 패널)
  + canvas-side-menu (사이드 메뉴)
  + canvas-special-nodes (Agent, Router 등)
  + canvas-header (상세 패널, 모달)
  ─────────────────────────────────
  = 완성된 캔버스 편집기
```

### 4.3 AdminSubModule — "관리자 페이지의 하위 메뉴"

```
사용하는 상황:
  관리자 페이지에 "사용자 관리" 메뉴를 추가하고 싶다.
  관리자 사이드바에 메뉴가 생기고, 클릭하면 사용자 목록이 나타나야 한다.
```

**구조는 FeatureModule과 거의 동일하지만**, 관리자 레이아웃 안에서 렌더링된다는 차이:

```typescript
export const adminUsersModule: AdminSubModule = {
  id: 'admin-Users',
  name: '사용자 관리',
  sidebarSection: 'user',               // ← 관리자 사이드바의 섹션
  sidebarItems: [
    { id: 'users', titleKey: 'admin.sidebar.user.users.title', descriptionKey: '...' }
  ],
  routes: { 'users': AdminUsersPage },
};
```

### 4.4 DocumentTabConfig — "문서 관리 페이지의 탭"

```
사용하는 상황:
  문서 관리 화면에 "컬렉션", "파일 스토리지", "레포지토리", "데이터베이스" 탭이 있다.
  각 탭은 독립 Feature로 분리되어 있다.
```

**왜 FeatureModule이 아닌가?**
- 독립 페이지가 아니라, 문서 관리 페이지 **안의 탭**이므로
- 탭 순서/표시 여부를 제어하기 위한 별도 인터페이스가 필요

```typescript
export const collectionTab: DocumentTabConfig = {
  id: 'collection',
  label: '컬렉션',
  order: 1,                          // 탭 순서
  component: CollectionTabContent,   // 탭 클릭 시 렌더링
};
```

### 4.5 어떤 타입을 써야 할지 판단하는 플로우차트

```
새 기능을 만들려고 한다
  │
  ├─ 사이드바에 독립 메뉴가 필요한가?
  │   ├─ YES → FeatureModule
  │   └─ NO ↓
  │
  ├─ 캔버스(워크플로우 편집기) 안에서 동작하는가?
  │   ├─ YES → CanvasSubModule
  │   └─ NO ↓
  │
  ├─ 관리자 페이지 안에서 동작하는가?
  │   ├─ YES → AdminSubModule
  │   └─ NO ↓
  │
  ├─ 문서 관리 페이지의 탭인가?
  │   ├─ YES → DocumentTabConfig
  │   └─ NO → 이미 존재하는 Feature에 기능을 추가하는 게 맞을 수 있음
  │           → packages/에 공유 코드로 넣는 게 맞을 수 있음
  │           → 팀 리드와 논의
```

---

## 5. Package 구성 요소 — 한 줄 설명이 아닌 진짜 이해

### 5.1 @xgen/types — "모든 것의 기반이 되는 계약서"

**비유:** 건축의 **설계 도면 표준**. 벽돌의 크기, 문의 규격, 창문의 인터페이스를 정의.
이 표준이 없으면 각 업체가 제멋대로 만들어서 조립이 불가능.

**구체적으로 뭘 하는가:**
```typescript
// packages/types/src/index.ts 에서 정의하는 것들:

// 1. Feature가 "어떤 모양"이어야 하는지 (계약)
export interface FeatureModule { id, name, sidebarSection, sidebarItems, routes, ... }
export interface CanvasSubModule { id, name, headerActions, sidePanels, ... }
export interface AdminSubModule { id, name, sidebarSection, sidebarItems, routes, ... }
export interface DocumentTabConfig { id, label, order, component }

// 2. Feature들을 모아서 관리하는 Registry (조립 엔진)
export class FeatureRegistry {
  register(feature: FeatureModule): void       // Feature 등록
  getSidebarItems(section): SidebarItem[]      // 사이드바 아이템 조회
  getAllRoutes(): Record<string, Component>     // 전체 라우트 조회
  // ...
}

// 3. 공통으로 사용하는 데이터 타입
export interface User { user_id, username, access_token }
export interface AuthContextType { user, hasAccessToSection, ... }
export interface RouteComponentProps { onNavigate, onChatStarted, ... }
```

**@xgen/types가 없으면 벌어지는 일:**
- Feature A: `{ name: "Chat", render: () => <Chat /> }`
- Feature B: `{ title: "Admin", component: AdminPage }`
- Feature C: `{ featureName: "Model", page: ModelView }`
- → App에서 조립할 때: "name인지 title인지 featureName인지 어떻게 알아?"
- → 매번 if-else 분기가 늘어남 → 유지보수 불가능

### 5.2 @xgen/ui — "디자인 일관성의 수호자"

**비유:** 회사의 **BI(Brand Identity) 가이드라인**. 명함에 쓰는 폰트, 로고 색상, 여백 규격을 정의.
각 부서가 제멋대로 명함을 만들면 회사 이미지가 엉망.

**구체적으로 뭘 하는가:**
```
packages/ui/src/
├── ContentArea.tsx      # 콘텐츠 영역 레이아웃 래퍼
├── Divider.tsx          # 구분선
└── (향후 확장: Button, TextField, Modal, Dropdown 등)
```

**사용 원칙:**
```typescript
// ⭕ 올바름: @xgen/ui에서 가져와서 사용
import { ContentArea } from '@xgen/ui';

function MyFeaturePage() {
  return <ContentArea>내 콘텐츠</ContentArea>;
}

// ❌ 잘못됨: 비슷한 걸 Feature 안에서 새로 만듬
function MyContentWrapper({ children }) {
  return <div className="content-area">{children}</div>;
}
```

**왜 이래야 하는가:**
- 디자인팀이 ContentArea의 padding을 48px → 32px로 변경 → `@xgen/ui`만 수정하면 **모든 Feature에 반영**
- 각 Feature에서 만들었다면? → 57개 Feature를 하나씩 찾아서 수정해야 함

### 5.3 @xgen/api-client — "백엔드 통신의 단일 관문"

**비유:** 회사의 **대외 창구**. 모든 고객 문의는 대표 번호로 → 대표 번호가 적절한 부서로 연결.
각 부서가 독자적으로 전화번호를 공개하면 → 보안 사고, 중복 처리, 추적 불가.

**구체적으로 뭘 하는가:**
```typescript
// 모든 Feature는 이 클라이언트를 통해서만 백엔드와 통신
import { createApiClient } from '@xgen/api-client';

const api = createApiClient();
const data = await api.get('/some-endpoint');
```

**직접 fetch를 쓰면 안 되는 이유:**
1. **인증 토큰 자동 첨부:** api-client가 모든 요청에 토큰을 넣음. 직접 fetch하면 토큰 누락 가능
2. **에러 핸들링 통일:** 401 → 로그인 페이지 리다이렉트가 한 곳에서 처리됨
3. **API URL 관리:** 환경별(dev/staging/prod) base URL이 `@xgen/config`에서 주입됨
4. **로깅/모니터링:** 모든 API 호출이 한 곳을 통과하므로 디버깅이 쉬움

### 5.4 @xgen/auth-provider — "인증 상태의 단일 진실 공급원"

**비유:** 건물의 **출입 카드 시스템**. 모든 문이 같은 카드 리더기를 사용.
각 방마다 다른 인증을 하면 → 한 명의 퇴사자 처리에 100개 시스템을 수정해야 함.

```typescript
// Feature에서 인증 상태 사용
import { useAuth } from '@xgen/auth-provider';

function MyProtectedPage() {
  const { user, hasAccessToSection } = useAuth();

  if (!user) return <div>로그인 필요</div>;
  if (!hasAccessToSection('admin')) return <div>권한 없음</div>;

  return <div>관리자 전용 콘텐츠</div>;
}
```

### 5.5 @xgen/i18n — "다국어의 중앙 관리"

**비유:** 출판사의 **번역 데이터베이스**. 모든 번역은 한 곳에서 관리.
각 저자가 자기 번역을 따로 하면 → 같은 단어를 다르게 번역하는 사태 발생.

```typescript
import { useTranslation } from '@xgen/i18n';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('workspace.myFeature.title')}</h1>;
  //            ↑ ko.json/en.json에서 이 키의 값을 가져옴
}
```

### 5.6 @xgen/config — "환경 설정의 중앙화"

```typescript
import { getBackendUrl, APP_CONFIG } from '@xgen/config';

// Feature에서 환경 변수를 직접 읽지 않는다
// ❌ process.env.NEXT_PUBLIC_API_URL
// ⭕ getBackendUrl()
```

### 5.7 나머지 packages

| Package | 한 줄 역할 | 왜 packages/에 있는가 |
|---------|-----------|---------------------|
| `utils` | 쿠키 읽기/쓰기, 로깅 등 순수 유틸 함수 | 특정 도메인에 속하지 않으며, 여러 Feature/Package에서 사용 |
| `icons` | SVG 아이콘 → React 컴포넌트 | 아이콘이 Feature마다 다르면 디자인 일관성 깨짐 |
| `styles` | Tailwind CSS 글로벌 설정 | 디자인 토큰(색상, 간격 등)이 한 곳에서 관리되어야 함 |

---

## 6. 의존성 방향 — 위반하면 실제로 어떤 일이 벌어지나

### 6.1 올바른 의존성 방향

```
apps → features → packages
 ↓        ↓          ↓
(조립)   (기능)    (인프라)

화살표를 거슬러 올라가는 의존은 절대 금지
```

### 6.2 위반 시나리오와 그 결과

#### 시나리오 A: Feature → Feature 의존

```
가정: feature-chat-history가 feature-chat-current를 import함

→ 제주은행(web_jeju)에서 chat-current를 비활성화하자
→ chat-history에서 import 에러 발생 💥
→ chat-history도 비활성화해야 함
→ 그런데 chat-history를 import하는 또 다른 feature가 있다면?
→ 연쇄 붕괴 💥💥💥

교훈: Feature 독립성이 깨지면 "기능 토글"이 불가능해진다.
```

#### 시나리오 B: Package → Feature 의존

```
가정: packages/ui의 Button이 feature-canvas-core의 무언가를 import함

→ @xgen/ui를 사용하려면 canvas-core도 설치해야 함
→ canvas가 필요 없는 앱에서도 canvas 코드가 번들에 포함됨
→ packages의 "범용성"이 깨짐 💥

교훈: Package는 어떤 Feature에도 의존하지 않아야 범용 인프라 역할을 할 수 있다.
```

#### 시나리오 C: Feature → App 의존

```
가정: feature-chat-new가 apps/web/src/config.ts를 직접 import함

→ web_jeju에서 이 Feature를 사용하려 함
→ apps/web의 config를 찾을 수 없음 💥
→ Feature가 특정 App에 종속되어 재사용 불가

교훈: Feature는 App을 모른다. 오직 packages/만 의존한다.
```

### 6.3 "그러면 Feature 간에 공유 로직이 필요할 때는?"

```
상황: chat-new와 chat-history에서 동일한 "메시지 포맷팅" 로직이 필요

❌ 잘못된 해결: chat-new에서 chat-history를 import
❌ 잘못된 해결: 두 곳에 같은 코드를 복붙

⭕ 올바른 해결:
   1. 메시지 포맷팅 로직을 packages/utils (또는 새 package)로 추출
   2. chat-new와 chat-history가 각각 그 package를 import

이유: packages/는 여러 Feature가 공유하는 범용 코드를 두는 곳이므로
```

---

## 7. 기능 토글 시스템 — 처음부터 끝까지 동작 원리

이 프로젝트의 **가장 핵심적인 아키텍처 성과**를 처음부터 끝까지 따라가 봅시다.

### Step 1: features.ts에서 import

```typescript
// apps/web/src/features.ts

// ① Feature를 import한다 (이 순간 빌드에 포함됨)
import chatNew from '@xgen/feature-chat-new';
import chatHistory from '@xgen/feature-chat-history';
import canvasCore from '@xgen/feature-canvas-core';
// import mlHub from '@xgen/feature-ml-hub';  ← 주석 = 빌드에서 제외됨
```

### Step 2: Registry에 등록

```typescript
// features.ts (계속)

import { FeatureRegistry } from '@xgen/types';

// ② Registry 인스턴스 생성
const registry = new FeatureRegistry();

// ③ import한 Feature만 등록
registry.register(chatNew);
registry.register(chatHistory);
// mlHub는 import하지 않았으므로 등록도 안 됨

// ④ export하여 App 전체에서 사용
export default registry;
```

### Step 3: 사이드바가 Registry를 읽음

```typescript
// apps/web/src/components/XgenSidebar.tsx

import registry from '../features';

function XgenSidebar() {
  // ⑤ Registry에게 "chat 섹션의 사이드바 아이템을 줘"라고 요청
  const chatItems = registry.getSidebarItems('chat');
  // → chatNew, chatHistory의 sidebarItems만 반환됨
  // → mlHub는 등록되지 않았으므로 여기에 없음

  return (
    <nav>
      {chatItems.map(item => (
        <SidebarItem key={item.id} {...item} />
      ))}
    </nav>
  );
}
```

### Step 4: 클릭 → 라우팅 → 컴포넌트 렌더링

```typescript
// ⑥ 사용자가 "대화 이력"을 클릭
// → item.id = 'chat-history'
// → registry.getAllRoutes()['chat-history'] = ChatHistoryPage 컴포넌트
// → 해당 컴포넌트가 메인 영역에 렌더링됨
```

### 전체 흐름 요약

```
import 주석 해제 → 빌드 포함 → Registry 등록 → 사이드바 표시 → 클릭 시 렌더링
import 주석 처리 → 빌드 제외 → Registry 미등록 → 사이드바에 없음 → 접근 불가
```

**이것이 가능한 이유 (3가지 원칙의 합작):**

1. ✅ Feature가 독립적이라서 하나를 빼도 다른 게 안 깨짐
2. ✅ App은 import + register만 하므로 한 줄 주석으로 제어 가능
3. ✅ 모든 Feature가 같은 계약(인터페이스)을 따라서 Registry가 범용적으로 작동

---

## 8. 폴더 구조 — 왜 이 위치에 이 파일이 있는가

### 8.1 루트 디렉토리

```
xgen-frontend-new/
├── package.json           ← 왜 여기? 모노레포 전체의 스크립트와 공통 devDeps
├── pnpm-workspace.yaml    ← 왜 여기? pnpm에게 "이 3폴더가 workspace다" 선언
├── turbo.json             ← 왜 여기? Turborepo에게 "build/dev/lint 태스크 정의" 전달
├── tsconfig.base.json     ← 왜 여기? 모든 하위 패키지가 extends할 기본 TS 설정
│
├── apps/                  ← 왜 별도? 배포 대상(빌드 결과물)만 모아둠
├── features/              ← 왜 별도? 기능 단위를 물리적으로 격리
└── packages/              ← 왜 별도? 공유 인프라를 별도 관리
```

### 8.2 "이 코드는 어디에 넣어야 하지?" 판단 트리

```
내가 작성하려는 코드가...

├─ 특정 화면/기능의 UI나 로직인가?
│   └─ YES → features/{해당-feature}/src/ 안에
│
├─ 3개 이상의 Feature에서 공유하는 범용 코드인가?
│   ├─ UI 컴포넌트? → packages/ui/
│   ├─ 타입 정의? → packages/types/
│   ├─ API 호출 관련? → packages/api-client/
│   ├─ 인증 관련? → packages/auth-provider/
│   ├─ 다국어? → packages/i18n/
│   ├─ 환경 설정? → packages/config/
│   ├─ 순수 유틸? → packages/utils/
│   ├─ 아이콘? → packages/icons/
│   └─ 글로벌 스타일? → packages/styles/
│
├─ Next.js 라우팅/레이아웃 관련인가?
│   └─ YES → apps/{web 또는 web_jeju}/src/app/
│
└─ 위 어디에도 해당하지 않는다?
    └─ 팀 리드와 논의하여 위치를 결정
```

---

## 9. 네이밍 규칙 — 이름만 보고 역할을 파악하는 법

### 9.1 Feature 디렉토리 이름 읽는 법

```
main-WorkflowManagement-Storage
  │        │              │
  │        │              └─ 접미사: 사용자가 데이터를 저장/관리하는 곳
  │        └─ 도메인: 워크플로우 관리
  └─ 접두사: 일반 사용자용 기능
```

#### 접두사 해독표

| 접두사 | "이 Feature는..." | 대상 사용자 |
|--------|-------------------|-------------|
| `main-` | 메인 앱에서 사이드바로 접근하는 일반 기능 | 일반 사용자 |
| `canvas-` | 캔버스(워크플로우 편집기) 내부의 플러그인 | 워크플로우 사용자 |
| `admin-` | 관리자 페이지의 메뉴 | 관리자 |
| `auth-` | 인증 화면 (로그인/회원가입) | 비로그인 사용자 |
| `mypage-` | 마이페이지 하위 기능 | 로그인된 사용자 |

#### 접미사 해독표

| 접미사 | "이 Feature의 성격은..." | 예시 |
|--------|------------------------|------|
| `-Storage` | CRUD 저장소 (내가 만든 것을 저장/수정/삭제) | `main-ModelStorage` |
| `-Store` | 카탈로그/마켓 (다른 사람이 만든 것을 탐색/다운로드) | `main-PromptManagement-Store` |
| `-Introduction` / `-Intro` | 해당 도메인의 인트로/랜딩/소개 페이지 | `main-ModelIntroduction` |
| `-Monitor` | 실시간 모니터링/대시보드 | `main-TrainMonitor` |

### 9.2 파일명 규칙

Feature 내부의 컴포넌트 파일:

```
⭕ kebab-case만 사용:
   content-area.tsx
   tool-storage-panel.tsx
   workflow-list-item.tsx
   chat-message-bubble.tsx

❌ PascalCase:
   ContentArea.tsx
   ToolStoragePanel.tsx

❌ camelCase:
   contentArea.tsx
   toolStoragePanel.tsx

❌ snake_case:
   content_area.tsx
```

### 9.3 package.json의 name 규칙

```jsonc
// Feature의 경우 — 디렉토리명을 그대로 사용
"name": "@xgen/feature-{디렉토리명}"
// 예: "@xgen/feature-canvas-core"
// 예: "@xgen/feature-admin-Admin"
// 예: "@xgen/feature-main-CurrentChat"
// 예: "@xgen/feature-main-dashboard"

// Package의 경우
"name": "@xgen/{name}"
// 예: "@xgen/types"
// 예: "@xgen/api-client"
```

---

## 10. 컴포넌트화 — 복붙 vs 분리의 판단 기준

### 10.1 핵심 원칙

> **2번 이상 반복되면 컴포넌트로 분리한다.**

### 10.2 구체적 판단 기준

| 상황 | 판단 | 이유 |
|------|------|------|
| 페이지 안에서 같은 카드 UI가 3개 반복됨 | 분리 | 한 곳 수정 → 3곳 반영 |
| 다른 페이지에서도 사용할 수 있는 테이블 | 분리 → `@xgen/ui` | 범용 UI는 packages에 |
| 이 페이지에서만 쓰는 특수 차트 | Feature 내 분리 | Feature 밖에서 쓸 일 없음 |
| MUI의 Button을 조금 변형 | `@xgen/ui`에서 이미 있는지 확인 | 이미 있으면 그것을 사용 |

### 10.3 실제 예시

#### Before (복붙 상태):

```tsx
// Feature 내부 - 같은 패턴이 3번 반복
function AdminPage() {
  return (
    <div>
      {/* 사용자 섹션 */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">사용자 관리</h2>
          <button className="px-4 py-2 bg-blue-500 text-white rounded">추가</button>
        </div>
        <table>...</table>
      </div>

      {/* 로그 섹션 - 거의 동일한 구조 */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">로그 관리</h2>
          <button className="px-4 py-2 bg-blue-500 text-white rounded">필터</button>
        </div>
        <table>...</table>
      </div>

      {/* 설정 섹션 - 또 동일한 구조 */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">설정</h2>
          <button className="px-4 py-2 bg-blue-500 text-white rounded">저장</button>
        </div>
        <form>...</form>
      </div>
    </div>
  );
}
```

#### After (컴포넌트화):

```tsx
// 공통 패턴을 컴포넌트로 추출
function SectionPanel({ title, actionLabel, onAction, children }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">{title}</h2>
        <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={onAction}>
          {actionLabel}
        </button>
      </div>
      {children}
    </div>
  );
}

// 깔끔하게 조립
function AdminPage() {
  return (
    <div>
      <SectionPanel title="사용자 관리" actionLabel="추가" onAction={handleAdd}>
        <UserTable />
      </SectionPanel>

      <SectionPanel title="로그 관리" actionLabel="필터" onAction={handleFilter}>
        <LogTable />
      </SectionPanel>

      <SectionPanel title="설정" actionLabel="저장" onAction={handleSave}>
        <SettingsForm />
      </SectionPanel>
    </div>
  );
}
```

**차이점:**
- Before: 디자인 변경 시 3곳 수정 필요. 실수로 1곳만 수정하면 불일치.
- After: `SectionPanel` 하나만 수정하면 3곳 동시 반영.

### 10.4 `@xgen/ui` 사용 체크

```
새 UI 컴포넌트를 만들기 전에:

1. packages/ui/src/ 에서 비슷한 컴포넌트 확인
2. 이미 있으면 → 가져다 쓴다
3. 없고, 3개 이상 Feature에서 쓸 것 같으면 → packages/ui/에 새로 만든다
4. 없고, 이 Feature에서만 쓸 것 같으면 → Feature 내부에 만든다
```

---

## 11. 새 Feature 추가 — Step by Step 실전 튜토리얼

### 예시: "알림 센터" 기능을 추가한다

#### Step 1: 모듈 타입 결정

```
"알림 센터"는...
  → 사이드바에 독립 메뉴가 필요한가? YES
  → 캔버스 내부 기능인가? NO
  → 관리자 전용인가? NO
  → 문서 탭인가? NO

결론: FeatureModule
```

#### Step 2: 디렉토리 및 파일 생성

```bash
# 1) 디렉토리 생성
mkdir -p features/main-NotificationCenter/src

# 2) package.json 생성
cat > features/main-NotificationCenter/package.json << 'EOF'
{
  "name": "@xgen/feature-main-NotificationCenter",
  "version": "0.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@xgen/types": "workspace:*",
    "@xgen/ui": "workspace:*",
    "@xgen/i18n": "workspace:*",
    "@xgen/api-client": "workspace:*",
    "react": "^19.0.0"
  }
}
EOF

# 3) tsconfig.json 생성
cat > features/main-NotificationCenter/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"]
}
EOF
```

#### Step 3: src/index.ts 작성

```typescript
'use client';

import type { FeatureModule } from '@xgen/types';

// ── 컴포넌트 정의 ──
function NotificationCenterPage() {
  return (
    <div>
      <h1>알림 센터</h1>
      {/* TODO: 알림 목록 구현 */}
    </div>
  );
}

// ── FeatureModule 계약 ──
export const notificationCenterFeature: FeatureModule = {
  id: 'main-NotificationCenter',           // ← 디렉토리명과 동일!
  name: 'Notification Center',
  sidebarSection: 'workspace',              // ← workspace 섹션에 표시
  sidebarItems: [
    {
      id: 'notification-center',
      titleKey: 'workspace.notificationCenter.title',
      descriptionKey: 'workspace.notificationCenter.description',
    }
  ],
  routes: {
    'notification-center': NotificationCenterPage,
  },
};

export default notificationCenterFeature;
```

#### Step 4: 앱에 등록

```typescript
// apps/web/src/features.ts

import notificationCenter from '@xgen/feature-main-NotificationCenter'; // ← 추가!

// ... 기존 코드 ...

registry.register(notificationCenter); // ← 등록!
```

#### Step 5: 앱의 package.json에 의존성 추가

```jsonc
// apps/web/package.json 의 dependencies에 추가:
"@xgen/feature-main-NotificationCenter": "workspace:*"
```

#### Step 6: i18n 키 추가

```jsonc
// packages/i18n/src/ko.json
{
  "workspace": {
    "notificationCenter": {
      "title": "알림 센터",
      "description": "알림을 확인하세요"
    }
  }
}

// packages/i18n/src/en.json
{
  "workspace": {
    "notificationCenter": {
      "title": "Notification Center",
      "description": "Check your notifications"
    }
  }
}
```

#### Step 7: 의존성 설치 및 확인

```bash
pnpm install
pnpm dev:web
```

**결과:** 사이드바 "Workspace" 섹션에 "알림 센터" 메뉴가 자동으로 나타남!

#### Step 8: web_jeju에서 제외하고 싶다면?

```typescript
// apps/web_jeju/src/features.ts
// import notificationCenter from '@xgen/feature-main-notification-center'; // ← 주석처리만 하면 됨
```

---

## 12. 자주 하는 실수 & 교정 가이드

### 실수 1: "Feature 안에서 다른 Feature를 import 했어요"

```typescript
// ❌ features/main-chat-history/src/index.ts
import { formatMessage } from '@xgen/feature-chat-new';  // WRONG!
```

**왜 안 되나:** `chat-new`를 비활성화하면 `chat-history`가 깨짐

**교정:**
```typescript
// ⭕ 공유 로직을 packages/utils 등으로 이동
// packages/utils/src/message-formatter.ts
export function formatMessage(msg: string): string { ... }

// features/main-chat-history/src/index.ts
import { formatMessage } from '@xgen/utils';  // OK!
```

---

### 실수 2: "apps/ 안에 비즈니스 컴포넌트를 만들었어요"

```
❌ apps/web/src/components/ChatMessageList.tsx  // 이건 Feature여야 함
```

**왜 안 되나:** web_jeju에서 같은 기능이 필요하면 코드를 복사해야 함

**교정:** `features/main-chat-history/src/index.ts` 안에 해당 컴포넌트를 배치

---

### 실수 3: "PascalCase로 파일을 만들었어요"

```
❌ features/main-chat-history/src/ChatList.tsx
⭕ features/main-chat-history/src/chat-list.tsx
```

**교정:** 파일명을 kebab-case로 변경. git mv를 사용하여 이력을 보존.
```bash
git mv ChatList.tsx chat-list.tsx
```

---

### 실수 4: "Feature id와 디렉토리 이름이 달라요"

```
❌ 디렉토리: features/main-chat-history/
   id: 'chatHistory'     // 불일치!

⭕ 디렉토리: features/main-chat-history/
   id: 'main-chat-history' // 일치!
```

**왜 안 되나:** 에러 발생 시 id로 검색하면 해당 파일을 찾을 수 없음

---

### 실수 5: "fetch를 직접 호출했어요"

```typescript
// ❌
const res = await fetch('/api/notifications', {
  headers: { Authorization: `Bearer ${token}` }
});

// ⭕
import { createApiClient } from '@xgen/api-client';
const api = createApiClient();
const data = await api.get('/notifications');
// → 토큰 자동 첨부, 에러 핸들링 통일, base URL 자동 적용
```

---

### 실수 6: "공통 컴포넌트와 비슷한 걸 만들었어요"

```typescript
// ❌ Feature 안에서 새로 만듬
function MyButton({ children, onClick }) {
  return <button className="px-4 py-2 bg-blue-500 rounded" onClick={onClick}>{children}</button>;
}

// ⭕ 기존 공통 컴포넌트 사용
import { Button } from '@xgen/ui';
// → <Button onClick={handleClick}>제출</Button>
```

---

### 실수 7: "환경 변수를 직접 읽었어요"

```typescript
// ❌
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// ⭕
import { getBackendUrl } from '@xgen/config';
const apiUrl = getBackendUrl();
```

---

## 13. 코드 리뷰 체크리스트

PR을 올리기 전에, 스스로 체크하세요:

### 구조 점검

- [ ] **위치가 맞는가?** — 이 코드가 features/, packages/, apps/ 중 올바른 곳에 있는가?
- [ ] **Feature 독립성** — 이 Feature를 삭제해도 다른 Feature가 정상 동작하는가?
- [ ] **의존성 방향** — Feature → Feature 의존이 없는가? Package → Feature 의존이 없는가?

### 네이밍 점검

- [ ] **파일명** — kebab-case인가? (`chat-header.tsx` ⭕, `ChatHeader.tsx` ❌)
- [ ] **Feature id** — 디렉토리 이름과 일치하는가?
- [ ] **package.json name** — `@xgen/feature-{kebab-name}` 형식인가?

### 계약 점검

- [ ] **모듈 타입** — FeatureModule / CanvasSubModule / AdminSubModule / DocumentTabConfig 중 올바른 것을 사용했는가?
- [ ] **필수 필드** — id, name, sidebarSection, sidebarItems, routes가 빠짐없이 있는가?
- [ ] **default export** — `export default` 가 있는가?

### 컴포넌트 점검

- [ ] **복붙 없음** — 2회 이상 반복되는 UI가 컴포넌트로 분리되어 있는가?
- [ ] **공통 컴포넌트 우선** — `@xgen/ui`에 비슷한 컴포넌트가 이미 있지 않은가?
- [ ] **직접 fetch 없음** — API 호출이 모두 `@xgen/api-client`를 통하는가?
- [ ] **환경변수 직접 접근 없음** — `@xgen/config`를 통해 읽는가?

### i18n 점검

- [ ] **하드코딩 문자열 없음** — 화면에 표시되는 텍스트가 i18n 키를 사용하는가?
- [ ] **ko/en 모두 추가** — 새 i18n 키를 양쪽 언어 파일에 추가했는가?

---

## 14. 요약: 5분 안에 기억해야 할 것

### 한 줄 요약

> **Feature는 독립 패키지, Package는 공유 인프라, App은 조립만 한다.**

### 5가지 기억할 것

```
1. Feature끼리 import하지 않는다      → 독립성
2. App에 비즈니스 로직 넣지 않는다     → 조립만
3. 공통 UI는 @xgen/ui를 쓴다         → 일관성
4. API는 @xgen/api-client로 호출한다  → 중앙화
5. 파일명은 kebab-case로 짓는다       → 규칙 통일
```

### 코드 넣을 위치 3초 판단법

```
특정 기능의 화면/로직인가? → features/
여러 기능이 공유하는 범용 코드인가? → packages/
라우팅/레이아웃뿐인가? → apps/
```

### 모듈 타입 3초 판단법

```
사이드바에 메뉴가 필요?         → FeatureModule
캔버스 안에서 동작?             → CanvasSubModule
관리자 페이지의 하위 메뉴?       → AdminSubModule
문서 관리 페이지의 탭?          → DocumentTabConfig
```

---

> **이 문서가 도움이 되었나요?**
>
> 이해가 안 되는 부분이 있다면 **구체적으로 어떤 부분**이 이해가 안 되는지 팀 리드에게 말해주세요.
> "그냥 모르겠어요"가 아니라 "Feature 간 의존성이 왜 안 되는지 이해가 안 돼요" 처럼 구체적으로요.
> 그래야 이 문서를 더 좋게 만들 수 있습니다.
