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
- XGEN-Teams는 별도 라우트 (`/teams`)로 공존
- 간단한 작업 → 기존 채팅 / 복합 업무 → Teams

### 1.4 전체 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        프론트엔드 (Next.js)                      │
│  frontend_monorepo/apps/web                                     │
│  ├── /main       ← 기존 메인                                    │
│  ├── /admin      ← 기존 어드민                                   │
│  ├── /canvas     ← 기존 캔버스                                   │
│  └── /teams      ← ★ 신규 Teams UI                              │
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

### 1.5 프론트엔드 아키텍처 위치

```
frontend_monorepo/
├── apps/web/
│   └── src/app/
│       ├── main/          ← 기존 메인
│       ├── admin/         ← 기존 어드민
│       ├── canvas/        ← 기존 캔버스
│       └── teams/         ← ★ 신규 Teams 라우트
│           ├── layout.tsx
│           └── page.tsx
├── features/
│   ├── teams-chat-room/       ← 채팅방 UI (메시지 목록 + 입력)
│   ├── teams-room-list/       ← 채팅방 목록 (좌측 패널)
│   ├── teams-agent-panel/     ← 에이전트 관리 패널 (우측)
│   ├── teams-router/          ← 하이브리드 분기 라우터 로직
│   └── teams-log-viewer/      ← 실행 로그 뷰어
├── packages/
│   ├── api-client/            ← teams API 함수 추가
│   └── types/                 ← teams 관련 타입 추가
```

---

## 2. 화면 구성

### 2.1 전체 레이아웃 (Teams 스타일 3-Column)

```
┌─────────────────────────────────────────────────────────────────┐
│  XGEN-Teams                                        [👤 프로필]  │
├──────────┬─────────────────────────────────┬────────────────────┤
│          │                                 │                    │
│  채팅방   │        채팅 영역                │   에이전트 패널    │
│  목록     │                                 │                    │
│          │  ┌─ 김철수 ──────────────────┐  │  ★ 초대된 에이전트  │
│  ● 마케팅 │  │ 뉴스 분석하고 메일 보내줘   │  │  ┌──────────────┐ │
│  ● 개발   │  └─────────────────────────────┘ │  │ 🤖 뉴스분석봇 │ │
│  ○ 분석   │                                 │  │ 🤖 이메일봇   │ │
│  + 새방   │  ┌─ 🤖 라우터 ────────────────┐ │  │ 🤖 요약봇     │ │
│          │  │ 뉴스분석봇에게 전달합니다     │  │  │ + 에이전트    │ │
│          │  └─────────────────────────────┘ │  │   추가         │ │
│  ─────── │                                 │  └──────────────┘ │
│  접속 중  │  ┌─ @뉴스분석봇 ────────────┐  │                    │
│  👤 김철수│  │ TOP3 뉴스입니다:          │  │  ★ 접속 중인 멤버  │
│  👤 박영희│  │ 1. AI 반도체...           │  │  ┌──────────────┐ │
│          │  │ [결과 보기] [로그 보기]     │ │  │ 👤 김철수     │ │
│          │  └─────────────────────────────┘ │  │ 👤 박영희     │ │
│          │                                 │  └──────────────┘ │
│          │  ┌─ 🤖 라우터 ────────────────┐ │                    │
│          │  │ 이메일봇에게 전달합니다       │ │  ★ 실행 로그       │
│          │  └─────────────────────────────┘ │  ┌──────────────┐ │
│          │                                 │  │ 14:32 뉴스봇  │ │
│          │  ┌─ @이메일봇 ────────────────┐ │  │  → 완료 (3.2s) │ │
│          │  │ 전 직원에게 발송 완료했습니다 │ │  │ 14:35 메일봇  │ │
│          │  │ [발송 결과] [로그 보기]     │  │  │  → 실행 중...  │ │
│          │  └─────────────────────────────┘ │  └──────────────┘ │
│          │                                 │                    │
│          │  ┌──────────────────────────┐   │                    │
│          │  │ 메시지를 입력하세요...     │   │                    │
│          │  │              [@] [📎] [→] │   │                    │
│          │  └──────────────────────────┘   │                    │
├──────────┴─────────────────────────────────┴────────────────────┤
│  XGEN Platform v2.0                                             │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 핵심 UI 요소

| 요소 | 설명 |
|------|------|
| **채팅방 목록** | Teams 좌측 패널. 방 생성/삭제/검색. 읽지 않은 메시지 배지 |
| **접속 멤버** | 좌측 하단. 현재 채팅방에 접속 중인 사용자 목록 (WebSocket 기반) |
| **채팅 영역** | 메시지 버블. 사용자/에이전트별 아바타/색상 구분. 라우터 알림 메시지 |
| **메시지 입력** | `@` 멘션 자동완성 (에이전트 + 사용자), 파일 첨부, 전송 |
| **에이전트 패널** | 현재 방에 초대된 에이전트 목록. 추가/제거/상태 표시 |
| **접속 멤버 패널** | 우측. 현재 방에 접속 중인 사용자 목록 |
| **로그 뷰어** | 에이전트별 실행 로그. 토큰 수, 소요시간, 노드 진행상태 |

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
1. 사용자 /teams 접속
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
| 언어 | Python 3.11+ | (확인 필요 — 기존 워크플로우 서비스와 동일 스택 권장) |
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

> 목표: Teams 라우트 생성, 3-column 레이아웃, 기본 네비게이션

**프론트엔드:**

| # | 작업 | 파일/위치 | 설명 |
|---|------|----------|------|
| 1-1 | Teams 라우트 생성 | `apps/web/src/app/teams/` | `layout.tsx`, `page.tsx` 생성 |
| 1-2 | Teams 타입 정의 | `packages/types/src/teams.ts` | Room, Message, Agent, Router, Member 타입 |
| 1-3 | 3-Column 레이아웃 | `features/teams-layout/` | 좌측 방목록 + 중앙 채팅 + 우측 패널 |
| 1-4 | 사이드바 연동 | `features/sidebar-main/` | Teams 메뉴 아이템 추가 |
| 1-5 | next.config 업데이트 | `apps/web/next.config.ts` | transpilePackages에 teams 패키지 추가 |

**백엔드:**

| # | 작업 | 설명 |
|---|------|------|
| 1-6 | FastAPI 프로젝트 초기화 | `xgen-teams/` 서비스 생성 |
| 1-7 | DB 마이그레이션 | PostgreSQL 테이블 생성 (teams_rooms, teams_messages 등) |
| 1-8 | 게이트웨이 등록 | `services.yaml`에 teams-service 추가 |

**결과물:** `/teams` 접속 시 3-column 빈 레이아웃 표시, 백엔드 서비스 기동

---

### Phase 2: 채팅방 관리

> 목표: 방 생성/목록/선택/멤버 관리

**프론트엔드:**

| # | 작업 | 파일/위치 | 설명 |
|---|------|----------|------|
| 2-1 | 방 목록 컴포넌트 | `features/teams-room-list/` | 방 리스트, 검색, 생성 버튼 |
| 2-2 | 방 생성 모달 | `features/teams-room-list/` | 이름, 설명 + 초기 에이전트/멤버 선택 |
| 2-3 | API 클라이언트 | `packages/api-client/src/teams.ts` | 방 CRUD + 멤버/에이전트 API |
| 2-4 | 방 상태 관리 | `features/teams-layout/` | 선택된 방, 방 전환 로직 |

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
| 3-1 | 채팅 메시지 UI | `features/teams-chat-room/` | 메시지 버블 (사용자/에이전트별 아바타) |
| 3-2 | 메시지 입력 | `features/teams-chat-room/` | @멘션 자동완성, 파일 첨부 |
| 3-3 | WebSocket 연결 | `features/teams-chat-room/` | 연결/재연결/이벤트 핸들링 |
| 3-4 | 에이전트 실행 연동 | `features/teams-chat-room/` | 실행 요청 → SSE→WebSocket 스트리밍 수신 |
| 3-5 | 접속 멤버 표시 | `features/teams-agent-panel/` | 온라인 멤버 목록 (WebSocket 기반) |
| 3-6 | 라우터 알림 메시지 | `features/teams-chat-room/` | 시스템 메시지 표시 |

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
| 4-1 | @멘션 파서 | `features/teams-router/` | 메시지에서 @에이전트명 추출 |
| 4-2 | 라우팅 결과 UI | `features/teams-chat-room/` | 라우팅 알림 + 에이전트 선택 버튼 (fallback) |
| 4-3 | 멀티 실행 UI | `features/teams-chat-room/` | 순차 실행 진행 표시 (① → ② → ③) |
| 4-4 | 라우터 설정 UI | `features/teams-agent-panel/` | 모드 변경 (auto/manual/hybrid) |

**백엔드:**

| # | 작업 | 설명 |
|---|------|------|
| 4-5 | LLM 라우팅 API | `POST /api/teams/route` — Claude Haiku 호출 |
| 4-6 | 멀티 에이전트 실행 | 순차 실행 오케스트레이션 (결과 체이닝) |

**결과물:** @멘션 또는 자연어 → 적절한 에이전트 자동 선택/실행, 복수 에이전트 순차 실행

---

### Phase 5: 에이전트 패널 + 로그 뷰어

> 목표: 우측 패널에서 에이전트 관리 및 실행 로그 확인

**프론트엔드:**

| # | 작업 | 파일/위치 | 설명 |
|---|------|----------|------|
| 5-1 | 에이전트 목록 패널 | `features/teams-agent-panel/` | 초대된 에이전트 카드 목록 |
| 5-2 | 에이전트 추가 모달 | `features/teams-agent-panel/` | 워크플로우 검색 + 초대 |
| 5-3 | 에이전트 상태 표시 | `features/teams-agent-panel/` | online/busy/error 뱃지 |
| 5-4 | 로그 뷰어 | `features/teams-log-viewer/` | 실행 타임라인, 노드 상태 |
| 5-5 | 로그 상세 모달 | `features/teams-log-viewer/` | 토큰 수, 소요시간, 원본 로그 |

**백엔드:**

| # | 작업 | 설명 |
|---|------|------|
| 5-6 | 실행 로그 API | 로그 저장/조회 |
| 5-7 | 에이전트 상태 추적 | 실행 중 상태를 WebSocket으로 브로드캐스트 |

**결과물:** 에이전트 추가/제거, 실행 로그 실시간 확인

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

### 프론트엔드 features/ (신규 6개)

```
features/
├── teams-layout/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.tsx              # TeamsLayout (3-column)
│       ├── TeamsLayout.module.scss
│       └── locales/
│           ├── en.ts
│           └── ko.ts
│
├── teams-room-list/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.tsx              # RoomList 컴포넌트
│       ├── components/
│       │   ├── RoomCard.tsx
│       │   ├── CreateRoomModal.tsx
│       │   └── RoomSearch.tsx
│       └── locales/
│           ├── en.ts
│           └── ko.ts
│
├── teams-chat-room/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.tsx              # ChatRoom 메인 컴포넌트
│       ├── components/
│       │   ├── TeamsMessageList.tsx
│       │   ├── TeamsMessageItem.tsx
│       │   ├── TeamsMessageInput.tsx
│       │   ├── MentionAutocomplete.tsx
│       │   ├── RouterNotice.tsx
│       │   └── AgentSelectFallback.tsx  # 라우팅 실패 시 수동 선택
│       ├── hooks/
│       │   ├── useTeamsChat.ts       # 메시지 상태 관리
│       │   ├── useTeamsWebSocket.ts  # WebSocket 연결/이벤트
│       │   └── useAgentExecution.ts  # 에이전트 실행 + 스트리밍
│       └── locales/
│           ├── en.ts
│           └── ko.ts
│
├── teams-agent-panel/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.tsx              # AgentPanel 컴포넌트
│       ├── components/
│       │   ├── AgentCard.tsx
│       │   ├── AddAgentModal.tsx
│       │   ├── MemberList.tsx     # 접속 멤버 목록
│       │   └── RouterSettings.tsx
│       └── locales/
│           ├── en.ts
│           └── ko.ts
│
├── teams-router/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts               # 라우터 엔트리
│       ├── mention-parser.ts      # @멘션 파싱
│       ├── llm-router.ts          # LLM 기반 라우팅 API 호출
│       └── types.ts               # 라우터 전용 타입
│
└── teams-log-viewer/
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.tsx              # LogViewer 컴포넌트
        ├── components/
        │   ├── ExecutionTimeline.tsx
        │   ├── NodeStatusBar.tsx
        │   └── LogDetailModal.tsx
        └── locales/
            ├── en.ts
            └── ko.ts
```

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
├── apps/web/src/app/teams/          # 신규 라우트 (layout.tsx, page.tsx)
├── apps/web/src/features/           # feature-registry에 teams 등록 (선택)
├── apps/web/next.config.ts          # transpilePackages 추가
├── packages/types/src/teams.ts      # Teams 관련 타입 (신규 파일)
├── packages/types/src/index.ts      # teams 타입 re-export
├── packages/api-client/src/teams.ts # Teams API + WebSocket 함수 (신규 파일)
├── packages/api-client/src/index.ts # teams API re-export
└── features/sidebar-main/           # Teams 사이드바 메뉴 추가

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
| 백엔드 언어/프레임워크 | ⚠️ 확인 필요 | Gateway는 Rust, 워크플로우 서비스는 Python/FastAPI 추정 |
| xgen-teams 서비스 위치 | 미정 | 기존 백엔드 레포에 추가 or 별도 레포 |
| Docker Compose 설정 | 미정 | xgen-teams 컨테이너 추가 필요 |
| Haiku API 키 관리 | 미정 | 기존 LLM 설정(admin-setting-llm)과 연동 여부 |
