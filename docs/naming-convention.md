# Feature 명명 규칙 (Naming Convention)

## 기본 원칙

모든 feature 디렉토리 이름은 **`{page}-{PascalCaseSubPageName}`** 형식을 따른다.

| 구성 요소 | 설명 | 예시 |
|-----------|------|------|
| `{page}` | 해당 feature가 속한 최상위 페이지 (소문자) | `main`, `admin`, `support`, `mypage`, `auth` |
| `{PascalCaseSubPageName}` | 세부 페이지/기능명 (PascalCase, 공백 제거) | `Dashboard`, `WorkflowManagement`, `SystemSettings` |

### 예시

```
main-dashboard            ← main 페이지의 Dashboard
main-WorkflowIntroduction ← main 페이지의 Workflow Introduction
main-ExecutionTools       ← main 페이지의 Execution Tools (tool-storage)
admin-SystemSettings      ← admin 페이지의 System Settings
admin-MCPMarket           ← admin 페이지의 MCP Market
support-FAQ               ← support 페이지의 FAQ
mypage-ProfileEdit        ← mypage의 Profile Edit
auth-Login                ← auth 페이지의 Login
```

## 탭 분리 규칙

한 페이지 내에서 **탭으로 분리된 기능**은 `-`를 하나 더 추가하여 디렉토리 구조처럼 표현한다.

**형식:** `{page}-{ParentPage}-{TabName}`

| 구성 요소 | 설명 | 예시 |
|-----------|------|------|
| `{page}` | 최상위 페이지 (소문자) | `main` |
| `{ParentPage}` | 부모 페이지명 (PascalCase) | `DocumentManagement`, `WorkflowManagement` |
| `{TabName}` | 탭 이름 (PascalCase) | `Collections`, `Storage`, `Store` |

### 예시

```
main-DocumentManagement-Collections  ← Document Management의 Collections 탭
main-DocumentManagement-FileStorage  ← Document Management의 File Storage 탭
main-DocumentManagement-Repository   ← Document Management의 Repository 탭
main-DocumentManagement-Database     ← Document Management의 Database 탭
main-WorkflowManagement-Storage      ← Workflow Management의 Storage 탭
main-WorkflowManagement-Store        ← Workflow Management의 Store 탭
main-WorkflowManagement-Scheduler    ← Workflow Management의 Scheduler 탭
main-WorkflowManagement-Tester       ← Workflow Management의 Tester 탭
main-AuthProfileManagement-Storage   ← Auth Profile Management의 Storage 탭
main-AuthProfileManagement-Store     ← Auth Profile Management의 Store 탭
main-PromptManagement-Storage        ← Prompt Management의 Storage 탭
main-PromptManagement-Store          ← Prompt Management의 Store 탭
```

## 예외: Canvas

Canvas는 **특수 페이지**로, 기능 단위 분해(functional decomposition) 구조를 유지한다.
Canvas feature는 kebab-case로 유지하며 `canvas-` 접두사를 사용한다.

```
canvas-intro              ← Canvas 소개 페이지
canvas-core               ← Canvas 핵심 로직
canvas-node-system        ← 노드 시스템
canvas-edge-system        ← 엣지 시스템
canvas-execution          ← 실행 엔진
canvas-history            ← 히스토리
canvas-auto-workflow      ← AI 자동 워크플로우
canvas-side-menu          ← 사이드 메뉴
canvas-special-nodes      ← 특수 노드
canvas-header             ← 헤더
```

## 페이지 분류표

| page 접두사 | 설명 | feature 수 |
|-------------|------|-----------|
| `main` | 메인 앱 페이지 (대시보드, 채팅, 워크플로우, 데이터, 모델 등) | 31 |
| `admin` | 관리자 페이지 | 33 |
| `support` | 고객지원 페이지 | 5 |
| `mypage` | 마이페이지 | 5 |
| `auth` | 인증 페이지 | 3 |
| `canvas` | 캔버스 (예외 — 기능 단위 분해) | 10 |

## 파일 구조

각 feature 디렉토리는 다음 구조를 따른다.

```
features/{page}-{SubPageName}/
├── package.json        ← name: "@xgen/feature-{page}-{SubPageName}"
├── tsconfig.json
└── src/
    └── index.ts        ← FeatureModule | AdminSubModule | CanvasSubModule | DocumentTabConfig export
```

### package.json 이름

```json
{ "name": "@xgen/feature-main-dashboard" }
```

### 모듈 ID

`src/index.ts`에서 export하는 모듈의 `id` 필드는 디렉토리명과 동일해야 한다.

```typescript
const dashboardFeature: FeatureModule = {
  id: 'main-dashboard',   // ← 디렉토리명과 동일
  name: 'Dashboard',
  // ...
};
```

## 새 Feature 추가 절차

1. `features/{page}-{SubPageName}/` 디렉토리 생성
2. `package.json` 작성 — `name: "@xgen/feature-{page}-{SubPageName}"`
3. `src/index.ts`에 모듈 export — `id`를 디렉토리명과 동일하게 설정
4. `apps/web/src/features.ts`에 import 추가
5. `apps/web/package.json`의 `dependencies`에 `"@xgen/feature-{page}-{SubPageName}": "workspace:*"` 추가
6. (제주은행에도 포함할 경우) `apps/web_jeju/src/features.ts` 및 `package.json`에도 동일하게 추가

## 기능 비활성화

`features.ts`에서 해당 import 줄을 **주석 처리**하면 기능이 비활성화된다.

```typescript
// import myFeature from '@xgen/feature-main-MyFeature';  // 비활성화
```

제주은행 빌드(`web_jeju`)에서는 기본적으로 다음이 제외되어 있다:(예시)
- `canvas-auto-workflow`
- `main-DocumentFileStorage`, `main-DocumentRepository`, `main-DocumentDatabase`
- `main-ML*` 전체 (ML 모델 기능)
- `admin-MCP*`, `admin-ML*`, `admin-Gov*`
- `main-Agent`, `main-ScenarioRecorder`
