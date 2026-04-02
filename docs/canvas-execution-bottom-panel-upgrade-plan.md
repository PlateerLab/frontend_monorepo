# Canvas 하단 패널(Bottom Panel) 고도화 계획서

> **작성일:** 2025-04-02
> **대상 Feature:** `@xgen/feature-canvas-execution` (`features/canvas-execution/`)
> **원본 코드:** `xgen-frontend/src/app/components/pages/workflow/canvas/components/`
> **관련 Plugin:** `canvasExecutionPlugin` → `CanvasPagePlugin.bottomPanels` 슬롯

---

## 목차

1. [현황 분석](#1-현황-분석)
2. [문제점 및 개선 필요 사항](#2-문제점-및-개선-필요-사항)
3. [고도화 목표](#3-고도화-목표)
4. [아키텍처 설계](#4-아키텍처-설계)
5. [상세 구현 계획](#5-상세-구현-계획)
6. [컴포넌트 분해 설계](#6-컴포넌트-분해-설계)
7. [상태 관리 재설계](#7-상태-관리-재설계)
8. [스타일 시스템 재설계](#8-스타일-시스템-재설계)
9. [신규 기능 사양](#9-신규-기능-사양)
10. [타입 시스템 강화](#10-타입-시스템-강화)
11. [i18n 키 정비](#11-i18n-키-정비)
12. [테스트 전략](#12-테스트-전략)
13. [마이그레이션 단계](#13-마이그레이션-단계)
14. [파일별 작업 매핑](#14-파일별-작업-매핑)
15. [의존성 그래프](#15-의존성-그래프)
16. [위험 요소 및 대응](#16-위험-요소-및-대응)

---

## 1. 현황 분석

### 1.1 기존 컴포넌트 구조 (xgen-frontend)

```
xgen-frontend/src/app/components/pages/workflow/canvas/components/
├── CanvasExecutionLogPanel.tsx      ← 외부 셸 (42px 헤더 + 접힘/펼침)
├── CanvasBottomPanelContent.tsx     ← 내부 콘텐츠 (3컬럼: Execution | Order | Log)
├── BottomExecutionLogPanel.tsx      ← 레거시 2-pane 변형 (Execution + Log)
├── ExecutionPanel.tsx               ← 독립 플로팅 실행 패널 (450px 카드)
└── DetailPanel.tsx                  ← 실행 순서 + 로그 상세

xgen-frontend/src/app/_common/components/
└── LogViewer.tsx                    ← 공유 로그 뷰어 (Show Debug / Show Tools 필터)
```

### 1.2 현재 컴포넌트 계층

```
canvas/page.tsx
└─ CanvasExecutionLogPanel           ← position:absolute, bottom:0, z-index:11
   ├─ .bar (42px 헤더)
   │   ├─ .execution ("Execution" 라벨, 500px 고정)
   │   └─ .logArea ("로그" 라벨 + Clear/Fullscreen/Expand 버튼)
   └─ CanvasBottomPanelContent       ← flex row, 3컬럼
       ├─ .colExecution (500px 고정)
       │   ├─ Tab bar: "Chat" | "Executor"
       │   ├─ Chat 탭: 채팅 버블 + 입력바 → onExecuteWithInput(text)
       │   └─ Executor 탭: 버튼 실행 결과 표시
       ├─ .colOrder (252px 고정)
       │   └─ 실행 순서 트리 (병렬 그룹 지원)
       └─ .colLog (flex:1)
           └─ LogViewer (Show Debug / Show Tools 필터)
```

### 1.3 모노레포 이전 상태 (현재)

```
features/canvas-execution/
├── package.json                     ← @xgen/feature-canvas-execution
├── tsconfig.json
└── src/
    ├── index.tsx                    ← canvasExecutionPlugin 등록
    ├── types.ts                     ← 타입 정의 (인터페이스, 타입 가드)
    ├── components/
    │   ├── CanvasExecutionLogPanel.tsx    ← 이전 완료 (이모지 아이콘 임시 사용)
    │   ├── CanvasBottomPanelContent.tsx   ← 이전 완료 (API 의존성 주입 패턴 적용)
    │   ├── BottomExecutionLogPanel.tsx    ← 이전 완료 (레거시 호환)
    │   ├── DetailPanel.tsx               ← 이전 완료
    │   └── ExecutionPanel.tsx            ← 이전 완료
    ├── locales/
    │   ├── index.ts
    │   ├── ko.ts
    │   └── en.ts
    └── styles/
        ├── canvas-execution-log-panel.module.scss
        ├── canvas-bottom-panel-content.module.scss
        ├── bottom-execution-log-panel.module.scss
        ├── detail-panel.module.scss
        └── execution-panel.module.scss
```

### 1.4 사용처

| 페이지 | 사용 구성 |
|--------|-----------|
| `canvas/page.tsx` (메인 캔버스 에디터) | `CanvasExecutionLogPanel` + `CanvasBottomPanelContent` |
| `publish/component/workflow/page.tsx` (배포 미리보기) | 동일 구성 (`mockExecutionOrder` 사용) |

### 1.5 현재 상태 관리

모든 상태가 `canvas/page.tsx`에서 `useState`로 관리:

```typescript
const [bottomPanelExpanded, setBottomPanelExpanded] = useState(false);
const [executionOutput, setExecutionOutput] = useState<ExecutionOutput>(null);
const [executionLogs, setExecutionLogs] = useState<any[]>([]);
const [isExecuting, setIsExecuting] = useState(false);
const [executionSource, setExecutionSource] = useState<'button' | 'chat' | null>(null);
```

---

## 2. 문제점 및 개선 필요 사항

### 2.1 구조적 문제

| # | 문제 | 심각도 | 설명 |
|---|------|--------|------|
| S-1 | **레거시 컴포넌트 중복** | 🔴 높음 | `BottomExecutionLogPanel`(2-pane)과 `CanvasExecutionLogPanel`+`CanvasBottomPanelContent`(3-컬럼)이 동일 역할을 중복 수행. 어떤 것이 정식인지 불명확 |
| S-2 | **컬럼 너비 하드코딩** | 🟡 중간 | Execution 500px, Order 252px 고정 → 반응형 불가, 좁은 화면에서 깨짐 |
| S-3 | **높이 하드코딩** | 🟡 중간 | 접힌 상태 42px, 펼친 상태 300px 고정 → 사용자 커스텀 불가 |
| S-4 | **플로팅 패널과 하단 패널 이중 존재** | 🟡 중간 | `ExecutionPanel`(플로팅 카드)과 `CanvasBottomPanelContent`의 Executor 탭이 동일 기능 |
| S-5 | **아이콘 임시 처리** | 🟢 낮음 | 모노레포 버전에서 이모지(🗑, ⛶, ▲▼) 사용 → `@xgen/icons` 연동 필요 |

### 2.2 상태 관리 문제

| # | 문제 | 심각도 | 설명 |
|---|------|--------|------|
| ST-1 | **page.tsx에 상태 집중** | 🔴 높음 | 캔버스 page.tsx가 하단 패널 관련 상태까지 모두 관리 → 800줄+ 거대 컴포넌트 |
| ST-2 | **Chat 상태 비영속** | 🟡 중간 | 페이지 이동/새로고침 시 채팅 기록 소실 |
| ST-3 | **실행 소스 분기 복잡** | 🟡 중간 | `executionSource`에 따른 Chat/Executor 분기가 `useEffect` 체인으로 구현 → 추적 어려움 |
| ST-4 | **로그 타입 미정의** | 🟡 중간 | `logs: any[]` → 런타임 에러 가능, 자동완성 불가 |

### 2.3 UX 문제

| # | 문제 | 심각도 | 설명 |
|---|------|--------|------|
| U-1 | **리사이즈 불가** | 🔴 높음 | 패널 높이를 드래그로 조절 불가 (42px / 300px 이진 토글만 가능) |
| U-2 | **전체화면 미구현** | 🟡 중간 | 전체화면 버튼은 존재하나 `onFullscreen` prop이 optional이고 대부분 미전달 |
| U-3 | **실행 순서 시각화 제한** | 🟡 중간 | 텍스트 리스트로만 표시. 실행 중 강조, 완료/실패 상태 미반영 |
| U-4 | **로그 검색 불가** | 🟡 중간 | 로그 양 많을 때 특정 로그를 찾기 어려움 |
| U-5 | **키보드 단축키 부재** | 🟢 낮음 | 패널 토글, 탭 전환 등 키보드 조작 불가 |

### 2.4 성능 문제

| # | 문제 | 심각도 | 설명 |
|---|------|--------|------|
| P-1 | **실행 순서 API 과다 호출** | 🟡 중간 | 디바운스 300ms이나 그래프 구조 변경 시마다 API 호출 |
| P-2 | **로그 무한 누적** | 🟡 중간 | 장시간 실행 시 로그가 무한 누적되어 메모리 증가 |
| P-3 | **채팅 메시지 전체 리렌더** | 🟢 낮음 | 스트리밍 응답 시 전체 메시지 배열이 매번 리렌더 |

---

## 3. 고도화 목표

### 3.1 핵심 목표 (Must-Have)

| 목표 | 설명 | 관련 문제 |
|------|------|-----------|
| **컴포넌트 정리 및 단일화** | 레거시 중복 제거, 단일 진입점 확립 | S-1, S-4 |
| **리사이즈 가능 패널** | 드래그 핸들로 패널 높이 조절 | U-1 |
| **상태 분리** | Feature 내부 Context/Store로 상태 캡슐화 | ST-1 |
| **타입 안전성 강화** | `any` 제거, 로그/실행 결과 타입 완전 정의 | ST-4 |
| **아이콘 정규화** | `@xgen/icons`에서 아이콘 import | S-5 |

### 3.2 부가 목표 (Should-Have)

| 목표 | 설명 | 관련 문제 |
|------|------|-----------|
| **전체화면 모드 구현** | 하단 패널을 전체 화면으로 확장 | U-2 |
| **실행 순서 실시간 상태 표시** | 실행 중/완료/실패 노드 시각 강조 | U-3 |
| **로그 검색 및 필터** | 텍스트 검색, 레벨/노드별 필터 | U-4 |
| **채팅 기록 영속** | sessionStorage 기반 채팅 기록 유지 | ST-2 |

### 3.3 선택적 목표 (Nice-to-Have)

| 목표 | 설명 | 관련 문제 |
|------|------|-----------|
| **키보드 단축키** | `Cmd+J` 패널 토글, `Cmd+1/2/3` 탭 전환 | U-5 |
| **로그 가상 스크롤** | 대량 로그에서 성능 보장 | P-2 |
| **실행 순서 그래프 시각화** | 텍스트 → 미니 DAG 시각화 | U-3 확장 |

---

## 4. 아키텍처 설계

### 4.1 계층 원칙 준수

모노레포 3계층 원칙에 따라 하단 패널 기능을 설계:

```
apps/web/                          ← 조립만, 로직 없음
├── src/components/CanvasPage.tsx  ← <BottomPanel /> 배치 + props 전달
│
features/canvas-execution/         ← 완성된 기능 단위 (자체 상태)
├── src/
│   ├── index.tsx                  ← Plugin 등록 + 공개 API
│   ├── context/                   ← 내부 상태 관리
│   ├── components/                ← UI 컴포넌트
│   ├── hooks/                     ← 로직 커스텀 훅
│   ├── types.ts                   ← 공개 타입
│   ├── locales/                   ← 다국어
│   └── styles/                    ← SCSS 모듈
│
packages/ (사용하는 것만)
├── @xgen/ui                       ← ResizablePanel, Button 등
├── @xgen/icons                    ← 아이콘
├── @xgen/i18n                     ← 다국어 인프라
├── @xgen/api-client               ← API 호출
├── @xgen/canvas-types             ← 캔버스 도메인 타입
└── @xgen/types                    ← CanvasPagePlugin 인터페이스
```

### 4.2 의존성 방향

```
apps/web ──→ features/canvas-execution ──→ packages/*
              │
              │  (금지: Feature ──→ Feature)
              │  (금지: Package ──→ Feature)
              └─ @xgen/types, @xgen/ui, @xgen/icons, @xgen/i18n,
                 @xgen/api-client, @xgen/canvas-types
```

### 4.3 Plugin 인터페이스

```typescript
// @xgen/types의 CanvasPagePlugin
export interface CanvasPagePlugin {
  id: string;
  name: string;
  bottomPanels?: Array<{
    id: string;
    component: React.ComponentType<any>;
    priority?: number;    // 신규: 패널 표시 순서
  }>;
  // ... headerComponent, sidePanels, overlays, modals
}
```

---

## 5. 상세 구현 계획

### Phase 1: 구조 정리 및 컴포넌트 단일화

**목표:** 레거시 컴포넌트 정리, 명확한 컴포넌트 트리 확립

#### 5.1.1 삭제 대상

| 파일 | 사유 |
|------|------|
| `BottomExecutionLogPanel.tsx` | 레거시 2-pane. `CanvasExecutionLogPanel` + `CanvasBottomPanelContent`로 완전 대체 |
| `bottom-execution-log-panel.module.scss` | 위 컴포넌트의 스타일 |
| `ExecutionPanel.tsx` | 플로팅 실행 패널. 하단 패널 Executor 탭으로 통합 |
| `execution-panel.module.scss` | 위 컴포넌트의 스타일 |
| `DetailPanel.tsx` | `CanvasBottomPanelContent`에 기능 통합 완료 |
| `detail-panel.module.scss` | 위 컴포넌트의 스타일 |

#### 5.1.2 잔존 + 신규 컴포넌트

| 컴포넌트 | 역할 | 상태 |
|----------|------|------|
| `BottomPanel.tsx` | 최상위 컨테이너 (리사이즈 핸들 + 헤더 + 콘텐츠 슬롯) | **신규** |
| `BottomPanelHeader.tsx` | 42px 헤더바 (탭 라벨, 액션 버튼) | **리팩터** (← CanvasExecutionLogPanel) |
| `BottomPanelContent.tsx` | 3컬럼 콘텐츠 (오케스트레이터) | **리팩터** (← CanvasBottomPanelContent) |
| `ExecutionColumn.tsx` | 좌측 컬럼: Chat/Executor 탭 | **신규** (분리) |
| `ChatTab.tsx` | Chat 탭 내용 (메시지 리스트 + 입력바) | **신규** (분리) |
| `ExecutorTab.tsx` | Executor 탭 내용 (버튼 실행 결과) | **신규** (분리) |
| `ExecutionOrderColumn.tsx` | 중간 컬럼: 실행 순서 시각화 | **신규** (분리) |
| `LogColumn.tsx` | 우측 컬럼: 로그 뷰어 래퍼 | **신규** (분리) |

### Phase 2: 리사이즈 시스템 구현

**목표:** 드래그 핸들로 패널 높이를 자유롭게 조절

#### 5.2.1 ResizeHandle 컴포넌트

```typescript
// features/canvas-execution/src/components/ResizeHandle.tsx

interface ResizeHandleProps {
  onResizeStart: () => void;
  onResize: (deltaY: number) => void;
  onResizeEnd: () => void;
}
```

#### 5.2.2 높이 제약 조건

| 상태 | 높이 | 설명 |
|------|------|------|
| 접힘 (collapsed) | 42px | 헤더만 표시 |
| 최소 펼침 | 150px | 의미 있는 콘텐츠 표시 최소 높이 |
| 기본 펼침 | 300px | 현재 기본값 유지 |
| 최대 펼침 | 60vh | 캔버스 영역 최소 보장 |
| 전체화면 | 100vh - 헤더 | 캔버스 완전 가림 |

#### 5.2.3 높이 기억

`localStorage` 키 `xgen:bottomPanel:height`에 사용자가 마지막으로 설정한 높이를 저장.

### Phase 3: 상태 관리 재설계

> 상세 내용은 [7장 상태 관리 재설계](#7-상태-관리-재설계) 참조

### Phase 4: 실행 순서 시각화 고도화

> 상세 내용은 [9장 신규 기능 사양](#9-신규-기능-사양) 참조

### Phase 5: 로그 시스템 강화

> 상세 내용은 [9장 신규 기능 사양](#9-신규-기능-사양) 참조

---

## 6. 컴포넌트 분해 설계

### 6.1 최종 컴포넌트 트리

```
CanvasPage.tsx (apps/web)
│
└─ <BottomPanelProvider>                              ← Context Provider
   └─ <BottomPanel>                                   ← 최상위 컨테이너
      ├─ <ResizeHandle />                             ← 드래그 리사이즈
      ├─ <BottomPanelHeader>                          ← 42px 헤더
      │   ├─ <TabList>                                ← "Execution" | "로그" (탭 라벨)
      │   └─ <HeaderActions>                          ← Clear | Fullscreen | Expand
      │       ├─ <IconButton icon="trash" />          ← @xgen/icons
      │       ├─ <IconButton icon="fullscreen" />
      │       └─ <IconButton icon="chevron" />
      └─ <BottomPanelContent>                         ← 3컬럼 콘텐츠
          ├─ <ExecutionColumn>                        ← 좌측 500px
          │   ├─ <ExecutionTabBar>                    ← "Chat" | "Executor"
          │   ├─ <ChatTab>                            ← Chat 탭
          │   │   ├─ <ChatMessageList>                ← 메시지 리스트
          │   │   │   └─ <ChatBubble />               ← 개별 메시지 (memo)
          │   │   └─ <ChatInputBar>                   ← textarea + send 버튼
          │   └─ <ExecutorTab>                        ← Executor 탭
          │       └─ <ExecutionResult />              ← 실행 결과 렌더러
          ├─ <ExecutionOrderColumn>                   ← 중간 252px
          │   ├─ <ExecutionOrderHeader>               ← 컬럼 제목
          │   └─ <ExecutionOrderList>                 ← 실행 순서 리스트
          │       └─ <ExecutionOrderItem />           ← 개별 노드 (상태 표시)
          └─ <LogColumn>                              ← 우측 flex:1
              ├─ <LogToolbar>                         ← 검색 + 필터
              │   ├─ <LogSearch />                    ← 텍스트 검색
              │   └─ <LogFilters>                     ← Show Debug / Show Tools
              └─ <LogViewerComponent />               ← 주입된 LogViewer
```

### 6.2 각 컴포넌트 책임

#### BottomPanel (신규)

```typescript
interface BottomPanelProps {
  children: React.ReactNode;
}
```

- 패널의 전체 레이아웃 (absolute positioning, z-index)
- 리사이즈 핸들 통합
- 접힘/펼침/전체화면 상태에 따른 높이 제어
- `BottomPanelContext`에서 상태 소비

#### BottomPanelHeader (리팩터 ← CanvasExecutionLogPanel)

```typescript
interface BottomPanelHeaderProps {
  // Context에서 상태를 직접 읽음 → props 최소화
}
```

- 42px 고정 높이 헤더
- "Execution" / "로그" 라벨
- Clear, Fullscreen, Expand/Collapse 버튼
- `@xgen/icons`에서 아이콘 직접 import

#### ExecutionColumn (신규 분리)

- Chat/Executor 탭 전환
- 컬럼 너비: 기본 500px, 최소 350px (반응형 대응)

#### ChatTab (신규 분리)

```typescript
interface ChatTabProps {
  messages: ChatMessage[];
  input: string;
  isExecuting: boolean;
  onSend: (text: string) => void;
  onInputChange: (text: string) => void;
}
```

- 채팅 메시지 렌더링 (가상화 고려)
- 자동 스크롤
- 입력 바 (textarea + Send 버튼)
- 스트리밍 타이핑 인디케이터

#### ExecutorTab (신규 분리)

```typescript
interface ExecutorTabProps {
  resultText: string;
  isExecuting: boolean;
}
```

- 버튼 실행 결과 텍스트 표시
- 로딩 인디케이터

#### ExecutionOrderColumn (신규 분리)

```typescript
interface ExecutionOrderColumnProps {
  groups: ExecutionGroup[];
  activeNodeId?: string;        // 현재 실행 중인 노드
  completedNodeIds: Set<string>; // 실행 완료 노드
  failedNodeIds: Set<string>;    // 실행 실패 노드
  isLoading: boolean;
}
```

- 실행 순서 리스트 표시
- 병렬 그룹 시각화
- 실행 상태별 색상/아이콘 표시 (신규)
- bypass 노드 필터링

#### LogColumn (신규 분리)

```typescript
interface LogColumnProps {
  logs: LogEntry[];
  onClearLogs?: () => void;
  LogViewerComponent?: React.ComponentType<LogViewerProps>;
}
```

- 로그 뷰어 래퍼
- 로그 검색 바 (신규)
- 필터 체크박스 (Show Debug / Show Tools)

---

## 7. 상태 관리 재설계

### 7.1 Context 기반 설계

`page.tsx`에서 밀어넣던 상태를 Feature 내부 Context로 캡슐화:

```typescript
// features/canvas-execution/src/context/BottomPanelContext.tsx

interface BottomPanelState {
  // 패널 상태
  panelMode: 'collapsed' | 'expanded' | 'fullscreen';
  panelHeight: number;           // px, 펼침 시 높이

  // 실행 상태
  executionOutput: ExecutionOutput;
  executionSource: 'button' | 'chat' | null;
  isExecuting: boolean;

  // 채팅 상태
  chatMessages: ChatMessage[];
  chatInput: string;

  // Executor 상태
  buttonResultText: string;

  // 실행 순서
  executionOrder: ExecutionOrderData | null;
  isLoadingOrder: boolean;

  // 로그
  logs: LogEntry[];

  // 탭 상태
  activeExecutionTab: 'chat' | 'executor';
}

interface BottomPanelActions {
  // 패널 제어
  togglePanel: () => void;
  setFullscreen: (enabled: boolean) => void;
  setPanelHeight: (height: number) => void;

  // 실행 제어
  executeWithInput: (text?: string) => Promise<void>;
  clearOutput: () => void;
  clearLogs: () => void;

  // 채팅 제어
  sendChatMessage: (text: string) => void;
  setChatInput: (text: string) => void;

  // 탭 제어
  setActiveExecutionTab: (tab: 'chat' | 'executor') => void;
}

type BottomPanelContextValue = BottomPanelState & BottomPanelActions;
```

### 7.2 Provider 구현 전략

```typescript
// features/canvas-execution/src/context/BottomPanelProvider.tsx

interface BottomPanelProviderProps {
  // 외부에서 주입되는 콜백 (캔버스 페이지 ↔ 하단 패널 연동)
  onExecute: (inputText?: string) => Promise<void>;

  // 외부에서 주입되는 데이터
  workflowId: string;
  workflowName: string;
  userId?: string | null;
  canvasState?: any;

  // 외부에서 주입되는 컴포넌트 (DI)
  LogViewerComponent?: React.ComponentType<LogViewerProps>;

  // API 주입 (테스트 용이성)
  fetchExecutionOrderByData?: (data: any) => Promise<any>;

  children: React.ReactNode;
}
```

**설계 원칙:**
- `onExecute`만 외부에서 주입 (캔버스 실행 로직은 canvas-engine 영역)
- 나머지 상태는 Context 내부에서 자체 관리
- API 호출은 `@xgen/api-client`를 통해 직접 수행하되, 테스트를 위해 주입 가능

### 7.3 page.tsx 변경 (Before → After)

**Before (현재):**
```typescript
// canvas/page.tsx — 약 30줄의 하단 패널 관련 상태/핸들러
const [bottomPanelExpanded, setBottomPanelExpanded] = useState(false);
const [executionOutput, setExecutionOutput] = useState(null);
const [executionLogs, setExecutionLogs] = useState([]);
const [isExecuting, setIsExecuting] = useState(false);
const [executionSource, setExecutionSource] = useState(null);

// ... 10+ 줄의 핸들러 코드

<CanvasExecutionLogPanel
  expanded={bottomPanelExpanded}
  onToggleExpand={() => setBottomPanelExpanded(p => !p)}
  onClearLogs={() => setExecutionLogs([])}
>
  <CanvasBottomPanelContent
    output={executionOutput}
    logs={executionLogs}
    workflowName={...}
    workflowId={...}
    userId={...}
    canvasState={...}
    isExecuting={isExecuting}
    executionSource={executionSource}
    onExecuteWithInput={handleExecuteWithInput}
    onClearLogs={() => setExecutionLogs([])}
  />
</CanvasExecutionLogPanel>
```

**After (목표):**
```typescript
// canvas/page.tsx — 3줄
<BottomPanelProvider
  onExecute={handleExecute}
  workflowId={workflowId}
  workflowName={workflowName}
  canvasState={canvasState}
>
  <BottomPanel />
</BottomPanelProvider>
```

### 7.4 채팅 기록 영속 전략

```typescript
// features/canvas-execution/src/hooks/useChatPersistence.ts

const STORAGE_KEY_PREFIX = 'xgen:chat:';

function useChatPersistence(workflowId: string) {
  // sessionStorage 사용 (브라우저 탭 닫기 전까지 유지)
  // 키: xgen:chat:{workflowId}
  // 값: JSON.stringify(ChatMessage[])
  // 최대 50개 메시지 유지 (초과 시 오래된 것 제거)
}
```

---

## 8. 스타일 시스템 재설계

### 8.1 디자인 토큰 적용

현재 하드코딩된 색상 값을 `@xgen/ui`의 디자인 토큰으로 교체:

| 현재 값 | 디자인 토큰 | 용도 |
|---------|------------|------|
| `#ffffff` | `$bg-primary` | 패널 배경 |
| `#f7f8fa` | `$figma-gray-50` | 실행 순서 컬럼 배경 |
| `#fafbfc` | `$figma-gray-50` | 탭바/입력바 배경 |
| `#1d1f23` | `$figma-gray-800` | 헤더 라벨 |
| `#40444d` | `$figma-gray-700` | 본문 텍스트 |
| `#7a7f89` | `$figma-gray-500` | placeholder |
| `#9ca3af` | `$figma-gray-400` 근사 | 비활성 탭 텍스트 |
| `#2563eb` | `$figma-primary-start` 근사 | 활성 탭, Chat 버블 |
| `rgba(0,0,0,0.08)` | `$figma-gray-200` 근사 | 구분선 |
| `12px` | `$font-size-xs` | 본문 폰트 |
| `700` | `$font-weight-bold` | 라벨 폰트 |

### 8.2 SCSS 모듈 재구성

```
styles/
├── _variables.scss               ← Feature 내부 변수 (토큰 import + 패널 전용 변수)
├── bottom-panel.module.scss      ← BottomPanel 컨테이너
├── bottom-panel-header.module.scss  ← 헤더
├── execution-column.module.scss  ← 좌측 컬럼
├── chat-tab.module.scss          ← Chat 탭
├── executor-tab.module.scss      ← Executor 탭
├── execution-order.module.scss   ← 중간 컬럼
├── log-column.module.scss        ← 우측 컬럼
└── resize-handle.module.scss     ← 리사이즈 핸들
```

### 8.3 반응형 대응

```scss
// styles/_variables.scss

// 패널 높이 제약
$panel-header-height: 42px;
$panel-min-height: 150px;
$panel-default-height: 300px;
$panel-max-height: 60vh;

// 컬럼 너비
$col-execution-width: 500px;
$col-execution-min-width: 350px;
$col-order-width: 252px;
$col-order-min-width: 180px;

// 브레이크포인트: 전체 너비 < 900px 시 2컬럼 레이아웃
$breakpoint-compact: 900px;
```

```scss
// bottom-panel-content.module.scss

.content {
  display: flex;

  @media (max-width: $breakpoint-compact) {
    // 실행 순서 컬럼 숨김, Order 정보를 Execution 컬럼 하단에 축소 표시
    .colOrder { display: none; }
    .colExecution { flex: 0 0 50%; }
    .colLog { flex: 1; }
  }
}
```

---

## 9. 신규 기능 사양

### 9.1 리사이즈 패널

#### 동작 사양

| 인터랙션 | 동작 |
|----------|------|
| 헤더 바 상단 가장자리에 마우스 오버 | 커서 `ns-resize`로 변경 |
| 드래그 시작 | 패널 높이 실시간 변경, 캔버스 영역 동적 조정 |
| 드래그 중 최소 높이 미만 도달 | `collapsed` 상태로 스냅 |
| 드래그 중 최대 높이 초과 | 최대값에서 멈춤 |
| 드래그 종료 | `localStorage`에 높이 저장 |
| 헤더 더블클릭 | `collapsed ↔ expanded` 토글 |

#### 구현

```typescript
// features/canvas-execution/src/hooks/useResizePanel.ts

interface UseResizePanelOptions {
  minHeight: number;
  maxHeight: number;
  defaultHeight: number;
  storageKey: string;
  onCollapse: () => void;
}

interface UseResizePanelReturn {
  height: number;
  isResizing: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
}
```

### 9.2 전체화면 모드

#### 동작 사양

| 상태 | 레이아웃 |
|------|----------|
| 진입 | 패널이 `calc(100vh - 캔버스 헤더 높이)`까지 확장 |
| 내부 | 3컬럼 레이아웃 유지, 각 컬럼이 더 넓어짐 |
| 탈출 | ESC 키 또는 전체화면 버튼 재클릭 → 이전 높이 복원 |

### 9.3 실행 순서 실시간 상태 표시

#### 노드 상태 정의

```typescript
type ExecutionNodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'bypassed';
```

| 상태 | 시각 표현 |
|------|-----------|
| `pending` | 기본 텍스트 색상, 번호만 |
| `running` | 파란색 하이라이트 + 펄스 애니메이션 |
| `completed` | 초록색 체크 아이콘 |
| `failed` | 빨간색 X 아이콘 |
| `bypassed` | 회색 취소선 |

#### 데이터 흐름

```
WebSocket / SSE 실행 이벤트
  → CanvasPage에서 수신
  → BottomPanelProvider로 전달 (setNodeStatus)
  → ExecutionOrderColumn에서 렌더링
```

### 9.4 로그 검색 시스템

#### 기능 사양

| 기능 | 설명 |
|------|------|
| 텍스트 검색 | 로그 메시지 내 키워드 검색, 매치 하이라이트 |
| 레벨 필터 | INFO / WARNING / ERROR / DEBUG 체크박스 |
| 노드 필터 | 특정 노드의 로그만 표시 |
| 타임스탬프 범위 | 시작-종료 시간 범위 필터 |
| 자동 스크롤 토글 | 신규 로그 수신 시 자동 스크롤 ON/OFF |

### 9.5 키보드 단축키

| 단축키 | 동작 |
|--------|------|
| `Cmd/Ctrl + J` | 패널 접힘/펼침 토글 |
| `Cmd/Ctrl + Shift + J` | 전체화면 토글 |
| `Cmd/Ctrl + 1` | Chat 탭 활성화 |
| `Cmd/Ctrl + 2` | Executor 탭 활성화 |
| `Escape` | 전체화면 → 일반 / 일반 → 접힘 |

---

## 10. 타입 시스템 강화

### 10.1 기존 타입 유지 (변경 없음)

```typescript
// 이 타입들은 이미 잘 정의되어 있으므로 그대로 유지
export type ExecutionOutput = ExecutionError | ExecutionSuccess | ExecutionStream | null;
export interface ExecutionError { error: string; }
export interface ExecutionSuccess { outputs: Record<string, any>; }
export interface ExecutionStream { stream: string; }

// 타입 가드도 유지
export const hasError = (o: ExecutionOutput): o is ExecutionError => ...;
export const hasOutputs = (o: ExecutionOutput): o is ExecutionSuccess => ...;
export const isStreamingOutput = (o: ExecutionOutput): o is ExecutionStream => ...;
```

### 10.2 신규 타입 정의

```typescript
// features/canvas-execution/src/types.ts — 추가

// ── 로그 엔트리 (any[] 제거) ─────────────────────────────────
export type LogEventType = 'tool_call' | 'tool_result' | 'tool_error';
export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';

export interface LogEntry {
  level: LogLevel;
  timestamp: string;
  node_id?: string;
  node_name?: string;
  message: string;
  event_type?: LogEventType;
  tool_name?: string;
  tool_input?: string;
  result?: string;
  result_length?: number;
  citations?: string | any[];
  error?: string;
}

// ── 채팅 메시지 ──────────────────────────────────────────────
export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// ── 실행 순서 ────────────────────────────────────────────────
export interface ExecutionOrderData {
  parallel_execution_order?: string[][];
  execution_order?: string[];
  nodes?: Record<string, { data?: { nodeName?: string } }>;
}

export type ExecutionGroup = string[];

export type ExecutionNodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'bypassed';

export interface ExecutionNodeState {
  nodeId: string;
  status: ExecutionNodeStatus;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

// ── 패널 모드 ────────────────────────────────────────────────
export type PanelMode = 'collapsed' | 'expanded' | 'fullscreen';

// ── 로그 뷰어 Props (DI 인터페이스) ─────────────────────────
export interface LogViewerProps {
  logs: LogEntry[];
  onClearLogs?: () => void;
  className?: string;
}
```

### 10.3 공개 Props 인터페이스 (최종)

```typescript
// Plugin에서 노출하는 최상위 Props
export interface BottomPanelProps {
  // 캔버스 연동 (외부 주입)
  onExecute: (inputText?: string) => Promise<void>;
  workflowId: string;
  workflowName: string;
  userId?: string | null;
  canvasState?: CanvasState;

  // 실행 결과 (외부 → 내부)
  executionOutput: ExecutionOutput;
  executionLogs: LogEntry[];
  isExecuting: boolean;
  executionSource: 'button' | 'chat' | null;

  // 실행 순서 노드 상태 (실시간)
  nodeStates?: Map<string, ExecutionNodeState>;

  // DI: API 함수
  fetchExecutionOrderByData?: (data: any) => Promise<ExecutionOrderData>;

  // DI: 외부 컴포넌트
  LogViewerComponent?: React.ComponentType<LogViewerProps>;

  // 미리보기 모드
  mockExecutionOrder?: ExecutionOrderData | null;
}
```

---

## 11. i18n 키 정비

### 11.1 현재 키 구조

```
canvas.bottom.execution
canvas.bottom.log
canvas.bottom.clear
canvas.bottom.fullscreen
canvas.bottom.expand
canvas.bottom.collapse
canvas.executionPanel.title
canvas.executionPanel.placeholder
canvas.executionPanel.tabChat
canvas.executionPanel.tabExecutor
canvas.executionPanel.chatPlaceholder
canvas.executionPanel.chatInputPlaceholder
canvas.executionPanel.send
canvas.executionPanel.clearOutput
canvas.executionPanel.copyOutput
canvas.executionPanel.copied
canvas.executionPanel.saveAndRun
canvas.executionPanel.executionFailed
canvas.executionPanel.unexpectedFormat
canvas.detailPanel.log
canvas.detailPanel.noExecutionOrderData
canvas.logViewer.toolCall
canvas.logViewer.toolResult
canvas.logViewer.inputLabel
canvas.logViewer.resultLengthChars
```

### 11.2 정리된 키 구조 (신규)

```
canvas.bottomPanel.execution          ← 헤더 "Execution" 라벨
canvas.bottomPanel.log                ← 헤더 "로그" 라벨
canvas.bottomPanel.clear              ← Clear 버튼 tooltip
canvas.bottomPanel.fullscreen         ← Fullscreen 버튼 tooltip
canvas.bottomPanel.expand             ← Expand 버튼 tooltip
canvas.bottomPanel.collapse           ← Collapse 버튼 tooltip
canvas.bottomPanel.resizeHint         ← (신규) "드래그하여 높이 조절"

canvas.bottomPanel.chat.title         ← Chat 탭 라벨
canvas.bottomPanel.chat.placeholder   ← 빈 채팅 안내
canvas.bottomPanel.chat.inputHint     ← 입력 placeholder
canvas.bottomPanel.chat.send          ← Send 버튼

canvas.bottomPanel.executor.title     ← Executor 탭 라벨
canvas.bottomPanel.executor.placeholder ← 빈 결과 안내
canvas.bottomPanel.executor.running   ← (신규) 실행 중 메시지

canvas.bottomPanel.order.title        ← (신규) "Execution Order" 컬럼 제목
canvas.bottomPanel.order.empty        ← 순서 데이터 없음
canvas.bottomPanel.order.loading      ← 로딩 중
canvas.bottomPanel.order.running      ← (신규) "실행 중"
canvas.bottomPanel.order.completed    ← (신규) "완료"
canvas.bottomPanel.order.failed       ← (신규) "실패"
canvas.bottomPanel.order.bypassed     ← (신규) "바이패스"

canvas.bottomPanel.logViewer.search   ← (신규) "로그 검색"
canvas.bottomPanel.logViewer.noMatch  ← (신규) "검색 결과 없음"
canvas.bottomPanel.logViewer.autoScroll ← (신규) "자동 스크롤"
```

---

## 12. 테스트 전략

### 12.1 단위 테스트

| 대상 | 테스트 내용 | 도구 |
|------|------------|------|
| 타입 가드 (`hasError`, `hasOutputs`, `isStreamingOutput`) | 각 타입에 대한 정확한 판별 | Vitest |
| `useResizePanel` 훅 | 드래그 이벤트 시뮬레이션, 높이 제약 검증 | Vitest + @testing-library/react |
| `useChatPersistence` 훅 | sessionStorage 읽기/쓰기, 최대 메시지 제한 | Vitest |
| `getGraphStructureSignature` | 동일 구조 = 동일 시그니처 보장 | Vitest |
| `getExecutionGroups` | parallel/sequential 정규화 | Vitest |

### 12.2 컴포넌트 테스트

| 대상 | 테스트 내용 | 도구 |
|------|------------|------|
| `BottomPanelHeader` | 접힘/펼침 버튼, Clear 버튼, 전체화면 버튼 클릭 | Vitest + Testing Library |
| `ChatTab` | 메시지 입력, 전송, 스트리밍 표시p | Vitest + Testing Library |
| `ExecutionOrderColumn` | 병렬 그룹 표시, bypass 필터링, 상태 색상 | Vitest + Testing Library |
| `BottomPanel` | 리사이즈 드래그, 높이 제약, 더블클릭 토글 | Vitest + Testing Library |

### 12.3 통합 테스트

| 시나리오 | 검증 |
|----------|------|
| Chat 실행 → 스트리밍 응답 | 입력 → 전송 → assistant 메시지 스트리밍 표시 → 실행 순서 갱신 |
| Button 실행 → 결과 표시 | 실행 → Executor 탭 자동 전환 → 결과 텍스트 표시 |
| 패널 리사이즈 → 새로고침 | 높이 조절 → 새로고침 → 이전 높이 복원 |
| 전체화면 → ESC 탈출 | 전체화면 진입 → ESC → 이전 높이 복원 |

---

## 13. 마이그레이션 단계

### Phase 1: 기반 작업 (1주차)

| # | 작업 | 산출물 |
|---|------|--------|
| 1.1 | 타입 시스템 강화 — `types.ts`에 신규 타입 추가 | `types.ts` 업데이트 |
| 1.2 | i18n 키 정리 — `locales/ko.ts`, `locales/en.ts` 재구성 | `locales/*.ts` 업데이트 |
| 1.3 | 스타일 변수 파일 생성 — `_variables.scss` | `styles/_variables.scss` 신규 |
| 1.4 | Context 생성 — `BottomPanelContext`, `BottomPanelProvider` | `context/` 신규 |

### Phase 2: 컴포넌트 분해 (2주차)

| # | 작업 | 산출물 |
|---|------|--------|
| 2.1 | `BottomPanel.tsx` 신규 생성 (컨테이너) | `components/BottomPanel.tsx` |
| 2.2 | `BottomPanelHeader.tsx` 리팩터 | `components/BottomPanelHeader.tsx` |
| 2.3 | `ExecutionColumn.tsx` 분리 | `components/ExecutionColumn.tsx` |
| 2.4 | `ChatTab.tsx` 분리 | `components/ChatTab.tsx` |
| 2.5 | `ExecutorTab.tsx` 분리 | `components/ExecutorTab.tsx` |
| 2.6 | `ExecutionOrderColumn.tsx` 분리 | `components/ExecutionOrderColumn.tsx` |
| 2.7 | `LogColumn.tsx` 분리 | `components/LogColumn.tsx` |
| 2.8 | 각 컴포넌트 SCSS 모듈 생성 | `styles/*.module.scss` |

### Phase 3: 핵심 기능 구현 (3주차)

| # | 작업 | 산출물 |
|---|------|--------|
| 3.1 | `useResizePanel` 훅 구현 | `hooks/useResizePanel.ts` |
| 3.2 | `ResizeHandle.tsx` 구현 | `components/ResizeHandle.tsx` |
| 3.3 | 전체화면 모드 구현 | Context + BottomPanel 업데이트 |
| 3.4 | `@xgen/icons` 아이콘 연동 | 이모지 → 아이콘 컴포넌트 교체 |
| 3.5 | 레거시 컴포넌트 삭제 | `BottomExecutionLogPanel`, `ExecutionPanel`, `DetailPanel` 제거 |

### Phase 4: 고도화 기능 구현 (4주차)

| # | 작업 | 산출물 |
|---|------|--------|
| 4.1 | 실행 순서 실시간 상태 표시 | `ExecutionOrderColumn` 업데이트 |
| 4.2 | 로그 검색 바 구현 | `LogColumn` + `LogToolbar` |
| 4.3 | 채팅 기록 영속 (`useChatPersistence`) | `hooks/useChatPersistence.ts` |
| 4.4 | 키보드 단축키 구현 | `hooks/useBottomPanelShortcuts.ts` |

### Phase 5: 통합 및 테스트 (5주차)

| # | 작업 | 산출물 |
|---|------|--------|
| 5.1 | `index.tsx` Plugin 등록 업데이트 | `index.tsx` 업데이트 |
| 5.2 | `apps/web/CanvasPage.tsx` 소비 코드 업데이트 | CanvasPage 간소화 |
| 5.3 | `publish/` 미리보기 페이지 연동 | 미리보기 동작 확인 |
| 5.4 | 테스트 작성 (단위 + 컴포넌트 + 통합) | `__tests__/` |
| 5.5 | 크로스 브라우저 / 반응형 검증 | 수동 QA |

---

## 14. 파일별 작업 매핑

### 14.1 features/canvas-execution/src/ 최종 파일 구조

```
src/
├── index.tsx                          ← Plugin 등록 (업데이트)
├── types.ts                           ← 타입 정의 (대폭 확장)
│
├── context/
│   ├── BottomPanelContext.tsx          ← Context 정의 (신규)
│   └── BottomPanelProvider.tsx         ← Provider 구현 (신규)
│
├── hooks/
│   ├── useResizePanel.ts              ← 리사이즈 훅 (신규)
│   ├── useChatPersistence.ts          ← 채팅 영속 훅 (신규)
│   ├── useExecutionOrder.ts           ← 실행 순서 Fetch 훅 (신규, 기존 로직 추출)
│   └── useBottomPanelShortcuts.ts     ← 키보드 단축키 훅 (신규)
│
├── components/
│   ├── BottomPanel.tsx                ← 최상위 컨테이너 (신규)
│   ├── BottomPanelHeader.tsx          ← 헤더 바 (리팩터)
│   ├── BottomPanelContent.tsx         ← 3컬럼 오케스트레이터 (리팩터)
│   ├── ResizeHandle.tsx               ← 리사이즈 핸들 (신규)
│   ├── ExecutionColumn.tsx            ← 좌측 컬럼 (신규)
│   ├── ChatTab.tsx                    ← Chat 탭 (신규)
│   ├── ExecutorTab.tsx                ← Executor 탭 (신규)
│   ├── ExecutionOrderColumn.tsx       ← 중간 컬럼 (신규)
│   ├── ExecutionOrderItem.tsx         ← 실행 순서 아이템 (신규)
│   └── LogColumn.tsx                  ← 우측 컬럼 (신규)
│
├── locales/
│   ├── index.ts                       ← (유지)
│   ├── ko.ts                          ← (키 재구성)
│   └── en.ts                          ← (키 재구성)
│
└── styles/
    ├── _variables.scss                ← 공유 변수 (신규)
    ├── bottom-panel.module.scss       ← BottomPanel (신규)
    ├── bottom-panel-header.module.scss ← 헤더 (리팩터)
    ├── bottom-panel-content.module.scss ← 콘텐츠 (리팩터)
    ├── resize-handle.module.scss      ← 리사이즈 핸들 (신규)
    ├── execution-column.module.scss   ← 좌측 컬럼 (신규)
    ├── chat-tab.module.scss           ← Chat 탭 (신규)
    ├── executor-tab.module.scss       ← Executor 탭 (신규)
    ├── execution-order.module.scss    ← 중간 컬럼 (신규)
    └── log-column.module.scss         ← 우측 컬럼 (신규)
```

### 14.2 삭제되는 파일

```
# features/canvas-execution/src/components/ 에서 삭제
- BottomExecutionLogPanel.tsx          ← 레거시 2-pane
- ExecutionPanel.tsx                   ← 플로팅 패널
- DetailPanel.tsx                      ← 통합 완료
- CanvasExecutionLogPanel.tsx          ← BottomPanel + BottomPanelHeader로 대체
- CanvasBottomPanelContent.tsx         ← BottomPanelContent로 대체

# features/canvas-execution/src/styles/ 에서 삭제
- bottom-execution-log-panel.module.scss
- execution-panel.module.scss
- detail-panel.module.scss
- canvas-execution-log-panel.module.scss
- canvas-bottom-panel-content.module.scss
```

### 14.3 외부 파일 변경

| 파일 | 변경 내용 |
|------|-----------|
| `apps/web/src/components/CanvasPage/CanvasPage.tsx` | 하단 패널 관련 상태 제거, `<BottomPanelProvider>` + `<BottomPanel />` 사용 |
| `apps/web/src/features/canvas-features.ts` | Plugin 등록 확인 (변경 불필요할 수 있음) |

---

## 15. 의존성 그래프

### 15.1 패키지 의존성

```
@xgen/feature-canvas-execution
├── @xgen/types          ← CanvasPagePlugin 인터페이스
├── @xgen/canvas-types   ← CanvasState, NodeData 등 (신규 추가)
├── @xgen/i18n           ← useTranslation
├── @xgen/icons          ← 아이콘 컴포넌트 (Trash, Screen, Chevron, Send 등)
├── @xgen/api-client     ← getWorkflowExecutionOrderByData API
├── @xgen/ui             ← (선택) ResizablePanel 활용 가능
├── react                ← React 19
└── framer-motion        ← 애니메이션 (패널 전환 등)
```

### 15.2 내부 모듈 의존성

```
index.tsx
├── context/BottomPanelProvider.tsx
│   ├── hooks/useResizePanel.ts
│   ├── hooks/useChatPersistence.ts
│   ├── hooks/useExecutionOrder.ts
│   └── hooks/useBottomPanelShortcuts.ts
├── components/BottomPanel.tsx
│   ├── components/ResizeHandle.tsx
│   ├── components/BottomPanelHeader.tsx
│   └── components/BottomPanelContent.tsx
│       ├── components/ExecutionColumn.tsx
│       │   ├── components/ChatTab.tsx
│       │   └── components/ExecutorTab.tsx
│       ├── components/ExecutionOrderColumn.tsx
│       │   └── components/ExecutionOrderItem.tsx
│       └── components/LogColumn.tsx
└── types.ts (모든 모듈에서 import)
```

---

## 16. 위험 요소 및 대응

### 16.1 기술적 위험

| 위험 | 영향 | 확률 | 대응 |
|------|------|------|------|
| 리사이즈 드래그 시 캔버스 이벤트 충돌 | 캔버스 노드가 함께 움직임 | 중간 | `e.stopPropagation()` + 리사이즈 중 캔버스 `pointer-events: none` |
| 전체화면 모드에서 캔버스 단축키 충돌 | 예상치 못한 동작 | 낮음 | 전체화면 시 캔버스 키보드 핸들러 비활성화 |
| 채팅 sessionStorage 용량 초과 | 5MB 제한에 도달 가능 | 낮음 | 메시지 50개 제한 + 오래된 것 자동 삭제 |
| `any` 타입 제거 시 하위 호환 | 기존 소비 코드에서 타입 에러 | 높음 | Generic + 점진적 마이그레이션 (`LogEntry` 먼저, 나머지 후순위) |
| `BottomExecutionLogPanel` 삭제 시 외부 참조 | 빌드 실패 | 중간 | 삭제 전 `grep` 으로 참조 확인, 미사용 확인 후 삭제 |

### 16.2 제품 위험

| 위험 | 영향 | 대응 |
|------|------|------|
| 리사이즈 UX가 오히려 복잡할 수 있음 | 사용자 혼란 | 더블클릭 = 기존 토글 동작 유지 (학습 비용 0) |
| 전체화면에서 캔버스 접근 불가 | 워크플로우 편집 중단 | 전체화면에서도 우측 상단 최소화 버튼 상시 표시 |
| 모바일/태블릿 대응 | 캔버스는 데스크톱 전용이므로 낮은 우선순위 | 최소 1024px 대응만 보장 |

### 16.3 일정 위험

| 위험 | 대응 |
|------|------|
| Phase 3-4 동시 진행 시 충돌 | Phase 3 완료 후 Phase 4 시작 (순차) |
| 테스트 작성 지연 | 각 Phase에서 컴포넌트 완성 직후 테스트 병행 |

---

## 부록: package.json 수정 사항

```jsonc
// features/canvas-execution/package.json (수정 후)
{
  "name": "@xgen/feature-canvas-execution",
  "version": "0.2.0",
  "private": true,
  "main": "src/index.tsx",
  "exports": {
    ".": "./src/index.tsx"
  },
  "dependencies": {
    "@xgen/types": "workspace:*",
    "@xgen/canvas-types": "workspace:*",     // 추가
    "@xgen/i18n": "workspace:*",
    "@xgen/icons": "workspace:*",
    "@xgen/api-client": "workspace:*",
    "@xgen/ui": "workspace:*",               // 추가 (ResizablePanel 활용 시)
    "react": "^19.0.0",
    "framer-motion": "^11.0.0"
  }
}
```
