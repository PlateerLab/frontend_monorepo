# XGEN-Teams 작업계획서

> 메신저형 통합 AI 에이전트 관리 UI — Teams/Slack 스타일 채팅방에서 여러 워크플로우 에이전트를 초대하고, 하이브리드 라우터로 명령을 내려 결과를 수신하는 시스템

---

## 1. 개요

### 1.1 목표
- 개별 워크플로우 URL을 따로 관리하는 불편함 제거
- 하나의 채팅방에서 여러 AI 에이전트를 동료처럼 활용
- `@멘션` 직접 지정 + LLM 자동 라우팅 하이브리드 방식
- **멀티유저 지원** — 여러 사용자가 한 채팅방에서 함께 워크플로우를 운영

### 1.2 현재 vs 변경 후

| 구분 | 현재 (기존 채팅) | XGEN-Teams |
|------|-----------------|------------|
| 에이전트 수 | 채팅방 1개 = 에이전트 1개 | 채팅방 1개 = 에이전트 N개 |
| 에이전트 선택 | 채팅 시작 전 직접 선택 | `@멘션` 또는 LLM 자동 라우팅 |
| 결과 표시 | 단순 텍스트 스트리밍 | 에이전트별 아바타 + 로그 패널 |
| 구조 | 1:1 대화 | 그룹 채팅 (인간 N명 + AI N개) |
| 사용자 | 1명 | **멀티유저 (실시간 동기화)** |
| 실행 방식 | 단일 워크플로우 | **순차/병렬 멀티 워크플로우** |

### 1.3 기존 채팅과의 관계

- **기존 1:1 채팅은 그대로 유지** (`/main?section=current-chat`)
- XGEN-Teams는 **같은 /main 페이지 내 feature**로 등록 (`/main?section=teams`)
- 사이드바에 "Teams" 메뉴 아이템 추가
- 간단한 작업 → 기존 채팅 / 복합 업무 → Teams

### 1.4 Feature ON/OFF 방식

```typescript
// apps/web/src/features/feature-registry.ts

const featureModules = await Promise.all([
  // Chat Section
  import('@xgen/feature-main-dashboard'),
  import('@xgen/main-chat-new'),
  import('@xgen/main-chat-current'),
  import('@xgen/feature-main-chat-history'),

  // ★ Teams — 이 한 줄 주석처리로 기능 ON/OFF
  import('@xgen/main-teams'),

  // Agentflow Section
  import('@xgen/main-canvas-intro'),
  // ...
]);
```

`@xgen/main-teams` feature 모듈이 사이드바 아이템 + 라우트 컴포넌트를 함께 export.
import 한 줄을 주석처리하면 사이드바에서도 사라지고, 라우트도 비활성화됨.

### 1.5 전체 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        프론트엔드 (Next.js)                      │
│  frontend_monorepo/apps/web                                     │
│  └── /main                                                      │
│       ├── ?section=dashboard     ← 대시보드                      │
│       ├── ?section=current-chat  ← 기존 1:1 채팅                 │
│       ├── ?section=teams         ← ★ Teams (feature-registry)   │
│       └── ...                    ← 기타 feature들                │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP / WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              API Gateway (Rust + Axum) :8000                     │
│  xgen-backend-gateway                                           │
│  ├── JWT 인증 + 헤더 주입 (X-User-ID, X-User-Name)              │
│  ├── HTTP 프록시 (/api/:service/*)                               │
│  └── WebSocket 프록시 (양방향 릴레이)                              │
└──┬──────────┬──────────┬──────────┬─────────────────────────────┘
   │          │          │          │
   ▼          ▼          ▼          ▼
┌──────┐ ┌────────┐ ┌────────┐ ┌──────────────────┐
│ core │ │workflow│ │  docs  │ │ ★ xgen-teams     │
│      │ │service │ │service │ │   (신규 서비스)    │
│:8000 │ │ :8000  │ │ :8000  │ │   :8000          │
└──────┘ └────────┘ └────────┘ │                  │
                               │ - Room CRUD      │
                               │ - 메시지 저장     │
                               │ - LLM 라우팅     │
                               │ - WebSocket Hub  │
                               └────────┬─────────┘
                                        │
                              ┌─────────┴─────────┐
                              │                   │
                              ▼                   ▼
                         ┌─────────┐        ┌─────────┐
                         │PostgreSQL│        │  Redis  │
                         │ (영속)   │        │ (캐시)  │
                         └─────────┘        └─────────┘
```

### 1.6 프론트엔드 아키텍처 위치

```
frontend_monorepo/
├── apps/web/
│   └── src/
│       ├── app/main/page.tsx      ← 기존 메인 (feature-registry로 라우팅)
│       └── features/
│           └── feature-registry.ts ← ★ import('@xgen/main-teams') 한 줄 추가
├── features/
│   ├── main-teams/                ← ★ 메인 feature (사이드바 등록 + 3-column 레이아웃)
│   │   └── src/
│   │       ├── index.tsx          # MainFeatureModule export (사이드바 + 라우트)
│   │       ├── TeamsPage.tsx      # 2-column 레이아웃 (좌측 사이드바 + 우측 채팅)
│   │       ├── components/
│   │       │   ├── Sidebar/       # 좌측 패널 (채팅방 목록 + 워크플로우 목록)
│   │       │   ├── TopBar/        # 상단 바 (채팅방명 + 검색 + 멤버 + 프로필)
│   │       │   ├── ChatRoom/      # 채팅 영역 (우측)
│   │       │   ├── MemberPanel/   # 멤버 패널 (상단 아이콘 클릭 시 표시)
│   │       │   └── Router/        # 하이브리드 라우터 로직
│   │       ├── hooks/
│   │       │   ├── useTeamsWebSocket.ts
│   │       │   ├── useTeamsChat.ts
│   │       │   └── useAgentExecution.ts
│   │       └── locales/
│   │           ├── en.ts
│   │           └── ko.ts
│   └── (기존 features...)
├── packages/
│   ├── api-client/                ← teams API 함수 추가 (src/teams.ts)
│   └── types/                     ← teams 관련 타입 추가 (src/teams.ts)
```

**기존 패턴과의 통일성:**
- `main-chat-current`가 자체 채팅 레이아웃을 가지듯, `main-teams`도 자체 2-column 레이아웃 관리
- `MainFeatureModule` 인터페이스를 따라 `sidebarSection`, `sidebarItems`, `routes` export
- 별도 라우트(`/teams`) 없이 `/main?section=teams`로 접근

---

## 2. 화면 구성

### 2.1 전체 레이아웃 (Teams 스타일 2-Column)

> 참고: Microsoft Teams UI를 최대한 따라감

```
┌─────────────────────────────────────────────────────────────────────┐
│ [←][→]        🔍 검색 (Ctrl+E)                  [···] [👤] [👥20] │
├────────────┬────────────────────────────────────────────────────────┤
│            │  [동호회] 러닝메이트 ✏️   채팅  공유  [+]     [📞][🎥]│
│  채팅      │────────────────────────────────────────────────────────│
│  ┌───────┐ │                                                        │
│  │읽지않음│ │  👤 김철수  오전 10:43                                  │
│  │채널   │ │  ┌──────────────────────────────────────────────┐      │
│  │채팅   │ │  │ 뉴스 분석하고 전직원한테 메일로 공지해줘        │      │
│  └───────┘ │  └──────────────────────────────────────────────┘      │
│            │                                                        │
│  ▼ 즐겨찾기│  🤖 라우터  오전 10:43                                  │
│  👤 나     │  ┌──────────────────────────────────────────────┐      │
│            │  │ 📡 뉴스분석봇 → 이메일봇 순서로 실행합니다    │      │
│  ▼ 채팅방  │  └──────────────────────────────────────────────┘      │
│  🏢 마케팅 │                                                        │
│  🏢 개발   │  🤖 @뉴스분석봇  오전 10:44                             │
│  🏢 분석   │  ┌──────────────────────────────────────────────┐      │
│            │  │ TOP3 뉴스입니다:                               │      │
│  ▼ 워크플로│  │ 1. AI 반도체 시장 급성장...                    │      │
│  🔧 뉴스봇 │  │ 2. 글로벌 공급망 재편...                       │      │
│  🔧 번역봇 │  │ 3. 친환경 에너지 전환...                       │      │
│  🔧 이메일 │  │                          [📋 결과] [📊 로그]  │      │
│  🔧 요약봇 │  └──────────────────────────────────────────────┘      │
│  🔧 분석봇 │                                                        │
│            │  🤖 @이메일봇  오전 10:45                               │
│            │  ┌──────────────────────────────────────────────┐      │
│  + 방 만들기│  │ 전 직원(42명)에게 발송 완료했습니다.            │      │
│            │  │                          [📋 결과] [📊 로그]  │      │
│            │  └──────────────────────────────────────────────┘      │
│            │                                                        │
│            │  ┌──────────────────────────────────────────────┐      │
│            │  │ 메시지를 입력하세요...        [✏️][😊][📎][+][→]│      │
│            │  └──────────────────────────────────────────────┘      │
└────────────┴────────────────────────────────────────────────────────┘
```

### 2.2 상단 바 상세

```
┌─────────────────────────────────────────────────────────────────────┐
│ [←][→]        🔍 검색 (Ctrl+E)                  [···] [👤] [👥20] │
└─────────────────────────────────────────────────────────────────────┘
  │                   │                               │    │    │
  │                   │                               │    │    └─ 멤버 아이콘
  │                   │                               │    │       클릭 시 멤버 패널 열림
  │                   │                               │    │       (현재 방 참여자 목록 + 초대)
  │                   │                               │    └─ 내 프로필
  │                   │                               └─ 더보기 메뉴
  │                   └─ 통합 검색 (멤버 검색 + 초대 / 방 검색 / 메시지 검색)
  └─ 네비게이션 (뒤로/앞으로)
```

### 2.3 멤버 패널 (👥 클릭 시 오른쪽에서 슬라이드)

```
                                          ┌────────────────────┐
                                          │  참여 멤버 (5)  [X]│
                                          │──────────────────── │
                                          │  🔍 멤버 검색...    │
                                          │                    │
                                          │  👤 김철수 (방장)   │
                                          │     ● 온라인       │
                                          │  👤 박영희         │
                                          │     ● 온라인       │
                                          │  👤 이민호         │
                                          │     ○ 오프라인     │
                                          │                    │
                                          │  [+ 멤버 초대]     │
                                          └────────────────────┘
```

### 2.4 좌측 사이드바 상세

```
┌────────────┐
│  채팅       │ ← 상단 타이틀 + [...] [🔍] [✏️+] 버튼
│ ┌─────────┐│
│ │읽지않음  ││ ← 필터 탭 (읽지않음 / 채널 / 채팅)
│ │채널  채팅││
│ └─────────┘│
│            │
│ ▼ 즐겨찾기  │ ← 접히는 섹션 (Teams와 동일)
│   👤 나    │
│            │
│ ▼ 채팅방    │ ← 접히는 섹션 — 생성한 Teams 방 목록
│   🏢 마케팅│    각 방에 읽지않은 메시지 배지
│   🏢 개발  │
│   🏢 분석  │
│            │
│ ▼ 워크플로우│ ← 접히는 섹션 — 사용 가능한 에이전트(워크플로우) 목록
│   🔧 뉴스봇│    방에 초대 가능한 워크플로우를 미리 보여줌
│   🔧 번역봇│    클릭 시 해당 워크플로우 상세 정보 또는 1:1 실행
│   🔧 이메일│
│   🔧 요약봇│
│            │
│ [+ 방 만들기]│ ← 하단 고정 버튼
└────────────┘
```

### 2.5 핵심 UI 요소

| 요소 | 설명 |
|------|------|
| **상단 바** | 검색창 (중앙, Ctrl+E), 프로필, 멤버 아이콘 (👥 + 참여자 수) |
| **좌측 사이드바** | 채팅방 목록 + 워크플로우 목록. 필터 탭, 즐겨찾기, 접히는 섹션 |
| **채팅 영역** | 메시지 버블. 사용자/에이전트별 아바타 구분. 라우터 알림 메시지 |
| **채팅 헤더** | 방 이름 + 채팅/공유 탭 + 화상/음성 버튼 (향후) |
| **메시지 입력** | `@` 멘션 자동완성, 이모지, 파일 첨부, 전송 |
| **멤버 패널** | 상단 👥 클릭 시 우측 슬라이드. 참여 멤버 목록 + 초대 기능 |
| **로그 보기** | 에이전트 응답 메시지의 [📊 로그] 버튼 클릭 시 모달로 표시 |

---

## 3. 핵심 기능 상세

### 3.1 채팅방(Room) 관리

```typescript
interface TeamsRoom {
  id: string;                    // room_xxxxx
  name: string;                  // "마케팅팀 AI 어시스턴트"
  description?: string;
  agents: TeamsAgent[];          // 초대된 에이전트 목록
  members: TeamsMember[];        // 방 멤버 (사용자)
  routerConfig: RouterConfig;    // 라우터 설정
  createdAt: string;
  createdBy: number;             // userId
  lastMessageAt?: string;
  unreadCount?: number;
}

interface TeamsMember {
  userId: number;
  username: string;
  role: 'owner' | 'admin' | 'member';
  isOnline: boolean;             // WebSocket 연결 여부
  joinedAt: string;
}
```

**기능:**
- 채팅방 생성 시 이름, 설명, 초기 에이전트 + 멤버 선택
- 기존 워크플로우 목록에서 에이전트 초대 (`listAgentflowsDetail()` 재사용)
- 방별 독립적인 메시지 히스토리
- 방별 라우터 설정 (자동/수동/하이브리드)
- **멤버 초대/제거, 역할 관리**

### 3.2 하이브리드 라우터

```
사용자 메시지 입력
       │
       ▼
  ┌─ @멘션 파싱 ─┐
  │              │
  있음           없음
  │              │
  ▼              ▼
직접 호출     LLM 라우팅 (Claude Haiku)
  │              │
  │    ┌─────────┴─────────┐
  │    │ System Prompt:     │
  │    │ 에이전트 목록:      │
  │    │ - 뉴스분석봇: ...   │
  │    │ - 이메일봇: ...     │
  │    │ - 요약봇: ...       │
  │    │                    │
  │    │ 사용자 메시지:      │
  │    │ "{입력 내용}"       │
  │    │                    │
  │    │ → 적합한 에이전트   │
  │    │   id를 반환         │
  │    │                    │
  │    │ ※ 복수 에이전트     │
  │    │   순차/병렬 판단    │
  │    └────────┬──────────┘
  │             │
  │             ▼
  │      매칭 실패 시
  │      → 에이전트 선택 버튼 제공
  │      "어떤 에이전트에게 전달할까요?"
  │      [뉴스분석봇] [이메일봇] [요약봇]
  │             │
  └──────┬──────┘
         │
         ▼
  선택된 에이전트의 워크플로우 실행
  (executeAgentflowStream 호출)
         │
         ▼
  SSE 스트리밍으로 결과 수신
  → 채팅방에 에이전트 메시지로 표시
  → 로그 패널에 실행 정보 표시
  → WebSocket으로 다른 멤버에게 실시간 전파
```

```typescript
interface RouterConfig {
  mode: 'auto' | 'manual' | 'hybrid';   // 하이브리드가 기본값
  llmModel: string;                      // 기본값: 'claude-haiku-4-5-20251001'
  confidenceThreshold: number;           // 기본값: 0.7 (미만이면 사용자 확인)
  fallbackAction: 'ask_user' | 'message';// 매칭 실패 시 동작
}

interface RoutingResult {
  agents: RoutingTarget[];       // 복수 에이전트 가능
  reason: string;                // "뉴스 분석 후 이메일 전송이 필요합니다"
}

interface RoutingTarget {
  agentId: string;               // 선택된 에이전트 workflow_id
  agentName: string;
  confidence: number;            // 0~1 매칭 신뢰도
  order: number;                 // 실행 순서 (순차 실행 시)
  inputMapping?: string;         // 이전 에이전트 결과를 입력으로 전달
}
```

**LLM 라우팅 프로세스:**
1. 채팅방에 초대된 에이전트들의 `name + description` 수집
2. 사용자 메시지 + 에이전트 목록을 **Claude Haiku**에 전달
3. LLM이 적합한 에이전트 (복수 가능) + 실행 순서 + 신뢰도 + 이유 반환
4. 신뢰도가 `confidenceThreshold` 미만이면 에이전트 선택 버튼 제공
5. 복수 에이전트인 경우 순차 실행 (이전 결과를 다음 입력으로 전달 가능)

**멀티 워크플로우 실행 예시:**
```
사용자: "뉴스 분석하고 메일 보내줘"
         │
    LLM 판단: [뉴스분석봇 (순서1)] → [이메일봇 (순서2)]
         │
    ① 뉴스분석봇 실행 → 결과: "TOP3 뉴스..."
    ② 이메일봇 실행 (입력: 뉴스분석봇 결과) → 결과: "발송 완료"
```

### 3.3 메시지 구조

```typescript
interface TeamsMessage {
  id: string;
  roomId: string;
  sender: TeamsSender;
  content: string;
  type: 'user' | 'agent' | 'router' | 'system';
  metadata?: {
    agentId?: string;            // 어떤 에이전트의 응답인지
    executionId?: string;        // 워크플로우 실행 ID
    routingInfo?: RoutingResult; // 라우팅 결과 정보
    tokenCount?: number;
    duration?: number;           // 실행 소요시간 (ms)
    nodeStatuses?: NodeStatus[]; // 노드별 실행 상태
  };
  attachments?: ChatAttachment[];
  createdAt: string;
  status: 'sending' | 'sent' | 'streaming' | 'error';
}

interface TeamsSender {
  type: 'user' | 'agent' | 'router' | 'system';
  id: string;                    // userId 또는 agentId
  name: string;
  avatar?: string;               // 에이전트별 아이콘/아바타
  color?: string;                // 에이전트별 구분 색상
}
```

### 3.4 에이전트 관리

```typescript
interface TeamsAgent {
  id: string;                    // workflow_id
  name: string;                  // workflow_name
  description: string;           // LLM 라우팅에 사용
  status: 'online' | 'busy' | 'offline' | 'error';
  avatar?: string;
  color: string;                 // 자동 할당된 구분 색상
  stats: {
    totalExecutions: number;
    avgResponseTime: number;
    lastUsedAt?: string;
  };
}
```

**기능:**
- 기존 워크플로우 목록에서 검색하여 초대 (모달)
- 에이전트별 상태 표시 (실행 중/대기/오류)
- 에이전트 제거
- 에이전트 상세 정보 보기 (노드 구성, 설명 등)

### 3.5 실행 로그 뷰어

```typescript
interface ExecutionLog {
  id: string;
  roomId: string;
  messageId: string;
  agentId: string;
  agentName: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  status: 'running' | 'completed' | 'error';
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
  };
  nodeExecutions: {
    nodeId: string;
    nodeName: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    startedAt?: string;
    completedAt?: string;
  }[];
  rawLogs: string[];             // SSE 로그 이벤트 원본
}
```

**표시 정보:**
- 에이전트별 실행 타임라인
- 노드 진행 상태 (프로그레스 바)
- 토큰 사용량, 소요시간
- 에러 발생 시 상세 메시지
- 로그 펼치기/접기

### 3.6 실시간 동기화 (WebSocket)

```
┌──────────┐     WebSocket      ┌──────────────────┐
│  사용자A  │ ◄──────────────► │                  │
└──────────┘                   │  xgen-teams      │
                               │  서비스           │
┌──────────┐     WebSocket      │                  │
│  사용자B  │ ◄──────────────► │  WebSocket Hub   │
└──────────┘                   └──────────────────┘
```

**WebSocket 이벤트:**

| 이벤트 | 방향 | 설명 |
|--------|------|------|
| `message.new` | Server → Client | 새 메시지 (다른 사용자 또는 에이전트 응답) |
| `message.stream` | Server → Client | 에이전트 응답 스트리밍 청크 |
| `message.status` | Server → Client | 메시지 상태 변경 (sending → sent) |
| `member.online` | Server → Client | 멤버 접속/퇴장 알림 |
| `agent.status` | Server → Client | 에이전트 상태 변경 (busy/online) |
| `execution.log` | Server → Client | 실행 로그 업데이트 |
| `typing` | Client → Server → Client | 타이핑 표시 |
| `room.update` | Server → Client | 방 정보 변경 (에이전트 추가/제거 등) |

**연결 흐름:**
```
1. 사용자 /main?section=teams 접속
2. WebSocket 연결: ws://gateway:8000/api/teams/ws
   → Gateway가 xgen-teams 서비스로 프록시 (기존 ws_proxy 활용)
3. JWT 토큰으로 인증 (Gateway가 X-User-ID 헤더 주입)
4. 채팅방 입장: { action: "join_room", roomId: "room_xxx" }
5. 실시간 이벤트 수신 시작
```

---

## 4. 백엔드 설계

### 4.1 기술 스택

| 항목 | 선택 | 비고 |
|------|------|------|
| 언어 | Python 3.14 | 기존 워크플로우 서비스(xgen-workflow)와 동일 |
| 프레임워크 | FastAPI | 비동기 + WebSocket 기본 지원 |
| DB | PostgreSQL | 기존 XGEN 인프라 공유 |
| ORM | SQLAlchemy 2.0 (async) | 비동기 쿼리 |
| 캐시 | Redis | 세션, 온라인 상태, pub/sub |
| WebSocket | FastAPI WebSocket + Redis Pub/Sub | 멀티 인스턴스 동기화 |
| LLM | Claude Haiku (claude-haiku-4-5-20251001) | 라우팅 전용, 토큰 절약 |

### 4.2 DB 스키마 (PostgreSQL)

```sql
-- 채팅방
CREATE TABLE teams_rooms (
    id          VARCHAR(50) PRIMARY KEY,       -- room_xxxxx
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    router_mode VARCHAR(20) DEFAULT 'hybrid',  -- auto/manual/hybrid
    router_config JSONB DEFAULT '{}',          -- RouterConfig
    created_by  INTEGER REFERENCES users(id),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 방 멤버
CREATE TABLE teams_room_members (
    room_id     VARCHAR(50) REFERENCES teams_rooms(id) ON DELETE CASCADE,
    user_id     INTEGER REFERENCES users(id),
    role        VARCHAR(20) DEFAULT 'member',  -- owner/admin/member
    joined_at   TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (room_id, user_id)
);

-- 방에 초대된 에이전트
CREATE TABLE teams_room_agents (
    room_id       VARCHAR(50) REFERENCES teams_rooms(id) ON DELETE CASCADE,
    workflow_id   VARCHAR(100) NOT NULL,        -- 기존 워크플로우 ID
    workflow_name VARCHAR(200) NOT NULL,
    description   TEXT,
    color         VARCHAR(7),                   -- 구분 색상 (#FF5733)
    added_by      INTEGER REFERENCES users(id),
    added_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (room_id, workflow_id)
);

-- 메시지
CREATE TABLE teams_messages (
    id            VARCHAR(50) PRIMARY KEY,
    room_id       VARCHAR(50) REFERENCES teams_rooms(id) ON DELETE CASCADE,
    sender_type   VARCHAR(20) NOT NULL,         -- user/agent/router/system
    sender_id     VARCHAR(100) NOT NULL,        -- userId 또는 workflow_id
    sender_name   VARCHAR(200) NOT NULL,
    content       TEXT NOT NULL,
    type          VARCHAR(20) NOT NULL,         -- user/agent/router/system
    metadata      JSONB DEFAULT '{}',           -- 실행정보, 라우팅정보 등
    status        VARCHAR(20) DEFAULT 'sent',
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    
    -- 인덱스
    INDEX idx_messages_room_created (room_id, created_at DESC)
);

-- 실행 로그
CREATE TABLE teams_execution_logs (
    id            VARCHAR(50) PRIMARY KEY,
    room_id       VARCHAR(50) REFERENCES teams_rooms(id) ON DELETE CASCADE,
    message_id    VARCHAR(50) REFERENCES teams_messages(id),
    workflow_id   VARCHAR(100) NOT NULL,
    workflow_name VARCHAR(200) NOT NULL,
    started_at    TIMESTAMPTZ DEFAULT NOW(),
    completed_at  TIMESTAMPTZ,
    duration_ms   INTEGER,
    status        VARCHAR(20) DEFAULT 'running', -- running/completed/error
    token_usage   JSONB DEFAULT '{}',
    node_statuses JSONB DEFAULT '[]',
    raw_logs      JSONB DEFAULT '[]',
    error_message TEXT
);

-- 첨부파일
CREATE TABLE teams_attachments (
    id          VARCHAR(50) PRIMARY KEY,
    message_id  VARCHAR(50) REFERENCES teams_messages(id) ON DELETE CASCADE,
    name        VARCHAR(500) NOT NULL,
    type        VARCHAR(100),
    size        BIGINT,
    storage_key VARCHAR(500) NOT NULL           -- MinIO/S3 키
);
```

### 4.3 API 엔드포인트

```
# ─── 채팅방 관리 ───
POST   /api/teams/rooms                    # 방 생성
GET    /api/teams/rooms                    # 내 방 목록
GET    /api/teams/rooms/:roomId            # 방 상세
PUT    /api/teams/rooms/:roomId            # 방 수정
DELETE /api/teams/rooms/:roomId            # 방 삭제

# ─── 멤버 관리 ───
POST   /api/teams/rooms/:roomId/members    # 멤버 초대
DELETE /api/teams/rooms/:roomId/members/:userId  # 멤버 제거
PUT    /api/teams/rooms/:roomId/members/:userId  # 역할 변경

# ─── 에이전트 관리 ───
POST   /api/teams/rooms/:roomId/agents     # 에이전트 초대
DELETE /api/teams/rooms/:roomId/agents/:workflowId  # 에이전트 제거

# ─── 메시지 ───
GET    /api/teams/rooms/:roomId/messages   # 메시지 히스토리 (페이지네이션)
POST   /api/teams/rooms/:roomId/messages   # 메시지 전송

# ─── 라우팅 ───
POST   /api/teams/route                    # LLM 라우팅 (Haiku 호출)

# ─── 실행 ───
POST   /api/teams/execute                  # 에이전트 실행 (내부적으로 workflow 서비스 호출)
GET    /api/teams/executions/:execId/logs  # 실행 로그 조회

# ─── WebSocket ───
WS     /api/teams/ws                       # 실시간 연결
```

### 4.4 게이트웨이 등록

`xgen-backend-gateway/config/services.yaml`에 추가:

```yaml
services:
  # ... 기존 서비스들 ...
  
  teams-service:
    host: http://xgen-teams:8000
    modules:
      - teams
```

이렇게 하면 게이트웨이가 `/api/teams/*` 요청을 자동으로 `xgen-teams:8000`으로 프록시합니다.
JWT 인증 + 헤더 주입도 자동 적용.

### 4.5 LLM 라우팅 상세 (백엔드)

```python
# POST /api/teams/route

async def route_message(request: RouteRequest) -> RoutingResult:
    """
    Claude Haiku를 사용하여 메시지를 적절한 에이전트에게 라우팅
    """
    # 1. 방에 초대된 에이전트 목록 조회
    agents = await get_room_agents(request.room_id)
    
    # 2. Haiku에게 라우팅 요청
    system_prompt = f"""
    당신은 메시지 라우터입니다. 사용자의 요청을 분석하여
    가장 적합한 에이전트를 선택하세요.
    
    사용 가능한 에이전트:
    {format_agent_list(agents)}
    
    규칙:
    - 복수 에이전트가 필요하면 실행 순서와 함께 반환
    - 적합한 에이전트가 없으면 빈 배열 반환
    - JSON 형식으로 응답
    """
    
    response = await anthropic.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=200,
        system=system_prompt,
        messages=[{"role": "user", "content": request.message}]
    )
    
    # 3. 결과 파싱 및 반환
    return parse_routing_result(response)
```

### 4.6 WebSocket Hub (백엔드)

```python
# Redis Pub/Sub 기반 멀티 인스턴스 WebSocket Hub

class TeamsWebSocketHub:
    """
    여러 서버 인스턴스에서도 동작하도록 Redis Pub/Sub 사용
    """
    
    async def on_connect(self, ws, user_id):
        # Redis에 온라인 상태 등록
        await redis.sadd(f"room:{room_id}:online", user_id)
        # 방 멤버에게 접속 알림
        await self.broadcast(room_id, {
            "event": "member.online",
            "userId": user_id
        })
    
    async def on_message(self, room_id, message):
        # DB에 메시지 저장
        saved = await save_message(message)
        # Redis Pub/Sub으로 브로드캐스트
        await redis.publish(f"room:{room_id}", json.dumps({
            "event": "message.new",
            "data": saved
        }))
    
    async def on_agent_stream(self, room_id, exec_id, chunk):
        # 에이전트 SSE 스트리밍을 WebSocket으로 변환
        await redis.publish(f"room:{room_id}", json.dumps({
            "event": "message.stream",
            "executionId": exec_id,
            "chunk": chunk
        }))
```

---

## 5. 기술 구현 계획

### Phase 1: 기반 구조 (뼈대)

> 목표: feature-registry 등록, 3-column 레이아웃, 기본 네비게이션

**프론트엔드:**

| # | 작업 | 파일/위치 | 설명 |
|---|------|----------|------|
| 1-1 | Teams feature 모듈 생성 | `features/main-teams/` | `MainFeatureModule` export (사이드바 + 라우트) |
| 1-2 | feature-registry 등록 | `apps/web/src/features/feature-registry.ts` | `import('@xgen/main-teams')` 한 줄 추가 |
| 1-3 | Teams 타입 정의 | `packages/types/src/teams.ts` | Room, Message, Agent, Router, Member 타입 |
| 1-4 | 2-Column 레이아웃 | `features/main-teams/src/TeamsPage.tsx` | 좌측 사이드바 + 우측 채팅 영역 |
| 1-5 | 상단 바 | `features/main-teams/src/components/TopBar/` | 검색창 + 프로필 + 멤버 아이콘 |
| 1-6 | next.config 업데이트 | `apps/web/next.config.ts` | transpilePackages에 `@xgen/main-teams` 추가 |

**백엔드:**

| # | 작업 | 설명 |
|---|------|------|
| 1-6 | FastAPI 프로젝트 초기화 | `xgen-teams/` 서비스 생성 |
| 1-7 | DB 마이그레이션 | PostgreSQL 테이블 생성 (teams_rooms, teams_messages 등) |
| 1-8 | 게이트웨이 등록 | `services.yaml`에 teams-service 추가 |

**결과물:** `/main?section=teams` 접속 시 3-column 빈 레이아웃 표시, 백엔드 서비스 기동

---

### Phase 2: 채팅방 관리

> 목표: 방 생성/목록/선택/멤버 관리

**프론트엔드:**

| # | 작업 | 파일/위치 | 설명 |
|---|------|----------|------|
| 2-1 | 좌측 사이드바 | `features/main-teams/src/components/Sidebar/` | 채팅방 목록 + 워크플로우 목록 + 필터 탭 + 즐겨찾기 |
| 2-2 | 방 생성 모달 | `features/main-teams/src/components/Sidebar/` | 이름, 설명 + 초기 에이전트/멤버 선택 |
| 2-3 | API 클라이언트 | `packages/api-client/src/teams.ts` | 방 CRUD + 멤버/에이전트 API |
| 2-4 | 방 상태 관리 | `features/main-teams/src/hooks/useRoomState.ts` | 선택된 방, 방 전환 로직 |

**백엔드:**

| # | 작업 | 설명 |
|---|------|------|
| 2-5 | Room CRUD API | `POST/GET/PUT/DELETE /api/teams/rooms` |
| 2-6 | Member API | 멤버 초대/제거/역할 변경 |
| 2-7 | Agent API | 에이전트(워크플로우) 초대/제거 |

**결과물:** 방 생성 → 멤버/에이전트 초대 → 목록에 표시 → 클릭하여 선택

---

### Phase 3: 채팅 기능 + WebSocket

> 목표: 메시지 전송/수신, 실시간 동기화, 에이전트 응답 스트리밍

**프론트엔드:**

| # | 작업 | 파일/위치 | 설명 |
|---|------|----------|------|
| 3-1 | 채팅 메시지 UI | `features/main-teams/src/components/ChatRoom/` | 메시지 버블 (사용자/에이전트별 아바타) |
| 3-2 | 채팅 헤더 | `features/main-teams/src/components/ChatRoom/ChatHeader.tsx` | 방 이름 + 채팅/공유 탭 |
| 3-3 | 메시지 입력 | `features/main-teams/src/components/ChatRoom/` | @멘션 자동완성, 이모지, 파일 첨부 |
| 3-4 | WebSocket 연결 | `features/main-teams/src/hooks/useTeamsWebSocket.ts` | 연결/재연결/이벤트 핸들링 |
| 3-5 | 에이전트 실행 연동 | `features/main-teams/src/hooks/useAgentExecution.ts` | 실행 요청 → SSE→WebSocket 스트리밍 수신 |
| 3-6 | 멤버 패널 | `features/main-teams/src/components/MemberPanel/` | 👥 클릭 → 우측 슬라이드 (멤버 목록 + 초대) |
| 3-7 | 라우터 알림 메시지 | `features/main-teams/src/components/ChatRoom/` | 시스템 메시지 표시 |

**백엔드:**

| # | 작업 | 설명 |
|---|------|------|
| 3-7 | Message API | 메시지 저장/조회 (페이지네이션) |
| 3-8 | WebSocket Hub | 연결 관리, Redis Pub/Sub 브로드캐스트 |
| 3-9 | 에이전트 실행 프록시 | workflow-service SSE → WebSocket 변환 |
| 3-10 | 온라인 상태 관리 | Redis 기반 접속 상태 추적 |

**결과물:** 멀티유저 실시간 채팅 + 에이전트 응답 스트리밍

---

### Phase 4: 하이브리드 라우터

> 목표: @멘션 직접 지정 + LLM 자동 라우팅 + 멀티 워크플로우 체인

**프론트엔드:**

| # | 작업 | 파일/위치 | 설명 |
|---|------|----------|------|
| 4-1 | @멘션 파서 | `features/main-teams/src/components/Router/` | 메시지에서 @에이전트명 추출 |
| 4-2 | 라우팅 결과 UI | `features/main-teams/src/components/ChatRoom/` | 라우팅 알림 + 에이전트 선택 버튼 (fallback) |
| 4-3 | 멀티 실행 UI | `features/main-teams/src/components/ChatRoom/` | 순차 실행 진행 표시 (① → ② → ③) |
| 4-4 | 라우터 설정 UI | `features/main-teams/src/components/AgentPanel/` | 모드 변경 (auto/manual/hybrid) |

**백엔드:**

| # | 작업 | 설명 |
|---|------|------|
| 4-5 | LLM 라우팅 API | `POST /api/teams/route` — Claude Haiku 호출 |
| 4-6 | 멀티 에이전트 실행 | 순차 실행 오케스트레이션 (결과 체이닝) |

**결과물:** @멘션 또는 자연어 → 적절한 에이전트 자동 선택/실행, 복수 에이전트 순차 실행

---

### Phase 5: 워크플로우 관리 + 로그 뷰어

> 목표: 좌측 사이드바 워크플로우 목록 강화, 실행 로그 모달

**프론트엔드:**

| # | 작업 | 파일/위치 | 설명 |
|---|------|----------|------|
| 5-1 | 워크플로우 목록 | `features/main-teams/src/components/Sidebar/WorkflowList.tsx` | 좌측 사이드바에 워크플로우 목록 (상태 표시) |
| 5-2 | 에이전트 초대 UX | `features/main-teams/src/components/Sidebar/` | 워크플로우를 방에 드래그 또는 우클릭 초대 |
| 5-3 | 로그 모달 | `features/main-teams/src/components/LogViewer/LogDetailModal.tsx` | 메시지 [📊 로그] 버튼 → 모달 (타임라인, 노드 상태, 토큰) |
| 5-4 | 결과 모달 | `features/main-teams/src/components/LogViewer/` | 메시지 [📋 결과] 버튼 → 상세 결과 모달 |

**백엔드:**

| # | 작업 | 설명 |
|---|------|------|
| 5-5 | 실행 로그 API | 로그 저장/조회 |
| 5-6 | 에이전트 상태 추적 | 실행 중 상태를 WebSocket으로 브로드캐스트 |

**결과물:** 워크플로우 목록에서 에이전트 관리, 메시지 내 로그/결과 모달 확인

---

### Phase 6: 고도화

> 목표: UX 개선 및 부가 기능

| # | 작업 | 설명 |
|---|------|------|
| 6-1 | 메시지 검색 | 채팅방 내 메시지 검색 (DB full-text search) |
| 6-2 | 핀 메시지 | 중요 결과 고정 |
| 6-3 | 방 템플릿 | "마케팅팀 세트" 같은 프리셋 |
| 6-4 | 키보드 단축키 | Ctrl+K 방 검색, Ctrl+/ 명령어 팔레트 |
| 6-5 | 알림 | 에이전트 실행 완료 시 브라우저 알림 |
| 6-6 | 타이핑 인디케이터 | 다른 사용자 입력 중 표시 |
| 6-7 | 읽음 표시 | 메시지 읽음/안읽음 상태 |

---

## 6. 신규 생성 파일 목록

### 프론트엔드 features/main-teams/ (단일 feature 모듈)

```
features/main-teams/
├── package.json                       # @xgen/main-teams
├── tsconfig.json
└── src/
    ├── index.tsx                      # MainFeatureModule export
    │                                  # → sidebarSection: 'chat'
    │                                  # → sidebarItems: [{ id: 'teams', ... }]
    │                                  # → routes: { 'teams': TeamsPage }
    ├── TeamsPage.tsx                  # 2-column 메인 레이아웃 (사이드바 + 채팅)
    ├── TeamsPage.module.scss
    │
    ├── components/
    │   ├── TopBar/                    # 상단 바
    │   │   ├── TopBar.tsx             # 검색창 + 프로필 + 멤버 아이콘
    │   │   └── GlobalSearch.tsx       # 통합 검색 (멤버/방/메시지)
    │   │
    │   ├── Sidebar/                   # 좌측 패널
    │   │   ├── TeamsSidebar.tsx       # 사이드바 메인
    │   │   ├── RoomList.tsx           # 채팅방 목록 (접히는 섹션)
    │   │   ├── RoomCard.tsx           # 개별 채팅방 카드
    │   │   ├── WorkflowList.tsx       # 워크플로우(에이전트) 목록 (접히는 섹션)
    │   │   ├── FilterTabs.tsx         # 읽지않음 / 채널 / 채팅 필터
    │   │   ├── CreateRoomModal.tsx    # 방 생성 모달
    │   │   └── FavoriteList.tsx       # 즐겨찾기 섹션
    │   │
    │   ├── ChatRoom/                  # 우측 — 채팅 영역
    │   │   ├── ChatRoom.tsx           # 채팅방 메인 (헤더 + 메시지 + 입력)
    │   │   ├── ChatHeader.tsx         # 방 이름 + 채팅/공유 탭
    │   │   ├── TeamsMessageList.tsx   # 메시지 목록 (스크롤)
    │   │   ├── TeamsMessageItem.tsx   # 개별 메시지 버블 (사용자/에이전트/라우터)
    │   │   ├── TeamsMessageInput.tsx  # 입력창 (@멘션, 이모지, 첨부, 전송)
    │   │   ├── MentionAutocomplete.tsx # @멘션 드롭다운
    │   │   ├── RouterNotice.tsx       # 라우터 알림 메시지
    │   │   └── AgentSelectFallback.tsx # 라우팅 실패 시 수동 선택 버튼
    │   │
    │   ├── MemberPanel/               # 멤버 패널 (👥 클릭 시 우측 슬라이드)
    │   │   ├── MemberPanel.tsx        # 참여 멤버 목록
    │   │   ├── MemberCard.tsx         # 개별 멤버 (온라인 상태)
    │   │   └── InviteMemberModal.tsx  # 멤버 초대 모달
    │   │
    │   ├── LogViewer/                 # 실행 로그 (메시지 내 [로그] 버튼 → 모달)
    │   │   ├── LogDetailModal.tsx     # 로그 모달
    │   │   ├── ExecutionTimeline.tsx  # 노드 실행 타임라인
    │   │   └── NodeStatusBar.tsx      # 노드별 상태 바
    │   │
    │   └── Router/                    # 하이브리드 라우터 로직
    │       ├── mentionParser.ts       # @멘션 파싱
    │       └── routingClient.ts       # LLM 라우팅 API 호출
    │
    ├── hooks/
    │   ├── useTeamsWebSocket.ts       # WebSocket 연결/재연결/이벤트
    │   ├── useTeamsChat.ts            # 메시지 상태 관리
    │   ├── useAgentExecution.ts       # 에이전트 실행 + 스트리밍
    │   └── useRoomState.ts            # 방 선택/전환 상태
    │
    └── locales/
        ├── en.ts
        └── ko.ts
```

**장점: 단일 feature 모듈**
- `features/main-teams/` 폴더 하나로 모든 Teams 프론트엔드 코드 관리
- `feature-registry.ts`에서 import 한 줄로 ON/OFF
- 기존 feature들과 동일한 패턴 (`main-chat-current` 등과 같은 구조)
- 내부적으로 `components/` 하위에 영역별 분리하여 관심사 구분
- 로그 뷰어는 별도 패널 없이 메시지 내 버튼 → 모달로 표시

### 백엔드 xgen-teams/ (신규 서비스)

```
xgen-teams/
├── requirements.txt
├── Dockerfile
├── README.md
├── app/
│   ├── main.py                    # FastAPI 앱 + 라우터 등록
│   ├── config.py                  # 설정 (DB, Redis, LLM 등)
│   ├── database.py                # SQLAlchemy async 엔진
│   ├── models/
│   │   ├── room.py                # TeamsRoom, RoomMember, RoomAgent
│   │   ├── message.py             # TeamsMessage, Attachment
│   │   └── execution_log.py       # ExecutionLog
│   ├── schemas/
│   │   ├── room.py                # Pydantic 스키마
│   │   ├── message.py
│   │   └── routing.py
│   ├── routers/
│   │   ├── rooms.py               # 방 CRUD + 멤버/에이전트 관리
│   │   ├── messages.py            # 메시지 저장/조회
│   │   ├── routing.py             # LLM 라우팅
│   │   ├── execution.py           # 에이전트 실행 프록시
│   │   └── websocket.py           # WebSocket Hub
│   ├── services/
│   │   ├── routing_service.py     # Haiku 라우팅 로직
│   │   ├── execution_service.py   # 워크플로우 실행 + SSE 수신
│   │   └── websocket_hub.py       # Redis Pub/Sub 브로드캐스트
│   └── migrations/
│       └── 001_initial.sql        # DB 스키마 생성
```

### 기존 파일 수정

```
프론트엔드:
├── apps/web/src/features/feature-registry.ts  # ★ import('@xgen/main-teams') 추가 (핵심 1줄)
├── apps/web/next.config.ts                    # transpilePackages에 '@xgen/main-teams' 추가
├── packages/types/src/teams.ts                # Teams 관련 타입 (신규 파일)
├── packages/types/src/index.ts                # teams 타입 re-export
├── packages/api-client/src/teams.ts           # Teams API + WebSocket 함수 (신규 파일)
└── packages/api-client/src/index.ts           # teams API re-export

※ 별도 라우트(apps/web/src/app/teams/) 생성 불필요
※ sidebar-main 수정 불필요 — main-teams가 sidebarItems을 자체 export

백엔드 (기존 인프라):
└── xgen-backend-gateway/config/services.yaml  # teams-service 등록
```

---

## 7. 데이터 흐름

### 7.1 메시지 전송 → 에이전트 실행 전체 흐름 (멀티유저)

```
[사용자A 입력: "뉴스 분석하고 메일 보내줘"]
       │
       ▼
  WebSocket → xgen-teams 서비스
       │
       ├─ 1. 메시지 DB 저장
       │
       ├─ 2. WebSocket 브로드캐스트 → 사용자B 화면에도 메시지 표시
       │
       ├─ 3. @멘션 체크 → 없음 → LLM 라우팅 (Haiku)
       │     │
       │     ▼
       │   RoutingResult {
       │     agents: [
       │       { agentId: "news-analyzer", order: 1 },
       │       { agentId: "email-sender", order: 2, inputMapping: "prev" }
       │     ],
       │     reason: "뉴스 분석 후 이메일 전송 필요"
       │   }
       │
       ├─ 4. 라우터 알림 브로드캐스트
       │     "📡 뉴스분석봇 → 이메일봇 순서로 실행합니다"
       │
       ├─ 5. 순차 실행 ①: 뉴스분석봇
       │     POST /api/workflow/execute/based-id/stream
       │     │
       │     ├─ SSE event: message → WebSocket 브로드캐스트 (스트리밍)
       │     ├─ SSE event: log → 로그 저장 + WebSocket 전파
       │     └─ SSE event: end → 결과 저장, ② 실행 시작
       │
       ├─ 6. 순차 실행 ②: 이메일봇 (입력: ①의 결과)
       │     POST /api/workflow/execute/based-id/stream
       │     │
       │     ├─ SSE event: message → WebSocket 브로드캐스트
       │     └─ SSE event: end → 완료
       │
       └─ 7. 전체 완료 알림 브로드캐스트
             "✅ 2개 에이전트 실행 완료 (총 8.5초)"
```

### 7.2 기존 API 재사용 매핑

| Teams 기능 | 기존 API | 비고 |
|-----------|---------|------|
| 에이전트 목록 | `listAgentflowsDetail()` | 워크플로우 = 에이전트 |
| 에이전트 실행 | `executeAgentflowStream()` | xgen-teams가 내부적으로 workflow-service 호출 |
| 에이전트 상세 | `loadAgentflow()` | 노드 구성 등 |

---

## 8. 작업 우선순위 및 일정

```
Phase 1 (기반 구조)     ████░░░░░░  → 라우트 + 레이아웃 + 타입 + 백엔드 초기화
Phase 2 (채팅방 관리)    ░░████░░░░  → 방 CRUD + 멤버/에이전트 관리
Phase 3 (채팅+WS)       ░░░░████░░  → 메시지 + WebSocket 실시간 + 에이전트 실행
Phase 4 (하이브리드)     ░░░░░░██░░  → @멘션 + Haiku 라우팅 + 멀티 에이전트 체인
Phase 5 (패널+로그)      ░░░░░░░██░  → 에이전트 관리 + 로그 뷰어
Phase 6 (고도화)         ░░░░░░░░██  → 검색, 템플릿, 알림, 타이핑 등
```

**권장 시작점:** Phase 1 → Phase 2 → Phase 3 순서로 진행.
Phase 3까지 완료되면 핵심 기능 동작:
- 방 만들기 → 멤버/에이전트 초대 → 메시지로 명령 → 에이전트 실행 → 결과 실시간 수신

---

## 9. 기존 코드 재사용 목록

| 기존 패키지/컴포넌트 | Teams에서의 활용 |
|---------------------|----------------|
| `@xgen/ui` ChatPanel 계열 | 메시지 렌더링 참고 (멀티유저/에이전트 확장 필요) |
| `@xgen/ui` ContentArea | 레이아웃 컨테이너 |
| `@xgen/ui` Modal | 방 생성, 에이전트/멤버 추가 모달 |
| `@xgen/ui` SearchInput | 방 검색, 에이전트 검색 |
| `@xgen/ui` StatusBadge | 에이전트/멤버 상태 표시 |
| `@xgen/ui` ResourceCard | 에이전트 카드 |
| `@xgen/api-client` | 워크플로우 목록/상세 조회 |
| `@xgen/auth-provider` | 인증 (JWT 토큰 공유) |
| `@xgen/i18n` | 다국어 지원 |
| `@xgen/icons` | 아이콘 |
| `@xgen/types` ChatMessage | 기존 메시지 타입 참고 |
| Gateway WebSocket Proxy | WebSocket 연결 프록시 (기존 인프라 그대로 활용) |

---

## 10. 미확인 사항

| 항목 | 상태 | 비고 |
|------|------|------|
| 백엔드 언어/프레임워크 | ✅ 확인 완료 | Gateway: Rust+Axum, 워크플로우 서비스: Python 3.14 + FastAPI 0.128.0 |
| xgen-teams 서비스 위치 | 미정 | 기존 백엔드 레포에 추가 or 별도 레포 |
| Docker Compose 설정 | 미정 | xgen-teams 컨테이너 추가 필요 |
| Haiku API 키 관리 | 미정 | 기존 LLM 설정(admin-setting-llm)과 연동 여부 |
