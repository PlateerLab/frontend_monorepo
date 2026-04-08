# Canvas Tutorial System - Virtual Cursor Guide

> XGEN 캔버스에서 신규 사용자를 위한 가상 커서 기반 인터랙티브 튜토리얼 시스템

---

## 1. 개요

### 1-1. 목적

새로운 사용자가 XGEN 캔버스를 처음 접했을 때, 매뉴얼 없이 **가상 커서가 직접 시범을 보여주며** 사용법을 안내하는 인터랙티브 튜토리얼 시스템.

### 1-2. 핵심 컨셉

게임 튜토리얼과 동일한 경험:
- 화면 위에 **가상 마우스 커서**가 나타남
- 커서가 버튼/노드 등으로 **부드럽게 이동**
- **클릭 애니메이션** 후 해당 버튼이 **실제로 동작**함
- 안내 말풍선이 현재 단계를 설명
- 대상 영역만 밝게 보이는 **스포트라이트 마스크**

### 1-3. 커서 동작 모드

| 모드 | 동작 | 실제 실행 | 용도 |
|------|------|-----------|------|
| `move` | 대상으로 이동만 | X | 위치 안내 ("여기가 출력 포트입니다") |
| `click` | 이동 + 클릭 애니메이션 | **O** (button.click() 발생) | 시연 ("이 버튼을 클릭합니다") |
| `drag` | 시작점 → 끝점 드래그 | **O** (DragEvent 발생) | 노드 드래그 시연 |
| `type` | 입력 필드에 타이핑 | **O** (값 입력) | 텍스트 입력 시연 |
| `wait` | 위치를 가리키고 대기 | X (사용자가 직접) | "이번엔 직접 해보세요" |

**시연 → 대기 전환 예시:**
```
Step 1: [click] 커서가 Add Node 버튼 클릭 → 패널이 열림 (시연)
Step 2: [click] 커서가 LLM 노드 클릭 (시연)
Step 3: [wait]  "이제 직접 노드를 캔버스로 드래그해보세요" (사용자 행동)
```

---

## 2. 전체 구조

### 2-1. 아키텍처

```
Canvas Page
│
├── [기존 UI 그대로 유지]
│   ├── CanvasHeader
│   ├── Canvas (노드/엣지)
│   ├── SideMenu (노드패널/템플릿/에이전트플로우)
│   └── BottomPanel (실행)
│
└── TutorialOverlay (z-index: 99999, 최상위)
    ├── SpotlightMask ── 안내 대상만 밝게, 나머지 어둡게
    ├── VirtualCursor ── SVG 손가락 커서, 이동/클릭/드래그 애니메이션
    ├── HintBubble ───── 안내 말풍선 ("여기를 클릭하세요")
    └── ControlBar ───── 하단 진행바 (이전/다음/건너뛰기)
```

### 2-2. 화면 레이아웃

```
┌─────────────────────────────────────────────────────────────┐
│  ┌─ StepProgressIndicator ────────────────────────────────┐ │
│  │  첫 에이전트플로우 만들기  ●●●○○○○  (3/7)              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░┌──────────────────┐░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░│                  │░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░│   스포트라이트     │░░  🖱️ ← 가상 커서 ░░░░░░  │
│  ░░░░░░░░░│   (밝은 영역)     │░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░│                  │░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░└──────────────────┘░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░ ┌──────────────────────┐ ░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░ │ 💬 LLM 노드를 선택    │ ░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░ │    하세요              │ ░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░ └──────────────────────┘ ░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                                             │
│  ┌─ ControlBar ───────────────────────────────────────────┐ │
│  │    [< 이전]   3 / 7   [다음 >]              [건너뛰기]  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Feature 모듈 구조

### 3-1. 디렉토리

```
features/canvas-tutorial/
├── package.json                          # @xgen/feature-canvas-tutorial
└── src/
    ├── index.tsx                         # CanvasPagePlugin 등록 (overlay)
    ├── types.ts                          # TutorialStep, TutorialScenario 타입
    │
    ├── context/
    │   └── TutorialContext.tsx           # 튜토리얼 상태 관리 Context
    │
    ├── components/
    │   ├── TutorialOverlay.tsx           # 최상위 오버레이 (전체 조합)
    │   ├── VirtualCursor.tsx             # 가상 커서 (이동/클릭/드래그)
    │   ├── SpotlightMask.tsx             # 스포트라이트 마스크
    │   ├── HintBubble.tsx                # 안내 말풍선
    │   ├── TutorialControlBar.tsx        # 하단 진행바
    │   ├── StepProgressIndicator.tsx     # 상단 진행 표시
    │   └── ScenarioSelectModal.tsx       # 시나리오 선택 모달
    │
    ├── scenarios/
    │   ├── create-first-agentflow.ts     # 시나리오 1: 첫 에이전트플로우
    │   ├── connect-nodes.ts              # 시나리오 2: 노드 연결
    │   └── execute-agentflow.ts          # 시나리오 3: 실행하기
    │
    ├── hooks/
    │   ├── useTutorial.ts               # 튜토리얼 진행 로직
    │   ├── useElementTarget.ts          # DOM 요소 위치 추적
    │   └── useCursorAnimation.ts        # 커서 애니메이션 로직
    │
    ├── utils/
    │   ├── dom-targets.ts               # CSS 선택자 → 좌표 변환
    │   └── storage.ts                   # 완료 상태 localStorage
    │
    └── locales/
        ├── en.ts
        └── ko.ts
```

### 3-2. package.json

```json
{
  "name": "@xgen/feature-canvas-tutorial",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.tsx",
  "dependencies": {
    "@xgen/types": "workspace:*",
    "@xgen/ui": "workspace:*",
    "@xgen/i18n": "workspace:*"
  }
}
```

---

## 4. 타입 정의

### 4-1. types.ts

```typescript
/** 커서 동작 유형 */
export type CursorAction =
  | 'move'          // 대상으로 이동만 (위치 안내)
  | 'click'         // 이동 후 클릭 (실제 click 이벤트 발생)
  | 'drag'          // 시작점 → 끝점 드래그 (실제 drag 이벤트 발생)
  | 'type'          // 입력 필드에 타이핑 (실제 값 입력)
  | 'wait';         // 사용자 직접 행동 대기

/** 힌트 말풍선 위치 */
export type HintPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto';

/** 튜토리얼 한 스텝 */
export interface TutorialStep {
  id: string;

  /** 스포트라이트 + 커서 이동 대상 (CSS 선택자) */
  targetSelector: string;

  /** 커서 동작 */
  cursorAction: CursorAction;

  /** drag 모드: 드래그 끝점 선택자 */
  dragTargetSelector?: string;

  /** type 모드: 입력할 텍스트 */
  typeText?: string;

  /** 안내 메시지 i18n 키 */
  hintKey: string;

  /** 힌트 위치 (기본: auto) */
  hintPosition?: HintPosition;

  /** wait 모드: 사용자 행동 완료 조건 */
  completionCheck?: () => boolean;

  /** 스텝 진입 시 실행할 준비 작업 */
  onEnter?: () => void;

  /** 자동 진행 딜레이(ms). wait 모드에선 무시 */
  autoAdvanceDelay?: number;
}

/** 시나리오: 스텝들의 묶음 */
export interface TutorialScenario {
  id: string;
  titleKey: string;
  descriptionKey: string;
  steps: TutorialStep[];
}

/** 튜토리얼 전체 상태 */
export interface TutorialState {
  isActive: boolean;
  currentScenarioId: string | null;
  currentStepIndex: number;
  completedScenarios: string[];
}
```

---

## 5. 핵심 컴포넌트 상세

### 5-1. VirtualCursor (가상 커서)

가상 마우스 커서가 화면 위를 이동하며 클릭/드래그를 시연하는 컴포넌트.

**스타일링:**
- `position: fixed`, `z-index: 99999`, `pointer-events: none`
- SVG 손가락 모양 아이콘 (가리키는 손)
- 이동: `transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)`

**동작별 애니메이션:**

```
[move]   🖱️ ─────────────→ 🖱️
         현재 위치          대상 위치 (부드럽게 슬라이드)

[click]  🖱️ → 대상 도착 → 🖱️💫 (scale 바운스 + 물결 이펙트)
                          → targetElement.click() 실행

[drag]   🖱️✊ ══════════→ 🖱️✊
         시작점             끝점 (누른 상태 아이콘으로 변경)
                          → DragEvent 시퀀스 발생

[type]   🖱️ → 입력 필드 도착 → ⌨️ (타이핑 모션)
                              → 한 글자씩 value에 입력

[wait]   🖱️ → 대상 위치에서 위아래로 살짝 흔들림 (주의 환기)
                → 사용자가 직접 행동할 때까지 대기
```

**실제 이벤트 발생 로직:**

```typescript
// click 모드: 실제 클릭 이벤트 발생
function triggerClick(element: HTMLElement) {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

// drag 모드: 드래그 이벤트 시퀀스
function triggerDrag(source: HTMLElement, target: HTMLElement) {
  source.dispatchEvent(new DragEvent('dragstart', { bubbles: true }));
  target.dispatchEvent(new DragEvent('dragover', { bubbles: true }));
  target.dispatchEvent(new DragEvent('drop', { bubbles: true }));
  source.dispatchEvent(new DragEvent('dragend', { bubbles: true }));
}

// type 모드: 입력 필드에 한 글자씩 입력
function triggerType(input: HTMLInputElement, text: string) {
  input.focus();
  for (const char of text) {
    // 타이핑 효과: 한 글자씩 딜레이를 주며 입력
    input.value += char;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
```

### 5-2. SpotlightMask (스포트라이트)

특정 UI 요소만 밝게 보이고 나머지는 어둡게 처리하는 오버레이.

**구현 방식: SVG mask**

```
전체 화면 (어두운 오버레이)
┌────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░┌────────────┐░░░░░░░░░ │
│ ░░░░░│ 투명 (밝음)  │░░░░░░░░░ │  ← targetRect 위치에 구멍
│ ░░░░░└────────────┘░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└────────────────────────────────┘
```

- `position: fixed`, `inset: 0`, `z-index: 99998`
- SVG `<rect>` 전체 + `<rect>` 구멍 (mask로 반전)
- 구멍 위치는 `targetRect`에 패딩/둥근 모서리 적용
- 스텝 전환 시 구멍이 부드럽게 이동 (`transition: all 0.5s`)
- `pointer-events: none` (오버레이를 통과해서 실제 클릭 가능)

### 5-3. HintBubble (안내 말풍선)

```
        ┌─────────────────────────┐
        │ 💬 LLM 노드를 선택하세요  │
        │                         │
        └────────────┬────────────┘
                     ▼  ← 꼬리(화살표)가 대상을 가리킴
              [대상 요소]
```

- 스포트라이트 대상 근처에 표시
- `hintPosition`에 따라 상/하/좌/우 배치
- `auto`일 경우 화면 가장자리 감지하여 자동 조정
- 진입 애니메이션: `opacity 0→1` + `translateY(8px) → 0`

### 5-4. TutorialControlBar (하단 컨트롤)

```
┌───────────────────────────────────────────────────────────┐
│  첫 에이전트플로우 만들기  ●●●○○○○     [이전] [다음] [건너뛰기] │
└───────────────────────────────────────────────────────────┘
```

- 화면 하단 중앙 고정 (`bottom: 24px`)
- 진행률 도트 표시 (완료 ● / 미완료 ○)
- `이전`: 이전 스텝으로 (첫 스텝이면 비활성)
- `다음`: 다음 스텝으로 (`wait` 모드에서는 사용자가 행동 완료해야 활성화)
- `건너뛰기`: 튜토리얼 즉시 종료

---

## 6. 핵심 Hook 상세

### 6-1. useElementTarget — DOM 요소 위치 추적

```typescript
function useElementTarget(selector: string | undefined): DOMRect | null
```

- `querySelector`로 대상 요소 찾기
- `ResizeObserver`로 크기 변경 감지
- `scroll` 이벤트로 스크롤 시 좌표 갱신
- 캔버스 내부 노드의 경우 `getBoundingClientRect()`로 화면 좌표 획득
  (캔버스의 `transform: translate() scale()` 적용 후의 실제 화면 위치)
- 요소가 아직 DOM에 없으면 `MutationObserver`로 생성 대기
  (예: Add Node 버튼 클릭 후 사이드 패널이 열리는 동안)

### 6-2. useCursorAnimation — 커서 애니메이션

```typescript
function useCursorAnimation(
  targetRect: DOMRect | null,
  action: CursorAction
): {
  x: number;
  y: number;
  phase: 'idle' | 'moving' | 'acting' | 'done';
}
```

- `targetRect` 변경 시 현재 위치 → 목표 중앙으로 이동 시작
- `phase: 'moving'` 동안 CSS transition으로 부드러운 이동
- 도착 후 `phase: 'acting'` → 액션 애니메이션 (클릭 바운스 등)
- 완료 후 `phase: 'done'` → 부모에서 다음 스텝 진행 판단

### 6-3. useTutorial — 튜토리얼 진행 관리

```typescript
function useTutorial() {
  return {
    state: TutorialState;
    currentStep: TutorialStep | null;
    currentScenario: TutorialScenario | null;
    start: (scenarioId: string) => void;
    next: () => void;
    prev: () => void;
    skip: () => void;
    reset: () => void;
  };
}
```

**진행 로직:**

```
스텝 진입
  │
  ├── cursorAction === 'wait'
  │     → 사용자 행동 대기
  │     → completionCheck() polling (500ms 간격)
  │     → true 반환 시 자동 next()
  │
  └── cursorAction === 'click' | 'drag' | 'move' | 'type'
        → 커서 애니메이션 실행
        → phase: 'done' 도달 시
        → autoAdvanceDelay만큼 대기
        → 자동 next()

마지막 스텝 완료
  → completedScenarios에 추가
  → localStorage에 저장
  → 완료 모달 표시
```

---

## 7. 시나리오 정의

### 7-1. 시나리오 1: 첫 에이전트플로우 만들기

> 빈 캔버스에서 LLM 노드를 추가하고 저장하는 기본 흐름

| 순서 | 대상 | 커서 동작 | 안내 메시지 |
|------|------|-----------|-------------|
| 1 | 헤더 Add Node 버튼 | `click` | "노드 추가 버튼을 클릭합니다" |
| 2 | 노드 패널 LLM 항목 | `click` | "LLM 노드를 선택합니다" |
| 3 | LLM 항목 → 캔버스 | `drag` | "캔버스 위로 드래그합니다" |
| 4 | 생성된 노드 헤더 | `move` | "노드가 추가되었습니다!" |
| 5 | 출력 포트 | `move` | "출력 포트로 다른 노드와 연결할 수 있습니다" |
| 6 | 저장 버튼 | `click` | "저장 버튼으로 에이전트플로우를 저장합니다" |
| 7 | Edit/Run 토글 | `move` | "실행 모드로 전환하면 테스트할 수 있습니다" |

### 7-2. 시나리오 2: 노드 연결하기

> 두 노드의 포트를 연결하는 방법

| 순서 | 대상 | 커서 동작 | 안내 메시지 |
|------|------|-----------|-------------|
| 1 | 노드A 출력 포트 | `move` | "출력 포트를 확인하세요" |
| 2 | 출력 포트 → 노드B 입력 포트 | `drag` | "출력 포트에서 입력 포트로 드래그하세요" |
| 3 | 생성된 엣지 | `move` | "노드가 연결되었습니다!" |
| 4 | 엣지 | `click` | "연결선을 클릭하면 삭제할 수 있습니다" |

### 7-3. 시나리오 3: 에이전트플로우 실행

> 만든 에이전트플로우를 실행하고 결과를 확인하는 방법

| 순서 | 대상 | 커서 동작 | 안내 메시지 |
|------|------|-----------|-------------|
| 1 | Edit/Run 토글 | `click` | "실행 모드로 전환합니다" |
| 2 | 실행 패널 입력창 | `type` | "메시지를 입력합니다" |
| 3 | 전송 버튼 | `click` | "전송 버튼을 클릭합니다" |
| 4 | 실행 결과 영역 | `move` | "실행 결과가 여기에 스트리밍됩니다" |
| 5 | 노드 상태 표시 | `move` | "각 노드의 실행 상태를 실시간으로 확인할 수 있습니다" |

---

## 8. 기존 코드 수정 사항

### 8-1. data-tutorial 속성 추가

기존 컴포넌트의 로직은 건드리지 않고, **HTML 속성만 추가**합니다.

**canvas-header (features/canvas-header/src/index.tsx):**
```tsx
// 기존
<button onClick={onAddNodeClick}>
// 변경
<button data-tutorial="add-node" onClick={onAddNodeClick}>

// 기존
<Button onClick={onSave}>
// 변경
<Button data-tutorial="save" onClick={onSave}>
```

**canvas-sidebar-nodes (features/canvas-sidebar-nodes/src/index.tsx):**
```tsx
// 기존
<div className={styles.menuItem} draggable>
// 변경
<div className={styles.menuItem} data-node-type={node.function_id} draggable>
```

**CanvasPage (apps/web/src/components/CanvasPage/CanvasPage.tsx):**
```tsx
// 기존
<EditRunFloating>
// 변경
<EditRunFloating data-tutorial="run-mode">
```

### 8-2. 플러그인 등록

**canvas-features-registry.ts에 1줄 추가:**
```typescript
import { canvasTutorialPlugin } from '@xgen/feature-canvas-tutorial';

export function registerCanvasPlugins(): void {
    // ... 기존 플러그인들 ...
    FeatureRegistry.registerCanvasPagePlugin(canvasTutorialPlugin);
}
```

**apps/web/package.json에 dependency 추가:**
```json
"@xgen/feature-canvas-tutorial": "workspace:*"
```

### 8-3. 튜토리얼 진입 버튼

**main-canvas-intro/src/index.tsx에 버튼 추가:**
```tsx
<Button variant="outline" onClick={handleStartTutorial}>
  {t('canvasIntro.hero.startTutorial')}
</Button>
```

---

## 9. 튜토리얼 진입점

| 방법 | 위치 | 트리거 |
|------|------|--------|
| **자동** | 캔버스 최초 진입 | localStorage에 완료 기록 없으면 시나리오 선택 모달 표시 |
| **수동 (인트로)** | Canvas Intro 페이지 | "튜토리얼로 시작" 버튼 클릭 |
| **수동 (캔버스)** | 캔버스 헤더 `?` 버튼 | 시나리오 선택 모달 표시 |

### 완료 상태 관리

```
localStorage Key: xgen_tutorial_completed
Value: ["create-first-agentflow", "connect-nodes"]  // 완료한 시나리오 ID
```

- 시나리오 완료 시 배열에 추가
- 모든 시나리오 완료 시 자동 진입 비활성화
- "다시 보지 않기" 옵션 제공
- 설정에서 "튜토리얼 초기화" 가능

---

## 10. 번역 키

### 10-1. 한국어 (ko.ts)

```typescript
export const ko = {
  tutorial: {
    controlBar: {
      prev: '이전',
      next: '다음',
      skip: '건너뛰기',
      finish: '완료',
    },
    scenarios: {
      createFirst: {
        title: '첫 에이전트플로우 만들기',
        description: '기본적인 에이전트플로우를 만들어봅시다',
      },
      connectNodes: {
        title: '노드 연결하기',
        description: '노드 간의 연결을 만들어봅시다',
      },
      executeAgentflow: {
        title: '에이전트플로우 실행하기',
        description: '만든 에이전트플로우를 실행해봅시다',
      },
    },
    steps: {
      clickAddNode: '노드 추가 버튼을 클릭합니다',
      selectLlmNode: 'LLM 노드를 선택합니다',
      dragToCanvas: '캔버스 위로 드래그합니다',
      nodeAdded: '노드가 추가되었습니다!',
      showOutputPort: '출력 포트로 다른 노드와 연결할 수 있습니다',
      clickSave: '저장 버튼으로 에이전트플로우를 저장합니다',
      showRunMode: '실행 모드로 전환하면 테스트할 수 있습니다',
      dragPort: '출력 포트에서 입력 포트로 드래그하세요',
      nodesConnected: '노드가 연결되었습니다!',
      clickEdge: '연결선을 클릭하면 삭제할 수 있습니다',
      switchToRun: '실행 모드로 전환합니다',
      typeMessage: '메시지를 입력합니다',
      clickSend: '전송 버튼을 클릭합니다',
      showResult: '실행 결과가 여기에 스트리밍됩니다',
      showNodeStatus: '각 노드의 실행 상태를 실시간으로 확인할 수 있습니다',
    },
    selectScenario: {
      title: '튜토리얼 선택',
      description: '배우고 싶은 내용을 선택하세요',
    },
    completion: {
      title: '완료!',
      description: '튜토리얼을 완료했습니다',
      restart: '다시 보기',
      close: '닫기',
    },
  },
};
```

### 10-2. 영어 (en.ts)

```typescript
export const en = {
  tutorial: {
    controlBar: {
      prev: 'Previous',
      next: 'Next',
      skip: 'Skip',
      finish: 'Finish',
    },
    scenarios: {
      createFirst: {
        title: 'Create Your First Agentflow',
        description: 'Learn the basics of creating an agentflow',
      },
      connectNodes: {
        title: 'Connect Nodes',
        description: 'Learn how to connect nodes together',
      },
      executeAgentflow: {
        title: 'Execute Agentflow',
        description: 'Learn how to run your agentflow',
      },
    },
    steps: {
      clickAddNode: 'Click the Add Node button',
      selectLlmNode: 'Select the LLM node',
      dragToCanvas: 'Drag it onto the canvas',
      nodeAdded: 'Node has been added!',
      showOutputPort: 'Use output ports to connect to other nodes',
      clickSave: 'Save your agentflow with the Save button',
      showRunMode: 'Switch to Run mode to test your agentflow',
      dragPort: 'Drag from the output port to an input port',
      nodesConnected: 'Nodes are now connected!',
      clickEdge: 'Click a connection line to delete it',
      switchToRun: 'Switching to Run mode',
      typeMessage: 'Type a message',
      clickSend: 'Click the Send button',
      showResult: 'Execution results will stream here',
      showNodeStatus: 'Monitor each node\'s execution status in real-time',
    },
    selectScenario: {
      title: 'Select Tutorial',
      description: 'Choose what you\'d like to learn',
    },
    completion: {
      title: 'Complete!',
      description: 'You have completed the tutorial',
      restart: 'Restart',
      close: 'Close',
    },
  },
};
```

---

## 11. 개발 순서

| 순서 | 작업 | 규모 | 설명 |
|------|------|------|------|
| **1** | Feature 디렉토리 생성 + types.ts | 소 | 기본 틀 |
| **2** | TutorialContext + useTutorial Hook | 소 | 상태 관리 |
| **3** | SpotlightMask 컴포넌트 | 소 | SVG mask 오버레이 |
| **4** | VirtualCursor + useCursorAnimation | **중** | 핵심 애니메이션 |
| **5** | useElementTarget Hook | 중 | DOM 추적 (MutationObserver) |
| **6** | HintBubble + ControlBar | 소 | UI 컴포넌트 |
| **7** | TutorialOverlay (전체 조합) | 소 | 컴포넌트 조합 |
| **8** | 시나리오 1 정의 + data-tutorial 속성 추가 | 소 | 최소 연동 |
| **9** | 플러그인 등록 + 진입점 연결 | 소 | 통합 |
| **10** | 시나리오 2, 3 추가 + 번역 | 소 | 확장 |
| **11** | 테스트 + 애니메이션 미세 조정 | 중 | 폴리싱 |

---

## 12. 기존 코드 재사용 목록

| 기존 컴포넌트/시스템 | 재사용 방식 |
|---------------------|-------------|
| Canvas Plugin System (`CanvasPagePlugin.overlays`) | 튜토리얼 오버레이를 플러그인으로 등록 |
| Radix UI Tooltip/Popover (`@xgen/ui`) | HintBubble 위치 계산 참고 |
| Modal (`@xgen/ui`) | ScenarioSelectModal, 완료 모달 |
| createPortal 패턴 (sidebar-popover) | 고정 위치 요소 렌더링 |
| i18n (`useTranslation`) | 다국어 안내 메시지 |
| canvas-engine Node.module.scss 토씰 스타일 | 말풍선 디자인 참고 |
| canvas DOM: `data-node-id`, `.port`, `.canvasContainer` | 튜토리얼 타겟 선택자 |

---

## 13. 요약

| 항목 | 내용 |
|------|------|
| **새 Feature** | `@xgen/feature-canvas-tutorial` (1개) |
| **새 컴포넌트** | 7개 (Overlay, Cursor, Mask, Bubble, ControlBar, Progress, Modal) |
| **새 Hook** | 3개 (useTutorial, useElementTarget, useCursorAnimation) |
| **시나리오** | 3개 (에이전트플로우 생성, 노드 연결, 실행) |
| **기존 코드 수정** | data-tutorial 속성 추가 (~10줄), 플러그인 등록 (1줄), 진입 버튼 (5줄) |
| **백엔드 수정** | 없음 |
| **난이도** | 중 (프론트엔드 단독, 핵심은 커서 애니메이션) |
