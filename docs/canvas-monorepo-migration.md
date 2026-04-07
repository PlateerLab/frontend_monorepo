# Canvas Monorepo 마이그레이션 계획서

> **작성일**: 2026-03-31
> **목적**: xgen-frontend의 Canvas 기능을 frontend_monorepo 아키텍처로 완전 이관
> **범위**: ~12,000 lines / 60+ files → 3 packages + 10 features

---

## 목차

1. [현황 분석](#1-현황-분석)
2. [설계 철학](#2-설계-철학)
3. [아키텍처 개요](#3-아키텍처-개요)
4. [공유 패키지 (packages/) 설계](#4-공유-패키지-packages-설계)
5. [Feature 분리 설계 (features/)](#5-feature-분리-설계-features)
6. [인터페이스 설계 (@xgen/types)](#6-인터페이스-설계-xgentypes)
7. [앱 조립 설계 (apps/)](#7-앱-조립-설계-apps)
8. [i18n 설계](#8-i18n-설계)
9. [마이그레이션 순서](#9-마이그레이션-순서)
10. [위험 요소 및 대응](#10-위험-요소-및-대응)

---

## 1. 현황 분석

### 1-1. 현재 Canvas 코드 구조 (xgen-frontend)

```
src/app/canvas/
├── page.tsx                          (2,938 lines) ← 모놀리식 진입점
├── types.ts                          (200 lines)   ← 전체 타입 정의
└── constants/
    ├── nodes.js                      ← 노드 카탈로그 (데모)
    └── workflow/                     ← JSON 템플릿

src/app/components/pages/workflow/canvas/components/
├── Canvas/                           ← 코어 캔버스 엔진
│   ├── index.tsx                     (1,407 lines) ← forwardRef + useImperativeHandle
│   ├── components/                   ← 내부 렌더러 (Nodes, Edges, Memos, Predicted)
│   ├── types/                        ← CanvasProps, CanvasRef
│   └── utils/                        ← canvasUtils (상수, 유효성 검사)
├── Node/                             ← 노드 렌더링 시스템
│   ├── index.tsx                     (247 lines)
│   ├── components/                   ← Header, Ports, Parameters, ContextMenu
│   │   ├── parameters/               ← 7개 파라미터 타입 에디터
│   │   └── specialized/              ← Router, Schema 전용 파라미터
│   ├── types/
│   └── utils/                        ← nodeUtils, portUtils, parameterUtils
├── special-node/                     ← 특수 노드 (Router, Agent, Schema)
├── side-menu-panel/                  ← 사이드 패널 (AddNode, Template, Workflow)
├── Helper/                           ← DraggableNodeItem, NodeList
├── Header.tsx                        (390 lines)
├── Edge.tsx                          (155 lines)
├── SideMenu.tsx                      (118 lines)
├── CanvasContextMenu.tsx             (221 lines)
├── CanvasEmptyState.tsx              (68 lines)
├── CanvasBottomPanelContent.tsx      (368 lines)
├── CanvasExecutionLogPanel.tsx       (87 lines)
├── BottomExecutionLogPanel.tsx       (166 lines)
├── ExecutionPanel.tsx                (173 lines)
├── DetailPanel.tsx                   (547 lines)
├── HistoryPanel.tsx                  (165 lines)
├── NodeModal.tsx                     (97 lines)
├── NodeDetailModal.tsx               (537 lines)
├── AutoWorkflowSidebar.tsx           (507 lines)
├── CanvasDocumentDropModal.tsx       (307 lines)
├── EditRunFloating.tsx               (49 lines)
├── Zoombox.tsx                       (57 lines)
└── ZoomPercent.tsx                   (31 lines)

src/app/hooks/pages/workflow/canvas/  ← 12개 커스텀 훅 (~2,533 lines)
src/app/_common/api/workflow/         ← API 함수 (~2,800 lines)
src/app/_common/utils/                ← 유틸리티 (workflowStorage, nodeHook 등)
src/app/assets/pages/workflow/canvas/ ← 28+ SCSS 모듈
```

### 1-2. 핵심 문제점

| 문제 | 설명 |
|------|------|
| **모놀리식 진입점** | `page.tsx` 2,938줄에 레이아웃 알고리즘(~700줄), 상태관리(30+개), 핸들러(20+개)가 혼재 |
| **Feature 분리 불가** | 모든 컴포넌트가 Page에 직접 의존, Registry 패턴 미적용 |
| **타입 분산** | Canvas 타입이 `canvas/types.ts`에 격리, `@xgen/types`에 미포함 |
| **API 결합** | 글로벌 `apiClient` + `API_BASE_URL` 직접 사용, `@xgen/api-client` 미사용 |
| **i18n 미분리** | 전역 `@/i18n` 호출, Feature별 locale 미분리 |
| **상태관리** | 글로벌 스토어 없이 Props Drilling + `useImperativeHandle` ref 패턴 |
| **sessionStorage 결합** | `workflowStorage.js`가 탭 세션 키에 직접 의존 |

### 1-3. Canvas 기술 특징 (마이그레이션 시 보존해야 할 것)

- **자체 캔버스 엔진**: ReactFlow 미사용, DIV(노드) + SVG(엣지) 혼합 렌더링
- **커스텀 레이아웃 엔진**: Column/Lane 기반 자동정렬, Router 분기 인식
- **특수 노드 시스템**: 매처 기반 동적 렌더러 (Router, Agent, Schema)
- **AI 워크플로우 생성**: 자연어 → 워크플로우 그래프 변환
- **SSE 스트리밍 실행**: 노드별 실시간 상태 추적
- **Chrome Extension API**: 외부 자동화 이벤트 인터페이스
- **Undo/Redo**: 캔버스 상태 스냅샷 기반 히스토리
- **Document Drop**: 파일 드롭 → RAG 노드 자동 생성

---

## 2. 설계 철학

### 2-1. Canvas 분리의 원칙

Canvas는 단일 Feature로 만들면 안 된다. README §5-2의 원칙을 따른다:

> "복잡한 화면 하나를 만들어야 한다. 그 화면에는 여러 기능이 들어간다.
> 이것들을 하나의 거대한 Feature로 만들면 안 된다."

그러나 Canvas는 일반적인 "탭 조립" 패턴과 다르다.
Canvas 코어 엔진 자체가 하나의 통합된 상호작용 시스템이므로,
**엔진은 하나로 유지**하되 **주변 기능을 플러그인으로 분리**하는 전략을 취한다.

### 2-2. 분리 기준 — 무엇이 "엔진"이고 무엇이 "플러그인"인가

```
Canvas 엔진 (분리 불가)           Canvas 플러그인 (독립 분리 가능)
─────────────────────           ───────────────────────────
• 노드 렌더링/인터랙션            • 헤더 (저장/이름/모드 전환)
• 엣지 렌더링/연결               • 사이드 메뉴 패널들
• 줌/팬 뷰포트                    (노드 추가, 템플릿, 워크플로우)
• 드래그 상태 머신                • 실행 패널 (하단)
• 선택/복사/붙여넣기              • 히스토리 패널
• 포트 핸들링                    • AI 자동생성 사이드바
• 키보드 단축키                  • 컨텍스트 메뉴
• Undo/Redo 시스템               • 노드 상세/편집 모달
• 특수 노드 렌더링               • 문서 드롭 모달
• 메모 시스템                    • 배포 모달
• 예측 노드                     • 빈 상태 화면
• 자동 연결
```

**판단 근거**: "이것을 제거해도 캔버스 자체가 동작하는가?"
- 헤더를 제거해도 캔버스에 노드를 놓고 연결할 수 있다 → 플러그인
- 노드 렌더링을 제거하면 캔버스 자체가 성립하지 않는다 → 엔진

### 2-3. 공유 패키지 기준

```
3개 이상의 Feature가 사용하는가?     → packages/에 넣는다
Canvas 외부(Workflow 관리 등)에서도   → packages/에 넣는다
사용하는 로직인가?
순수 함수로 분리 가능한 로직인가?     → packages/에 넣는다
React 의존성이 없는 유틸리티인가?      → packages/에 넣는다
```

---

## 3. 아키텍처 개요

### 3-1. 최종 구조

```
packages/
├── canvas-types/           ← Canvas 전용 타입 (Node, Edge, Memo, Port, Parameter...)
├── canvas-layout/          ← 워크플로우 레이아웃 알고리즘 (순수 함수)
├── canvas-engine/          ← Canvas 코어 엔진 (React 컴포넌트 + 훅)
│                              Canvas, Node, Edge, 특수노드, 예측노드 포함
│
├── types/                  ← 기존 + Canvas 플러그인 인터페이스 추가
├── api-client/             ← 기존 (변경 없음)
├── config/                 ← 기존 (변경 없음)
├── i18n/                   ← 기존 (변경 없음)
├── ui/                     ← 기존 (변경 없음)
├── icons/                  ← 기존 (변경 없음)

features/
├── canvas-core/            ← 캔버스 페이지 오케스트레이터 (조립)
├── canvas-header/          ← 헤더 (파일명, 저장, 모드 전환, 배포)
├── canvas-sidebar-nodes/   ← 사이드 패널: 노드 추가
├── canvas-sidebar-templates/ ← 사이드 패널: 템플릿 브라우저
├── canvas-sidebar-workflows/ ← 사이드 패널: 워크플로우 목록
├── canvas-execution/       ← 실행 엔진 + 하단 실행 패널 + 로그
├── canvas-history/         ← 히스토리 패널 (Undo/Redo UI)
├── canvas-ai-generator/    ← AI 워크플로우 자동생성 사이드바
├── canvas-node-detail/     ← 노드 상세 모달 + 파라미터 편집 모달
├── canvas-document-drop/   ← 문서 드롭 → RAG 노드 생성
│
├── main-canvas-intro/       ← 기존 유지 (캔버스 소개 페이지)
```

### 3-2. 의존성 방향

```
apps/web
  ├── canvas-core (오케스트레이터)
  │     ├── @xgen/canvas-engine  (패키지)
  │     ├── @xgen/canvas-layout  (패키지)
  │     ├── @xgen/canvas-types   (패키지)
  │     └── CanvasPagePlugin[]   (Registry에서 조회)
  │           ├── canvas-header
  │           ├── canvas-sidebar-nodes
  │           ├── canvas-sidebar-templates
  │           ├── canvas-sidebar-workflows
  │           ├── canvas-execution
  │           ├── canvas-history
  │           ├── canvas-ai-generator
  │           ├── canvas-node-detail
  │           └── canvas-document-drop
  │
  └── main-canvas-intro (소개 페이지, 독립)
```

**핵심 규칙**: Feature 간 직접 import 없음. 모든 조합은 `canvas-core`가 Registry를 통해 수행한다.

---

## 4. 공유 패키지 (packages/) 설계

### 4-1. `@xgen/canvas-types` — Canvas 타입 정의

**출처**: `xgen-frontend/src/app/canvas/types.ts` + `Node/types/` + `Canvas/types/`

```
packages/canvas-types/
├── package.json
├── tsconfig.json
└── src/
    └── index.ts
```

**포함 타입**:

```typescript
// ── 기본 타입 ──
export interface Position { x: number; y: number; }
export interface View { x: number; y: number; scale: number; }

// ── 포트/파라미터 ──
export interface Port { id, name, type, required?, multi?, stream?, description?, ... }
export interface ParameterOption { value, label?, isSingleValue? }
export interface Parameter { id, name, value, type?, required?, options?, min?, max?, ... }

// ── 노드 ──
export interface NodeData { id, nodeName, nodeNameKo?, description?, inputs?, outputs?, parameters?, bypass? }
export interface CanvasNode { id, data: NodeData, position: Position, isExpanded? }
export interface NodeCategory { categoryId, categoryName, icon, functions? }
export interface NodeFunction { functionId, functionName, nodes? }
export interface PredictedNode { id, nodeData, position, isHovered }

// ── 엣지 ──
export interface EdgeConnection { nodeId, portId, portType, type? }
export interface CanvasEdge { id, source: EdgeConnection, target: EdgeConnection }
export interface EdgePreview { source, startPos, targetPos }

// ── 메모 ──
export interface CanvasMemo { id, content, position, size?, color?, fontSize? }
export type MemoColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple';
export const MEMO_COLORS, MEMO_DEFAULT_COLOR, MEMO_DEFAULT_SIZE, MEMO_DEFAULT_FONT_SIZE;

// ── 워크플로우 ──
export interface WorkflowData { workflow_name?, workflow_id?, nodes?, edges?, memos?, view? }
export interface WorkflowState extends WorkflowData { }
export interface RawTemplate { workflow_id, workflow_name, description?, tags?, contents? }
export interface Template { id, name, description, tags, nodes, data? }

// ── 캔버스 상태 ──
export interface CanvasState { view: View, nodes: CanvasNode[], edges: CanvasEdge[], memos: CanvasMemo[] }
export interface DragState { type: 'none'|'canvas'|'node'|'edge'|'selection-box'|'memo', ... }
export interface ValidationResult { isValid, error?, nodeId?, nodeName?, inputName? }

// ── 특수 노드 ──
export interface SpecialNodeConfig { name, component, matcher: (data: NodeData) => boolean, additionalProps? }
```

**의존성**: 없음 (순수 타입)
**사용처**: `canvas-engine`, `canvas-layout`, 모든 `canvas-*` features

### 4-2. `@xgen/canvas-layout` — 레이아웃 알고리즘

**출처**: `page.tsx` 75~950줄 (순수 함수 ~700줄)

```
packages/canvas-layout/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts                    ← public API
    ├── execution-layout.ts         ← buildExecutionLayoutPositions
    ├── workflow-layout.ts          ← buildWorkflowLayoutPositions
    ├── utils/
    │   ├── lane-utils.ts           ← buildLaneMeta, getLaneBoundsByKey, getLaneMetricsById
    │   ├── branch-utils.ts         ← normalizeLevels, getBranchLevels, resolveBranchPortOrder
    │   ├── alignment-utils.ts      ← applyChainAlignment, resolveRowCollisions
    │   ├── sort-utils.ts           ← getLayoutHintMaps, sortLevelNodesByPort
    │   └── math-utils.ts           ← clampGap, clampValue
    └── constants.ts                ← HORIZONTAL_SPACING, VERTICAL_SPACING, ...
```

**Public API**:

```typescript
export function buildExecutionLayoutPositions(
  groups: string[][],
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  viewScale?: number,
  spacingX?: number,
  spacingY?: number,
  sizeById?: Map<string, { width: number; height: number }>,
): Record<string, Position>;

export function buildWorkflowLayoutPositions(
  layoutData: WorkflowLayoutData,
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  viewScale?: number,
  spacingX?: number,
  spacingY?: number,
  sizeById?: Map<string, { width: number; height: number }>,
): Record<string, Position>;

export { HORIZONTAL_SPACING, VERTICAL_SPACING, NODE_APPROX_WIDTH, NODE_APPROX_HEIGHT };
```

**의존성**: `@xgen/canvas-types` (Position, CanvasNode, CanvasEdge만 사용)
**React 의존성**: 없음 (순수 함수). `getRenderedNodeSizes`(DOM 접근)는 호출자 책임으로 분리.

### 4-3. `@xgen/canvas-engine` — Canvas 코어 엔진

**출처**: Canvas/ 디렉토리 + Node/ 디렉토리 + Edge + special-node/ + 12개 훅

이것이 가장 핵심적이고 가장 큰 패키지이다.
"캔버스 엔진"은 하나의 응집된 시스템이므로 Feature로 분리하지 않고 패키지로 제공한다.

```
packages/canvas-engine/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts                        ← public API (Canvas, CanvasRef 등)
    │
    ├── canvas/
    │   ├── canvas.tsx                  ← Canvas 코어 (forwardRef + useImperativeHandle)
    │   ├── canvas-nodes.tsx            ← 노드 렌더 레이어
    │   ├── canvas-edges.tsx            ← 엣지 렌더 레이어 (SVG)
    │   ├── canvas-memos.tsx            ← 메모 렌더 레이어
    │   ├── canvas-predicted-nodes.tsx  ← 예측 노드 고스트
    │   ├── canvas-predicted-popup.tsx  ← 예측 노드 선택 UI
    │   ├── canvas-add-popup.tsx        ← 더블클릭 노드 추가 팝업
    │   ├── canvas-context-menu.tsx     ← 우클릭 컨텍스트 메뉴
    │   └── types.ts                    ← CanvasProps, CanvasRef
    │
    ├── node/
    │   ├── node.tsx                    ← 노드 컴포넌트
    │   ├── node-header.tsx
    │   ├── node-ports.tsx
    │   ├── node-ports-collapsed.tsx
    │   ├── node-parameters.tsx
    │   ├── node-context-menu.tsx
    │   ├── router-node-ports.tsx
    │   ├── parameters/                 ← 파라미터 에디터 7종
    │   │   ├── api-parameter.tsx
    │   │   ├── boolean-parameter.tsx
    │   │   ├── default-parameter.tsx
    │   │   ├── expandable-parameter.tsx
    │   │   ├── file-parameter.tsx
    │   │   ├── handle-parameter.tsx
    │   │   └── tool-name-parameter.tsx
    │   └── utils/
    │       ├── node-utils.ts
    │       ├── port-utils.ts
    │       └── parameter-utils.ts
    │
    ├── edge/
    │   └── edge.tsx                    ← Bezier 커브 SVG 엣지
    │
    ├── memo/
    │   └── memo.tsx                    ← 스티키 메모 컴포넌트
    │
    ├── special-node/
    │   ├── registry.ts                 ← 특수 노드 매처 레지스트리
    │   ├── router-node.tsx
    │   ├── agent-xgen-node.tsx
    │   └── schema-provider-node.tsx
    │
    ├── hooks/
    │   ├── use-canvas-view.ts
    │   ├── use-canvas-selection.ts
    │   ├── use-node-management.ts
    │   ├── use-edge-management.ts
    │   ├── use-memo-management.ts
    │   ├── use-drag-state.ts
    │   ├── use-predicted-nodes.ts
    │   ├── use-canvas-event-handlers.ts
    │   ├── use-port-handlers.ts
    │   ├── use-keyboard-handlers.ts
    │   ├── use-auto-connect.ts
    │   └── use-history-management.ts
    │
    ├── utils/
    │   ├── canvas-utils.ts             ← MIN_SCALE, MAX_SCALE, SNAP_DISTANCE,
    │   │                                  areTypesCompatible, validateRequiredInputs
    │   └── workflow-storage.ts         ← sessionStorage CRUD (workflowState, history, name, id)
    │
    └── styles/                         ← SCSS 모듈 (Canvas, Node, Edge, Memo, ContextMenu 등)
```

**Public API**:

```typescript
// 컴포넌트
export { Canvas } from './canvas/canvas';
export type { CanvasProps, CanvasRef } from './canvas/types';

// 노드
export { Node } from './node/node';
export { findSpecialNode, isSpecialNode, registerSpecialNode } from './special-node/registry';

// 엣지
export { Edge } from './edge/edge';

// 메모
export { Memo } from './memo/memo';

// 훅 (canvas-core Feature에서 사용)
export { useHistoryManagement, createHistoryHelpers } from './hooks/use-history-management';

// 유틸리티
export {
  areTypesCompatible, validateRequiredInputs, parseMultiType,
  MIN_SCALE, MAX_SCALE, SNAP_DISTANCE,
  isRouterNode,
} from './utils/canvas-utils';

export {
  getWorkflowState, saveWorkflowState, clearWorkflowState,
  getWorkflowName, saveWorkflowName, getWorkflowId, saveWorkflowId,
  startNewWorkflow, createAndSaveNewWorkflowId, getCanvasInteractionId,
  getWorkflowHistory, saveWorkflowHistory, ensureValidWorkflowState,
} from './utils/workflow-storage';
```

**의존성**:
```json
{
  "@xgen/canvas-types": "workspace:*",
  "@xgen/i18n": "workspace:*",
  "@xgen/icons": "workspace:*",
  "react": "^19.0.0"
}
```

**설계 판단 — 왜 패키지인가?**:
1. Canvas 엔진 내부의 훅/컴포넌트는 서로 **밀접하게 결합**되어 있다 (useCanvasEventHandlers는 거의 모든 훅의 반환값을 받음)
2. Feature로 분리하면 Feature 간 import 금지 규칙을 위반해야 한다
3. 엔진은 "기능"이 아니라 "인프라"이다 — `@xgen/ui`와 같은 레벨
4. 여러 앱(web, web_jeju 등)에서 동일한 캔버스 엔진을 공유할 수 있어야 한다

---

## 5. Feature 분리 설계 (features/)

### 5-1. `canvas-core` — 캔버스 페이지 오케스트레이터

> README §5-2 "에디터 화면"의 `EditorPage` 역할

**출처**: `page.tsx`의 JSX 조립 + 상태 오케스트레이션 (레이아웃 알고리즘, 유틸리티 제거 후 ~800줄)

**역할**:
- CanvasPagePlugin[]을 Registry에서 조회
- Canvas ref를 통해 엔진과 통신
- 플러그인 슬롯에 컴포넌트 배치
- 전역 상태 (canvasMode, workflowId 등) 관리
- Drop 이벤트 라우팅 (노드 드롭 → 엔진, 문서 드롭 → 플러그인)

```typescript
// features/canvas-core/src/index.tsx
import { Canvas, useHistoryManagement, createHistoryHelpers } from '@xgen/canvas-engine';
import { buildWorkflowLayoutPositions } from '@xgen/canvas-layout';
import { FeatureRegistry } from '@xgen/types';
import type { CanvasPagePlugin } from '@xgen/types';

function CanvasPage() {
  const plugins = FeatureRegistry.getCanvasPagePlugins();
  const canvasRef = useRef<CanvasRef>(null);

  // 플러그인에서 슬롯별 컴포넌트 수집
  const HeaderComp = plugins.find(p => p.headerComponent)?.headerComponent;
  const sidePanels = plugins.flatMap(p => p.sidePanels ?? []);
  const bottomPanels = plugins.flatMap(p => p.bottomPanels ?? []);
  const overlays = plugins.flatMap(p => p.overlays ?? []);
  const modals = plugins.flatMap(p => p.modals ?? []);

  return (
    <AuthGuard>
      <div className={styles.layout}>
        {HeaderComp && <HeaderComp canvasRef={canvasRef} ... />}
        <EditRunFloating mode={canvasMode} onToggle={...} />
        <div className={styles.canvasWrapper}>
          {activeSidePanel && <SidePanelRenderer ... />}
          <Canvas ref={canvasRef} ... />
          {isEmpty && <CanvasEmptyState ... />}
          <Zoombox onZoom={...} />
          <ZoomPercent percent={zoomPercent} />
        </div>
        {bottomPanels.map(panel => <panel.component ... />)}
        {modals.map(modal => <modal.component ... />)}
        {overlays.map(overlay => <overlay.component ... />)}
      </div>
    </AuthGuard>
  );
}

export const canvasCoreFeature: MainFeatureModule = {
  id: 'canvas-core',
  name: 'Canvas Editor',
  sidebarSection: 'workflow',
  sidebarItems: [{ id: 'canvas', titleKey: 'sidebar.workflow.canvas.title', ... }],
  routes: { canvas: CanvasPage },
  requiresAuth: true,
};
```

**EditRunFloating, Zoombox, ZoomPercent, CanvasEmptyState는 왜 Feature가 아닌가?**
- 49줄, 57줄, 31줄, 68줄 — 너무 작아서 독립 패키지의 오버헤드가 이점보다 크다
- 캔버스 코어 레이아웃의 필수 구성 요소이다
- 다른 곳에서 재사용될 가능성이 없다

### 5-2. `canvas-header` — 헤더 플러그인

**출처**: `Header.tsx` (390줄)

```
features/canvas-header/
├── package.json
├── tsconfig.json
└── src/
    ├── index.tsx          ← CanvasPagePlugin export
    ├── styles/
    │   └── header.module.scss
    └── locales/
        ├── index.ts
        ├── ko.ts
        └── en.ts
```

**슬롯**: `headerComponent`
**기능**: 워크플로우 이름 편집, 저장/불러오기, 사이드패널 토글 버튼(+, 템플릿, 워크플로우), 뒤로 가기
**API**: `@xgen/api-client` → `saveWorkflow`, `checkWorkflowExistence`
**canvas-core에 전달**: `canvasRef`, `workflowName`, `onSave`, `onSidePanelToggle`

### 5-3. `canvas-sidebar-nodes` — 노드 추가 패널

**출처**: `side-menu-panel/AddNodePanel.tsx` + `Helper/DraggableNodeItem.tsx` + `Helper/NodeList.tsx`

```
features/canvas-sidebar-nodes/
├── package.json
├── tsconfig.json
└── src/
    ├── index.tsx
    ├── components/
    │   ├── add-node-panel.tsx
    │   ├── draggable-node-item.tsx
    │   └── node-list.tsx
    ├── styles/
    └── locales/
```

**슬롯**: `sidePanels: [{ id: 'addNodes', ... }]`
**기능**: 카테고리별 노드 목록, 검색, 드래그 앤 드롭으로 캔버스에 추가
**API**: `useNodes()` 훅 (노드 스펙 조회)
**canvas-core에 전달**: `availableNodeSpecs`, `onNodeDrag`

### 5-4. `canvas-sidebar-templates` — 템플릿 패널

**출처**: `side-menu-panel/TemplatePanel.tsx` + `TemplatePreview.tsx` + `MiniCanvas.tsx`

```
features/canvas-sidebar-templates/
├── package.json
├── tsconfig.json
└── src/
    ├── index.tsx
    ├── components/
    │   ├── template-panel.tsx
    │   ├── template-preview.tsx
    │   └── mini-canvas.tsx
    ├── styles/
    └── locales/
```

**슬롯**: `sidePanels: [{ id: 'template', ... }]`
**기능**: 템플릿 목록 조회, 미리보기(MiniCanvas), 워크플로우 불러오기
**API**: `listWorkflows` (필터: 템플릿)

### 5-5. `canvas-sidebar-workflows` — 워크플로우 패널

**출처**: `side-menu-panel/WorkflowPanel.tsx` + 하위 컴포넌트 3개

```
features/canvas-sidebar-workflows/
├── package.json
├── tsconfig.json
└── src/
    ├── index.tsx
    ├── components/
    │   ├── workflow-panel.tsx
    │   ├── workflow-panel-list.tsx
    │   ├── workflow-panel-list-item.tsx
    │   └── workflow-panel-action-buttons.tsx
    ├── styles/
    └── locales/
```

**슬롯**: `sidePanels: [{ id: 'workflow', ... }]`
**기능**: 저장된 워크플로우 목록, 불러오기, 검색
**API**: `listWorkflows`, `loadWorkflow`

### 5-6. `canvas-execution` — 실행 패널

**출처**: `CanvasBottomPanelContent.tsx` (368줄) + `CanvasExecutionLogPanel.tsx` (87줄)
         + `BottomExecutionLogPanel.tsx` (166줄) + `ExecutionPanel.tsx` (173줄)
         + `DetailPanel.tsx` (547줄) + page.tsx의 SSE 실행 로직 (~200줄)

```
features/canvas-execution/
├── package.json
├── tsconfig.json
└── src/
    ├── index.tsx
    ├── components/
    │   ├── bottom-panel-content.tsx
    │   ├── execution-log-panel.tsx
    │   ├── bottom-execution-log.tsx
    │   ├── execution-panel.tsx
    │   └── detail-panel.tsx
    ├── hooks/
    │   └── use-workflow-execution.ts   ← SSE 스트리밍 실행 로직 추출
    ├── styles/
    └── locales/
```

**슬롯**: `bottomPanels: [{ id: 'execution', ... }]`
**기능**: 워크플로우 실행 (SSE 스트리밍), 노드별 실행 로그, 입출력 상세 뷰
**API**: `executeWorkflowByIdStream`, `getWorkflowExecutionLayoutByData`
**canvas-core에 전달**: `canvasRef` (실행 중 노드 상태 반영), `executionOutput`

### 5-7. `canvas-history` — 히스토리 패널

**출처**: `HistoryPanel.tsx` (165줄)

```
features/canvas-history/
├── package.json
├── tsconfig.json
└── src/
    ├── index.tsx
    ├── styles/
    └── locales/
```

**슬롯**: `overlays: [{ id: 'history', ... }]`
**기능**: Undo/Redo 히스토리 목록, 특정 시점 복원, 히스토리 항목 표시
**참고**: Undo/Redo 엔진 자체(`useHistoryManagement`)는 `@xgen/canvas-engine`에 포함.
         이 Feature는 **히스토리를 시각화하는 UI**만 담당한다.

### 5-8. `canvas-ai-generator` — AI 자동생성

**출처**: `AutoWorkflowSidebar.tsx` (507줄)

```
features/canvas-ai-generator/
├── package.json
├── tsconfig.json
└── src/
    ├── index.tsx
    ├── components/
    │   └── auto-workflow-sidebar.tsx
    ├── styles/
    └── locales/
```

**슬롯**: `overlays: [{ id: 'aiGenerator', ... }]`
**기능**: 자연어 → AI 워크플로우 그래프 생성, 모델 선택, 에이전트 노드 브라우저
**API**: `generateWorkflowWithAI`, `getAvailableAgentNodes`
**canvas-core에 전달**: `canvasRef` (생성된 워크플로우 로드)

### 5-9. `canvas-node-detail` — 노드 상세/편집 모달

**출처**: `NodeDetailModal.tsx` (537줄) + `NodeModal.tsx` (97줄)

```
features/canvas-node-detail/
├── package.json
├── tsconfig.json
└── src/
    ├── index.tsx
    ├── components/
    │   ├── node-detail-modal.tsx
    │   └── node-modal.tsx
    ├── styles/
    └── locales/
```

**슬롯**: `modals: [{ id: 'nodeDetail', ... }, { id: 'nodeModal', ... }]`
**기능**: 노드 파라미터 전체 편집 모달, 노드 상세 정보 (입출력/포트/설명/파라미터) 조회
**canvas-core에 전달**: `canvasRef` (파라미터 업데이트)

### 5-10. `canvas-document-drop` — 문서 드롭

**출처**: `CanvasDocumentDropModal.tsx` (307줄)

```
features/canvas-document-drop/
├── package.json
├── tsconfig.json
└── src/
    ├── index.tsx
    ├── components/
    │   └── document-drop-modal.tsx
    ├── styles/
    └── locales/
```

**슬롯**: `modals: [{ id: 'documentDrop', ... }]`
**기능**: 파일 드롭 감지, 2단계 위저드 (컬렉션 선택 → 업로드), RAG 노드 자동 생성
**API**: `uploadDocumentSSE` (RAG API)

### 5-11. Feature 요약 매트릭스

| Feature | 소스 줄수 | 슬롯 | API 의존 | 독립 제거 가능 |
|---------|----------|------|---------|-------------|
| canvas-core | ~800 | 오케스트레이터 | layout, engine | ✗ (필수) |
| canvas-header | ~390 | headerComponent | workflow CRUD | ✓ (이름/저장 없어도 동작) |
| canvas-sidebar-nodes | ~300 | sidePanels | nodeSpecs | ✓ (직접 드롭으로 대체) |
| canvas-sidebar-templates | ~350 | sidePanels | workflow list | ✓ |
| canvas-sidebar-workflows | ~250 | sidePanels | workflow CRUD | ✓ |
| canvas-execution | ~1,400 | bottomPanels | execute SSE | ✓ (편집 전용 사용) |
| canvas-history | ~165 | overlays | 없음 | ✓ (Ctrl+Z로 대체) |
| canvas-ai-generator | ~507 | overlays | AI generation | ✓ |
| canvas-node-detail | ~634 | modals | 없음 | ✓ (인라인 편집 존재) |
| canvas-document-drop | ~307 | modals | RAG upload | ✓ |

---

## 6. 인터페이스 설계 (@xgen/types)

### 6-1. CanvasPagePlugin — 캔버스 플러그인 인터페이스

README §5-3의 원칙: "이 화면에 뭐가 끼워질 수 있는가"를 인터페이스 필드로 정의한다.

```typescript
// packages/types/src/index.ts에 추가

// ── Canvas 플러그인 공통 Props ──

/** 캔버스 코어가 플러그인에 주입하는 공유 context */
export interface CanvasPluginContext {
  canvasRef: React.RefObject<CanvasRef>;
  canvasMode: 'edit' | 'run';
  workflowId: string;
  workflowName: string;
  isExecuting: boolean;
  isSaving: boolean;
}

/** 사이드 패널 설정 */
export interface CanvasSidePanel {
  id: string;
  label: string;
  icon?: React.ComponentType;
  component: React.ComponentType<CanvasSidePanelProps>;
  order?: number;
}

export interface CanvasSidePanelProps extends CanvasPluginContext {
  onClose: () => void;
  onLoadWorkflow?: (data: WorkflowData) => void;
}

/** 하단 패널 설정 */
export interface CanvasBottomPanel {
  id: string;
  label: string;
  component: React.ComponentType<CanvasBottomPanelProps>;
  order?: number;
}

export interface CanvasBottomPanelProps extends CanvasPluginContext {
  isExpanded: boolean;
  onToggleExpand: () => void;
}

/** 오버레이 설정 (사이드바, 패널 등) */
export interface CanvasOverlay {
  id: string;
  component: React.ComponentType<CanvasOverlayProps>;
}

export interface CanvasOverlayProps extends CanvasPluginContext {
  isOpen: boolean;
  onClose: () => void;
}

/** 모달 설정 */
export interface CanvasModal {
  id: string;
  component: React.ComponentType<CanvasModalProps>;
}

export interface CanvasModalProps extends CanvasPluginContext {
  isOpen: boolean;
  data?: unknown;
  onClose: () => void;
}

/** 헤더 컴포넌트 Props */
export interface CanvasHeaderProps extends CanvasPluginContext {
  onSave: () => void;
  onNewWorkflow: () => void;
  onSidePanelToggle: (panelId: string) => void;
  onToggleAI: () => void;
  sidePanels: CanvasSidePanel[];
}

// ── 캔버스 페이지 플러그인 ──

export interface CanvasPagePlugin {
  id: string;
  name: string;

  /** 헤더 컴포넌트 (하나만 등록 가능) */
  headerComponent?: React.ComponentType<CanvasHeaderProps>;

  /** 사이드 패널 목록 */
  sidePanels?: CanvasSidePanel[];

  /** 하단 패널 목록 */
  bottomPanels?: CanvasBottomPanel[];

  /** 오버레이 (사이드바/패널 형태) */
  overlays?: CanvasOverlay[];

  /** 모달 */
  modals?: CanvasModal[];

  /** 드롭 핸들러 (파일 드롭 가로채기) */
  dropHandler?: (event: DragEvent, context: CanvasPluginContext) => boolean;
}
```

### 6-2. FeatureRegistry 확장

```typescript
// packages/types/src/index.ts — FeatureRegistry 클래스에 추가

class FeatureRegistryClass {
  // ... 기존 메서드들 ...

  private canvasPagePlugins: Map<string, CanvasPagePlugin> = new Map();

  registerCanvasPagePlugin(plugin: CanvasPagePlugin): void {
    this.canvasPagePlugins.set(plugin.id, plugin);
  }

  getCanvasPagePlugins(): CanvasPagePlugin[] {
    return Array.from(this.canvasPagePlugins.values());
  }

  getCanvasPagePlugin(id: string): CanvasPagePlugin | undefined {
    return this.canvasPagePlugins.get(id);
  }
}
```

### 6-3. 인터페이스 구현 예시

```typescript
// features/canvas-header/src/index.tsx
import type { CanvasPagePlugin, CanvasHeaderProps } from '@xgen/types';
import { CanvasHeader } from './components/canvas-header';
import './locales';

export const canvasHeaderPlugin: CanvasPagePlugin = {
  id: 'canvas-header',
  name: 'Canvas Header',
  headerComponent: CanvasHeader,
};

export default canvasHeaderPlugin;
```

```typescript
// features/canvas-sidebar-nodes/src/index.tsx
import type { CanvasPagePlugin } from '@xgen/types';
import { AddNodePanel } from './components/add-node-panel';
import './locales';

export const canvasSidebarNodesPlugin: CanvasPagePlugin = {
  id: 'canvas-sidebar-nodes',
  name: 'Node Browser',
  sidePanels: [{
    id: 'addNodes',
    label: 'Add Nodes',
    component: AddNodePanel,
    order: 1,
  }],
};

export default canvasSidebarNodesPlugin;
```

```typescript
// features/canvas-execution/src/index.tsx
import type { CanvasPagePlugin } from '@xgen/types';
import { ExecutionBottomPanel } from './components/bottom-panel-content';
import './locales';

export const canvasExecutionPlugin: CanvasPagePlugin = {
  id: 'canvas-execution',
  name: 'Workflow Execution',
  bottomPanels: [{
    id: 'execution',
    label: 'Execution',
    component: ExecutionBottomPanel,
    order: 1,
  }],
};

export default canvasExecutionPlugin;
```

```typescript
// features/canvas-document-drop/src/index.tsx
import type { CanvasPagePlugin, CanvasPluginContext } from '@xgen/types';
import { DocumentDropModal } from './components/document-drop-modal';
import { isDocumentDropFile } from './utils';
import './locales';

export const canvasDocumentDropPlugin: CanvasPagePlugin = {
  id: 'canvas-document-drop',
  name: 'Document Drop',
  modals: [{
    id: 'documentDrop',
    component: DocumentDropModal,
  }],
  dropHandler: (event, context) => {
    const file = event.dataTransfer?.files?.[0];
    if (file && isDocumentDropFile(file)) {
      // canvas-core가 이 핸들러를 호출하고, true면 기본 드롭 처리를 건너뜀
      return true;
    }
    return false;
  },
};

export default canvasDocumentDropPlugin;
```

---

## 7. 앱 조립 설계 (apps/)

### 7-1. `apps/web/src/canvas-features.ts` — 등록

```typescript
import { FeatureRegistry } from '@xgen/types';

// Canvas Features
import canvasHeader from '@xgen/feature-canvas-header';
import canvasSidebarNodes from '@xgen/feature-canvas-sidebar-nodes';
import canvasSidebarTemplates from '@xgen/feature-canvas-sidebar-templates';
import canvasSidebarWorkflows from '@xgen/feature-canvas-sidebar-workflows';
import canvasExecution from '@xgen/feature-canvas-execution';
import canvasHistory from '@xgen/feature-canvas-history';
import canvasAiGenerator from '@xgen/feature-canvas-ai-generator';
import canvasNodeDetail from '@xgen/feature-canvas-node-detail';
import canvasDocumentDrop from '@xgen/feature-canvas-document-drop';

// 캔버스 플러그인 등록
FeatureRegistry.registerCanvasPagePlugin(canvasHeader);
FeatureRegistry.registerCanvasPagePlugin(canvasSidebarNodes);
FeatureRegistry.registerCanvasPagePlugin(canvasSidebarTemplates);
FeatureRegistry.registerCanvasPagePlugin(canvasSidebarWorkflows);
FeatureRegistry.registerCanvasPagePlugin(canvasExecution);
FeatureRegistry.registerCanvasPagePlugin(canvasHistory);
FeatureRegistry.registerCanvasPagePlugin(canvasAiGenerator);
FeatureRegistry.registerCanvasPagePlugin(canvasNodeDetail);
FeatureRegistry.registerCanvasPagePlugin(canvasDocumentDrop);
```

### 7-2. Feature 토글 예시

```typescript
// AI 자동생성 기능 끄기 → import 한 줄 주석처리
// import canvasAiGenerator from '@xgen/feature-canvas-ai-generator';
// FeatureRegistry.registerCanvasPagePlugin(canvasAiGenerator);

// → AI 사이드바 버튼이 사라지고, 번들에서 제외됨
// → 캔버스 코어는 정상 동작
```

### 7-3. `apps/web/package.json` 의존성 추가

```jsonc
{
  "dependencies": {
    // 패키지
    "@xgen/canvas-types": "workspace:*",
    "@xgen/canvas-layout": "workspace:*",
    "@xgen/canvas-engine": "workspace:*",
    // Features
    "@xgen/feature-canvas-core": "workspace:*",
    "@xgen/feature-canvas-header": "workspace:*",
    "@xgen/feature-canvas-sidebar-nodes": "workspace:*",
    "@xgen/feature-canvas-sidebar-templates": "workspace:*",
    "@xgen/feature-canvas-sidebar-workflows": "workspace:*",
    "@xgen/feature-canvas-execution": "workspace:*",
    "@xgen/feature-canvas-history": "workspace:*",
    "@xgen/feature-canvas-ai-generator": "workspace:*",
    "@xgen/feature-canvas-node-detail": "workspace:*",
    "@xgen/feature-canvas-document-drop": "workspace:*"
  }
}
```

---

## 8. i18n 설계

### 8-1. 네임스페이스 분배

| Feature | 네임스페이스 | 키 예시 |
|---------|------------|--------|
| canvas-core | `canvas` | `canvas.title`, `canvas.emptyState.title` |
| canvas-header | `canvasHeader` | `canvasHeader.save`, `canvasHeader.newWorkflow` |
| canvas-sidebar-nodes | `canvasNodes` | `canvasNodes.search`, `canvasNodes.categories.langchain` |
| canvas-sidebar-templates | `canvasTemplates` | `canvasTemplates.preview`, `canvasTemplates.load` |
| canvas-sidebar-workflows | `canvasWorkflows` | `canvasWorkflows.list`, `canvasWorkflows.load` |
| canvas-execution | `canvasExecution` | `canvasExecution.run`, `canvasExecution.log.title` |
| canvas-history | `canvasHistory` | `canvasHistory.title`, `canvasHistory.restore` |
| canvas-ai-generator | `canvasAI` | `canvasAI.title`, `canvasAI.generate` |
| canvas-node-detail | `canvasNodeDetail` | `canvasNodeDetail.parameters`, `canvasNodeDetail.ports` |
| canvas-document-drop | `canvasDocDrop` | `canvasDocDrop.selectCollection`, `canvasDocDrop.uploading` |

### 8-2. 등록 패턴 (이전 이슈 수정 반영)

```typescript
// features/canvas-header/src/locales/ko.ts
export const ko: TranslationData = {
  canvasHeader: {
    save: '저장',
    saving: '저장 중...',
    newWorkflow: '새 워크플로우',
    // ...
  },
};

// features/canvas-header/src/locales/index.ts
import { registerFeatureTranslations } from '@xgen/i18n';
import { ko } from './ko';
import { en } from './en';

// ⭕ 올바른 패턴: 네임스페이스 하위 객체만 전달 (이중 중첩 방지)
registerFeatureTranslations('canvasHeader', {
  ko: ko.canvasHeader as Record<string, unknown>,
  en: en.canvasHeader as Record<string, unknown>,
});
```

---

## 9. 마이그레이션 순서

### Phase 1: 기반 패키지 구축 (의존성 하위 → 상위 순)

```
순서   패키지/Feature          선행 조건       예상 작업
────   ─────────────         ──────────     ─────────
1-1    @xgen/canvas-types     없음           타입 추출 + export
1-2    @xgen/canvas-layout    canvas-types   레이아웃 알고리즘 추출
1-3    @xgen/types 확장       없음           CanvasPagePlugin 인터페이스
                                            FeatureRegistry.registerCanvasPagePlugin 추가
1-4    @xgen/canvas-engine    canvas-types   Canvas 코어 엔진 전체 이관
                                            12개 훅 + 컴포넌트 + SCSS
```

### Phase 2: Feature 생성 (독립적, 병렬 가능)

```
순서   Feature                  선행 조건           병렬
────   ─────────────           ──────────         ────
2-1    canvas-core              Phase 1 전체        ✗
2-2    canvas-header            canvas-core         ✓
2-3    canvas-sidebar-nodes     canvas-core         ✓
2-4    canvas-sidebar-templates canvas-core         ✓
2-5    canvas-sidebar-workflows canvas-core         ✓
2-6    canvas-execution         canvas-core         ✓
2-7    canvas-history           canvas-core         ✓
2-8    canvas-ai-generator      canvas-core         ✓
2-9    canvas-node-detail       canvas-core         ✓
2-10   canvas-document-drop     canvas-core         ✓
```

### Phase 3: 앱 통합

```
순서   작업                     선행 조건
────   ────────────            ──────────
3-1    canvas-features.ts 작성  Phase 2 전체
3-2    apps/web/package.json 업데이트
3-3    라우팅 연결 (/canvas → canvas-core)
3-4    기존 main-canvas-intro 연동 확인
3-5    E2E 통합 테스트
```

### Phase 4: 정리

```
순서   작업
────   ─────────────
4-1    xgen-frontend canvas 관련 코드 deprecated 표시
4-2    불필요한 SCSS 파일 정리
4-3    타입 정합성 최종 검증
```

---

## 10. 위험 요소 및 대응

### 10-1. 기술적 위험

| 위험 | 영향 | 대응 |
|------|------|------|
| **Canvas ref 패턴 유지** | `useImperativeHandle`로 14개 메서드 노출 — 플러그인이 canvasRef를 통해 엔진과 통신해야 함 | CanvasPluginContext에 `canvasRef`를 포함, 타입 일관성 보장 |
| **sessionStorage 호환** | 기존 workflowStorage가 탭 세션 키에 의존 | `@xgen/canvas-engine`에 포함하되, `tabSessionManager` 패턴 유지 |
| **SCSS 모듈 충돌** | 28+ SCSS 파일이 Feature 간 분산 | 각 Feature가 자체 SCSS 모듈 소유, 글로벌 스타일 없음 |
| **순환 의존** | canvas-core가 플러그인에 context 주입 → 플러그인이 canvasRef 호출 | 단방향: core → plugin (props), plugin → engine (ref). Feature 간 직접 import 없음 |
| **Chrome Extension API** | `xgen:canvas-command` 이벤트 리스너가 page.tsx에 있음 | canvas-core에 유지, 플러그인 불필요 |
| **DeploymentModal 의존** | 기존 `@/app/main/chat-section/`에서 가져옴 | 배포 기능은 canvas-header 또는 별도 플러그인으로 흡수. `DeploymentModal`을 `@xgen/ui`로 이관 검토 |

### 10-2. 아키텍처 판단 기록

| 판단 | 선택 | 근거 |
|------|------|------|
| Canvas 엔진을 Feature로? Package로? | **Package** | 엔진 내부 훅이 서로 밀접 결합, Feature 간 import 금지 규칙 위반 불가피 |
| 컨텍스트 메뉴를 플러그인으로? | **엔진 내부** | 캔버스 상호작용의 필수 구성 요소, 독립 제거 불가 |
| Undo/Redo를 플러그인으로? | **엔진(로직) + 플러그인(UI)** | 로직은 `useHistoryManagement` → 엔진, UI는 `HistoryPanel` → 플러그인 |
| 3개 사이드 패널을 하나로? | **3개 분리** | 각각 독립 API 의존, 개별 토글 필요, 병렬 개발 가능 |
| 실행 관련 컴포넌트를 분리? | **하나의 Feature** | 실행 시작/로그/상세보기가 동일 상태를 공유 |
| EditRunFloating을 플러그인으로? | **canvas-core 내부** | 49줄, 캔버스 모드 전환은 코어 기능 |

### 10-3. canvas-engine 내부 훅 의존 그래프

이 그래프는 왜 엔진을 하나의 패키지로 유지해야 하는지를 보여준다:

```
                    useHistoryManagement (독립)
                    useMemoManagement    (독립)
                    useCanvasView        (독립)
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
    useEdgeManagement  useNodeManagement
         (history)      (history, edges)
              │            │
              ▼            ▼
         useDragState   usePredictedNodes
        (history, nodes)  (nodeSpecs)
              │            │
              ▼            ▼
         useAutoConnect
        (nodes, edges)
              │
    ┌─────────┼──────────┐
    ▼         ▼          ▼
usePortHandlers  useKeyboardHandlers
  (거의 모든 훅)    (거의 모든 훅)
         │
         ▼
useCanvasEventHandlers
    (ALL 상태 + ALL 핸들러)
```

12개 훅 중 9개가 다른 훅의 반환값에 의존한다.
이를 별도 패키지로 분리하면 circular dependency가 발생한다.
→ **하나의 `@xgen/canvas-engine` 패키지로 유지하는 것이 유일한 합리적 선택이다.**

---

## 부록: 파일 매핑 — 원본 → 대상

| 원본 (xgen-frontend) | 대상 (monorepo) |
|----------------------|----------------|
| `canvas/types.ts` | `packages/canvas-types/src/index.ts` |
| `canvas/page.tsx` L75-950 (레이아웃) | `packages/canvas-layout/src/` |
| `canvas/page.tsx` L950-2938 (페이지) | `features/canvas-core/src/index.tsx` |
| `Canvas/index.tsx` + 하위 전체 | `packages/canvas-engine/src/canvas/` |
| `Node/` 전체 | `packages/canvas-engine/src/node/` |
| `Edge.tsx` | `packages/canvas-engine/src/edge/` |
| `special-node/` | `packages/canvas-engine/src/special-node/` |
| 12개 훅 | `packages/canvas-engine/src/hooks/` |
| `Canvas/utils/canvasUtils.ts` | `packages/canvas-engine/src/utils/` |
| `workflowStorage.js` | `packages/canvas-engine/src/utils/` |
| `Header.tsx` | `features/canvas-header/src/` |
| `side-menu-panel/AddNodePanel.tsx` + Helper/ | `features/canvas-sidebar-nodes/src/` |
| `side-menu-panel/TemplatePanel.tsx` + Preview | `features/canvas-sidebar-templates/src/` |
| `side-menu-panel/WorkflowPanel.tsx` + 하위 | `features/canvas-sidebar-workflows/src/` |
| Bottom/Execution/Detail panels + SSE 로직 | `features/canvas-execution/src/` |
| `HistoryPanel.tsx` | `features/canvas-history/src/` |
| `AutoWorkflowSidebar.tsx` | `features/canvas-ai-generator/src/` |
| `NodeDetailModal.tsx` + `NodeModal.tsx` | `features/canvas-node-detail/src/` |
| `CanvasDocumentDropModal.tsx` | `features/canvas-document-drop/src/` |
| `EditRunFloating.tsx` | `features/canvas-core/src/` (내부) |
| `Zoombox.tsx` + `ZoomPercent.tsx` | `features/canvas-core/src/` (내부) |
| `CanvasEmptyState.tsx` | `features/canvas-core/src/` (내부) |
| `CanvasContextMenu.tsx` | `packages/canvas-engine/src/canvas/` (내부) |
| `SideMenu.tsx` | `features/canvas-core/src/` (내부, 패널 스위처) |
| SCSS 28+ 파일 | 각 대상 패키지/Feature의 `styles/` |
| `canvas/constants/nodes.js` | `features/canvas-sidebar-nodes/src/constants/` |
| `canvas/constants/workflow/*.json` | `features/canvas-sidebar-templates/src/constants/` |
| `_common/api/workflow/workflowAPI.js` | API 호출부를 각 Feature에서 `@xgen/api-client` 사용으로 전환 |
| `_common/api/workflow/autoWorkflowAPI.js` | `features/canvas-ai-generator/src/api/` |
| `_common/api/workflow/tracker.js` | `features/canvas-execution/src/api/` |
| `_common/utils/nodeHook.ts` | `features/canvas-sidebar-nodes/src/hooks/` |
