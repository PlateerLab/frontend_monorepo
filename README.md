# XGEN Frontend Monorepo

pnpm + Turborepo 2.4 기반 모노레포. 57개 기능 모듈을 독립 패키지로 분리하여 앱별 기능 선택이 가능합니다.

## 기술 스택

| 항목 | 버전 |
|------|------|
| Next.js | 15.5 |
| React | 19 |
| TypeScript | 5.7 |
| Tailwind CSS | v4 |
| pnpm | 9.15+ |
| Turborepo | 2.4 |

## 구조

```
xgen-frontend-new/
├── apps/
│   ├── web/              # 전체 기능 포함 앱
│   └── web_jeju/         # 제주은행용 (기능 축소)
├── features/             # 57개 기능 모듈 (각각 독립 패키지)
│   ├── chat-intro/       # 채팅 인트로
│   ├── chat-new/         # 새 채팅
│   ├── canvas-core/      # 캔버스 코어
│   ├── admin-governance/ # AI 거버넌스
│   └── ...
├── packages/             # 공유 라이브러리
│   ├── types/            # FeatureModule, CanvasSubModule 등 타입
│   ├── i18n/             # 다국어 (ko/en)
│   ├── ui/               # 공용 UI 컴포넌트
│   ├── utils/            # 유틸리티
│   ├── icons/            # 아이콘
│   ├── api-client/       # API 클라이언트
│   ├── auth-provider/    # 인증 Provider
│   ├── config/           # 앱 설정
│   └── styles/           # 글로벌 CSS
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## 시작하기

```bash
# 의존성 설치
pnpm install

# 전체 개발 서버
pnpm dev

# web만 실행 (port 3000)
pnpm dev:web

# web_jeju만 실행 (port 3001)
pnpm dev:web-jeju

# 빌드
pnpm build
```

## 기능 모듈 시스템

### 핵심 개념

모든 기능은 `features/` 디렉토리의 독립 패키지로 존재하며, 각 앱의 `src/features.ts`에서 import/등록으로 활성화됩니다.

```typescript
// apps/web/src/features.ts
import chatNew from '@xgen/feature-chat-new';       // ← 활성화
// import agent from '@xgen/feature-agent';          // ← 주석 = 비활성화
```

### 4가지 모듈 타입

| 타입 | 인터페이스 | 용도 | 등록 메서드 |
|------|-----------|------|------------|
| 기능 모듈 | `FeatureModule` | 사이드바 기능, 독립 페이지 | `registry.register()` |
| 캔버스 서브 | `CanvasSubModule` | 캔버스 플러그인 (헤더, 패널, 노드) | `registry.registerCanvasSub()` |
| 관리자 서브 | `AdminSubModule` | 관리 페이지 플러그인 | `registry.registerAdminSub()` |
| 문서 탭 | `DocumentTabConfig` | 문서 페이지 탭 | `registry.registerDocumentTab()` |

### 전체 기능 목록 (57개)

**Chat (4)**
- `chat-intro` — 채팅 인트로
- `chat-new` — 새 대화
- `chat-current` — 현재 대화
- `chat-history` — 대화 이력

**Canvas (10)**
- `canvas-intro` — 캔버스 인트로 + /canvas 페이지
- `canvas-core` — 캔버스 코어 (Provider, Viewport)
- `canvas-node-system` — 노드 시스템
- `canvas-edge-system` — 엣지 시스템
- `canvas-history` — 실행 취소/다시 실행
- `canvas-auto-workflow` — AI 자동 워크플로우
- `canvas-execution` — 실행 패널
- `canvas-side-menu` — 사이드 메뉴 (노드 추가, 워크플로우, 템플릿)
- `canvas-special-nodes` — 특수 노드 (Agent, Router, Schema)
- `canvas-header` — 헤더 (상세 패널, 모달)

**Workflow (3)**
- `workflow-intro` — 워크플로우 인트로
- `workflow-list` — 워크플로우 목록/관리
- `workflow-deploy` — 배포 설정

**Document (4)**
- `document-collection` — 컬렉션 (탭 1)
- `document-filestorage` — 파일 스토리지 (탭 2)
- `document-repository` — 레포지토리 (탭 3)
- `document-database` — 데이터베이스 (탭 4)

**Tools (3)**
- `tool-storage` — 도구 스토어
- `prompt-store` — 프롬프트 스토어
- `auth-profile` — 인증 프로필 카드

**Data (3)**
- `data-intro` — 데이터 인트로
- `data-station` — 데이터 스테이션
- `data-storage` — 데이터 스토리지

**Model (5)**
- `model-intro` — 모델 인트로
- `model-train` — 학습 설정
- `model-monitor` — 학습 모니터링
- `model-eval` — 모델 평가
- `model-storage` — 모델 스토리지

**ML (6)**
- `ml-intro` — ML 인트로
- `ml-upload` — 모델 업로드
- `ml-hub` — 모델 허브
- `ml-inference` — 추론 테스트 (/ml-inference)
- `ml-train` — ML 학습
- `ml-train-monitor` — 학습 모니터링 (/ml-monitoring)

**Support (2)**
- `support-service-request` — 서비스 요청 (/support)
- `support-faq` — FAQ

**Admin (9)**
- `admin-user-management` — 사용자 관리
- `admin-workflow` — 워크플로우 관리
- `admin-settings` — 시스템 설정
- `admin-system-monitor` — 시스템 모니터
- `admin-data` — 데이터 관리
- `admin-security` — 보안 관리
- `admin-mcp` — MCP 관리
- `admin-ml` — ML 모델 관리
- `admin-governance` — AI 거버넌스

**Auth (3)**
- `auth-login` — 로그인 (/login)
- `auth-signup` — 회원가입 (/signup)
- `auth-forgot-password` — 비밀번호 찾기 (/forgot-password)

**기타 (5)**
- `dashboard` — 대시보드
- `agent` — Agent 채팅 (/agent)
- `chatbot` — 독립 챗봇 (/chatbot/[chatId])
- `mypage` — 마이페이지 (/mypage)
- `scenario-recorder` — 시나리오 레코더 (/scenario-recorder)

## web vs web_jeju 차이

| 기능 | web | web_jeju |
|------|:---:|:--------:|
| Chat | ✓ | ✓ |
| Canvas (전체) | ✓ | ✓ (auto-workflow 제외) |
| Document (4탭) | ✓ | ✓ (collection만) |
| ML 모델 (6개) | ✓ | ✗ |
| Admin 고급 (MCP, ML, 거버넌스) | ✓ | ✗ |
| Agent | ✓ | ✗ |
| Scenario Recorder | ✓ | ✗ |

## 새 기능 추가 방법

```bash
# 1. 디렉토리 생성
mkdir -p features/my-feature/src

# 2. package.json 작성
# name: "@xgen/feature-my-feature"

# 3. src/index.ts 에 FeatureModule export

# 4. 앱의 features.ts에 import + register 추가

# 5. 필요 시 앱의 package.json에 의존성 추가
```

## 라이선스

Private — 내부 사용 전용
